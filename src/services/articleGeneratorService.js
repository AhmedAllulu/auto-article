import cron from 'node-cron';
import { config } from '../config/env.js';
import logger from '../lib/logger.js';
import { listCategories } from '../models/categoryModel.js';
import { createArticle } from '../models/articleModel.js';
import { recordTokenUsage, getMonthlyTokenUsage } from '../models/tokenUsageModel.js';
import { upsertDailyJobTarget, incrementJobProgress, getJobForDay } from '../models/jobModel.js';
import { generateArticleViaAPI, translateArticleViaAPI } from './aiClient.js';
import { buildMeta, createSlug, estimateReadingTimeMinutes } from '../utils/seo.js';
import { discoverTrendingTopicsWithAI } from './trendsService.js';
import { canRunOperation } from './budgetMonitorService.js';
import { withLock } from './persistentLockService.js';
import { initQueue, resetQueue, getQueueSnapshot, peekNextItem, commitIndex, isForToday } from './persistentQueueService.js';
import { getTrendsWithResilience } from './trendsFacadeService.js';
import { config as appConfig } from '../config/env.js';
import { getAdjustedEstimate, updateEstimate } from './budgetLearningService.js';
import { startCacheMaintenance } from './cacheMaintenanceService.js';

// Same profitability strategy (keeping existing business logic)
const PROFITABILITY_STRATEGY = {
  LANGUAGE_DISTRIBUTION: {
    'en': { percentage: 35, priority: 1, avgRPM: 15.50, categories: ['technology', 'finance', 'business'] },
    'de': { percentage: 20, priority: 2, avgRPM: 12.80, categories: ['technology', 'finance', 'business', 'health'] },
    'fr': { percentage: 15, priority: 3, avgRPM: 9.40, categories: ['technology', 'business', 'travel', 'health'] },
    'es': { percentage: 12, priority: 4, avgRPM: 7.20, categories: ['technology', 'health', 'sports', 'entertainment'] },
    'pt': { percentage: 8, priority: 5, avgRPM: 5.60, categories: ['health', 'sports', 'entertainment', 'travel'] },
    'ar': { percentage: 6, priority: 6, avgRPM: 4.80, categories: ['technology', 'business', 'health'] },
    'hi': { percentage: 4, priority: 7, avgRPM: 3.20, categories: ['technology', 'health', 'entertainment'] }
  },

  CATEGORY_DISTRIBUTION: {
    'technology': { percentage: 25, priority: 1, avgRPM: 18.20 },
    'finance': { percentage: 20, priority: 2, avgRPM: 16.80 },
    'business': { percentage: 15, priority: 3, avgRPM: 14.50 },
    'health': { percentage: 15, priority: 4, avgRPM: 12.30 },
    'travel': { percentage: 10, priority: 5, avgRPM: 8.90 },
    'sports': { percentage: 8, priority: 6, avgRPM: 7.60 },
    'entertainment': { percentage: 7, priority: 7, avgRPM: 6.40 }
  }
};

const ENHANCED_CONTENT_STRATEGIES = {
  'HIGH_VALUE_SEO': { weight: 0.45, complexity: 'high', audience: 'professionals and decision makers', avgTokens: 2800 },
  'TRENDING_NEWS': { weight: 0.25, complexity: 'medium', audience: 'general readers seeking current info', avgTokens: 2200 },
  'PRACTICAL_GUIDE': { weight: 0.20, complexity: 'medium', audience: 'users seeking solutions', avgTokens: 2400 },
  'QUICK_INSIGHTS': { weight: 0.10, complexity: 'low', audience: 'casual browsers', avgTokens: 1800 }
};

function getYearMonth(d = new Date()) {
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

function todayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

async function calculateTokenBudget() {
  const { year, month } = getYearMonth();
  const usedTokens = await getMonthlyTokenUsage(year, month);
  const monthlyLimit = config.generation.monthlyTokenCap;
  const remainingTokens = Math.max(0, monthlyLimit - usedTokens);

  // فرض ميزانية يومية ثابتة: شهري/30 بغض النظر عن الأيام المتبقية
  const fixedDailyBudget = Math.floor(monthlyLimit / 30);

  // احتفظ بإرجاع الحقول المتوقعة لباقي المنظومة
  const now = new Date();
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const currentDay = now.getUTCDate();
  const daysRemaining = Math.max(1, lastDayOfMonth - currentDay + 1);

  return {
    totalRemaining: remainingTokens,
    daysRemaining,
    dailyBudget: fixedDailyBudget,
    usedTokens,
    monthlyLimit,
    utilizationRate: (usedTokens / monthlyLimit) * 100
  };
}

async function remainingArticlesForToday() {
  const day = todayUTC();
  await upsertDailyJobTarget({ day, target: config.generation.dailyTarget });
  const job = await getJobForDay(day);
  const generated = job?.num_articles_generated || 0;
  return Math.max(0, config.generation.dailyTarget - generated);
}

function calculateOptimalDistribution(totalArticles, tokenBudget) {
  const distribution = { byLanguage: {}, byCategory: {}, byContentType: {}, totalEstimatedTokens: 0 };
  
  Object.entries(PROFITABILITY_STRATEGY.LANGUAGE_DISTRIBUTION).forEach(([lang, config]) => {
    const articleCount = Math.floor((totalArticles * config.percentage) / 100);
    distribution.byLanguage[lang] = articleCount;
  });
  
  Object.entries(PROFITABILITY_STRATEGY.CATEGORY_DISTRIBUTION).forEach(([category, config]) => {
    const articleCount = Math.floor((totalArticles * config.percentage) / 100);
    distribution.byCategory[category] = articleCount;
  });
  
  Object.entries(ENHANCED_CONTENT_STRATEGIES).forEach(([contentType, config]) => {
    const articleCount = Math.floor((totalArticles * config.weight) / 100);
    distribution.byContentType[contentType] = articleCount;
    distribution.totalEstimatedTokens += articleCount * config.avgTokens;
  });
  
  if (distribution.totalEstimatedTokens > tokenBudget.dailyBudget) {
    const scalingFactor = tokenBudget.dailyBudget / distribution.totalEstimatedTokens;
    Object.keys(distribution.byLanguage).forEach(lang => {
      distribution.byLanguage[lang] = Math.floor(distribution.byLanguage[lang] * scalingFactor);
    });
    Object.keys(distribution.byCategory).forEach(category => {
      distribution.byCategory[category] = Math.floor(distribution.byCategory[category] * scalingFactor);
    });
  }
  
  return distribution;
}

// **SIMPLIFIED: AI-powered trends selection (no complex scheduling!)**
async function selectProfitableTargetsWithAI(plannedDistribution) {
  const targets = [];
  const categories = await listCategories();
  
  logger.info('Starting AI-powered profitable targets selection');
  
  // Skip external trend discovery entirely if disabled; fall back to generic topics
  const languageEntries = Object.entries(plannedDistribution.byLanguage)
    .filter(([_, count]) => count > 0)
    .sort(([, a], [, b]) => b - a); // Sort by article count (priority languages first)
  
  // Process languages one by one (can be parallel if needed)
  const aiTrendsByLanguage = {};
  
  for (const [languageCode, targetCount] of languageEntries) {
    if (targetCount === 0) continue;
    
    if (!appConfig.features?.enableTrendDiscovery) {
      aiTrendsByLanguage[languageCode] = [];
      continue;
    }
    logger.info({ languageCode, targetCount }, 'Discovering AI trends for language');
    try {
      const langConfig = PROFITABILITY_STRATEGY.LANGUAGE_DISTRIBUTION[languageCode];
      const aiTrends = await getTrendsWithResilience({ languageCode, maxPerCategory: 3, categories: langConfig.categories });
      aiTrendsByLanguage[languageCode] = aiTrends;
      logger.info({ languageCode, aiTrendsCount: aiTrends.length }, 'AI trends discovered successfully');
    } catch {
      aiTrendsByLanguage[languageCode] = [];
    }
  }
  
  // **GENERATE TARGETS: Mix AI trends with traditional topics**
  for (const [languageCode, targetCount] of languageEntries) {
    const langConfig = PROFITABILITY_STRATEGY.LANGUAGE_DISTRIBUTION[languageCode];
    const aiTrends = aiTrendsByLanguage[languageCode] || [];
    
    for (let i = 0; i < targetCount; i++) {
      const availableCategories = langConfig.categories;
      const categorySlug = availableCategories[i % availableCategories.length];
      const category = categories.find(c => c.slug === categorySlug);
      
      if (!category) continue;
      
      // Always derive topic without external trend discovery (prompt instructs AI to include current trends)
      let topic, contentType, trendBased = false;
      const catPriority = PROFITABILITY_STRATEGY.CATEGORY_DISTRIBUTION[categorySlug]?.priority || 5;
      const profitableKeywords = {
        'technology': ['AI automation', 'cloud security', 'digital transformation', 'software development'],
        'finance': ['investment strategies', 'financial planning', 'cryptocurrency analysis', 'market trends'],
        'business': ['business growth', 'startup success', 'marketing automation', 'leadership'],
        'health': ['wellness tips', 'nutrition guide', 'fitness routine', 'mental health'],
        'travel': ['travel destinations', 'budget travel', 'travel safety', 'local culture'],
        'sports': ['training methods', 'sports nutrition', 'athletic performance', 'sports news'],
        'entertainment': ['celebrity news', 'movie reviews', 'music trends', 'gaming']
      };
      const keywords = profitableKeywords[categorySlug] || ['general guide'];
      const selectedKeyword = keywords[Math.floor(Math.random() * keywords.length)];
      topic = `Most trending ${categorySlug}: ${selectedKeyword}`;
      contentType = catPriority <= 3 ? 'HIGH_VALUE_SEO' : 'PRACTICAL_GUIDE';
      
      const categoryPriority = catPriority;
      const complexity = catPriority <= 2 ? 'high' : catPriority <= 4 ? 'medium' : 'low';
      
      targets.push({
        languageCode,
        categoryId: category.id,
        categoryName: category.name,
        categorySlug,
        topic,
        contentType,
        complexity,
        targetAudience: ENHANCED_CONTENT_STRATEGIES[contentType]?.audience || 'general readers',
        keywords: [],
        priority: langConfig.priority + (categoryPriority * 0.1),
        estimatedTokens: ENHANCED_CONTENT_STRATEGIES[contentType]?.avgTokens || 2200,
        profitabilityScore: langConfig.avgRPM * (6 - categoryPriority),
        trendBased,
        aiPowered: trendBased, // Mark AI-powered articles
        useWebSearch: false // rely on prompt to include current trends; avoid extra web search cost
      });
    }
  }
  
  // Sort by profitability
  targets.sort((a, b) => b.profitabilityScore - a.profitabilityScore);
  
  logger.info({
    totalTargets: targets.length,
    aiPoweredCount: targets.filter(t => t.aiPowered).length,
    traditionalCount: targets.filter(t => !t.aiPowered).length,
    avgProfitabilityScore: targets.reduce((sum, t) => sum + t.profitabilityScore, 0) / targets.length,
    languageDistribution: Object.fromEntries(languageEntries.filter(([_, count]) => count > 0))
  }, 'AI-powered profitable targets selection completed');
  
  return targets;
}

// Same generateOne function with AI enhancement
async function generateOne(target, monthlyTokensUsed = 0) {
  const startTime = Date.now();
  
  logger.info({
    language: target.languageCode,
    category: target.categorySlug,
    contentType: target.contentType,
    topic: target.topic.slice(0, 50),
    profitabilityScore: target.profitabilityScore,
    aiPowered: target.aiPowered,
    useWebSearch: target.useWebSearch
  }, 'Starting AI-enhanced profitable article generation');

  try {
    const plannedMaxWords = target.complexity === 'high' ? 1500 : target.complexity === 'medium' ? 1200 : 1000;
    const baseEstimate = target.complexity === 'high' ? 2400 : target.complexity === 'medium' ? 1900 : 1600;
    const estimatedTokensForArticle = await getAdjustedEstimate(target.contentType, target.languageCode, baseEstimate);

    const permission = await canRunOperation(estimatedTokensForArticle);
    if (!permission.allowed) {
      logger.warn({ reason: permission.reason, estimatedTokensForArticle }, 'Skipping article due to budget constraints');
      return { article: null, tokens: 0, generationTime: Date.now() - startTime, estimatedCost: 0, profitabilityScore: 0 };
    }

    const result = await generateArticleViaAPI({
      topic: target.topic,
      languageCode: target.languageCode,
      categoryName: target.categoryName,
      categorySlug: target.categorySlug,
      contentType: target.contentType,
      targetAudience: target.targetAudience,
      keywords: target.keywords,
      includeWebSearch: target.useWebSearch, // **KEY: AI trends get web search**
      generateImage: false,
      maxWords: plannedMaxWords,
      complexity: target.complexity,
      monthlyTokensUsed
    });

    const { title, content, summary, metaDescription, imageUrl, tokensIn, tokensOut, model, estimatedCost } = result;

    const slug = createSlug(title, target.languageCode);
    const meta = buildMeta({ 
      title, 
      summary: summary || metaDescription, 
      imageUrl: null,
      canonicalUrl: null 
    });
    
    if (metaDescription) {
      meta.metaDescription = metaDescription;
      meta.ogDescription = metaDescription;
      meta.twitterDescription = metaDescription;
    }
    
    const readingTimeMinutes = estimateReadingTimeMinutes(content);

    const article = await createArticle({
      title,
      slug,
      content,
      summary: summary || content.slice(0, 300) + '...',
      languageCode: target.languageCode,
      categoryId: target.categoryId,
      imageUrl: null,
      meta,
      readingTimeMinutes,
      sourceUrl: null,
      aiModel: model,
      aiPrompt: `Type: ${target.contentType}, Topic: ${target.topic}, AI-Powered: ${target.aiPowered}`,
      aiTokensInput: tokensIn,
      aiTokensOutput: tokensOut,
    });

    if (article) {
      // Ensure a daily job exists, then increment progress for ANY successful generation (scheduler or manual)
      try {
        await upsertDailyJobTarget({ day: todayUTC(), target: config.generation.dailyTarget });
        await incrementJobProgress({ day: todayUTC(), count: 1 });
      } catch (err) {
        logger.warn({ err }, 'Failed to persist generation progress');
      }

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
        estimatedCost,
        contentLength: content.length,
        generationTimeMs: generationTime,
        language: target.languageCode,
        category: target.categorySlug,
        contentType: target.contentType,
        profitabilityScore: target.profitabilityScore,
        aiPowered: target.aiPowered,
        webSearchUsed: target.useWebSearch
      }, 'AI-enhanced profitable article generated successfully');
    }

    const ret = { 
      article, 
      tokens: (tokensIn || 0) + (tokensOut || 0),
      generationTime: Date.now() - startTime,
      estimatedCost,
      profitabilityScore: target.profitabilityScore
    };
    try { await updateEstimate(target.contentType, target.languageCode, estimatedTokensForArticle, ret.tokens); } catch {}
    return ret;

  } catch (err) {
    const generationTime = Date.now() - startTime;
    
    logger.error({ 
      err: err.message,
      language: target.languageCode, 
      topic: target.topic.slice(0, 50),
      contentType: target.contentType,
      generationTimeMs: generationTime,
      profitabilityScore: target.profitabilityScore,
      aiPowered: target.aiPowered
    }, 'AI-enhanced profitable article generation failed');
    
    return { 
      article: null, 
      tokens: 0, 
      generationTime,
      estimatedCost: 0,
      profitabilityScore: 0
    };
  }
}

// **SIMPLIFIED: Much cleaner scheduler**
export function scheduleArticleGeneration() {
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
    maxBatchPerRun: config.generation.maxBatchPerRun,
    aiPoweredTrends: 'enabled',
    webSearchIntegration: 'enabled'
  }, 'AI-enhanced profitable article generation scheduler started');
  startCacheMaintenance();

  const task = cron.schedule(config.generation.schedule, async () => {
    const runStartTime = Date.now();
    
    try {
      logger.info('Starting AI-enhanced profitable article generation run');
      await initQueue();
      const { skipped } = await withLock('generation-runner', async () => {
        const tokenBudget = await calculateTokenBudget();
        const remainingArticles = await remainingArticlesForToday();
        
        logger.info({ tokenBudget, remainingArticles }, 'Budget and targets calculated');
        
        if (remainingArticles <= 0) {
          logger.info('Daily target reached; skipping run');
          return;
        }
        
        if (tokenBudget.totalRemaining <= 0) {
          logger.warn({ 
            monthlyTokenCap: config.generation.monthlyTokenCap,
            utilizationRate: tokenBudget.utilizationRate
          }, 'Monthly token cap reached; skipping');
          return;
        }
        
        const maxByTokens = Math.floor(tokenBudget.dailyBudget / 2500);
        if (maxByTokens <= 0) {
          logger.info({ dailyBudget: tokenBudget.dailyBudget }, 'Insufficient daily token budget; skipping run');
          return;
        }
        
        const plannedBatch = Math.min(config.generation.maxBatchPerRun, remainingArticles, maxByTokens);

        const snapshot = await getQueueSnapshot();
        const forToday = await isForToday();
        const pending = Math.max(0, snapshot.items.length - snapshot.cursor);
        if (!forToday || pending === 0) {
          const distribution = calculateOptimalDistribution(plannedBatch, tokenBudget);
          const targets = await selectProfitableTargetsWithAI(distribution);
          if (targets.length === 0) {
            logger.warn('No AI-enhanced targets generated');
            return;
          }
          await resetQueue(targets.slice(0, plannedBatch));
        } else {
          logger.info({ pending }, 'Resuming from persisted queue');
        }

        let generated = 0;
        let failed = 0;
        let tokensSpent = 0;
        let totalProfitabilityScore = 0;
        const generationStats = {
          byLanguage: {},
          byCategory: {},
          byContentType: {},
          aiPoweredCount: 0,
          webSearchUsedCount: 0,
          totalGenerationTime: 0,
          avgCostPerArticle: 0
        };

        while (generated + failed < plannedBatch) {
          const peek = await peekNextItem();
          if (peek.done) break;

          const currentUsage = await getMonthlyTokenUsage(getYearMonth().year, getYearMonth().month);
          if (currentUsage + tokensSpent >= config.generation.monthlyTokenCap) {
            logger.warn('Monthly token budget exhausted during batch, stopping');
            break;
          }

          const target = peek.value;
          const { article, tokens, generationTime, estimatedCost, profitabilityScore } = await generateOne(target, currentUsage + tokensSpent);
          generationStats.totalGenerationTime += generationTime;

          if (article) {
            generated += 1;
            tokensSpent += tokens;
            totalProfitabilityScore += profitabilityScore;
            generationStats.byLanguage[target.languageCode] = (generationStats.byLanguage[target.languageCode] || 0) + 1;
            generationStats.byCategory[target.categorySlug] = (generationStats.byCategory[target.categorySlug] || 0) + 1;
            generationStats.byContentType[target.contentType] = (generationStats.byContentType[target.contentType] || 0) + 1;
            if (target.aiPowered) generationStats.aiPoweredCount += 1;
            if (target.useWebSearch) generationStats.webSearchUsedCount += 1;
            generationStats.avgCostPerArticle += estimatedCost;
            await commitIndex(peek.index);
          } else {
            failed += 1;
            await commitIndex(peek.index); // prevent infinite retry on hard failures
          }

          await new Promise(resolve => setTimeout(resolve, 1500));
        }

        const runTime = Date.now() - runStartTime;
        const avgProfitabilityScore = generated > 0 ? totalProfitabilityScore / generated : 0;
        generationStats.avgCostPerArticle = generated > 0 ? generationStats.avgCostPerArticle / generated : 0;

        logger.info({
          generated,
          failed,
          tokensSpent,
          plannedBatch,
          runTimeMs: runTime,
          averageGenerationTimeMs: generationStats.totalGenerationTime / Math.max(1, generated + failed),
          avgProfitabilityScore,
          aiPoweredRate: generated > 0 ? (generationStats.aiPoweredCount / generated) * 100 : 0,
          webSearchRate: generated > 0 ? (generationStats.webSearchUsedCount / generated) * 100 : 0,
          stats: generationStats,
          updatedTokenBudget: {
            remaining: tokenBudget.totalRemaining - tokensSpent,
            utilizationRate: ((tokenBudget.usedTokens + tokensSpent) / config.generation.monthlyTokenCap) * 100
          },
          approach: 'ai-powered-simplified-resumable'
        }, 'AI-enhanced profitable generation run completed');
      });
      if (skipped) {
        logger.warn('Another generation run is in progress; skipping this tick');
      }

    } catch (err) {
      const runTime = Date.now() - runStartTime;
      logger.error({ 
        err: err.message,
        runTimeMs: runTime
      }, 'AI-enhanced profitable generation run failed');
    }
  });

  return task;
}

// Master + Translation workflow (7 masters in EN with web search → translate to other langs)
export function scheduleMasterTranslationGeneration() {
  logger.info('Starting Master+Translation generation scheduler');

  const task = cron.schedule(config.generation.schedule, async () => {
    const runStartTime = Date.now();
    try {
      logger.info('Master+Translation run started');

      const categories = await listCategories();
      const topCategorySlugs = config.topCategories || [];
      const targetCategories = categories.filter(c => topCategorySlugs.includes(c.slug));

      const allLanguages = config.languages || ['en'];
      const targetLanguages = allLanguages.filter(l => l !== 'en');

      // Phase 1: Generate one master article per category in English with web search (topic via AI trends)
      const masterResults = [];
      for (const category of targetCategories) {
        const permission = await canRunOperation(2400);
        if (!permission.allowed) {
          logger.warn({ category: category.slug }, 'Skipping master due to budget constraints');
          continue;
        }

        // Use AI to pick a strong trending topic for the master article
        let masterTopic = `Most impactful ${category.slug} insight this week for professionals`;
        try {
          const aiTrends = await discoverTrendingTopicsWithAI({ languageCode: 'en', maxPerCategory: 3, categories: [category.slug] });
          const relevant = aiTrends.filter(t => t.category === category.slug);
          if (relevant.length > 0) {
            masterTopic = relevant[0].topic;
          }
        } catch (err) {
          logger.warn({ err, category: category.slug }, 'AI trends fetch failed for master topic, using fallback');
        }
        const result = await generateArticleViaAPI({
          topic: masterTopic,
          languageCode: 'en',
          categoryName: category.name,
          categorySlug: category.slug,
          contentType: 'HIGH_VALUE_SEO',
          targetAudience: 'professionals and decision makers',
          keywords: [],
          includeWebSearch: true, // expensive only for masters
          generateImage: false,
          maxWords: 1500,
          complexity: 'high',
        });

        const masterMeta = buildMeta({
          title: result.title,
          summary: result.summary || result.metaDescription,
          imageUrl: null,
          canonicalUrl: null
        });

        if (result.metaDescription) {
          masterMeta.metaDescription = result.metaDescription;
          masterMeta.ogDescription = result.metaDescription;
          masterMeta.twitterDescription = result.metaDescription;
        }

        const masterSlug = createSlug(result.title, 'en');
        const masterReadingTime = estimateReadingTimeMinutes(result.content);
        const masterArticle = await createArticle({
          title: result.title,
          slug: masterSlug,
          content: result.content,
          summary: result.summary || result.content.slice(0, 300) + '...',
          languageCode: 'en',
          categoryId: category.id,
          imageUrl: null,
          meta: masterMeta,
          readingTimeMinutes: masterReadingTime,
          sourceUrl: null,
          aiModel: result.model,
          aiPrompt: `MASTER_HIGH_VALUE_SEO:${category.slug}`,
          aiTokensInput: result.tokensIn,
          aiTokensOutput: result.tokensOut,
        });

        if (masterArticle) {
          try {
            await upsertDailyJobTarget({ day: todayUTC(), target: config.generation.dailyTarget });
            await incrementJobProgress({ day: todayUTC(), count: 1 });
          } catch (err) {
            logger.warn({ err }, 'Failed to persist master generation progress');
          }
          await recordTokenUsage({ day: todayUTC(), tokensInput: result.tokensIn, tokensOutput: result.tokensOut });
        }

        masterResults.push({ category, result, article: masterArticle });
        await new Promise(r => setTimeout(r, 1500));
      }

      // Phase 2: Translate each master to remaining languages (no web search)
      for (const master of masterResults) {
        if (!master.article) continue;
        const { category, result } = master;
        for (const lang of targetLanguages) {
          const permission = await canRunOperation(1200);
          if (!permission.allowed) {
            logger.warn({ lang, category: category.slug }, 'Skipping translation due to budget constraints');
            continue;
          }

          const t = await translateArticleViaAPI({
            masterTitle: result.title,
            masterContent: result.content,
            targetLanguage: lang,
            maxWords: 1500,
          });

          const meta = buildMeta({
            title: t.title,
            summary: t.summary || t.metaDescription,
            imageUrl: null,
            canonicalUrl: null
          });
          if (t.metaDescription) {
            meta.metaDescription = t.metaDescription;
            meta.ogDescription = t.metaDescription;
            meta.twitterDescription = t.metaDescription;
          }

          const slug = createSlug(t.title, lang);
          const readingTimeMinutes = estimateReadingTimeMinutes(t.content);
          const article = await createArticle({
            title: t.title,
            slug,
            content: t.content,
            summary: t.summary || t.content.slice(0, 300) + '...',
            languageCode: lang,
            categoryId: category.id,
            imageUrl: null,
            meta,
            readingTimeMinutes,
            sourceUrl: null,
            aiModel: t.model,
            aiPrompt: `TRANSLATION_OF:${master.article.slug}`,
            aiTokensInput: t.tokensIn,
            aiTokensOutput: t.tokensOut,
          });

          if (article) {
            try {
              await upsertDailyJobTarget({ day: todayUTC(), target: config.generation.dailyTarget });
              await incrementJobProgress({ day: todayUTC(), count: 1 });
            } catch (err) {
              logger.warn({ err }, 'Failed to persist translation progress');
            }
            await recordTokenUsage({ day: todayUTC(), tokensInput: t.tokensIn, tokensOutput: t.tokensOut });
          }

          await new Promise(r => setTimeout(r, 500));
        }
      }

      const runTime = Date.now() - runStartTime;
      logger.info({ masters: masterResults.length, runTimeMs: runTime }, 'Master+Translation run completed');

    } catch (err) {
      const runTime = Date.now() - runStartTime;
      logger.error({ err: err.message, runTimeMs: runTime }, 'Master+Translation run failed');
    }
  });

  return task;
}

// Enhanced manual generation
export async function triggerProfitableGeneration(options = {}) {
  const {
    batchSize = 5,
    forceHighValue = false,
    specificLanguages = null,
    specificCategories = null,
    forceAITrends = true // **NEW: Force AI trends**
  } = options;
  
  logger.info({ options }, 'Manual AI-enhanced profitable generation triggered');
  
  try {
    const tokenBudget = await calculateTokenBudget();
    
    if (tokenBudget.totalRemaining <= 0) {
      throw new Error('Monthly token budget exhausted');
    }
    
    let distribution;
    if (specificLanguages || specificCategories) {
      distribution = { byLanguage: {}, byCategory: {}, byContentType: {} };
      
      if (specificLanguages) {
        specificLanguages.forEach(lang => {
          distribution.byLanguage[lang] = Math.ceil(batchSize / specificLanguages.length);
        });
      }
      
      if (specificCategories) {
        specificCategories.forEach(cat => {
          distribution.byCategory[cat] = Math.ceil(batchSize / specificCategories.length);
        });
      }
    } else {
      distribution = calculateOptimalDistribution(batchSize, tokenBudget);
    }
    
    const targets = await selectProfitableTargetsWithAI(distribution);
    
    if (forceHighValue) {
      targets.forEach(target => {
        target.contentType = 'HIGH_VALUE_SEO';
        target.complexity = 'high';
        target.estimatedTokens = 2800;
      });
    }
    
    if (forceAITrends) {
      targets.forEach(target => {
        target.useWebSearch = true; // Force web search for manual generation
      });
    }
    
    const results = [];
    for (const target of targets.slice(0, batchSize)) {
      const result = await generateOne(target, tokenBudget.usedTokens);
      results.push(result);
    }
    
    const successful = results.filter(r => r.article).length;
    const totalTokens = results.reduce((sum, r) => sum + r.tokens, 0);
    const avgProfitability = results.reduce((sum, r) => sum + r.profitabilityScore, 0) / results.length;
    const aiPoweredCount = targets.filter(t => t.aiPowered).length;
    
    logger.info({
      requested: batchSize,
      successful,
      totalTokens,
      avgProfitability,
      aiPoweredCount,
      approach: 'ai-enhanced-manual',
      results: results.map(r => ({
        success: !!r.article,
        title: r.article?.title?.slice(0, 50),
        language: r.article?.language_code,
        tokens: r.tokens,
        profitabilityScore: r.profitabilityScore
      }))
    }, 'Manual AI-enhanced profitable generation completed');
    
    return results;
    
  } catch (err) {
    logger.error({ err, options }, 'Manual AI-enhanced profitable generation failed');
    throw err;
  }
}

export { 
  PROFITABILITY_STRATEGY, 
  ENHANCED_CONTENT_STRATEGIES,
  calculateTokenBudget,
  calculateOptimalDistribution,
  selectProfitableTargetsWithAI
};