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

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3322),
  databaseUrl: process.env.DATABASE_URL,
  oneMinAI: {
    apiKey: process.env.ONE_MIN_AI_API_KEY || '',
    baseUrl: process.env.ONE_MIN_AI_BASE_URL || 'https://api.1min.ai',  // Updated base URL
    defaultModel: process.env.AI_DEFAULT_TEXT_MODEL || 'gpt-4o-mini',
    fallbackModel: process.env.AI_FALLBACK_MODEL || 'mistral-nemo',
    premiumModel: process.env.AI_PREMIUM_MODEL || 'gpt-4o',
    enableWebSearch: String(process.env.ENABLE_WEB_SEARCH || 'true') === 'true',
    // Controls length and breadth when web search is enabled
    webSearchMaxWords: Number(process.env.AI_WEBSEARCH_MAX_WORDS || 1200),
    webSearchNumSites: Number(process.env.AI_WEBSEARCH_NUM_SITES || 2),
  },
  generation: {
    enabled: String(process.env.ENABLE_GENERATION) === 'true',
    dailyTarget: Number(process.env.DAILY_ARTICLE_TARGET || 100),
    maxBatchPerRun: Number(process.env.MAX_BATCH_PER_RUN || 6),
    cronSchedule: process.env.CRON_SCHEDULE || '*/15 * * * *',
    maxTranslationsPerMaster: Number(process.env.MAX_TRANSLATIONS_PER_MASTER || 5),
    maxMastersPerRun: Number(process.env.MAX_MASTERS_PER_RUN || 14),
  },
  seo: {
    canonicalBaseUrl: process.env.CANONICAL_BASE_URL || '',
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