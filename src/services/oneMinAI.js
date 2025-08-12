import axios from 'axios';
import { config } from '../config.js';

const http = axios.create({
  baseURL: config.oneMinAI.baseUrl,
  headers: {
    'API-KEY': config.oneMinAI.apiKey,  // Changed from Authorization Bearer
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
    type: "CHAT_WITH_AI",  // Required by 1min.ai
    model: config.oneMinAI.defaultModel,
    promptObject: {
      prompt: combinePrompts(system, user),
      ...(enableWebSearch ? { 
        webSearch: true,
        numOfSite: 1,
        maxWord: 500 
      } : {}),
    },
  };
}

export async function generateArticleWithSearch(system, user) {
  const body = buildRequestBody({ system, user, enableWebSearch: true });
  // Prefer '/features'; if baseUrl already includes '/v1', this becomes '/v1/features'
  const { data } = await http.post('/features', body);
  
  // Response format may be different - need to verify actual response structure
  const content = data?.response?.text || data?.content || data?.result || '';
  const usage = data?.usage || {};
  return { content, usage, model: data?.model || body.model };
}

export async function generateNoSearch(system, user) {
  const body = buildRequestBody({ system, user, enableWebSearch: false });
  // Prefer '/features'; if baseUrl already includes '/v1', this becomes '/v1/features'
  const { data } = await http.post('/features', body);
  
  // Response format may be different - need to verify actual response structure
  const content = data?.response?.text || data?.content || data?.result || '';
  const usage = data?.usage || {};
  return { content, usage, model: data?.model || body.model };
}