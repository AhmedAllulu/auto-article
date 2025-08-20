import axios from 'axios';
import { config } from '../config.js';

// Collect API keys in order for rotation
const _apiKeys = (Array.isArray(config.openAI.apiKeys) && config.openAI.apiKeys.length)
  ? config.openAI.apiKeys
  : [config.openAI.apiKey];

let _currentIdx = 0;

function _createHttp(key) {
  return axios.create({
    baseURL: config.openAI.baseUrl,
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    timeout: 120000,
  });
}

let http = _createHttp(_apiKeys[_currentIdx]);

function _isQuotaError(err) {
  const status = err?.response?.status;
  if (status === 429 || status === 401 || status === 403) return true;
  return false;
}

function _isTokenLimitError(err) {
  const status = err?.response?.status;
  const message = err?.response?.data?.error?.message?.toLowerCase() || '';
  return status === 400 && (
    message.includes('context length') ||
    message.includes('token limit') ||
    message.includes('maximum context') ||
    message.includes('too many tokens')
  );
}

function _rotateKey(err) {
  if (_isQuotaError(err) && _currentIdx < _apiKeys.length - 1) {
    _currentIdx += 1;
    console.warn(`[openAI] Quota or auth error with key ${_currentIdx - 1}. Switching to key ${_currentIdx}.`);
    http = _createHttp(_apiKeys[_currentIdx]);
    return true;
  }
  return false;
}

export async function chatCompletion({ system, user, model = config.openAI.defaultModel, temperature = 0.8 }) {
  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  if (user) messages.push({ role: 'user', content: user });

  const body = {
    model,
    messages,
  };

  // GPT-5-nano only supports default temperature (1), don't pass custom temperature
  if (model !== 'gpt-5-nano') {
    body.temperature = temperature;
  }

  try {
    const { data } = await http.post('/v1/chat/completions', body);
    const content = data.choices?.[0]?.message?.content || '';
    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    return { content, usage, model: data.model || model };
  } catch (err) {
    // Check for token limit errors first (don't rotate keys for these)
    if (_isTokenLimitError(err)) {
      const msg = `Token limit exceeded: ${err?.response?.data?.error?.message || 'Content too long for model'}`;
      throw new Error(msg);
    }

    if (_rotateKey(err)) {
      return chatCompletion({ system, user, model, temperature });
    }

    const status = err?.response?.status;
    const bodySnippet = err?.response?.data ? JSON.stringify(err.response.data).slice(0, 400) : '';
    const msg = `OpenAI API error (${status || 'no-status'}): ${bodySnippet || err?.message || 'Unknown error'}`;
    throw new Error(msg);
  }
}
