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
  port: getEnvNumber('PORT', 8080),
  
  // Database configuration
  databaseUrl: process.env.DATABASE_URL || 
    'postgres://postgres:postgres@localhost:5432/auto_article',
  
  // Rate limiting configuration
  rateLimit: {
    points: getEnvNumber('RATE_LIMIT_POINTS', 300),
    duration: getEnvNumber('RATE_LIMIT_DURATION', 60),
    skipSuccessfulRequests: getEnvBoolean('RATE_LIMIT_SKIP_SUCCESS', true),
    skipFailedRequests: getEnvBoolean('RATE_LIMIT_SKIP_FAILED', false),
  },
  
  // AI Service Configuration (1min.ai)
  ai: {
    apiKey: process.env.ONE_MIN_AI_API_KEY || '',
    baseUrl: (process.env.ONE_MIN_AI_BASE_URL || 'https://api.1min.ai').replace(/\/$/, ''),
    timeout: getEnvNumber('AI_API_TIMEOUT', 120000), // 2 minutes default
    maxRetries: getEnvNumber('AI_API_MAX_RETRIES', 2),
    retryDelay: getEnvNumber('AI_API_RETRY_DELAY', 5000), // 5 seconds
    
    // Model preferences by use case
    defaultTextModel: process.env.AI_DEFAULT_TEXT_MODEL || 'gpt-4o',
    defaultImageModel: process.env.AI_DEFAULT_IMAGE_MODEL || 'midjourney',
    fallbackModel: process.env.AI_FALLBACK_MODEL || 'gpt-4o-mini',
  },
  
  // Enhanced Article Generation Configuration
  generation: {
    // Basic generation settings
    dailyTarget: getEnvNumber('DAILY_ARTICLE_TARGET', 100),
    monthlyTokenCap: getEnvNumber('MONTHLY_TOKEN_CAP', 4_000_000),
    maxBatchPerRun: getEnvNumber('MAX_BATCH_PER_RUN', 8),
    schedule: process.env.CRON_SCHEDULE || '*/15 * * * *', // Every 15 minutes
    
    // Content generation settings
    enableWebSearch: getEnvBoolean('ENABLE_WEB_SEARCH', true),
    generateImages: getEnvBoolean('GENERATE_IMAGES', false),
    maxWordsPerArticle: getEnvNumber('MAX_WORDS_PER_ARTICLE', 2000),
    minWordsPerArticle: getEnvNumber('MIN_WORDS_PER_ARTICLE', 800),
    estimatedTokensPerArticle: getEnvNumber('ESTIMATED_TOKENS_PER_ARTICLE', 3000),
    
    // Quality and variety settings
    contentVariety: {
      seoArticleWeight: getEnvNumber('SEO_ARTICLE_WEIGHT', 40), // 40%
      newsArticleWeight: getEnvNumber('NEWS_ARTICLE_WEIGHT', 25), // 25%
      blogPostWeight: getEnvNumber('BLOG_POST_WEIGHT', 20), // 20%
      technicalGuideWeight: getEnvNumber('TECHNICAL_GUIDE_WEIGHT', 15), // 15%
    },
    
    // Advanced generation features
    enableTrendBasedTopics: getEnvBoolean('ENABLE_TREND_BASED_TOPICS', true),
    enableTimeBasedStrategy: getEnvBoolean('ENABLE_TIME_BASED_STRATEGY', true),
    enableCategoryRotation: getEnvBoolean('ENABLE_CATEGORY_ROTATION', true),
    enableLanguageBalancing: getEnvBoolean('ENABLE_LANGUAGE_BALANCING', true),
    
    // Content quality settings
    requireMinReadingTime: getEnvNumber('MIN_READING_TIME_MINUTES', 3),
    requireMaxReadingTime: getEnvNumber('MAX_READING_TIME_MINUTES', 15),
    enableContentValidation: getEnvBoolean('ENABLE_CONTENT_VALIDATION', true),
    enableDuplicateDetection: getEnvBoolean('ENABLE_DUPLICATE_DETECTION', true),
  },
  
  // Language Configuration
  languages: getEnvArray('SUPPORTED_LANGUAGES', 'en,es,de,fr,ar,hi,pt'),
  defaultLanguage: process.env.DEFAULT_LANGUAGE || 'en',
  
  // Language-specific settings
  languageSettings: {
    'en': { 
      priority: getEnvNumber('EN_PRIORITY', 1),
      targetPercentage: getEnvNumber('EN_TARGET_PERCENTAGE', 30),
      complexity: process.env.EN_COMPLEXITY || 'medium'
    },
    'es': { 
      priority: getEnvNumber('ES_PRIORITY', 1),
      targetPercentage: getEnvNumber('ES_TARGET_PERCENTAGE', 20),
      complexity: process.env.ES_COMPLEXITY || 'medium'
    },
    'de': { 
      priority: getEnvNumber('DE_PRIORITY', 1),
      targetPercentage: getEnvNumber('DE_TARGET_PERCENTAGE', 15),
      complexity: process.env.DE_COMPLEXITY || 'high'
    },
    'fr': { 
      priority: getEnvNumber('FR_PRIORITY', 1),
      targetPercentage: getEnvNumber('FR_TARGET_PERCENTAGE', 15),
      complexity: process.env.FR_COMPLEXITY || 'medium'
    },
    'ar': { 
      priority: getEnvNumber('AR_PRIORITY', 1),
      targetPercentage: getEnvNumber('AR_TARGET_PERCENTAGE', 10),
      complexity: process.env.AR_COMPLEXITY || 'medium'
    },
    'hi': { 
      priority: getEnvNumber('HI_PRIORITY', 1),
      targetPercentage: getEnvNumber('HI_TARGET_PERCENTAGE', 5),
      complexity: process.env.HI_COMPLEXITY || 'medium'
    },
    'pt': { 
      priority: getEnvNumber('PT_PRIORITY', 1),
      targetPercentage: getEnvNumber('PT_TARGET_PERCENTAGE', 5),
      complexity: process.env.PT_COMPLEXITY || 'medium'
    },
  },
  
  // Category Configuration
  topCategories: getEnvArray('TOP_CATEGORIES', 'technology,finance,health,sports,entertainment,travel,business'),
  
  // Category-specific settings
  categorySettings: {
    'technology': {
      priority: getEnvNumber('TECH_PRIORITY', 1),
      targetPercentage: getEnvNumber('TECH_TARGET_PERCENTAGE', 25),
      preferredModels: getEnvArray('TECH_PREFERRED_MODELS', 'claude-sonnet-4,gpt-4o'),
      complexityBonus: getEnvNumber('TECH_COMPLEXITY_BONUS', 0.2)
    },
    'finance': {
      priority: getEnvNumber('FINANCE_PRIORITY', 1),
      targetPercentage: getEnvNumber('FINANCE_TARGET_PERCENTAGE', 20),
      preferredModels: getEnvArray('FINANCE_PREFERRED_MODELS', 'gpt-4o,claude-opus-4'),
      complexityBonus: getEnvNumber('FINANCE_COMPLEXITY_BONUS', 0.1)
    },
    'health': {
      priority: getEnvNumber('HEALTH_PRIORITY', 1),
      targetPercentage: getEnvNumber('HEALTH_TARGET_PERCENTAGE', 15),
      preferredModels: getEnvArray('HEALTH_PREFERRED_MODELS', 'claude-sonnet-4,gemini-2.5'),
      complexityBonus: getEnvNumber('HEALTH_COMPLEXITY_BONUS', 0)
    },
    'sports': {
      priority: getEnvNumber('SPORTS_PRIORITY', 1),
      targetPercentage: getEnvNumber('SPORTS_TARGET_PERCENTAGE', 10),
      preferredModels: getEnvArray('SPORTS_PREFERRED_MODELS', 'gpt-4o-mini,gpt-4o'),
      complexityBonus: getEnvNumber('SPORTS_COMPLEXITY_BONUS', -0.1)
    },
    'entertainment': {
      priority: getEnvNumber('ENTERTAINMENT_PRIORITY', 1),
      targetPercentage: getEnvNumber('ENTERTAINMENT_TARGET_PERCENTAGE', 10),
      preferredModels: getEnvArray('ENTERTAINMENT_PREFERRED_MODELS', 'gpt-4o,claude-sonnet-4'),
      complexityBonus: getEnvNumber('ENTERTAINMENT_COMPLEXITY_BONUS', -0.1)
    },
    'travel': {
      priority: getEnvNumber('TRAVEL_PRIORITY', 1),
      targetPercentage: getEnvNumber('TRAVEL_TARGET_PERCENTAGE', 10),
      preferredModels: getEnvArray('TRAVEL_PREFERRED_MODELS', 'gemini-2.5,gpt-4o'),
      complexityBonus: getEnvNumber('TRAVEL_COMPLEXITY_BONUS', 0)
    },
    'business': {
      priority: getEnvNumber('BUSINESS_PRIORITY', 1),
      targetPercentage: getEnvNumber('BUSINESS_TARGET_PERCENTAGE', 10),
      preferredModels: getEnvArray('BUSINESS_PREFERRED_MODELS', 'claude-opus-4,gpt-4o'),
      complexityBonus: getEnvNumber('BUSINESS_COMPLEXITY_BONUS', 0.2)
    },
  },
  
  // Google Trends Configuration
  trends: {
    enabled: getEnvBoolean('TRENDS_ENABLED', true),
    geo: process.env.TRENDS_GEO || '', // Global by default
    timeRange: process.env.TRENDS_TIME_RANGE || 'now 1-d',
    categoryId: getEnvNumber('TRENDS_CATEGORY_ID', 0), // All categories
    maxTrendsPerCategory: getEnvNumber('MAX_TRENDS_PER_CATEGORY', 3),
    cacheTtlMinutes: getEnvNumber('TRENDS_CACHE_TTL_MINUTES', 60),
    enableFallback: getEnvBoolean('TRENDS_ENABLE_FALLBACK', true),
    
    // Regional trend settings
    regional: {
      'en': process.env.TRENDS_GEO_EN || 'US',
      'es': process.env.TRENDS_GEO_ES || 'ES',
      'de': process.env.TRENDS_GEO_DE || 'DE',
      'fr': process.env.TRENDS_GEO_FR || 'FR',
      'ar': process.env.TRENDS_GEO_AR || 'SA',
      'hi': process.env.TRENDS_GEO_HI || 'IN',
      'pt': process.env.TRENDS_GEO_PT || 'BR',
    },
  },
  
  // SEO and Content Optimization
  seo: {
    enableAdvancedSeo: getEnvBoolean('ENABLE_ADVANCED_SEO', true),
    generateMetaDescriptions: getEnvBoolean('GENERATE_META_DESCRIPTIONS', true),
    generateOpenGraphTags: getEnvBoolean('GENERATE_OPEN_GRAPH_TAGS', true),
    generateTwitterCards: getEnvBoolean('GENERATE_TWITTER_CARDS', true),
    enableSchemaMarkup: getEnvBoolean('ENABLE_SCHEMA_MARKUP', true),
    
    // Title optimization
    maxTitleLength: getEnvNumber('MAX_TITLE_LENGTH', 60),
    minTitleLength: getEnvNumber('MIN_TITLE_LENGTH', 30),
    enableTitleOptimization: getEnvBoolean('ENABLE_TITLE_OPTIMIZATION', true),
    
    // Meta description optimization
    maxMetaDescriptionLength: getEnvNumber('MAX_META_DESCRIPTION_LENGTH', 160),
    minMetaDescriptionLength: getEnvNumber('MIN_META_DESCRIPTION_LENGTH', 120),
    
    // Slug optimization
    maxSlugLength: getEnvNumber('MAX_SLUG_LENGTH', 100),
    enableSlugOptimization: getEnvBoolean('ENABLE_SLUG_OPTIMIZATION', true),
  },
  
  // Image Configuration
  images: {
    enabled: getEnvBoolean('IMAGES_ENABLED', false),
    defaultAspectRatio: process.env.IMAGE_ASPECT_RATIO || '16:9',
    defaultQuality: process.env.IMAGE_QUALITY || 'high',
    maxRetries: getEnvNumber('IMAGE_MAX_RETRIES', 2),
    fallbackImage: process.env.FALLBACK_IMAGE_URL || null,
    enableImageOptimization: getEnvBoolean('ENABLE_IMAGE_OPTIMIZATION', true),
  },
  
  // Monitoring and Analytics
  monitoring: {
    enableDetailedLogging: getEnvBoolean('ENABLE_DETAILED_LOGGING', true),
    logLevel: process.env.LOG_LEVEL || 'info',
    enableMetrics: getEnvBoolean('ENABLE_METRICS', true),
    enableHealthCheck: getEnvBoolean('ENABLE_HEALTH_CHECK', true),
    
    // Performance monitoring
    enablePerformanceTracking: getEnvBoolean('ENABLE_PERFORMANCE_TRACKING', true),
    slowQueryThreshold: getEnvNumber('SLOW_QUERY_THRESHOLD_MS', 200),
    slowGenerationThreshold: getEnvNumber('SLOW_GENERATION_THRESHOLD_MS', 30000),
    
    // Error tracking
    enableErrorReporting: getEnvBoolean('ENABLE_ERROR_REPORTING', true),
    errorReportingWebhook: process.env.ERROR_REPORTING_WEBHOOK || null,
  },
  
  // Feature Flags
  features: {
    enableExperimentalModels: getEnvBoolean('ENABLE_EXPERIMENTAL_MODELS', false),
    enableA11yOptimization: getEnvBoolean('ENABLE_A11Y_OPTIMIZATION', true),
    enableMultimodalContent: getEnvBoolean('ENABLE_MULTIMODAL_CONTENT', false),
    enableContentVersioning: getEnvBoolean('ENABLE_CONTENT_VERSIONING', false),
    enableAutoTranslation: getEnvBoolean('ENABLE_AUTO_TRANSLATION', false),
    enableContentRecommendations: getEnvBoolean('ENABLE_CONTENT_RECOMMENDATIONS', false),
  },
  
  // Development and Testing
  development: {
    enableMockMode: getEnvBoolean('ENABLE_MOCK_MODE', !process.env.ONE_MIN_AI_API_KEY),
    enableTestGeneration: getEnvBoolean('ENABLE_TEST_GENERATION', false),
    mockContentQuality: process.env.MOCK_CONTENT_QUALITY || 'high',
    enableDebugMode: getEnvBoolean('ENABLE_DEBUG_MODE', false),
  }
});

// Validation functions
export function validateConfig() {
  const errors = [];
  
  // Validate required settings
  if (config.generation.dailyTarget <= 0) {
    errors.push('DAILY_ARTICLE_TARGET must be greater than 0');
  }
  
  if (config.generation.monthlyTokenCap <= 0) {
    errors.push('MONTHLY_TOKEN_CAP must be greater than 0');
  }
  
  if (config.languages.length === 0) {
    errors.push('At least one language must be supported');
  }
  
  if (config.topCategories.length === 0) {
    errors.push('At least one category must be configured');
  }
  
  // Validate language percentages don't exceed 100%
  const totalLanguagePercentage = Object.values(config.languageSettings)
    .reduce((sum, settings) => sum + settings.targetPercentage, 0);
  
  if (totalLanguagePercentage > 100) {
    errors.push(`Language target percentages sum to ${totalLanguagePercentage}%, which exceeds 100%`);
  }
  
  // Validate category percentages don't exceed 100%
  const totalCategoryPercentage = Object.values(config.categorySettings)
    .reduce((sum, settings) => sum + settings.targetPercentage, 0);
  
  if (totalCategoryPercentage > 100) {
    errors.push(`Category target percentages sum to ${totalCategoryPercentage}%, which exceeds 100%`);
  }
  
  // Validate AI configuration
  if (!config.ai.baseUrl || !config.ai.baseUrl.startsWith('http')) {
    errors.push('ONE_MIN_AI_BASE_URL must be a valid URL');
  }
  
  if (config.ai.timeout < 10000) {
    errors.push('AI_API_TIMEOUT should be at least 10 seconds (10000ms)');
  }
  
  return errors;
}

// Helper function to get language-specific configuration
export function getLanguageConfig(languageCode) {
  return {
    ...config.languageSettings[languageCode] || config.languageSettings[config.defaultLanguage],
    trends: {
      geo: config.trends.regional[languageCode] || config.trends.geo
    }
  };
}

// Helper function to get category-specific configuration
export function getCategoryConfig(categorySlug) {
  return config.categorySettings[categorySlug] || {
    priority: 1,
    targetPercentage: 10,
    preferredModels: [config.ai.defaultTextModel],
    complexityBonus: 0
  };
}

export default config;