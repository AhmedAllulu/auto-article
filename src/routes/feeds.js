import express from 'express';
import { query } from '../db.js';
import { config } from '../config.js';
import { articlesTable, LANG_SHARDED_ARTICLE_TABLES } from '../utils/articlesTable.js';

const router = express.Router();

/**
 * Multiple RSS Feeds Strategy
 * Topic-based feeds for better crawling efficiency and targeting
 */

// RSS Feed Configuration
const FEED_CONFIG = {
  // Number of articles per feed
  itemsPerFeed: 50,

  // Cache duration (1 hour)
  cacheMaxAge: 3600,

  // WebSub (PubSubHubbub) Configuration
  webSub: {
    // Google's free WebSub hub
    hubUrl: 'https://pubsubhubbub.appspot.com/',
    // Alternative hubs (for redundancy)
    alternativeHubs: [
      'https://pubsubhubbub.superfeedr.com/',
      'https://websub.rocks/hub'
    ],
    // Enable WebSub notifications
    enabled: String(process.env.ENABLE_WEBSUB || 'true') === 'true',
    // Timeout for hub notifications
    notificationTimeout: Number(process.env.WEBSUB_TIMEOUT || 10000)
  },

  // Site information
  siteInfo: {
    title: 'VivaVerse',
    description: 'Discover insightful articles, expert analysis, and the latest trends across business, technology, health, science, education, and travel.',
    link: process.env.CANONICAL_BASE_URL || 'https://vivaverse.top',
    language: 'en',
    copyright: `© ${new Date().getFullYear()} Mega Quantum. All rights reserved.`,
    managingEditor: 'contact@vivaverse.top (VivaVerse Editorial Team)',
    webMaster: 'contact@vivaverse.top (VivaVerse Technical Team)',
    generator: 'VivaVerse RSS Generator v1.0',
    ttl: 60 // Time to live in minutes
  }
};

/**
 * Generate dynamic feed configuration from database category
 */
function generateFeedConfig(category) {
  const baseTitle = FEED_CONFIG.siteInfo.title;

  return {
    title: `${baseTitle} - ${category.name}`,
    description: category.description || `Latest ${category.name.toLowerCase()} articles, insights, and analysis from ${baseTitle}.`,
    keywords: generateKeywords(category)
  };
}

/**
 * Generate keywords from category data
 */
function generateKeywords(category) {
  const baseKeywords = [
    category.name.toLowerCase(),
    'articles',
    'news',
    'insights',
    'analysis',
    'trends'
  ];

  // Add category-specific keywords if available
  if (category.keywords) {
    // If category has keywords field in DB
    baseKeywords.push(...category.keywords.split(',').map(k => k.trim()));
  }

  // Add slug-based keywords
  if (category.slug) {
    baseKeywords.push(category.slug.replace('-', ' '));
  }

  return baseKeywords.join(', ');
}

/**
 * Escape XML special characters
 */
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Clean content for RSS feeds - remove script tags and other problematic elements
 */
function cleanContentForRss(content) {
  if (!content) return '';

  // Remove script tags and their content
  let cleaned = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove style tags and their content
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove other potentially problematic tags
  cleaned = cleaned.replace(/<(iframe|object|embed|form|input|button|select|textarea)[^>]*>.*?<\/\1>/gi, '');

  // Remove event handlers and javascript: links
  cleaned = cleaned.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  cleaned = cleaned.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '');

  // Fix unescaped ampersands that aren't part of valid entities
  // This regex matches & that are not followed by valid entity patterns
  cleaned = cleaned.replace(/&(?![a-zA-Z][a-zA-Z0-9]*;|#[0-9]+;|#x[0-9a-fA-F]+;)/g, '&amp;');

  // Remove any remaining problematic characters that could break XML
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return cleaned;
}

/**
 * Format date for RSS (RFC 822 format)
 */
function formatRssDate(date) {
  return new Date(date).toUTCString();
}

/**
 * Generate RSS XML for articles
 */
function generateRssXml(feedInfo, articles, categorySlug = null, requestedLanguage = null) {
  const baseUrl = FEED_CONFIG.siteInfo.link;
  let feedUrl = categorySlug
    ? `${baseUrl}/api/feeds/${categorySlug}.rss`
    : `${baseUrl}/api/feeds/all.rss`;

  // Add language parameter if it was explicitly requested (to ensure self-reference matches request URL)
  if (requestedLanguage) {
    feedUrl += `?lang=${requestedLanguage}`;
  }
  
  const xml = [];
  
  // XML declaration and RSS opening
  xml.push('<?xml version="1.0" encoding="UTF-8"?>');
  xml.push('<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">');
  xml.push('<channel>');
  
  // Channel information
  xml.push(`<title>${escapeXml(feedInfo.title)}</title>`);
  xml.push(`<description>${escapeXml(feedInfo.description)}</description>`);
  xml.push(`<link>${escapeXml(baseUrl)}</link>`);
  xml.push(`<language>${FEED_CONFIG.siteInfo.language}</language>`);
  xml.push(`<copyright>${escapeXml(FEED_CONFIG.siteInfo.copyright)}</copyright>`);
  xml.push(`<managingEditor>${escapeXml(FEED_CONFIG.siteInfo.managingEditor)}</managingEditor>`);
  xml.push(`<webMaster>${escapeXml(FEED_CONFIG.siteInfo.webMaster)}</webMaster>`);
  xml.push(`<generator>${escapeXml(FEED_CONFIG.siteInfo.generator)}</generator>`);
  xml.push(`<ttl>${FEED_CONFIG.siteInfo.ttl}</ttl>`);
  xml.push(`<lastBuildDate>${formatRssDate(new Date())}</lastBuildDate>`);
  xml.push(`<pubDate>${formatRssDate(new Date())}</pubDate>`);
  
  // Self-referencing link (required for RSS best practices)
  xml.push(`<atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />`);

  // WebSub (PubSubHubbub) hub links for instant notifications
  if (FEED_CONFIG.webSub.enabled) {
    xml.push(`<atom:link href="${escapeXml(FEED_CONFIG.webSub.hubUrl)}" rel="hub" />`);

    // Add alternative hubs for redundancy
    FEED_CONFIG.webSub.alternativeHubs.forEach(hubUrl => {
      xml.push(`<atom:link href="${escapeXml(hubUrl)}" rel="hub" />`);
    });
  }

  // Category and keywords
  if (categorySlug && feedInfo.keywords) {
    xml.push(`<category>${escapeXml(categorySlug)}</category>`);
    feedInfo.keywords.split(',').forEach(keyword => {
      xml.push(`<category>${escapeXml(keyword.trim())}</category>`);
    });
  }
  
  // Articles as items
  for (const article of articles) {
    const articleUrl = `${baseUrl}/${article.language_code}/article/${encodeURIComponent(article.slug)}`;
    const pubDate = formatRssDate(article.published_at || article.created_at);
    
    xml.push('<item>');
    xml.push(`<title>${escapeXml(article.title)}</title>`);
    xml.push(`<description>${escapeXml(article.summary || article.meta_description || '')}</description>`);
    xml.push(`<link>${escapeXml(articleUrl)}</link>`);
    xml.push(`<guid isPermaLink="true">${escapeXml(articleUrl)}</guid>`);
    xml.push(`<pubDate>${pubDate}</pubDate>`);
    
    // Category
    if (article.category_name) {
      xml.push(`<category>${escapeXml(article.category_name)}</category>`);
    }
    
    // Author
    xml.push(`<author>${escapeXml(FEED_CONFIG.siteInfo.managingEditor)}</author>`);
    
    // Content (full article content)
    if (article.content) {
      const cleanContent = cleanContentForRss(article.content);
      xml.push(`<content:encoded><![CDATA[${cleanContent}]]></content:encoded>`);
    }
    
    // Image/enclosure
    if (article.image_url) {
      xml.push(`<enclosure url="${escapeXml(article.image_url)}" type="image/jpeg" length="0" />`);
    }
    
    xml.push('</item>');
  }
  
  // Close RSS
  xml.push('</channel>');
  xml.push('</rss>');
  
  return xml.join('\n');
}

/**
 * Fetch articles for a specific category
 */
async function fetchCategoryArticles(categorySlug, language = 'en', limit = FEED_CONFIG.itemsPerFeed) {
  const tableName = articlesTable(language);

  const sql = tableName === 'articles'
    ? `SELECT a.title, a.slug, a.summary, a.content, a.meta_description, a.image_url,
              a.language_code, a.published_at, a.created_at,
              c.name as category_name, c.slug as category_slug
       FROM ${tableName} a
       JOIN categories c ON c.id = a.category_id
       WHERE c.slug = $1 AND a.language_code = $2
       ORDER BY COALESCE(a.published_at, a.created_at) DESC
       LIMIT $3`
    : `SELECT a.title, a.slug, a.summary, a.content, a.meta_description, a.image_url,
              '${language}' as language_code, a.published_at, a.created_at,
              c.name as category_name, c.slug as category_slug
       FROM ${tableName} a
       JOIN categories c ON c.id = a.category_id
       WHERE c.slug = $1
       ORDER BY COALESCE(a.published_at, a.created_at) DESC
       LIMIT $2`;

  const params = tableName === 'articles' ? [categorySlug, language, limit] : [categorySlug, limit];

  try {
    const result = await query(sql, params);
    return result.rows;
  } catch (error) {
    console.error(`Error fetching articles for category ${categorySlug} from table ${tableName}:`, error);

    // If the table doesn't exist, try fallback to main articles table
    if (error.code === '42P01' && tableName !== 'articles') {
      try {
        const fallbackSql = `SELECT a.title, a.slug, a.summary, a.content, a.meta_description, a.image_url,
                                    a.language_code, a.published_at, a.created_at,
                                    c.name as category_name, c.slug as category_slug
                             FROM articles a
                             JOIN categories c ON c.id = a.category_id
                             WHERE c.slug = $1 AND a.language_code = $2
                             ORDER BY COALESCE(a.published_at, a.created_at) DESC
                             LIMIT $3`;
        const fallbackResult = await query(fallbackSql, [categorySlug, language, limit]);
        return fallbackResult.rows;
      } catch (fallbackError) {
        console.error(`Fallback query also failed:`, fallbackError);
        return [];
      }
    }

    return [];
  }
}

/**
 * Fetch all recent articles (for main feed)
 */
async function fetchAllArticles(language = 'en', limit = FEED_CONFIG.itemsPerFeed) {
  const tableName = articlesTable(language);
  
  const sql = tableName === 'articles'
    ? `SELECT a.title, a.slug, a.summary, a.content, a.meta_description, a.image_url,
              a.language_code, a.published_at, a.created_at,
              c.name as category_name, c.slug as category_slug
       FROM ${tableName} a
       JOIN categories c ON c.id = a.category_id
       WHERE a.language_code = $1
       ORDER BY COALESCE(a.published_at, a.created_at) DESC
       LIMIT $2`
    : `SELECT a.title, a.slug, a.summary, a.content, a.meta_description, a.image_url,
              '${language}' as language_code, a.published_at, a.created_at,
              c.name as category_name, c.slug as category_slug
       FROM ${tableName} a
       JOIN categories c ON c.id = a.category_id
       ORDER BY COALESCE(a.published_at, a.created_at) DESC
       LIMIT $1`;
  
  const params = tableName === 'articles' ? [language, limit] : [limit];
  
  try {
    const result = await query(sql, params);
    return result.rows;
  } catch (error) {
    console.error(`Error fetching all articles:`, error);
    return [];
  }
}

/**
 * Get available categories for feed generation (with full data)
 * Safely checks which article tables exist before referencing them to avoid 42P01 errors.
 */
async function getAvailableCategories() {
  try {
    // Candidate article tables: language-sharded + legacy 'articles'
    const candidateTables = [
      ...Array.from(LANG_SHARDED_ARTICLE_TABLES).map(code => `articles_${code}`),
      'articles'
    ];

    // Discover which of the candidate tables actually exist
    const existingTablesResult = await query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name = ANY($1)`,
      [candidateTables]
    );
    const existingTables = existingTablesResult.rows.map(r => r.table_name);

    // If none exist yet, just return all categories (feeds will render empty until data arrives)
    if (existingTables.length === 0) {
      const fallbackResult = await query('SELECT id, slug, name FROM categories ORDER BY slug');
      return fallbackResult.rows;
    }

    // Build a UNION of EXISTS subqueries only for the tables that exist
    const unionSql = existingTables
      .map(t => `SELECT 1 FROM ${t} a WHERE a.category_id = c.id`)
      .join('\n        UNION ALL\n        ');

    const sql = `
      SELECT DISTINCT c.id, c.slug, c.name
      FROM categories c
      WHERE EXISTS (
        ${unionSql}
      )
      ORDER BY c.slug
    `;

    const result = await query(sql);
    return result.rows;
  } catch (error) {
    console.error('Error fetching categories:', error);
    // Fallback to all categories if there's an error
    try {
      const fallbackResult = await query('SELECT id, slug, name FROM categories ORDER BY slug');
      return fallbackResult.rows;
    } catch (fallbackError) {
      console.error('Error fetching fallback categories:', fallbackError);
      return [];
    }
  }
}

// Routes

/**
 * Main RSS feed (all categories)
 */
router.get('/all.rss', async (req, res) => {
  try {
    const language = req.query.lang || 'en';
    const requestedLanguage = req.query.lang; // Only pass if explicitly requested
    const articles = await fetchAllArticles(language);

    const feedInfo = {
      title: FEED_CONFIG.siteInfo.title,
      description: FEED_CONFIG.siteInfo.description,
      keywords: 'news, articles, insights, analysis, trends'
    };

    const rssXml = generateRssXml(feedInfo, articles, null, requestedLanguage);

    res.setHeader('Content-Type', 'application/rss+xml; charset=UTF-8');
    res.setHeader('Cache-Control', `public, max-age=${FEED_CONFIG.cacheMaxAge}`);
    res.send(rssXml);
  } catch (error) {
    console.error('Error generating main RSS feed:', error);
    res.status(500).type('text/plain').send('Failed to generate RSS feed');
  }
});

/**
 * Category-specific RSS feeds (dynamic from database)
 */
router.get('/:category.rss', async (req, res) => {
  try {
    const categorySlug = req.params.category;
    const language = req.query.lang || 'en';
    const requestedLanguage = req.query.lang; // Only pass if explicitly requested

    // Get category from database
    const categoryResult = await query(
      'SELECT id, name, slug FROM categories WHERE slug = $1',
      [categorySlug]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(404).type('text/plain').send('Category feed not found');
    }

    const category = categoryResult.rows[0];
    const articles = await fetchCategoryArticles(categorySlug, language);

    // Generate dynamic feed configuration
    const feedInfo = generateFeedConfig(category);

    if (articles.length === 0) {
      // Return empty feed instead of 404
      const rssXml = generateRssXml(feedInfo, [], categorySlug, requestedLanguage);

      res.setHeader('Content-Type', 'application/rss+xml; charset=UTF-8');
      res.setHeader('Cache-Control', `public, max-age=${FEED_CONFIG.cacheMaxAge}`);
      return res.send(rssXml);
    }

    const rssXml = generateRssXml(feedInfo, articles, categorySlug, requestedLanguage);

    res.setHeader('Content-Type', 'application/rss+xml; charset=UTF-8');
    res.setHeader('Cache-Control', `public, max-age=${FEED_CONFIG.cacheMaxAge}`);
    res.send(rssXml);
  } catch (error) {
    console.error(`Error generating RSS feed for category ${req.params.category}:`, error);
    res.status(500).type('text/plain').send('Failed to generate category RSS feed');
  }
});

/**
 * Feed index/discovery endpoint
 */
router.get('/index.json', async (req, res) => {
  try {
    const baseUrl = FEED_CONFIG.siteInfo.link;
    const categories = await getAvailableCategories();
    
    const feedIndex = {
      site: {
        title: FEED_CONFIG.siteInfo.title,
        description: FEED_CONFIG.siteInfo.description,
        url: baseUrl
      },
      feeds: {
        main: {
          title: 'All Articles',
          description: 'Latest articles from all categories',
          url: `${baseUrl}/api/feeds/all.rss`,
          type: 'rss'
        },
        categories: {}
      },
      lastUpdated: new Date().toISOString()
    };
    
    // Add category feeds (dynamic from database)
    for (const category of categories) {
      const feedConfig = generateFeedConfig(category);
      feedIndex.feeds.categories[category.slug] = {
        title: feedConfig.title,
        description: feedConfig.description,
        url: `${baseUrl}/api/feeds/${category.slug}.rss`,
        type: 'rss',
        keywords: feedConfig.keywords
      };
    }
    
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    res.setHeader('Cache-Control', `public, max-age=${FEED_CONFIG.cacheMaxAge}`);
    res.json(feedIndex);
  } catch (error) {
    console.error('Error generating feed index:', error);
    res.status(500).json({ error: 'Failed to generate feed index' });
  }
});

export default router;
