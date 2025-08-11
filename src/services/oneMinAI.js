import axios from 'axios';
import pino from 'pino';
import { config } from '../config.js';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

function buildHttpClient() {
  if (!config.oneMinAI.apiKey) {
    const message = 'ONE_MIN_AI_API_KEY is missing';
    logger.error(message);
    throw new Error(message);
  }
  const headers = {
    Authorization: `Bearer ${config.oneMinAI.apiKey}`,
    'X-API-Key': config.oneMinAI.apiKey,
    'Content-Type': 'application/json',
  };
  return axios.create({
    baseURL: config.oneMinAI.baseUrl,
    headers,
    timeout: 60000,
    validateStatus: () => true, // handle non-2xx explicitly
  });
}

function buildMessagesPrompt({ system, user }) {
  // 1min.ai features endpoint expects a generic payload with type and promptObject
  // We will map our chat messages into a single prompt string
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
    const baseBody = buildMessagesPrompt({ system, user });
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
    const body = { ...buildMessagesPrompt({ system, user }) };
    body.model = model;
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


