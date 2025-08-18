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
          return imageUrl;
        }
      }
    }

    // If all images are already used, return the first one as fallback
    // This prevents the system from breaking if all fetched images are duplicates
    const fallbackPhoto = results[0];
    return fallbackPhoto?.urls?.regular || fallbackPhoto?.urls?.full || null;
  } catch (err) {
    console.error('Error fetching Unsplash image:', err);
    return null;
  }
}


