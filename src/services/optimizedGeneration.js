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
import { genLog, genError, logTranslationProgress, logArticleProgress, cleanupOldLogs } from './logger.js';
import { computePriorityScore, bestMarketForLanguage } from './generation.js';

// Constants for optimal scheduling
const OPTIMAL_GENERATION_HOURS = [6, 7, 8, 9, 10, 11]; // 6 AM - 12 PM
const OPTIMAL_DAYS = [2, 3, 4]; // Tuesday, Wednesday, Thursday
const ARTICLES_PER_CATEGORY_PER_DAY = 2;

/**
 * Check if current time is optimal for article generation
 */
function isOptimalTime() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  return OPTIMAL_GENERATION_HOURS.includes(hour) && OPTIMAL_DAYS.includes(day);
}

/**
 * Get categories that need articles today
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
      
      if (needed > 0) {
        categoriesWithCounts.push({
          ...category,
          todayCount,
          needed,
          priority: Number(config.priorities.categories[category.slug] || 0)
        });
      }
    }
    
    // Sort by priority (highest first), then by need
    return categoriesWithCounts.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return b.needed - a.needed;
    });
    
  } catch (error) {
    genError('Failed to get categories needing articles', { error: error.message });
    return [];
  }
}

/**
 * Generate articles for a single category exactly like the manual generate endpoint
 */
async function processCategory(category) {
  genLog('Starting category processing', { 
    category: category.slug, 
    needed: category.needed,
    priority: category.priority
  });
  
  let generatedCount = 0;
  const translations = [];
  
  try {
    // Generate the needed articles for this category
    for (let i = 0; i < category.needed; i++) {
      logArticleProgress(category, 'master', 'starting');
      
      // EXACT SAME PROCESS AS MANUAL GENERATE ENDPOINT
      // Resolve category (exactly like manual endpoint)
      const catRes = await query('SELECT id, name, slug FROM categories WHERE slug = $1 LIMIT 1', [category.slug]);
      if (catRes.rowCount === 0) {
        genError(`Category not found: ${category.slug}`, { category: category.slug });
        continue;
      }
      const categoryObj = catRes.rows[0];

      // Use createMasterArticle exactly like manual endpoint
      const { masterArticle } = await createMasterArticle(categoryObj, { preferWebSearch: false });
      
      // Insert article & token usage exactly like manual endpoint
      await withTransaction(async (client) => {
        await insertArticle(client, masterArticle);
        await updateDailyTokenUsage(client, [{
          prompt_tokens: masterArticle.ai_tokens_input,
          completion_tokens: masterArticle.ai_tokens_output,
        }]);
        await incrementJobCount(client, 1);
      });
      
      generatedCount++;
      logArticleProgress(category, 'master', 'completed', {
        slug: masterArticle.slug,
        wordCount: masterArticle.word_count
      });
      
      // Prepare translations for this article – but respect overall category cap (masters + translations)
      const remainingSlots = Math.max(0, ARTICLES_PER_CATEGORY_PER_DAY - generatedCount);
      const maxTranslationsThisMaster = Math.min(
        remainingSlots, // ensure we don't exceed category cap
        config.generation.maxTranslationsPerMaster || 0
      );

      const targetLanguages = (maxTranslationsThisMaster > 0)
        ? (config.languages || [])
            .filter(lang => lang !== 'en')
            .map(languageCode => ({
              languageCode,
              score: computePriorityScore({
                categorySlug: category.slug,
                languageCode,
                countryCode: bestMarketForLanguage(languageCode),
              }),
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, maxTranslationsThisMaster)
            .map(x => x.languageCode)
        : [];
 
      // Generate translations concurrently to reduce total processing time
      const translationResults = await Promise.allSettled(
        targetLanguages.map(async (lang) => {
          try {
            logTranslationProgress(category, lang, 'starting');

            // EXACT SAME TRANSLATION PROCESS AS MANUAL GENERATE ENDPOINT
            const { translationArticle } = await generateTranslationArticle({
              lang,
              category: {
                id: categoryObj.id,
                name: categoryObj.name,
                slug: categoryObj.slug,
              },
              masterSlug: masterArticle.slug,
              masterTitle: masterArticle.title,
              masterSummary: masterArticle.summary,
              imageUrl: masterArticle.image_url,
            });

            if (translationArticle) {
              // Insert translation exactly like manual endpoint
              await withTransaction(async (client) => {
                await insertArticle(client, translationArticle);
                await updateDailyTokenUsage(client, [{
                  prompt_tokens: translationArticle.ai_tokens_input,
                  completion_tokens: translationArticle.ai_tokens_output,
                }]);
                await incrementJobCount(client, 1);
              });

              return { lang, slug: translationArticle.slug };
            }

            throw new Error('empty_translation');
          } catch (error) {
            // Allow promise to reject, capturing language information for logging
            throw { lang, message: error.message };
          }
        })
      );

      // Handle results
      for (const res of translationResults) {
        if (res.status === 'fulfilled') {
          const { lang, slug } = res.value;
          generatedCount++;
          translations.push({ lang, slug });
          logTranslationProgress(category, lang, 'completed', { slug });
        } else {
          // res.status === 'rejected'
          const failedLang = res.reason?.lang || 'unknown';
          const message = res.reason?.message || res.reason;
          genError(`Translation failed for ${failedLang}`, {
            category: category.slug,
            language: failedLang,
            error: message,
          }, false);
        }
      }
      
      genLog('Article and translations completed', {
        category: category.slug,
        masterSlug: masterArticle.slug,
        translations: translations.map(t => `${t.lang}: ${t.slug}`)
      });
    }
    
    genLog('Category processing completed', {
      category: category.slug,
      articlesGenerated: category.needed,
      translationsGenerated: translations.length,
      totalGenerated: generatedCount
    });
    
    return generatedCount;
    
  } catch (error) {
    genError(`Category processing failed`, {
      category: category.slug,
      error: error.message,
      generatedCount
    });
    return generatedCount;
  }
}

/**
 * Main optimized generation function
 */
export async function runOptimizedGeneration() {
  genLog('Starting optimized generation batch');
  
  try {
    // Clean up old logs first
    await cleanupOldLogs(10);
    
    // Check if this is optimal timing
    if (!isOptimalTime()) {
      genLog('Skipping generation - not optimal time', {
        currentTime: new Date().toISOString(),
        optimalHours: OPTIMAL_GENERATION_HOURS,
        optimalDays: OPTIMAL_DAYS.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d])
      });
      return { generated: 0, skipped: true, reason: 'not_optimal_time' };
    }
    
    // Get categories that need articles
    const categoriesNeeding = await getCategoriesNeedingArticles();
    
    if (categoriesNeeding.length === 0) {
      genLog('No categories need articles today');
      return { generated: 0, skipped: true, reason: 'quota_met' };
    }
    
    genLog('Categories needing articles', {
      count: categoriesNeeding.length,
      categories: categoriesNeeding.map(c => ({
        slug: c.slug,
        needed: c.needed,
        priority: c.priority
      }))
    });
    
    let totalGenerated = 0;
    let processedCategories = 0;
    
    // Process categories sequentially - complete all translations before moving to next
    for (const category of categoriesNeeding) {
      if (processedCategories >= (config.generation.maxCategoriesPerRun || 3)) {
        genLog('Maximum categories per run reached', {
          maxCategories: config.generation.maxCategoriesPerRun || 3,
          processed: processedCategories
        });
        break;
      }
      
      const generated = await processCategory(category);
      totalGenerated += generated;
      processedCategories++;
      
      // Short pause between categories to avoid rate limits
      if (processedCategories < categoriesNeeding.length) {
        genLog('Pausing between categories', { seconds: 30 });
        await new Promise(resolve => setTimeout(resolve, 30000)); // 30 second pause
      }
    }
    
    genLog('Optimized generation batch completed', {
      totalGenerated,
      processedCategories,
      categoriesRemaining: Math.max(0, categoriesNeeding.length - processedCategories)
    });
    
    return { 
      generated: totalGenerated, 
      processedCategories,
      categoriesRemaining: Math.max(0, categoriesNeeding.length - processedCategories)
    };
    
  } catch (error) {
    genError('Optimized generation batch failed', {
      error: error.message,
      stack: error.stack
    });
    return { generated: 0, error: error.message };
  }
}

/**
 * Health check for generation system
 */
export async function checkGenerationHealth() {
  try {
    const { rows: jobRows } = await query(
      'SELECT * FROM generation_jobs WHERE job_date = CURRENT_DATE LIMIT 1'
    );
    
    const { rows: categoryRows } = await query(
      'SELECT COUNT(*) as total FROM categories'
    );
    
    const { rows: todayRows } = await query(
      'SELECT COUNT(*) as today_total FROM articles_en WHERE published_at::date = CURRENT_DATE'
    );
    
    const health = {
      status: 'healthy',
      currentJob: jobRows[0] || null,
      totalCategories: parseInt(categoryRows[0]?.total || '0'),
      todayTotal: parseInt(todayRows[0]?.today_total || '0'),
      isOptimalTime: isOptimalTime(),
      timestamp: new Date().toISOString()
    };
    
    genLog('Generation health check', health);
    return health;
    
  } catch (error) {
    const health = {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    genError('Generation health check failed', health, false);
    return health;
  }
}

export { isOptimalTime, getCategoriesNeedingArticles, ARTICLES_PER_CATEGORY_PER_DAY };
