import axios from 'axios';
import { config } from '../config.js';

export async function fetchUnsplashImageUrl(query) {
  if (!config.unsplash.accessKey) return null;
  try {
    const resp = await axios.get('https://api.unsplash.com/search/photos', {
      params: { query, per_page: 1, orientation: 'landscape' },
      headers: { Authorization: `Client-ID ${config.unsplash.accessKey}` },
      timeout: 10000,
    });
    const results = resp?.data?.results || [];
    if (results.length === 0) return null;
    const first = results[0];
    return first?.urls?.regular || first?.urls?.full || null;
  } catch (err) {
    return null;
  }
}


