import crypto from 'crypto';
import { query, withTransaction } from '../db.js';
import pino from 'pino';
import { config } from '../config.js';
import { toSlug } from '../utils/slug.js';
import { fetchUnsplashImageUrl } from './unsplash.js';
import { generateArticleWithSearch, generateNoSearch } from './oneMinAI.js';

const TOP_REVENUE_LANGUAGES = new Set(['en', 'de', 'fr', 'es', 'pt', 'ar']);
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

function computeHash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function buildMasterPrompt(categoryName) {
  const system = `You are an expert SEO content strategist and writer. Write high-quality, deeply informative, fact-checked articles with schema-friendly structure.`;
  const user = `Task: Research trending topics in the category "${categoryName}" and create ONE full SEO-optimized master article.

Requirements:
- Catchy SEO title (H1)
- Intro paragraph (60-100 words)
- Structured subheadings (H2/H3)
- Keyword optimization for high-intent queries
- FAQ section (5 Q&A)
- Natural internal linking suggestions (anchor text + suggested slug)
- Meta title and meta description
- Include tags/keywords list
- Keep tone authoritative, clear, and helpful.

Output JSON with fields: title, metaTitle, metaDescription, intro, sections (array of {heading, body}), faq (array of {q, a}), keywords (array of strings), internalLinks (array of {anchor, slugSuggestion}), summary (1-2 sentences), sourceUrls (array), category: "${categoryName}".`;
  return { system, user };
}

function buildTranslationPrompt(targetLang, masterJson) {
  const system = `You are a professional translator specialized in SEO. Preserve SEO terms, structure, formatting, and intent.`;
  const user = `Translate the following article JSON into language: ${targetLang}.
- Preserve structure and headings
- Keep SEO key terms intact where they are brand or global
- Maintain the FAQ and internal links (translate anchor, keep slugSuggestion ascii-lowercase with dashes)
Return the same JSON structure fields.

CONTENT:
${JSON.stringify(masterJson)}`;
  return { system, user };
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
  const ai = await generateArticleWithSearch(system, user);
  let masterJson;
  try {
    masterJson = typeof ai.content === 'object' ? ai.content : JSON.parse(ai.content);
  } catch (e) {
    // Attempt to salvage JSON from within text responses
    const match = String(ai.content || '').match(/\{[\s\S]*\}/);
    if (match) {
      try {
        masterJson = JSON.parse(match[0]);
      } catch (e2) {
        throw new Error('AI did not return valid JSON for master article');
      }
    } else {
      throw new Error('AI did not return valid JSON for master article');
    }
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
  const imageUrl = await fetchUnsplashImageUrl(title);
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
    const aiT = await generateNoSearch(ts, tu);
    let tJson;
    try {
      tJson = JSON.parse(aiT.content);
    } catch (e) {
      // Skip invalid translation, continue
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
  const todayJob = await upsertTodayJob(config.generation.dailyTarget);
  const remaining = Math.max(
    0,
    (todayJob?.num_articles_target || config.generation.dailyTarget) -
      (todayJob?.num_articles_generated || 0)
  );
  if (remaining <= 0) return { generated: 0 };

  const categories = await getCategories();
  if (!categories.length) {
    logger.warn('no categories found; generation skipped');
    return { generated: 0 };
  }

  // Choose categories prioritizing top revenue ones from env
  const preferred = config.categoriesEnv;
  const orderedCategories = [
    ...categories.filter((c) => preferred.includes(c.slug)),
    ...categories.filter((c) => !preferred.includes(c.slug)),
  ];

  let generatedCount = 0;

  for (const category of orderedCategories) {
    if (generatedCount >= config.generation.maxBatchPerRun) break;

    try {
      const { masterArticle, translations } = await createMasterAndTranslations(
        category
      );

      await withTransaction(async (client) => {
        // Insert master first
        const masterInserted = await insertArticle(client, masterArticle);
        logger.info({ articleId: masterInserted.id, slug: masterInserted.slug }, 'inserted master article');

        // Insert translations prioritizing top languages
        const sortedTranslations = translations.sort((a, b) => {
          const aTop = TOP_REVENUE_LANGUAGES.has(a.language_code) ? 0 : 1;
          const bTop = TOP_REVENUE_LANGUAGES.has(b.language_code) ? 0 : 1;
          return aTop - bTop;
        });

        const usages = [{
          prompt_tokens: masterArticle.ai_tokens_input,
          completion_tokens: masterArticle.ai_tokens_output,
        }];

        for (const t of sortedTranslations) {
          try {
            await insertArticle(client, t);
            logger.info({ slug: t.slug, lang: t.language_code }, 'inserted translation');
            usages.push({
              prompt_tokens: t.ai_tokens_input,
              completion_tokens: t.ai_tokens_output,
            });
          } catch (e) {
            // Likely duplicate slug/hash, skip
            logger.warn({ slug: t.slug, lang: t.language_code, err: e?.message }, 'failed to insert translation (likely duplicate)');
          }
        }

        await updateDailyTokenUsage(client, usages);
        await incrementJobCount(client, 1 + sortedTranslations.length);
      });

      generatedCount += 1 + translations.length;
      if (generatedCount >= remaining) break;
    } catch (err) {
      // AI call or assembly failure
      logger.error({ category: category.slug, err }, 'generation failed for category');
      continue;
    }
  }

  return { generated: generatedCount };
}


