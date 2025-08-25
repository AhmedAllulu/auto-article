import express from 'express';
import { query } from '../db.js';
import { articlesTable } from '../utils/articlesTable.js';

const router = express.Router();

/**
 * HTML Sitemap for Enhanced Crawl Discovery
 * Provides internal linking structure that Googlebot crawls more aggressively
 */

// HTML Sitemap Configuration
const HTML_SITEMAP_CONFIG = {
  // Number of articles per category to show
  articlesPerCategory: 20,

  // Number of recent articles to show
  recentArticlesCount: 50,

  // Cache duration (6 hours)
  cacheMaxAge: 21600,

  // Site information
  siteInfo: {
    title: 'VivaVerse',
    description: 'Comprehensive sitemap of all articles, categories, and pages',
    baseUrl: process.env.CANONICAL_BASE_URL || 'https://megaquantum.net'
  }
};

/**
 * Generate HTML sitemap page
 */
function generateHtmlSitemap(data, language = 'en') {
  const { categories, recentArticles, staticPages, stats } = data;
  const baseUrl = HTML_SITEMAP_CONFIG.siteInfo.baseUrl;

  const html = `<!DOCTYPE html>
<html lang="${language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sitemap - ${HTML_SITEMAP_CONFIG.siteInfo.title}</title>
    <meta name="description" content="${HTML_SITEMAP_CONFIG.siteInfo.description}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${baseUrl}/${language}/sitemap">

    <!-- Structured Data for Sitemap -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Sitemap - ${HTML_SITEMAP_CONFIG.siteInfo.title}",
      "description": "${HTML_SITEMAP_CONFIG.siteInfo.description}",
      "url": "${baseUrl}/${language}/sitemap",
      "mainEntity": {
        "@type": "SiteNavigationElement",
        "name": "Site Navigation"
      }
    }
    </script>

    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f8f9fa;
        }
        .sitemap-container {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        h2 {
            color: #34495e;
            margin-top: 40px;
            margin-bottom: 20px;
            border-left: 4px solid #3498db;
            padding-left: 15px;
        }
        h3 {
            color: #2c3e50;
            margin-top: 30px;
            margin-bottom: 15px;
        }
        .stats {
            background: #ecf0f1;
            padding: 20px;
            border-radius: 6px;
            margin-bottom: 30px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        .stat-item {
            text-align: center;
        }
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: #3498db;
            display: block;
        }
        .stat-label {
            color: #7f8c8d;
            font-size: 0.9em;
        }
        .category-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin-bottom: 40px;
        }
        .category-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            border: 1px solid #e9ecef;
        }
        .category-title {
            color: #2c3e50;
            margin-bottom: 15px;
            font-size: 1.2em;
            font-weight: 600;
        }
        .article-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .article-list li {
            margin-bottom: 8px;
            padding-left: 15px;
            position: relative;
        }
        .article-list li:before {
            content: "→";
            position: absolute;
            left: 0;
            color: #3498db;
            font-weight: bold;
        }
        .page-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            list-style: none;
            padding: 0;
        }
        .page-list li {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #e9ecef;
        }
        a {
            color: #3498db;
            text-decoration: none;
            transition: color 0.2s;
        }
        a:hover {
            color: #2980b9;
            text-decoration: underline;
        }
        .recent-articles {
            columns: 2;
            column-gap: 30px;
        }
        .recent-articles li {
            break-inside: avoid;
            margin-bottom: 10px;
        }
        .last-updated {
            text-align: center;
            color: #7f8c8d;
            font-size: 0.9em;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
        }
        @media (max-width: 768px) {
            .recent-articles {
                columns: 1;
            }
            .category-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="sitemap-container">
        <h1>📍 Site Map - ${HTML_SITEMAP_CONFIG.siteInfo.title}</h1>

        <div class="stats">
            <div class="stat-item">
                <span class="stat-number">${stats.totalArticles}</span>
                <span class="stat-label">Total Articles</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">${stats.totalCategories}</span>
                <span class="stat-label">Categories</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">${stats.totalPages}</span>
                <span class="stat-label">Pages</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">${new Date().toLocaleDateString()}</span>
                <span class="stat-label">Last Updated</span>
            </div>
        </div>

        <h2>📄 Main Pages</h2>
        <ul class="page-list">
            ${staticPages.map(page => `
                <li>
                    <a href="${baseUrl}/${language}${page.path}" title="${page.description}">
                        <strong>${page.title}</strong>
                        <br><small>${page.description}</small>
                    </a>
                </li>
            `).join('')}
        </ul>

        <h2>📂 Categories & Articles</h2>
        <div class="category-grid">
            ${categories.map(category => `
                <div class="category-section">
                    <h3 class="category-title">
                        <a href="${baseUrl}/${language}/category/${category.slug}">
                            ${category.name} (${category.article_count} articles)
                        </a>
                    </h3>
                    ${category.description ? `<p style="color: #7f8c8d; font-size: 0.9em; margin-bottom: 15px;">${category.description}</p>` : ''}
                    <ul class="article-list">
                        ${category.articles.map(article => `
                            <li>
                                <a href="${baseUrl}/${language}/article/${article.slug}" title="${article.summary || article.title}">
                                    ${article.title}
                                </a>
                                <small style="color: #7f8c8d; display: block; margin-top: 2px;">
                                    ${new Date(article.published_at || article.created_at).toLocaleDateString()}
                                </small>
                            </li>
                        `).join('')}
                        ${category.article_count > HTML_SITEMAP_CONFIG.articlesPerCategory ? `
                            <li style="margin-top: 10px;">
                                <a href="${baseUrl}/${language}/category/${category.slug}" style="font-weight: bold;">
                                    View all ${category.article_count} articles →
                                </a>
                            </li>
                        ` : ''}
                    </ul>
                </div>
            `).join('')}
        </div>

        <h2>🕒 Recent Articles</h2>
        <ul class="article-list recent-articles">
            ${recentArticles.map(article => `
                <li>
                    <a href="${baseUrl}/${language}/article/${article.slug}" title="${article.summary || article.title}">
                        ${article.title}
                    </a>
                    <small style="color: #7f8c8d; display: block; margin-top: 2px;">
                        ${article.category_name} • ${new Date(article.published_at || article.created_at).toLocaleDateString()}
                    </small>
                </li>
            `).join('')}
        </ul>

        <div class="last-updated">
            <p>This sitemap is automatically updated when new content is published.</p>
            <p>For search engines: <a href="${baseUrl}/sitemap.xml">XML Sitemap</a> | <a href="${baseUrl}/robots.txt">Robots.txt</a></p>
        </div>
    </div>
</body>
</html>`;

  return html;
}

/**
 * Fetch data for HTML sitemap
 */
async function fetchSitemapData(language = 'en') {
  const tableName = articlesTable(language);

  try {
    // Get categories with article counts and sample articles
    const categoriesQuery = `
      SELECT
        c.id, c.slug, c.name, c.description,
        COUNT(a.id) as article_count
      FROM categories c
      LEFT JOIN ${tableName} a ON a.category_id = c.id
      ${tableName === 'articles' ? 'AND a.language_code = $1' : ''}
      GROUP BY c.id, c.slug, c.name, c.description
      HAVING COUNT(a.id) > 0
      ORDER BY COUNT(a.id) DESC, c.name
    `;

    const categoriesParams = tableName === 'articles' ? [language] : [];
    const categoriesResult = await query(categoriesQuery, categoriesParams);

    // Get sample articles for each category
    const categories = [];
    for (const category of categoriesResult.rows) {
      const articlesQuery = tableName === 'articles'
        ? `SELECT title, slug, summary, published_at, created_at
           FROM ${tableName}
           WHERE category_id = $1 AND language_code = $2
           ORDER BY COALESCE(published_at, created_at) DESC
           LIMIT $3`
        : `SELECT title, slug, summary, published_at, created_at
           FROM ${tableName}
           WHERE category_id = $1
           ORDER BY COALESCE(published_at, created_at) DESC
           LIMIT $2`;

      const articlesParams = tableName === 'articles'
        ? [category.id, language, HTML_SITEMAP_CONFIG.articlesPerCategory]
        : [category.id, HTML_SITEMAP_CONFIG.articlesPerCategory];

      const articlesResult = await query(articlesQuery, articlesParams);

      categories.push({
        ...category,
        articles: articlesResult.rows
      });
    }

    // Get recent articles across all categories
    const recentQuery = tableName === 'articles'
      ? `SELECT a.title, a.slug, a.summary, a.published_at, a.created_at, c.name as category_name
         FROM ${tableName} a
         JOIN categories c ON c.id = a.category_id
         WHERE a.language_code = $1
         ORDER BY COALESCE(a.published_at, a.created_at) DESC
         LIMIT $2`
      : `SELECT a.title, a.slug, a.summary, a.published_at, a.created_at, c.name as category_name
         FROM ${tableName} a
         JOIN categories c ON c.id = a.category_id
         ORDER BY COALESCE(a.published_at, a.created_at) DESC
         LIMIT $1`;

    const recentParams = tableName === 'articles'
      ? [language, HTML_SITEMAP_CONFIG.recentArticlesCount]
      : [HTML_SITEMAP_CONFIG.recentArticlesCount];

    const recentResult = await query(recentQuery, recentParams);

    // Static pages
    const staticPages = [
      { path: '/', title: 'Home', description: 'Latest articles and trending content' },
      { path: '/categories', title: 'All Categories', description: 'Browse articles by category' },
      { path: '/about', title: 'About Us', description: 'Learn more about our mission and team' },
      { path: '/contact', title: 'Contact', description: 'Get in touch with us' },
      { path: '/faq', title: 'FAQ', description: 'Frequently asked questions' },
      { path: '/privacy', title: 'Privacy Policy', description: 'Our privacy policy and data handling' },
      { path: '/terms', title: 'Terms of Service', description: 'Terms and conditions of use' },
      { path: '/cookies', title: 'Cookie Policy', description: 'How we use cookies' }
    ];

    // Calculate stats
    const totalArticles = recentResult.rows.length > 0 ?
      await query(`SELECT COUNT(*) as count FROM ${tableName} ${tableName === 'articles' ? 'WHERE language_code = $1' : ''}`,
                   tableName === 'articles' ? [language] : []) : { rows: [{ count: 0 }] };

    const stats = {
      totalArticles: parseInt(totalArticles.rows[0].count),
      totalCategories: categories.length,
      totalPages: staticPages.length
    };

    return {
      categories,
      recentArticles: recentResult.rows,
      staticPages,
      stats
    };

  } catch (error) {
    console.error('Error fetching sitemap data:', error);

    // Return fallback data instead of throwing
    return {
      categories: [],
      recentArticles: [],
      staticPages: [
        { path: '/', title: 'Home', description: 'Latest articles and trending content' },
        { path: '/categories', title: 'All Categories', description: 'Browse articles by category' },
        { path: '/about', title: 'About Us', description: 'Learn more about our mission and team' }
      ],
      stats: {
        totalArticles: 0,
        totalCategories: 0,
        totalPages: 3
      }
    };
  }
}

/**
 * HTML Sitemap route
 */
router.get('/sitemap', async (req, res) => {
  try {
    const language = req.query.lang || 'en';

    // Fetch sitemap data
    const sitemapData = await fetchSitemapData(language);

    // Generate HTML
    const html = generateHtmlSitemap(sitemapData, language);

    // Set headers
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.setHeader('Cache-Control', `public, max-age=${HTML_SITEMAP_CONFIG.cacheMaxAge}`);
    res.setHeader('X-Robots-Tag', 'index, follow');

    res.send(html);

  } catch (error) {
    console.error('Error generating HTML sitemap:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Sitemap Error</title></head>
      <body>
        <h1>Sitemap Temporarily Unavailable</h1>
        <p>We're experiencing technical difficulties. Please try again later.</p>
        <p><a href="/">Return to Homepage</a></p>
      </body>
      </html>
    `);
  }
});

// Pretty URL variant to match frontend route structure: /:language/sitemap
router.get('/:language/sitemap', async (req, res) => {
  try {
    const { language } = req.params;
    const sitemapData = await fetchSitemapData(language);
    const html = generateHtmlSitemap(sitemapData, language);

    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.setHeader('Cache-Control', `public, max-age=${HTML_SITEMAP_CONFIG.cacheMaxAge}`);
    res.setHeader('X-Robots-Tag', 'index, follow');

    res.send(html);
  } catch (error) {
    console.error('Error generating HTML sitemap (pretty URL):', error);
    res.status(500).send('Internal server error');
  }
});


export default router;
