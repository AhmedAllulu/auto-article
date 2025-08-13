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
  const system = `You are an expert SEO content strategist and writer. Write high-quality, deeply informative, fact-checked articles with schema-friendly structure.

Important output rule: Respond ONLY with raw JSON matching the requested schema. Do not include any explanation, markdown, or code fences.`;

  const user = `Task: Research trending topics in the category "${categoryName}" and create ONE comprehensive SEO-optimized master article.

CRITICAL REQUIREMENTS - MINIMUM WORD COUNTS:
- Total article must be at least 2000+ words
- Intro paragraph: minimum 200-250 words (detailed introduction)
- Each section body: minimum 400-500 words with rich details, examples, statistics, and actionable insights
- Create at least 5-6 major sections minimum
- FAQ section: 8-10 detailed Q&A pairs (each answer 100+ words)

CONTENT REQUIREMENTS:
- Catchy SEO title (H1) - make it compelling and keyword-rich
- Comprehensive intro paragraph explaining the topic's importance, current trends, and what readers will learn
- At least 5-6 structured subheadings (H2/H3) covering different aspects thoroughly
- Each section must include:
  * Detailed explanations with specific examples
  * Current industry statistics and data
  * Best practices and actionable tips
  * Real-world case studies or scenarios
  * Future trends and predictions
- Extensive FAQ section with detailed answers
- Natural internal linking suggestions (anchor text + suggested slug)
- Meta title and meta description optimized for SEO
- Include comprehensive tags/keywords list
- Authoritative, expert tone with practical value

DEPTH AND DETAIL:
- Cover the topic comprehensively from multiple angles
- Include beginner to advanced insights
- Address common pain points and solutions
- Provide step-by-step guidance where applicable
- Reference current industry trends and future outlook
- Make every section substantial and valuable

Output strictly JSON with fields: title, metaTitle, metaDescription, intro, sections (array of {heading, body}), faq (array of {q, a}), keywords (array of strings), internalLinks (array of {anchor, slugSuggestion}), summary (2-3 detailed sentences), sourceUrls (array), category: "${categoryName}".

Remember: This must be a comprehensive, authoritative article that provides genuine value and ranks well in search engines. Minimum 2000+ words total.`;

  return { system, user };
}

function buildTranslationPrompt(targetLang, masterJson) {
  const system = `You are a professional translator specialized in SEO. Preserve SEO terms, structure, formatting, and intent.

Important output rule: Respond ONLY with raw JSON matching the requested schema. Do not include any explanation, markdown, or code fences.`;
  const user = `Translate the following article JSON into language: ${targetLang}.
- Preserve structure and headings
- Keep SEO key terms intact where they are brand or global
- Maintain the FAQ and internal links (translate anchor, keep slugSuggestion ascii-lowercase with dashes)
Return the same JSON structure fields. Output strictly valid JSON only.

CONTENT:
${JSON.stringify(masterJson)}`;
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

function buildMasterRepairPrompt(rawContent) {
  const system = `You are a strict JSON formatter. You receive imperfect or partial AI output and must return a single valid JSON object only. No explanations.`;
  const user = `Convert the following content into a single valid JSON object for a master article with fields:
title, metaTitle, metaDescription, intro, sections (array of {heading, body}), faq (array of {q, a}), keywords (array of strings), internalLinks (array of {anchor, slugSuggestion}), summary, sourceUrls (array), category.
Ensure all fields exist. Do not include any text outside JSON. If content is truncated, complete it logically.

CONTENT:
${String(rawContent).slice(0, 20000)}`;
  return { system, user };
}

function buildTranslationRepairPrompt(targetLang, rawContent) {
  const system = `You are a strict JSON formatter and translator. Return a single valid JSON object only. No explanations.`;
  const user = `Repair to valid JSON and ensure it is translated to language: ${targetLang}. Keep same structure and fields as the master article schema.
Fields: title, metaTitle, metaDescription, intro, sections (array of {heading, body}), faq (array of {q, a}), keywords (array of strings), internalLinks (array of {anchor, slugSuggestion}), summary, sourceUrls (array), category.
Do not include any text outside JSON.

CONTENT:
${String(rawContent).slice(0, 20000)}`;
  return { system, user };
}
// Try to parse JSON from imperfect AI responses by extracting code-fenced or first balanced JSON object
function parseJsonFromContent(content) {
  if (!content || typeof content !== 'string') return null;
  // 1) Code fence extraction
  const fenceMatch = content.match(/```json[\s\S]*?```/i) || content.match(/```[\s\S]*?```/);
  if (fenceMatch) {
    const inner = fenceMatch[0].replace(/^```json/i, '```').slice(3, -3); // strip ```json ... ```
    try {
      return JSON.parse(inner);
    } catch {}
  }
  // 2) Balanced brace extraction (first largest JSON object)
  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = content.slice(firstBrace, lastBrace + 1);
    // Attempt progressive trimming if trailing text sneaks inside
    for (let i = candidate.length; i >= 2; i--) {
      const slice = candidate.slice(0, i);
      try {
        return JSON.parse(slice);
      } catch {}
    }
  }
  // 3) Smart quotes normalization then retry direct parse
  const normalized = content
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");
  try {
    return JSON.parse(normalized);
  } catch {}
  return null;
}


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
  genLog('AI master start', { category: category.slug });
  const tMasterStart = Date.now();
  // Use robust generation with fallbacks to avoid 504s
  const ai = await generateRobustArticle({ system, user, preferWebSearch: config.oneMinAI.enableWebSearch });
  genLog('AI master done', { category: category.slug, ms: Date.now() - tMasterStart });
  let masterJson = parseJsonFromContent(ai.content);
  if (!masterJson) {
    if (DEBUG_GENERATION)
      genLog('Master JSON parse failed. Content preview:', String(ai.content).slice(0, 400));
    // Attempt a repair pass with a strict JSON repair prompt
    const { system: rs, user: ru } = buildMasterRepairPrompt(ai.content);
    try {
      const repaired = await generateRobustArticle({ system: rs, user: ru, preferWebSearch: false });
      masterJson = parseJsonFromContent(repaired.content);
    } catch {}
  }
  // If still no JSON, fallback: extract minimal fields from raw and save anyway
  if (!masterJson) {
    const fallbackTitle = extractTitleFromRaw(ai.content, category.name);
    const slugBase = toSlug(fallbackTitle);
    const summary = extractSummaryFromRaw(ai.content);
    const contentHtml = `<p>${summary}</p>`;
    const metaTitle = fallbackTitle;
    const metaDescription = summary;
    const canonicalUrl = canonicalForSlug(slugBase);
    const tImgStart = Date.now();
    const imageUrl = await fetchUnsplashImageUrl(fallbackTitle);
    genLog('Unsplash fetched (fallback)', { category: category.slug, ms: Date.now() - tImgStart, hasImage: Boolean(imageUrl) });
    const readingTime = estimateReadingTimeMinutes(contentHtml);
    const contentHash = computeHash(contentHtml + fallbackTitle);

    const masterArticle = {
      title: fallbackTitle,
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
      ai_model: 'fallback-raw',
      ai_prompt: user,
      ai_tokens_input: 0,
      ai_tokens_output: 0,
      total_tokens: 0,
      source_url: null,
      content_hash: contentHash,
    };

    // Append minimal JSON-LD with just headline/description
    const masterLd = buildArticleJsonLd({
      masterJson: {},
      title: fallbackTitle,
      description: metaDescription,
      canonicalUrl,
      imageUrl,
      languageCode: 'en',
    });
    masterArticle.content = appendJsonLd(masterArticle.content, masterLd);

    return { masterArticle, masterJson: null };
  }

  // Quality gate: ensure length/structure/sources; attempt up to two expansion passes if needed
  let quality = evaluateMasterQuality(masterJson);
  for (let pass = 0; pass < 2 && !quality.meetsAll; pass++) {
    const { system: es, user: eu } = buildMasterExpansionPrompt(category.name, masterJson);
    try {
      const expanded = await generateRobustArticle({ system: es, user: eu, preferWebSearch: false });
      const expandedJson = parseJsonFromContent(expanded.content);
      if (expandedJson) {
        masterJson = expandedJson;
        quality = evaluateMasterQuality(masterJson);
      }
    } catch {}
  }

  // Quality not fully met: log and continue saving to avoid data loss
  if (!quality.meetsAll) {
    genLog('Quality not fully met, saving anyway', { category: category.slug, quality });
  }

  const title = masterJson.title || `Insights in ${category.name}`;
  const slugBase = toSlug(title);
  let contentHtml = assembleHtml(masterJson);
  const summary = masterJson.summary || '';
  const metaTitle = masterJson.metaTitle || title;
  const metaDescription = masterJson.metaDescription || summary || '';
  const canonicalUrl = canonicalForSlug(slugBase);
  const tImgStart = Date.now();
  const imageUrl = await fetchUnsplashImageUrl(title);
  genLog('Unsplash fetched', { category: category.slug, ms: Date.now() - tImgStart, hasImage: Boolean(imageUrl) });
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
    source_url: (masterJson.sourceUrls && masterJson.sourceUrls[0]) || null,
    content_hash: contentHash,
  };

  // Append JSON-LD schema to master content
  const masterLd = buildArticleJsonLd({
    masterJson,
    title,
    description: metaDescription,
    canonicalUrl,
    imageUrl,
    languageCode: 'en',
  });
  masterArticle.content = appendJsonLd(masterArticle.content, masterLd);

  return { masterArticle, masterJson };
}

async function generateTranslationArticle({ lang, category, masterJson, slugBase, title, summary, imageUrl }) {
  const { system: ts, user: tu } = buildTranslationPrompt(lang, masterJson);
  genLog('AI translation start', { category: category.slug, lang });
  const tTransStart = Date.now();
  // Use robust generation preferring no web search for translations
  const aiT = await generateRobustArticle({ system: ts, user: tu, preferWebSearch: false });
  genLog('AI translation done', { category: category.slug, lang, ms: Date.now() - tTransStart });

  let tJson = parseJsonFromContent(aiT.content);
  if (!tJson) {
    // Attempt a repair pass to salvage the translation JSON
    const { system: rs, user: ru } = buildTranslationRepairPrompt(lang, aiT.content);
    try {
      const repaired = await generateRobustArticle({ system: rs, user: ru, preferWebSearch: false });
      tJson = parseJsonFromContent(repaired.content);
    } catch {}
  }
  if (!tJson) {
    genLog('Translation JSON parse failed, skipping', { category: category.slug, lang });
    return null;
  }

  const tTitle = tJson.title || title;
  const tSlug = `${slugBase}-${lang}`;
  let tContent = assembleHtml(tJson);
  const tSummary = tJson.summary || summary;
  const tMetaTitle = tJson.metaTitle || tTitle;
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
    source_url: (masterJson.sourceUrls && masterJson.sourceUrls[0]) || null,
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


