import googleTrends from 'google-trends-api';
import config from '../config/env.js';
import logger from '../lib/logger.js';

const categoryKeywords = {
  technology: ['AI', 'smartphone', 'cloud', 'software', 'startup'],
  finance: ['stocks', 'crypto', 'investing', 'interest rates', 'forex'],
  health: ['nutrition', 'fitness', 'mental health', 'wellness', 'disease'],
  sports: ['football', 'basketball', 'tennis', 'cricket', 'Olympics'],
  entertainment: ['movie', 'series', 'music', 'celebrity', 'streaming'],
  travel: ['flights', 'hotels', 'destinations', 'visa', 'tourism'],
  business: ['startup', 'entrepreneur', 'marketing', 'ecommerce', 'SaaS'],
};

async function fetchTrendsForKeyword(keyword, languageCode) {
  try {
    const results = await googleTrends.relatedQueries({
      keyword,
      hl: languageCode,
      geo: config.trends.geo,
      category: config.trends.categoryId,
      timeframe: config.trends.timeRange,
    });
    const parsed = JSON.parse(results);
    const top = parsed?.default?.rankedList?.[0]?.rankedKeyword || [];
    return top.slice(0, 5).map((k) => k.query);
  } catch (err) {
    logger.warn({ err, keyword, languageCode }, 'Google Trends fetch failed');
    return [];
  }
}

export async function getTrendingTopics({ languageCode, maxPerCategory = 2 }) {
  const topics = [];
  for (const category of config.topCategories) {
    const baseKeywords = categoryKeywords[category] || [category];
    const related = await fetchTrendsForKeyword(baseKeywords[0], languageCode);
    const pool = related.length ? related : baseKeywords;
    for (let i = 0; i < Math.min(maxPerCategory, pool.length); i += 1) {
      topics.push({ category, topic: pool[i] });
    }
  }
  return topics;
}


