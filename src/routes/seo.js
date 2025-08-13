import express from 'express';
import { query } from '../db.js';
import { config } from '../config.js';

const router = express.Router();

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

function buildUrlsetXml(urls) {
  const parts = [];
  parts.push('<?xml version="1.0" encoding="UTF-8"?>');
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
  const staticPaths = ['/', '/categories', '/about', '/contact', '/faq', '/privacy', '/terms', '/cookies'];
  const urls = [];

  for (const l of langs) {
    urls.push({ loc: `${base}/${l}`, changefreq: 'daily', priority: '1.0' });
    for (const p of staticPaths.slice(1)) {
      urls.push({ loc: `${base}/${l}${p}`, changefreq: 'weekly', priority: '0.6' });
    }
  }

  const catRes = await query(
    `SELECT c.slug AS slug, a.language_code AS language_code,
            MAX(COALESCE(a.published_at, a.created_at)) AS lastmod
     FROM articles a
     JOIN categories c ON c.id = a.category_id
     GROUP BY c.slug, a.language_code`
  );
  for (const row of catRes.rows) {
    const l = row.language_code || 'en';
    if (!langs.includes(l)) continue;
    urls.push({
      loc: `${base}/${l}/category/${encodeURIComponent(row.slug)}`,
      changefreq: 'daily',
      lastmod: row.lastmod || undefined,
      priority: '0.7',
    });
  }
  return urls;
}

async function countArticles(langs) {
  const { rows } = await query(
    `SELECT COUNT(*)::bigint AS count
     FROM articles
     WHERE language_code = ANY($1)`,
    [langs]
  );
  return Number(rows[0]?.count || 0);
}

async function fetchArticlesSlice(base, langs, offset, limit) {
  const res = await query(
    `SELECT slug, language_code, COALESCE(published_at, created_at) AS lastmod
     FROM articles
     WHERE language_code = ANY($1)
     ORDER BY COALESCE(published_at, created_at) DESC, id DESC
     OFFSET $2 LIMIT $3`,
    [langs, offset, limit]
  );
  const urls = [];
  for (const a of res.rows) {
    const l = a.language_code || 'en';
    urls.push({
      loc: `${base}/${l}/article/${encodeURIComponent(a.slug)}`,
      lastmod: a.lastmod || undefined,
      changefreq: 'monthly',
      priority: '0.8',
    });
  }
  return urls;
}

router.get('/sitemap.xml', async (req, res) => {
  try {
    const base = getBaseUrl(req);
    const langs = Array.isArray(config.languages) && config.languages.length > 0 ? config.languages : ['en'];
    const staticUrls = await generateStaticAndCategoryUrls(base, langs);
    const articleTotal = await countArticles(langs);
    const total = staticUrls.length + articleTotal;

    const MAX_URLS_PER_FILE = 49000;
    if (total > MAX_URLS_PER_FILE) {
      const parts = Math.ceil(total / MAX_URLS_PER_FILE);
      const sitemaps = [];
      for (let i = 0; i < parts; i++) {
        const loc = `${base}/sitemaps/sitemap-${i + 1}.xml`;
        sitemaps.push({ loc, lastmod: new Date() });
      }
      const indexXml = buildSitemapIndexXml(sitemaps);
      res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(indexXml);
      return;
    }

    // Single-file sitemap
    const remaining = Math.max(0, MAX_URLS_PER_FILE - staticUrls.length);
    const articleUrls = remaining > 0 ? await fetchArticlesSlice(base, langs, 0, remaining) : [];
    const xml = buildUrlsetXml([...staticUrls, ...articleUrls]);
    res.setHeader('Content-Type', 'application/xml; charset=UTF-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (err) {
    res.status(500).type('text/plain').send('Failed to generate sitemap');
  }
});

router.get('/sitemaps/:file', async (req, res) => {
  try {
    const base = getBaseUrl(req);
    const langs = Array.isArray(config.languages) && config.languages.length > 0 ? config.languages : ['en'];
    const match = /^sitemap-(\d+)\.xml$/i.exec(String(req.params.file || ''));
    if (!match) return res.status(404).type('text/plain').send('Not found');
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
    res.status(500).type('text/plain').send('Failed to generate sitemap part');
  }
});

router.get('/robots.txt', async (req, res) => {
  const base = getBaseUrl(req);
  res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
  res.send([
    'User-agent: *',
    'Allow: /',
    '',
    '# Disallow query-based search results',
    'Disallow: /*/search',
    'Disallow: /*?q=',
    '',
    `Sitemap: ${base}/sitemap.xml`,
  ].join('\n'));
});

export default router;


