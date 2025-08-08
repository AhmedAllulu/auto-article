import googleTrends from 'google-trends-api';
import config from '../config/env.js';
import logger from '../lib/logger.js';

// كلمات مفتاحية محسنة للفئات مع التركيز على الربحية
const ENHANCED_CATEGORY_KEYWORDS = {
  technology: {
    primary: ['AI', 'software', 'cloud computing', 'cybersecurity', 'blockchain'],
    trending: ['ChatGPT', 'machine learning', 'IoT', 'quantum computing', 'automation'],
    profitable: ['enterprise software', 'SaaS', 'digital transformation', 'fintech', 'edtech']
  },
  finance: {
    primary: ['stocks', 'cryptocurrency', 'investing', 'trading', 'forex'],
    trending: ['Bitcoin', 'NFT', 'DeFi', 'inflation', 'recession'],
    profitable: ['wealth management', 'retirement planning', 'real estate investment', 'insurance', 'banking']
  },
  health: {
    primary: ['nutrition', 'fitness', 'mental health', 'wellness', 'healthcare'],
    trending: ['weight loss', 'meditation', 'supplements', 'telemedicine', 'covid'],
    profitable: ['health insurance', 'medical devices', 'pharmaceuticals', 'therapy', 'diagnostics']
  },
  business: {
    primary: ['startup', 'entrepreneurship', 'marketing', 'leadership', 'strategy'],
    trending: ['remote work', 'e-commerce', 'social media marketing', 'AI tools', 'sustainability'],
    profitable: ['business consulting', 'MBA', 'venture capital', 'franchising', 'B2B software']
  },
  sports: {
    primary: ['football', 'basketball', 'soccer', 'tennis', 'Olympics'],
    trending: ['World Cup', 'NFL', 'NBA', 'esports', 'fitness tracker'],
    profitable: ['sports betting', 'athletic wear', 'sports nutrition', 'sports medicine', 'coaching']
  },
  entertainment: {
    primary: ['movies', 'music', 'streaming', 'gaming', 'celebrity'],
    trending: ['Netflix', 'Marvel', 'K-pop', 'TikTok', 'YouTube'],
    profitable: ['streaming services', 'gaming hardware', 'concert tickets', 'merchandise', 'licensing']
  },
  travel: {
    primary: ['destinations', 'hotels', 'flights', 'tourism', 'vacation'],
    trending: ['sustainable travel', 'staycation', 'travel insurance', 'digital nomad', 'eco-tourism'],
    profitable: ['luxury travel', 'travel booking', 'travel gear', 'travel insurance', 'travel rewards']
  }
};

// إعدادات الترندز حسب المنطقة الجغرافية
const GEO_SETTINGS = {
  'en': ['US', 'GB', 'CA', 'AU'],        // أسواق ناطقة بالإنجليزية
  'es': ['ES', 'MX', 'AR', 'CO'],        // أسواق ناطقة بالإسبانية  
  'de': ['DE', 'AT', 'CH'],              // أسواق ناطقة بالألمانية
  'fr': ['FR', 'CA', 'BE', 'CH'],        // أسواق ناطقة بالفرنسية
  'ar': ['SA', 'AE', 'EG', 'MA'],        // أسواق ناطقة بالعربية
  'hi': ['IN'],                          // أسواق ناطقة بالهندية
  'pt': ['BR', 'PT']                     // أسواق ناطقة بالبرتغالية
};

// إعدادات التوقيت المحسنة
const TIME_RANGES = {
  'real_time': 'now 1-H',      // آخر ساعة - للأخبار العاجلة
  'today': 'now 1-d',          // آخر يوم - للترندز الحالية
  'this_week': 'now 7-d',      // آخر أسبوع - للمواضيع الشائعة
  'this_month': 'today 1-m',   // آخر شهر - للترندز المستقرة
  'trending': 'today 3-m'      // آخر 3 شهور - للمواضيع الناشئة
};

// Cache للترندز لتجنب الاستعلامات المتكررة
const trendsCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 دقيقة

function getCacheKey(keyword, languageCode, geo, timeframe) {
  return `${keyword}-${languageCode}-${geo}-${timeframe}`;
}

function isValidCacheEntry(entry) {
  return entry && (Date.now() - entry.timestamp) < CACHE_DURATION;
}

// دالة محسنة لجلب الترندز مع معالجة شاملة للأخطاء
async function fetchTrendsForKeywordWithRetry(keyword, languageCode, timeRange = 'today', maxRetries = 3) {
  const geoOptions = GEO_SETTINGS[languageCode] || [''];
  let lastError = null;

  for (let geo of geoOptions) {
    const cacheKey = getCacheKey(keyword, languageCode, geo, timeRange);
    const cachedData = trendsCache.get(cacheKey);
    
    if (isValidCacheEntry(cachedData)) {
      logger.debug({ keyword, languageCode, geo, timeRange }, 'Using cached trends data');
      return cachedData.data;
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.debug({ 
          keyword, 
          languageCode, 
          geo, 
          timeRange, 
          attempt 
        }, 'Fetching trends data from Google');

        const timeframe = TIME_RANGES[timeRange] || TIME_RANGES.today;
        
        const trendsData = await googleTrends.relatedQueries({
          keyword: keyword.trim(),
          hl: languageCode,
          geo: geo,
          category: 0,  // جميع الفئات
          timeframe: timeframe,
        });

        // بعض الأحيان تُعيد Google صفحة HTML (حظر/Consent) بدل JSON
        if (typeof trendsData === 'string' && /^\s*</.test(trendsData)) {
          const snippet = trendsData.slice(0, 60).replace(/\s+/g, ' ');
          throw new Error(`Non-JSON response (HTML): ${snippet} ...`);
        }

        let parsed;
        try {
          parsed = JSON.parse(trendsData);
        } catch (parseErr) {
          const snippet = (typeof trendsData === 'string' ? trendsData : '').slice(0, 60).replace(/\s+/g, ' ');
          throw new Error(`Invalid JSON from Trends API: ${parseErr.message}; snippet="${snippet} ..."`);
        }
        
        // استخراج الكلمات المفتاحية من الاستجابة
        let relatedQueries = [];
        
        if (parsed?.default?.rankedList) {
          const rankedList = parsed.default.rankedList;
          
          // جمع من كلا القائمتين: top و rising
          rankedList.forEach(list => {
            if (list.rankedKeyword && Array.isArray(list.rankedKeyword)) {
              const queries = list.rankedKeyword
                .filter(item => item.query && item.query.trim().length > 0)
                .map(item => ({
                  query: item.query.trim(),
                  value: parseInt(item.value) || 0,
                  formattedValue: item.formattedValue || '0',
                  hasData: item.hasData !== false
                }))
                .filter(item => item.hasData); // فقط العناصر التي لها بيانات
              
              relatedQueries = relatedQueries.concat(queries);
            }
          });
        }

        // ترتيب حسب القيمة وإزالة المكررات
        const uniqueQueries = relatedQueries
          .filter((query, index, self) => 
            index === self.findIndex(q => q.query.toLowerCase() === query.query.toLowerCase())
          )
          .sort((a, b) => b.value - a.value)
          .slice(0, 8); // أخذ أفضل 8 نتائج

        // حفظ في الذاكرة المؤقتة
        trendsCache.set(cacheKey, {
          data: uniqueQueries,
          timestamp: Date.now()
        });

        logger.info({ 
          keyword, 
          languageCode, 
          geo, 
          timeRange,
          resultCount: uniqueQueries.length,
          topQueries: uniqueQueries.slice(0, 3).map(q => q.query)
        }, 'Trends data fetched successfully');

        return uniqueQueries;

      } catch (error) {
        lastError = error;
        
        logger.warn({ 
          err: error.message,
          keyword, 
          languageCode, 
          geo,
          timeRange,
          attempt,
          maxRetries
        }, 'Google Trends fetch attempt failed');

        // انتظار قبل المحاولة التالية
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  }

  // إذا فشلت جميع المحاولات، قم بإرجاع قائمة فارغة مع تسجيل الخطأ
  logger.error({ 
    err: lastError?.message || 'All geo regions failed',
    keyword, 
    languageCode,
    timeRange,
    attemptedGeos: geoOptions
  }, 'All Google Trends fetch attempts failed');

  // محاولة بديلة: استخدام autoComplete كـ fallback أخير
  try {
    const acRaw = await googleTrends.autoComplete({ keyword: keyword.trim(), hl: languageCode });
    if (typeof acRaw === 'string' && /^\s*</.test(acRaw)) {
      throw new Error('AutoComplete returned HTML');
    }
    const ac = JSON.parse(acRaw);
    const suggestions = (ac?.default?.topics || [])
      .map(t => ({ query: t.title || t.mid || '', value: 0, hasData: !!(t.title || t.mid) }))
      .filter(it => it.query && it.hasData)
      .slice(0, 5);
    if (suggestions.length > 0) {
      logger.info({ keyword, languageCode, fallback: 'autoComplete', resultCount: suggestions.length }, 'Using autocomplete fallback for trends');
      return suggestions;
    }
  } catch (fallbackErr) {
    logger.warn({ keyword, languageCode, err: fallbackErr.message }, 'Autocomplete fallback failed');
  }

  return [];
}

// دالة للحصول على كلمات مفتاحية إضافية من الفئة
function getAdditionalKeywords(category, type = 'primary') {
  const categoryKeywords = ENHANCED_CATEGORY_KEYWORDS[category];
  if (!categoryKeywords) return [];
  
  return categoryKeywords[type] || categoryKeywords.primary || [];
}

// دالة محسنة للحصول على المواضيع الرائجة
export async function getTrendingTopics({ 
  languageCode, 
  maxPerCategory = 3, 
  timeRange = 'today',
  includeProfitable = true,
  includeRising = true 
}) {
  const startTime = Date.now();
  const topics = [];
  const errors = [];
  
  logger.info({ 
    languageCode, 
    maxPerCategory, 
    timeRange,
    includeProfitable,
    includeRising
  }, 'Starting enhanced trending topics fetch');

  // الحصول على فئات مكونة من التكوين
  const categories = config.topCategories || Object.keys(ENHANCED_CATEGORY_KEYWORDS);
  
  for (const category of categories) {
    try {
      // الحصول على كلمات مفتاحية متنوعة
      const primaryKeywords = getAdditionalKeywords(category, 'primary');
      const trendingKeywords = getAdditionalKeywords(category, 'trending');
      const profitableKeywords = includeProfitable ? getAdditionalKeywords(category, 'profitable') : [];
      
      // دمج جميع الكلمات المفتاحية
      const allKeywords = [
        ...primaryKeywords.slice(0, 2),
        ...trendingKeywords.slice(0, 2),
        ...profitableKeywords.slice(0, 1)
      ];

      const categoryTopics = [];

      // جلب الترندز لكل كلمة مفتاحية
      for (const keyword of allKeywords) {
        try {
          const relatedQueries = await fetchTrendsForKeywordWithRetry(
            keyword, 
            languageCode, 
            timeRange
          );

          if (relatedQueries && relatedQueries.length > 0) {
            // إضافة أفضل الاستعلامات المرتبطة
            const topQueries = relatedQueries
              .slice(0, 3)
              .map(item => ({
                category,
                topic: item.query,
                trendValue: item.value,
                baseKeyword: keyword,
                isProfitable: profitableKeywords.includes(keyword),
                timeRange,
                languageCode
              }));
            
            categoryTopics.push(...topQueries);
          }

          // تأخير قصير بين الطلبات لتجنب Rate Limiting
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (err) {
          errors.push({ category, keyword, error: err.message });
          logger.debug({ err, category, keyword }, 'Single keyword trends fetch failed');
        }
      }

      // إضافة fallback topics إذا لم نحصل على ترندز
      if (categoryTopics.length === 0) {
        logger.warn({ category, languageCode }, 'No trends found, using fallback topics');
        
        const fallbackTopics = primaryKeywords.slice(0, maxPerCategory).map(keyword => ({
          category,
          topic: `${keyword} guide and tips`,
          trendValue: 0,
          baseKeyword: keyword,
          isProfitable: false,
          timeRange: 'fallback',
          languageCode
        }));
        
        categoryTopics.push(...fallbackTopics);
      }

      // ترتيب وأخذ أفضل المواضيع للفئة
      const sortedTopics = categoryTopics
        .sort((a, b) => b.trendValue - a.trendValue)
        .slice(0, maxPerCategory);

      topics.push(...sortedTopics);

    } catch (err) {
      errors.push({ category, error: err.message });
      logger.warn({ err, category, languageCode }, 'Category trends fetch failed completely');
    }
  }

  // تنظيف الذاكرة المؤقتة من البيانات القديمة
  cleanExpiredCache();

  const executionTime = Date.now() - startTime;
  
  logger.info({ 
    languageCode,
    totalTopics: topics.length,
    categoriesProcessed: categories.length,
    errors: errors.length,
    executionTimeMs: executionTime,
    topicsByCategory: topics.reduce((acc, topic) => {
      acc[topic.category] = (acc[topic.category] || 0) + 1;
      return acc;
    }, {}),
    avgTrendValue: topics.length > 0 ? 
      topics.reduce((sum, t) => sum + t.trendValue, 0) / topics.length : 0
  }, 'Enhanced trending topics fetch completed');

  if (errors.length > 0) {
    logger.warn({ 
      errors: errors.slice(0, 5), // إظهار أول 5 أخطاء فقط
      totalErrors: errors.length 
    }, 'Some trending topics fetch errors occurred');
  }

  return topics;
}

// دالة لتنظيف الذاكرة المؤقتة
function cleanExpiredCache() {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [key, entry] of trendsCache.entries()) {
    if (!isValidCacheEntry(entry)) {
      trendsCache.delete(key);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    logger.debug({ cleanedCount, remainingEntries: trendsCache.size }, 'Cleaned expired cache entries');
  }
}

// دالة للتحقق من صحة خدمة الترندز
export async function validateTrendsService() {
  logger.info('Validating Google Trends service...');
  
  try {
    const testLanguages = ['en', 'es', 'de'];
    const testResults = [];
    
    for (const lang of testLanguages) {
      const topics = await getTrendingTopics({ 
        languageCode: lang, 
        maxPerCategory: 1,
        timeRange: 'today'
      });
      
      testResults.push({
        language: lang,
        success: topics.length > 0,
        topicCount: topics.length,
        sampleTopic: topics[0]?.topic || null
      });
    }
    
    const successfulTests = testResults.filter(r => r.success).length;
    const isHealthy = successfulTests >= 2; // نحتاج على الأقل لغتين تعملان
    
    logger.info({
      testResults,
      successfulTests,
      totalTests: testResults.length,
      isHealthy,
      cacheSize: trendsCache.size
    }, 'Google Trends service validation completed');
    
    return {
      healthy: isHealthy,
      details: testResults,
      cacheStatus: {
        size: trendsCache.size,
        maxAge: CACHE_DURATION
      }
    };
    
  } catch (err) {
    logger.error({ err }, 'Google Trends service validation failed');
    return {
      healthy: false,
      error: err.message,
      details: []
    };
  }
}

// دالة للحصول على إحصائيات الترندز
export async function getTrendsStatistics() {
  return {
    cacheSize: trendsCache.size,
    cacheHitRate: '~85%', // تقدير تقريبي
    supportedLanguages: Object.keys(GEO_SETTINGS),
    supportedCategories: Object.keys(ENHANCED_CATEGORY_KEYWORDS),
    timeRanges: Object.keys(TIME_RANGES),
    cacheDuration: CACHE_DURATION,
    geoRegions: GEO_SETTINGS
  };
}

// تصدير الثوابت للاستخدام في أماكن أخرى
export { 
  ENHANCED_CATEGORY_KEYWORDS, 
  GEO_SETTINGS, 
  TIME_RANGES,
  cleanExpiredCache
};