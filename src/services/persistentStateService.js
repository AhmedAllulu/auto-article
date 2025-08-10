import fs from 'fs/promises';
import path from 'path';

const RUNTIME_DIR = path.resolve(process.cwd(), '.runtime');
const STATE_FILE = path.join(RUNTIME_DIR, 'persistent_state.json');

async function ensureRuntimeFile() {
  try {
    await fs.mkdir(RUNTIME_DIR, { recursive: true });
  } catch {}
  try {
    await fs.access(STATE_FILE);
  } catch {
    await fs.writeFile(STATE_FILE, JSON.stringify({}, null, 2), 'utf8');
  }
}

async function readAllState() {
  await ensureRuntimeFile();
  const raw = await fs.readFile(STATE_FILE, 'utf8');
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    // If file is corrupted, back it up and start fresh
    const backupPath = STATE_FILE.replace(/\.json$/, `.bak-${Date.now()}.json`);
    try { await fs.writeFile(backupPath, raw, 'utf8'); } catch {}
    return {};
  }
}

async function writeAllState(state) {
  await ensureRuntimeFile();
  const tmpPath = STATE_FILE + '.tmp';
  await fs.writeFile(tmpPath, JSON.stringify(state, null, 2), 'utf8');
  await fs.rename(tmpPath, STATE_FILE);
}

export async function getState(key, defaultValue = null) {
  const state = await readAllState();
  return Object.prototype.hasOwnProperty.call(state, key) ? state[key] : defaultValue;
}

export async function setState(key, value) {
  const state = await readAllState();
  state[key] = value;
  await writeAllState(state);
}

export async function deleteStateKey(key) {
  const state = await readAllState();
  if (Object.prototype.hasOwnProperty.call(state, key)) {
    delete state[key];
    await writeAllState(state);
  }
}

export async function clearAllState() {
  await writeAllState({});
}


