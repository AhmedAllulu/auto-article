import axios from 'axios';
import { config } from '../config.js';
import { genLog, genError } from './logger.js';
import { notifyWebSubNewArticle } from './webSubService.js';

/**
 * SEO Notification Service
 * Automatically notifies search engines when new content is published
 * Implements Google/Bing sitemap ping and IndexNow API
 */

// Configuration for SEO notifications
const SEO_CONFIG = {
  // Base URL for sitemaps (from environment or config)
  baseUrl: config.seo.canonicalBaseUrl || process.env.CANONICAL_BASE_URL || 'https://vivaverse.top',
  
  // IndexNow API key (should be set in environment)
  indexNowKey: process.env.INDEXNOW_API_KEY || '',
  
  // Enable/disable different notification methods
  enableGooglePing: String(process.env.ENABLE_GOOGLE_PING || 'true') === 'true',
  enableBingPing: String(process.env.ENABLE_BING_PING || 'true') === 'true',
  enableIndexNow: String(process.env.ENABLE_INDEXNOW || 'true') === 'true',
  
  // Timeout for HTTP requests (in milliseconds)
  requestTimeout: Number(process.env.SEO_PING_TIMEOUT || 10000),
  
  // Rate limiting - minimum time between pings (in milliseconds)
  minPingInterval: Number(process.env.MIN_PING_INTERVAL || 60000), // 1 minute
};

// Track last ping times to avoid spam
const lastPingTimes = {
  google: 0,
  bing: 0,
  indexnow: 0,
};

/**
 * Ping Google with sitemap update
 */
async function pingGoogle(sitemapUrl) {
  if (!SEO_CONFIG.enableGooglePing) {
    genLog('Google ping disabled', { sitemapUrl });
    return { success: false, reason: 'disabled' };
  }

  const now = Date.now();
  if (now - lastPingTimes.google < SEO_CONFIG.minPingInterval) {
    genLog('Google ping rate limited', { 
      sitemapUrl, 
      timeSinceLastPing: now - lastPingTimes.google 
    });
    return { success: false, reason: 'rate_limited' };
  }

  try {
    const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    
    const response = await axios.get(pingUrl, {
      timeout: SEO_CONFIG.requestTimeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MegaQuantumBot/1.0; +https://vivaverse.top/bot)',
      },
    });

    lastPingTimes.google = now;
    
    genLog('Google sitemap ping successful', {
      sitemapUrl,
      status: response.status,
      responseTime: response.headers['x-response-time'] || 'unknown'
    });

    return { success: true, status: response.status };
  } catch (error) {
    genError('Google sitemap ping failed', {
      sitemapUrl,
      error: error.message,
      code: error.code,
      status: error.response?.status
    });

    return { success: false, error: error.message };
  }
}

/**
 * Ping Bing with sitemap update
 */
async function pingBing(sitemapUrl) {
  if (!SEO_CONFIG.enableBingPing) {
    genLog('Bing ping disabled', { sitemapUrl });
    return { success: false, reason: 'disabled' };
  }

  const now = Date.now();
  if (now - lastPingTimes.bing < SEO_CONFIG.minPingInterval) {
    genLog('Bing ping rate limited', { 
      sitemapUrl, 
      timeSinceLastPing: now - lastPingTimes.bing 
    });
    return { success: false, reason: 'rate_limited' };
  }

  try {
    const pingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    
    const response = await axios.get(pingUrl, {
      timeout: SEO_CONFIG.requestTimeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MegaQuantumBot/1.0; +https://vivaverse.top/bot)',
      },
    });

    lastPingTimes.bing = now;
    
    genLog('Bing sitemap ping successful', {
      sitemapUrl,
      status: response.status,
      responseTime: response.headers['x-response-time'] || 'unknown'
    });

    return { success: true, status: response.status };
  } catch (error) {
    genError('Bing sitemap ping failed', {
      sitemapUrl,
      error: error.message,
      code: error.code,
      status: error.response?.status
    });

    return { success: false, error: error.message };
  }
}

/**
 * Submit URLs to IndexNow API (Bing + Yandex + others)
 */
async function submitToIndexNow(urls) {
  if (!SEO_CONFIG.enableIndexNow) {
    genLog('IndexNow disabled', { urlCount: urls.length });
    return { success: false, reason: 'disabled' };
  }

  if (!SEO_CONFIG.indexNowKey) {
    genLog('IndexNow API key not configured', { urlCount: urls.length });
    return { success: false, reason: 'no_api_key' };
  }

  const now = Date.now();
  if (now - lastPingTimes.indexnow < SEO_CONFIG.minPingInterval) {
    genLog('IndexNow rate limited', { 
      urlCount: urls.length,
      timeSinceLastPing: now - lastPingTimes.indexnow 
    });
    return { success: false, reason: 'rate_limited' };
  }

  try {
    // IndexNow API payload
    const payload = {
      host: new URL(SEO_CONFIG.baseUrl).hostname,
      key: SEO_CONFIG.indexNowKey,
      keyLocation: `${SEO_CONFIG.baseUrl}/${SEO_CONFIG.indexNowKey}.txt`,
      urlList: urls.slice(0, 10000), // IndexNow limit is 10,000 URLs per request
    };

    const response = await axios.post('https://api.indexnow.org/indexnow', payload, {
      timeout: SEO_CONFIG.requestTimeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; MegaQuantumBot/1.0; +https://vivaverse.top/bot)',
      },
    });

    lastPingTimes.indexnow = now;
    
    genLog('IndexNow submission successful', {
      urlCount: urls.length,
      status: response.status,
      host: payload.host
    });

    return { success: true, status: response.status, urlCount: urls.length };
  } catch (error) {
    genError('IndexNow submission failed', {
      urlCount: urls.length,
      error: error.message,
      code: error.code,
      status: error.response?.status
    });

    return { success: false, error: error.message };
  }
}

/**
 * Generate article URL from article data
 */
function generateArticleUrl(article) {
  const { language_code, slug } = article;
  return `${SEO_CONFIG.baseUrl}/${language_code}/article/${slug}`;
}

/**
 * Get available categories from database
 */
async function getAvailableCategories() {
  try {
    const { query } = await import('../db.js');
    const result = await query('SELECT slug FROM categories ORDER BY slug');
    return result.rows.map(row => row.slug);
  } catch (error) {
    genError('Failed to fetch categories for RSS notification', { error: error.message });
    return [];
  }
}

/**
 * Notify search engines about RSS feed updates
 */
async function notifyRssFeeds(categorySlug = null) {
  const baseUrl = SEO_CONFIG.baseUrl;
  const feedUrls = [];

  if (categorySlug) {
    // Specific category feed
    feedUrls.push(`${baseUrl}/api/feeds/${categorySlug}.rss`);
  } else {
    // All feeds
    feedUrls.push(`${baseUrl}/api/feeds/all.rss`);

    // Get all available categories from database
    const availableCategories = await getAvailableCategories();
    for (const cat of availableCategories) {
      feedUrls.push(`${baseUrl}/api/feeds/${cat}.rss`);
    }
  }

  // Submit RSS feed URLs to IndexNow for faster discovery
  if (SEO_CONFIG.enableIndexNow && feedUrls.length > 0) {
    try {
      await submitToIndexNow(feedUrls);
      genLog('RSS feeds submitted to IndexNow', {
        feedCount: feedUrls.length,
        category: categorySlug || 'all',
        feeds: feedUrls
      });
    } catch (error) {
      genError('Failed to submit RSS feeds to IndexNow', {
        error: error.message,
        feedCount: feedUrls.length,
        category: categorySlug || 'all'
      });
    }
  }
}

/**
 * Notify search engines about new article publication
 */
export async function notifySearchEnginesNewArticle(article) {
  const articleUrl = generateArticleUrl(article);
  const sitemapUrl = `${SEO_CONFIG.baseUrl}/api/sitemap.xml`;

  genLog('Starting SEO notifications for new article', {
    articleUrl,
    slug: article.slug,
    language: article.language_code,
    title: article.title?.substring(0, 100)
  });

  const results = {
    article: {
      url: articleUrl,
      slug: article.slug,
      language: article.language_code,
    },
    notifications: {
      google: null,
      bing: null,
      indexnow: null,
      rss_feeds: null,
      websub: null,
    },
    timestamp: new Date().toISOString(),
  };

  // Run all notifications in parallel for speed
  const [googleResult, bingResult, indexNowResult, rssResult, webSubResult] = await Promise.allSettled([
    pingGoogle(sitemapUrl),
    pingBing(sitemapUrl),
    submitToIndexNow([articleUrl]),
    notifyRssFeeds(article.category_slug), // Notify RSS feeds
    notifyWebSubNewArticle(article), // WebSub instant notifications
  ]);

  // Process results
  results.notifications.google = googleResult.status === 'fulfilled' 
    ? googleResult.value 
    : { success: false, error: googleResult.reason?.message };

  results.notifications.bing = bingResult.status === 'fulfilled' 
    ? bingResult.value 
    : { success: false, error: bingResult.reason?.message };

  results.notifications.indexnow = indexNowResult.status === 'fulfilled'
    ? indexNowResult.value
    : { success: false, error: indexNowResult.reason?.message };

  results.notifications.rss_feeds = rssResult.status === 'fulfilled'
    ? { success: true }
    : { success: false, error: rssResult.reason?.message };

  results.notifications.websub = webSubResult.status === 'fulfilled'
    ? webSubResult.value
    : { success: false, error: webSubResult.reason?.message };

  // Log summary
  const successCount = Object.values(results.notifications)
    .filter(result => result?.success).length;
  
  genLog('SEO notifications completed', {
    articleUrl,
    successfulNotifications: successCount,
    totalNotifications: 3,
    results: results.notifications
  });

  return results;
}

/**
 * Notify search engines about sitemap updates (for bulk operations)
 */
export async function notifySearchEnginesSitemapUpdate() {
  const sitemapUrl = `${SEO_CONFIG.baseUrl}/api/sitemap.xml`;
  
  genLog('Starting sitemap update notifications', { sitemapUrl });

  const results = {
    sitemap: sitemapUrl,
    notifications: {
      google: null,
      bing: null,
    },
    timestamp: new Date().toISOString(),
  };

  // Run notifications in parallel
  const [googleResult, bingResult] = await Promise.allSettled([
    pingGoogle(sitemapUrl),
    pingBing(sitemapUrl),
  ]);

  // Process results
  results.notifications.google = googleResult.status === 'fulfilled' 
    ? googleResult.value 
    : { success: false, error: googleResult.reason?.message };

  results.notifications.bing = bingResult.status === 'fulfilled' 
    ? bingResult.value 
    : { success: false, error: bingResult.reason?.message };

  // Log summary
  const successCount = Object.values(results.notifications)
    .filter(result => result?.success).length;
  
  genLog('Sitemap update notifications completed', {
    sitemapUrl,
    successfulNotifications: successCount,
    totalNotifications: 2,
    results: results.notifications
  });

  return results;
}

/**
 * Batch notify search engines about multiple new URLs
 */
export async function notifySearchEnginesBatch(articles) {
  if (!articles || articles.length === 0) {
    genLog('No articles provided for batch SEO notification');
    return { success: false, reason: 'no_articles' };
  }

  const urls = articles.map(generateArticleUrl);
  const sitemapUrl = `${SEO_CONFIG.baseUrl}/api/sitemap.xml`;
  
  genLog('Starting batch SEO notifications', {
    articleCount: articles.length,
    languages: [...new Set(articles.map(a => a.language_code))],
    sitemapUrl
  });

  const results = {
    articles: articles.map(a => ({
      url: generateArticleUrl(a),
      slug: a.slug,
      language: a.language_code,
    })),
    notifications: {
      google: null,
      bing: null,
      indexnow: null,
    },
    timestamp: new Date().toISOString(),
  };

  // Run all notifications in parallel
  const [googleResult, bingResult, indexNowResult] = await Promise.allSettled([
    pingGoogle(sitemapUrl),
    pingBing(sitemapUrl),
    submitToIndexNow(urls),
  ]);

  // Process results (same as single article)
  results.notifications.google = googleResult.status === 'fulfilled' 
    ? googleResult.value 
    : { success: false, error: googleResult.reason?.message };

  results.notifications.bing = bingResult.status === 'fulfilled' 
    ? bingResult.value 
    : { success: false, error: bingResult.reason?.message };

  results.notifications.indexnow = indexNowResult.status === 'fulfilled' 
    ? indexNowResult.value 
    : { success: false, error: indexNowResult.reason?.message };

  // Log summary
  const successCount = Object.values(results.notifications)
    .filter(result => result?.success).length;
  
  genLog('Batch SEO notifications completed', {
    articleCount: articles.length,
    successfulNotifications: successCount,
    totalNotifications: 3,
    results: results.notifications
  });

  return results;
}

export { SEO_CONFIG };
