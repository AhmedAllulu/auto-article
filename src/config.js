import dotenv from 'dotenv';

dotenv.config();

const parseList = (value, fallback = []) => {
  if (!value || typeof value !== 'string') return fallback;
  return value
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
};

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3322),
  databaseUrl: process.env.DATABASE_URL,
  oneMinAI: {
    apiKey: process.env.ONE_MIN_AI_API_KEY || '',
    baseUrl: process.env.ONE_MIN_AI_BASE_URL || 'https://api.1min.ai/v1',
    defaultModel: process.env.AI_DEFAULT_TEXT_MODEL || 'gpt-4o-mini',
    fallbackModel: process.env.AI_FALLBACK_MODEL || 'mistral-nemo',
    premiumModel: process.env.AI_PREMIUM_MODEL || 'gpt-4o',
    enableWebSearch: String(process.env.ENABLE_WEB_SEARCH || 'true') === 'true',
  },
  generation: {
    dailyTarget: Number(process.env.DAILY_ARTICLE_TARGET || 100),
    maxBatchPerRun: Number(process.env.MAX_BATCH_PER_RUN || 6),
    cronSchedule: process.env.CRON_SCHEDULE || '*/15 * * * *',
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
};

export const isProduction = config.env === 'production';


