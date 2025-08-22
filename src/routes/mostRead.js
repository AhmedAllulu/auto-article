import express from 'express';
import { query } from '../db.js';
import { resolveLanguage } from '../utils/lang.js';
import { config } from '../config.js';
import { articlesTable } from '../utils/articlesTable.js';
import { computeEtag, setCacheHeaders, handleConditionalGet } from '../utils/httpCache.js';

const router = express.Router();

/**
 * @openapi
 * /most-read:
 *   get:
 *     tags: [Most Read]
 *     summary: Get most read articles for homepage
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 6
 *         description: Number of articles to return
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, all_time]
 *           default: week
 *         description: Time period for most read
 *     responses:
 *       '200':
 *         description: Most read articles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       slug:
 *                         type: string
 *                       summary:
 *                         type: string
 *                       image_url:
 *                         type: string
 *                       total_views:
 *                         type: integer
 *                       unique_views:
 *                         type: integer
 *                       category_name:
 *                         type: string
 *                       category_slug:
 *                         type: string
 *                       published_at:
 *                         type: string
 *                       reading_time_minutes:
 *                         type: integer
 *                 language:
 *                   type: string
 *                 period:
 *                   type: string
 *       '500':
 *         description: Failed to load most read articles
 */
router.get('/', async (req, res) => {
  try {
    const language = resolveLanguage(req, config.languages);
    const limit = Math.min(parseInt(req.query.limit) || 6, 20); // Max 20 articles
    const period = req.query.period || 'week';
    
    console.log(`[most-read] Requested language: ${language}, period: ${period}, limit: ${limit}`);
    
    const tableName = articlesTable(language);
    
    // Get most read articles based on total_views
    // If no views yet, fall back to recent articles
    const result = await query(`
      SELECT 
        a.id,
        a.title,
        a.slug,
        a.summary,
        a.meta_description,
        a.image_url,
        a.total_views,
        a.unique_views,
        a.trending_score,
        a.reading_time_minutes,
        a.published_at,
        a.created_at,
        c.name AS category_name,
        c.slug AS category_slug
      FROM ${tableName} a
      LEFT JOIN categories c ON c.id = a.category_id
      WHERE a.published_at IS NOT NULL
      ORDER BY 
        CASE 
          WHEN a.total_views > 0 THEN a.total_views 
          ELSE 0 
        END DESC,
        a.trending_score DESC,
        a.published_at DESC
      LIMIT $1
    `, [limit]);
    
    // If we don't have enough articles with views, get recent popular ones
    let articles = result.rows;
    
    if (articles.length < limit) {
      // Build parameterized query for excluded IDs
      const excludedIds = articles.map(a => a.id);
      let additionalQuery = `
        SELECT 
          a.id,
          a.title,
          a.slug,
          a.summary,
          a.meta_description,
          a.image_url,
          a.total_views,
          a.unique_views,
          a.trending_score,
          a.reading_time_minutes,
          a.published_at,
          a.created_at,
          c.name AS category_name,
          c.slug AS category_slug
        FROM ${tableName} a
        LEFT JOIN categories c ON c.id = a.category_id
        WHERE a.published_at IS NOT NULL`;
      
      const queryParams = [limit - articles.length];
      
      if (excludedIds.length > 0) {
        const placeholders = excludedIds.map((_, index) => `$${index + 2}`).join(',');
        additionalQuery += ` AND a.id NOT IN (${placeholders})`;
        queryParams.push(...excludedIds);
      }
      
      additionalQuery += ` ORDER BY a.published_at DESC LIMIT $1`;
      
      const additionalResult = await query(additionalQuery, queryParams);
      articles = [...articles, ...additionalResult.rows];
    }
    
    // Add view tracking info
    const enrichedArticles = articles.map(article => ({
      ...article,
      total_views: parseInt(article.total_views) || 0,
      unique_views: parseInt(article.unique_views) || 0,
      trending_score: parseFloat(article.trending_score) || 0,
      is_trending: (article.total_views || 0) > 10 && (article.trending_score || 0) > 1
    }));
    
    console.log(`[most-read] Found ${enrichedArticles.length} articles for language: ${language}`);
    
    const payload = {
      data: enrichedArticles,
      language,
      period,
      total: enrichedArticles.length
    };
    const etag = computeEtag(payload, `most-read|${language}|limit:${limit}|period:${period}`);
    const lastModified = Date.now();
    setCacheHeaders(res, { maxAge: 300, swr: 600, vary: ['Accept-Language'], etag, lastModified });
    if (handleConditionalGet(req, res, { etag, lastModified })) return;
    res.json(payload);
    
  } catch (err) {
    console.error('[most-read] Error:', err);
    res.status(500).json({ error: 'Failed to load most read articles' });
  }
});

/**
 * @openapi
 * /most-read/by-category:
 *   get:
 *     tags: [Most Read]
 *     summary: Get most read articles grouped by category
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 3
 *         description: Number of articles per category
 *       - in: query
 *         name: categories
 *         schema:
 *           type: integer
 *           default: 4
 *         description: Number of categories to return
 *     responses:
 *       '200':
 *         description: Most read articles by category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category_id:
 *                         type: integer
 *                       category_name:
 *                         type: string
 *                       category_slug:
 *                         type: string
 *                       articles:
 *                         type: array
 *       '500':
 *         description: Failed to load articles by category
 */
router.get('/by-category', async (req, res) => {
  try {
    const language = resolveLanguage(req, config.languages);
    const articlesPerCategory = Math.min(parseInt(req.query.limit) || 3, 10);
    const maxCategories = Math.min(parseInt(req.query.categories) || 4, 10);
    
    const tableName = articlesTable(language);
    
    const result = await query(`
      SELECT 
        c.id as category_id,
        c.name as category_name,
        c.slug as category_slug,
        c.total_views as category_views,
        json_agg(
          json_build_object(
            'id', a.id,
            'title', a.title,
            'slug', a.slug,
            'summary', a.summary,
            'image_url', a.image_url,
            'total_views', a.total_views,
            'unique_views', a.unique_views,
            'published_at', a.published_at,
            'reading_time_minutes', a.reading_time_minutes
          ) ORDER BY a.total_views DESC, a.published_at DESC
        ) as articles
      FROM categories c
      LEFT JOIN LATERAL (
        SELECT * FROM ${tableName} 
        WHERE category_id = c.id 
          AND published_at IS NOT NULL
        ORDER BY 
          CASE WHEN total_views > 0 THEN total_views ELSE 0 END DESC,
          published_at DESC
        LIMIT $1
      ) a ON true
      WHERE a.id IS NOT NULL
      GROUP BY c.id, c.name, c.slug, c.total_views
      ORDER BY c.total_views DESC, c.name ASC
      LIMIT $2
    `, [articlesPerCategory, maxCategories]);
    
    const payload = {
      data: result.rows,
      language,
      articlesPerCategory,
      totalCategories: result.rows.length
    };
    const etag = computeEtag(payload, `most-read-by-category|${language}|limit:${articlesPerCategory}|max:${maxCategories}`);
    const lastModified = Date.now();
    setCacheHeaders(res, { maxAge: 300, swr: 600, vary: ['Accept-Language'], etag, lastModified });
    if (handleConditionalGet(req, res, { etag, lastModified })) return;
    res.json(payload);
    
  } catch (err) {
    console.error('[most-read] By category error:', err);
    res.status(500).json({ error: 'Failed to load articles by category' });
  }
});

/**
 * @openapi
 * /most-read/trending:
 *   get:
 *     tags: [Most Read]
 *     summary: Get trending articles (high recent activity)
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of trending articles
 *     responses:
 *       '200':
 *         description: Trending articles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *       '500':
 *         description: Failed to load trending articles
 */
router.get('/trending', async (req, res) => {
  try {
    const language = resolveLanguage(req, config.languages);
    const limit = Math.min(parseInt(req.query.limit) || 5, 15);
    
    const tableName = articlesTable(language);
    
    const result = await query(`
      SELECT 
        a.id,
        a.title,
        a.slug,
        a.summary,
        a.image_url,
        a.total_views,
        a.unique_views,
        a.trending_score,
        a.reading_time_minutes,
        a.published_at,
        c.name AS category_name,
        c.slug AS category_slug
      FROM ${tableName} a
      LEFT JOIN categories c ON c.id = a.category_id
      WHERE a.published_at IS NOT NULL
        AND a.trending_score > 0
      ORDER BY a.trending_score DESC, a.total_views DESC
      LIMIT $1
    `, [limit]);
    
    res.set('Vary', 'Accept-Language');
    res.set('Cache-Control', 'public, max-age=180, stale-while-revalidate=300'); // 3 min cache
    res.json({ 
      data: result.rows, 
      language,
      total: result.rows.length
    });
    
  } catch (err) {
    console.error('[most-read] Trending error:', err);
    res.status(500).json({ error: 'Failed to load trending articles' });
  }
});

export default router;
