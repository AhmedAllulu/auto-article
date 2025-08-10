import { getState, setState, deleteStateKey } from './persistentStateService.js';

const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes

function now() {
  return Date.now();
}

export async function acquireLock(lockKey, ttlMs = DEFAULT_TTL_MS) {
  const key = `lock:${lockKey}`;
  const existing = await getState(key, null);
  const currentTime = now();
  if (existing && existing.expiresAt && existing.expiresAt > currentTime) {
    return false;
  }
  await setState(key, { acquiredAt: currentTime, expiresAt: currentTime + ttlMs });
  return true;
}

export async function renewLock(lockKey, ttlMs = DEFAULT_TTL_MS) {
  const key = `lock:${lockKey}`;
  const currentTime = now();
  await setState(key, { acquiredAt: currentTime, expiresAt: currentTime + ttlMs });
}

export async function releaseLock(lockKey) {
  const key = `lock:${lockKey}`;
  await deleteStateKey(key);
}

export async function withLock(lockKey, fn, ttlMs = DEFAULT_TTL_MS) {
  const acquired = await acquireLock(lockKey, ttlMs);
  if (!acquired) return { skipped: true };
  try {
    const result = await fn();
    return { skipped: false, result };
  } finally {
    await releaseLock(lockKey);
  }
}


