import express from 'express';
import { query } from '../db.js';
import { config } from '../config.js';
import { articlesTable } from '../utils/articlesTable.js';

/**
 * Smart Priority and Freshness Calculation for SEO
 * Based on content age, category importance, and article performance
 */

// Priority weights by category (higher = more important for crawling)
const CATEGORY_PRIORITY_WEIGHTS = {
  'technology': 1.0,
  'business': 0.95,
  'finance': 0.95,
  'health': 0.9,
  'science': 0.85,
  'education': 0.8,
  'travel': 0.75,
  'sports': 0.7,
  'entertainment': 0.65,
  'lifestyle': 0.6,
  'default': 0.7
};

// Change frequency based on content type and age
const CHANGEFREQ_RULES = {
  // Breaking news and time-sensitive content
  'breaking': 'hourly',
  'news': 'daily',
  'technology': 'daily',
  'business': 'daily',
  'finance': 'daily',

  // Evergreen content
  'education': 'weekly',
  'health': 'weekly',
  'travel': 'monthly',
  'lifestyle': 'monthly',

  // Default fallback
  'default': 'weekly'
};

/**
 * Calculate dynamic priority based on article freshness and importance
 */
function calculateArticlePriority(article, categorySlug = 'default') {
  const now = new Date();
  const publishedAt = new Date(article.published_at || article.created_at || now);
  const ageInHours = (now - publishedAt) / (1000 * 60 * 60);
  const ageInDays = ageInHours / 24;

  // Base priority from category
  let basePriority = CATEGORY_PRIORITY_WEIGHTS[categorySlug] || CATEGORY_PRIORITY_WEIGHTS.default;

  // Freshness boost - newer content gets higher priority
  let freshnessFactor = 1.0;
  if (ageInHours <= 1) {
    // Brand new content (within 1 hour) - maximum boost
    freshnessFactor = 1.3;
  } else if (ageInHours <= 6) {
    // Very fresh (within 6 hours) - high boost
    freshnessFactor = 1.2;
  } else if (ageInHours <= 24) {
    // Fresh (within 24 hours) - medium boost
    freshnessFactor = 1.1;
  } else if (ageInDays <= 7) {
    // Recent (within 1 week) - small boost
    freshnessFactor = 1.05;
  } else if (ageInDays <= 30) {
    // Normal priority (within 1 month)
    freshnessFactor = 1.0;
  } else if (ageInDays <= 90) {
    // Slightly lower priority (1-3 months)
    freshnessFactor = 0.95;
  } else {
    // Older content gets lower priority
    freshnessFactor = 0.9;
  }

  // Calculate final priority
  let priority = basePriority * freshnessFactor;

  // Ensure priority stays within valid range (0.0 - 1.0)
  priority = Math.max(0.1, Math.min(1.0, priority));

  // Round to 1 decimal place
  return Math.round(priority * 10) / 10;
}

/**
 * Calculate dynamic change frequency based on content type and age
 */
function calculateChangeFreq(article, categorySlug = 'default') {
  const now = new Date();
  const publishedAt = new Date(article.published_at || article.created_at || now);
  const ageInHours = (now - publishedAt) / (1000 * 60 * 60);
  const ageInDays = ageInHours / 24;

  // Get base frequency from category
  let baseFreq = CHANGEFREQ_RULES[categorySlug] || CHANGEFREQ_RULES.default;

  // Adjust frequency based on content age
  if (ageInHours <= 6) {
    // Very fresh content changes more frequently
    return 'hourly';
  } else if (ageInHours <= 24) {
    // Fresh content (within 24 hours)
    return 'daily';
  } else if (ageInDays <= 7) {
    // Recent content (within 1 week)
    return baseFreq === 'monthly' ? 'weekly' : baseFreq;
  } else if (ageInDays <= 30) {
    // Normal frequency for content within 1 month
    return baseFreq;
  } else {
    // Older content changes less frequently
    if (baseFreq === 'hourly') return 'daily';
    if (baseFreq === 'daily') return 'weekly';
    if (baseFreq === 'weekly') return 'monthly';
    return 'monthly';
  }
}

const router = express.Router();

// Debug endpoint to check database connectivity and content
router.get('/debug/db-health', async (req, res) => {
  try {
    const dbTest = await query('SELECT 1 as test');
    const categoriesTest = await query('SELECT COUNT(*) as count FROM categories');
    const articlesTest = await query('SELECT COUNT(*) as count FROM articles_en');

    res.json({
      status: 'ok',
      dbConnected: true,
      testResult: dbTest.rows,
      categoriesCount: categoriesTest.rows[0].count,
      articlesCount: articlesTest.rows[0].count
    });
  } catch (err) {
    console.error('DB Health check failed:', err);
    res.status(500).json({ status: 'error', dbConnected: false, error: err.message });
  }
});

function getBaseUrl(req) {
  const explicit = String(config.seo?.canonicalBaseUrl || '').trim().replace(/\/$/, '');
  if (explicit) return explicit;
  const forwardedProto = (req.headers['x-forwarded-proto'] || '').toString().split(',')[0];
  const proto = forwardedProto || req.protocol || 'http';
  const host = req.get('host');
  return `${proto}://${host}`;
}

function escXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Helper that wraps a DB query and returns an empty result set when the
 * referenced table does not exist (PostgreSQL error code 42P01).  This lets
 * sitemap generation continue even if a sharded language table hasn’t been
 * created yet.
 *
 * @param {string} sql
 * @param {any[]} params
 * @returns {Promise<{ rows: any[] }>}
 */
async function safeQuery(sql, params = []) {
  try {
    return await query(sql, params);
  } catch (err) {
    if (err && err.code === '42P01') {
      return { rows: [] };
    }
    throw err;
  }
}

/**
 * Get the most recent content timestamp for a given language.
 * Returns null if no articles exist (or the table is missing).
 */
async function getLatestContentTimestampForLang(lang) {
  const tbl = articlesTable(lang);
  const sql = tbl === 'articles'
    ? `SELECT MAX(COALESCE(updated_at, published_at, created_at)) AS lastmod FROM ${tbl} WHERE language_code = $1`
    : `SELECT MAX(COALESCE(updated_at, published_at, created_at)) AS lastmod FROM ${tbl}`;
  const params = tbl === 'articles' ? [lang] : [];
  const res = await safeQuery(sql, params);
  return res.rows?.[0]?.lastmod || null;
}


function buildUrlsetXml(urls, options = {}) {
  const parts = [];
  parts.push('<?xml version="1.0" encoding="UTF-8"?>');

  // Add comment if provided
  if (options.comment) {
    parts.push(`<!-- ${options.comment} -->`);
  }

  parts.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
  for (const u of urls) {
    parts.push('  <url>');
    parts.push(`    <loc>${escXml(u.loc)}</loc>`);
    if (u.lastmod) parts.push(`    <lastmod>${escXml(new Date(u.lastmod).toISOString())}</lastmod>`);
    if (u.changefreq) parts.push(`    <changefreq>${u.changefreq}</changefreq>`);
    if (u.priority) parts.push(`    <priority>${u.priority}</priority>`);
    parts.push('  </url>');
  }
  parts.push('</urlset>');
  return parts.join('\n');
}

function buildSitemapIndexXml(sitemaps) {
  const parts = [];
  parts.push('<?xml version="1.0" encoding="UTF-8"?>');
  parts.push('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
  for (const sm of sitemaps) {
    parts.push('  <sitemap>');
    parts.push(`    <loc>${escXml(sm.loc)}</loc>`);
    if (sm.lastmod) parts.push(`    <lastmod>${escXml(new Date(sm.lastmod).toISOString())}</lastmod>`);
    parts.push('  </sitemap>');
  }
  parts.push('</sitemapindex>');
  return parts.join('\n');
}

async function generateStaticAndCategoryUrls(base, langs) {
  // Static pages with smart priority and changefreq
  const staticPages = [
    { path: '/', changefreq: 'hourly', priority: '1.0' }, // Homepage - highest priority, changes frequently
    { path: '/categories', changefreq: 'daily', priority: '0.9' }, // Categories page - high priority
    { path: '/about', changefreq: 'monthly', priority: '0.5' }, // About - static content
    { path: '/contact', changefreq: 'monthly', priority: '0.6' }, // Contact - important but static
    { path: '/faq', changefreq: 'monthly', priority: '0.4' }, // FAQ - helpful but static
    { path: '/privacy', changefreq: 'yearly', priority: '0.3' }, // Legal pages - rarely change
    { path: '/terms', changefreq: 'yearly', priority: '0.3' },
    { path: '/cookies', changefreq: 'yearly', priority: '0.3' }
  ];

  const urls = [];

  for (const l of langs) {
    // Homepage for each language
    urls.push({
      loc: `${base}/${l}`,
      changefreq: 'hourly',
      priority: '1.0',
      lastmod: new Date() // Homepage always has fresh lastmod
    });

    // Other static pages
    for (const page of staticPages.slice(1)) {
      urls.push({
        loc: `${base}/${l}${page.path}`,
        changefreq: page.changefreq,
        priority: page.priority
      });
    }
  }

  // Query all language-specific tables to get category information
  const languages = ['en', 'de', 'fr', 'es', 'pt', 'ar', 'hi'];
  const allCategories = new Map();

  for (const lang of languages) {
    const tableName = articlesTable(lang);
    const catSql = tableName === 'articles'
      ? `SELECT c.slug AS slug, a.language_code AS language_code,
                MAX(COALESCE(a.published_at, a.created_at)) AS lastmod
         FROM ${tableName} a
         JOIN categories c ON c.id = a.category_id
         WHERE a.language_code = $1
         GROUP BY c.slug, a.language_code`
      : `SELECT c.slug AS slug, '${lang}' AS language_code,
                MAX(COALESCE(a.published_at, a.created_at)) AS lastmod
         FROM ${tableName} a
         JOIN categories c ON c.id = a.category_id
         GROUP BY c.slug`;

    const catParams = tableName === 'articles' ? [lang] : [];
    const catRes = await safeQuery(catSql, catParams);

    for (const row of catRes.rows) {
      const key = `${row.slug}-${row.language_code}`;
      if (!allCategories.has(key) || (row.lastmod && (!allCategories.get(key).lastmod || row.lastmod > allCategories.get(key).lastmod))) {
        allCategories.set(key, row);
      }
    }
  }

  const catRes = { rows: Array.from(allCategories.values()) };
  for (const row of catRes.rows) {
    const l = row.language_code || 'en';
    if (!langs.includes(l)) continue;

    // Calculate smart priority for category pages
    const categoryPriority = CATEGORY_PRIORITY_WEIGHTS[row.slug] || CATEGORY_PRIORITY_WEIGHTS.default;
    const adjustedPriority = Math.min(0.9, categoryPriority + 0.1); // Category pages get slight boost

    urls.push({
      loc: `${base}/${l}/category/${encodeURIComponent(row.slug)}`,
      changefreq: 'daily', // Categories change daily as new articles are added
      lastmod: row.lastmod || new Date(),
      priority: adjustedPriority.toFixed(1),
    });
  }
  return urls;
}

async function countArticles(langs) {
  let totalCount = 0;

  for (const lang of langs) {
    const tableName = articlesTable(lang);
    const countSql = tableName === 'articles'
      ? `SELECT COUNT(*)::bigint AS count FROM ${tableName} WHERE language_code = $1`
      : `SELECT COUNT(*)::bigint AS count FROM ${tableName}`;

    const countParams = tableName === 'articles' ? [lang] : [];
    const { rows } = await safeQuery(countSql, countParams);
    totalCount += Number(rows[0]?.count || 0);
  }

  return totalCount;
}

async function fetchArticlesSlice(base, langs, offset, limit) {
  // Collect articles from all language-specific tables
  const allArticles = [];

  for (const lang of langs) {
    const tableName = articlesTable(lang);
    const articleSql = tableName === 'articles'
      ? `SELECT a.slug, a.language_code, COALESCE(a.published_at, a.created_at) AS lastmod,
                c.slug AS category_slug, COALESCE(a.published_at, a.created_at) AS published_at
         FROM ${tableName} a
         LEFT JOIN categories c ON c.id = a.category_id
         WHERE a.language_code = $1
         ORDER BY COALESCE(a.published_at, a.created_at) DESC, a.id DESC`
      : `SELECT a.slug, '${lang}' AS language_code, COALESCE(a.published_at, a.created_at) AS lastmod,
                c.slug AS category_slug, COALESCE(a.published_at, a.created_at) AS published_at
         FROM ${tableName} a
         LEFT JOIN categories c ON c.id = a.category_id
         ORDER BY COALESCE(a.published_at, a.created_at) DESC, a.id DESC`;

    const articleParams = tableName === 'articles' ? [lang] : [];
    const res = await safeQuery(articleSql, articleParams);

    for (const row of res.rows) {
      allArticles.push(row);
    }
  }

  // Sort all articles by date and apply offset/limit
  allArticles.sort((a, b) => new Date(b.lastmod || 0) - new Date(a.lastmod || 0));
  const slicedArticles = allArticles.slice(offset, offset + limit);

  const urls = [];
  for (const a of slicedArticles) {
    const l = a.language_code || 'en';

    // Calculate smart priority and changefreq based on article age and category
    const priority = calculateArticlePriority(a, a.category_slug);
    const changefreq = calculateChangeFreq(a, a.category_slug);

    urls.push({
      loc: `${base}/${l}/article/${encodeURIComponent(a.slug)}`,
      lastmod: a.lastmod || undefined,
      changefreq: changefreq,
      priority: priority.toString(),
    });
  }
  return urls;
}

/* ------------------------------------------------------------------
 * Per-language helpers (new)
 * ------------------------------------------------------------------ */

async function generateStaticAndCategoryUrlsForLang(base, lang) {
  // Static pages with smart priority and changefreq
  const staticPages = [
    { path: '/', changefreq: 'hourly', priority: '1.0' }, // Homepage - highest priority, changes frequently
    { path: '/categories', changefreq: 'daily', priority: '0.9' }, // Categories page - high priority
    { path: '/about', changefreq: 'monthly', priority: '0.5' }, // About - static content
    { path: '/contact', changefreq: 'monthly', priority: '0.6' }, // Contact - important but static
    { path: '/faq', changefreq: 'monthly', priority: '0.4' }, // FAQ - helpful but static
    { path: '/privacy', changefreq: 'yearly', priority: '0.3' }, // Legal pages - rarely change
    { path: '/terms', changefreq: 'yearly', priority: '0.3' },
    { path: '/cookies', changefreq: 'yearly', priority: '0.3' }
  ];

  const urls = [];

  // Static pages for this language with smart priorities
  for (const page of staticPages) {
    urls.push({
      loc: `${base}/${lang}${page.path === '/' ? '' : page.path}`,
      changefreq: page.changefreq,
      priority: page.priority,
      lastmod: page.path === '/' ? new Date() : undefined // Homepage always has fresh lastmod
    });
  }

  // Categories that actually have articles in this language
  const tbl = articlesTable(lang);
  // In the legacy `articles` table we must filter by language_code, whereas
  // the sharded tables (e.g. articles_de) contain only a single language and
  // therefore do **not** have this column.  Build the query dynamically to
  // avoid referencing a non-existent column.
  const catSql = tbl === 'articles'
    ? `SELECT DISTINCT c.slug AS slug,
            MAX(COALESCE(a.published_at, a.created_at)) AS lastmod
       FROM ${tbl} a
       JOIN categories c ON c.id = a.category_id
       WHERE a.language_code = $1
       GROUP BY c.slug`
    : `SELECT DISTINCT c.slug AS slug,
            MAX(COALESCE(a.published_at, a.created_at)) AS lastmod
       FROM ${tbl} a
       JOIN categories c ON c.id = a.category_id
       GROUP BY c.slug`;
  const catParams = tbl === 'articles' ? [lang] : [];
  // Use safeQuery to ignore missing sharded tables
  const catRes = await safeQuery(catSql, catParams);
  for (const row of catRes.rows) {
    // Calculate smart priority for category pages
    const categoryPriority = CATEGORY_PRIORITY_WEIGHTS[row.slug] || CATEGORY_PRIORITY_WEIGHTS.default;
    const adjustedPriority = Math.min(0.9, categoryPriority + 0.1); // Category pages get slight boost

    urls.push({
      loc: `${base}/${lang}/category/${encodeURIComponent(row.slug)}`,
      changefreq: 'daily', // Categories change daily as new articles are added
      lastmod: row.lastmod || new Date(),
      priority: adjustedPriority.toFixed(1),
    });
  }
  return urls;
}

async function fetchAllArticleUrlsForLang(base, lang) {
  const tbl = articlesTable(lang);
  // Include category information for smart priority calculation
  const artSql = tbl === 'articles'
    ? `SELECT a.slug, COALESCE(a.published_at, a.created_at) AS lastmod,
              c.slug AS category_slug, COALESCE(a.published_at, a.created_at) AS published_at
       FROM ${tbl} a
       LEFT JOIN categories c ON c.id = a.category_id
       WHERE a.language_code = $1
       ORDER BY COALESCE(a.published_at, a.created_at) DESC, a.id DESC`
    : `SELECT a.slug, COALESCE(a.published_at, a.created_at) AS lastmod,
              c.slug AS category_slug, COALESCE(a.published_at, a.created_at) AS published_at
       FROM ${tbl} a
       LEFT JOIN categories c ON c.id = a.category_id
       ORDER BY COALESCE(a.published_at, a.created_at) DESC, a.id DESC`;
  const artParams = tbl === 'articles' ? [lang] : [];
  const res = await safeQuery(artSql, artParams);
  const urls = [];
  for (const a of res.rows) {
    // Calculate smart priority and changefreq based on article age and category
    const priority = calculateArticlePriority(a, a.category_slug);
    const changefreq = calculateChangeFreq(a, a.category_slug);

    urls.push({
      loc: `${base}/${lang}/article/${encodeURIComponent(a.slug)}`,
      lastmod: a.lastmod || undefined,
      changefreq: changefreq,
      priority: priority.toString(),
    });
  }
  return urls;
}

/**
 * Generate Freshness Sitemap with only recently updated URLs
 * Super hack: Small sitemaps with fresh content get crawled more aggressively
 */
async function generateFreshnessSitemap() {
  const base = process.env.CANONICAL_BASE_URL || 'https://megaquantum.net';
  const langs = Array.isArray(config.languages) && config.languages.length > 0 ? config.languages : ['en'];

  // Freshness sitemap configuration
  const FRESHNESS_CONFIG = {
    maxUrls: Number(process.env.FRESH_SITEMAP_MAX_URLS || 10), // Keep it very small for max crawl priority
    maxAge: Number(process.env.FRESH_SITEMAP_MAX_AGE_DAYS || 3), // Only include URLs updated in last N days
    priorityBoost: 0.1      // Boost priority for fresh content
  };

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - FRESHNESS_CONFIG.maxAge);
  const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

  const urls = [];

  try {
    // Get recently updated articles across all languages
    for (const lang of langs) {
      const tableName = articlesTable(lang);

      const sql = tableName === 'articles'
        ? `SELECT a.title, a.slug, a.summary, a.published_at, a.created_at, a.updated_at,
                  c.name AS category_name, c.slug AS category_slug
           FROM ${tableName} a
           JOIN categories c ON c.id = a.category_id
           WHERE a.language_code = $1
           AND (a.updated_at >= $2 OR a.published_at >= $2 OR a.created_at >= $2)
           ORDER BY COALESCE(a.updated_at, a.published_at, a.created_at) DESC
           LIMIT $3`
        : `SELECT a.title, a.slug, a.summary, a.published_at, a.created_at, a.updated_at,
                  c.name AS category_name, c.slug AS category_slug
           FROM ${tableName} a
           JOIN categories c ON c.id = a.category_id
           WHERE (a.updated_at >= $1 OR a.published_at >= $1 OR a.created_at >= $1)
           ORDER BY COALESCE(a.updated_at, a.published_at, a.created_at) DESC
           LIMIT $2`;

      const params = tableName === 'articles'
        ? [lang, cutoffDateStr, FRESHNESS_CONFIG.maxUrls]
        : [cutoffDateStr, FRESHNESS_CONFIG.maxUrls];

      const result = await safeQuery(sql, params);

      for (const article of result.rows) {
        const lastmod = article.updated_at || article.published_at || article.created_at;
        const articleAge = (Date.now() - new Date(lastmod).getTime()) / (1000 * 60 * 60 * 24);

        // Calculate priority based on freshness and category
        let priority = calculateArticlePriority(article, article.category_slug);

        // Boost priority for very fresh content
        if (articleAge < 1) {
          priority = Math.min(1.0, priority + 0.2); // 24 hours boost
        } else if (articleAge < 3) {
          priority = Math.min(1.0, priority + 0.1); // 3 days boost
        }

        urls.push({
          loc: `${base}/${lang}/article/${encodeURIComponent(article.slug)}`,
          lastmod: new Date(lastmod).toISOString(),
          changefreq: articleAge < 1 ? 'hourly' : articleAge < 3 ? 'daily' : 'weekly',
          priority: priority.toFixed(1)
        });
      }
    }

    // Only include latest articles in freshness sitemap (no category pages) per requirement

    // Sort by last modified date (newest first) and limit
    urls.sort((a, b) => new Date(b.lastmod) - new Date(a.lastmod));
    const limitedUrls = urls.slice(0, FRESHNESS_CONFIG.maxUrls);

    // Generate XML
    const xml = buildUrlsetXml(limitedUrls, {
      comment: `Freshness Sitemap - ${limitedUrls.length} recently updated URLs (last ${FRESHNESS_CONFIG.maxAge} days)`
    });

    const newest = limitedUrls.length > 0 ? limitedUrls[0].lastmod : null;
    return { xml, newestLastmod: newest };


  } catch (error) {
    console.error('Error generating freshness sitemap:', error);

    // Fallback: return minimal sitemap with homepage
    const fallbackUrls = langs.map(lang => ({
      loc: `${base}/${lang}/`,
      lastmod: new Date().toISOString(),
      changefreq: 'daily',
      priority: '1.0'
    }));

    const xml = buildUrlsetXml(fallbackUrls, {
      comment: 'Freshness Sitemap - Fallback (error occurred)'
    });
    return { xml, newestLastmod: fallbackUrls[0]?.lastmod || null };
  }
}

// Serve sitemap index on both /sitemap.xml and /api/sitemap.xml for compatibility
router.get(['/sitemap.xml', '/api/sitemap.xml'], async (req, res) => {
  try {
    const base = getBaseUrl(req);
    const langs = Array.isArray(config.languages) && config.languages.length > 0 ? config.languages : ['en'];

    const sitemaps = [];
    let latestOverall = null;
    for (const lang of langs) {
      const lastmod = await getLatestContentTimestampForLang(lang);
      if (lastmod && (!latestOverall || new Date(lastmod) > new Date(latestOverall))) {
        latestOverall = lastmod;
      }
      sitemaps.push({ loc: `${base}/sitemaps/${lang}.xml`, lastmod });
    }

    const indexXml = buildSitemapIndexXml(sitemaps);
    res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    if (latestOverall) {
      res.setHeader('Last-Modified', new Date(latestOverall).toUTCString());
    }
    res.send(indexXml);
  } catch (err) {
    console.error('Sitemap index generation error:', err);
    res.status(500).type('text/plain').send('Failed to generate sitemap index');
  }
});

router.get('/sitemaps/:file', async (req, res) => {
  try {
    const file = String(req.params.file || '');
    const base = getBaseUrl(req);
    const allLangs = Array.isArray(config.languages) && config.languages.length > 0 ? config.languages : ['en'];

    // Debug: Log the request
    console.log(`Sitemap request: ${file}, base: ${base}, langs: ${allLangs}`);

    // Pattern A: language sitemap, e.g. "en.xml" or "de.xml"
    const langMatch = /^([a-z]{2})\.xml$/i.exec(file);
    if (langMatch) {
      const lang = langMatch[1].toLowerCase();
      if (!allLangs.includes(lang)) return res.status(404).type('text/plain').send('Language not supported');

      const staticUrls = await generateStaticAndCategoryUrlsForLang(base, lang);
      const articleUrls = await fetchAllArticleUrlsForLang(base, lang);
      const xml = buildUrlsetXml([...staticUrls, ...articleUrls]);
      res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(xml);
    }

    // Pattern B: old paginated sitemap (retain backward compat)
    const match = /^sitemap-(\d+)\.xml$/i.exec(file);
    if (!match) return res.status(404).type('text/plain').send('Not found');

    const langs = allLangs;
    const index = Number(match[1]);
    if (!Number.isFinite(index) || index < 1) return res.status(400).type('text/plain').send('Invalid sitemap index');
    const staticUrls = await generateStaticAndCategoryUrls(base, langs);
    const articleTotal = await countArticles(langs);
    const total = staticUrls.length + articleTotal;
    const MAX_URLS_PER_FILE = 49000;
    const start = (index - 1) * MAX_URLS_PER_FILE;
    if (start >= total) return res.status(404).type('text/plain').send('Not found');
    const end = Math.min(start + MAX_URLS_PER_FILE, total);
    const urls = [];
    const staticCount = staticUrls.length;
    // Portion from static+categories
    if (start < staticCount) {
      const staticEnd = Math.min(end, staticCount);
      urls.push(...staticUrls.slice(start, staticEnd));
    }
    // Portion from articles
    if (end > staticCount) {
      const articleStart = Math.max(0, start - staticCount);
      const articleLimit = end - Math.max(start, staticCount);
      const articleUrls = await fetchArticlesSlice(base, langs, articleStart, articleLimit);
      urls.push(...articleUrls);
    }
    const xml = buildUrlsetXml(urls);
    res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (err) {
    console.error('Sitemap generation error:', err);
    res.status(500).type('text/plain').send('Failed to generate sitemap');
  }
});

/**
 * Generate Freshness Sitemap (Super Hack)
 * Small sitemap with only recently updated URLs for maximum crawl priority
 * Crawlers LOVE small, recently updated sitemaps → faster crawling
 */
router.get('/sitemap-fresh.xml', async (req, res) => {
  try {
    console.log('Generating freshness sitemap...');
    const { xml, newestLastmod } = await generateFreshnessSitemap();
    res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
    res.setHeader('Cache-Control', 'public, max-age=600'); // 10 minutes cache for rapid updates
    res.setHeader('X-Sitemap-Type', 'freshness');
    if (newestLastmod) res.setHeader('Last-Modified', new Date(newestLastmod).toUTCString());
    console.log('Freshness sitemap generated successfully');
    res.send(xml);
  } catch (error) {
    console.error('Error generating freshness sitemap:', error);
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate freshness sitemap</error>');
  }
});

router.get('/robots.txt', async (req, res) => {
  const base = getBaseUrl(req);

  try {
    // Get categories dynamically from database
    const categoriesResult = await query('SELECT slug, name FROM categories ORDER BY slug');
    const categories = categoriesResult.rows;

    const robotsLines = [
      'User-agent: *',
      'Allow: /',
      '',
      '# Disallow query-based search results',
      'Disallow: /*/search',
      'Disallow: /*?q=',
      '',
      '# Sitemaps',
      `Sitemap: ${base}/sitemap.xml`,
      `Sitemap: ${base}/sitemap-fresh.xml`,
      '',
      '# HTML Sitemap (for enhanced crawling)',
      `# HTML Sitemap: ${base}/sitemap`,
      '',
      '# RSS Feeds (for discovery)',
      `# Main feed: ${base}/api/feeds/all.rss`,
    ];

    // Add dynamic category feeds
    for (const category of categories) {
      robotsLines.push(`# ${category.name}: ${base}/api/feeds/${category.slug}.rss`);
    }

    res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
    res.send(robotsLines.join('\n'));
  } catch (error) {
    console.error('Error generating robots.txt:', error);

    // Fallback robots.txt
    res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
    res.send([
      'User-agent: *',
      'Allow: /',
      '',
      '# Disallow query-based search results',
      'Disallow: /*/search',
      'Disallow: /*?q=',
      '',
      '# Sitemaps',
      `Sitemap: ${base}/sitemap.xml`,
      '',
      '# RSS Feeds',
      `# Main feed: ${base}/api/feeds/all.rss`,
    ].join('\n'));
  }
});

// Serve IndexNow verification key file at /{INDEXNOW_API_KEY}.txt
router.get('/:key.txt', (req, res) => {
  const requested = req.params.key;
  const configured = process.env.INDEXNOW_API_KEY || '';
  if (!configured) {
    return res.status(404).type('text/plain').send('Not Found');
  }
  // Only serve when the requested key matches the configured key
  if (requested === configured) {
    res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
    return res.send(configured);
  }
  return res.status(404).type('text/plain').send('Not Found');
});


// Expose a safe endpoint to trigger sitemap update notifications post-deploy
// Requires X-Admin-Token header to match process.env.SEO_ADMIN_TOKEN
router.post('/notify/sitemaps', async (req, res) => {
  try {
    const token = (req.headers['x-admin-token'] || '').toString();
    if (!token || token !== (process.env.SEO_ADMIN_TOKEN || '')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { notifySearchEnginesSitemapUpdate } = await import('../services/seoNotificationService.js');
    const result = await notifySearchEnginesSitemapUpdate();
    res.json({ ok: true, result });
  } catch (err) {
    console.error('Failed to notify sitemaps update:', err);
    res.status(500).json({ ok: false, error: 'Failed to trigger notifications' });
  }
});


export default router;