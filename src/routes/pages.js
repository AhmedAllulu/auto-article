import express from 'express';
import { query } from '../db.js';
import { config } from '../config.js';
import { resolveLanguage } from '../utils/lang.js';
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
 * Generate complete HTML page for an article
 */
function generateArticleHTML({ article, availableLanguages }) {
  const { title, meta_title, meta_description, canonical_url, content, language_code, image_url, slug } = article;
  
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
  
  return `<!DOCTYPE html>
<html lang="${language_code}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(meta_title || title)}</title>
    <meta name="description" content="${escapeHtml(meta_description || '')}">
    <meta name="robots" content="index, follow">
    ${canonical_url ? `<link rel="canonical" href="${escapeHtml(canonical_url)}">` : ''}
    
    <!-- Social Media Meta Tags -->
${socialMetaTags}
    
    <!-- Hreflang Tags -->
${hreflangTags}
    
    <!-- Basic Styling -->
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f8f9fa;
        }
        .article-container {
            background: white;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 20px 0;
        }
        .meta-info {
            color: #6c757d;
            font-size: 0.9em;
            margin-bottom: 30px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="article-container">
        <h1>${escapeHtml(title)}</h1>
        
        <div class="meta-info">
            <strong>Language:</strong> ${language_code.toUpperCase()} | 
            <strong>Reading Time:</strong> ${article.reading_time_minutes || 5} min
        </div>
        
        ${image_url ? `<img src="${escapeHtml(image_url)}" alt="${escapeHtml(title)}" loading="lazy">` : ''}
        
        <div class="article-content">
            ${content || ''}
        </div>
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
    
    // Generate HTML with complete meta tags
    const html = generateArticleHTML({
      article,
      availableLanguages: config.languages
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
