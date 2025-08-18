import { translateChunk } from './translator.js';

/**
 * Parse HTML and translate only text content while preserving exact structure
 */
export class HTMLTranslator {
  constructor(targetLang) {
    this.targetLang = targetLang;
    this.translatedCache = new Map();
  }

  /**
   * Translate HTML content while preserving exact structure
   */
  async translateHTML(htmlContent) {
    if (!htmlContent) return '';

    // Split content into HTML tags and text segments
    const segments = this.parseHTMLSegments(htmlContent);
    
    // Translate only text segments
    const translatedSegments = [];
    for (const segment of segments) {
      if (segment.isText && segment.content.trim()) {
        // Always translate text unless it's purely technical content
        if (this.shouldSkipTranslation(segment.content)) {
          translatedSegments.push(segment.content);
        } else {
          const translated = await this.translateTextSegment(segment.content);
          translatedSegments.push(translated);
        }
      } else if (segment.isScript) {
        // Handle script tags (JSON-LD) specially
        const translatedScript = await this.translateJsonLd(segment.content);
        translatedSegments.push(translatedScript);
      } else {
        // Keep HTML tags exactly as-is
        translatedSegments.push(segment.content);
      }
    }

    return translatedSegments.join('');
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
      const translated = await translateChunk(this.targetLang, trimmedText);
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
   * Translate specific metadata fields in HTML
   */
  async translateMetadata(html, originalTitle, originalMetaDescription) {
    let result = html;

    // Translate title in HTML
    if (originalTitle) {
      const translatedTitle = await translateChunk(this.targetLang, originalTitle);
      result = result.replace(
        new RegExp(`<h1[^>]*>${this.escapeRegex(originalTitle)}</h1>`, 'gi'),
        `<h1>${translatedTitle}</h1>`
      );
    }

    // Update JSON-LD schema with translated content
    result = result.replace(
      /"headline":"([^"]+)"/g,
      (match, headline) => {
        if (headline === originalTitle) {
          return `"headline":"${translatedTitle || headline}"`;
        }
        return match;
      }
    );

    return result;
  }

  /**
   * Translate JSON-LD script content while preserving structure
   */
  async translateJsonLd(scriptContent) {
    try {
      // Extract JSON content from script tag
      const jsonMatch = scriptContent.match(/<script[^>]*>([\s\S]*?)<\/script>/);
      if (!jsonMatch) return scriptContent;

      const jsonString = jsonMatch[1].trim();
      let jsonData;
      
      try {
        jsonData = JSON.parse(jsonString);
      } catch (e) {
        // If JSON parsing fails, return original
        return scriptContent;
      }

      // Translate specific fields in JSON-LD
      await this.translateJsonObject(jsonData);

      // Reconstruct script tag with translated JSON
      const translatedJsonString = JSON.stringify(jsonData);
      return scriptContent.replace(jsonString, translatedJsonString);
      
    } catch (error) {
      console.error('Error translating JSON-LD:', error);
      return scriptContent;
    }
  }

  /**
   * Recursively translate translatable fields in JSON object
   */
  async translateJsonObject(obj) {
    if (Array.isArray(obj)) {
      for (const item of obj) {
        await this.translateJsonObject(item);
      }
    } else if (obj && typeof obj === 'object') {
      // Fields that should be translated
      const translatableFields = [
        'headline', 'description', 'text', 'name', 
        'articleSection', 'keywords'
      ];

      for (const [key, value] of Object.entries(obj)) {
        if (translatableFields.includes(key) && typeof value === 'string') {
          // Skip URLs and technical identifiers
          if (!value.startsWith('http') && !value.startsWith('@') && value.length > 2) {
            obj[key] = await this.translateTextSegment(value);
          }
        } else if (Array.isArray(value)) {
          // Handle arrays (like articleSection, keywords)
          for (let i = 0; i < value.length; i++) {
            if (typeof value[i] === 'string' && !value[i].startsWith('http')) {
              value[i] = await this.translateTextSegment(value[i]);
            } else if (typeof value[i] === 'object') {
              await this.translateJsonObject(value[i]);
            }
          }
        } else if (typeof value === 'object') {
          await this.translateJsonObject(value);
        }
      }
    }
  }

  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

export default HTMLTranslator;
