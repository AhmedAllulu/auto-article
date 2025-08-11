import axios from 'axios';
import pino from 'pino';
import { config } from '../config.js';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

function normalizeOneMinBaseUrl(inputUrl) {
  if (!inputUrl || typeof inputUrl !== 'string') return 'https://api.1min.ai/api';
  let url = inputUrl.trim();
  // remove trailing slashes
  url = url.replace(/\/+$/, '');
  // drop trailing /v1 if present
  url = url.replace(/\/v1$/, '');
  // ensure it ends with /api
  if (!/\/api$/.test(url)) url = url + '/api';
  return url;
}

function buildHttpClient() {
  if (!config.oneMinAI.apiKey) {
    const message = 'ONE_MIN_AI_API_KEY is missing';
    logger.error(message);
    throw new Error(message);
  }
  const configuredBase = config.oneMinAI.baseUrl;
  const normalizedBase = normalizeOneMinBaseUrl(configuredBase);
  if (normalizedBase !== configuredBase) {
    logger.warn({ configuredBase, normalizedBase }, 'Normalized ONE_MIN_AI base URL');
  }
  const headers = {
    'API-KEY': config.oneMinAI.apiKey,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  return axios.create({
    baseURL: normalizedBase,
    headers,
    timeout: 60000,
    validateStatus: () => true, // handle non-2xx explicitly
  });
}

function buildContentGeneratorPayload({ system, user }) {
  // Build payload for 1min.ai CONTENT_GENERATOR_BLOG_ARTICLE endpoint
  const parts = [];
  if (system) parts.push(`[System]\n${system}`);
  if (user) parts.push(`[User]\n${user}`);
  const prompt = parts.join('\n\n');
  return {
    type: 'CONTENT_GENERATOR_BLOG_ARTICLE',
    conversationId: 'CONTENT_GENERATOR_BLOG_ARTICLE',
    model: config.oneMinAI.defaultModel,
    promptObject: {
      language: 'English',
      tone: 'informative',
      numberOfWord: 900,
      numberOfSection: 6,
      keywords: '',
      prompt,
      ...(config.oneMinAI.enableWebSearch ? { web_search: true } : {}),
    },
  };
}

function buildChatPayload({ system, user }) {
  // Generic chat payload
  const parts = [];
  if (system) parts.push(`[System]\n${system}`);
  if (user) parts.push(`[User]\n${user}`);
  const prompt = parts.join('\n\n');
  return {
    type: 'CHAT_WITH_AI',
    model: config.oneMinAI.defaultModel,
    promptObject: {
      prompt,
      ...(config.oneMinAI.enableWebSearch ? { web_search: true } : {}),
    },
  };
}

export async function generateArticleWithSearch(system, user) {
  const http = buildHttpClient();
  const endpoints = ['/features'];
  const models = [config.oneMinAI.defaultModel, config.oneMinAI.fallbackModel].filter(Boolean);

  let lastError;
  for (const model of models) {
    const baseBody = buildChatPayload({ system, user });
    baseBody.model = model;
    for (const endpoint of endpoints) {
      try {
        const resp = await http.post(endpoint, baseBody);
        if (resp.status >= 200 && resp.status < 300) {
          const data = resp.data;
          const content = data?.data?.result || data?.result || data?.text || '';
          const usage = data?.usage || {};
          return { content, usage, model: baseBody.model };
        }
        if ((resp.status === 404 || resp.status === 400) && baseBody?.promptObject?.web_search) {
          const bodyNoSearch = { ...baseBody, promptObject: { ...baseBody.promptObject } };
          delete bodyNoSearch.promptObject.web_search;
          const retry = await http.post(endpoint, bodyNoSearch);
          if (retry.status >= 200 && retry.status < 300) {
            const data = retry.data;
            const content = data?.data?.result || data?.result || data?.text || '';
            const usage = data?.usage || {};
            return { content, usage, model: bodyNoSearch.model };
          }
          lastError = new Error(`AI API error ${retry.status}: ${JSON.stringify(retry.data)?.slice(0, 300)}`);
          logger.warn({ status: retry.status, endpoint, model, data: retry.data }, 'AI API retry without search failed');
          continue;
        }
        lastError = new Error(`AI API error ${resp.status}: ${JSON.stringify(resp.data)?.slice(0, 300)}`);
        logger.warn({ status: resp.status, endpoint, model, data: resp.data }, 'AI API non-2xx response');
      } catch (err) {
        lastError = err;
        logger.warn({ endpoint, model, err }, 'AI API request threw');
      }
    }
  }
  throw lastError || new Error('AI API request failed');
}

export async function generateNoSearch(system, user) {
  const http = buildHttpClient();
  const endpoints = ['/features'];
  const models = [config.oneMinAI.defaultModel, config.oneMinAI.fallbackModel].filter(Boolean);

  let lastError;
  for (const model of models) {
    const body = { ...buildChatPayload({ system, user }) };
    body.model = model;
    // ensure no web search for translation calls
    if (body?.promptObject?.web_search) delete body.promptObject.web_search;
    for (const endpoint of endpoints) {
      try {
        const resp = await http.post(endpoint, body);
        if (resp.status >= 200 && resp.status < 300) {
          const data = resp.data;
          const content = data?.data?.result || data?.result || data?.text || '';
          const usage = data?.usage || {};
          return { content, usage, model: body.model };
        }
        lastError = new Error(`AI API error ${resp.status}: ${JSON.stringify(resp.data)?.slice(0, 300)}`);
        logger.warn({ status: resp.status, endpoint, model, data: resp.data }, 'AI API non-2xx response');
      } catch (err) {
        lastError = err;
        logger.warn({ endpoint, model, err }, 'AI API request threw');
      }
    }
  }
  throw lastError || new Error('AI API request failed');
}


