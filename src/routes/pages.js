import express from 'express';
import { query } from '../db.js';
import { config } from '../config.js';
import { articlesTable } from '../utils/articlesTable.js';

const router = express.Router();

/**
 * Escape HTML entities for safe HTML output
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
 * Generate Open Graph and Twitter Card meta tags
 */
function buildSocialMetaTags({ title, description, canonicalUrl, imageUrl, languageCode, siteName = 'VivaVerse' }) {
  const metaTags = [];

  // Open Graph tags
  metaTags.push(`    <meta property="og:type" content="article">`);
  metaTags.push(`    <meta property="og:title" content="${escapeHtml(title)}">`);
  metaTags.push(`    <meta property="og:description" content="${escapeHtml(description)}">`);
  metaTags.push(`    <meta property="og:site_name" content="${escapeHtml(siteName)}">`);
  metaTags.push(`    <meta property="og:locale" content="${getOgLocale(languageCode)}">`);

  if (canonicalUrl) {
    metaTags.push(`    <meta property="og:url" content="${escapeHtml(canonicalUrl)}">`);
  }

  if (imageUrl) {
    metaTags.push(`    <meta property="og:image" content="${escapeHtml(imageUrl)}">`);
    metaTags.push(`    <meta property="og:image:alt" content="${escapeHtml(title)}">`);
    metaTags.push(`    <meta property="og:image:width" content="1200">`);
    metaTags.push(`    <meta property="og:image:height" content="630">`);
  }

  // Twitter Card tags
  metaTags.push(`    <meta name="twitter:card" content="summary_large_image">`);
  metaTags.push(`    <meta name="twitter:title" content="${escapeHtml(title)}">`);
  metaTags.push(`    <meta name="twitter:description" content="${escapeHtml(description)}">`);

  if (imageUrl) {
    metaTags.push(`    <meta name="twitter:image" content="${escapeHtml(imageUrl)}">`);
    metaTags.push(`    <meta name="twitter:image:alt" content="${escapeHtml(title)}">`);
  }

  return metaTags.join('\n');
}

/**
 * Generate hreflang tags for multi-language content
 */
function buildHreflangTags({ baseSlug, availableLanguages }) {
  const baseUrl = config.seo?.canonicalBaseUrl || 'https://vivaverse.top';
  const hreflangTags = [];

  // Add hreflang for each available language
  for (const lang of availableLanguages) {
    const url = `${baseUrl}/${lang}/article/${baseSlug}`;
    hreflangTags.push(`    <link rel="alternate" hreflang="${lang}" href="${url}">`);
  }

  // Add x-default for English
  const defaultUrl = `${baseUrl}/en/article/${baseSlug}`;
  hreflangTags.push(`    <link rel="alternate" hreflang="x-default" href="${defaultUrl}">`);

  return hreflangTags.join('\n');
}

/**
 * Insert safe in-content contextual links after the Nth paragraph.
 * - Avoids injecting inside headings/lists/code by targeting paragraph boundaries only.
 * - Limits link count and truncates titles for readability.
 */
function insertContextualLinksIntoHtml(htmlContent, links, langBase, options = {}) {
  const maxLinks = Math.max(1, Math.min(3, options.maxLinks || 2));
  const insertAfterParagraph = Math.max(1, Math.min(8, options.afterParagraph || 2));
  if (!htmlContent || !links || links.length === 0) return htmlContent;

  // Normalize and dedupe by slug/href
  const seen = new Set();
  const candidates = [];
  for (const l of links) {
    if (!l || !l.slug || !l.title) continue;
    const key = l.slug;
    if (seen.has(key)) continue;
    seen.add(key);
    candidates.push({ href: `${langBase}/article/${l.slug}`, title: String(l.title).trim() });
    if (candidates.length >= maxLinks) break;
  }
  if (candidates.length === 0) return htmlContent;

  const anchorList = candidates
    .map(c => `<a href="${c.href}">${escapeHtml(c.title.length > 80 ? c.title.slice(0,77) + '…' : c.title)}</a>`)
    .join(' • ');

  const promoHtml = `\n<div class="in-context" role="complementary" aria-label="Related reading" style="margin:16px 0;padding:12px 14px;border-left:3px solid #3498db;background:#f3f7fb;border-radius:4px;">
    <strong style="color:#2c3e50;">Also read:</strong> ${anchorList}
  </div>\n`;

  // Insert after the Nth </p>
  const parts = htmlContent.split(/<\/p>/i);
  if (parts.length <= insertAfterParagraph) return htmlContent + promoHtml; // append at end

  let out = '';
  for (let i = 0; i < parts.length; i++) {
    out += parts[i];
    if (i < parts.length - 1) out += '</p>';
    if (i === insertAfterParagraph - 1) out += promoHtml;
  }
  return out;
}



/**
 * Generate complete HTML page for an article
 */
function generateArticleHTML({ article, availableLanguages, language, category, relatedArticles = [], prevArticle = null, nextArticle = null }) {
  const { title, meta_title, meta_description, canonical_url, content, language_code, image_url, slug, reading_time_minutes } = article;

  // Extract base slug (remove language suffix if present)
  const baseSlug = slug.replace(/-(?:de|fr|es|pt|ar|hi)$/, '');

  const socialMetaTags = buildSocialMetaTags({
    title: meta_title || title,
    description: meta_description,
    canonicalUrl: canonical_url,
    imageUrl: image_url,
    languageCode: language_code
  });

  const hreflangTags = buildHreflangTags({
    baseSlug,
    availableLanguages
  });

  const baseUrl = config.seo?.canonicalBaseUrl || '';
  const langBase = `${baseUrl}/${language}`;

  // JSON-LD Breadcrumbs
  const breadcrumbList = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${langBase}` },
      { '@type': 'ListItem', position: 2, name: 'Categories', item: `${langBase}/categories` },
      ...(category ? [{ '@type': 'ListItem', position: 3, name: category.name, item: `${langBase}/category/${category.slug}` }] : []),
      { '@type': 'ListItem', position: category ? 4 : 3, name: title, item: `${langBase}/article/${slug}` }
    ]
  };

  return `<!DOCTYPE html>
<html lang="${language_code}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(meta_title || title)}</title>
    <meta name="description" content="${escapeHtml(meta_description || '')}">
    <meta name="robots" content="index, follow">
    ${canonical_url ? `<link rel=\"canonical\" href=\"${escapeHtml(canonical_url)}\">` : ''}
    ${prevArticle ? `<link rel=\"prev\" href=\"${langBase}/article/${prevArticle.slug}\">` : ''}
    ${nextArticle ? `<link rel=\"next\" href=\"${langBase}/article/${nextArticle.slug}\">` : ''}

    <!-- Sitewide legal link relations -->
    <link rel="privacy-policy" href="${escapeHtml((canonical_url || `${langBase}/article/${slug}`).replace(/\/article\/.*/, '/privacy'))}">
    <link rel="terms-of-service" href="${escapeHtml((canonical_url || `${langBase}/article/${slug}`).replace(/\/article\/.*/, '/terms'))}">

    <!-- Social Media Meta Tags -->
${socialMetaTags}

    <!-- Hreflang Tags -->
${hreflangTags}

    <!-- Breadcrumbs Structured Data -->
    <script type="application/ld+json">${JSON.stringify(breadcrumbList)}</script>

    <!-- Basic Styling -->
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 820px;
            margin: 0 auto;
            padding: 20px;
            background: #f8f9fa;
        }
        .article-container {
            background: white;
            border-radius: 8px;
            padding: 32px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.06);
        }
        .breadcrumbs {
            font-size: 0.9em;
            color: #6c757d;
            margin-bottom: 16px;
        }
        .breadcrumbs a { color: #3498db; text-decoration: none; }
        .breadcrumbs a:hover { text-decoration: underline; }
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 16px 0 24px;
        }
        .meta-info {
            color: #6c757d;
            font-size: 0.9em;
            margin-bottom: 24px;
            padding: 12px 14px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        .article-nav {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            margin: 28px 0 8px;
        }
        .article-nav a { color: #3498db; text-decoration: none; }
        .article-nav a:hover { text-decoration: underline; }
        .related {
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px solid #e9ecef;
        }
        .related h3 { margin: 0 0 10px; color: #2c3e50; }
        .related-list { list-style: none; padding: 0; margin: 0; }
        .related-list li { margin-bottom: 8px; }
        .related-list a { color: #3498db; text-decoration: none; }
        .related-list a:hover { text-decoration: underline; }
        .explore-links { margin-top: 24px; font-size: 0.95em; color: #6c757d; }
        .explore-links a { color: #3498db; text-decoration: none; }
        .explore-links a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="article-container">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
            <a href="${langBase}">Home</a>
            <span> › </span>
            <a href="${langBase}/categories">Categories</a>
            ${category ? `<span> › </span><a href="${langBase}/category/${category.slug}">${escapeHtml(category.name)}</a>` : ''}
            <span> › </span>
            <span aria-current="page">${escapeHtml(title)}</span>
        </nav>

        <h1>${escapeHtml(title)}</h1>

        <div class="meta-info">
            ${category ? `<strong>Category:</strong> <a href="${langBase}/category/${category.slug}">${escapeHtml(category.name)}</a> • ` : ''}
            <strong>Language:</strong> ${language_code.toUpperCase()} •
            <strong>Reading Time:</strong> ${reading_time_minutes || 5} min
        </div>

        ${image_url ? `<img src="${escapeHtml(image_url)}" alt="${escapeHtml(title)}" loading="lazy">` : ''}

        <div class="article-content">
            ${insertContextualLinksIntoHtml(content || '', relatedArticles, langBase, { maxLinks: 2, afterParagraph: 2 })}
        </div>

        <div class="article-nav" aria-label="Article navigation">
            ${prevArticle ? `<a class="prev" href="${langBase}/article/${prevArticle.slug}">← ${escapeHtml(prevArticle.title)}</a>` : '<span></span>'}
            ${nextArticle ? `<a class="next" href="${langBase}/article/${nextArticle.slug}">${escapeHtml(nextArticle.title)} →</a>` : ''}
        </div>

        ${relatedArticles && relatedArticles.length ? `
        <section class="related" aria-label="More in this category">
          <h3>More in ${category ? escapeHtml(category.name) : 'this topic'}</h3>
          <ul class="related-list">
            ${relatedArticles.map(a => `<li><a href="${langBase}/article/${a.slug}">${escapeHtml(a.title)}</a></li>`).join('')}
          </ul>
        </section>` : ''}

        <p class="explore-links">
          Explore more: <a href="${langBase}/categories">All categories</a> • <a href="${langBase}/sitemap">HTML sitemap</a> • <a href="${langBase}/about">About</a> • <a href="${langBase}/contact">Contact</a> • <a href="${langBase}/faq">FAQ</a>
        </p>
    </div>
</body>
</html>`;
}

/**
 * Serve article as complete HTML page with full SEO meta tags
 */
router.get('/:language/article/:slug', async (req, res) => {
  try {
    const { language, slug } = req.params;

    // Validate language
    if (!config.languages.includes(language)) {
      return res.status(404).send('Language not supported');
    }

    // Get article from appropriate table
    const tableName = articlesTable(language);
    const articleQuery = tableName === 'articles'
      ? `SELECT * FROM ${tableName} WHERE slug = $1 AND language_code = $2 LIMIT 1`
      : `SELECT *, '${language}' AS language_code FROM ${tableName} WHERE slug = $1 LIMIT 1`;

    const queryParams = tableName === 'articles' ? [slug, language] : [slug];
    const result = await query(articleQuery, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).send('Article not found');
    }

    const article = result.rows[0];

    // Fetch category info (localized name) if available
    let category = null;
    if (article.category_id) {
      const catRes = await query(
        `SELECT c.id, c.slug, COALESCE(ct_lang.name, ct_en.name, c.name) AS name
         FROM categories c
         LEFT JOIN category_translations ct_lang ON ct_lang.category_id = c.id AND ct_lang.language_code = $2
         LEFT JOIN category_translations ct_en ON ct_en.category_id = c.id AND ct_en.language_code = 'en'
         WHERE c.id = $1`,
        [article.category_id, language]
      );
      if (catRes.rows.length) {
        category = catRes.rows[0];
      }
    }

    // Build related articles list (same category)
    let relatedArticles = [];
    if (article.category_id) {
      const relatedSql = tableName === 'articles'
        ? `SELECT title, slug
           FROM ${tableName}
           WHERE category_id = $1 AND language_code = $2 AND slug <> $3
           ORDER BY COALESCE(published_at, created_at) DESC
           LIMIT 8`
        : `SELECT title, slug
           FROM ${tableName}
           WHERE category_id = $1 AND slug <> $2
           ORDER BY COALESCE(published_at, created_at) DESC
           LIMIT 8`;
      const relatedParams = tableName === 'articles'
        ? [article.category_id, language, slug]
        : [article.category_id, slug];
      const relRes = await query(relatedSql, relatedParams);
      relatedArticles = relRes.rows;
    }

    // Previous and next articles by publish/create date
    const ts = article.published_at || article.created_at;
    let prevArticle = null;
    let nextArticle = null;
    if (ts) {
      const prevSql = tableName === 'articles'
        ? `SELECT title, slug
           FROM ${tableName}
           WHERE language_code = $1 AND COALESCE(published_at, created_at) < $2
           ORDER BY COALESCE(published_at, created_at) DESC
           LIMIT 1`
        : `SELECT title, slug
           FROM ${tableName}
           WHERE COALESCE(published_at, created_at) < $1
           ORDER BY COALESCE(published_at, created_at) DESC
           LIMIT 1`;
      const nextSql = tableName === 'articles'
        ? `SELECT title, slug
           FROM ${tableName}
           WHERE language_code = $1 AND COALESCE(published_at, created_at) > $2
           ORDER BY COALESCE(published_at, created_at) ASC
           LIMIT 1`
        : `SELECT title, slug
           FROM ${tableName}
           WHERE COALESCE(published_at, created_at) > $1
           ORDER BY COALESCE(published_at, created_at) ASC
           LIMIT 1`;
      const prevParams = tableName === 'articles' ? [language, ts] : [ts];
      const nextParams = prevParams;
      const [prevRes, nextRes] = await Promise.all([
        query(prevSql, prevParams),
        query(nextSql, nextParams)
      ]);
      prevArticle = prevRes.rows[0] || null;
      nextArticle = nextRes.rows[0] || null;
    }

    // Generate HTML with internal links and meta
    const html = generateArticleHTML({
      article,
      availableLanguages: config.languages,
      language,
      category,
      relatedArticles,
      prevArticle,
      nextArticle
    });

    // Set proper headers
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    res.setHeader('X-Robots-Tag', 'index, follow');

    res.send(html);
  } catch (error) {
    console.error('Error serving article page:', error);
    res.status(500).send('Internal server error');
  }
});

export default router;
