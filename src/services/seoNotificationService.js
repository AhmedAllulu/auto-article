import axios from 'axios';
import { config } from '../config.js';
import { genLog, genError } from './logger.js';
import { notifyWebSubNewArticle } from './webSubService.js';
import { GoogleAuth } from 'google-auth-library';


/**
 * SEO Notification Service
 * Automatically notifies search engines when new content is published
 * Implements Google/Bing sitemap ping and IndexNow API
 */

// Configuration for SEO notifications
const SEO_CONFIG = {
  // Base URL for sitemaps (from environment or config)
  baseUrl: config.seo.canonicalBaseUrl || process.env.CANONICAL_BASE_URL || 'https://megaquantum.net',

  // IndexNow API key (from config or environment)
  indexNowKey: config.seo.indexNowKey || process.env.INDEXNOW_API_KEY || '',

  // Google Indexing API configuration (restricted to jobs/livestreams)
  googleIndexingApiEnabled: String(process.env.ENABLE_GOOGLE_INDEXING_API || 'false') === 'true',
  googleServiceAccountKeyPath: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || '',
  googleServiceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '', // JSON string

  // Google Search Console Sitemaps API (recommended way to "ping" Google)
  googleSearchConsoleEnabled: String(process.env.ENABLE_GOOGLE_SEARCH_CONSOLE_API || 'false') === 'true',
  googleSearchConsoleSiteUrl: process.env.GOOGLE_SC_SITE_URL || '',

  // Bing Webmaster API configuration
  bingWebmasterApiEnabled: String(process.env.ENABLE_BING_WEBMASTER_API || 'false') === 'true',
  bingApiKey: process.env.BING_WEBMASTER_API_KEY || '',

  // Yandex Webmaster API configuration
  yandexWebmasterApiEnabled: String(process.env.ENABLE_YANDEX_WEBMASTER_API || 'false') === 'true',
  yandexApiKey: process.env.YANDEX_WEBMASTER_API_KEY || '',
  yandexUserId: process.env.YANDEX_USER_ID || '',

  // Enable/disable SEO notifications entirely
  enabled: config.seo.enableNotifications !== false,
  failSilently: config.seo.failSilently !== false,

  // Enable/disable different notification methods (legacy - deprecated in 2025)
  enableGooglePing: String(process.env.ENABLE_GOOGLE_PING || 'false') === 'true', // Deprecated
  enableBingPing: String(process.env.ENABLE_BING_PING || 'false') === 'true', // Deprecated
  enableIndexNow: String(process.env.ENABLE_INDEXNOW || 'true') === 'true',

  // Timeout for HTTP requests (in milliseconds)
  requestTimeout: Number(process.env.SEO_PING_TIMEOUT || 15000), // Increased for API calls

  // Rate limiting - minimum time between pings (in milliseconds)
  minPingInterval: Number(process.env.MIN_PING_INTERVAL || 30000), // Reduced for faster indexing

  // Batch size and delay for URL submissions
  maxUrlsPerBatch: Number(process.env.MAX_URLS_PER_BATCH || 50),
  bingBatchDelayMs: Number(process.env.BING_BATCH_DELAY_MS || 3000),
};

// Track last ping times to avoid spam
const lastPingTimes = {
  google: 0,
  bing: 0,
  indexnow: 0,
  googleIndexingApi: 0,
  bingWebmasterApi: 0,
  yandexWebmasterApi: 0,
};


/**
 * Submit URLs to Google Indexing API (2025 - LIMITED TO JOB POSTINGS & LIVESTREAMS ONLY)
 * Note: Google Indexing API is restricted to pages with Job Posting or Livestream structured data
 */
async function submitToGoogleIndexingApi(urls) {
  if (!SEO_CONFIG.googleIndexingApiEnabled) {
    genLog('Google Indexing API disabled', { urlCount: urls.length });
    return { success: false, reason: 'disabled' };
  }

  // Important: Google Indexing API is only for Job Postings and Livestreams in 2025
  genLog('Google Indexing API is restricted to Job Posting and Livestream content only (2025)', {
    urlCount: urls.length,
    note: 'Regular articles should use Search Console sitemap submission instead'
  });

  return {
    success: false,
    reason: 'restricted_to_job_postings_and_livestreams',
    note: 'Google Indexing API only supports Job Posting and Livestream structured data in 2025'
  };

  // Commented out implementation - only enable if you have Job Posting or Livestream content
  /*
  const now = Date.now();
  if (now - lastPingTimes.googleIndexingApi < SEO_CONFIG.minPingInterval) {
    genLog('Google Indexing API rate limited', {
      urlCount: urls.length,
      timeSinceLastPing: now - lastPingTimes.googleIndexingApi
    });
    return { success: false, reason: 'rate_limited' };
  }

  try {
    const authClient = await getGoogleAuthClient();
    const client = await authClient.getClient();

    const results = [];
    const batchSize = Math.min(SEO_CONFIG.maxUrlsPerBatch, 100); // Google limit is 100 per request

    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);

      for (const url of batch) {
        try {
          const response = await client.request({
            url: 'https://indexing.googleapis.com/v3/urlNotifications:publish',
            method: 'POST',
            data: {
              url: url,
              type: 'URL_UPDATED'
            }
          });

          results.push({ url, success: true, status: response.status });
        } catch (error) {
          results.push({ url, success: false, error: error.message });
        }
      }

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    lastPingTimes.googleIndexingApi = now;

    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    genLog('Google Indexing API submission completed', {
      urlCount: urls.length,
      successful,
      failed,
      results: results.slice(0, 5) // Log first 5 results
    });

    return {
      success: successful > 0,
      urlCount: urls.length,
      successful,
      failed,
      results
    };
  } catch (error) {
    genError('Google Indexing API submission failed', {
      urlCount: urls.length,
      error: error.message,
      code: error.code
    });

    return { success: false, error: error.message };
  }
  */
}

/**
 * Ping Google with sitemap update (DEPRECATED JUNE 2023 - Returns 404)
 * Google officially deprecated this endpoint and it returns 404 errors
 */
async function pingGoogle(sitemapUrl) {
  genLog('Google sitemap ping DEPRECATED (June 2023) - Use Search Console for sitemap submission', {
    sitemapUrl,
    deprecationDate: '2023-06-26',
    replacement: 'Submit sitemaps via Google Search Console or use IndexNow for faster discovery'
  });

  return {
    success: false,
    reason: 'deprecated_june_2023',
    message: 'Google deprecated sitemap ping endpoint in June 2023. Use Search Console instead.',
    replacement: 'https://search.google.com/search-console'
  };
}

/**
 * Submit sitemap to Google Search Console Sitemaps API using service account
 * Requires:
 *  - ENABLE_GOOGLE_SEARCH_CONSOLE_API=true
 *  - GOOGLE_SERVICE_ACCOUNT_KEY (JSON string) or GOOGLE_SERVICE_ACCOUNT_KEY_PATH
 *  - GOOGLE_SC_SITE_URL (GSC property URL, e.g., https://your-domain.tld/)
 */
async function submitSitemapToGoogleSearchConsole(sitemapUrl) {
  if (!SEO_CONFIG.googleSearchConsoleEnabled) {
    genLog('Google Search Console API disabled');
    return { success: false, reason: 'disabled' };
  }
  const siteUrl = SEO_CONFIG.googleSearchConsoleSiteUrl;
  if (!siteUrl) {
    genLog('Google Search Console site URL not configured');
    return { success: false, reason: 'no_site_url' };
  }

  try {
    // Load service account credentials
    let credentials = null;
    if (SEO_CONFIG.googleServiceAccountKey) {
      try {
        credentials = JSON.parse(SEO_CONFIG.googleServiceAccountKey);
      } catch (e) {
        genError('Invalid GOOGLE_SERVICE_ACCOUNT_KEY JSON', { error: e.message });
        return { success: false, reason: 'invalid_service_account_json' };
      }
    } else if (SEO_CONFIG.googleServiceAccountKeyPath) {
      // google-auth-library can read from keyFile, but we are running inside node; prefer key string
      credentials = null; // We'll rely on key path if configured
    } else {
      genLog('No Google service account key configured');
      return { success: false, reason: 'no_service_account' };
    }

    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/webmasters'],
      credentials: credentials || undefined,
      keyFile: credentials ? undefined : (SEO_CONFIG.googleServiceAccountKeyPath || undefined),
    });

    const client = await auth.getClient();

    // Try to detect the correct property automatically using the Sites list
    // This fixes 404 errors when the configured property does not match exactly
    const baseHostname = (() => {
      try { return new URL(SEO_CONFIG.baseUrl).hostname; } catch { return ''; }
    })();
    const bareDomain = baseHostname.replace(/^www\./i, '');

    // Candidate properties to try
    const configuredSite = siteUrl;
    const candidates = new Set([
      configuredSite,
      `sc-domain:${bareDomain}`,
      `https://${baseHostname}/`,
      `http://${baseHostname}/`,
      `https://${bareDomain}/`,
      `http://${bareDomain}/`,
      `https://www.${bareDomain}/`,
      `http://www.${bareDomain}/`,
    ]);

    // Fetch authorized sites and order candidates by availability and preference
    const sitesResp = await client.request({ url: 'https://www.googleapis.com/webmasters/v3/sites', method: 'GET' });
    const siteEntries = Array.isArray(sitesResp.data?.siteEntry) ? sitesResp.data.siteEntry : [];
    // Keep list for selection logic (used implicitly via orderedCandidates construction)
    const available = new Set(siteEntries.map(s => s.siteUrl)); void available;

    // Preferred order: sc-domain first, then https URL-prefix variants, then http variants, then configuredSite
    const orderedCandidates = [];
    orderedCandidates.push(`sc-domain:${bareDomain}`); // try sc-domain even if not listed; will 403 if unauthorized
    for (const c of [
      `https://${baseHostname}/`,
      `https://${bareDomain}/`,
      `https://www.${bareDomain}/`,
      `http://${baseHostname}/`,
      `http://${bareDomain}/`,
      `http://www.${bareDomain}/`,
      configuredSite,
    ]) if (c && candidates.has(c)) orderedCandidates.push(c);

    // Ensure uniqueness but keep order
    const tryList = [...new Set(orderedCandidates)];

    let lastError = null;
    for (const prop of tryList) {
      try {
        const encodedSite = encodeURIComponent(prop);
        const encodedSitemap = encodeURIComponent(sitemapUrl);
        const url = `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps/${encodedSitemap}`;
        const response = await client.request({ url, method: 'PUT' });
        genLog('Google Search Console sitemap submitted', { status: response.status, property: prop, sitemapUrl });
        return { success: true, status: response.status, property: prop };
      } catch (err) {
        lastError = err;
        const status = err.response?.status;
        genLog('GSC sitemap submission attempt failed for property, trying next', { propertyTried: prop, status, error: err.message });
        continue;
      }
    }

    if (lastError) throw lastError;
  } catch (error) {
    genError('Google Search Console sitemap submission failed', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    }, false);
    return { success: false, error: error.message, status: error.response?.status };
  }
}

/**
 * Submit URLs to Bing Webmaster API (2025 - ACTIVE METHOD)
 * This is the current recommended method for Bing URL submission
 */
async function submitToBingWebmasterApi(urls) {
  if (!SEO_CONFIG.bingWebmasterApiEnabled || !SEO_CONFIG.bingApiKey) {
    genLog('Bing Webmaster API disabled or not configured', {
      urlCount: urls.length,
      note: 'Configure BING_WEBMASTER_API_KEY to enable Bing URL submission'
    });
    return { success: false, reason: 'disabled_or_not_configured' };
  }

  const now = Date.now();
  if (now - lastPingTimes.bingWebmasterApi < SEO_CONFIG.minPingInterval) {
    genLog('Bing Webmaster API rate limited', {
      urlCount: urls.length,
      timeSinceLastPing: now - lastPingTimes.bingWebmasterApi
    });
    return { success: false, reason: 'rate_limited' };
  }

  try {
    const hostname = new URL(SEO_CONFIG.baseUrl).hostname;
    const results = [];
    let batchSize = Math.min(SEO_CONFIG.maxUrlsPerBatch, 10000); // API max per request

    for (let i = 0; i < urls.length; i += batchSize) {
      let batch = urls.slice(i, i + batchSize);

      try {
        // Bing Webmaster API endpoint (2025)
        const response = await axios.post(
          `https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlbatch?apikey=${SEO_CONFIG.bingApiKey}`,
          {
            siteUrl: `https://${hostname}`,
            urlList: batch
          },
          {
            timeout: SEO_CONFIG.requestTimeout,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'User-Agent': 'Mozilla/5.0 (compatible; MegaQuantumBot/1.0; +https://megaquantum.net/bot)',
            },
          }
        );

        results.push({
          batch: Math.floor(i / batchSize) + 1,
          success: true,
          status: response.status,
          urlCount: batch.length,
          response: response.data
        });
      } catch (err) {
        // Handle daily quota errors gracefully
        const msg = err.response?.data?.Message || err.message || '';
        const m = /Quota remaining for today:\s*(\d+)/i.exec(msg);
        if (m) {
          const remaining = parseInt(m[1], 10);
          if (remaining > 0) {
            // Retry once with reduced batch equal to remaining quota
            batch = batch.slice(0, remaining);
            try {
              const retryResp = await axios.post(
                `https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlbatch?apikey=${SEO_CONFIG.bingApiKey}`,
                { siteUrl: `https://${hostname}`, urlList: batch },
                {
                  timeout: SEO_CONFIG.requestTimeout,
                  headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'User-Agent': 'Mozilla/5.0 (compatible; MegaQuantumBot/1.0; +https://megaquantum.net/bot)',
                  },
                }
              );
              results.push({
                batch: Math.floor(i / batchSize) + 1,
                success: true,
                status: retryResp.status,
                urlCount: batch.length,
                response: retryResp.data,
                note: 'Adjusted to remaining daily quota'
              });
              // After consuming remaining quota, stop further submissions
              break;
            } catch (retryErr) {
              genLog('Bing Webmaster API quota-adjusted retry failed', {
                error: retryErr.message,
                status: retryErr.response?.status,
                responseData: retryErr.response?.data
              });
              return {
                success: false,
                reason: 'quota_error_retry_failed',
                details: retryErr.response?.data
              };
            }
          } else {
            // No remaining quota
            genLog('Bing Webmaster API quota exhausted', { remaining });
            return {
              success: false,
              reason: 'quota_exhausted',
              submitted: results.reduce((sum, r) => sum + (r.urlCount || 0), 0),
              batches: results.length
            };
          }
        }

        // Other errors
        genError('Bing Webmaster API submission failed (non-quota error)', {
          urlCount: urls.length,
          error: err.message,
          code: err.code,
          status: err.response?.status,
          responseData: err.response?.data
        }, false);
        return { success: false, error: err.message, details: err.response?.data };
      }

      // Delay between batches to respect rate limits
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, SEO_CONFIG.bingBatchDelayMs));
      }
    }

    lastPingTimes.bingWebmasterApi = now;

    genLog('Bing Webmaster API submission successful', {
      urlCount: urls.length,
      batches: results.length,
      hostname,
      results: results.map(r => ({ batch: r.batch, status: r.status, urlCount: r.urlCount }))
    });

    return {
      success: true,
      urlCount: urls.length,
      batches: results.length,
      hostname,
      results
    };
  } catch (error) {
    genError('Bing Webmaster API submission failed (outer)', {
      urlCount: urls.length,
      error: error.message,
      code: error.code,
      status: error.response?.status,
      responseData: error.response?.data
    }, false);

    return { success: false, error: error.message, details: error.response?.data };
  }
}

/**
 * Ping Bing with sitemap update (DEPRECATED - Returns 410)
 * Bing deprecated this endpoint and recommends IndexNow API or Bing Webmaster API
 */
async function pingBing(sitemapUrl) {
  genLog('Bing sitemap ping DEPRECATED - Use IndexNow API or Bing Webmaster API instead', {
    sitemapUrl,
    replacements: ['IndexNow API', 'Bing Webmaster Tools URL Submission API'],
    note: 'Bing deprecated sitemap ping and returns 410 errors'
  });

  return {
    success: false,
    reason: 'deprecated_use_indexnow_or_webmaster_api',
    message: 'Bing deprecated sitemap ping. Use IndexNow API or Bing Webmaster API instead.',
    replacements: {
      indexnow: 'https://www.indexnow.org/',
      bingWebmaster: 'https://www.bing.com/webmasters/'
    }
  };
}

/**
 * Submit URLs to IndexNow API (Bing + Yandex + Seznam + others)
 * Enhanced with retry logic and better error handling for 2025
 */
async function submitToIndexNow(urls, retryCount = 0) {
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

  // Validate URLs
  const validUrls = urls.filter(url => {
    try {
      new URL(url);
      return url.startsWith(SEO_CONFIG.baseUrl);
    } catch {
      return false;
    }
  });

  if (validUrls.length === 0) {
    genLog('No valid URLs for IndexNow submission', { originalCount: urls.length });
    return { success: false, reason: 'no_valid_urls' };
  }

  try {
    const hostname = new URL(SEO_CONFIG.baseUrl).hostname;

    // IndexNow API payload with improved format
    const payload = {
      host: hostname,
      key: SEO_CONFIG.indexNowKey,
      keyLocation: `${SEO_CONFIG.baseUrl}/${SEO_CONFIG.indexNowKey}.txt`,
      urlList: validUrls.slice(0, 10000), // IndexNow limit is 10,000 URLs per request
    };

    // Use multiple IndexNow endpoints for better reliability
    const endpoints = [
      'https://api.indexnow.org/indexnow',
      'https://www.bing.com/indexnow',
      'https://yandex.com/indexnow'
    ];

    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        const response = await axios.post(endpoint, payload, {
          timeout: SEO_CONFIG.requestTimeout,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'User-Agent': 'Mozilla/5.0 (compatible; MegaQuantumBot/1.0; +https://megaquantum.net/bot)',
          },
        });

        lastPingTimes.indexnow = now;

        genLog('IndexNow success', {
          urlCount: validUrls.length,
          status: response.status
        });

        return {
          success: true,
          status: response.status,
          urlCount: validUrls.length,
          endpoint,
          retryCount
        };
      } catch (error) {
        lastError = error;
        genLog('IndexNow endpoint failed', {
          endpoint,
          status: error.response?.status
        }, 'debug');
        continue;
      }
    }

    // If all endpoints failed, try retry with exponential backoff
    if (retryCount < 2) {
      const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
      genLog(`IndexNow submission failed, retrying in ${delay}ms`, {
        retryCount,
        urlCount: validUrls.length
      });

      await new Promise(resolve => setTimeout(resolve, delay));
      return await submitToIndexNow(urls, retryCount + 1);
    }

    throw lastError;
  } catch (error) {
    genError('IndexNow submission failed after all retries', {
      urlCount: validUrls.length,
      error: error.message,
      code: error.code,
      status: error.response?.status,
      retryCount
    });

    return { success: false, error: error.message, retryCount };
  }
}

/**
 * Submit URLs to Yandex Webmaster API
 */
async function submitToYandexWebmasterApi(urls) {
  if (!SEO_CONFIG.yandexWebmasterApiEnabled || !SEO_CONFIG.yandexApiKey || !SEO_CONFIG.yandexUserId) {
    genLog('Yandex Webmaster API disabled or not configured', { urlCount: urls.length });
    return { success: false, reason: 'disabled_or_not_configured' };
  }

  const now = Date.now();
  if (now - lastPingTimes.yandexWebmasterApi < SEO_CONFIG.minPingInterval) {
    genLog('Yandex Webmaster API rate limited', {
      urlCount: urls.length,
      timeSinceLastPing: now - lastPingTimes.yandexWebmasterApi
    });
    return { success: false, reason: 'rate_limited' };
  }

  try {
    const hostname = new URL(SEO_CONFIG.baseUrl).hostname;
    const results = [];
    const batchSize = Math.min(SEO_CONFIG.maxUrlsPerBatch, 100); // Yandex limit

    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);

      const response = await axios.post(
        `https://api.webmaster.yandex.net/v4/user/${SEO_CONFIG.yandexUserId}/hosts/${hostname}/recrawl/queue/`,
        { urls: batch },
        {
          timeout: SEO_CONFIG.requestTimeout,
          headers: {
            'Authorization': `OAuth ${SEO_CONFIG.yandexApiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; MegaQuantumBot/1.0; +https://megaquantum.net/bot)',
          },
        }
      );

      results.push({ batch: i / batchSize + 1, success: true, status: response.status, urlCount: batch.length });

      // Small delay between batches
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    lastPingTimes.yandexWebmasterApi = now;

    genLog('Yandex Webmaster API submission successful', {
      urlCount: urls.length,
      batches: results.length,
      hostname
    });

    return { success: true, urlCount: urls.length, batches: results.length };
  } catch (error) {
    genError('Yandex Webmaster API submission failed', {
      urlCount: urls.length,
      error: error.message,
      code: error.code,
      status: error.response?.status
    }, false);

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
 * Submit language-specific sitemaps to search engines
 * 2025 best practice: submit all language sitemap URLs in a single IndexNow request
 */
async function submitLanguageSpecificSitemaps(targetLanguage = null) {
  const languages = targetLanguage ? [targetLanguage] : (config.languages || ['en', 'de', 'fr', 'es', 'pt', 'ar', 'hi']);
  const sitemapUrls = languages.map(lang => `${SEO_CONFIG.baseUrl}/sitemaps/${lang}.xml`);

  genLog('Submitting language-specific sitemaps via single IndexNow request', {
    languages,
    count: sitemapUrls.length
  });

  try {
    const indexNowResult = await submitToIndexNow(sitemapUrls);

    const perLanguage = languages.map((lang, i) => ({
      language: lang,
      sitemapUrl: sitemapUrls[i],
      included: true,
    }));

    const success = Boolean(indexNowResult?.success);

    genLog('Language-specific sitemap submission completed', {
      totalLanguages: languages.length,
      successful: success ? languages.length : 0,
      failed: success ? 0 : languages.length,
      languages
    });

    return {
      success,
      totalLanguages: languages.length,
      successful: success ? languages.length : 0,
      failed: success ? 0 : languages.length,
      results: perLanguage,
      indexnow: indexNowResult,
    };
  } catch (error) {
    genError('Language-specific sitemap submission failed', {
      error: error.message
    });

    return {
      success: false,
      totalLanguages: languages.length,
      successful: 0,
      failed: languages.length,
      results: languages.map((lang, i) => ({ language: lang, sitemapUrl: sitemapUrls[i], included: false })),
      error: error.message
    };
  }
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
  // Check if SEO notifications are enabled
  if (!SEO_CONFIG.enabled) {
    genLog('SEO notifications disabled', {
      slug: article.slug,
      language: article.language_code
    });
    return { success: false, reason: 'disabled' };
  }

  const articleUrl = generateArticleUrl(article);
  const sitemapUrl = `${SEO_CONFIG.baseUrl}/sitemap-fresh.xml`;

  genLog('SEO notify start', {
    slug: article.slug,
    lang: article.language_code
  });

  const results = {
    article: {
      url: articleUrl,
      slug: article.slug,
      language: article.language_code,
    },
    notifications: {
      // Modern APIs (2025)
      googleIndexingApi: null,
      bingWebmasterApi: null,
      yandexWebmasterApi: null,
      indexnow: null,
      languageSpecificSitemaps: null,
      rss_feeds: null,
      websub: null,
      googleSearchConsole: null,
      // Legacy methods (deprecated)
      google_ping_legacy: null,
      bing_ping_legacy: null,
    },
    timestamp: new Date().toISOString(),
  };

  // Run all notifications in parallel for speed (2025 modern approach)
  const [
    googleIndexingResult,
    bingWebmasterResult,
    yandexWebmasterResult,
    indexNowResult,
    languageSpecificSitemapResult,
    rssResult,
    webSubResult,
    // Legacy methods (deprecated but kept for backward compatibility)
    googlePingResult,
    bingPingResult
  ] = await Promise.allSettled([
    submitToGoogleIndexingApi([articleUrl]),
    submitToBingWebmasterApi([articleUrl]),
    submitToYandexWebmasterApi([articleUrl]),
    submitToIndexNow([articleUrl]),
    submitLanguageSpecificSitemaps(article.language_code), // Language-specific sitemap submission
    notifyRssFeeds(article.category_slug), // Notify RSS feeds
    notifyWebSubNewArticle(article), // WebSub instant notifications
    // Legacy methods
    pingGoogle(sitemapUrl),
    pingBing(sitemapUrl),
  ]);

  // Process results
  results.notifications.googleIndexingApi = googleIndexingResult.status === 'fulfilled'
    ? googleIndexingResult.value
    : { success: false, error: googleIndexingResult.reason?.message };

  results.notifications.bingWebmasterApi = bingWebmasterResult.status === 'fulfilled'
    ? bingWebmasterResult.value
    : { success: false, error: bingWebmasterResult.reason?.message };

  results.notifications.yandexWebmasterApi = yandexWebmasterResult.status === 'fulfilled'
    ? yandexWebmasterResult.value
    : { success: false, error: yandexWebmasterResult.reason?.message };

  results.notifications.indexnow = indexNowResult.status === 'fulfilled'
    ? indexNowResult.value
    : { success: false, error: indexNowResult.reason?.message };

  results.notifications.languageSpecificSitemaps = languageSpecificSitemapResult.status === 'fulfilled'
    ? languageSpecificSitemapResult.value
    : { success: false, error: languageSpecificSitemapResult.reason?.message };

  results.notifications.rss_feeds = rssResult.status === 'fulfilled'
    ? { success: true }
    : { success: false, error: rssResult.reason?.message };

  results.notifications.websub = webSubResult.status === 'fulfilled'
    ? webSubResult.value
    : { success: false, error: webSubResult.reason?.message };

  // Legacy results (deprecated)
  results.notifications.google_ping_legacy = googlePingResult.status === 'fulfilled'
    ? googlePingResult.value
    : { success: false, error: googlePingResult.reason?.message };

  results.notifications.bing_ping_legacy = bingPingResult.status === 'fulfilled'
    ? bingPingResult.value
    : { success: false, error: bingPingResult.reason?.message };

  // Also submit sitemap to Google Search Console if enabled (modern, supported)
  const gscArticleResult = await submitSitemapToGoogleSearchConsole(sitemapUrl);
  results.notifications.googleSearchConsole = gscArticleResult;

  // Count successful notifications (excluding legacy methods)
  const modernNotifications = [
    'googleIndexingApi', 'bingWebmasterApi', 'yandexWebmasterApi',
    'indexnow', 'rss_feeds', 'websub', 'googleSearchConsole'
  ];

  const successfulNotifications = modernNotifications
    .filter(key => results.notifications[key]?.success === true).length;

  const summary = modernNotifications.reduce((acc, key) => {
    acc[key] = results.notifications[key]?.success === true;
    return acc;
  }, {});

  genLog('SEO notify done', {
    slug: article.slug,
    success: successfulNotifications,
    total: modernNotifications.length,
    summary
  });

  return results;
}

/**
 * Notify search engines about sitemap updates (for bulk operations)
 */
export async function notifySearchEnginesSitemapUpdate() {
  const sitemapUrl = `${SEO_CONFIG.baseUrl}/sitemap-fresh.xml`;

  genLog('Starting sitemap update notifications (2025 best practice)', { sitemapUrl });

  const results = {
    sitemap: sitemapUrl,
    notifications: {
      indexnow: null,
      languageSpecificSitemaps: null,
      // Legacy for visibility only
      google_ping_legacy: null,
      bing_ping_legacy: null,
    },
    timestamp: new Date().toISOString(),
  };

  // Run modern notifications in parallel (excluding GSC, which we run after for clarity)
  const [indexNowResult, langSitemapsResult, googlePingResult, bingPingResult] = await Promise.allSettled([
    submitToIndexNow([sitemapUrl]),
    submitLanguageSpecificSitemaps(),
    // Legacy (deprecated) - kept for transparency in logs
    pingGoogle(sitemapUrl),
    pingBing(sitemapUrl),
  ]);

  // Also submit sitemap to Google Search Console if enabled (modern, supported)
  const gscResult = await submitSitemapToGoogleSearchConsole(sitemapUrl);
  results.notifications.googleSearchConsole = gscResult;

  // Process results
  results.notifications.indexnow = indexNowResult.status === 'fulfilled'
    ? indexNowResult.value
    : { success: false, error: indexNowResult.reason?.message };

  results.notifications.languageSpecificSitemaps = langSitemapsResult.status === 'fulfilled'
    ? langSitemapsResult.value
    : { success: false, error: langSitemapsResult.reason?.message };

  // Legacy results
  results.notifications.google_ping_legacy = googlePingResult.status === 'fulfilled'
    ? googlePingResult.value
    : { success: false, error: googlePingResult.reason?.message };

  results.notifications.bing_ping_legacy = bingPingResult.status === 'fulfilled'
    ? bingPingResult.value
    : { success: false, error: bingPingResult.reason?.message };

  // Log summary (modern only)
  const modernKeys = ['indexnow', 'languageSpecificSitemaps'];
  const successCount = modernKeys
    .filter(k => results.notifications[k]?.success === true).length;

  genLog('Sitemap update notifications completed', {
    sitemapUrl,
    successfulNotifications: successCount,
    totalNotifications: modernKeys.length,
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
  const sitemapUrl = `${SEO_CONFIG.baseUrl}/sitemap-fresh.xml`;

  genLog('Starting batch SEO notifications (2025 best practice)', {
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
      // Modern methods
      indexnow: null,
      bingWebmasterApi: null,
      yandexWebmasterApi: null,
      // Legacy visibility only
      google_ping_legacy: null,
      bing_ping_legacy: null,
    },
    timestamp: new Date().toISOString(),
  };

  // Run all notifications in parallel using modern methods
  const [indexNowResult, bingWebmasterResult, yandexWebmasterResult, googlePingResult, bingPingResult] = await Promise.allSettled([
    submitToIndexNow(urls),
    submitToBingWebmasterApi(urls),
    submitToYandexWebmasterApi(urls),
    // Legacy
    pingGoogle(sitemapUrl),
    pingBing(sitemapUrl),
  ]);

  // Process results
  results.notifications.indexnow = indexNowResult.status === 'fulfilled'
    ? indexNowResult.value
    : { success: false, error: indexNowResult.reason?.message };

  results.notifications.bingWebmasterApi = bingWebmasterResult.status === 'fulfilled'
    ? bingWebmasterResult.value
    : { success: false, error: bingWebmasterResult.reason?.message };

  results.notifications.yandexWebmasterApi = yandexWebmasterResult.status === 'fulfilled'
    ? yandexWebmasterResult.value
    : { success: false, error: yandexWebmasterResult.reason?.message };

  // Legacy
  results.notifications.google_ping_legacy = googlePingResult.status === 'fulfilled'
    ? googlePingResult.value
    : { success: false, error: googlePingResult.reason?.message };

  results.notifications.bing_ping_legacy = bingPingResult.status === 'fulfilled'
    ? bingPingResult.value
    : { success: false, error: bingPingResult.reason?.message };

  // Log summary (modern only)
  const modernKeys = ['indexnow', 'bingWebmasterApi', 'yandexWebmasterApi'];
  const successCount = modernKeys
    .filter(k => results.notifications[k]?.success === true).length;

  genLog('Batch SEO notifications completed', {
    articleCount: articles.length,
    successfulNotifications: successCount,
    totalNotifications: modernKeys.length,
    results: results.notifications
  });

  return results;
}

export { SEO_CONFIG };
