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
   * Translate combined content (HTML + metadata) to minimize API requests
   * This method combines HTML content with title, summary, and meta description
   * to reduce API calls from 4+ per article to just 1-2 per article
   */
  async translateCombinedContent(combinedContent) {
    const { html, title, summary, metaDescription } = combinedContent;

    if (!html) {
      return {
        html: '',
        title: title || '',
        summary: summary || '',
        metaDescription: metaDescription || ''
      };
    }

    // Create a structured content block that includes all text to translate
    const structuredContent = this.createStructuredContent(html, title, summary, metaDescription);

    // Increased token limits to handle larger articles with fewer requests
    const MAX_TOKENS_PER_CALL = 15000; // Much larger chunks to reduce API calls
    const MAX_TOKENS_TWO_PARTS = MAX_TOKENS_PER_CALL * 2; // 30k tokens

    // ─── Helper to estimate tokens (rough: 1 token ≈ 4 chars) ────────────
    const approxTokens = (str) => Math.ceil(str.length / 4);
    const totalTokens = approxTokens(structuredContent);

    let translatedStructured;

    // ─── 1) Single-shot when it fits ─────────────────────────────────────
    if (totalTokens <= MAX_TOKENS_PER_CALL) {
      translatedStructured = (await this.translateWhole(structuredContent)).translated;
    }
    // ─── 2) Two-part translation when still under 2× window ──────────────
    else if (totalTokens <= MAX_TOKENS_TWO_PARTS) {
      const { part1, part2 } = this.splitStructuredContentInTwo(structuredContent);
      const t1 = await this.translateWhole(part1);
      const t2 = await this.translateWhole(part2);
      translatedStructured = t1.translated + t2.translated;
    }
    // ─── 3) Fallback: use original HTML translation method for very large content ──
    else {
      // For extremely large content, fall back to HTML-only translation
      // and translate metadata separately (still better than 4+ calls)
      const translatedHtml = await this.translateHTML(html);
      const translatedTitle = await this.translateTextSegment(title || '');
      const translatedSummary = await this.translateTextSegment(summary || '');
      const translatedMetaDesc = await this.translateTextSegment(metaDescription || '');

      return {
        html: translatedHtml,
        title: translatedTitle,
        summary: translatedSummary,
        metaDescription: translatedMetaDesc
      };
    }

    // Parse the translated structured content back into components
    return this.parseTranslatedStructuredContent(translatedStructured, html, title, summary, metaDescription);
  }

  /**
   * Translate HTML content while preserving exact structure
   * Strategy optimized to minimize API requests:
   *   1. If the whole article fits (≈ <15k tokens) → single shot
   *   2. If it fits in two halves (≈ <30k tokens) → split in two requests
   *   3. If it fits in four parts (≈ <60k tokens) → split in four requests
   *   4. Otherwise fall back to larger chunk-based segmentation
   */
  async translateHTML(htmlContent) {
    if (!htmlContent) return '';

    // Increased token limits to handle larger articles with fewer requests
    const MAX_TOKENS_PER_CALL = 15000; // Much larger chunks to reduce API calls
    const MAX_TOKENS_TWO_PARTS = MAX_TOKENS_PER_CALL * 2; // 30k tokens
    const MAX_TOKENS_FOUR_PARTS = MAX_TOKENS_PER_CALL * 4; // 60k tokens

    // ─── Helper to estimate tokens (rough: 1 token ≈ 4 chars) ────────────
    const approxTokens = (str) => Math.ceil(str.length / 4);
    const totalTokens = approxTokens(htmlContent);

    // ─── 1) Single-shot when it fits ─────────────────────────────────────
    if (totalTokens <= MAX_TOKENS_PER_CALL) {
      return (await this.translateWhole(htmlContent)).translated;
    }

    // ─── 2) Two-part translation when still under 2× window ──────────────
    if (totalTokens <= MAX_TOKENS_TWO_PARTS) {
      const { part1, part2 } = this.splitInTwo(htmlContent);
      const t1 = await this.translateWhole(part1);
      const t2 = await this.translateWhole(part2);
      return t1.translated + t2.translated;
    }

    // ─── 3) Four-part translation for very large articles ────────────────
    if (totalTokens <= MAX_TOKENS_FOUR_PARTS) {
      const parts = this.splitIntoFourParts(htmlContent);
      const translatedParts = await Promise.all(
        parts.map(part => this.translateWhole(part))
      );
      return translatedParts.map(p => p.translated).join('');
    }

    // ─── 4) Fallback: chunk-based segmentation for extremely large content ──
    // Split into larger meaningful chunks instead of tiny segments
    const chunks = this.splitIntoLargeChunks(htmlContent, MAX_TOKENS_PER_CALL);
    const translatedChunks = await Promise.all(
      chunks.map(chunk => this.translateWhole(chunk))
    );
    return translatedChunks.map(c => c.translated).join('');
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
   * Split HTML into four parts at tag boundaries
   */
  splitIntoFourParts(html) {
    const quarterLength = Math.floor(html.length / 4);

    // Find split points at tag boundaries
    const findSplitPoint = (startPos) => {
      let splitIdx = html.indexOf('>', startPos);
      if (splitIdx === -1) {
        splitIdx = startPos; // fallback
      }
      return splitIdx + 1;
    };

    const split1 = findSplitPoint(quarterLength);
    const split2 = findSplitPoint(quarterLength * 2);
    const split3 = findSplitPoint(quarterLength * 3);

    return [
      html.slice(0, split1),
      html.slice(split1, split2),
      html.slice(split2, split3),
      html.slice(split3)
    ];
  }

  /**
   * Split HTML into large chunks based on token limit
   * This replaces the old segment-based approach that created too many API calls
   */
  splitIntoLargeChunks(html, maxTokensPerChunk) {
    const chunks = [];
    const approxTokens = (str) => Math.ceil(str.length / 4);
    const maxCharsPerChunk = maxTokensPerChunk * 4; // rough conversion

    let currentPos = 0;

    while (currentPos < html.length) {
      let endPos = Math.min(currentPos + maxCharsPerChunk, html.length);

      // If not at the end, find a good breaking point at a tag boundary
      if (endPos < html.length) {
        let tagBoundary = html.indexOf('>', endPos);
        if (tagBoundary !== -1 && tagBoundary - currentPos < maxCharsPerChunk * 1.2) {
          endPos = tagBoundary + 1;
        } else {
          // Fallback: find previous tag boundary
          tagBoundary = html.lastIndexOf('>', endPos);
          if (tagBoundary > currentPos) {
            endPos = tagBoundary + 1;
          }
        }
      }

      const chunk = html.slice(currentPos, endPos);
      if (chunk.trim()) {
        chunks.push(chunk);
      }

      currentPos = endPos;
    }

    return chunks;
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

  /**
   * Create structured content that combines HTML with metadata for translation
   */
  createStructuredContent(html, title, summary, metaDescription) {
    // Create a structured format that clearly separates different content types
    // Use special markers that are unlikely to appear in real content
    const markers = {
      titleStart: '<<<TITLE_START>>>',
      titleEnd: '<<<TITLE_END>>>',
      summaryStart: '<<<SUMMARY_START>>>',
      summaryEnd: '<<<SUMMARY_END>>>',
      metaStart: '<<<META_DESC_START>>>',
      metaEnd: '<<<META_DESC_END>>>',
      htmlStart: '<<<HTML_START>>>',
      htmlEnd: '<<<HTML_END>>>'
    };

    return `${markers.titleStart}${title || ''}${markers.titleEnd}
${markers.summaryStart}${summary || ''}${markers.summaryEnd}
${markers.metaStart}${metaDescription || ''}${markers.metaEnd}
${markers.htmlStart}${html}${markers.htmlEnd}`;
  }

  /**
   * Split structured content in two parts while preserving structure
   */
  splitStructuredContentInTwo(structuredContent) {
    // Find the HTML section and split it there
    const htmlStartMarker = '<<<HTML_START>>>';
    const htmlEndMarker = '<<<HTML_END>>>';

    const htmlStartIndex = structuredContent.indexOf(htmlStartMarker);
    const htmlEndIndex = structuredContent.indexOf(htmlEndMarker);

    if (htmlStartIndex === -1 || htmlEndIndex === -1) {
      // Fallback: split at midpoint
      const midpoint = Math.floor(structuredContent.length / 2);
      return {
        part1: structuredContent.slice(0, midpoint),
        part2: structuredContent.slice(midpoint)
      };
    }

    // Extract the HTML content
    const beforeHtml = structuredContent.slice(0, htmlStartIndex + htmlStartMarker.length);
    const htmlContent = structuredContent.slice(htmlStartIndex + htmlStartMarker.length, htmlEndIndex);
    const afterHtml = structuredContent.slice(htmlEndIndex);

    // Split the HTML content in half
    const htmlMidpoint = Math.floor(htmlContent.length / 2);
    let splitIdx = htmlContent.indexOf('>', htmlMidpoint);
    if (splitIdx === -1) {
      splitIdx = htmlMidpoint;
    }

    const htmlPart1 = htmlContent.slice(0, splitIdx + 1);
    const htmlPart2 = htmlContent.slice(splitIdx + 1);

    return {
      part1: beforeHtml + htmlPart1 + htmlEndMarker,
      part2: htmlStartMarker + htmlPart2 + afterHtml
    };
  }

  /**
   * Parse translated structured content back into components
   */
  parseTranslatedStructuredContent(translatedStructured, originalHtml, originalTitle, originalSummary, originalMetaDesc) {
    const markers = {
      titleStart: '<<<TITLE_START>>>',
      titleEnd: '<<<TITLE_END>>>',
      summaryStart: '<<<SUMMARY_START>>>',
      summaryEnd: '<<<SUMMARY_END>>>',
      metaStart: '<<<META_DESC_START>>>',
      metaEnd: '<<<META_DESC_END>>>',
      htmlStart: '<<<HTML_START>>>',
      htmlEnd: '<<<HTML_END>>>'
    };

    // Extract each section
    const extractSection = (content, startMarker, endMarker, fallback = '') => {
      const startIndex = content.indexOf(startMarker);
      const endIndex = content.indexOf(endMarker);

      if (startIndex === -1 || endIndex === -1) {
        return fallback;
      }

      return content.slice(startIndex + startMarker.length, endIndex).trim();
    };

    const translatedTitle = extractSection(translatedStructured, markers.titleStart, markers.titleEnd, originalTitle);
    const translatedSummary = extractSection(translatedStructured, markers.summaryStart, markers.summaryEnd, originalSummary);
    const translatedMetaDesc = extractSection(translatedStructured, markers.metaStart, markers.metaEnd, originalMetaDesc);
    const translatedHtml = extractSection(translatedStructured, markers.htmlStart, markers.htmlEnd, originalHtml);

    return {
      html: translatedHtml,
      title: translatedTitle,
      summary: translatedSummary,
      metaDescription: translatedMetaDesc
    };
  }

  // Utility: escape special regex chars
  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

export default HTMLTranslator;