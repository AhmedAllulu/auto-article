import { query, withTransaction } from '../db.js';
import { config } from '../config.js';
import { 
  createMasterArticle, 
  generateTranslationArticle, 
  insertArticle, 
  updateDailyTokenUsage, 
  incrementJobCount,
  getCategories 
} from './generation.js';
import { genLog, genError } from './logger.js';

/**
 * Enhanced manual generation service that implements the exact logic specified:
 * - Bypasses all time-based restrictions
 * - Respects daily quotas (2 articles per category)
 * - Automatically translates all generated articles to all supported languages
 * - Provides detailed response with comprehensive status information
 */

const ARTICLES_PER_CATEGORY_PER_DAY = 2;

// Process lock to prevent concurrent generation
let generationInProgress = false;

/**
 * Get all supported languages from config, excluding English
 */
function getSupportedTranslationLanguages() {
  return (config.languages || []).filter(lang => lang !== 'en');
}

/**
 * Get categories that need articles today with detailed counts
 */
async function getCategoriesNeedingArticles() {
  try {
    const categories = await getCategories();
    const categoriesWithCounts = [];
    
    for (const category of categories) {
      // Count today's articles for this category
      const { rows } = await query(
        `SELECT COUNT(*)::int AS count FROM articles_en 
         WHERE category_id = $1 AND published_at::date = CURRENT_DATE`,
        [category.id]
      );
      
      const todayCount = rows[0]?.count || 0;
      const needed = Math.max(0, ARTICLES_PER_CATEGORY_PER_DAY - todayCount);
      
      categoriesWithCounts.push({
        ...category,
        todayCount,
        needed,
        priority: Number(config.priorities?.categories?.[category.slug] || 0)
      });
    }
    
    // Sort by priority (highest first), then by name for consistency
    return categoriesWithCounts.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.name.localeCompare(b.name);
    });
    
  } catch (error) {
    genError('Failed to get categories needing articles', { error: error.message });
    throw error;
  }
}

/**
 * Generate articles for a specific category and translate them with atomic quota checking
 */
async function processCategory(category, supportedLanguages) {
  const startTime = Date.now();
  const result = {
    category: category.slug,
    articlesGenerated: 0,
    translationsCompleted: 0,
    languages: [],
    errors: []
  };

  genLog('Processing category for manual generation', {
    category: category.slug,
    needed: category.needed
  });

  try {
    // Generate the needed articles for this category with atomic quota checking
    for (let i = 0; i < category.needed; i++) {
      try {
        genLog('Generating master article with quota check', {
          category: category.slug,
          articleNumber: i + 1,
          totalNeeded: category.needed
        });

        // ATOMIC QUOTA CHECK: Check quota inside transaction to prevent race conditions
        let masterArticle = null;
        let quotaExceeded = false;

        await withTransaction(async (client) => {
          // Re-check quota inside transaction for atomic operation
          const { rows } = await client.query(
            `SELECT COUNT(*)::int AS count FROM articles_en
             WHERE category_id = $1 AND published_at::date = CURRENT_DATE`,
            [category.id]
          );

          const currentCount = rows[0]?.count || 0;

          if (currentCount >= ARTICLES_PER_CATEGORY_PER_DAY) {
            quotaExceeded = true;
            genLog('Quota already met for category, skipping', {
              category: category.slug,
              currentCount,
              quota: ARTICLES_PER_CATEGORY_PER_DAY
            });
            return;
          }

          // Generate article only if quota not exceeded
          const { masterArticle: generatedArticle } = await createMasterArticle(category, { preferWebSearch: false });
          masterArticle = generatedArticle;

          // Insert article atomically with quota check
          await insertArticle(client, masterArticle);
          await updateDailyTokenUsage(client, [{
            prompt_tokens: masterArticle.ai_tokens_input,
            completion_tokens: masterArticle.ai_tokens_output,
          }]);
          await incrementJobCount(client, 1);
        });

        if (quotaExceeded) {
          genLog('Stopping category processing - quota exceeded', {
            category: category.slug,
            articlesGenerated: result.articlesGenerated
          });
          break; // Stop processing this category
        }

        if (!masterArticle) {
          genError('Master article generation failed', { category: category.slug });
          continue;
        }

        result.articlesGenerated++;
        genLog('Master article generated successfully', {
          slug: masterArticle.slug,
          category: category.slug
        });
        
        // Generate translations for all supported languages
        for (const lang of supportedLanguages) {
          try {
            genLog('Generating translation', { 
              category: category.slug,
              language: lang,
              masterSlug: masterArticle.slug 
            });
            
            const { translationArticle } = await generateTranslationArticle({
              lang,
              category,
              masterSlug: masterArticle.slug,
              masterTitle: masterArticle.title,
              masterSummary: masterArticle.summary,
              imageUrl: masterArticle.image_url,
            });
            
            // Insert translation with transaction
            await withTransaction(async (client) => {
              await insertArticle(client, translationArticle);
              await updateDailyTokenUsage(client, [{
                prompt_tokens: translationArticle.ai_tokens_input,
                completion_tokens: translationArticle.ai_tokens_output,
              }]);
              await incrementJobCount(client, 1);
            });
            
            result.translationsCompleted++;
            if (!result.languages.includes(lang)) {
              result.languages.push(lang);
            }
            
            genLog('Translation completed successfully', { 
              slug: translationArticle.slug,
              language: lang,
              category: category.slug 
            });
            
          } catch (translationError) {
            const errorMsg = `Translation failed for ${lang}: ${translationError.message}`;
            genError(errorMsg, { 
              category: category.slug,
              language: lang,
              masterSlug: masterArticle.slug,
              error: translationError.message 
            }, false);
            result.errors.push(errorMsg);
          }
        }
        
      } catch (articleError) {
        const errorMsg = `Article generation failed: ${articleError.message}`;
        genError(errorMsg, { 
          category: category.slug,
          articleNumber: i + 1,
          error: articleError.message 
        }, false);
        result.errors.push(errorMsg);
      }
    }
    
  } catch (categoryError) {
    const errorMsg = `Category processing failed: ${categoryError.message}`;
    genError(errorMsg, { 
      category: category.slug,
      error: categoryError.message 
    }, false);
    result.errors.push(errorMsg);
  }
  
  const executionTime = Date.now() - startTime;
  genLog('Category processing completed', { 
    category: category.slug,
    articlesGenerated: result.articlesGenerated,
    translationsCompleted: result.translationsCompleted,
    languages: result.languages,
    errors: result.errors.length,
    executionTimeMs: executionTime
  });
  
  return result;
}

/**
 * Main manual generation function that implements the exact specified logic
 *
 * IMPORTANT: This function BYPASSES ALL TIME-BASED RESTRICTIONS
 * - Used by manual Swagger endpoints (POST /generation/run)
 * - Used by individual generation endpoints (POST /generate/article, POST /generate/translate)
 * - Always runs regardless of optimal timing windows
 * - Still respects daily quotas (2 English articles per category per day)
 */
export async function runManualGeneration() {
  const startTime = Date.now();

  // Check if generation is already in progress
  if (generationInProgress) {
    genLog('Manual generation already in progress, skipping');
    return {
      status: 'skipped',
      reason: 'generation_in_progress',
      message: 'Generation already in progress',
      details: {
        categoriesProcessed: [],
        totalArticlesGenerated: 0,
        totalTranslationsCompleted: 0,
        executionTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        skippedReason: 'Another generation process is already running'
      }
    };
  }

  // Set lock
  generationInProgress = true;
  genLog('🚀 Manual generation started - BYPASSING ALL TIME RESTRICTIONS', {
    trigger: 'manual',
    bypassTiming: true,
    currentTime: new Date().toISOString(),
    currentHour: new Date().getHours(),
    currentDay: new Date().getDay()
  });

  try {
    // Get all categories and their current article counts
    const allCategories = await getCategoriesNeedingArticles();
    const categoriesNeedingArticles = allCategories.filter(cat => cat.needed > 0);
    
    // Get supported translation languages
    const supportedLanguages = getSupportedTranslationLanguages();
    
    genLog('Manual generation analysis', {
      totalCategories: allCategories.length,
      categoriesNeedingArticles: categoriesNeedingArticles.length,
      supportedLanguages: supportedLanguages.length,
      languages: supportedLanguages
    });
    
    // If no categories need articles, return completion status
    if (categoriesNeedingArticles.length === 0) {
      const response = {
        status: 'complete',
        message: 'Generation complete for today',
        details: {
          categoriesProcessed: [],
          totalArticlesGenerated: 0,
          totalTranslationsCompleted: 0,
          executionTimeMs: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      };
      
      genLog('Manual generation completed - all quotas met', response.details);
      return response;
    }
    
    // Process each category that needs articles
    const processedCategories = [];
    let totalArticlesGenerated = 0;
    let totalTranslationsCompleted = 0;
    let hasErrors = false;
    
    for (const category of categoriesNeedingArticles) {
      try {
        const categoryResult = await processCategory(category, supportedLanguages);
        processedCategories.push(categoryResult);
        totalArticlesGenerated += categoryResult.articlesGenerated;
        totalTranslationsCompleted += categoryResult.translationsCompleted;
        
        if (categoryResult.errors.length > 0) {
          hasErrors = true;
        }
        
        // Brief pause between categories to avoid overwhelming the system
        if (categoriesNeedingArticles.indexOf(category) < categoriesNeedingArticles.length - 1) {
          genLog('Pausing between categories', { seconds: 5 });
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
      } catch (categoryError) {
        genError('Failed to process category', {
          category: category.slug,
          error: categoryError.message
        }, false);
        
        processedCategories.push({
          category: category.slug,
          articlesGenerated: 0,
          translationsCompleted: 0,
          languages: [],
          errors: [`Category processing failed: ${categoryError.message}`]
        });
        hasErrors = true;
      }
    }
    
    // Prepare final response
    const response = {
      status: hasErrors ? 'partial' : 'complete',
      message: hasErrors 
        ? 'Generation completed with some errors' 
        : 'Generation completed successfully',
      details: {
        categoriesProcessed: processedCategories,
        totalArticlesGenerated,
        totalTranslationsCompleted,
        executionTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    };
    
    genLog('Manual generation completed', {
      status: response.status,
      totalArticlesGenerated,
      totalTranslationsCompleted,
      categoriesProcessed: processedCategories.length,
      executionTimeMs: response.details.executionTimeMs
    });

    return response;

  } catch (error) {
    genError('Manual generation failed', {
      error: error.message,
      stack: error.stack,
      executionTimeMs: Date.now() - startTime
    });

    return {
      status: 'error',
      message: 'Manual generation failed',
      details: {
        categoriesProcessed: [],
        totalArticlesGenerated: 0,
        totalTranslationsCompleted: 0,
        executionTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error.message
      }
    };
  } finally {
    // Always release the lock
    generationInProgress = false;
    genLog('Manual generation lock released');
  }
}

export default { runManualGeneration };
