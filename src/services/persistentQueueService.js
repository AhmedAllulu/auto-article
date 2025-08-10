import { getState, setState } from './persistentStateService.js';

const QUEUE_KEY = 'generationQueue';

function dayKeyFromDate(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function initQueue() {
  const q = await getState(QUEUE_KEY, null);
  if (!q) {
    await setState(QUEUE_KEY, { items: [], cursor: 0, createdAt: Date.now(), dayKey: dayKeyFromDate() });
  }
}

export async function resetQueue(items, dayKey = dayKeyFromDate()) {
  await setState(QUEUE_KEY, { items, cursor: 0, createdAt: Date.now(), dayKey });
}

export async function appendToQueue(items) {
  const q = (await getState(QUEUE_KEY, { items: [], cursor: 0, dayKey: dayKeyFromDate() })) || { items: [], cursor: 0, dayKey: dayKeyFromDate() };
  q.items.push(...items);
  await setState(QUEUE_KEY, q);
}

export async function getQueueSnapshot() {
  const q = (await getState(QUEUE_KEY, { items: [], cursor: 0, dayKey: dayKeyFromDate() })) || { items: [], cursor: 0, dayKey: dayKeyFromDate() };
  return q;
}

export async function peekNextItem() {
  const q = (await getState(QUEUE_KEY, { items: [], cursor: 0, dayKey: dayKeyFromDate() })) || { items: [], cursor: 0, dayKey: dayKeyFromDate() };
  if (q.cursor >= q.items.length) return { done: true, value: null };
  const value = q.items[q.cursor];
  return { done: false, value, index: q.cursor };
}

export async function commitIndex(index) {
  const q = (await getState(QUEUE_KEY, { items: [], cursor: 0, dayKey: dayKeyFromDate() })) || { items: [], cursor: 0, dayKey: dayKeyFromDate() };
  if (index === q.cursor) {
    q.cursor += 1;
    await setState(QUEUE_KEY, q);
    return true;
  }
  return false;
}

export async function remainingItemsCount() {
  const q = (await getState(QUEUE_KEY, { items: [], cursor: 0, dayKey: dayKeyFromDate() })) || { items: [], cursor: 0, dayKey: dayKeyFromDate() };
  return Math.max(0, q.items.length - q.cursor);
}

export async function isForToday() {
  const q = await getQueueSnapshot();
  return q.dayKey === dayKeyFromDate();
}


