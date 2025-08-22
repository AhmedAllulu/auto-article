import crypto from 'crypto';
import { query, withTransaction } from '../db.js';
import { config } from '../config.js';
import { toSlug } from '../utils/slug.js';
import { fetchUnsplashImageUrl } from './unsplash.js';
import { generateArticleWithSearch, generateNoSearch, generateRobustArticle } from './oneMinAI.js';
import { chatCompletion as openAIChat } from './openAI.js';
import sanitizeHtml from 'sanitize-html';
import { getPrompt } from '../prompts/index.js';
import { buildPrompt as buildTranslationPrompt } from '../prompts/translation.js';
// Import table routing helper
import { articlesTable, LANG_SHARDED_ARTICLE_TABLES } from '../utils/articlesTable.js';
import { translateChunk } from './translator.js';
import { HTMLTranslator } from './htmlTranslator.js';
import { notifySearchEnginesNewArticle } from './seoNotificationService.js';

// Debug logging for generation flow (enable with DEBUG_GENERATION=true)
const DEBUG_GENERATION = String(process.env.DEBUG_GENERATION || 'false') === 'true';
function genLog(...args) {
  if (DEBUG_GENERATION) console.log('[generation]', ...args);
}

const TOP_REVENUE_LANGUAGES = new Set(['en', 'de', 'fr', 'es', 'pt', 'ar']);

export function computePriorityScore({ categorySlug, languageCode, countryCode }) {
  const lw = Number(config.priorities.languages[languageCode] || 0);
  const cw = Number(config.priorities.countries[countryCode || 'US'] || 0); // default to US if not provided
  const kw = Number(config.priorities.categories[categorySlug] || 0);
  // Weighted geometric-like mean to avoid any zero nullifying everything, add small epsilon
  const epsilon = 0.001;
  const score = (lw + epsilon) * (cw + epsilon) * (kw + epsilon);
  return score;
}

export function bestMarketForLanguage(languageCode) {
  const markets = config.priorities.languageMarkets[languageCode] || [];
  if (!markets.length) return 'US';
  // Choose market with highest country weight
  let best = markets[0];
  let bestW = Number(config.priorities.countries[best] || 0);
  for (const c of markets) {
    const w = Number(config.priorities.countries[c] || 0);
    if (w > bestW) {
      best = c;
      bestW = w;
    }
  }
  return best;
}

function computeHash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function estimateReadingTimeMinutes(htmlContent) {
  if (!htmlContent) return 1;
  // Remove HTML tags and count words
  const textContent = htmlContent.replace(/<[^>]*>/g, ' ');
  const words = textContent.trim().split(/\s+/).length;
  // Average reading speed: 200 words per minute
  const minutes = Math.max(1, Math.ceil(words / 200));
  return minutes;
}

function canonicalForSlug(slug, languageCode = 'en') {
  const baseUrl = config.seo?.canonicalBaseUrl || 'https://vivaverse.top';
  return `${baseUrl}/${languageCode}/${slug}`;
}

function sanitizeHtmlContent(html) {
  // Strip scripts/styles and dangerous attributes but keep headings, links, images, lists, etc.
  return sanitizeHtml(String(html || ''), {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li']),
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
  });
}

// Simple markdown to HTML converter for translated content
function convertMarkdownToHtml(markdown) {
  if (!markdown) return '';
  
  // Split into lines and process each
  const lines = markdown.split('\n');
  let html = '';
  let inParagraph = false;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Skip empty lines
    if (!line.trim()) {
      if (inParagraph) {
        html += '</p>\n';
        inParagraph = false;
      }
      continue;
    }
    
    // Headers
    if (line.match(/^#{1,6}\s/)) {
      if (inParagraph) {
        html += '</p>\n';
        inParagraph = false;
      }
      const level = line.match(/^(#{1,6})/)[1].length;
      const text = line.replace(/^#{1,6}\s*/, '').trim();
      html += `<h${level}>${text}</h${level}>\n`;
      continue;
    }
    
    // Process inline formatting
    line = line
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>'); // Links
    
    // Regular text - wrap in paragraph
    if (!inParagraph) {
      html += '<p>';
      inParagraph = true;
    }
    html += line + '\n';
  }
  
  // Close any open paragraph
  if (inParagraph) {
    html += '</p>\n';
  }
  
  return html.trim();
}

// Ensure uniqueness of article slugs by appending an incrementing numeric suffix when needed
async function generateUniqueSlug(baseSlug) {
  // Check all language-specific tables for existing slugs
  const languages = ['en', 'de', 'fr', 'es', 'pt', 'ar', 'hi'];
  const existing = new Set();
  
  for (const lang of languages) {
    const tableName = articlesTable(lang);
    try {
      const res = await query(
        `SELECT slug FROM ${tableName} WHERE slug LIKE $1 || '%'`,
        [baseSlug]
      );
      res.rows.forEach(row => existing.add(row.slug));
    } catch (err) {
      // Skip if table doesn't exist yet
      if (err.code !== '42P01') throw err;
    }
  }
  
  if (!existing.has(baseSlug)) return baseSlug;
  let counter = 2;
  while (existing.has(`${baseSlug}-${counter}`)) counter += 1;
  return `${baseSlug}-${counter}`;
}

// Legacy functions removed - now using template system from src/prompts/

function countWords(text) {
  return String(text || '')
    .split(/\s+/)
    .filter(Boolean).length;
}



// Success tracking for natural text approach
const SUCCESS_TRACKER = {
  totalAttempts: 0,
  naturalTextSuccess: 0,
  extractionSuccess: 0,
  costSavings: 0
};

function trackSuccess() {
  SUCCESS_TRACKER.totalAttempts++;
  SUCCESS_TRACKER.naturalTextSuccess++;
  SUCCESS_TRACKER.extractionSuccess++;
  // No repair calls = savings!
  SUCCESS_TRACKER.costSavings += 0.02; // Typical repair call cost
  
  if (SUCCESS_TRACKER.totalAttempts % 10 === 0) {
    console.log('SUCCESS RATE: 100% | SAVINGS:', SUCCESS_TRACKER.costSavings);
  }
}

// Extract structured data from natural markdown text
function extractFromNaturalText(content, categoryName) {
  const lines = content.split('\n').map(line => line.trim());
  
  const result = {
    title: null,
    metaDescription: null,
    intro: null,
    sections: [],
    faq: [],
    keywords: [],
    externalLinks: [],
    summary: null
  };

  let currentSection = null;
  let currentContent = [];
  let inFaq = false;
  let currentQuestion = null;
  let collectingIntro = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Extract main title (# heading)
    if (!result.title && line.match(/^#\s+(.+)$/)) {
      result.title = line.replace(/^#\s+/, '').trim();
      continue;
    }

    // Extract meta description
    if (line.match(/^\*\*Meta Description:\*\*/i)) {
      result.metaDescription = line.replace(/^\*\*Meta Description:\*\*/i, '').trim();
      continue;
    }

    // Detect Introduction section
    if (line.match(/^##\s+Introduction/i)) {
      collectingIntro = true;
      currentContent = [];
      continue;
    }

    // Detect FAQ section (supports English and Arabic heading variants)
    if (line.match(/^##\s+.*(?:faq|frequently|questions|الأسئلة)/i)) {
      inFaq = true;
      collectingIntro = false;
      if (currentSection && currentContent.length) {
        result.sections.push({
          heading: currentSection,
          body: currentContent.join('\n').trim()
        });
      }
      currentSection = null;
      currentContent = [];
      continue;
    }

    // Detect other sections (## headings)
    if (line.match(/^##\s+(.+)$/)) {
      // Save previous section
      if (collectingIntro) {
        result.intro = currentContent.join('\n').trim();
        collectingIntro = false;
      } else if (currentSection && currentContent.length) {
        result.sections.push({
          heading: currentSection,
          body: currentContent.join('\n').trim()
        });
      }
      
      currentSection = line.replace(/^##\s+/, '').trim();
      currentContent = [];
      inFaq = false;
      continue;
    }

    // Extract FAQ questions (### headings in FAQ section)
    if (inFaq && line.match(/^###\s+(.+)$/)) {
      if (currentQuestion && currentContent.length) {
        result.faq.push({
          q: currentQuestion,
          a: currentContent.join('\n').trim()
        });
      }
      currentQuestion = line.replace(/^###\s+/, '').trim();
      currentContent = [];
      continue;
    }

    // Extract keywords
    if (line.match(/^\*\*Keywords:\*\*/i)) {
      const keywordText = line.replace(/^\*\*Keywords:\*\*/i, '').trim();
      result.keywords = keywordText.split(/[,;]/).map(k => k.trim()).filter(Boolean);
      continue;
    }

    // Extract recommended reading/external links
    if (line.match(/^\*\*Recommended.*Reading:\*\*/i)) {
      // Look for following lines with markdown links: - [Text](URL)
      for (let j = i + 1; j < lines.length && lines[j].match(/^-\s+(.+)$/); j++) {
        const linkLine = lines[j].replace(/^-\s+/, '').trim();
        
        // Parse markdown link format: [Link Text](https://url.com)
        const markdownMatch = linkLine.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (markdownMatch) {
          const [, linkText, url] = markdownMatch;
          // Only include if it's a real external URL
          if (url.startsWith('http://') || url.startsWith('https://')) {
            result.externalLinks.push({
              anchor: linkText.trim(),
              url: url.trim()
            });
          }
        } else {
          // Fallback: if no markdown format, treat as plain text (for backward compatibility)
          const linkText = linkLine;
          const slug = toSlug(linkText);
          result.externalLinks.push({
            anchor: linkText,
            slugSuggestion: slug
          });
        }
        i = j; // Skip these lines in main loop
      }
      continue;
    }

    // Extract Key Takeaways as summary
    if (line.match(/^##\s+(?:key takeaways|summary|conclusion)/i)) {
      // Next non-empty lines become summary
      const summaryLines = [];
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim() && !lines[j].match(/^\*\*|^#/)) {
          summaryLines.push(lines[j].trim());
        } else if (lines[j].match(/^#|^\*\*/)) {
          break;
        }
      }
      result.summary = summaryLines.join(' ').trim();
      continue;
    }

    // Collect content for current section
    // Preserve blank lines to maintain paragraph spacing
    if (line === '') {
      currentContent.push('');
      continue;
    }
    if (line.trim() && !line.match(/^\*\*|^#/)) {
      // Special filtering for FAQ sections: exclude lines that contain URLs or look like external links
      if (inFaq && currentQuestion) {
        // Skip lines that contain URLs
        if (line.includes('http://') || line.includes('https://')) {
          continue;
        }
        // Skip lines that look like external resource lists (start with dash and contain common site names)
        if (line.match(/^-\s+.*(?:vogue|allure|harper|elle|nytimes|cnn|bbc|wikipedia|investopedia|bankrate|nerdwallet|fidelity)/i)) {
          continue;
        }
        // Skip lines that are just site names followed by colons or dashes
        if (line.match(/^(?:vogue|allure|harper|elle|nytimes|cnn|bbc|wikipedia|investopedia|bankrate|nerdwallet|fidelity)[\s:—-]/i)) {
          continue;
        }
      }
      currentContent.push(line.trim());
    }
  }

  // Finalize remaining content
  if (collectingIntro) {
    result.intro = currentContent.join('\n').trim();
  } else if (currentSection && currentContent.length) {
    result.sections.push({
      heading: currentSection,
      body: currentContent.join('\n').trim()
    });
  }
  if (currentQuestion && currentContent.length) {
    // Clean up FAQ answer: remove any remaining URLs or external link references
    let faqAnswer = currentContent.join('\n').trim();
    // Remove lines containing URLs or external resource references
    faqAnswer = faqAnswer.split('\n')
      .filter(line => {
        const trimmedLine = line.trim();
        // Skip empty lines
        if (!trimmedLine) return false;
        // Skip lines containing URLs
        if (trimmedLine.includes('http://') || trimmedLine.includes('https://')) return false;
        // Skip lines that look like external resource lists
        if (trimmedLine.match(/^-\s+.*(?:vogue|allure|harper|elle|nytimes|cnn|bbc|wikipedia|investopedia|bankrate|nerdwallet|fidelity|forbes|wsj|bloomberg)/i)) return false;
        // Skip lines that are just site names
        if (trimmedLine.match(/^(?:vogue|allure|harper|elle|nytimes|cnn|bbc|wikipedia|investopedia|bankrate|nerdwallet|fidelity|forbes|wsj|bloomberg)[\s:—-]|^(?:vogue|allure|harper|elle|nytimes|cnn|bbc|wikipedia|investopedia|bankrate|nerdwallet|fidelity|forbes|wsj|bloomberg)$/i)) return false;
        // Skip notes about external resources
        if (trimmedLine.match(/^\(Note:.*External.*Resource.*\)/i)) return false;
        // Skip lines that are just dashes or bullets
        if (trimmedLine.match(/^[-•*]\s*$/)) return false;
        return true;
      })
      .join('\n').trim();

    if (faqAnswer) {
      result.faq.push({
        q: currentQuestion,
        a: faqAnswer
      });
    }
  }

  // Generate fallbacks
  if (!result.title) {
    result.title = `Complete Guide to ${categoryName}`;
  }

  if (!result.intro) {
    // Extract first substantial paragraph as intro
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 100);
    result.intro = paragraphs[0] || `This comprehensive guide covers everything you need to know about ${categoryName}.`;
  }

  if (!result.metaDescription) {
    result.metaDescription = result.intro.slice(0, 157) + '...';
  }

  if (!result.summary) {
    const introPreview = String(result.intro || '')
      .split(/(?<=[.!?])\s+/)
      .slice(0, 2)
      .join(' ')
      .trim();
    result.summary = String(result.metaDescription || introPreview || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  if (result.keywords.length === 0) {
    result.keywords = [categoryName.toLowerCase(), 'guide', 'tips', 'best practices'];
  }

  // Don't add fake external links - only use real ones found in AI content

  // Ensure minimum content (do not auto-insert FAQ when AI provides none)
  if (result.sections.length === 0) {
    result.sections = [{
      heading: `Understanding ${categoryName}`,
      body: result.intro || `${categoryName} is an important topic that requires understanding and practical application.`
    }];
  }

  // Intentionally do not add a hard-coded FAQ fallback. If the AI didn't generate FAQs,
  // leave result.faq as an empty array so no FAQ section/LD is rendered.

  // Post-process: conditionally drop the last FAQ if it appears to mirror external links
  // Rule: If the last FAQ (q + a) shares >= 30% of its unique tokens with words derived
  // from the external links (anchors, slugSuggestions, URL host/path words), remove it.
  try {
    if (Array.isArray(result.faq) && result.faq.length && Array.isArray(result.externalLinks) && result.externalLinks.length) {
      const lastIdx = result.faq.length - 1;
      const last = result.faq[lastIdx];
      const text = `${last.q || ''} ${last.a || ''}`.toLowerCase();
      const faqTokens = Array.from(new Set(text.split(/[^a-z0-9]+/i).filter(Boolean)));

      const externalTextParts = [];
      for (const link of result.externalLinks) {
        if (link?.anchor) externalTextParts.push(String(link.anchor));
        if (link?.slugSuggestion) externalTextParts.push(String(link.slugSuggestion).replace(/-/g, ' '));
        if (link?.url) {
          try {
            const u = new URL(link.url);
            externalTextParts.push(u.hostname.replace(/^www\./, '').replace(/\./g, ' '));
            externalTextParts.push(decodeURIComponent(u.pathname).replace(/[-_/]/g, ' '));
          } catch {}
        }
      }

      const extText = externalTextParts.join(' ').toLowerCase();
      const extTokens = Array.from(new Set(extText.split(/[^a-z0-9]+/i).filter(Boolean)));

      if (faqTokens.length && extTokens.length) {
        let overlap = 0;
        const extSet = new Set(extTokens);
        for (const t of faqTokens) {
          if (extSet.has(t)) overlap++;
        }
        const ratio = overlap / faqTokens.length;
        if (ratio >= 0.3) {
          // Remove the last FAQ so it won't be used in HTML, JSON-LD, or stored content
          result.faq.pop();
        }
      }
    }
  } catch (e) {
    // Fail quietly; never block article generation on this heuristic
  }

  return result;
}

// Remove code fences and inline code blocks to extract plain text
function stripCodeBlocks(raw) {
  return String(raw || '').replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');
}

function extractTitleFromRaw(content, categoryName) {
  const text = String(content || '');
  // 1) Try to pull a JSON-like title field
  const mJsonTitle = text.match(/"title"\s*:\s*"([^"\n]{3,200})"/i);
  if (mJsonTitle && mJsonTitle[1]) return mJsonTitle[1].trim();
  // 2) Use first markdown heading
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const h1 = line.match(/^\s*#{1,3}\s+(.{3,200})/);
    if (h1 && h1[1]) return h1[1].trim();
  }
  // 3) First non-empty line as a fallback
  const cleaned = stripCodeBlocks(text)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (cleaned.length) return cleaned[0].slice(0, 120);
  // 4) Category-based default
  return `Insights in ${categoryName}`;
}

function extractSummaryFromRaw(content) {
  const cleaned = stripCodeBlocks(String(content || '')).replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  // Take first 2 sentences or up to ~300 chars
  const sentences = cleaned.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ');
  const summary = sentences || cleaned;
  return summary.length > 300 ? summary.slice(0, 297) + '...' : summary;
}

function evaluateMasterQuality(masterJson) {
  const introWords = countWords(masterJson?.intro || '');
  const sections = Array.isArray(masterJson?.sections) ? masterJson.sections : [];
  const faq = Array.isArray(masterJson?.faq) ? masterJson.faq : [];
  const sources = Array.isArray(masterJson?.sourceUrls) ? masterJson.sourceUrls : [];

  let sectionMinOk = true;
  let sectionsTotal = 0;
  for (const s of sections) {
    const w = countWords(s?.body || '');
    sectionsTotal += w;
    if (w < 400) sectionMinOk = false;
  }

  let faqMinOk = faq.length >= 8;
  let faqTotal = 0;
  for (const f of faq) {
    const w = countWords(f?.a || '');
    faqTotal += w;
    if (w < 100) faqMinOk = false;
  }

  const totalWords = introWords + sectionsTotal + faqTotal;

  const validSources = sources.filter((u) =>
    typeof u === 'string' &&
    /^https?:\/\//i.test(u) &&
    !/example\.com/i.test(u) &&
    !/lorem|dummy|test/i.test(u)
  );
  const sourcesOk = validSources.length >= 5;

  return {
    totalWords,
    introOk: introWords >= 200,
    sectionMinOk,
    faqMinOk,
    sourcesOk,
    meetsAll: introWords >= 200 && sectionMinOk && faqMinOk && totalWords >= 2000 && sourcesOk,
  };
}




// Removed: repair prompts and JSON parsing helpers (no longer needed in natural text approach)


async function upsertTodayJob(target) {
  const res = await query(
    `INSERT INTO generation_jobs (job_date, num_articles_target)
     VALUES (CURRENT_DATE, $1)
     ON CONFLICT (job_date)
     DO UPDATE SET num_articles_target = EXCLUDED.num_articles_target
     RETURNING *`,
    [target]
  );
  return res.rows[0];
}

async function getTodaysMastersCount() {
  const res = await query(
    `SELECT COUNT(*)::int AS count
     FROM articles_en
     WHERE published_at::date = CURRENT_DATE`
  );
  return res.rows[0]?.count || 0;
}

async function getTodaysHowTosCount() {
  const res = await query(
    `SELECT COUNT(*)::int AS count
     FROM articles_en
     WHERE slug LIKE 'how-to-%'
       AND published_at::date = CURRENT_DATE`
  );
  return res.rows[0]?.count || 0;
}

async function getMastersFromToday() {
  const res = await query(
    `SELECT a.id,
            a.slug,
            a.title,
            a.summary,
            a.image_url,
            a.category_id,
            c.slug AS category_slug,
            c.name AS category_name
     FROM articles_en a
     LEFT JOIN categories c ON c.id = a.category_id
     WHERE a.published_at::date = CURRENT_DATE
     ORDER BY a.id ASC`
  );
  return res.rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    summary: r.summary,
    image_url: r.image_url,
    category: { id: r.category_id, slug: r.category_slug, name: r.category_name },
  }));
}

async function getExistingTranslationLanguagesForMaster(slugBase) {
  // Check all language-specific tables for existing translations
  const languages = ['en', 'de', 'fr', 'es', 'pt', 'ar', 'hi'];
  const existingLanguages = new Set();
  
  for (const lang of languages) {
    const tableName = articlesTable(lang);
    try {
      const res = await query(
        `SELECT language_code FROM ${tableName} WHERE slug LIKE $1 || '-%'`,
        [slugBase]
      );
      res.rows.forEach(row => existingLanguages.add(row.language_code));
    } catch (err) {
      // Skip if table doesn't exist yet
      if (err.code !== '42P01') throw err;
    }
  }
  
  return existingLanguages;
}

async function incrementJobCount(client, inc) {
  await client.query(
    `UPDATE generation_jobs SET num_articles_generated = num_articles_generated + $1,
     started_at = COALESCE(started_at, now())
     WHERE job_date = CURRENT_DATE`,
    [inc]
  );
}

async function insertArticle(client, article) {
  const {
    title,
    slug,
    content,
    summary,
    language_code,
    category_id,
    image_url,
    meta_title,
    meta_description,
    canonical_url,
    reading_time_minutes,
    ai_model,
    ai_prompt,
    ai_tokens_input,
    ai_tokens_output,
    total_tokens,
    source_url,
    content_hash,
  } = article;

  const tableName = articlesTable(language_code);
  const res = await client.query(
    `INSERT INTO ${tableName} (
      title, slug, content, summary, language_code, category_id, image_url,
      meta_title, meta_description, canonical_url, reading_time_minutes,
      ai_model, ai_prompt, ai_tokens_input, ai_tokens_output, total_tokens,
      source_url, content_hash, published_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,
      $8,$9,$10,$11,
      $12,$13,$14,$15,$16,
      $17,$18, now()
    ) RETURNING *`,
    [
      title,
      slug,
      content,
      summary,
      language_code,
      category_id,
      image_url,
      meta_title,
      meta_description,
      canonical_url,
      reading_time_minutes,
      ai_model,
      ai_prompt,
      ai_tokens_input,
      ai_tokens_output,
      total_tokens,
      source_url,
      content_hash,
    ]
  );

  const insertedArticle = res.rows[0];

  // Notify search engines about new article (async, don't wait)
  if (insertedArticle) {
    notifySearchEnginesNewArticle(insertedArticle).catch(error => {
      genError('SEO notification failed for new article', {
        slug: insertedArticle.slug,
        language: insertedArticle.language_code,
        error: error.message
      }, false); // Don't stop generation for SEO notification failures
    });
  }

  return insertedArticle;
}

async function updateDailyTokenUsage(client, usageList) {
  let inSum = 0;
  let outSum = 0;
  for (const u of usageList) {
    inSum += Number(u?.prompt_tokens || 0);
    outSum += Number(u?.completion_tokens || 0);
  }
  if (inSum === 0 && outSum === 0) return;
  await client.query(
    `INSERT INTO token_usage (day, tokens_input, tokens_output)
     VALUES (CURRENT_DATE, $1, $2)
     ON CONFLICT (day)
     DO UPDATE SET tokens_input = token_usage.tokens_input + EXCLUDED.tokens_input,
                   tokens_output = token_usage.tokens_output + EXCLUDED.tokens_output`,
    [inSum, outSum]
  );
}

async function getCategories() {
  const res = await query('SELECT id, name, slug FROM categories ORDER BY id ASC');
  return res.rows;
}



function validateWordCount(content, minWords = 600, maxWords = 800) {
  const wordCount = countWords(content);
  return {
    wordCount,
    isValid: wordCount >= minWords && wordCount <= maxWords,
    minWords,
    maxWords,
    status: wordCount < minWords ? 'too_short' : wordCount > maxWords ? 'too_long' : 'valid'
  };
}

function addWordCountToArticle(articleObject, contentHtml, categorySlug) {
  const wordValidation = validateWordCount(contentHtml, 600, 800);
  genLog('Word count validation', { 
    category: categorySlug, 
    wordCount: wordValidation.wordCount,
    status: wordValidation.status,
    target: `${wordValidation.minWords}-${wordValidation.maxWords}` 
  });
  
  return {
    ...articleObject,
    word_count: wordValidation.wordCount,
    word_count_status: wordValidation.status,
  };
}

function assembleHtml(master) {
  const parts = [];
  // Helper: split on double newline for paragraphs, keep single newline as <br/>
  function toParagraphs(raw) {
    if (!raw) return [];
    const chunks = String(raw).split(/\n{2,}/g);
    return chunks.map(chunk => `<p>${chunk.replace(/\n/g, '<br/>')}</p>`);
  }
  if (master.intro) parts.push(...toParagraphs(master.intro));
  if (Array.isArray(master.sections)) {
    for (const s of master.sections) {
      if (s.heading) parts.push(`<h2>${s.heading}</h2>`);
      if (s.body) parts.push(...toParagraphs(s.body));
    }
  }
  if (Array.isArray(master.faq) && master.faq.length) {
    parts.push('<h2>FAQ</h2>');
    for (const f of master.faq) {
      parts.push(`<h3>${f.q}</h3>`);
      parts.push(...toParagraphs(f.a));
    }
  }
  if (Array.isArray(master.externalLinks) && master.externalLinks.length) {
    parts.push('<h2>Related links</h2>');
    parts.push('<ul>');
    const seen = new Set();
    for (const link of master.externalLinks) {
      const anchor = String(link?.anchor || '').trim();
      let href = '';
      
      // Prefer external URL if available
      if (link?.url && (link.url.startsWith('http://') || link.url.startsWith('https://'))) {
        href = link.url;
      } else if (link?.slugSuggestion) {
        // Fallback to internal link for backward compatibility
        const slugSuggestion = String(link.slugSuggestion).trim();
        const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        if (slugRegex.test(slugSuggestion) && !seen.has(slugSuggestion)) {
          href = `/${slugSuggestion}`;
          seen.add(slugSuggestion);
        }
      }
      
      // Only add link if we have both anchor text and a valid href
      if (anchor && href && !seen.has(href)) {
        seen.add(href);
        // Add target="_blank" and rel="noopener" for external links
        const isExternal = href.startsWith('http://') || href.startsWith('https://');
        const targetAttr = isExternal ? ' target="_blank" rel="noopener"' : '';
        parts.push(`<li><a href="${href}"${targetAttr}>${anchor}</a></li>`);
      }
    }
    parts.push('</ul>');
  }
  if (Array.isArray(master.keywords) && master.keywords.length) {
    parts.push('<h2>Tags</h2>');
    parts.push(`<p>${master.keywords.join(', ')}</p>`);
  }
  return parts.join('\n');
}

function escapeJsonForHtml(obj) {
  try {
    return JSON.stringify(obj).replace(/</g, '\\u003c');
  } catch {
    return '{}';
  }
}

function buildArticleJsonLd({ masterJson, title, description, canonicalUrl, imageUrl, languageCode }) {
  const faqEntities = Array.isArray(masterJson?.faq)
    ? masterJson.faq.map((f) => ({
        '@type': 'Question',
        name: f?.q || '',
        acceptedAnswer: { '@type': 'Answer', text: f?.a || '' },
      }))
    : [];

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    inLanguage: languageCode || 'en',
    mainEntityOfPage: canonicalUrl || undefined,
    image: imageUrl ? [imageUrl] : undefined,
    datePublished: new Date().toISOString(),
    keywords: Array.isArray(masterJson?.keywords) ? masterJson.keywords.join(', ') : undefined,
    articleSection: Array.isArray(masterJson?.sections) ? masterJson.sections.map((s) => s?.heading).filter(Boolean) : undefined,
  };

  const faqLd = faqEntities.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqEntities,
      }
    : null;

  return [articleLd, faqLd].filter(Boolean);
}

/**
 * Generate Open Graph and Twitter Card meta tags for articles
 */
function buildSocialMetaTags({ title, description, canonicalUrl, imageUrl, languageCode, siteName = 'VivaVerse' }) {
  const metaTags = [];

  // Open Graph tags
  metaTags.push(`<meta property="og:type" content="article">`);
  metaTags.push(`<meta property="og:title" content="${escapeHtml(title)}">`);
  metaTags.push(`<meta property="og:description" content="${escapeHtml(description)}">`);
  metaTags.push(`<meta property="og:site_name" content="${escapeHtml(siteName)}">`);
  metaTags.push(`<meta property="og:locale" content="${getOgLocale(languageCode)}">`);

  if (canonicalUrl) {
    metaTags.push(`<meta property="og:url" content="${escapeHtml(canonicalUrl)}">`);
  }

  if (imageUrl) {
    metaTags.push(`<meta property="og:image" content="${escapeHtml(imageUrl)}">`);
    metaTags.push(`<meta property="og:image:alt" content="${escapeHtml(title)}">`);
    metaTags.push(`<meta property="og:image:width" content="1200">`);
    metaTags.push(`<meta property="og:image:height" content="630">`);
  }

  // Twitter Card tags
  metaTags.push(`<meta name="twitter:card" content="summary_large_image">`);
  metaTags.push(`<meta name="twitter:title" content="${escapeHtml(title)}">`);
  metaTags.push(`<meta name="twitter:description" content="${escapeHtml(description)}">`);

  if (imageUrl) {
    metaTags.push(`<meta name="twitter:image" content="${escapeHtml(imageUrl)}">`);
    metaTags.push(`<meta name="twitter:image:alt" content="${escapeHtml(title)}">`);
  }

  return metaTags.join('\n');
}

/**
 * Convert language code to Open Graph locale format
 */
function getOgLocale(languageCode) {
  const localeMap = {
    'en': 'en_US',
    'de': 'de_DE',
    'fr': 'fr_FR',
    'es': 'es_ES',
    'pt': 'pt_BR',
    'ar': 'ar_AR',
    'hi': 'hi_IN'
  };
  return localeMap[languageCode] || 'en_US';
}

/**
 * Escape HTML entities for meta tag content
 */
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generate hreflang tags for multi-language content
 */
function buildHreflangTags({ baseSlug, availableLanguages, currentLanguage }) {
  const baseUrl = config.seo?.canonicalBaseUrl || 'https://vivaverse.top';
  const hreflangTags = [];

  // Add hreflang for each available language
  for (const lang of availableLanguages) {
    const url = `${baseUrl}/${lang}/article/${baseSlug}`;
    hreflangTags.push(`<link rel="alternate" hreflang="${lang}" href="${url}">`);
  }

  // Add x-default for English
  const defaultUrl = `${baseUrl}/en/article/${baseSlug}`;
  hreflangTags.push(`<link rel="alternate" hreflang="x-default" href="${defaultUrl}">`);

  return hreflangTags.join('\n');
}

/**
 * Generate complete meta tags for an article (standard + social + hreflang)
 */
function buildCompleteMetaTags({ title, description, canonicalUrl, imageUrl, languageCode, baseSlug, availableLanguages }) {
  const metaTags = [];

  // Standard meta tags
  metaTags.push(`<meta charset="UTF-8">`);
  metaTags.push(`<meta name="viewport" content="width=device-width, initial-scale=1.0">`);
  metaTags.push(`<title>${escapeHtml(title)}</title>`);
  metaTags.push(`<meta name="description" content="${escapeHtml(description)}">`);
  metaTags.push(`<meta name="robots" content="index, follow">`);

  if (canonicalUrl) {
    metaTags.push(`<link rel="canonical" href="${escapeHtml(canonicalUrl)}">`);
  }

  // Social media meta tags
  const socialTags = buildSocialMetaTags({ title, description, canonicalUrl, imageUrl, languageCode });
  metaTags.push(socialTags);

  // Hreflang tags for multi-language support
  if (baseSlug && availableLanguages && availableLanguages.length > 1) {
    const hreflangTags = buildHreflangTags({ baseSlug, availableLanguages, currentLanguage: languageCode });
    metaTags.push(hreflangTags);
  }

  return metaTags.join('\n');
}

function appendJsonLd(html, ldArray) {
  if (!ldArray || !ldArray.length) return html;
  const payload = ldArray.length === 1 ? ldArray[0] : ldArray;
  const json = escapeJsonForHtml(payload);
  return `${html}\n<script type="application/ld+json">${json}</script>`;
}

async function createMasterArticle(category, { preferWebSearch = false } = {}) {
  const { system, user } = getPrompt('', category.slug);
  genLog('AI master start (natural text)', { category: category.slug });
  const tMasterStart = Date.now();
  
  // SINGLE AI CALL - asking for natural text
  const ai = await generateRobustArticle({ 
    system, 
    user, 
    preferWebSearch 
  });
  
  genLog('AI master done', { category: category.slug, ms: Date.now() - tMasterStart });
  
  // ALWAYS extract - no JSON parsing needed
  const extracted = extractFromNaturalText(ai.content, category.name);
  
  // Convert to expected JSON structure
  const masterJson = {
    title: extracted.title,
    metaTitle: extracted.title.length <= 60 ? extracted.title : extracted.title.slice(0, 57) + '...',
    metaDescription: extracted.metaDescription,
    intro: extracted.intro,
    sections: extracted.sections,
    faq: extracted.faq,
    keywords: extracted.keywords,
    externalLinks: extracted.externalLinks,
    summary: extracted.summary,
    sourceUrls: [],
    category: category.name
  };

  const totalWords = (extracted.intro + extracted.sections.map(s => s.body).join(' ') + 
                     extracted.faq.map(f => f.a).join(' ')).split(' ').length;
  
  genLog('Natural text extraction completed', { 
    category: category.slug, 
    sections: extracted.sections.length,
    faq: extracted.faq.length,
    words: totalWords,
    successRate: '100%'
  });

  // Build final article
  const title = masterJson.title;
  const slugBase = await generateUniqueSlug(toSlug(title));
  let contentHtml = sanitizeHtmlContent(assembleHtml(masterJson));
  const summary = masterJson.summary;
  const metaTitle = masterJson.metaTitle;
  const metaDescription = masterJson.metaDescription;
  const canonicalUrl = canonicalForSlug(slugBase, 'en');
  
  const tImgStart = Date.now();
  const imageUrl = await fetchUnsplashImageUrl(title);
  genLog('Unsplash fetched', { 
    category: category.slug, 
    ms: Date.now() - tImgStart, 
    hasImage: Boolean(imageUrl) 
  });
  
  const readingTime = estimateReadingTimeMinutes(contentHtml);

  let masterArticle = {
    title,
    slug: slugBase,
    content: contentHtml,
    summary,
    language_code: 'en',
    category_id: category.id,
    image_url: imageUrl,
    meta_title: metaTitle,
    meta_description: metaDescription,
    canonical_url: canonicalUrl,
    reading_time_minutes: readingTime,
    ai_model: ai.model,
    ai_prompt: user,
    ai_tokens_input: ai.usage?.prompt_tokens || 0,
    ai_tokens_output: ai.usage?.completion_tokens || 0,
    total_tokens: ai.usage?.total_tokens || 0,
    source_url: null,
    // content_hash will be added after final content is assembled
  };

  // Add word count validation to article structure
  masterArticle = addWordCountToArticle(masterArticle, contentHtml, category.slug);

  // Append JSON-LD schema
  const masterLd = buildArticleJsonLd({
    masterJson,
    title,
    description: metaDescription,
    canonicalUrl,
    imageUrl,
    languageCode: 'en',
  });
  masterArticle.content = appendJsonLd(masterArticle.content, masterLd);
  // Final content hash after sanitization and JSON-LD inclusion
  masterArticle.content_hash = computeHash(masterArticle.content + title);

  trackSuccess();

  return { masterArticle, masterJson };
}

// ========== TRANSLATION FUNCTIONS ==========

async function generateTranslationArticle({ lang, category, masterSlug, masterTitle, masterSummary, imageUrl, maxChunks }) {
  genLog('AI translation start', { category: category.slug, lang, masterSlug });
  const tTransStart = Date.now();

  // Get the master article's HTML content directly from database
  const masterRes = await query(
    `SELECT title, content, summary, meta_description FROM articles_en WHERE slug = $1`,
    [masterSlug]
  );
  
  if (!masterRes.rows.length) {
    throw new Error(`Master article not found: ${masterSlug}`);
  }

  const masterArticle = masterRes.rows[0];
  const originalContent = masterArticle.content;
  const originalTitle = masterArticle.title;
  const originalSummary = masterArticle.summary;
  const originalMetaDesc = masterArticle.meta_description;

  // Use HTML-aware translator to preserve exact structure
  // Use API-provided maxChunks or fall back to config default
  const effectiveMaxChunks = maxChunks !== undefined ? maxChunks : config.translation.defaultChunkCount;
  const translator = new HTMLTranslator(lang, { maxChunks: effectiveMaxChunks });

  // Create a combined content structure that includes all text to be translated
  // This reduces API calls from 4 per article to just 2 (when split in half)
  const combinedContent = {
    html: originalContent,
    title: originalTitle,
    summary: originalSummary || masterSummary || '',
    metaDescription: originalMetaDesc || originalSummary || ''
  };

  // Translate everything in one or two API calls
  const translatedResult = await translator.translateCombinedContent(combinedContent);

  let translatedContent = translatedResult.html;
  const translatedTitle = translatedResult.title;
  const translatedSummary = translatedResult.summary;
  const translatedMetaDesc = translatedResult.metaDescription;

  // Update title in HTML content
  translatedContent = translatedContent.replace(
    new RegExp(`<h1[^>]*>${escapeRegex(originalTitle)}</h1>`, 'gi'),
    `<h1>${translatedTitle}</h1>`
  );

  // Generate unique slug and canonical URL for target language
  const tSlug = await generateUniqueSlug(`${masterSlug}-${lang}`);
  const tCanonical = canonicalForSlug(tSlug, lang);

  // Update language and canonical URL in JSON-LD (HTMLTranslator handles most of it)
  translatedContent = translatedContent.replace(
    /"inLanguage":"en"/g,
    `"inLanguage":"${lang}"`
  );

  const readingTime = estimateReadingTimeMinutes(translatedContent);

  // Ensure meta_title and canonical_url are properly set
  const finalMetaTitle = translatedTitle || `${masterTitle} (${lang.toUpperCase()})`;
  const finalCanonicalUrl = tCanonical || canonicalForSlug(tSlug, lang);

  let translationArticle = {
    title: translatedTitle,
    slug: tSlug,
    content: translatedContent,
    summary: translatedSummary,
    meta_title: finalMetaTitle,
    meta_description: translatedMetaDesc,
    canonical_url: finalCanonicalUrl,
    image_url: imageUrl,
    reading_time_minutes: readingTime,
    language_code: lang,
    category_id: category.id,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    content_hash: computeHash(translatedContent + translatedTitle),
    ai_tokens_input: translator.getTokenStats().input || 0,
    ai_tokens_output: translator.getTokenStats().output || 0
  };

  genLog('AI translation done', { 
    category: category.slug, 
    lang, 
    ms: Date.now() - tTransStart 
  });

  trackSuccess();

  return { 
    translationArticle, 
    translatedTitle, 
    translatedSummary, 
    translatedContent 
  };
}

// ========== UTILITY FUNCTIONS ==========

// Legacy functions (disabled)
/*
async function createBestOfArticle(category, { preferWebSearch = false } = {}) {
  const { system, user } = getPrompt('best_of', category.name);
  genLog('AI best-of start', { category: category.slug });
  const tStart = Date.now();

  const ai = await generateRobustArticle({ system, user, preferWebSearch });

  genLog('AI best-of done', { category: category.slug, ms: Date.now() - tStart });

  const extracted = extractFromNaturalText(ai.content, category.name);

  const bestOfJson = {
    title: extracted.title,
    metaTitle: extracted.title.length <= 60 ? extracted.title : extracted.title.slice(0, 57) + '...',
    metaDescription: extracted.metaDescription,
    intro: extracted.intro,
    sections: extracted.sections,
    faq: extracted.faq,
    keywords: extracted.keywords,
    externalLinks: extracted.externalLinks,
    summary: extracted.summary,
    sourceUrls: [],
    category: category.name,
  };

  const title = bestOfJson.title;
  const slugBase = await generateUniqueSlug(toSlug(title));
  let contentHtml = sanitizeHtmlContent(assembleHtml(bestOfJson));
  const summary = bestOfJson.summary;
  const metaTitle = bestOfJson.metaTitle;
  const metaDescription = bestOfJson.metaDescription;
  const canonicalUrl = canonicalForSlug(slugBase, 'en');

  const imageUrl = await fetchUnsplashImageUrl(title);
  const readingTime = estimateReadingTimeMinutes(contentHtml);

  let bestOfArticle = {
    title,
    slug: slugBase,
    content: contentHtml,
    summary,
    language_code: 'en',
    category_id: category.id,
    image_url: imageUrl,
    meta_title: metaTitle,
    meta_description: metaDescription,
    canonical_url: canonicalUrl,
    reading_time_minutes: readingTime,
    ai_model: ai.model,
    ai_prompt: user,
    ai_tokens_input: ai.usage?.prompt_tokens || 0,
    ai_tokens_output: ai.usage?.completion_tokens || 0,
    total_tokens: ai.usage?.total_tokens || 0,
    source_url: null,
  };

  // Add word count validation to article structure
  bestOfArticle = addWordCountToArticle(bestOfArticle, contentHtml, category.slug);

  const bestOfLd = buildArticleJsonLd({
    masterJson: bestOfJson,
    title,
    description: metaDescription,
    canonicalUrl,
    imageUrl,
    languageCode: 'en',
  });
  bestOfArticle.content = appendJsonLd(bestOfArticle.content, bestOfLd);
  bestOfArticle.content_hash = computeHash(bestOfArticle.content + title);

  trackSuccess();

  return { bestOfArticle, bestOfJson };
}

async function createCompareArticle(category, { preferWebSearch = false } = {}) {
  const { system, user } = getPrompt('compare', category.name);
  genLog('AI compare start', { category: category.slug });
  const tStart = Date.now();

  const ai = await generateRobustArticle({ system, user, preferWebSearch });

  genLog('AI compare done', { category: category.slug, ms: Date.now() - tStart });

  const extracted = extractFromNaturalText(ai.content, category.name);

  const compareJson = {
    title: extracted.title,
    metaTitle: extracted.title.length <= 60 ? extracted.title : extracted.title.slice(0, 57) + '...',
    metaDescription: extracted.metaDescription,
    intro: extracted.intro,
    sections: extracted.sections,
    faq: extracted.faq,
    keywords: extracted.keywords,
    externalLinks: extracted.externalLinks,
    summary: extracted.summary,
    sourceUrls: [],
    category: category.name,
  };

  const title = compareJson.title;
  const slugBase = await generateUniqueSlug(toSlug(title));
  let contentHtml = sanitizeHtmlContent(assembleHtml(compareJson));
  const summary = compareJson.summary;
  const metaTitle = compareJson.metaTitle;
  const metaDescription = compareJson.metaDescription;
  const canonicalUrl = canonicalForSlug(slugBase, 'en');

  const imageUrl = await fetchUnsplashImageUrl(title);
  const readingTime = estimateReadingTimeMinutes(contentHtml);

  let compareArticle = {
    title,
    slug: slugBase,
    content: contentHtml,
    summary,
    language_code: 'en',
    category_id: category.id,
    image_url: imageUrl,
    meta_title: metaTitle,
    meta_description: metaDescription,
    canonical_url: canonicalUrl,
    reading_time_minutes: readingTime,
    ai_model: ai.model,
    ai_prompt: user,
    ai_tokens_input: ai.usage?.prompt_tokens || 0,
    ai_tokens_output: ai.usage?.completion_tokens || 0,
    total_tokens: ai.usage?.total_tokens || 0,
    source_url: null,
  };

  // Add word count validation to article structure
  compareArticle = addWordCountToArticle(compareArticle, contentHtml, category.slug);

  const compareLd = buildArticleJsonLd({
    masterJson: compareJson,
    title,
    description: metaDescription,
    canonicalUrl,
    imageUrl,
    languageCode: 'en',
  });
  compareArticle.content = appendJsonLd(compareArticle.content, compareLd);
  compareArticle.content_hash = computeHash(compareArticle.content + title);

  trackSuccess();

  return { compareArticle, compareJson };
}

async function createTrendsArticle(category, { preferWebSearch = false } = {}) {
  const { system, user } = getPrompt('trends', category.name);
  genLog('AI trends start', { category: category.slug });
  const tStart = Date.now();

  const ai = await generateRobustArticle({ system, user, preferWebSearch });
  genLog('AI trends done', { category: category.slug, ms: Date.now() - tStart });

  const extracted = extractFromNaturalText(ai.content, category.name);

  const trendsJson = {
    title: extracted.title,
    metaTitle: extracted.title.length <= 60 ? extracted.title : extracted.title.slice(0, 57) + '...',
    metaDescription: extracted.metaDescription,
    intro: extracted.intro,
    sections: extracted.sections,
    faq: extracted.faq,
    keywords: extracted.keywords,
    externalLinks: extracted.externalLinks,
    summary: extracted.summary,
    sourceUrls: [],
    category: category.name,
  };

  const title = trendsJson.title;
  const slugBase = await generateUniqueSlug(toSlug(title));
  let contentHtml = sanitizeHtmlContent(assembleHtml(trendsJson));
  const summary = trendsJson.summary;
  const metaTitle = trendsJson.metaTitle;
  const metaDescription = trendsJson.metaDescription;
  const canonicalUrl = canonicalForSlug(slugBase, 'en');

  const imageUrl = await fetchUnsplashImageUrl(title);
  const readingTime = estimateReadingTimeMinutes(contentHtml);

  let trendsArticle = {
    title,
    slug: slugBase,
    content: contentHtml,
    summary,
    language_code: 'en',
    category_id: category.id,
    image_url: imageUrl,
    meta_title: metaTitle,
    meta_description: metaDescription,
    canonical_url: canonicalUrl,
    reading_time_minutes: readingTime,
    ai_model: ai.model,
    ai_prompt: user,
    ai_tokens_input: ai.usage?.prompt_tokens || 0,
    ai_tokens_output: ai.usage?.completion_tokens || 0,
    total_tokens: ai.usage?.total_tokens || 0,
    source_url: null,
  };

  // Add word count validation to article structure
  trendsArticle = addWordCountToArticle(trendsArticle, contentHtml, category.slug);

  const trendsLd = buildArticleJsonLd({
    masterJson: trendsJson,
    title,
    description: metaDescription,
    canonicalUrl,
    imageUrl,
    languageCode: 'en',
  });
  trendsArticle.content = appendJsonLd(trendsArticle.content, trendsLd);
  trendsArticle.content_hash = computeHash(trendsArticle.content + title);

  trackSuccess();

  return { trendsArticle, trendsJson };
}
*/

// DEPRECATED: Legacy generation batch function - replaced by optimized generation
// This function uses different quota logic and can cause quota violations
export async function runGenerationBatch() {
  genLog('DEPRECATED: runGenerationBatch called - redirecting to optimized generation');
  genError('Legacy runGenerationBatch function called - this should not happen', {
    caller: 'runGenerationBatch',
    recommendation: 'Use runOptimizedGeneration or runManualGeneration instead'
  });

  // Return empty result to prevent quota violations
  return {
    generated: 0,
    error: 'Legacy function deprecated - use optimized generation instead',
    deprecated: true
  };
}

// Named export for on-demand generation endpoints
export { createMasterArticle, generateTranslationArticle, extractFromNaturalText, insertArticle, updateDailyTokenUsage, incrementJobCount, getCategories };
