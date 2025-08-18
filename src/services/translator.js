import { chatCompletion } from './openAI.js';
import { config } from '../config.js';

/**
 * Translate a plain-text chunk verbatim into target language.
 * Keeps markdown markers and inline formatting unchanged.
 * @param {string} lang Target language code (e.g. 'ar')
 * @param {string} text  The text to translate.
 * @returns {Promise<string>}  Translated text.
 */
export async function translateChunk(lang, text) {
  if (!text) return '';
  
  const trimmedText = text.trim();
  if (!trimmedText) return text;
  
  // Enhanced system prompt to ensure complete translation
  const { content } = await chatCompletion({
    system: `You are a professional translator. Translate the USER content into ${lang}. 
    
CRITICAL RULES:
- Translate EVERY WORD including proper nouns, technical terms, and all text
- Preserve markdown formatting (**, -, numbers, etc.) exactly
- Keep punctuation and structure identical
- Do NOT keep any English words unless they are URLs or code
- Output ONLY the translation, no explanations`,
    user: trimmedText,
    model: config.openAI.defaultModel,
  });
  
  // Preserve original spacing
  const leadingSpace = text.match(/^\s*/)[0];
  const trailingSpace = text.match(/\s*$/)[0];
  
  return leadingSpace + content.trim() + trailingSpace;
}

export default { translateChunk };
