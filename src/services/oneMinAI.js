import axios from 'axios';
import { config } from '../config.js';

const http = axios.create({
  baseURL: config.oneMinAI.baseUrl,
  headers: {
    'API-KEY': config.oneMinAI.apiKey,
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

function combinePrompts(system, user) {
  // Combine system and user prompts since 1min.ai doesn't use messages array
  const parts = [];
  if (system) parts.push(`System: ${system}`);
  if (user) parts.push(`User: ${user}`);
  return parts.join('\n\n');
}

function buildRequestBody({ system, user, enableWebSearch = false }) {
  return {
    type: "CHAT_WITH_AI",
    model: config.oneMinAI.defaultModel,
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
    total_tokens: aiRecord.aiRecordDetail?.totalTokens || 0
  };
  
  const model = aiRecord.model || requestBody.model;
  
  return { content, usage, model };
}

export async function generateArticleWithSearch(system, user) {
  const body = buildRequestBody({ system, user, enableWebSearch: true });
  return await makeApiCall(body);
}

export async function generateNoSearch(system, user) {
  const body = buildRequestBody({ system, user, enableWebSearch: false });
  return await makeApiCall(body);
}
