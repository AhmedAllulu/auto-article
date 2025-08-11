import axios from 'axios';
import { config } from '../config.js';

const http = axios.create({
  baseURL: config.oneMinAI.baseUrl,
  headers: {
    Authorization: `Bearer ${config.oneMinAI.apiKey}`,
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

function buildMessagesPrompt({ system, user }) {
  return {
    model: config.oneMinAI.defaultModel,
    messages: [
      ...(system ? [{ role: 'system', content: system }] : []),
      { role: 'user', content: user },
    ],
    ...(config.oneMinAI.enableWebSearch ? { search: { enable: true } } : {}),
  };
}

export async function generateArticleWithSearch(system, user) {
  const body = buildMessagesPrompt({ system, user });
  const { data } = await http.post('/chat/completions', body);
  const content = data?.choices?.[0]?.message?.content || '';
  const usage = data?.usage || {};
  return { content, usage, model: data?.model || body.model };
}

export async function generateNoSearch(system, user) {
  const body = {
    ...buildMessagesPrompt({ system, user }),
  };
  // Ensure search disabled
  delete body.search;
  const { data } = await http.post('/chat/completions', body);
  const content = data?.choices?.[0]?.message?.content || '';
  const usage = data?.usage || {};
  return { content, usage, model: data?.model || body.model };
}


