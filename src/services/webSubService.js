import axios from 'axios';
import { genLog, genError } from './logger.js';

/**
 * WebSub (PubSubHubbub) Service
 * Provides instant push notifications to subscribers when RSS feeds are updated
 */

// WebSub Configuration
const WEBSUB_CONFIG = {
  // Primary hub (Google's free service)
  primaryHub: 'https://pubsubhubbub.appspot.com/',
  
  // Alternative hubs for redundancy
  alternativeHubs: [
    'https://pubsubhubbub.superfeedr.com/'
    // Removed 'https://websub.rocks/hub' - returns 405 errors
  ],
  
  // Enable/disable WebSub notifications
  enabled: String(process.env.ENABLE_WEBSUB || 'true') === 'true',
  
  // Request timeout
  timeout: Number(process.env.WEBSUB_TIMEOUT || 10000),
  
  // Rate limiting
  minNotificationInterval: Number(process.env.WEBSUB_MIN_INTERVAL || 30000), // 30 seconds
  
  // Base URL for feeds
  baseUrl: process.env.CANONICAL_BASE_URL || 'https://vivaverse.top',
  
  // User agent for requests
  userAgent: 'Mozilla/5.0 (compatible; MegaQuantumBot/1.0; +https://vivaverse.top/bot)'
};

// Track last notification times to prevent spam
const lastNotificationTimes = new Map();

/**
 * Notify a WebSub hub about feed updates
 */
async function notifyHub(hubUrl, feedUrls) {
  if (!WEBSUB_CONFIG.enabled) {
    genLog('WebSub notifications disabled', { hubUrl, feedCount: feedUrls.length });
    return { success: false, reason: 'disabled' };
  }

  const now = Date.now();
  const lastNotification = lastNotificationTimes.get(hubUrl) || 0;
  
  if (now - lastNotification < WEBSUB_CONFIG.minNotificationInterval) {
    genLog('WebSub notification rate limited', { 
      hubUrl, 
      feedCount: feedUrls.length,
      timeSinceLastNotification: now - lastNotification 
    });
    return { success: false, reason: 'rate_limited' };
  }

  try {
    // Prepare form data for hub notification
    const formData = new URLSearchParams();
    formData.append('hub.mode', 'publish');
    
    // Add all feed URLs
    feedUrls.forEach(feedUrl => {
      formData.append('hub.url', feedUrl);
    });

    const response = await axios.post(hubUrl, formData, {
      timeout: WEBSUB_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': WEBSUB_CONFIG.userAgent,
      },
    });

    lastNotificationTimes.set(hubUrl, now);
    
    genLog('WebSub hub notification successful', {
      hubUrl,
      feedCount: feedUrls.length,
      status: response.status,
      responseTime: response.headers['x-response-time'] || 'unknown'
    });

    return { 
      success: true, 
      status: response.status,
      feedCount: feedUrls.length,
      hubUrl 
    };
    
  } catch (error) {
    genError('WebSub hub notification failed', {
      hubUrl,
      feedCount: feedUrls.length,
      error: error.message,
      code: error.code,
      status: error.response?.status
    });

    return { 
      success: false, 
      error: error.message,
      hubUrl,
      status: error.response?.status 
    };
  }
}

/**
 * Notify all WebSub hubs about feed updates
 */
async function notifyAllHubs(feedUrls) {
  if (!WEBSUB_CONFIG.enabled || !feedUrls || feedUrls.length === 0) {
    genLog('WebSub notifications skipped', { 
      enabled: WEBSUB_CONFIG.enabled,
      feedCount: feedUrls?.length || 0 
    });
    return { success: false, reason: 'disabled_or_no_feeds' };
  }

  const allHubs = [WEBSUB_CONFIG.primaryHub, ...WEBSUB_CONFIG.alternativeHubs];
  
  genLog('Starting WebSub notifications', {
    feedCount: feedUrls.length,
    hubCount: allHubs.length,
    feeds: feedUrls
  });

  // Notify all hubs in parallel
  const hubResults = await Promise.allSettled(
    allHubs.map(hubUrl => notifyHub(hubUrl, feedUrls))
  );

  // Process results
  const results = {
    feedUrls,
    hubs: {},
    summary: {
      total: allHubs.length,
      successful: 0,
      failed: 0
    },
    timestamp: new Date().toISOString()
  };

  hubResults.forEach((result, index) => {
    const hubUrl = allHubs[index];
    const hubResult = result.status === 'fulfilled' 
      ? result.value 
      : { success: false, error: result.reason?.message };
    
    results.hubs[hubUrl] = hubResult;
    
    if (hubResult.success) {
      results.summary.successful++;
    } else {
      results.summary.failed++;
    }
  });

  genLog('WebSub notifications completed', {
    feedCount: feedUrls.length,
    successfulHubs: results.summary.successful,
    failedHubs: results.summary.failed,
    totalHubs: results.summary.total
  });

  return results;
}

/**
 * Notify WebSub hubs about a specific feed update
 */
export async function notifyWebSubFeedUpdate(feedUrl) {
  if (!feedUrl) {
    genError('WebSub notification called with empty feed URL');
    return { success: false, reason: 'no_feed_url' };
  }

  return await notifyAllHubs([feedUrl]);
}

/**
 * Notify WebSub hubs about multiple feed updates
 */
export async function notifyWebSubFeedsUpdate(feedUrls) {
  if (!feedUrls || feedUrls.length === 0) {
    genError('WebSub notification called with empty feed URLs');
    return { success: false, reason: 'no_feed_urls' };
  }

  return await notifyAllHubs(feedUrls);
}

/**
 * Notify WebSub hubs about new article (category-specific and main feed)
 */
export async function notifyWebSubNewArticle(article) {
  const feedUrls = [];
  
  // Main feed always gets updated
  feedUrls.push(`${WEBSUB_CONFIG.baseUrl}/api/feeds/all.rss`);
  
  // Category-specific feed if article has category
  if (article.category_slug) {
    feedUrls.push(`${WEBSUB_CONFIG.baseUrl}/api/feeds/${article.category_slug}.rss`);
  }

  genLog('WebSub notification for new article', {
    articleSlug: article.slug,
    categorySlug: article.category_slug,
    feedCount: feedUrls.length
  });

  return await notifyAllHubs(feedUrls);
}

/**
 * Notify WebSub hubs about all feeds (for bulk updates)
 */
export async function notifyWebSubAllFeeds() {
  try {
    // Get all available categories from database
    const { query } = await import('../db.js');
    const categoriesResult = await query('SELECT slug FROM categories ORDER BY slug');
    const categories = categoriesResult.rows;
    
    const feedUrls = [];
    
    // Main feed
    feedUrls.push(`${WEBSUB_CONFIG.baseUrl}/api/feeds/all.rss`);
    
    // All category feeds
    categories.forEach(category => {
      feedUrls.push(`${WEBSUB_CONFIG.baseUrl}/api/feeds/${category.slug}.rss`);
    });

    genLog('WebSub notification for all feeds', {
      totalFeeds: feedUrls.length,
      categoryCount: categories.length
    });

    return await notifyAllHubs(feedUrls);
    
  } catch (error) {
    genError('Failed to notify WebSub for all feeds', {
      error: error.message
    });
    
    return { success: false, error: error.message };
  }
}

/**
 * Test WebSub hub connectivity
 */
export async function testWebSubHubs() {
  const testFeedUrl = `${WEBSUB_CONFIG.baseUrl}/api/feeds/all.rss`;
  
  genLog('Testing WebSub hub connectivity', {
    testFeedUrl,
    primaryHub: WEBSUB_CONFIG.primaryHub,
    alternativeHubCount: WEBSUB_CONFIG.alternativeHubs.length
  });

  return await notifyAllHubs([testFeedUrl]);
}

export { WEBSUB_CONFIG };
