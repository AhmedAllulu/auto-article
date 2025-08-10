import dotenv from 'dotenv';

dotenv.config();

const getEnvArray = (name, fallbackCsv) => {
  const raw = process.env[name] || fallbackCsv;
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

const getEnvNumber = (name, fallback) => {
  const value = process.env[name];
  return value ? Number(value) : fallback;
};

const getEnvBoolean = (name, fallback) => {
  const value = process.env[name];
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true' || value === '1';
};

export const config = Object.freeze({
  // Basic server configuration
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: (process.env.NODE_ENV || 'development') === 'production',
  port: getEnvNumber('PORT', 3322),
  
  // HTTPS/SSL configuration
  ssl: {
    enableHttps: getEnvBoolean('ENABLE_HTTPS', true),
    keyPath: process.env.SSL_KEY_PATH || null,
    certPath: process.env.SSL_CERT_PATH || null,
  },
  
  // Database configuration
  databaseUrl: process.env.DATABASE_URL || 
    'postgres://postgres:postgres@localhost:5432/auto_article',

  // Admin API configuration
  admin: {
    apiToken: process.env.ADMIN_API_TOKEN || null,
  },
  
  // Rate limiting configuration
  rateLimit: {
    points: getEnvNumber('RATE_LIMIT_POINTS', 300),
    duration: getEnvNumber('RATE_LIMIT_DURATION', 60),
    skipSuccessfulRequests: getEnvBoolean('RATE_LIMIT_SKIP_SUCCESS', true),
    skipFailedRequests: getEnvBoolean('RATE_LIMIT_SKIP_FAILED', false),
  },
  
  // AI Service Configuration (محسن للاقتصاد)
  ai: {
    apiKey: process.env.ONE_MIN_AI_API_KEY || '',
    baseUrl: (process.env.ONE_MIN_AI_BASE_URL || 'https://api.1min.ai').replace(/\/$/, ''),
    timeout: getEnvNumber('AI_API_TIMEOUT', 90000),     // مخفض من 120 ثانية
    maxRetries: getEnvNumber('AI_API_MAX_RETRIES', 2),
    retryDelay: getEnvNumber('AI_API_RETRY_DELAY', 3000), // مخفض من 5 ثوانِ
    
    // إعدادات النماذج المحسنة للاقتصاد
    defaultTextModel: process.env.AI_DEFAULT_TEXT_MODEL || 'gpt-4o-mini', // اقتصادي
    fallbackModel: process.env.AI_FALLBACK_MODEL || 'mistral-nemo',       // اقتصادي جداً
    premiumModel: process.env.AI_PREMIUM_MODEL || 'gemini-2.5',          // بديل اقتصادي للمحتوى عالي القيمة
    
    // إعدادات إنشاء الصور (معطل لتوفير التكلفة)
    enableImageGeneration: getEnvBoolean('ENABLE_IMAGE_GENERATION', false),
    defaultImageModel: process.env.AI_DEFAULT_IMAGE_MODEL || 'midjourney',
  },
  
  // Enhanced Article Generation Configuration (محسن للاقتصاد)
  generation: {
    // إعدادات الإنتاج الأساسية
    dailyTarget: getEnvNumber('DAILY_ARTICLE_TARGET', 70),
    monthlyTokenCap: getEnvNumber('MONTHLY_TOKEN_CAP', 4_000_000),  // 4 مليون بالضبط
    maxBatchPerRun: getEnvNumber('MAX_BATCH_PER_RUN', 6),           // مخفض من 8
    schedule: process.env.CRON_SCHEDULE || '*/20 * * * *',          // كل 20 دقيقة بدلاً من 15
    
    // إعدادات المحتوى المحسنة
    enableWebSearch: getEnvBoolean('ENABLE_WEB_SEARCH', true),     // معطل افتراضياً لتوفير التوكنز
    generateImages: getEnvBoolean('GENERATE_IMAGES', false),        // معطل لتوفير التكلفة
    maxWordsPerArticle: getEnvNumber('MAX_WORDS_PER_ARTICLE', 1200), // مخفض أكثر لضمان الاقتصاد
    minWordsPerArticle: getEnvNumber('MIN_WORDS_PER_ARTICLE', 800),
    estimatedTokensPerArticle: getEnvNumber('ESTIMATED_TOKENS_PER_ARTICLE', 1800), // محسن أكثر
    
    // استراتيجية اقتصادية للاستخدام
    budgetMode: getEnvBoolean('BUDGET_MODE', true),                 // تشغيل الوضع الاقتصادي
    premiumContentPercentage: getEnvNumber('PREMIUM_CONTENT_PERCENTAGE', 15), // 15% محتوى متقدم
    webSearchOnlyForHighValue: getEnvBoolean('WEB_SEARCH_HIGH_VALUE_ONLY', true),
    
    // تحسينات الجودة مع الاقتصاد
    enableTrendBasedTopics: getEnvBoolean('ENABLE_TREND_BASED_TOPICS', true),
    enableTimeBasedStrategy: getEnvBoolean('ENABLE_TIME_BASED_STRATEGY', true),
    enableCategoryRotation: getEnvBoolean('ENABLE_CATEGORY_ROTATION', true),
    enableLanguageBalancing: getEnvBoolean('ENABLE_LANGUAGE_BALANCING', true),
    
    // إعدادات جودة المحتوى
    requireMinReadingTime: getEnvNumber('MIN_READING_TIME_MINUTES', 3),
    requireMaxReadingTime: getEnvNumber('MAX_READING_TIME_MINUTES', 12), // مخفض من 15
    enableContentValidation: getEnvBoolean('ENABLE_CONTENT_VALIDATION', true),
    enableDuplicateDetection: getEnvBoolean('ENABLE_DUPLICATE_DETECTION', true),
    
    // إعدادات الميزانية والمراقبة
    dailyTokenBudgetBuffer: getEnvNumber('DAILY_TOKEN_BUDGET_BUFFER', 0.2), // احتياط 20%
    lowBudgetThreshold: getEnvNumber('LOW_BUDGET_THRESHOLD', 0.1),          // تحذير عند 10%
    emergencyStopThreshold: getEnvNumber('EMERGENCY_STOP_THRESHOLD', 0.05), // توقف عند 5%
  },
  
  // Language Configuration (مرتبة حسب الربحية)
  languages: getEnvArray('SUPPORTED_LANGUAGES', 'en,de,fr,es,pt,ar,hi'), // إنجليزية أولاً
  defaultLanguage: process.env.DEFAULT_LANGUAGE || 'en',
  
  // إعدادات اللغة المحسنة للربحية
  languageSettings: {
    'en': { 
      priority: 1,                    // أعلى أولوية
      targetPercentage: 35,           // 35% من المحتوى
      complexity: 'medium',
      avgRPM: 15.50,                  // متوسط الربح لكل ألف مشاهدة
      preferredModels: ['gpt-4o-mini', 'gemini-2.5'],
      enableWebSearch: true,          // البحث على الويب للإنجليزية فقط
      enablePremiumContent: true
    },
    'de': { 
      priority: 2,
      targetPercentage: 20,
      complexity: 'medium',
      avgRPM: 12.80,
      preferredModels: ['gpt-4o-mini', 'gemini-2.5'],
      enableWebSearch: false,
      enablePremiumContent: true
    },
    'fr': { 
      priority: 3,
      targetPercentage: 15,
      complexity: 'medium',
      avgRPM: 9.40,
      preferredModels: ['gemini-2.5', 'gpt-4o-mini'],
      enableWebSearch: false,
      enablePremiumContent: false
    },
    'es': { 
      priority: 4,
      targetPercentage: 12,
      complexity: 'medium',
      avgRPM: 7.20,
      preferredModels: ['mistral-nemo', 'gpt-4o-mini'],
      enableWebSearch: false,
      enablePremiumContent: false
    },
    'pt': { 
      priority: 5,
      targetPercentage: 8,
      complexity: 'low',
      avgRPM: 5.60,
      preferredModels: ['mistral-nemo', 'gpt-4o-mini'],
      enableWebSearch: false,
      enablePremiumContent: false
    },
    'ar': { 
      priority: 6,
      targetPercentage: 6,
      complexity: 'medium',
      avgRPM: 4.80,
      preferredModels: ['gemini-2.5', 'gpt-4o-mini'],
      enableWebSearch: false,
      enablePremiumContent: false
    },
    'hi': { 
      priority: 7,
      targetPercentage: 4,
      complexity: 'low',
      avgRPM: 3.20,
      preferredModels: ['gemini-2.5', 'mistral-nemo'],
      enableWebSearch: false,
      enablePremiumContent: false
    },
  },
  
  // Category Configuration (مرتبة حسب الربحية)
  topCategories: getEnvArray('TOP_CATEGORIES', 'technology,finance,business,health,travel,sports,entertainment'),
  
  // إعدادات الفئة المحسنة للربحية
  categorySettings: {
    'technology': {
      priority: 1,
      targetPercentage: 25,           // 25% من المحتوى
      avgRPM: 18.20,
      preferredModels: ['gemini-2.5', 'gpt-4o-mini'],
      complexityBonus: 0.3,
      enableWebSearch: true,          // فقط للتقنية
      enablePremiumContent: true,
      competitiveness: 'very_high'
    },
    'finance': {
      priority: 2,
      targetPercentage: 20,
      avgRPM: 16.80,
      preferredModels: ['gemini-2.5', 'gpt-4o-mini'],
      complexityBonus: 0.2,
      enableWebSearch: false,         // معطل لتوفير التوكنز
      enablePremiumContent: true,
      competitiveness: 'very_high'
    },
    'business': {
      priority: 3,
      targetPercentage: 15,
      avgRPM: 14.50,
      preferredModels: ['gemini-2.5', 'gpt-4o-mini'],
      complexityBonus: 0.2,
      enableWebSearch: false,
      enablePremiumContent: true,
      competitiveness: 'high'
    },
    'health': {
      priority: 4,
      targetPercentage: 15,
      avgRPM: 12.30,
      preferredModels: ['gemini-2.5', 'gpt-4o-mini'],
      complexityBonus: 0.0,
      enableWebSearch: false,
      enablePremiumContent: false,
      competitiveness: 'medium'
    },
    'travel': {
      priority: 5,
      targetPercentage: 10,
      avgRPM: 8.90,
      preferredModels: ['mistral-nemo', 'gpt-4o-mini'],
      complexityBonus: -0.1,
      enableWebSearch: false,
      enablePremiumContent: false,
      competitiveness: 'medium'
    },
    'sports': {
      priority: 6,
      targetPercentage: 8,
      avgRPM: 7.60,
      preferredModels: ['gpt-4o-mini', 'mistral-nemo'],
      complexityBonus: -0.1,
      enableWebSearch: false,
      enablePremiumContent: false,
      competitiveness: 'low'
    },
    'entertainment': {
      priority: 7,
      targetPercentage: 7,
      avgRPM: 6.40,
      preferredModels: ['gpt-4o-mini', 'mistral-nemo'],
      complexityBonus: -0.2,
      enableWebSearch: false,
      enablePremiumContent: false,
      competitiveness: 'low'
    },
  },
  
  // Google Trends Configuration (محسن للأداء)
  trends: {
    enabled: getEnvBoolean('TRENDS_ENABLED', true),
    geo: process.env.TRENDS_GEO || '',
    timeRange: process.env.TRENDS_TIME_RANGE || 'now 1-d',  // يوم واحد بدلاً من ساعة
    categoryId: getEnvNumber('TRENDS_CATEGORY_ID', 0),
    maxTrendsPerCategory: getEnvNumber('MAX_TRENDS_PER_CATEGORY', 3),
    cacheTtlMinutes: getEnvNumber('TRENDS_CACHE_TTL_MINUTES', 45), // زيادة Cache
    enableFallback: getEnvBoolean('TRENDS_ENABLE_FALLBACK', true),
    maxRetries: getEnvNumber('TRENDS_MAX_RETRIES', 2),      // تقليل المحاولات
    requestDelay: getEnvNumber('TRENDS_REQUEST_DELAY', 800), // زيادة التأخير
    
    // إعدادات إقليمية محسنة
    regional: {
      'en': process.env.TRENDS_GEO_EN || 'US',
      'de': process.env.TRENDS_GEO_DE || 'DE',
      'fr': process.env.TRENDS_GEO_FR || 'FR',
      'es': process.env.TRENDS_GEO_ES || 'ES',
      'pt': process.env.TRENDS_GEO_PT || 'BR',
      'ar': process.env.TRENDS_GEO_AR || 'SA',
      'hi': process.env.TRENDS_GEO_HI || 'IN',
    },
    
    // أولوية الاستخدام (للغات عالية الربحية أولاً)
    priorityLanguages: ['en', 'de', 'fr'],
    enableForLowPriorityLanguages: getEnvBoolean('TRENDS_LOW_PRIORITY_LANGS', false),
  },
  
  // SEO and Content Optimization (محسن للاقتصاد)
  seo: {
    enableAdvancedSeo: getEnvBoolean('ENABLE_ADVANCED_SEO', true),
    generateMetaDescriptions: getEnvBoolean('GENERATE_META_DESCRIPTIONS', true),
    generateOpenGraphTags: getEnvBoolean('GENERATE_OPEN_GRAPH_TAGS', true),
    generateTwitterCards: getEnvBoolean('GENERATE_TWITTER_CARDS', false), // معطل لتوفير التوكنز
    enableSchemaMarkup: getEnvBoolean('ENABLE_SCHEMA_MARKUP', false),      // معطل
    
    // تحسين العناوين
    maxTitleLength: getEnvNumber('MAX_TITLE_LENGTH', 60),
    minTitleLength: getEnvNumber('MIN_TITLE_LENGTH', 30),
    enableTitleOptimization: getEnvBoolean('ENABLE_TITLE_OPTIMIZATION', true),
    
    // تحسين الوصف
    maxMetaDescriptionLength: getEnvNumber('MAX_META_DESCRIPTION_LENGTH', 160),
    minMetaDescriptionLength: getEnvNumber('MIN_META_DESCRIPTION_LENGTH', 120),
    
    // تحسين الرابط
    maxSlugLength: getEnvNumber('MAX_SLUG_LENGTH', 80),          // مخفض من 100
    enableSlugOptimization: getEnvBoolean('ENABLE_SLUG_OPTIMIZATION', true),
  },
  
  // Image Configuration (معطل لتوفير التكلفة)
  images: {
    enabled: getEnvBoolean('IMAGES_ENABLED', false),
    defaultAspectRatio: process.env.IMAGE_ASPECT_RATIO || '16:9',
    defaultQuality: process.env.IMAGE_QUALITY || 'standard',    // مخفض من high
    maxRetries: getEnvNumber('IMAGE_MAX_RETRIES', 1),           // مخفض من 2
    fallbackImage: process.env.FALLBACK_IMAGE_URL || null,
    enableImageOptimization: getEnvBoolean('ENABLE_IMAGE_OPTIMIZATION', false),
  },
  
  // Monitoring and Analytics (محسن للأداء)
  monitoring: {
    enableDetailedLogging: getEnvBoolean('ENABLE_DETAILED_LOGGING', true),
    logLevel: process.env.LOG_LEVEL || 'info',
    enableMetrics: getEnvBoolean('ENABLE_METRICS', true),
    enableHealthCheck: getEnvBoolean('ENABLE_HEALTH_CHECK', true),
    
    // مراقبة الأداء
    enablePerformanceTracking: getEnvBoolean('ENABLE_PERFORMANCE_TRACKING', true),
    slowQueryThreshold: getEnvNumber('SLOW_QUERY_THRESHOLD_MS', 500),       // زيادة الحد
    slowGenerationThreshold: getEnvNumber('SLOW_GENERATION_THRESHOLD_MS', 45000), // زيادة الحد
    
    // تتبع الأخطاء
    enableErrorReporting: getEnvBoolean('ENABLE_ERROR_REPORTING', true),
    errorReportingWebhook: process.env.ERROR_REPORTING_WEBHOOK || null,
    
    // مراقبة الميزانية
    enableBudgetAlerts: getEnvBoolean('ENABLE_BUDGET_ALERTS', true),
    budgetAlertThresholds: [0.8, 0.9, 0.95, 0.98], // تنبيهات عند 80%, 90%, 95%, 98%
  },
  
  // Feature Flags (محسن للاقتصاد)
  features: {
    // Global generation toggle
    enableGeneration: getEnvBoolean('ENABLE_GENERATION', false),
    enableImmediateGenerationOnStart: getEnvBoolean('ENABLE_IMMEDIATE_GENERATION_ON_START', true),
    // Disable external trend discovery by default; rely on AI prompt during generation
    enableTrendDiscovery: getEnvBoolean('ENABLE_TREND_DISCOVERY', false),
    enableExperimentalModels: getEnvBoolean('ENABLE_EXPERIMENTAL_MODELS', false),
    enableA11yOptimization: getEnvBoolean('ENABLE_A11Y_OPTIMIZATION', false),    // معطل
    enableMultimodalContent: getEnvBoolean('ENABLE_MULTIMODAL_CONTENT', false),  // معطل
    enableContentVersioning: getEnvBoolean('ENABLE_CONTENT_VERSIONING', false),  // معطل
    enableAutoTranslation: getEnvBoolean('ENABLE_AUTO_TRANSLATION', false),      // معطل
    enableContentRecommendations: getEnvBoolean('ENABLE_CONTENT_RECOMMENDATIONS', false), // معطل
    // Master+Translation mode
    enableMasterTranslationMode: getEnvBoolean('ENABLE_MASTER_TRANSLATION_MODE', true),
    
    // ميزات جديدة للربحية
    enableProfitabilityTracking: getEnvBoolean('ENABLE_PROFITABILITY_TRACKING', true),
    enableDynamicModelSelection: getEnvBoolean('ENABLE_DYNAMIC_MODEL_SELECTION', true),
    enableBudgetOptimization: getEnvBoolean('ENABLE_BUDGET_OPTIMIZATION', true),
  },
  
  // Development and Testing
  development: {
    enableMockMode: getEnvBoolean('ENABLE_MOCK_MODE', !process.env.ONE_MIN_AI_API_KEY),
    enableTestGeneration: getEnvBoolean('ENABLE_TEST_GENERATION', false),
    mockContentQuality: process.env.MOCK_CONTENT_QUALITY || 'high',
    enableDebugMode: getEnvBoolean('ENABLE_DEBUG_MODE', false),
    
    // إعدادات التطوير الاقتصادية
    devDailyLimit: getEnvNumber('DEV_DAILY_LIMIT', 10),         // حد يومي للتطوير
    devTokenLimit: getEnvNumber('DEV_TOKEN_LIMIT', 50000),      // حد توكنز للتطوير
  },
  
  // Quality Control (مراقبة الجودة مع الاقتصاد)
  quality: {
    enableQualityChecks: getEnvBoolean('ENABLE_QUALITY_CHECKS', true),
    minContentScore: getEnvNumber('MIN_CONTENT_SCORE', 7),      // من 10
    enablePlagiarismCheck: getEnvBoolean('ENABLE_PLAGIARISM_CHECK', false), // معطل لتوفير التوكنز
    enableReadabilityCheck: getEnvBoolean('ENABLE_READABILITY_CHECK', true),
    enableSEOScoring: getEnvBoolean('ENABLE_SEO_SCORING', true),
    
    // إعدادات الجودة الاقتصادية
    qualityVsCostBalance: getEnvNumber('QUALITY_VS_COST_BALANCE', 0.7), // 70% جودة، 30% توفير
    enableAutoRewrite: getEnvBoolean('ENABLE_AUTO_REWRITE', false),     // معطل لتوفير التوكنز
  }
});

// Validation functions (محسنة)
export function validateConfig() {
  const errors = [];
  const warnings = [];
  
  // التحقق من الإعدادات الأساسية
  if (config.generation.dailyTarget <= 0) {
    errors.push('DAILY_ARTICLE_TARGET must be greater than 0');
  }
  
  if (config.generation.monthlyTokenCap <= 0) {
    errors.push('MONTHLY_TOKEN_CAP must be greater than 0');
  }
  
  if (config.generation.monthlyTokenCap > 5_000_000) {
    warnings.push('Monthly token cap is very high - consider budget optimization');
  }
  
  if (config.languages.length === 0) {
    errors.push('At least one language must be supported');
  }
  
  if (config.topCategories.length === 0) {
    errors.push('At least one category must be configured');
  }
  
  // التحقق من توزيع اللغات
  const totalLanguagePercentage = Object.values(config.languageSettings)
    .reduce((sum, settings) => sum + settings.targetPercentage, 0);
  
  if (totalLanguagePercentage > 100) {
    errors.push(`Language target percentages sum to ${totalLanguagePercentage}%, which exceeds 100%`);
  }
  
  // التحقق من توزيع الفئات
  const totalCategoryPercentage = Object.values(config.categorySettings)
    .reduce((sum, settings) => sum + settings.targetPercentage, 0);
  
  if (totalCategoryPercentage > 100) {
    errors.push(`Category target percentages sum to ${totalCategoryPercentage}%, which exceeds 100%`);
  }
  
  // التحقق من إعدادات AI
  if (!config.ai.baseUrl || !config.ai.baseUrl.startsWith('http')) {
    errors.push('ONE_MIN_AI_BASE_URL must be a valid URL');
  }
  
  if (config.ai.timeout < 10000) {
    warnings.push('AI_API_TIMEOUT is quite low, may cause timeouts');
  }
  
  // تحذيرات الاقتصاد
  if (config.generation.enableWebSearch && config.generation.webSearchOnlyForHighValue === false) {
    warnings.push('Web search enabled for all content - this may increase token usage significantly');
  }
  
  if (config.generation.maxWordsPerArticle > 2000) {
    warnings.push('Max words per article is high - consider reducing to save tokens');
  }
  
  // التحقق من صحة مفتاح API
  if (!config.ai.apiKey && !config.development.enableMockMode) {
    warnings.push('No AI API key provided and mock mode is disabled');
  }
  
  return { errors, warnings };
}

// دالة للحصول على إعدادات محسنة لميزانية معينة
export function getBudgetOptimizedSettings(remainingTokens, daysRemaining) {
  const dailyBudget = remainingTokens / Math.max(1, daysRemaining);
  const settings = { ...config };
  
  if (dailyBudget < 50000) { // أقل من 50k توكن يومياً
    settings.generation.maxBatchPerRun = Math.min(3, settings.generation.maxBatchPerRun);
    settings.generation.maxWordsPerArticle = 1200;
    settings.generation.enableWebSearch = false;
    settings.generation.premiumContentPercentage = 5;
  } else if (dailyBudget < 100000) { // أقل من 100k توكن يومياً
    settings.generation.maxBatchPerRun = Math.min(5, settings.generation.maxBatchPerRun);
    settings.generation.maxWordsPerArticle = 1400;
    settings.generation.enableWebSearch = false;
    settings.generation.premiumContentPercentage = 10;
  }
  
  return settings;
}

// Helper function للحصول على إعدادات اللغة
export function getLanguageConfig(languageCode) {
  return {
    ...config.languageSettings[languageCode] || config.languageSettings[config.defaultLanguage],
    trends: {
      geo: config.trends.regional[languageCode] || config.trends.geo,
      enabled: config.trends.priorityLanguages.includes(languageCode) || 
               config.trends.enableForLowPriorityLanguages
    }
  };
}

// Helper function للحصول على إعدادات الفئة
export function getCategoryConfig(categorySlug) {
  return config.categorySettings[categorySlug] || {
    priority: 7,
    targetPercentage: 5,
    avgRPM: 5.0,
    preferredModels: [config.ai.defaultTextModel],
    complexityBonus: 0,
    enableWebSearch: false,
    enablePremiumContent: false,
    competitiveness: 'low'
  };
}

// Helper function لحساب تكلفة مقدرة
export function calculateEstimatedMonthlyCost() {
  const dailyArticles = config.generation.dailyTarget;
  const avgTokensPerArticle = config.generation.estimatedTokensPerArticle;
  const monthlyTokens = dailyArticles * avgTokensPerArticle * 30;
  
  return {
    estimatedMonthlyTokens: monthlyTokens,
    tokenCapUtilization: (monthlyTokens / config.generation.monthlyTokenCap) * 100,
    isWithinBudget: monthlyTokens <= config.generation.monthlyTokenCap,
    dailyTokenBudget: config.generation.monthlyTokenCap / 30,
    recommendedDailyTarget: Math.floor((config.generation.monthlyTokenCap / 30) / avgTokensPerArticle)
  };
}

export default config;