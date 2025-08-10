import { getState, setState } from './persistentStateService.js';
import config from '../config/env.js';
import { executeWithTrendsBreaker } from './trendsCircuitBreakerService.js';
import { discoverTrendingTopicsWithAI } from './trendsService.js';

function dayKeyFromDate(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const CACHE_KEY = 'aiTrendsCache';

async function readCache() {
  return (await getState(CACHE_KEY, null)) || { dayKey: dayKeyFromDate(), entries: {} };
}

async function writeCache(cache) {
  await setState(CACHE_KEY, cache);
}

function signature(languageCode, categories, maxPerCategory) {
  const cats = (categories || []).slice().sort().join(',');
  return `${languageCode}|${cats}|${maxPerCategory || 3}`;
}

export async function getTrendsWithResilience({ languageCode, categories = [], maxPerCategory = 3 }) {
  if (!config.trends.enabled || !config.features?.enableGeneration) {
    return [];
  }
  const currentDay = dayKeyFromDate();
  let cache = await readCache();
  if (cache.dayKey !== currentDay) {
    cache = { dayKey: currentDay, entries: {} };
    await writeCache(cache);
  }
  const key = signature(languageCode, categories, maxPerCategory);
  const cached = cache.entries[key];
  if (cached && Array.isArray(cached.data)) {
    return cached.data;
  }

  const result = await executeWithTrendsBreaker(
    languageCode,
    async () => {
      const data = await discoverTrendingTopicsWithAI({ languageCode, maxPerCategory, categories });
      cache.entries[key] = { data, ts: Date.now() };
      await writeCache(cache);
      return data;
    },
    async () => {
      // fallback: empty array
      return [];
    }
  );
  return result;
}


