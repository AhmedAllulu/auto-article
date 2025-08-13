import axios from 'axios';
import { config } from '../config.js';

const http = axios.create({
  baseURL: config.oneMinAI.baseUrl,
  headers: {
    'API-KEY': config.oneMinAI.apiKey,
    'Content-Type': 'application/json',
  },
  timeout: 120000,
});

function combinePrompts(system, user) {
  // Combine system and user prompts since 1min.ai doesn't use messages array
  const parts = [];
  if (system) parts.push(`System: ${system}`);
  if (user) parts.push(`User: ${user}`);
  return parts.join('\n\n');
}

function buildRequestBody({ system, user, enableWebSearch = false, model }) {
  return {
    type: "CHAT_WITH_AI",
    model: model || config.oneMinAI.defaultModel,
    promptObject: {
      prompt: combinePrompts(system, user),
      ...(enableWebSearch
        ? {
            webSearch: true,
            numOfSite: config.oneMinAI.webSearchNumSites,
            maxWord: config.oneMinAI.webSearchMaxWords,
          }
        : {}),
    },
  };
}

async function makeApiCall(requestBody) {
  try {
    const { data } = await http.post('/api/features', requestBody);
    // Extract content from 1min.ai response format
    const aiRecord = data?.aiRecord;
    if (!aiRecord || aiRecord.status !== 'SUCCESS') {
      throw new Error(`API call failed: ${aiRecord?.status || 'Unknown error'}`);
    }
    // Get the AI response from resultObject array
    const resultObject = aiRecord.aiRecordDetail?.resultObject;
    const content = Array.isArray(resultObject) ? resultObject.join('\n') : (resultObject || '');
    // Extract usage information (if available)
    const usage = {
      prompt_tokens: aiRecord.aiRecordDetail?.promptTokens || 0,
      completion_tokens: aiRecord.aiRecordDetail?.completionTokens || 0,
      total_tokens: aiRecord.aiRecordDetail?.totalTokens || 0,
    };
    const model = aiRecord.model || requestBody.model;
    return { content, usage, model };
  } catch (err) {
    const status = err?.response?.status;
    const body = err?.response?.data ? JSON.stringify(err.response.data).slice(0, 400) : '';
    const msg = `API call failed (${status || 'no-status'}): ${body || err?.message || 'Unknown error'}`;
    throw new Error(msg);
  }
}

export async function generateArticleWithSearch(system, user) {
  const body = buildRequestBody({ system, user, enableWebSearch: true });
  return await makeApiCall(body);
}

export async function generateNoSearch(system, user) {
  const body = buildRequestBody({ system, user, enableWebSearch: false });
  return await makeApiCall(body);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientError(err) {
  const code = err?.code || '';
  const status = err?.response?.status;
  return (
    code === 'ECONNABORTED' ||
    code === 'ETIMEDOUT' ||
    status === 429 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

export async function generateRobustArticle({ system, user, preferWebSearch = config.oneMinAI.enableWebSearch }) {
  const strategies = [];

  const defaultModel = config.oneMinAI.defaultModel;
  const fallbackModel = config.oneMinAI.fallbackModel;

  if (preferWebSearch) {
    strategies.push({ enableWebSearch: true, model: defaultModel });
    strategies.push({ enableWebSearch: true, model: fallbackModel });
    strategies.push({ enableWebSearch: false, model: defaultModel });
    strategies.push({ enableWebSearch: false, model: fallbackModel });
    // As last resorts, omit model to let API pick default
    strategies.push({ enableWebSearch: true, model: undefined });
    strategies.push({ enableWebSearch: false, model: undefined });
  } else {
    strategies.push({ enableWebSearch: false, model: defaultModel });
    strategies.push({ enableWebSearch: false, model: fallbackModel });
    strategies.push({ enableWebSearch: true, model: defaultModel });
    strategies.push({ enableWebSearch: true, model: fallbackModel });
    strategies.push({ enableWebSearch: false, model: undefined });
    strategies.push({ enableWebSearch: true, model: undefined });
  }

  let lastError;
  for (const strat of strategies) {
    try {
      const body = buildRequestBody({ system, user, enableWebSearch: strat.enableWebSearch, model: strat.model });
      return await makeApiCall(body);
    } catch (err) {
      lastError = err;
      if (isTransientError(err) || (err?.message || '').includes('no-status')) {
        // brief backoff and one retry for transient errors
        await delay(1000);
        try {
          const bodyRetry = buildRequestBody({ system, user, enableWebSearch: strat.enableWebSearch, model: strat.model });
          return await makeApiCall(bodyRetry);
        } catch (err2) {
          lastError = err2;
        }
      }
      // proceed to next strategy
    }
  }
  throw lastError || new Error('All generation strategies failed');
}
