import dotenv from 'dotenv';

dotenv.config();

const parseList = (value, fallback = []) => {
  if (!value || typeof value !== 'string') return fallback;
  return value
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
};

// Parse a weight map like: "en:1,de:0.9,fr:0.8"
const parseWeightMap = (value, fallback = {}) => {
  if (!value || typeof value !== 'string') return fallback;
  const result = {};
  for (const part of value.split(',')) {
    const [k, v] = part.split(':').map((s) => s.trim());
    if (!k) continue;
    const num = Number(v);
    result[k] = Number.isFinite(num) ? num : 0;
  }
  return result;
};

// Parse map of lists like: "en:US|GB|CA|AU,de:DE|AT|CH"
const parseMapOfLists = (value, fallback = {}) => {
  if (!value || typeof value !== 'string') return fallback;
  const result = {};
  for (const part of value.split(',')) {
    const [k, listStr] = part.split(':');
    const key = (k || '').trim();
    if (!key) continue;
    const list = String(listStr || '')
      .split('|')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    result[key] = list;
  }
  return result;
};

const parseBool = (v, d = false) => {
  if (v == null) return d;
  const s = String(v).trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'yes' || s === 'y' || s === 'on';
};

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3322),
  databaseUrl: process.env.DATABASE_URL,
  oneMinAI: {
    // Support multiple API keys for rotation: ONE_MIN_AI_API_KEY, ONE_MIN_AI_API_KEY_1, _2, _3...
    // Collect all keys in order, starting with unsuffixed then numeric suffix ascending
    apiKeys: (() => {
      const keys = [];
      // First, include unsuffixed key if provided
      if (process.env.ONE_MIN_AI_API_KEY) keys.push(process.env.ONE_MIN_AI_API_KEY);
      // Then collect sequentially numbered keys ONE_MIN_AI_API_KEY_1, _2, ...
      let idx = 1;
      while (true) {
        const val = process.env[`ONE_MIN_AI_API_KEY_${idx}`];
        if (!val) break;
        keys.push(val);
        idx += 1;
      }
      return keys.filter((k) => typeof k === 'string' && k.trim().length > 0);
    })(),
    // Preserve legacy single-key accessors for compatibility (first key or empty string)
    get apiKey() {
      return this.apiKeys[0] || '';
    },
    baseUrl: process.env.ONE_MIN_AI_BASE_URL || 'https://api.1min.ai',  // Updated base URL
    defaultModel: process.env.AI_DEFAULT_TEXT_MODEL || 'gpt-5-nano',
    fallbackModel: process.env.AI_FALLBACK_MODEL || 'mistral-nemo',
    premiumModel: process.env.AI_PREMIUM_MODEL || 'gpt-5-nano',
    enableWebSearch: parseBool(process.env.ENABLE_WEB_SEARCH, false),
    // Controls length and breadth when web search is enabled
    webSearchMaxWords: Number(process.env.AI_WEBSEARCH_MAX_WORDS || 1200),
    webSearchNumSites: Number(process.env.AI_WEBSEARCH_NUM_SITES || 2),
  },

  // ------------------------ OPENAI (used for translations) ------------------
  openAI: {
    // Support multiple API keys: OPENAI_API_KEY, OPENAI_API_KEY_1, _2, ...
    apiKeys: (() => {
      const keys = [];
      if (process.env.OPENAI_API_KEY) keys.push(process.env.OPENAI_API_KEY);
      let idx = 1;
      while (true) {
        const val = process.env[`OPENAI_API_KEY_${idx}`];
        if (!val) break;
        keys.push(val);
        idx += 1;
      }
      return keys.filter((k) => typeof k === 'string' && k.trim().length > 0);
    })(),
    get apiKey() {
      return this.apiKeys[0] || '';
    },
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com',
    defaultModel: process.env.OPENAI_DEFAULT_MODEL || 'gpt-5-nano',
  },
  generation: {
    enabled: parseBool(process.env.ENABLE_GENERATION, true),
    maxCategoriesPerRun: Number(process.env.MAX_CATEGORIES_PER_RUN || 3), // limit categories per run
    articlesPerCategoryPerDay: Number(process.env.ARTICLES_PER_CATEGORY_PER_DAY || 2), // 2 articles per category daily
    stopOnError: parseBool(process.env.STOP_ON_ERROR, true), // stop process on errors
    logRetentionDays: Number(process.env.LOG_RETENTION_DAYS || 10), // log cleanup period
  },
  translation: {
    // Default chunk count for translations (1-10, or 0 for automatic chunking)
    // Can be overridden by the maxChunks parameter in API requests
    defaultChunkCount: (() => {
      const value = Number(process.env.TRANSLATION_DEFAULT_CHUNK_COUNT || 1);
      if (value === 0) return 0; // 0 means automatic chunking
      if (value >= 1 && value <= 10) return value;
      console.warn(`Invalid TRANSLATION_DEFAULT_CHUNK_COUNT: ${process.env.TRANSLATION_DEFAULT_CHUNK_COUNT}. Using automatic chunking (0).`);
      return 0;
    })(),
  },
  seo: {
    canonicalBaseUrl: process.env.CANONICAL_BASE_URL || '',
    // SEO notification settings
    enableNotifications: parseBool(process.env.ENABLE_SEO_NOTIFICATIONS, true),
    failSilently: parseBool(process.env.SEO_FAIL_SILENTLY, true),
    // IndexNow API key for faster indexing
    indexNowKey: process.env.INDEXNOW_API_KEY || '',
  },
  languages: parseList(
    process.env.SUPPORTED_LANGUAGES || 'en,de,fr,es,pt,ar,hi'
  ),
  categoriesEnv: parseList(
    process.env.TOP_CATEGORIES || 'technology,finance,business,health,travel,sports,entertainment'
  ),
  unsplash: {
    accessKey: process.env.UNSPLASH_ACCESS_KEY || '',
  },
  https: {
    certPath: process.env.SSL_CERT_PATH || '',
    keyPath: process.env.SSL_KEY_PATH || '',
  },
  priorities: {
    // Base weights by language and country and category; used to choose what to generate first
    languages: parseWeightMap(
      process.env.PRIORITY_LANGUAGES_WEIGHTS || 'en:1,de:0.9,fr:0.85,es:0.85,pt:0.75,ar:0.7,hi:0.65'
    ),
    countries: parseWeightMap(
      process.env.PRIORITY_COUNTRIES_WEIGHTS || 'US:1,DE:0.95,GB:0.95,CA:0.9,FR:0.85,ES:0.8,BR:0.75,MX:0.7,AE:0.7,SA:0.7,IN:0.65,AU:0.8'
    ),
    categories: parseWeightMap(
      process.env.PRIORITY_CATEGORIES_WEIGHTS || 'technology:1,finance:1,business:0.95,health:0.9,travel:0.8,sports:0.7,entertainment:0.7'
    ),
    languageMarkets: parseMapOfLists(
      process.env.PRIORITY_LANGUAGE_MARKETS || 'en:US|GB|CA|AU,de:DE|AT|CH,fr:FR|CA,es:US|ES|MX,pt:BR|PT,ar:AE|SA,hi:IN'
    ),
  },
};

export const isProduction = config.env === 'production';