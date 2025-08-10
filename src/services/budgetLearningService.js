import { getState, setState } from './persistentStateService.js';

const STATE_KEY = 'budgetLearning';
const MAX_SAMPLES = 50;

async function readState() {
  return (await getState(STATE_KEY, null)) || { models: {} };
}

async function writeState(s) {
  await setState(STATE_KEY, s);
}

function keyFor(contentType, languageCode) {
  return `${contentType}-${languageCode}`;
}

export async function updateEstimate(contentType, languageCode, estimated, actual) {
  const s = await readState();
  const key = keyFor(contentType, languageCode);
  const error = estimated > 0 ? (actual - estimated) / estimated : 0;
  if (!s.models[key]) s.models[key] = { samples: [], avgError: 0 };
  const data = s.models[key];
  data.samples.push(Number.isFinite(error) ? error : 0);
  if (data.samples.length > MAX_SAMPLES) data.samples.splice(0, data.samples.length - MAX_SAMPLES);
  data.avgError = data.samples.reduce((sum, e) => sum + e, 0) / data.samples.length;
  await writeState(s);
}

export async function getAdjustedEstimate(contentType, languageCode, baseEstimate) {
  const s = await readState();
  const key = keyFor(contentType, languageCode);
  const data = s.models[key];
  if (!data || !Array.isArray(data.samples) || data.samples.length < 5) return baseEstimate;
  const adjusted = Math.round(baseEstimate * (1 + data.avgError));
  return Math.max(200, adjusted); // guardrail
}


