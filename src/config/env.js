import dotenv from 'dotenv';

dotenv.config();

const getEnvArray = (name, fallbackCsv) => {
  const raw = process.env[name] || fallbackCsv;
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

export const config = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: (process.env.NODE_ENV || 'development') === 'production',
  port: process.env.PORT ? Number(process.env.PORT) : 8080,
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgres://postgres:postgres@localhost:5432/auto_article',
  rateLimit: {
    points: process.env.RATE_LIMIT_POINTS
      ? Number(process.env.RATE_LIMIT_POINTS)
      : 300,
    duration: process.env.RATE_LIMIT_DURATION
      ? Number(process.env.RATE_LIMIT_DURATION)
      : 60,
  },
  ai: {
    apiKey: process.env.ONE_MIN_AI_API_KEY || '',
    baseUrl: process.env.ONE_MIN_AI_BASE_URL || 'https://api.1min.ai',
  },
  generation: {
    dailyTarget: process.env.DAILY_ARTICLE_TARGET
      ? Number(process.env.DAILY_ARTICLE_TARGET)
      : 100,
    monthlyTokenCap: process.env.MONTHLY_TOKEN_CAP
      ? Number(process.env.MONTHLY_TOKEN_CAP)
      : 4_000_000,
    maxBatchPerRun: process.env.MAX_BATCH_PER_RUN
      ? Number(process.env.MAX_BATCH_PER_RUN)
      : 8,
    schedule: process.env.CRON_SCHEDULE || '*/15 * * * *',
  },
  languages: getEnvArray(
    'SUPPORTED_LANGUAGES',
    'en,es,de,fr,ar,hi,pt'
  ),
  topCategories: getEnvArray(
    'TOP_CATEGORIES',
    'technology,finance,health,sports,entertainment,travel,business'
  ),
  trends: {
    geo: process.env.TRENDS_GEO || '',
    timeRange: process.env.TRENDS_TIME_RANGE || 'now 1-d',
    categoryId: process.env.TRENDS_CATEGORY_ID
      ? Number(process.env.TRENDS_CATEGORY_ID)
      : 0,
  },
});

export default config;


