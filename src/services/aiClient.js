import axios from 'axios';
import config from '../config/env.js';
import logger from '../lib/logger.js';

function roughTokenEstimate(text, languageCode) {
  if (!text) return 0;
  const length = text.length;
  const divisor = languageCode === 'ar' ? 2.5 : 4;
  return Math.ceil(length / divisor);
}

export async function generateArticleViaAPI({ prompt, languageCode }) {
  if (!config.ai.apiKey) {
    // Development fallback: generate mock content
    const mock = `This is a professional, SEO-focused article in ${languageCode}.\n\n` +
      'Introduction...\n\nKey Points:\n- Point 1\n- Point 2\n\nConclusion.';
    const title = 'Professional SEO Article';
    const tokensOut = roughTokenEstimate(mock, languageCode);
    const tokensIn = roughTokenEstimate(prompt, languageCode);
    return { title, content: mock, imageUrl: null, tokensIn, tokensOut, model: 'mock' };
  }

  try {
    const response = await axios.post(
      `${config.ai.baseUrl.replace(/\/$/, '')}/generate`,
      { prompt, language: languageCode },
      { headers: { Authorization: `Bearer ${config.ai.apiKey}` }, timeout: 60_000 }
    );
    const data = response.data || {};
    return {
      title: data.title || 'Untitled',
      content: data.content || '',
      imageUrl: data.imageUrl || null,
      tokensIn: Number(data.tokensIn || data.usage?.prompt_tokens || roughTokenEstimate(prompt, languageCode)),
      tokensOut: Number(data.tokensOut || data.usage?.completion_tokens || roughTokenEstimate(data.content || '', languageCode)),
      model: data.model || '1min-ai',
    };
  } catch (err) {
    logger.error({ err }, 'AI API call failed');
    throw err;
  }
}


