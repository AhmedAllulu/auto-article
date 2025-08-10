import { getState, setState } from './persistentStateService.js';

const STATE_KEY_PREFIX = 'trendsCB:';
const OPEN_THRESHOLD = 3; // failures
const HALF_OPEN_AFTER_MS = 5 * 60 * 1000; // 5 minutes

function now() { return Date.now(); }

async function readBreaker(langKey) {
  return (
    (await getState(`${STATE_KEY_PREFIX}${langKey}`, null)) || {
      failures: 0,
      lastFailureTime: 0,
      state: 'CLOSED'
    }
  );
}

async function writeBreaker(langKey, data) {
  await setState(`${STATE_KEY_PREFIX}${langKey}`, data);
}

export async function executeWithTrendsBreaker(languageCode, fn, getFallback) {
  const key = languageCode;
  const b = await readBreaker(key);
  const t = now();

  if (b.state === 'OPEN') {
    if (t - b.lastFailureTime > HALF_OPEN_AFTER_MS) {
      b.state = 'HALF_OPEN';
      await writeBreaker(key, b);
    } else {
      return await getFallback();
    }
  }

  try {
    const result = await fn();
    b.failures = 0;
    b.state = 'CLOSED';
    await writeBreaker(key, b);
    return result;
  } catch (err) {
    b.failures += 1;
    b.lastFailureTime = t;
    if (b.failures >= OPEN_THRESHOLD) b.state = 'OPEN';
    await writeBreaker(key, b);
    return await getFallback(err);
  }
}


