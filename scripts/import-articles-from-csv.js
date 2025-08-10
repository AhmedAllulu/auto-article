import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { parse } from 'csv-parse';
import slugify from 'slugify';
import { query, pool } from '../src/db/pool.js';
import readline from 'readline';
import { stdin as input, stdout as output } from 'node:process';
import config from '../src/config/env.js';
import logger from '../src/lib/logger.js';

dotenv.config();

// Cache of categories to avoid repeated DB lookups: slug -> id
const categoryCache = new Map();

async function loadCategoryCache(db = { query }) {
  const { rows } = await db.query('SELECT id, slug FROM categories', []);
  categoryCache.clear();
  for (const row of rows) {
    if (row.slug && row.id) categoryCache.set(String(row.slug), Number(row.id));
  }
  logger.info({ count: categoryCache.size }, 'Loaded category cache');
}

async function ensureCategory(db, { slug, name }) {
  const s = toSlug(slug || name || '');
  if (!s) return null;
  const cached = categoryCache.get(s);
  if (cached) return Number(cached);
  const sql = `
    INSERT INTO categories (name, slug)
    VALUES ($1, $2)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id;
  `;
  const { rows } = await db.query(sql, [name || slug, s]);
  const id = rows[0]?.id ? Number(rows[0].id) : null;
  if (id) categoryCache.set(s, id);
  return id;
}

// Built-in mapping from common Dutch labels (slugified) to system slugs
// Based on provided matches:
// - Tech -> technology
// - Economie -> finance
// - Wk Voetbal -> sports
// - Songfestival -> entertainment
// - Politiek -> business
const defaultCategoryMapBySlug = Object.freeze({
  'tech': 'technology',
  'economie': 'finance',
  'wk-voetbal': 'sports',
  'songfestival': 'entertainment',
  'politiek': 'business',
});

// ---- Utilities ----
function trimToLength(text, maxLen) {
  if (!text) return null;
  const t = text.trim().replace(/\s+/g, ' ');
  if (t.length <= maxLen) return t;
  return t.slice(0, maxLen - 1).trimEnd() + '…';
}

function computeReadingTimeMinutes(text) {
  if (!text) return null;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function stripHtml(input) {
  if (!input) return '';
  // Remove tags
  let out = String(input).replace(/<[^>]*>/g, ' ');
  // Decode common entities
  out = out
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      try { return String.fromCharCode(parseInt(hex, 16)); } catch { return ''; }
    })
    .replace(/&#(\d+);/g, (_, num) => {
      try { return String.fromCharCode(parseInt(num, 10)); } catch { return ''; }
    });
  // Collapse whitespace
  return out.replace(/\s+/g, ' ').trim();
}

function getFirstNonEmptyStringField(record, candidateKeys) {
  for (const key of candidateKeys) {
    const value = record[key];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > 0) return trimmed;
    }
  }
  return '';
}

function asciiRatio(text) {
  if (!text) return 1;
  const s = String(text);
  let ascii = 0;
  for (let i = 0; i < s.length; i += 1) {
    if (s.charCodeAt(i) <= 0x7f) ascii += 1;
  }
  return ascii / s.length;
}

function isMostlyEnglishAscii(title, content) {
  // Reject if either title or content contains too many non-ascii chars
  const threshold = 0.98; // allow up to 2% non-ascii (e.g., numbers, punctuation are ascii)
  return asciiRatio(title) >= threshold && asciiRatio(content) >= threshold;
}

function toSlug(text) {
  return slugify(String(text || ''), { lower: true, strict: true, trim: true });
}

function getCategoryIdFromCache(categorySlug) {
  const slug = toSlug(categorySlug || '');
  if (!slug) return null;
  const cached = categoryCache.get(slug);
  return cached ? Number(cached) : null;
}

async function insertArticle(db, {
  title,
  content,
  languageCode,
  categoryId,
  publishedAt,
  sourceUrl = null,
}) {
  const slug = toSlug(title);
  const cleanContent = content.trim();
  const summary = trimToLength(cleanContent, config.seo?.maxMetaDescriptionLength || 160);
  const readingTimeMinutes = computeReadingTimeMinutes(cleanContent);
  const metaTitle = trimToLength(title, config.seo?.maxTitleLength || 60);
  const metaDescription = summary;

  const sql = `
    INSERT INTO articles (
      title, slug, content, summary, language_code, category_id, image_url,
      meta_title, meta_description, canonical_url,
      og_title, og_description, og_image,
      twitter_title, twitter_description, twitter_image,
      reading_time_minutes, source_url, ai_model, ai_prompt,
      ai_tokens_input, ai_tokens_output, total_tokens, published_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,
      $8,$9,$10,
      $11,$12,$13,
      $14,$15,$16,
      $17,$18,$19,$20,
      $21,$22,(COALESCE($21::int,0)+COALESCE($22::int,0)),$23
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id;
  `;

  const params = [
    title,
    slug,
    cleanContent,
    summary,
    languageCode,
    categoryId,
    null, // image_url
    metaTitle,
    metaDescription,
    null, // canonical_url
    null, // og_title
    null, // og_description
    null, // og_image
    null, // twitter_title
    null, // twitter_description
    null, // twitter_image
    readingTimeMinutes,
    sourceUrl, // source_url
    null, // ai_model
    null, // ai_prompt
    0,    // ai_tokens_input
    0,    // ai_tokens_output
    publishedAt,
  ];

  const { rows } = await db.query(sql, params);
  return rows[0]?.id || null;
}

async function insertBatchArticles(db, rows) {
  if (!rows || rows.length === 0) return { rowCount: 0 };
  // Each row maps to 23 parameters (keep in sync with single insert)
  const columns = [
    'title','slug','content','summary','language_code','category_id','image_url',
    'meta_title','meta_description','canonical_url',
    'og_title','og_description','og_image',
    'twitter_title','twitter_description','twitter_image',
    'reading_time_minutes','source_url','ai_model','ai_prompt',
    'ai_tokens_input','ai_tokens_output','published_at'
  ];
  const valuesParts = [];
  const params = [];
  for (let i = 0; i < rows.length; i += 1) {
    const r = rows[i];
    // push in the same order as columns
    params.push(
      r.title,
      r.slug,
      r.content,
      r.summary,
      r.languageCode,
      r.categoryId,
      null, // image_url
      r.metaTitle,
      r.metaDescription,
      null, // canonical_url
      null, // og_title
      null, // og_description
      null, // og_image
      null, // twitter_title
      null, // twitter_description
      null, // twitter_image
      r.readingTimeMinutes,
      r.sourceUrl,
      null, // ai_model
      null, // ai_prompt
      0, // ai_tokens_input
      0, // ai_tokens_output
      r.publishedAt
    );
    const base = i * columns.length;
    const placeholders = Array.from({ length: columns.length }, (_, k) => `$${base + k + 1}`);
    valuesParts.push(`(${placeholders.join(',')})`);
  }
  const sql = `
    INSERT INTO articles (
      ${columns.join(', ')}
    ) VALUES 
      ${valuesParts.join(',\n')}
    ON CONFLICT (slug) DO NOTHING
  `;
  return db.query(sql, params);
}

async function main() {
  const csvPath = process.argv[2] || path.resolve(process.cwd(), 'dutch-news-articles.csv');
  const dryRun = process.argv.includes('--dry-run');
  const forcedCategoryArg = (process.argv.find((a) => a.startsWith('--category=')) || '').split('=')[1];
  const forcedCategorySlug = forcedCategoryArg ? toSlug(forcedCategoryArg) : null;
  const languageArg = (process.argv.find((a) => a.startsWith('--language=')) || '').split('=')[1] || 'en';
  const languageCode = String(languageArg).trim().slice(0, 5).toLowerCase() || 'en';
  const skipLanguageCheck = process.argv.includes('--skip-language-check');
  const limitArg = (process.argv.find((a) => a.startsWith('--limit=')) || '').split('=')[1] || '';
  const maxRows = Number(limitArg) > 0 ? Number(limitArg) : null;
  const createMissingCategories = process.argv.includes('--create-missing-categories');
  const categoryMapPath = (process.argv.find((a) => a.startsWith('--category-map=')) || '').split('=')[1] || '';
  const batchSizeArg = (process.argv.find((a) => a.startsWith('--batch-size=')) || '').split('=')[1] || '';
  const batchSize = Number(batchSizeArg) > 0 ? Math.min(Number(batchSizeArg), 5000) : 1000;
  const fastCommit = process.argv.includes('--fast-commit');
  const progressEveryArg = (process.argv.find((a) => a.startsWith('--progress-every=')) || '').split('=')[1] || '';
  const progressEvery = Number(progressEveryArg) > 0 ? Number(progressEveryArg) : 10000;
  let categoryMap = null;
  try {
    if (categoryMapPath && fs.existsSync(categoryMapPath)) {
      const raw = fs.readFileSync(categoryMapPath, 'utf8');
      categoryMap = JSON.parse(raw);
    }
  } catch (err) {
    logger.warn({ err }, 'Failed to read category map; proceeding without it');
  }

  if (!fs.existsSync(csvPath)) {
    logger.error(`CSV file not found: ${csvPath}`);
    process.exit(1);
  }

  logger.info({ csvPath, dryRun, languageCode, forcedCategorySlug: forcedCategorySlug || undefined, createMissingCategories, hasCategoryMap: !!categoryMap }, 'Starting CSV import');

  // Preload categories and optionally start a transaction
  let client = null;
  if (dryRun) {
    await loadCategoryCache();
  } else {
    client = await pool.connect();
    await client.query('BEGIN');
    if (fastCommit) {
      try { await client.query('SET LOCAL synchronous_commit TO OFF'); } catch {}
    }
    await loadCategoryCache(client);
  }

  // Allowed categories are those already present in DB (from cache)
  const allowedCategorySlugs = new Set([...categoryCache.keys()]);

  let processed = 0;
  let inserted = 0;
  let skippedNonEnglish = 0;
  let skippedInvalid = 0;
  let skippedDuplicate = 0;
  let skippedUnknownCategory = 0;

  const parser = fs
    .createReadStream(csvPath)
    .pipe(
      parse({
        columns: true,
        bom: true,
        relax_quotes: true,
        relax_column_count: true,
        skip_empty_lines: true,
        trim: true,
        to_line: undefined // stream all
      })
    );

  const batch = [];
  const t0 = Date.now();
  for await (const record of parser) {
    processed += 1;
    try {
      // Flexible column mapping to support multiple CSV schemas including Dutch variants
      const rawContent = getFirstNonEmptyStringField(record, [
        'body_text', 'content', 'artikel', 'tekst', 'text', 'body', 'Article', 'article'
      ]);
      const rawDate = getFirstNonEmptyStringField(record, [
        'crawl_time', 'published_at', 'publish_time', 'Date', 'date', 'datum', 'datetime'
      ]);
      const rawTitle = getFirstNonEmptyStringField(record, [
        'title', 'Heading', 'heading', 'titel'
      ]);
      const rawUrl = getFirstNonEmptyStringField(record, [
        'url', 'canonical', 'link'
      ]);
      const csvCategoryRaw = getFirstNonEmptyStringField(record, [
        'category', 'categorie'
      ]);

      const content = stripHtml(String(rawContent || ''));
      const title = String(rawTitle || '').trim();
      // Determine category: prefer CSV category if it matches existing DB categories; otherwise
      // fall back to an explicitly provided --category. If neither match, skip the row.
      let categorySlug = null;
      let candidate = null;
      if (csvCategoryRaw) {
        candidate = toSlug(csvCategoryRaw);
      }
      // Apply mapping (support keys by slug or raw label)
      let mappedTarget = null;
      if (categoryMap) {
        mappedTarget = categoryMap[candidate] || categoryMap[csvCategoryRaw];
        if (mappedTarget) mappedTarget = toSlug(mappedTarget);
      }
      if (!mappedTarget && candidate) {
        const builtin = defaultCategoryMapBySlug[candidate];
        if (builtin) mappedTarget = toSlug(builtin);
      }
      // Choose category slug based on priority
      if (mappedTarget && allowedCategorySlugs.has(mappedTarget)) {
        categorySlug = mappedTarget;
      } else if (candidate && allowedCategorySlugs.has(candidate)) {
        categorySlug = candidate;
      } else if (!dryRun && createMissingCategories && (candidate || mappedTarget)) {
        // Create missing category in DB
        const toCreateSlug = mappedTarget || candidate;
        const toCreateName = csvCategoryRaw || mappedTarget;
        const createdId = await ensureCategory(client, { slug: toCreateSlug, name: toCreateName });
        if (createdId) {
          allowedCategorySlugs.add(toCreateSlug);
          categorySlug = toCreateSlug;
        }
      } else if (dryRun && createMissingCategories && (candidate || mappedTarget)) {
        // In dry-run, simulate availability
        const toCreateSlug = mappedTarget || candidate;
        allowedCategorySlugs.add(toCreateSlug);
        categorySlug = toCreateSlug;
      } else if (forcedCategorySlug && allowedCategorySlugs.has(forcedCategorySlug)) {
        categorySlug = forcedCategorySlug;
      }
      if (!categorySlug) {
        skippedUnknownCategory += 1;
        continue;
      }

      if (!title || !content) {
        skippedInvalid += 1;
        continue;
      }

      // Language/content filter: keep strict ASCII check only for English unless explicitly skipped
      if (!skipLanguageCheck && languageCode === 'en') {
        if (!isMostlyEnglishAscii(title, content)) {
          skippedNonEnglish += 1;
          continue;
        }
      }

      // Parse date: support mm/dd/yyyy and ISO-like crawl_time
      let publishedAt = null;
      if (rawDate) {
        const s = String(rawDate).trim();
        if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(s)) {
          const [a, b, yRaw] = s.split(/[\/\-]/);
          const y = Number(yRaw.length === 2 ? (Number(yRaw) + 2000) : yRaw);
          const first = Number(a);
          const second = Number(b);
          let day = second;
          let month = first;
          // Heuristics: if first > 12 then it's clearly day-first (dd-mm-yyyy)
          // If second > 12, then it's clearly month-first (mm-dd-yyyy)
          if (first > 12 && second <= 12) {
            day = first;
            month = second;
          }
          if (Number.isFinite(month) && Number.isFinite(day) && Number.isFinite(y) && month >= 1 && month <= 12 && day >= 1 && day <= 31 && y >= 1900) {
            publishedAt = new Date(Date.UTC(y, month - 1, day, 12, 0, 0));
          }
        } else {
          const t = Date.parse(s);
          if (!Number.isNaN(t)) publishedAt = new Date(t);
        }
      }

      const categoryId = dryRun ? 0 : getCategoryIdFromCache(categorySlug);
      if (!dryRun && !categoryId) {
        // Should not happen because we checked allowedCategorySlugs; skip defensively
        skippedUnknownCategory += 1;
        continue;
      }

      if (dryRun) {
        inserted += 1; // count as would-insert
        if (maxRows && processed >= maxRows) break;
        continue;
      }

      const articleRow = {
        title,
        slug: toSlug(title),
        content,
        summary: trimToLength(content, config.seo?.maxMetaDescriptionLength || 160),
        languageCode,
        categoryId,
        publishedAt,
        sourceUrl: rawUrl || null,
        readingTimeMinutes: computeReadingTimeMinutes(content),
        metaTitle: trimToLength(title, config.seo?.maxTitleLength || 60),
        metaDescription: trimToLength(content, config.seo?.maxMetaDescriptionLength || 160),
      };
      batch.push(articleRow);

      if (batch.length >= batchSize) {
        const res = await insertBatchArticles(client, batch);
        const insertedNow = res.rowCount || 0;
        inserted += insertedNow;
        const duplicatesNow = batch.length - insertedNow;
        if (duplicatesNow > 0) skippedDuplicate += duplicatesNow;
        batch.length = 0;
      }

      if (progressEvery && processed % progressEvery === 0) {
        const dt = Math.max(1, Date.now() - t0);
        const rate = Math.round((processed / dt) * 1000);
        logger.info({ processed, inserted, skippedDuplicate, rate_per_sec: rate }, 'Import progress');
      }
      if (maxRows && processed >= maxRows) break;
    } catch (err) {
      skippedInvalid += 1;
      logger.warn({ err }, 'Skipping invalid row');
    }
  }

  // Flush remaining
  if (!dryRun && batch.length > 0) {
    const res = await insertBatchArticles(client, batch);
    const insertedNow = res.rowCount || 0;
    inserted += insertedNow;
    const duplicatesNow = batch.length - insertedNow;
    if (duplicatesNow > 0) skippedDuplicate += duplicatesNow;
  }

  if (dryRun) {
    logger.info({ processed, inserted, skippedNonEnglish, skippedInvalid, skippedDuplicate, skippedUnknownCategory }, 'CSV dry-run finished (no DB changes)');
    return;
  }

  // Ask before commit
  logger.info({ processed, inserted, skippedNonEnglish, skippedInvalid, skippedDuplicate, skippedUnknownCategory }, 'Import complete. Pending confirmation to commit.');
  const rl = readline.createInterface({ input, output });
  const autoYes = process.argv.includes('--yes');
  const autoNo = process.argv.includes('--no');
  let answer = 'n';
  if (autoYes || autoNo || !process.stdin.isTTY) {
    answer = autoYes ? 'y' : 'n';
  } else {
    answer = await new Promise((resolve) => rl.question('Commit these changes to the database? [y/N]: ', resolve));
  }
  rl.close();

  if (String(answer).trim().toLowerCase() === 'y') {
    await client.query('COMMIT');
    logger.info('Changes committed to the database.');
  } else {
    await client.query('ROLLBACK');
    logger.warn('Changes rolled back. No data was saved.');
  }

  if (client) client.release();
}

main()
  .catch((err) => {
    logger.error({ err }, 'CSV import failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    try { await pool.end(); } catch {}
  });


