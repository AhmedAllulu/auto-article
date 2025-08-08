import cron from 'node-cron';
import { config } from '../config/env.js';
import logger from '../lib/logger.js';
import { getCategoryBySlug, listCategories } from '../models/categoryModel.js';
import { createArticle } from '../models/articleModel.js';
import { recordTokenUsage, getMonthlyTokenUsage } from '../models/tokenUsageModel.js';
import { upsertDailyJobTarget, incrementJobProgress, getJobForDay } from '../models/jobModel.js';
import { generateArticleViaAPI, WRITING_STYLES, AVAILABLE_MODELS } from './aiClient.js';
import { buildMeta, createSlug, estimateReadingTimeMinutes } from '../utils/seo.js';
import { getTrendingTopics } from './trendsService.js';

// Enhanced content strategy configuration
const CONTENT_STRATEGIES = {
  // Primary content types with distribution weights
  'SEO_ARTICLE': { weight: 0.4, complexity: 'medium', audience: 'general web readers' },
  'NEWS_ARTICLE': { weight: 0.25, complexity: 'medium', audience: 'news consumers' },
  'BLOG_POST': { weight: 0.2, complexity: 'low', audience: 'casual readers' },
  'TECHNICAL_GUIDE': { weight: 0.15, complexity: 'high', audience: 'professionals and experts' }
};

// Category-specific content preferences
const CATEGORY_CONTENT_MAP = {
  'technology': {
    preferredTypes: ['TECHNICAL_GUIDE', 'SEO_ARTICLE', 'NEWS_ARTICLE'],
    keywords: ['innovation', 'software', 'digital transformation', 'AI', 'automation'],
    complexity: 'high',
    audience: 'tech professionals and enthusiasts'
  },
  'finance': {
    preferredTypes: ['SEO_ARTICLE', 'NEWS_ARTICLE', 'TECHNICAL_GUIDE'],
    keywords: ['investment', 'market analysis', 'financial planning', 'economics'],
    complexity: 'medium',
    audience: 'investors and financial professionals'
  },
  'health': {
    preferredTypes: ['SEO_ARTICLE', 'BLOG_POST', 'TECHNICAL_GUIDE'],
    keywords: ['wellness', 'nutrition', 'fitness', 'mental health', 'healthcare'],
    complexity: 'medium',
    audience: 'health-conscious individuals'
  },
  'sports': {
    preferredTypes: ['NEWS_ARTICLE', 'SEO_ARTICLE', 'BLOG_POST'],
    keywords: ['performance', 'training', 'competition', 'athletics'],
    complexity: 'low',
    audience: 'sports fans and athletes'
  },
  'entertainment': {
    preferredTypes: ['NEWS_ARTICLE', 'BLOG_POST', 'SEO_ARTICLE'],
    keywords: ['trending', 'celebrity', 'movies', 'music', 'streaming'],
    complexity: 'low',
    audience: 'entertainment enthusiasts'
  },
  'travel': {
    preferredTypes: ['SEO_ARTICLE', 'BLOG_POST', 'TECHNICAL_GUIDE'],
    keywords: ['destinations', 'travel tips', 'culture', 'adventure'],
    complexity: 'medium',
    audience: 'travelers and adventure seekers'
  },
  'business': {
    preferredTypes: ['SEO_ARTICLE', 'TECHNICAL_GUIDE', 'NEWS_ARTICLE'],
    keywords: ['strategy', 'entrepreneurship', 'leadership', 'growth', 'innovation'],
    complexity: 'high',
    audience: 'business professionals and entrepreneurs'
  }
};

// Time-based content strategy (adjust based on time of day/week)
const TIME_BASED_STRATEGY = {
  'morning': { focus: 'NEWS_ARTICLE', urgency: 'high' },
  'afternoon': { focus: 'SEO_ARTICLE', urgency: 'medium' },
  'evening': { focus: 'BLOG_POST', urgency: 'low' },
  'weekend': { focus: 'TECHNICAL_GUIDE', urgency: 'low' }
};

function getYearMonth(d = new Date()) {
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

function todayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function getCurrentTimeContext() {
  const now = new Date();
  const hour = now.getUTCHours();
  const day = now.getUTCDay(); // 0 = Sunday, 6 = Saturday
  
  if (day === 0 || day === 6) return 'weekend';
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}

async function remainingArticlesForToday() {
  const day = todayUTC();
  await upsertDailyJobTarget({ day, target: config.generation.dailyTarget });
  const job = await getJobForDay(day);
  const generated = job?.num_articles_generated || 0;
  return Math.max(0, config.generation.dailyTarget - generated);
}

async function tokensRemainingForMonth() {
  const { year, month } = getYearMonth();
  const used = await getMonthlyTokenUsage(year, month);
  return Math.max(0, config.generation.monthlyTokenCap - used);
}

function selectContentType(category, timeContext = null) {
  const categoryConfig = CATEGORY_CONTENT_MAP[category] || CATEGORY_CONTENT_MAP['technology'];
  const timeConfig = timeContext ? TIME_BASED_STRATEGY[timeContext] : null;
  
  // If we have time-based preference and it's in category's preferred types
  if (timeConfig && categoryConfig.preferredTypes.includes(timeConfig.focus)) {
    return timeConfig.focus;
  }
  
  // Otherwise select from category preferences with weighted randomization
  const weights = categoryConfig.preferredTypes.map(type => 
    CONTENT_STRATEGIES[type]?.weight || 0.1
  );
  
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const random = Math.random() * totalWeight;
  
  let cumulativeWeight = 0;
  for (let i = 0; i < categoryConfig.preferredTypes.length; i++) {
    cumulativeWeight += weights[i];
    if (random <= cumulativeWeight) {
      return categoryConfig.preferredTypes[i];
    }
  }
  
  return categoryConfig.preferredTypes[0] || 'SEO_ARTICLE';
}

function enhanceTopicWithTrends(baseTopic, category, trends = []) {
  // Combine base topic with trending elements for more engaging content
  const categoryConfig = CATEGORY_CONTENT_MAP[category] || CATEGORY_CONTENT_MAP['technology'];
  const relatedTrends = trends.filter(t => t.category === category);
  
  if (relatedTrends.length > 0) {
    const trendingElement = relatedTrends[Math.floor(Math.random() * relatedTrends.length)];
    return `${baseTopic}: ${trendingElement.topic} trends and insights`;
  }
  
  // Add category-specific enhancement
  const randomKeyword = categoryConfig.keywords[Math.floor(Math.random() * categoryConfig.keywords.length)];
  return `${baseTopic}: comprehensive guide to ${randomKeyword}`;
}

async function selectTargets(batchSize) {
  const categories = await listCategories();
  const timeContext = getCurrentTimeContext();
  const targets = [];
  
  logger.info({ timeContext, batchSize }, 'Selecting article targets');
  
  // Get trending topics for context
  const allTrends = [];
  for (const languageCode of config.languages) {
    try {
      const trends = await getTrendingTopics({ languageCode, maxPerCategory: 2 });
      allTrends.push(...trends.map(t => ({ ...t, languageCode })));
    } catch (err) {
      logger.warn({ err, languageCode }, 'Failed to get trends for language');
    }
  }
  
  // Create a balanced distribution across languages and categories
  const languageRotation = [...config.languages];
  const categoryRotation = [...config.topCategories];
  
  for (let i = 0; i < batchSize && (languageRotation.length > 0 || categoryRotation.length > 0); i++) {
    // Rotate through languages and categories for even distribution
    const languageCode = languageRotation[i % languageRotation.length];
    const categorySlug = categoryRotation[i % categoryRotation.length];
    
    const category = categories.find(c => c.slug === categorySlug) || categories[0];
    const categoryConfig = CATEGORY_CONTENT_MAP[categorySlug] || CATEGORY_CONTENT_MAP['technology'];
    
    // Select content type based on category and time
    const contentType = selectContentType(categorySlug, timeContext);
    
    // Get relevant trends for this language/category combination
    const relevantTrends = allTrends.filter(t => 
      t.languageCode === languageCode && t.category === categorySlug
    );
    
    // Create topic based on trends or fallback to category keywords
    let topic;
    if (relevantTrends.length > 0) {
      const selectedTrend = relevantTrends[Math.floor(Math.random() * relevantTrends.length)];
      topic = enhanceTopicWithTrends(selectedTrend.topic, categorySlug, allTrends);
    } else {
      // Fallback to category-based topic generation
      const baseKeywords = categoryConfig.keywords;
      const primaryKeyword = baseKeywords[Math.floor(Math.random() * baseKeywords.length)];
      topic = `${primaryKeyword} in ${category.name}: comprehensive analysis and insights`;
    }
    
    targets.push({
      languageCode,
      categoryId: category.id,
      categoryName: category.name,
      categorySlug,
      topic,
      contentType,
      complexity: categoryConfig.complexity,
      targetAudience: categoryConfig.audience,
      keywords: categoryConfig.keywords.slice(0, 5), // Use top 5 keywords
      timeContext
    });
  }
  
  // Shuffle targets to avoid predictable patterns
  for (let i = targets.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [targets[i], targets[j]] = [targets[j], targets[i]];
  }
  
  logger.info({ 
    targetCount: targets.length,
    contentTypes: targets.map(t => t.contentType),
    languages: targets.map(t => t.languageCode),
    categories: targets.map(t => t.categorySlug)
  }, 'Article targets selected');
  
  return targets.slice(0, batchSize);
}

async function generateOne(target) {
  const startTime = Date.now();
  
  logger.info({
    language: target.languageCode,
    category: target.categorySlug,
    contentType: target.contentType,
    topic: target.topic.slice(0, 50)
  }, 'Starting article generation');

  try {
    // Enhanced article generation with all the new parameters
    const result = await generateArticleViaAPI({
      topic: target.topic,
      languageCode: target.languageCode,
      categoryName: target.categoryName,
      contentType: target.contentType,
      targetAudience: target.targetAudience,
      keywords: target.keywords,
      includeWebSearch: config.generation.enableWebSearch !== false,
      generateImage: config.generation.generateImages === true,
      maxWords: config.generation.maxWordsPerArticle || 2000,
      complexity: target.complexity
    });

    const { 
      title, 
      content, 
      summary, 
      metaDescription, 
      imageUrl, 
      tokensIn, 
      tokensOut, 
      model 
    } = result;

    // Create SEO-optimized slug
    const slug = createSlug(title, target.languageCode);
    
    // Build comprehensive meta data
    const meta = buildMeta({ 
      title, 
      summary: summary || metaDescription, 
      imageUrl, 
      canonicalUrl: null 
    });
    
    // Override with AI-generated meta description if available
    if (metaDescription) {
      meta.metaDescription = metaDescription;
      meta.ogDescription = metaDescription;
      meta.twitterDescription = metaDescription;
    }
    
    const readingTimeMinutes = estimateReadingTimeMinutes(content);

    // Create the article record
    const article = await createArticle({
      title,
      slug,
      content,
      summary: summary || content.slice(0, 300) + '...',
      languageCode: target.languageCode,
      categoryId: target.categoryId,
      imageUrl,
      meta,
      readingTimeMinutes,
      sourceUrl: null,
      aiModel: model,
      aiPrompt: `Content Type: ${target.contentType}, Topic: ${target.topic}`,
      aiTokensInput: tokensIn,
      aiTokensOutput: tokensOut,
    });

    if (article) {
      // Record token usage for monitoring
      await recordTokenUsage({
        day: todayUTC(),
        tokensInput: tokensIn,
        tokensOutput: tokensOut,
      });
      
      const generationTime = Date.now() - startTime;
      
      logger.info({
        articleId: article.id,
        title: title.slice(0, 50),
        model,
        tokensIn,
        tokensOut,
        contentLength: content.length,
        generationTimeMs: generationTime,
        language: target.languageCode,
        category: target.categorySlug,
        contentType: target.contentType
      }, 'Article generated successfully');
    } else {
      logger.warn({
        topic: target.topic.slice(0, 50),
        language: target.languageCode
      }, 'Article creation failed - possible duplicate slug');
    }

    return { 
      article, 
      tokens: (tokensIn || 0) + (tokensOut || 0),
      generationTime: Date.now() - startTime
    };

  } catch (err) {
    const generationTime = Date.now() - startTime;
    
    logger.error({ 
      err: err.message,
      language: target.languageCode, 
      topic: target.topic.slice(0, 50),
      contentType: target.contentType,
      generationTimeMs: generationTime
    }, 'Article generation failed');
    
    return { article: null, tokens: 0, generationTime };
  }
}

export function scheduleArticleGeneration() {
  // Ensure job row exists for today
  upsertDailyJobTarget({ 
    day: todayUTC(), 
    target: config.generation.dailyTarget 
  }).catch(err => {
    logger.error({ err }, 'Failed to create daily job target');
  });

  logger.info({
    schedule: config.generation.schedule,
    dailyTarget: config.generation.dailyTarget,
    monthlyTokenCap: config.generation.monthlyTokenCap,
    maxBatchPerRun: config.generation.maxBatchPerRun
  }, 'Article generation scheduler started');

  cron.schedule(config.generation.schedule, async () => {
    const runStartTime = Date.now();
    
    try {
      logger.info('Starting scheduled article generation run');
      
      // Check remaining articles for today
      const remainingArticles = await remainingArticlesForToday();
      if (remainingArticles <= 0) {
        logger.info({ 
          dailyTarget: config.generation.dailyTarget 
        }, 'Daily target reached; skipping run');
        return;
      }

      // Check token budget
      const tokensLeft = await tokensRemainingForMonth();
      if (tokensLeft <= 0) {
        logger.warn({ 
          monthlyTokenCap: config.generation.monthlyTokenCap 
        }, 'Monthly token cap reached; skipping');
        return;
      }

      // Estimate how many articles we can generate with remaining tokens
      // More sophisticated estimation based on content type and language
      const averageTokensPerArticle = config.generation.estimatedTokensPerArticle || 3000;
      const maxByTokens = Math.floor(tokensLeft / averageTokensPerArticle);
      
      if (maxByTokens <= 0) {
        logger.info({ 
          tokensLeft, 
          averageTokensPerArticle 
        }, 'Not enough tokens for a safe article; skipping run');
        return;
      }

      // Calculate optimal batch size
      const plannedBatch = Math.min(
        config.generation.maxBatchPerRun,
        remainingArticles,
        maxByTokens
      );

      logger.info({
        remainingArticles,
        tokensLeft,
        maxByTokens,
        plannedBatch
      }, 'Starting generation batch');

      // Select targets using enhanced strategy
      const targets = await selectTargets(plannedBatch);
      
      let generated = 0;
      let failed = 0;
      let tokensSpent = 0;
      const generationStats = {
        byLanguage: {},
        byCategory: {},
        byContentType: {},
        totalGenerationTime: 0
      };

      // Process articles with better error handling and stats tracking
      for (const target of targets) {
        if (tokensSpent >= tokensLeft) {
          logger.warn('Token budget exhausted, stopping batch');
          break;
        }

        const { article, tokens, generationTime } = await generateOne(target);
        
        // Update statistics
        generationStats.totalGenerationTime += generationTime;
        
        if (article) {
          generated += 1;
          tokensSpent += tokens;
          
          // Track stats by dimensions
          generationStats.byLanguage[target.languageCode] = 
            (generationStats.byLanguage[target.languageCode] || 0) + 1;
          generationStats.byCategory[target.categorySlug] = 
            (generationStats.byCategory[target.categorySlug] || 0) + 1;
          generationStats.byContentType[target.contentType] = 
            (generationStats.byContentType[target.contentType] || 0) + 1;
        } else {
          failed += 1;
        }

        // Small delay between requests to avoid rate limiting
        if (targets.indexOf(target) < targets.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Update job progress
      if (generated > 0) {
        await incrementJobProgress({ day: todayUTC(), count: generated });
      }

      const runTime = Date.now() - runStartTime;
      
      logger.info({
        generated,
        failed,
        tokensSpent,
        plannedBatch,
        runTimeMs: runTime,
        averageGenerationTimeMs: Math.round(generationStats.totalGenerationTime / targets.length),
        stats: generationStats
      }, 'Generation run completed');

    } catch (err) {
      const runTime = Date.now() - runStartTime;
      logger.error({ 
        err: err.message,
        runTimeMs: runTime
      }, 'Generation run failed');
    }
  });
}

// Utility function to manually trigger generation (useful for testing)
export async function triggerManualGeneration(options = {}) {
  const {
    batchSize = 1,
    specificLanguage = null,
    specificCategory = null,
    contentType = null
  } = options;
  
  logger.info({ options }, 'Manual generation triggered');
  
  try {
    let targets;
    
    if (specificLanguage && specificCategory) {
      // Generate specific target
      const categories = await listCategories();
      const category = categories.find(c => c.slug === specificCategory);
      
      if (!category) {
        throw new Error(`Category not found: ${specificCategory}`);
      }
      
      const categoryConfig = CATEGORY_CONTENT_MAP[specificCategory] || CATEGORY_CONTENT_MAP['technology'];
      const selectedContentType = contentType || selectContentType(specificCategory);
      
      targets = [{
        languageCode: specificLanguage,
        categoryId: category.id,
        categoryName: category.name,
        categorySlug: specificCategory,
        topic: `Manual generation: ${categoryConfig.keywords[0]} insights and analysis`,
        contentType: selectedContentType,
        complexity: categoryConfig.complexity,
        targetAudience: categoryConfig.audience,
        keywords: categoryConfig.keywords.slice(0, 3),
        timeContext: getCurrentTimeContext()
      }];
    } else {
      // Use regular target selection
      targets = await selectTargets(batchSize);
    }
    
    const results = [];
    for (const target of targets) {
      const result = await generateOne(target);
      results.push(result);
    }
    
    const successful = results.filter(r => r.article).length;
    const totalTokens = results.reduce((sum, r) => sum + r.tokens, 0);
    
    logger.info({
      requested: batchSize,
      successful,
      totalTokens,
      results: results.map(r => ({
        success: !!r.article,
        title: r.article?.title?.slice(0, 50),
        tokens: r.tokens
      }))
    }, 'Manual generation completed');
    
    return results;
    
  } catch (err) {
    logger.error({ err, options }, 'Manual generation failed');
    throw err;
  }
}

export { CONTENT_STRATEGIES, CATEGORY_CONTENT_MAP, TIME_BASED_STRATEGY };