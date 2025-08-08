import cron from 'node-cron';
import { config } from '../config/env.js';
import logger from '../lib/logger.js';
import { getCategoryBySlug, listCategories } from '../models/categoryModel.js';
import { createArticle } from '../models/articleModel.js';
import { recordTokenUsage, getMonthlyTokenUsage } from '../models/tokenUsageModel.js';
import { upsertDailyJobTarget, incrementJobProgress, getJobForDay } from '../models/jobModel.js';
import { 
  generateArticleViaAPI
} from './aiClient.js';
import { buildMeta, createSlug, estimateReadingTimeMinutes } from '../utils/seo.js';
import { getTrendingTopics } from './trendsService.js';
import { canRunOperation } from './budgetMonitorService.js';

// استراتيجية توزيع المحتوى حسب الربحية
const PROFITABILITY_STRATEGY = {
  // توزيع اللغات حسب معدل الربح (RPM - Revenue Per Mille)
  LANGUAGE_DISTRIBUTION: {
    'en': { 
      percentage: 35,     // 35% من المقالات
      priority: 1,        // أعلى أولوية
      avgRPM: 15.50,      // متوسط الربح لكل ألف مشاهدة
      categories: ['technology', 'finance', 'business'] // الفئات المربحة
    },
    'de': { 
      percentage: 20,     // 20% من المقالات  
      priority: 2,
      avgRPM: 12.80,
      categories: ['technology', 'finance', 'business', 'health']
    },
    'fr': { 
      percentage: 15,     // 15% من المقالات
      priority: 3, 
      avgRPM: 9.40,
      categories: ['technology', 'business', 'travel', 'health']
    },
    'es': { 
      percentage: 12,     // 12% من المقالات
      priority: 4,
      avgRPM: 7.20,
      categories: ['technology', 'health', 'sports', 'entertainment']
    },
    'pt': { 
      percentage: 8,      // 8% من المقالات
      priority: 5,
      avgRPM: 5.60,
      categories: ['health', 'sports', 'entertainment', 'travel']
    },
    'ar': { 
      percentage: 6,      // 6% من المقالات
      priority: 6,
      avgRPM: 4.80,
      categories: ['technology', 'business', 'health']
    },
    'hi': { 
      percentage: 4,      // 4% من المقالات
      priority: 7,
      avgRPM: 3.20,
      categories: ['technology', 'health', 'entertainment']
    }
  },

  // توزيع الفئات حسب الربحية
  CATEGORY_DISTRIBUTION: {
    'technology': { 
      percentage: 25,     // 25% من المقالات
      priority: 1,
      avgRPM: 18.20,
      competitiveness: 'high',
      seasonality: 'stable'
    },
    'finance': { 
      percentage: 20,     // 20% من المقالات
      priority: 2, 
      avgRPM: 16.80,
      competitiveness: 'very_high',
      seasonality: 'stable'
    },
    'business': { 
      percentage: 15,     // 15% من المقالات
      priority: 3,
      avgRPM: 14.50,
      competitiveness: 'high',
      seasonality: 'stable'
    },
    'health': { 
      percentage: 15,     // 15% من المقالات
      priority: 4,
      avgRPM: 12.30,
      competitiveness: 'medium',
      seasonality: 'stable'
    },
    'travel': { 
      percentage: 10,     // 10% من المقالات
      priority: 5,
      avgRPM: 8.90,
      competitiveness: 'medium',
      seasonality: 'high'
    },
    'sports': { 
      percentage: 8,      // 8% من المقالات
      priority: 6,
      avgRPM: 7.60,
      competitiveness: 'medium',
      seasonality: 'medium'
    },
    'entertainment': { 
      percentage: 7,      // 7% من المقالات
      priority: 7,
      avgRPM: 6.40,
      competitiveness: 'low',
      seasonality: 'high'
    }
  },

  // أوقات النشر المثلى حسب المنطقة الزمنية
  OPTIMAL_PUBLISHING_TIMES: {
    'en': ['08:00', '14:00', '20:00'], // UTC times for US/UK audiences
    'de': ['07:00', '13:00', '19:00'], // CET optimal times
    'fr': ['07:00', '13:00', '19:00'], // CET optimal times
    'es': ['08:00', '14:00', '21:00'], // Spain/Latin America
    'pt': ['09:00', '15:00', '21:00'], // Brazil time consideration
    'ar': ['10:00', '16:00', '22:00'], // Middle East times
    'hi': ['11:00', '17:00', '23:00']  // India time consideration
  }
};

// Enhanced content strategy مع التركيز على الربحية
const ENHANCED_CONTENT_STRATEGIES = {
  'HIGH_VALUE_SEO': { 
    weight: 0.45,       // 45% من المحتوى
    complexity: 'high', 
    audience: 'professionals and decision makers',
    avgTokens: 2800,
    targetCategories: ['technology', 'finance', 'business']
  },
  'TRENDING_NEWS': { 
    weight: 0.25,       // 25% من المحتوى
    complexity: 'medium', 
    audience: 'general readers seeking current info',
    avgTokens: 2200,
    targetCategories: ['technology', 'business', 'health']
  },
  'PRACTICAL_GUIDE': { 
    weight: 0.20,       // 20% من المحتوى
    complexity: 'medium', 
    audience: 'users seeking solutions',
    avgTokens: 2400,
    targetCategories: ['health', 'technology', 'travel']
  },
  'QUICK_INSIGHTS': { 
    weight: 0.10,       // 10% من المحتوى
    complexity: 'low', 
    audience: 'casual browsers',
    avgTokens: 1800,
    targetCategories: ['sports', 'entertainment']
  }
};

function getYearMonth(d = new Date()) {
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

function todayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

// حساب الميزانية المتبقية بدقة أكبر
async function calculateTokenBudget() {
  const { year, month } = getYearMonth();
  const usedTokens = await getMonthlyTokenUsage(year, month);
  const remainingTokens = Math.max(0, config.generation.monthlyTokenCap - usedTokens);
  
  // حساب الأيام المتبقية في الشهر
  const now = new Date();
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const currentDay = now.getUTCDate();
  const daysRemaining = Math.max(1, lastDayOfMonth - currentDay + 1);
  
  // حساب الميزانية اليومية المثلى
  const dailyBudget = Math.floor(remainingTokens / daysRemaining);
  const conservativeDailyBudget = Math.floor(dailyBudget * 0.8); // احتياط 20%
  
  return {
    totalRemaining: remainingTokens,
    daysRemaining,
    dailyBudget: conservativeDailyBudget,
    usedTokens,
    monthlyLimit: config.generation.monthlyTokenCap,
    utilizationRate: (usedTokens / config.generation.monthlyTokenCap) * 100
  };
}

async function remainingArticlesForToday() {
  const day = todayUTC();
  await upsertDailyJobTarget({ day, target: config.generation.dailyTarget });
  const job = await getJobForDay(day);
  const generated = job?.num_articles_generated || 0;
  return Math.max(0, config.generation.dailyTarget - generated);
}

// توزيع ذكي للمقالات حسب الربحية
function calculateOptimalDistribution(totalArticles, tokenBudget) {
  const distribution = {
    byLanguage: {},
    byCategory: {},
    byContentType: {},
    totalEstimatedTokens: 0
  };
  
  // توزيع اللغات
  Object.entries(PROFITABILITY_STRATEGY.LANGUAGE_DISTRIBUTION).forEach(([lang, config]) => {
    const articleCount = Math.floor((totalArticles * config.percentage) / 100);
    distribution.byLanguage[lang] = articleCount;
  });
  
  // توزيع الفئات
  Object.entries(PROFITABILITY_STRATEGY.CATEGORY_DISTRIBUTION).forEach(([category, config]) => {
    const articleCount = Math.floor((totalArticles * config.percentage) / 100);
    distribution.byCategory[category] = articleCount;
  });
  
  // توزيع أنواع المحتوى
  Object.entries(ENHANCED_CONTENT_STRATEGIES).forEach(([contentType, config]) => {
    const articleCount = Math.floor((totalArticles * config.weight) / 100);
    distribution.byContentType[contentType] = articleCount;
    distribution.totalEstimatedTokens += articleCount * config.avgTokens;
  });
  
  // التحقق من الميزانية
  if (distribution.totalEstimatedTokens > tokenBudget.dailyBudget) {
    const scalingFactor = tokenBudget.dailyBudget / distribution.totalEstimatedTokens;
    logger.warn({ 
      estimatedTokens: distribution.totalEstimatedTokens,
      dailyBudget: tokenBudget.dailyBudget,
      scalingFactor 
    }, 'Token budget exceeded, scaling down');
    
    // تقليل عدد المقالات بنسبة متناسبة
    Object.keys(distribution.byLanguage).forEach(lang => {
      distribution.byLanguage[lang] = Math.floor(distribution.byLanguage[lang] * scalingFactor);
    });
    
    Object.keys(distribution.byCategory).forEach(category => {
      distribution.byCategory[category] = Math.floor(distribution.byCategory[category] * scalingFactor);
    });
  }
  
  return distribution;
}

// اختيار مواضيع محسنة للربحية مع دمج Google Trends
async function selectProfitableTargets(plannedDistribution) {
  const targets = [];
  const categories = await listCategories();
  
  // جلب الترندات لجميع اللغات
  const trendingTopicsByLang = {};
  
  for (const languageCode of Object.keys(PROFITABILITY_STRATEGY.LANGUAGE_DISTRIBUTION)) {
    try {
      logger.info({ languageCode }, 'Fetching trends for language');
      const trends = await getTrendingTopics({ 
        languageCode, 
        maxPerCategory: 3 
      });
      trendingTopicsByLang[languageCode] = trends;
      logger.info({ 
        languageCode, 
        trendCount: trends.length,
        categories: [...new Set(trends.map(t => t.category))]
      }, 'Trends fetched successfully');
    } catch (err) {
      logger.warn({ err, languageCode }, 'Failed to fetch trends for language');
      trendingTopicsByLang[languageCode] = [];
    }
  }
  
  // إنشاء targets حسب التوزيع المحسوب
  const languageEntries = Object.entries(plannedDistribution.byLanguage)
    .filter(([_, count]) => count > 0)
    .sort(([, a], [, b]) => b - a); // ترتيب تنازلي حسب العدد
  
  for (const [languageCode, targetCount] of languageEntries) {
    const langConfig = PROFITABILITY_STRATEGY.LANGUAGE_DISTRIBUTION[languageCode];
    const trends = trendingTopicsByLang[languageCode] || [];
    
    for (let i = 0; i < targetCount; i++) {
      // اختيار فئة حسب أولوية الربحية للغة
      const availableCategories = langConfig.categories;
      const categorySlug = availableCategories[i % availableCategories.length];
      const category = categories.find(c => c.slug === categorySlug);
      
      if (!category) continue;
      
      // البحث عن trend مناسب للفئة واللغة
      const relevantTrends = trends.filter(t => t.category === categorySlug);
      let topic;
      let contentType;
      
      if (relevantTrends.length > 0 && Math.random() < 0.7) {
        // استخدام trend حقيقي (70% احتمال)
        const selectedTrend = relevantTrends[Math.floor(Math.random() * relevantTrends.length)];
        topic = `${selectedTrend.topic}: Comprehensive Analysis and Latest Insights`;
        contentType = 'TRENDING_NEWS';
        
        logger.info({ 
          languageCode, 
          categorySlug, 
          trendTopic: selectedTrend.topic 
        }, 'Using trending topic');
      } else {
        // استخدام موضوع تقليدي مع تحسين SEO
        const categoryConfig = PROFITABILITY_STRATEGY.CATEGORY_DISTRIBUTION[categorySlug];
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
        topic = `Ultimate Guide to ${selectedKeyword}: Expert Tips and Strategies`;
        
        // اختيار نوع المحتوى حسب الربحية
        if (categoryConfig.priority <= 3) {
          contentType = 'HIGH_VALUE_SEO';
        } else {
          contentType = 'PRACTICAL_GUIDE';
        }
      }
      
      // تحديد مستوى التعقيد
      const categoryPriority = PROFITABILITY_STRATEGY.CATEGORY_DISTRIBUTION[categorySlug]?.priority || 5;
      const complexity = categoryPriority <= 2 ? 'high' : categoryPriority <= 4 ? 'medium' : 'low';
      
      targets.push({
        languageCode,
        categoryId: category.id,
        categoryName: category.name,
        categorySlug,
        topic,
        contentType,
        complexity,
        targetAudience: ENHANCED_CONTENT_STRATEGIES[contentType]?.audience || 'general readers',
        keywords: [], // سيتم ملئها لاحقاً حسب الحاجة
        priority: langConfig.priority + (categoryPriority * 0.1),
        estimatedTokens: ENHANCED_CONTENT_STRATEGIES[contentType]?.avgTokens || 2200,
        profitabilityScore: langConfig.avgRPM * (6 - categoryPriority), // نتيجة الربحية
        trendBased: relevantTrends.length > 0
      });
    }
  }
  
  // ترتيب targets حسب الربحية
  targets.sort((a, b) => b.profitabilityScore - a.profitabilityScore);
  
  logger.info({
    totalTargets: targets.length,
    languageDistribution: Object.fromEntries(
      Object.entries(plannedDistribution.byLanguage).filter(([_, count]) => count > 0)
    ),
    categoryDistribution: Object.fromEntries(
      Object.entries(plannedDistribution.byCategory).filter(([_, count]) => count > 0)
    ),
    trendBasedCount: targets.filter(t => t.trendBased).length,
    avgProfitabilityScore: targets.reduce((sum, t) => sum + t.profitabilityScore, 0) / targets.length
  }, 'Profitable targets selected with trends integration');
  
  return targets;
}

async function generateOne(target, monthlyTokensUsed = 0) {
  const startTime = Date.now();
  
  logger.info({
    language: target.languageCode,
    category: target.categorySlug,
    contentType: target.contentType,
    topic: target.topic.slice(0, 50),
    profitabilityScore: target.profitabilityScore,
    trendBased: target.trendBased
  }, 'Starting profitable article generation');

  try {
    // تقدير توكنز سريع حسب التعقيد لضمان عدم تجاوز الميزانية
    const plannedMaxWords = target.complexity === 'high' ? 1500 : target.complexity === 'medium' ? 1200 : 1000;
    const estimatedTokensForArticle =
      target.complexity === 'high' ? 2400 : target.complexity === 'medium' ? 1900 : 1600;

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
        includeWebSearch: true,
      generateImage: false, // معطل لتوفير التكلفة
      maxWords: plannedMaxWords,
      complexity: target.complexity,
      monthlyTokensUsed
    });

    const { 
      title, 
      content, 
      summary, 
      metaDescription, 
      imageUrl, 
      tokensIn, 
      tokensOut, 
      model,
      estimatedCost
    } = result;

    const slug = createSlug(title, target.languageCode);
    const meta = buildMeta({ 
      title, 
      summary: summary || metaDescription, 
      imageUrl: null, // معطل
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
      aiPrompt: `Type: ${target.contentType}, Topic: ${target.topic}`,
      aiTokensInput: tokensIn,
      aiTokensOutput: tokensOut,
    });

    if (article) {
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
        trendBased: target.trendBased
      }, 'Profitable article generated successfully');
    }

    return { 
      article, 
      tokens: (tokensIn || 0) + (tokensOut || 0),
      generationTime: Date.now() - startTime,
      estimatedCost,
      profitabilityScore: target.profitabilityScore
    };

  } catch (err) {
    const generationTime = Date.now() - startTime;
    
    logger.error({ 
      err: err.message,
      language: target.languageCode, 
      topic: target.topic.slice(0, 50),
      contentType: target.contentType,
      generationTimeMs: generationTime,
      profitabilityScore: target.profitabilityScore
    }, 'Profitable article generation failed');
    
    return { 
      article: null, 
      tokens: 0, 
      generationTime,
      estimatedCost: 0,
      profitabilityScore: 0
    };
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
    maxBatchPerRun: config.generation.maxBatchPerRun,
    profitabilityStrategy: 'enabled'
  }, 'Profitability-optimized article generation scheduler started');

  cron.schedule(config.generation.schedule, async () => {
    const runStartTime = Date.now();
    
    try {
      logger.info('Starting profitable article generation run');
      
      // فحص شامل للميزانية والحدود
      const tokenBudget = await calculateTokenBudget();
      const remainingArticles = await remainingArticlesForToday();
      
      logger.info({
        tokenBudget,
        remainingArticles
      }, 'Budget and targets calculated');
      
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

      // تحديد حجم الدفعة المثلى
      const maxByTokens = Math.floor(tokenBudget.dailyBudget / 2500); // متوسط 2500 توكن لكل مقال
      
      if (maxByTokens <= 0) {
        logger.info({ 
          dailyBudget: tokenBudget.dailyBudget
        }, 'Insufficient daily token budget; skipping run');
        return;
      }

      const plannedBatch = Math.min(
        config.generation.maxBatchPerRun,
        remainingArticles,
        maxByTokens
      );

      // حساب التوزيع الأمثل للربحية
      const distribution = calculateOptimalDistribution(plannedBatch, tokenBudget);
      const targets = await selectProfitableTargets(distribution);

      if (targets.length === 0) {
        logger.warn('No profitable targets generated');
        return;
      }

      logger.info({
        plannedBatch,
        actualTargets: targets.length,
        distribution,
        estimatedTotalTokens: targets.reduce((sum, t) => sum + t.estimatedTokens, 0)
      }, 'Starting profitable generation batch');

      let generated = 0;
      let failed = 0;
      let tokensSpent = 0;
      let totalProfitabilityScore = 0;
      const generationStats = {
        byLanguage: {},
        byCategory: {},
        byContentType: {},
        byProfitability: { high: 0, medium: 0, low: 0 },
        trendBasedCount: 0,
        totalGenerationTime: 0,
        avgCostPerArticle: 0
      };

      for (const target of targets.slice(0, plannedBatch)) {
        // فحص الميزانية قبل كل مقال
        const currentUsage = await getMonthlyTokenUsage(getYearMonth().year, getYearMonth().month);
        if (currentUsage + tokensSpent >= config.generation.monthlyTokenCap) {
          logger.warn('Monthly token budget exhausted during batch, stopping');
          break;
        }

        const { article, tokens, generationTime, estimatedCost, profitabilityScore } = 
          await generateOne(target, currentUsage + tokensSpent);
        
        generationStats.totalGenerationTime += generationTime;
        
        if (article) {
          generated += 1;
          tokensSpent += tokens;
          totalProfitabilityScore += profitabilityScore;
          
          // إحصائيات مفصلة
          generationStats.byLanguage[target.languageCode] = 
            (generationStats.byLanguage[target.languageCode] || 0) + 1;
          generationStats.byCategory[target.categorySlug] = 
            (generationStats.byCategory[target.categorySlug] || 0) + 1;
          generationStats.byContentType[target.contentType] = 
            (generationStats.byContentType[target.contentType] || 0) + 1;
          
          // تصنيف الربحية
          if (profitabilityScore > 100) {
            generationStats.byProfitability.high += 1;
          } else if (profitabilityScore > 50) {
            generationStats.byProfitability.medium += 1;
          } else {
            generationStats.byProfitability.low += 1;
          }
          
          if (target.trendBased) {
            generationStats.trendBasedCount += 1;
          }
          
          generationStats.avgCostPerArticle += estimatedCost;
        } else {
          failed += 1;
        }

        // تأخير قصير بين الطلبات
        if (targets.indexOf(target) < targets.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }

      // تحديث تقدم العمل
      if (generated > 0) {
        await incrementJobProgress({ day: todayUTC(), count: generated });
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
        averageGenerationTimeMs: Math.round(generationStats.totalGenerationTime / targets.length),
        avgProfitabilityScore,
        trendIntegrationRate: (generationStats.trendBasedCount / generated) * 100,
        stats: generationStats,
        updatedTokenBudget: {
          remaining: tokenBudget.totalRemaining - tokensSpent,
          utilizationRate: ((tokenBudget.usedTokens + tokensSpent) / config.generation.monthlyTokenCap) * 100
        }
      }, 'Profitable generation run completed');

    } catch (err) {
      const runTime = Date.now() - runStartTime;
      logger.error({ 
        err: err.message,
        runTimeMs: runTime
      }, 'Profitable generation run failed');
    }
  });
}

// دالة للتشغيل اليدوي مع تحسينات الربحية
export async function triggerProfitableGeneration(options = {}) {
  const {
    batchSize = 5,
    forceHighValue = false,
    specificLanguages = null,
    specificCategories = null
  } = options;
  
  logger.info({ options }, 'Manual profitable generation triggered');
  
  try {
    const tokenBudget = await calculateTokenBudget();
    
    if (tokenBudget.totalRemaining <= 0) {
      throw new Error('Monthly token budget exhausted');
    }
    
    let distribution;
    if (specificLanguages || specificCategories) {
      // توزيع مخصص
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
    
    const targets = await selectProfitableTargets(distribution);
    
    if (forceHighValue) {
      // التركيز على المحتوى عالي القيمة فقط
      targets.forEach(target => {
        target.contentType = 'HIGH_VALUE_SEO';
        target.complexity = 'high';
        target.estimatedTokens = 2800;
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
    
    logger.info({
      requested: batchSize,
      successful,
      totalTokens,
      avgProfitability,
      results: results.map(r => ({
        success: !!r.article,
        title: r.article?.title?.slice(0, 50),
        tokens: r.tokens,
        profitabilityScore: r.profitabilityScore
      }))
    }, 'Manual profitable generation completed');
    
    return results;
    
  } catch (err) {
    logger.error({ err, options }, 'Manual profitable generation failed');
    throw err;
  }
}

export { 
  PROFITABILITY_STRATEGY, 
  ENHANCED_CONTENT_STRATEGIES,
  calculateTokenBudget,
  calculateOptimalDistribution,
  selectProfitableTargets
};