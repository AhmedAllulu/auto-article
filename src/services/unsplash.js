import axios from 'axios';
import { config } from '../config.js';
import { query } from '../db.js';

// Normalize URL by stripping query parameters (anything after '?')
function normalizeUrl(url = '') {
  return url.split('?')[0];
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


