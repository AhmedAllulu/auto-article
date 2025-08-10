import { getState, setState } from './persistentStateService.js';

let started = false;

function dayKeyFromDate(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function cleanBudgetLearning() {
  const s = (await getState('budgetLearning', null)) || null;
  if (!s || !s.models) return;
  let changed = false;
  for (const [k, v] of Object.entries(s.models)) {
    if (!Array.isArray(v.samples)) { delete s.models[k]; changed = true; continue; }
    if (v.samples.length > 50) { v.samples = v.samples.slice(-50); changed = true; }
    v.avgError = v.samples.length ? v.samples.reduce((a, b) => a + b, 0) / v.samples.length : 0;
  }
  if (changed) await setState('budgetLearning', s);
}

async function cleanTrendsCache() {
  const current = dayKeyFromDate();
  const cache = (await getState('aiTrendsCache', null)) || null;
  if (!cache) return;
  if (cache.dayKey !== current) {
    await setState('aiTrendsCache', { dayKey: current, entries: {} });
  } else {
    // cap entries
    const keys = Object.keys(cache.entries || {});
    if (keys.length > 200) {
      const trimmed = {};
      for (const k of keys.slice(-200)) trimmed[k] = cache.entries[k];
      await setState('aiTrendsCache', { dayKey: cache.dayKey, entries: trimmed });
    }
  }
}

export function startCacheMaintenance() {
  if (started) return;
  started = true;
  setInterval(async () => {
    try {
      await cleanBudgetLearning();
      await cleanTrendsCache();
      if (global.gc) { try { global.gc(); } catch {} }
    } catch {}
  }, 30 * 60 * 1000);
}


