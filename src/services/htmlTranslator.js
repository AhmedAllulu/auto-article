import { chatCompletion } from './openAI.js';
import { config } from '../config.js';

/**
 * Parse HTML and translate only text content while preserving exact structure
 */
export class HTMLTranslator {
  constructor(targetLang) {
    this.targetLang = targetLang;
    this.translatedCache = new Map();

    // Track total tokens used by this translator instance
    this._promptTokens = 0;
    this._completionTokens = 0;
  }

  /**
   * Return aggregated token statistics for this translation session
   * @returns {{ input: number, output: number }}
   */
  getTokenStats() {
    return {
      input: this._promptTokens,
      output: this._completionTokens,
    };
  }

  /**
   * Translate HTML content while preserving exact structure
   * Strategy for GPT-5-nano (smaller context window)
   *   1. If the whole article fits (≈ <3.5k tokens) → single shot
   *   2. If it fits in two halves (≈ <7k tokens) → split in two requests
   *   3. Otherwise (very rare) fall back to paragraph-block segmentation
   */
  async translateHTML(htmlContent) {
    if (!htmlContent) return '';

    const MAX_TOKENS_PER_CALL = 3500; // safe margin for gpt-5-nano (4k ctx?)

    // ─── Helper to estimate tokens (rough: 1 token ≈ 4 chars) ────────────
    const approxTokens = (str) => Math.ceil(str.length / 4);
    const totalTokens = approxTokens(htmlContent);

    // ─── 1) Single-shot when it fits ─────────────────────────────────────
    if (totalTokens <= MAX_TOKENS_PER_CALL) {
      return (await this.translateWhole(htmlContent)).translated;
    }

    // ─── 2) Two-part translation when still under 2× window ──────────────
    if (totalTokens <= MAX_TOKENS_PER_CALL * 2) {
      const { part1, part2 } = this.splitInTwo(htmlContent);
      const t1 = await this.translateWhole(part1);
      const t2 = await this.translateWhole(part2);
      return t1.translated + t2.translated;
    }

    // ─── 3) Fallback: previous paragraph-block segmentation ──────────────
    // Split content into HTML tags and text segments
    const segments = this.parseHTMLSegments(htmlContent);

    // Translate segments concurrently while preserving order
    const translatedSegments = await Promise.all(
      segments.map(async (segment) => {
        if (segment.isText && segment.content.trim()) {
          if (this.shouldSkipTranslation(segment.content)) {
            return segment.content;
          }
          return this.translateTextSegment(segment.content);
        }
        if (segment.isScript) {
          return this.translateJsonLd(segment.content);
        }
        // Non-text HTML tag, return as-is
        return segment.content;
      })
    );

    return translatedSegments.join('');
  }

  /**
   * Translate a full HTML chunk in one request and track tokens
   */
  async translateWhole(htmlChunk) {
    const { content: translated, usage } = await chatCompletion({
      system: `You are a professional translator. Translate the USER HTML into ${this.targetLang}.

RULES
1. Preserve every HTML tag and attribute exactly; do NOT add or remove tags, newlines are fine.
2. Translate ONLY the human-readable text, including:
   • visible paragraph / heading text
   • the contents of <title>, <meta name="description" content="…">, and OpenGraph/Twitter description meta tags
   • string values INSIDE JSON-LD for keys: headline, description, text, name, articleSection, keywords
3. DO NOT translate URLs, image filenames, @context, @type, or any field that already looks like a URL.
4. Keep markdown markers (**, -, etc.) unchanged.
5. Output ONLY the translated HTML string.`,
      user: htmlChunk,
      model: config.openAI.defaultModel,
    });

    if (usage) {
      this._promptTokens += usage.prompt_tokens || 0;
      this._completionTokens += usage.completion_tokens || 0;
    }

    return { translated };
  }

  /**
   * Split HTML roughly in half at a tag boundary
   */
  splitInTwo(html) {
    const midpoint = Math.floor(html.length / 2);
    // Find the next closing tag boundary AFTER midpoint to keep structure
    let splitIdx = html.indexOf('>', midpoint);
    if (splitIdx === -1) {
      splitIdx = midpoint; // fallback – unlikely but safe
    }
    const part1 = html.slice(0, splitIdx + 1);
    const part2 = html.slice(splitIdx + 1);
    return { part1, part2 };
  }

  /**
   * Parse HTML into segments of tags and text
   */
  parseHTMLSegments(html) {
    const segments = [];
    // Enhanced regex to catch script, style and regular HTML tags separately  
    const tagRegex = /(<script[^>]*>[\s\S]*?<\/script>|<style[^>]*>[\s\S]*?<\/style>|<[^>]*>)/gi;
    
    let lastIndex = 0;
    let match;

    while ((match = tagRegex.exec(html)) !== null) {
      // Add text before the tag
      const textBefore = html.slice(lastIndex, match.index);
      if (textBefore) {
        const sentences = this.splitIntoSentences(textBefore);
        sentences.forEach(sentence => {
          if (sentence.trim()) {
            segments.push({ isText: true, content: sentence });
          }
        });
      }

      // Handle script tags specially (translate JSON-LD content)
      if (match[0].toLowerCase().includes('<script')) {
        segments.push({ isText: false, content: match[0], isScript: true });
      } else {
        // Regular HTML tags
        segments.push({ isText: false, content: match[0] });
      }
      lastIndex = tagRegex.lastIndex;
    }

    // Add remaining text after last tag
    const remainingText = html.slice(lastIndex);
    if (remainingText) {
      const sentences = this.splitIntoSentences(remainingText);
      sentences.forEach(sentence => {
        if (sentence.trim()) {
          segments.push({ isText: true, content: sentence });
        }
      });
    }

    return segments;
  }

  /**
   * Split text into sentences for better translation
   */
  splitIntoSentences(text) {
    // Don't split - translate entire text blocks to maintain context
    // Breaking into sentences can cause loss of context
    return [text];
  }

  /**
   * Check if text should be skipped from translation
   */
  shouldSkipTranslation(text) {
    const trimmedText = text.trim();
    
    // Skip if empty or only whitespace
    if (!trimmedText) return true;
    
    const skipPatterns = [
      /^[0-9\s\-\.\,\/\:\;\(\)]*$/,     // Only numbers and punctuation
      /^https?:\/\/[^\s]+$/,            // URLs only
      /^\s*[\{\[].+[\}\]]\s*$/,         // JSON-like content
      /^[A-Z_][A-Z0-9_]*$/,             // Constants like API_KEY
      /^[a-z_][a-z0-9_]*\([^)]*\)$/,    // Function calls only
      /^\$[0-9]+$/,                     // Variables like $1, $2
      /^```[\s\S]*```$/,                // Code blocks
    ];

    // Only skip if the ENTIRE text matches these patterns
    return skipPatterns.some(pattern => pattern.test(trimmedText));
  }

  /**
   * Translate a text segment with caching
   */
  async translateTextSegment(text) {
    const trimmedText = text.trim();
    if (!trimmedText) return text;

    // Check cache first
    if (this.translatedCache.has(trimmedText)) {
      return this.translatedCache.get(trimmedText);
    }

    try {
      // Call OpenAI directly so we can capture token usage stats
      const { content: translated, usage } = await chatCompletion({
        system: `You are a professional translator. Translate the USER content into ${this.targetLang}.

CRITICAL RULES:
- Translate EVERY WORD including proper nouns, technical terms, and all text
- Preserve markdown formatting (**, -, numbers, etc.) exactly
- Keep punctuation and structure identical
- Do NOT keep any English words unless they are URLs or code
- Output ONLY the translation, no explanations`,
        user: trimmedText,
        model: config.openAI.defaultModel,
      });

      // Aggregate token usage
      if (usage) {
        this._promptTokens += usage.prompt_tokens || 0;
        this._completionTokens += usage.completion_tokens || 0;
      }

      this.translatedCache.set(trimmedText, translated);
      
      // Preserve leading/trailing whitespace from original
      const leadingSpace = text.match(/^\s*/)[0];
      const trailingSpace = text.match(/\s*$/)[0];
      
      return leadingSpace + translated + trailingSpace;
    } catch (error) {
      console.error('Translation failed for segment:', trimmedText, error);
      return text; // Return original on error
    }
  }

  /**
   * Translate specific metadata fields (title, meta description, JSON-LD) in the HTML.
   */
  async translateMetadata(html, originalTitle, originalMetaDescription) {
    let result = html;

    // --- Title ------------------------------------------------------------------
    if (originalTitle) {
      const translatedTitle = await this.translateTextSegment(originalTitle);
      result = result.replace(
        new RegExp(`<h1[^>]*>${this.escapeRegex(originalTitle)}</h1>`, 'gi'),
        `<h1>${translatedTitle}</h1>`
      );

      // Update JSON-LD headline if present
      result = result.replace(
        /"headline":"([^"]+)"/g,
        (match, headline) => {
          if (headline === originalTitle) {
            return `"headline":"${translatedTitle}"`;
          }
          return match;
        }
      );
    }

    // --- Meta description -------------------------------------------------------
    if (originalMetaDescription) {
      const translatedMetaDesc = await this.translateTextSegment(originalMetaDescription);
      // Replace common meta description tag if exists
      result = result.replace(
        /<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i,
        (match) => match.replace(originalMetaDescription, translatedMetaDesc)
      );
    }

    return result;
  }

  // ============= JSON-LD Helpers ==============================================

  /**
   * Translate JSON-LD script content while preserving structure
   */
  async translateJsonLd(scriptContent) {
    try {
      // Extract JSON inside the script tag
      const jsonMatch = scriptContent.match(/<script[^>]*>([\s\S]*?)<\/script>/);
      if (!jsonMatch) return scriptContent;

      const jsonString = jsonMatch[1].trim();
      let jsonData;
      try {
        jsonData = JSON.parse(jsonString);
      } catch (_) {
        // Not valid JSON – return original
        return scriptContent;
      }

      // Recursively translate translatable fields
      await this.translateJsonObject(jsonData);

      const translatedJson = JSON.stringify(jsonData);
      return scriptContent.replace(jsonString, translatedJson);
    } catch (err) {
      console.error('Error translating JSON-LD:', err);
      return scriptContent;
    }
  }

  /**
   * Recursively translate fields in a JSON object/array.
   */
  async translateJsonObject(obj) {
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        if (typeof obj[i] === 'string') {
          obj[i] = await this.translateTextSegment(obj[i]);
        } else if (typeof obj[i] === 'object') {
          await this.translateJsonObject(obj[i]);
        }
      }
      return;
    }

    if (obj && typeof obj === 'object') {
      const translatableKeys = ['headline', 'description', 'text', 'name', 'articleSection', 'keywords'];
      for (const [key, value] of Object.entries(obj)) {
        if (translatableKeys.includes(key) && typeof value === 'string') {
          if (!value.startsWith('http') && !value.startsWith('@') && value.length > 2) {
            obj[key] = await this.translateTextSegment(value);
          }
        } else if (typeof value === 'object') {
          await this.translateJsonObject(value);
        }
      }
    }
  }

  // Utility: escape special regex chars
  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

export default HTMLTranslator;