import axios from 'axios';
import { config } from '../config.js';
import { query } from '../db.js';

// Check if an image URL already exists in the database
async function isImageUrlUsed(imageUrl) {
  if (!imageUrl) return false;
  try {
    const result = await query(
      'SELECT 1 FROM articles WHERE image_url = $1 LIMIT 1',
      [imageUrl]
    );
    return result.rows.length > 0;
  } catch (err) {
    console.error('Error checking image URL:', err);
    return false; // In case of error, assume not used to avoid blocking
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
        const isUsed = await isImageUrlUsed(imageUrl);
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


