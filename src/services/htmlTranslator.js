import { chatCompletion } from './openAI.js';
import { config } from '../config.js';

/**
 * Simple HTMLTranslator - Clean and straightforward translation service
 */
export class HTMLTranslator {
  constructor(targetLang, options = {}) {
    this.targetLang = targetLang;

    // Apply config default if maxChunks is not specified
    if (options.maxChunks === undefined) {
      options.maxChunks = config.translation.defaultChunkCount;
    }

    this.options = options;
    this._promptTokens = 0;
    this._completionTokens = 0;
  }

  /**
   * Get token usage statistics
   */
  getTokenStats() {
    return {
      input: this._promptTokens,
      output: this._completionTokens,
      total: this._promptTokens + this._completionTokens
    };
  }

  /**
   * Reset token counters
   */
  resetTokenStats() {
    this._promptTokens = 0;
    this._completionTokens = 0;
  }

  /**
   * Main translation method - translates HTML content
   */
  async translateHTML(htmlContent) {
    if (!htmlContent || htmlContent.trim() === '') {
      return '';
    }

    // Check if manual chunking is specified
    const { maxChunks } = this.options;

    if (maxChunks && maxChunks > 0) {
      // Manual chunking: split into exactly the specified number of chunks
      return await this.translateWithManualChunking(htmlContent, maxChunks);
    } else {
      // Automatic chunking based on token limits (maxChunks = 0 or undefined)
      return await this.translateWithAutomaticChunking(htmlContent);
    }
  }

  /**
   * Translate with automatic chunking based on token limits
   */
  async translateWithAutomaticChunking(htmlContent) {
    // Simple token estimation
    const estimateTokens = (str) => Math.ceil(str.length / 4);
    const totalTokens = estimateTokens(htmlContent);

    // Conservative token limit
    const MAX_TOKENS = 3000;

    if (totalTokens <= MAX_TOKENS) {
      // Single translation
      return await this.translateChunk(htmlContent);
    } else {
      // Split into smaller chunks
      const chunks = this.splitIntoChunks(htmlContent, MAX_TOKENS);
      const translatedChunks = [];

      for (const chunk of chunks) {
        const translated = await this.translateChunk(chunk);
        translatedChunks.push(translated);
      }

      return translatedChunks.join('');
    }
  }

  /**
   * Translate with manual chunking - split into exactly the specified number of chunks
   */
  async translateWithManualChunking(htmlContent, maxChunks) {
    if (maxChunks === 1) {
      // Single chunk - translate everything at once
      return await this.translateChunk(htmlContent);
    }

    // Split content into exactly maxChunks parts
    const chunks = this.splitIntoFixedChunks(htmlContent, maxChunks);
    const translatedChunks = [];

    for (const chunk of chunks) {
      const translated = await this.translateChunk(chunk);
      translatedChunks.push(translated);
    }

    return translatedChunks.join('');
  }

  /**
   * Translate a single chunk of HTML content
   */
  async translateChunk(htmlChunk) {
    try {
      const { content: translated, usage } = await chatCompletion({
        system: `You are a professional native-speaker translator specializing in natural, human-like translations. Translate the USER HTML into ${this.targetLang}.

CRITICAL REQUIREMENTS:
• Preserve ALL HTML tags, attributes, and structure exactly
• Translate ONLY the human-readable text content, including:
  - All visible text in HTML elements (h1, h2, h3, p, etc.)
  - Text content inside JSON-LD scripts (questions, answers, descriptions, etc.)
  - Meta descriptions and titles
• Keep URLs, image filenames, and technical attributes unchanged
• Maintain exact spacing and formatting
• Output ONLY the translated HTML

HUMAN-LIKE TRANSLATION GUIDELINES:
• Write as a native speaker would naturally express these ideas in ${this.targetLang}
• Preserve conversational tone and informal expressions from the original
• Use natural contractions, idioms, and colloquialisms appropriate to ${this.targetLang}
• Maintain the engaging, authentic voice that makes content feel human-written
• Adapt cultural references appropriately for ${this.targetLang} speakers when needed
• Avoid robotic or overly formal translation patterns
• Ensure the translation flows naturally as if originally written by a human native speaker`,
        user: htmlChunk,
        model: config.openAI.defaultModel,
      });

      if (usage) {
        this._promptTokens += usage.prompt_tokens || 0;
        this._completionTokens += usage.completion_tokens || 0;
      }

      return translated;
    } catch (error) {
      console.error(`Translation failed for chunk: ${error.message}`);
      throw error;
    }
  }

  /**
   * Translate plain text (for titles, summaries, etc.)
   */
  async translateText(text) {
    if (!text || text.trim() === '') {
      return '';
    }

    try {
      const { content: translated, usage } = await chatCompletion({
        system: `You are a professional native-speaker translator. Translate the USER text into ${this.targetLang}.

CRITICAL RULES:
- Translate EVERY WORD including proper nouns, technical terms, and all text
- Preserve formatting exactly
- Do NOT keep any English words unless they are URLs or code
- Output ONLY the translation, no explanations

HUMAN-LIKE TRANSLATION GUIDELINES:
- Write as a native speaker would naturally express these ideas in ${this.targetLang}
- Preserve conversational tone and informal expressions from the original
- Use natural contractions, idioms, and colloquialisms appropriate to ${this.targetLang}
- Maintain the engaging, authentic voice that makes content feel human-written
- Adapt cultural references appropriately for ${this.targetLang} speakers when needed
- Avoid robotic or overly formal translation patterns`,
        user: text,
        model: config.openAI.defaultModel,
      });

      if (usage) {
        this._promptTokens += usage.prompt_tokens || 0;
        this._completionTokens += usage.completion_tokens || 0;
      }

      return translated;
    } catch (error) {
      console.error(`Text translation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Translate combined content (HTML + metadata)
   */
  async translateCombinedContent(combinedContent) {
    const { html, title, summary, metaDescription } = combinedContent;

    // Translate each component separately for simplicity and reliability
    const translatedHtml = await this.translateHTML(html || '');
    const translatedTitle = await this.translateText(title || '');
    const translatedSummary = await this.translateText(summary || '');
    const translatedMetaDesc = await this.translateText(metaDescription || '');

    return {
      html: translatedHtml,
      title: translatedTitle,
      summary: translatedSummary,
      metaDescription: translatedMetaDesc
    };
  }

  /**
   * Split HTML content into exactly the specified number of chunks
   */
  splitIntoFixedChunks(htmlContent, numChunks) {
    if (numChunks <= 1) {
      return [htmlContent];
    }

    const chunks = [];
    const totalLength = htmlContent.length;
    const baseChunkSize = Math.floor(totalLength / numChunks);

    let currentPos = 0;

    for (let i = 0; i < numChunks; i++) {
      let endPos;

      if (i === numChunks - 1) {
        // Last chunk gets all remaining content
        endPos = totalLength;
      } else {
        // Calculate target end position
        endPos = Math.min(currentPos + baseChunkSize, totalLength);

        // Find a good breaking point near the target position
        if (endPos < totalLength) {
          // Look for tag boundaries within a reasonable range
          const searchStart = Math.max(currentPos + Math.floor(baseChunkSize * 0.8), currentPos + 100);
          const searchEnd = Math.min(currentPos + Math.floor(baseChunkSize * 1.2), totalLength);

          let bestBreakPoint = endPos;

          // Look for closing tags first (better break points)
          for (let pos = searchStart; pos < searchEnd; pos++) {
            if (htmlContent[pos] === '>' && pos < totalLength - 1) {
              // Check if this is a good breaking point (not in the middle of a tag)
              const nextChar = htmlContent[pos + 1];
              if (nextChar === '\n' || nextChar === ' ' || nextChar === '<') {
                bestBreakPoint = pos + 1;
                break;
              }
            }
          }

          endPos = bestBreakPoint;
        }
      }

      const chunk = htmlContent.slice(currentPos, endPos);
      if (chunk.trim()) {
        chunks.push(chunk);
      }

      currentPos = endPos;
    }

    return chunks;
  }

  /**
   * Split HTML content into smaller chunks based on token limits
   */
  splitIntoChunks(htmlContent, maxTokens) {
    const chunks = [];
    const maxChars = maxTokens * 4; // Rough conversion
    
    let currentPos = 0;
    
    while (currentPos < htmlContent.length) {
      let endPos = Math.min(currentPos + maxChars, htmlContent.length);
      
      // If not at the end, find a good breaking point
      if (endPos < htmlContent.length) {
        // Look for tag boundaries
        let tagBoundary = htmlContent.indexOf('>', endPos);
        if (tagBoundary !== -1 && tagBoundary - currentPos < maxChars * 1.2) {
          endPos = tagBoundary + 1;
        } else {
          // Fallback: find previous tag boundary
          tagBoundary = htmlContent.lastIndexOf('>', endPos);
          if (tagBoundary > currentPos) {
            endPos = tagBoundary + 1;
          }
        }
      }
      
      const chunk = htmlContent.slice(currentPos, endPos);
      if (chunk.trim()) {
        chunks.push(chunk);
      }
      
      currentPos = endPos;
    }
    
    return chunks;
  }

  /**
   * Alias for backward compatibility
   */
  async translateTextSegment(text) {
    return await this.translateText(text);
  }
}
