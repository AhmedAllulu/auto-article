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

function isCrawler(req) {
  const ua = String(req.get('user-agent') || '').toLowerCase();
  if (!ua) return false;
  return /facebookexternalhit|twitterbot|linkedinbot|slackbot|whatsapp|discordbot|telegrambot|skypeuripreview|googlebot|bingbot|duckduckbot|yandex|baiduspider|embedly|pinterest|quora|tumblr|vkshare|vk share|redditbot|applebot|ia_archiver/.test(ua);
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

// Minimal RSS feed with the latest 50 articles across supported languages
router.get('/rss.xml', async (req, res) => {
  try {
    const base = getBaseUrl(req);
    const langs = Array.isArray(config.languages) && config.languages.length > 0 ? config.languages : ['en'];
    const { rows } = await query(
      `SELECT 
         a.id,
         a.title,
         a.slug,
         a.summary,
         a.language_code,
         a.image_url,
         COALESCE(a.published_at, a.created_at) AS date,
         c.slug AS category_slug
       FROM articles a
       LEFT JOIN categories c ON c.id = a.category_id
       WHERE a.language_code = ANY($1)
       ORDER BY COALESCE(a.published_at, a.created_at) DESC, a.id DESC
       LIMIT 50`,
      [langs]
    );
    const items = rows.map((r) => {
      const url = `${base}/${r.language_code}/article/${encodeURIComponent(r.slug)}`;
      const title = escXml(r.title || '');
      const description = escXml(r.summary || '');
      const pubDate = new Date(r.date).toUTCString();
      const guid = `${r.language_code}:${r.slug}:${r.id}`;
      const category = escXml(r.category_slug || '');
      const enclosure = r.image_url ? `\n      <enclosure url="${escXml(r.image_url)}" type="image/jpeg" />` : '';
      return [
        '    <item>',
        `      <title>${title}</title>`,
        `      <link>${escXml(url)}</link>`,
        `      <guid isPermaLink="false">${guid}</guid>`,
        (category ? `      <category>${category}</category>` : ''),
        `      <pubDate>${pubDate}</pubDate>`,
        `      <description><![CDATA[${r.summary || ''}]]></description>`,
        enclosure,
        '    </item>'
      ].filter(Boolean).join('\n');
    }).join('\n');

    const rss = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<rss version="2.0">',
      '  <channel>',
      `    <title>${escXml(config?.seo?.siteTitle || 'Viva Verse')}</title>`,
      `    <link>${escXml(base)}</link>`,
      `    <description>${escXml(config?.seo?.siteDescription || 'Latest articles')}</description>`,
      `    <language>${escXml(langs[0])}</language>`,
      items,
      '  </channel>',
      '</rss>'
    ].join('\n');

    res.setHeader('Content-Type', 'application/rss+xml; charset=UTF-8');
    res.setHeader('Cache-Control', 'public, max-age=600');
    res.send(rss);
  } catch (err) {
    res.status(500).type('text/plain').send('Failed to generate RSS');
  }
});

// Server-rendered meta for article pages (crawler-friendly)
router.get('/:lang/article/:slug', async (req, res) => {
  try {
    const langs = Array.isArray(config.languages) && config.languages.length > 0 ? config.languages : ['en'];
    const reqLang = String(req.params.lang || '').toLowerCase();
    const lang = langs.includes(reqLang) ? reqLang : 'en';
    const rawSlug = String(req.params.slug || '').trim();
    if (!rawSlug) return res.status(400).type('text/plain').send('Invalid slug');

    // Build candidates similar to /articles/slug/:slug logic
    const suffixRe = new RegExp(`-(?:${langs.join('|')})$`, 'i');
    const base = rawSlug.replace(suffixRe, '');
    const preferred = lang === 'en' ? base : `${base}-${lang}`;
    const candidates = [];
    const seen = new Set();
    for (const s of [preferred, rawSlug, `${base}-en`, base]) {
      const v = String(s || '').trim();
      if (!v || seen.has(v)) continue;
      seen.add(v);
      candidates.push(v);
    }
    while (candidates.length < 4) candidates.push(candidates[candidates.length - 1]);

    const result = await query(
      `SELECT a.*, c.name AS category_name, c.slug AS category_slug
       FROM articles a
       LEFT JOIN categories c ON c.id = a.category_id
       WHERE a.slug = ANY($1)
       ORDER BY CASE a.slug
         WHEN $2 THEN 1
         WHEN $3 THEN 2
         WHEN $4 THEN 3
         WHEN $5 THEN 4
         ELSE 5 END
       LIMIT 1`,
      [candidates, candidates[0], candidates[1], candidates[2], candidates[3]]
    );
    if (result.rowCount === 0) return res.status(404).type('text/plain').send('Not found');
    const a = result.rows[0];

    const baseUrl = getBaseUrl(req);
    const pageUrl = `${baseUrl}/${lang}/article/${encodeURIComponent(a.slug)}`;
    const canonical = String(a.canonical_url || pageUrl);
    const title = String(a.meta_title || a.title || '').trim();
    const description = String(a.meta_description || a.summary || '').trim();
    const image = String(a.og_image || a.twitter_image || a.image_url || '').trim();
    const published = a.published_at || a.created_at || null;
    const updated = a.updated_at || a.published_at || a.created_at || null;
    const section = a.category_name || null;
    const alternates = langs.map((l) => ({ hrefLang: l, href: `${baseUrl}/${l}/article/${encodeURIComponent(a.slug)}` }));

    // If not a crawler, redirect to SPA route (keeps human UX intact)
    if (!isCrawler(req)) {
      return res.redirect(302, pageUrl);
    }

    // Minimal JSON-LD (Article)
    const ld = [
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: a.title,
        description: description || undefined,
        inLanguage: lang,
        mainEntityOfPage: canonical,
        image: image ? [image] : undefined,
        datePublished: published ? new Date(published).toISOString() : undefined,
        dateModified: updated ? new Date(updated).toISOString() : undefined,
        articleSection: section || undefined,
      }
    ];

    const ogLocaleMap = { en: 'en_US', ar: 'ar', de: 'de_DE', fr: 'fr_FR', es: 'es_ES', pt: 'pt_PT', hi: 'hi_IN' };
    const ogLocale = ogLocaleMap[lang] || 'en_US';

    const html = [
      '<!DOCTYPE html>',
      '<html>',
      '<head>',
      '<meta charset="UTF-8" />',
      `<title>${escXml(title ? `${title} • Viva Verse` : 'Viva Verse')}</title>`,
      `<meta name="description" content="${escXml(description)}" />`,
      `<link rel="canonical" href="${escXml(canonical)}" />`,
      ...alternates.map((a) => `<link rel="alternate" hrefLang="${escXml(a.hrefLang)}" href="${escXml(a.href)}" />`),
      `<link rel="alternate" hrefLang="x-default" href="${escXml(`${baseUrl}/en/article/${encodeURIComponent(a.slug)}`)}" />`,
      `<meta property="og:type" content="article" />`,
      `<meta property="og:title" content="${escXml(title || a.title || '')} • Viva Verse" />`,
      `<meta property="og:description" content="${escXml(description)}" />`,
      `<meta property="og:url" content="${escXml(canonical)}" />`,
      `<meta property="og:site_name" content="Viva Verse" />`,
      `<meta property="og:locale" content="${escXml(ogLocale)}" />`,
      ...(image ? [`<meta property="og:image" content="${escXml(image)}" />`, `<meta property="og:image:secure_url" content="${escXml(image)}" />`] : []),
      ...(section ? [`<meta property="article:section" content="${escXml(section)}" />`] : []),
      ...(published ? [`<meta property="article:published_time" content="${escXml(new Date(published).toISOString())}" />`] : []),
      ...(updated ? [`<meta property="article:modified_time" content="${escXml(new Date(updated).toISOString())}" />`, `<meta property="og:updated_time" content="${escXml(new Date(updated).toISOString())}" />`] : []),
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${escXml(title || a.title || '')} • Viva Verse" />`,
      `<meta name="twitter:description" content="${escXml(description)}" />`,
      ...(image ? [`<meta name="twitter:image" content="${escXml(image)}" />`] : []),
      `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`,
      '</head>',
      '<body>',
      `<noscript>Open <a href="${escXml(pageUrl)}">${escXml(a.title || 'article')}</a></noscript>`,
      '</body>',
      '</html>'
    ].join('\n');

    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    res.send(html);
  } catch (err) {
    res.status(500).type('text/plain').send('Failed to render article meta');
  }
});

export default router;


