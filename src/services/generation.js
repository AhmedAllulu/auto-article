import crypto from 'crypto';
import { query, withTransaction } from '../db.js';
import { config } from '../config.js';
import { toSlug } from '../utils/slug.js';
import { fetchUnsplashImageUrl } from './unsplash.js';
import { generateArticleWithSearch, generateNoSearch } from './oneMinAI.js';

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
  const user = `Task: Research trending topics in the category "${categoryName}" and create ONE full SEO-optimized master article.

Requirements:
- Catchy SEO title (H1)
- Intro paragraph (at least 120-180 words)
- Structured subheadings (H2/H3)
- Each section body should be substantial (200-300+ words) with rich details and examples
- Keyword optimization for high-intent queries
- FAQ section (5 Q&A)
- Natural internal linking suggestions (anchor text + suggested slug)
- Meta title and meta description
- Include tags/keywords list
- Keep tone authoritative, clear, and helpful.

Output strictly JSON with fields: title, metaTitle, metaDescription, intro, sections (array of {heading, body}), faq (array of {q, a}), keywords (array of strings), internalLinks (array of {anchor, slugSuggestion}), summary (2-3 sentences), sourceUrls (array), category: "${categoryName}".`;
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
  return parts.join('\n');
}

async function createMasterAndTranslations(category) {
  const { system, user } = buildMasterPrompt(category.name);
  genLog('AI master start', { category: category.slug });
  const tMasterStart = Date.now();
  const ai = await generateArticleWithSearch(system, user);
  genLog('AI master done', { category: category.slug, ms: Date.now() - tMasterStart });
  let masterJson = parseJsonFromContent(ai.content);
  if (!masterJson) {
    if (DEBUG_GENERATION) genLog('Master JSON parse failed. Content preview:', String(ai.content).slice(0, 400));
    throw new Error('AI did not return valid JSON for master article');
  }

  const title = masterJson.title || `Insights in ${category.name}`;
  const slugBase = toSlug(title);
  const contentHtml = assembleHtml(masterJson);
  const summary = masterJson.summary || '';
  const metaTitle = masterJson.metaTitle || title;
  const metaDescription = masterJson.metaDescription || summary || '';
  const canonicalUrl = config.seo.canonicalBaseUrl
    ? `${config.seo.canonicalBaseUrl}/${slugBase}`
    : null;
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

  const translations = [];
  for (const lang of config.languages) {
    if (lang === 'en') continue;
    const { system: ts, user: tu } = buildTranslationPrompt(lang, masterJson);
    genLog('AI translation start', { category: category.slug, lang });
    const tTransStart = Date.now();
    const aiT = await generateNoSearch(ts, tu);
    genLog('AI translation done', { category: category.slug, lang, ms: Date.now() - tTransStart });
    let tJson = parseJsonFromContent(aiT.content);
    if (!tJson) {
      genLog('Translation JSON parse failed, skipping', { category: category.slug, lang });
      continue;
    }
    const tTitle = tJson.title || title;
    const tSlug = `${slugBase}-${lang}`;
    const tContent = assembleHtml(tJson);
    const tSummary = tJson.summary || summary;
    const tMetaTitle = tJson.metaTitle || tTitle;
    const tMetaDesc = tJson.metaDescription || tSummary || '';
    const tCanonical = config.seo.canonicalBaseUrl
      ? `${config.seo.canonicalBaseUrl}/${tSlug}`
      : null;
    const tHash = computeHash(tContent + tTitle + lang);

    translations.push({
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
      source_url: masterArticle.source_url,
      content_hash: tHash,
    });
  }

  return { masterArticle, translations };
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

  let mastersGenerated = 0;
  for (const category of orderedCategories) {
    if (generatedCount >= config.generation.maxBatchPerRun) break;
    if (mastersGenerated >= config.generation.maxMastersPerRun) break;

    try {
      genLog('Processing category', { slug: category.slug });
      const { masterArticle, translations } = await createMasterAndTranslations(
        category
      );

      await withTransaction(async (client) => {
        genLog('Inserting master article', { slug: masterArticle.slug });
        // Insert master first
        const masterInserted = await insertArticle(client, masterArticle);

        // Score translations by language priority; take top N by config
        const sortedTranslations = translations
          .map((t) => ({
            item: t,
            score: computePriorityScore({
              categorySlug: category.slug,
              languageCode: t.language_code,
              countryCode: bestMarketForLanguage(t.language_code),
            }),
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, Math.max(0, config.generation.maxTranslationsPerMaster))
          .map((x) => x.item);

        const usages = [{
          prompt_tokens: masterArticle.ai_tokens_input,
          completion_tokens: masterArticle.ai_tokens_output,
        }];

        for (const t of sortedTranslations) {
          try {
            genLog('Inserting translation', { slug: t.slug, lang: t.language_code });
            await insertArticle(client, t);
            usages.push({
              prompt_tokens: t.ai_tokens_input,
              completion_tokens: t.ai_tokens_output,
            });
          } catch (e) {
            // Likely duplicate slug/hash, skip
          }
        }

        await updateDailyTokenUsage(client, usages);
        await incrementJobCount(client, 1 + sortedTranslations.length);
      });

      mastersGenerated += 1;
      generatedCount += 1 + sortedTranslations.length;
      genLog('Category done', { slug: category.slug, added: 1 + translations.length, total: generatedCount });
      if (generatedCount >= remaining) break;
    } catch (err) {
      // Continue to next category
      // Optionally log errors; kept minimal here
      genLog('Category failed', { slug: category.slug, error: String(err?.message || err) });
      continue;
    }
  }

  genLog('Batch done', { generatedCount });
  return { generated: generatedCount };
}


