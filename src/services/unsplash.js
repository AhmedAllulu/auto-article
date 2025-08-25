import axios from 'axios';
import { config } from '../config.js';
import { query } from '../db.js';

// Normalize URL by stripping query parameters (anything after '?')
function normalizeUrl(url = '') {
  return url.split('?')[0];
}

// Generic used-check by base URL (works for any provider)
async function isImageBaseUrlUsed(baseUrl) {
  if (!baseUrl) return false;
  try {
    const res = await query(
      'SELECT 1 FROM articles_en WHERE image_url LIKE $1 LIMIT 1',
      [`${baseUrl}%`]
    );
    return res.rows.length > 0;
  } catch (err) {
    console.error('Error checking image URL usage:', err);
    return false;
  }
}

// Check if an Unsplash photo (by base URL or photo ID) is already used
async function isUnsplashPhotoUsed({ baseUrl, photoId }) {
  try {
    // Prefer searching by photoId if provided (more robust)
    if (photoId) {
      const res = await query(
        'SELECT 1 FROM articles_en WHERE image_url LIKE $1 LIMIT 1',
        [`%${photoId}%`]
      );
      if (res.rows.length > 0) return true;
    }
    if (baseUrl) {
      const res2 = await query(
        'SELECT 1 FROM articles_en WHERE image_url LIKE $1 LIMIT 1',
        [`${baseUrl}%`]
      );
      return res2.rows.length > 0;
    }
    return false;
  } catch (err) {
    console.error('Error checking Unsplash photo usage:', err);
    return false;
  }
}

// Helper function to optimize Unsplash image URL for next-gen formats
function optimizeUnsplashUrl(url, options = {}) {
  if (!url || !url.includes('images.unsplash.com')) return url;

  try {
    const urlObj = new URL(url);

    // Add auto=format for automatic format selection (WebP/AVIF)
    urlObj.searchParams.set('auto', 'format');

    // Add compression quality if not already set
    if (!urlObj.searchParams.has('q')) {
      urlObj.searchParams.set('q', '85');
    }

    // Add width/height if provided
    if (options.width) urlObj.searchParams.set('w', options.width);
    if (options.height) urlObj.searchParams.set('h', options.height);

    return urlObj.toString();
  } catch (err) {
    console.error('Error optimizing Unsplash URL:', err);
    return url;
  }
}

export async function fetchUnsplashImageUrl(query_param) {
  if (!config.unsplash.accessKey) return null;
  try {
    // Fetch more images to have alternatives if some are already used
    const resp = await axios.get('https://api.unsplash.com/search/photos', {
      params: { query: query_param, per_page: 10, orientation: 'landscape' },
      headers: { Authorization: `Client-ID ${config.unsplash.accessKey}` },
      timeout: 10000,
    });
    const results = resp?.data?.results || [];
    if (results.length === 0) return null;

    // Check each image to find one that hasn't been used yet
    for (const photo of results) {
      const imageUrl = photo?.urls?.regular || photo?.urls?.full;
      if (imageUrl) {
        const isUsed = await isUnsplashPhotoUsed({ baseUrl: normalizeUrl(imageUrl), photoId: photo?.id });
        if (!isUsed) {
          // Optimize the URL for next-gen formats
          return optimizeUnsplashUrl(imageUrl);
        }
      }
    }

    // If all images are already used, return the first one as fallback
    // This prevents the system from breaking if all fetched images are duplicates
    const fallbackPhoto = results[0];
    const fallbackUrl = fallbackPhoto?.urls?.regular || fallbackPhoto?.urls?.full || null;
    return fallbackUrl ? optimizeUnsplashUrl(fallbackUrl) : null;
  } catch (err) {
    console.error('Error fetching Unsplash image:', err);
    return null;
  }
}

// Fetch image URL from Openverse (CC0/PDM by default)
// Internal: fetch a fresh Openverse token when possible
async function refreshOpenverseTokenIfNeeded() {
  try {
    // If we already have a token, assume valid until a 401 tells us otherwise.
    if (config.openverse?.token) return config.openverse.token;
    const id = config.openverse?.clientId;
    const secret = config.openverse?.clientSecret;
    if (!id || !secret) return '';
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: id,
      client_secret: secret,
    });
    const resp = await axios.post('https://api.openverse.org/v1/auth_tokens/token/', body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000,
    });
    const token = resp?.data?.access_token || '';
    // Mutate config in-memory so subsequent calls use the token
    if (token) config.openverse.token = token;
    return token;
  } catch (e) {
    console.warn('Openverse token refresh failed, proceeding anonymously:', e?.response?.status || e?.message);
    return '';
  }
}



// Helper to validate if an image URL actually works
async function validateImageUrl(url) {
  try {
    const response = await axios.head(url, {
      timeout: 5000,
      validateStatus: (status) => status < 500 // Accept redirects, but not server errors
    });
    return response.status >= 200 && response.status < 400;
  } catch (err) {
    return false;
  }
}

export async function fetchOpenverseImageUrl(query_param) {
  try {
    const baseParams = {
      q: query_param,
      page_size: 20, // Increased to have more options after filtering
      mature: false,
      filter_dead: true,
    };
    const licenses = (config.openverse?.licenses || []);
    if (licenses.length > 0) baseParams.license = licenses.join(',');

    // Ensure we have a token if credentials are provided
    await refreshOpenverseTokenIfNeeded();

    const headers = config.openverse?.token ? { Authorization: `Bearer ${config.openverse.token}` } : {};

    // Make API request
    let resp;
    try {
      resp = await axios.get('https://api.openverse.org/v1/images/', {
        params: baseParams,
        headers,
        timeout: 10000,
      });
    } catch (err) {
      if (err?.response?.status === 401) {
        // Retry anonymously if token invalid/expired
        resp = await axios.get('https://api.openverse.org/v1/images/', {
          params: baseParams,
          timeout: 10000,
        });
      } else {
        throw err;
      }
    }

    const results = resp?.data?.results || [];
    if (results.length === 0) return null;

    // Helper to determine if an item is SVG or too small
    const isValidImage = (item) => {
      const ft = String(item?.filetype || '').toLowerCase();
      const u = String(item?.url || '').toLowerCase();
      const width = parseInt(item?.width) || 0;
      const height = parseInt(item?.height) || 0;

      // Skip SVGs completely
      if (ft.includes('svg') || u.includes('.svg')) return false;

      // Skip images that are too small (less than 800px on longest side)
      if (width > 0 && height > 0 && Math.max(width, height) < 800) return false;

      return true;
    };

    // Filter and try each valid result with URL validation
    const validResults = results.filter(isValidImage);

    for (const item of validResults) {
      const id = item?.id;
      const directUrl = item?.url;

      // Always prefer Openverse proxy for better optimization and reliability
      // Use watermarked=false to get clean images when possible
      const candidates = [
        id ? `https://api.openverse.org/v1/images/${id}/thumb/?full_size=true&compressed=true&watermarked=false` : null,
        id ? `https://api.openverse.org/v1/images/${id}/thumb/?full_size=true&compressed=true` : null,
        directUrl
      ].filter(Boolean);

      for (const candidate of candidates) {
        const base = normalizeUrl(candidate);
        const used = await isImageBaseUrlUsed(base);
        if (used) continue;

        // Validate the URL actually works to avoid 424 errors
        const isValid = await validateImageUrl(candidate);
        if (isValid) return candidate;
      }
    }

    // If no valid large images found, try with relaxed size requirements
    const relaxedResults = results.filter(item => {
      const ft = String(item?.filetype || '').toLowerCase();
      const u = String(item?.url || '').toLowerCase();
      // Still skip SVGs, but allow smaller images
      return !(ft.includes('svg') || u.includes('.svg'));
    });

    for (const item of relaxedResults) {
      const id = item?.id;
      const directUrl = item?.url;

      const candidates = [
        id ? `https://api.openverse.org/v1/images/${id}/thumb/?full_size=true&compressed=true&watermarked=false` : null,
        id ? `https://api.openverse.org/v1/images/${id}/thumb/?full_size=true&compressed=true` : null,
        directUrl
      ].filter(Boolean);

      for (const candidate of candidates) {
        const base = normalizeUrl(candidate);
        const used = await isImageBaseUrlUsed(base);
        if (used) continue;

        // Validate the URL actually works
        const isValid = await validateImageUrl(candidate);
        if (isValid) return candidate;
      }
    }

    return null;
  } catch (err) {
    console.error('Error fetching Openverse image:', err.message);
    return null;
  }
}

// Decide which provider to use based on category; fallback between them
const DIFFICULT_CATEGORY_KEYWORDS = new Set([
  'entertainment',
  'gaming', 'games', 'game',
  'movies', 'movie', 'film', 'films', 'cinema', 'tv', 'television',
  'books', 'book', 'literature', 'novel', 'novels',
  'anime', 'manga', 'comics', 'comic', 'cartoon',
]);

function shouldPreferOpenverse(categorySlug = '') {
  const slug = String(categorySlug || '').toLowerCase();
  if (!slug) return false;
  if (config.openverse?.preferFor?.includes(slug)) return true;
  for (const key of DIFFICULT_CATEGORY_KEYWORDS) {
    if (slug.includes(key)) return true;
  }
  return false;
}

// Helper to extract key terms from complex queries
function simplifyQuery(query, categorySlug = '') {
  const original = String(query || '').trim();
  if (!original) return [''];

  // Extract key terms and create fallback queries
  const fallbacks = [original];

  // Remove common article words and try again
  const simplified = original
    .replace(/\b(the|best|top|guide|to|for|of|in|on|with|how|what|why|when|where)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (simplified && simplified !== original) {
    fallbacks.push(simplified);
  }

  // Extract main nouns (simple heuristic)
  const words = original.toLowerCase().split(/\s+/);
  const keyWords = words.filter(word =>
    word.length > 3 &&
    !['best', 'top', 'guide', 'how', 'what', 'why', 'when', 'where', 'the', 'for', 'with', 'and', 'but', 'this', 'that', 'year', 'new', 'old'].includes(word)
  );

  if (keyWords.length > 0) {
    fallbacks.push(keyWords[0]); // First key word
    if (keyWords.length > 1) {
      fallbacks.push(keyWords.slice(0, 2).join(' ')); // First two key words
    }
  }

  // Add category-based fallback terms
  const categoryFallbacks = {
    'technology': ['technology', 'computer', 'digital'],
    'entertainment': ['entertainment', 'media', 'fun'],
    'gaming': ['games', 'gaming', 'video game'],
    'games': ['games', 'gaming', 'video game'],
    'movies': ['movies', 'cinema', 'film'],
    'films': ['movies', 'cinema', 'film'],
    'books': ['books', 'reading', 'literature'],
    'anime': ['anime', 'animation', 'cartoon'],
    'finance': ['finance', 'money', 'business'],
    'business': ['business', 'office', 'corporate'],
    'health': ['health', 'medical', 'wellness'],
    'travel': ['travel', 'vacation', 'tourism'],
    'sports': ['sports', 'athletics', 'fitness'],
    'education': ['education', 'learning', 'school'],
    'science': ['science', 'research', 'laboratory']
  };

  const category = String(categorySlug || '').toLowerCase();
  if (categoryFallbacks[category]) {
    fallbacks.push(...categoryFallbacks[category]);
  }

  // Generic fallbacks as last resort
  fallbacks.push('abstract', 'background', 'pattern');

  return [...new Set(fallbacks)]; // Remove duplicates
}

export async function fetchBestImageUrl(query_param, categorySlug) {
  const strategy = (config.imageProvider || 'smart').toLowerCase();

  // Get fallback queries including category-based fallbacks
  const queries = simplifyQuery(query_param, categorySlug);

  for (const query of queries) {
    let result = null;

    if (strategy === 'unsplash') {
      result = await fetchUnsplashImageUrl(query);
    } else if (strategy === 'openverse') {
      result = await fetchOpenverseImageUrl(query);
    } else if (strategy === 'both') {
      // both: try both regardless of category
      result = await fetchUnsplashImageUrl(query);
      if (!result) result = await fetchOpenverseImageUrl(query);
    } else {
      // smart: category-based preference
      const preferOV = shouldPreferOpenverse(categorySlug);
      if (preferOV) {
        result = await fetchOpenverseImageUrl(query);
        if (!result) result = await fetchUnsplashImageUrl(query);
      } else {
        result = await fetchUnsplashImageUrl(query);
        if (!result) result = await fetchOpenverseImageUrl(query);
      }
    }

    if (result) return result;
  }

  return null;
}
