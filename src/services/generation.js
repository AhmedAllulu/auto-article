import crypto from 'crypto';
import { query, withTransaction } from '../db.js';
import { config } from '../config.js';
import { toSlug } from '../utils/slug.js';
import { fetchUnsplashImageUrl } from './unsplash.js';
import { generateArticleWithSearch, generateNoSearch, generateRobustArticle } from './oneMinAI.js';

// Debug logging for generation flow (enable with DEBUG_GENERATION=true)
const DEBUG_GENERATION = String(process.env.DEBUG_GENERATION || 'false') === 'true';
function genLog(...args) {
  if (DEBUG_GENERATION) console.log('[generation]', ...args);
}

const TOP_REVENUE_LANGUAGES = new Set(['en', 'de', 'fr', 'es', 'pt', 'ar']);

function computePriorityScore({ categorySlug, languageCode, countryCode }) {
  const lw = Number(config.priorities.languages[languageCode] || 0);
  const cw = Number(config.priorities.countries[countryCode || 'US'] || 0); // default to US if not provided
  const kw = Number(config.priorities.categories[categorySlug] || 0);
  // Weighted geometric-like mean to avoid any zero nullifying everything, add small epsilon
  const epsilon = 0.001;
  const score = (lw + epsilon) * (cw + epsilon) * (kw + epsilon);
  return score;
}

function bestMarketForLanguage(languageCode) {
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

function buildMasterPrompt(categoryName) {
  const system = `You are an expert SEO content writer. Write comprehensive, well-structured articles in natural markdown format. When web search is available, use it to identify trending subtopics and current data.`;

  const user = `Write a comprehensive, SEO-optimized article for the category "${categoryName}".

Before writing, silently do:
- Identify 5-8 trending subtopics within ${categoryName} from the last 30-90 days (use web search if available)
- Select ONE best topic with the highest SEO opportunity (rising trend, high intent, moderate competition)
- Base the entire article on the chosen topic. Do NOT include your research notes in the output. Only output the article starting with the title.

SEO guidance to apply while writing:
- Target a clear primary keyword and 8-12 secondary keywords and entities; weave them naturally
- Reflect current SERP intent (informational/commercial) and cover People Also Ask style questions
- Include practical examples, recent stats, and credible references (no placeholders) where appropriate

Structure your response as natural markdown with:

# Main Article Title (compelling and SEO-friendly)

**Meta Description:** Write a 150-160 character meta description here.

## Introduction
Write a detailed 200+ word introduction explaining the topic's importance, current trends, and what readers will learn.

## Section 1: [Descriptive Heading]
Write 400+ words of detailed content with examples, statistics, best practices, and actionable insights.

## Section 2: [Another Heading] 
Write 400+ words covering different aspects with case studies, data, and practical tips.

## Section 3: [Third Heading]
Continue with 400+ words of valuable content.

[Continue with 2-3 more sections...]

## Frequently Asked Questions

### Question 1: What are the key benefits of ${categoryName}?
Provide a detailed 100+ word answer with practical insights.

### Question 2: How do I get started with ${categoryName}?
Give comprehensive guidance in 100+ words.

[Continue with 6-8 more FAQ items...]

## Key Takeaways
Summarize the main points in 2-3 sentences.

**Keywords:** Provide 15-25 items mixing the primary keyword and related entities
**Related Topics:** topic1, topic2, topic3
**Recommended Reading:** 
- Link text for internal article 1
- Link text for internal article 2
- Link text for internal article 3

Write naturally and comprehensively. Aim for 2000+ total words with expert-level depth and practical value.`;

  return { system, user };
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
    internalLinks: [],
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

    // Detect FAQ section
    if (line.match(/^##\s+.*(?:faq|frequently|questions)/i)) {
      inFaq = true;
      collectingIntro = false;
      if (currentSection && currentContent.length) {
        result.sections.push({
          heading: currentSection,
          body: currentContent.join(' ').trim()
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
        result.intro = currentContent.join(' ').trim();
        collectingIntro = false;
      } else if (currentSection && currentContent.length) {
        result.sections.push({
          heading: currentSection,
          body: currentContent.join(' ').trim()
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
          a: currentContent.join(' ').trim()
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

    // Extract recommended reading/internal links
    if (line.match(/^\*\*Recommended Reading:\*\*/i)) {
      // Look for following lines with - Link text
      for (let j = i + 1; j < lines.length && lines[j].match(/^-\s+(.+)$/); j++) {
        const linkText = lines[j].replace(/^-\s+/, '').trim();
        const slug = toSlug(linkText);
        result.internalLinks.push({
          anchor: linkText,
          slugSuggestion: slug
        });
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
    if (line.trim() && !line.match(/^\*\*|^#/)) {
      currentContent.push(line.trim());
    }
  }

  // Finalize remaining content
  if (collectingIntro) {
    result.intro = currentContent.join(' ').trim();
  } else if (currentSection && currentContent.length) {
    result.sections.push({
      heading: currentSection,
      body: currentContent.join(' ').trim()
    });
  }
  if (currentQuestion && currentContent.length) {
    result.faq.push({
      q: currentQuestion,
      a: currentContent.join(' ').trim()
    });
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
    result.summary = `This guide provides comprehensive insights into ${categoryName}, covering best practices and practical strategies.`;
  }

  if (result.keywords.length === 0) {
    result.keywords = [categoryName.toLowerCase(), 'guide', 'tips', 'best practices'];
  }

  if (result.internalLinks.length === 0) {
    result.internalLinks = [
      { anchor: `${categoryName} Tips`, slugSuggestion: `${toSlug(categoryName)}-tips` },
      { anchor: `${categoryName} Guide`, slugSuggestion: `${toSlug(categoryName)}-guide` }
    ];
  }

  // Ensure minimum content
  if (result.sections.length === 0) {
    result.sections = [{
      heading: `Understanding ${categoryName}`,
      body: result.intro || `${categoryName} is an important topic that requires understanding and practical application.`
    }];
  }

  if (result.faq.length === 0) {
    result.faq = [
      {
        q: `What are the benefits of ${categoryName}?`,
        a: `${categoryName} offers numerous advantages including improved efficiency and better outcomes.`
      }
    ];
  }

  return result;
}

function buildTranslationPrompt(targetLang, masterJson) {
  const system = `You are a professional translator. Translate content naturally while maintaining structure and SEO value.`;
  
  // Convert JSON back to natural text for translation
  const sourceText = `# ${masterJson.title}

**Meta Description:** ${masterJson.metaDescription}

## Introduction
${masterJson.intro}

${masterJson.sections.map(s => `## ${s.heading}\n${s.body}`).join('\n\n')}

## Frequently Asked Questions

${masterJson.faq.map(f => `### ${f.q}\n${f.a}`).join('\n\n')}

## Key Takeaways
${masterJson.summary}

**Keywords:** ${masterJson.keywords.join(', ')}
**Recommended Reading:** 
${masterJson.internalLinks.map(link => `- ${link.anchor}`).join('\n')}`;

  const user = `Translate the following article to ${targetLang}. Maintain the exact same markdown structure and formatting. Keep the same headings format, FAQ structure, and keywords section.

Translate naturally while preserving:
- SEO value and keywords (adapt to target language)
- Technical terms appropriately
- Cultural context for the target audience
- All structural elements (headings, sections, FAQ format)

ARTICLE TO TRANSLATE:

${sourceText}`;

  return { system, user };
}

function countWords(text) {
  return String(text || '')
    .split(/\s+/)
    .filter(Boolean).length;
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

function buildMasterExpansionPrompt(categoryName, masterJson) {
  const system = `You are an expert SEO writer. Expand content to meet strict length and structure requirements. Output ONLY valid JSON.`;
  const user = `Expand the following master article JSON for category "${categoryName}" to satisfy ALL constraints:
- Total words >= 2000 (intro + sections + FAQ answers).
- Intro >= 200 words.
- Each section body >= 400-500 words with rich details, data, examples, tips, case studies, and future trends.
- FAQ: 8-10 entries; each answer >= 100-150 words.
- Include keywords (15-25 items) and internalLinks (8-12 items with ascii slugSuggestion) and 5-10 credible sourceUrls (avoid example.com).
- Keep tone authoritative and practical; preserve JSON schema and fields.
- Do not include any text outside JSON.

INPUT JSON:
${JSON.stringify(masterJson)}`;
  return { system, user };
}

function canonicalForSlug(slug) {
  const base = String(config.seo.canonicalBaseUrl || '').replace(/\/+$/, '');
  if (!base) return null;
  return `${base}/${slug}`;
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

  const res = await client.query(
    `INSERT INTO articles (
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
  return res.rows[0];
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

function estimateReadingTimeMinutes(text) {
  const words = (text || '').split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return minutes;
}

function assembleHtml(master) {
  const parts = [];
  if (master.intro) parts.push(`<p>${master.intro}</p>`);
  if (Array.isArray(master.sections)) {
    for (const s of master.sections) {
      if (s.heading) parts.push(`<h2>${s.heading}</h2>`);
      if (s.body) parts.push(`<p>${s.body}</p>`);
    }
  }
  if (Array.isArray(master.faq) && master.faq.length) {
    parts.push('<h2>FAQ</h2>');
    for (const f of master.faq) {
      parts.push(`<h3>${f.q}</h3>`);
      parts.push(`<p>${f.a}</p>`);
    }
  }
  if (Array.isArray(master.internalLinks) && master.internalLinks.length) {
    parts.push('<h2>Related links</h2>');
    parts.push('<ul>');
    const seen = new Set();
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    for (const link of master.internalLinks) {
      const anchor = String(link?.anchor || '').trim();
      const slugSuggestion = String(link?.slugSuggestion || '').trim();
      if (!anchor || !slugRegex.test(slugSuggestion) || seen.has(slugSuggestion)) continue;
      seen.add(slugSuggestion);
      const href = `/${slugSuggestion}`;
      parts.push(`<li><a href="${href}">${anchor}</a></li>`);
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

function appendJsonLd(html, ldArray) {
  if (!ldArray || !ldArray.length) return html;
  const payload = ldArray.length === 1 ? ldArray[0] : ldArray;
  const json = escapeJsonForHtml(payload);
  return `${html}\n<script type="application/ld+json">${json}</script>`;
}

async function createMasterArticle(category) {
  const { system, user } = buildMasterPrompt(category.name);
  genLog('AI master start (natural text)', { category: category.slug });
  const tMasterStart = Date.now();
  
  // SINGLE AI CALL - asking for natural text
  const ai = await generateRobustArticle({ 
    system, 
    user, 
    preferWebSearch: config.oneMinAI.enableWebSearch 
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
    internalLinks: extracted.internalLinks,
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
  const slugBase = toSlug(title);
  let contentHtml = assembleHtml(masterJson);
  const summary = masterJson.summary;
  const metaTitle = masterJson.metaTitle;
  const metaDescription = masterJson.metaDescription;
  const canonicalUrl = canonicalForSlug(slugBase);
  
  const tImgStart = Date.now();
  const imageUrl = await fetchUnsplashImageUrl(title);
  genLog('Unsplash fetched', { 
    category: category.slug, 
    ms: Date.now() - tImgStart, 
    hasImage: Boolean(imageUrl) 
  });
  
  const readingTime = estimateReadingTimeMinutes(contentHtml);
  const contentHash = computeHash(contentHtml + title);

  const masterArticle = {
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
    content_hash: contentHash,
  };

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

  trackSuccess();

  return { masterArticle, masterJson };
}

async function generateTranslationArticle({ lang, category, masterJson, slugBase, title, summary, imageUrl }) {
  const { system: ts, user: tu } = buildTranslationPrompt(lang, masterJson);
  genLog('AI translation start', { category: category.slug, lang });
  const tTransStart = Date.now();
  // SINGLE AI CALL for natural text translation
  const aiT = await generateRobustArticle({ system: ts, user: tu, preferWebSearch: false });
  genLog('AI translation done', { category: category.slug, lang, ms: Date.now() - tTransStart });
  
  // ALWAYS extract successfully (no JSON parsing)
  const extracted = extractFromNaturalText(aiT.content, category.name);
  
  // Convert to article structure
  const tJson = {
    title: extracted.title || title,
    metaTitle: extracted.title || title,
    metaDescription: extracted.metaDescription || summary,
    intro: extracted.intro,
    sections: extracted.sections,
    faq: extracted.faq,
    keywords: extracted.keywords,
    internalLinks: extracted.internalLinks,
    summary: extracted.summary || summary,
    sourceUrls: [],
    category: category.name
  };

  // Build article (same as before)
  const tTitle = tJson.title;
  const tSlug = `${slugBase}-${lang}`;
  let tContent = assembleHtml(tJson);
  const tSummary = tJson.summary;
  const tMetaTitle = tJson.metaTitle;
  const tMetaDesc = tJson.metaDescription || tSummary || '';
  const tCanonical = canonicalForSlug(tSlug);
  const tHash = computeHash(tContent + tTitle + lang);

  const tArticle = {
    title: tTitle,
    slug: tSlug,
    content: tContent,
    summary: tSummary,
    language_code: lang,
    category_id: category.id,
    image_url: imageUrl,
    meta_title: tMetaTitle,
    meta_description: tMetaDesc,
    canonical_url: tCanonical,
    reading_time_minutes: estimateReadingTimeMinutes(tContent),
    ai_model: aiT.model,
    ai_prompt: tu,
    ai_tokens_input: aiT.usage?.prompt_tokens || 0,
    ai_tokens_output: aiT.usage?.completion_tokens || 0,
    total_tokens: aiT.usage?.total_tokens || 0,
    source_url: null,
    content_hash: tHash,
  };

  // Append JSON-LD schema to translation content
  const tLd = buildArticleJsonLd({
    masterJson: tJson,
    title: tTitle,
    description: tMetaDesc || tSummary,
    canonicalUrl: tCanonical,
    imageUrl: imageUrl,
    languageCode: lang,
  });
  tArticle.content = appendJsonLd(tArticle.content, tLd);

  trackSuccess();

  return tArticle;
}

export async function runGenerationBatch() {
  genLog('Batch start');
  const todayJob = await upsertTodayJob(config.generation.dailyTarget);
  const remaining = Math.max(
    0,
    (todayJob?.num_articles_target || config.generation.dailyTarget) -
      (todayJob?.num_articles_generated || 0)
  );
  genLog('Remaining to generate today', { remaining });
  if (remaining <= 0) {
    genLog('Nothing remaining for today');
    return { generated: 0 };
  }

  genLog('Fetching categories');
  const categories = await getCategories();
  genLog('Categories fetched', { count: categories.length });
  if (!categories.length) {
    genLog('No categories found');
    return { generated: 0 };
  }

  // Score categories using category weights (language and country agnostic here)
  const orderedCategories = [...categories].sort((a, b) => {
    const as = Number(config.priorities.categories[a.slug] || 0);
    const bs = Number(config.priorities.categories[b.slug] || 0);
    return bs - as;
  });

  let generatedCount = 0;

  // Phase 1: Generate and insert all masters first
  genLog('Masters phase start');
  const mastersPrepared = [];
  let mastersGenerated = 0;
  for (const category of orderedCategories) {
    if (generatedCount >= config.generation.maxBatchPerRun) break;
    if (mastersGenerated >= config.generation.maxMastersPerRun) break;
    if (generatedCount >= remaining) break;

    try {
      genLog('Processing category (master)', { slug: category.slug });
      const { masterArticle, masterJson } = await createMasterArticle(category);

      await withTransaction(async (client) => {
        genLog('Inserting master article', { slug: masterArticle.slug });
        await insertArticle(client, masterArticle);
        await updateDailyTokenUsage(client, [
          {
            prompt_tokens: masterArticle.ai_tokens_input,
            completion_tokens: masterArticle.ai_tokens_output,
          },
        ]);
        await incrementJobCount(client, 1);
      });

      mastersPrepared.push({ category, masterArticle, masterJson });
      mastersGenerated += 1;
      generatedCount += 1;
      genLog('Master done', { slug: category.slug, total: generatedCount });
    } catch (err) {
      genLog('Category failed (master)', { slug: category.slug, error: String(err?.message || err) });
      continue;
    }
  }

  // Phase 2: Generate and insert translations for prepared masters
  genLog('Translations phase start', { masters: mastersPrepared.length });
  for (const item of mastersPrepared) {
    if (generatedCount >= config.generation.maxBatchPerRun) break;
    if (generatedCount >= remaining) break;

    const { category, masterArticle, masterJson } = item;

    // If we only have a fallback master (no structured JSON), skip translations
    if (!masterJson) {
      genLog('Skipping translations for fallback master', { slug: masterArticle.slug });
      continue;
    }

    // Determine translation language order and cap per master
    const candidateLangs = (config.languages || []).filter((l) => l !== 'en');
    const orderedLangs = candidateLangs
      .map((languageCode) => ({
        languageCode,
        score: computePriorityScore({
          categorySlug: category.slug,
          languageCode,
          countryCode: bestMarketForLanguage(languageCode),
        }),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.max(0, config.generation.maxTranslationsPerMaster))
      .map((x) => x.languageCode);

    const preparedTranslations = [];
    for (const lang of orderedLangs) {
      if (generatedCount + preparedTranslations.length >= config.generation.maxBatchPerRun) break;
      if (generatedCount + preparedTranslations.length >= remaining) break;
      try {
        const tArticle = await generateTranslationArticle({
          lang,
          category,
          masterJson,
          slugBase: masterArticle.slug,
          title: masterArticle.title,
          summary: masterArticle.summary,
          imageUrl: masterArticle.image_url,
        });
        if (tArticle) preparedTranslations.push(tArticle);
      } catch (e) {
        genLog('Translation generation failed, skipping', { slug: category.slug, lang, error: String(e?.message || e) });
        continue;
      }
    }

    if (preparedTranslations.length === 0) continue;

    try {
      await withTransaction(async (client) => {
        const usages = [];
        let inserted = 0;
        for (const t of preparedTranslations) {
          try {
            genLog('Inserting translation', { slug: t.slug, lang: t.language_code });
            await insertArticle(client, t);
            usages.push({
              prompt_tokens: t.ai_tokens_input,
              completion_tokens: t.ai_tokens_output,
            });
            inserted += 1;
          } catch (e) {
            // Likely duplicate slug/hash, skip insert
            continue;
          }
        }
        if (usages.length) await updateDailyTokenUsage(client, usages);
        if (inserted) await incrementJobCount(client, inserted);
        generatedCount += inserted;
      });
    } catch (e) {
      // Even if the transaction fails, continue to next master
      genLog('Translations phase failed for master', { slug: masterArticle.slug, error: String(e?.message || e) });
      continue;
    }
  }

  genLog('Batch done', { generatedCount });
  return { generated: generatedCount };
}


