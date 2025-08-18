import express from 'express';
import { query } from '../db.js';
import { config } from '../config.js';
import { resolveLanguage } from '../utils/lang.js';
import { articlesTable } from '../utils/articlesTable.js';
import { autoTrackViews } from '../middleware/viewTracking.js';

const router = express.Router();

// Add view tracking middleware to all routes
router.use(autoTrackViews);

/**
 * @openapi
 * /categories:
 *   get:
 *     tags: [Categories]
 *     summary: List categories that have articles in the requested language
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     responses:
 *       '200':
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponseCategoryList'
 *       '500':
 *         description: Failed to load categories
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', async (req, res) => {
  try {
    const language = resolveLanguage(req, config.languages);
    console.log(`[categories] Requested language: ${language}`);
    
    const tbl = articlesTable(language);
    const result = await query(
      `SELECT 
         c.id,
         COALESCE(ct_lang.name, ct_en.name, c.name) AS name,
         c.slug
       FROM categories c
       LEFT JOIN category_translations ct_lang
         ON ct_lang.category_id = c.id AND ct_lang.language_code = $1
       LEFT JOIN category_translations ct_en
         ON ct_en.category_id = c.id AND ct_en.language_code = 'en'
       ORDER BY name ASC`,
      [language]
    );
    
    console.log(`[categories] Found ${result.rows.length} categories for language: ${language}`);
    res.set('Vary', 'Accept-Language');
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json({ data: result.rows, language });
  } catch (err) {
    console.error('[categories] Error:', err);
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

/**
 * @openapi
 * /categories/{id}/articles:
 *   get:
 *     tags: [Categories]
 *     summary: List recent articles for a category in the requested language
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     responses:
 *       '200':
 *         description: List of articles
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponseArticleFullList'
 *       '400':
 *         description: Invalid id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Failed to load articles
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id/articles', async (req, res) => {
  const language = resolveLanguage(req, config.languages);
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });
  
  // Pagination parameters
  const rawLimit = Number(req.query.limit);
  const rawPage = Number(req.query.page);
  const rawOffset = Number(req.query.offset);
  
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(200, Math.trunc(rawLimit))) : 20;
  const page = Number.isFinite(rawPage) ? Math.max(1, Math.trunc(rawPage)) : 1;
  const offset = Number.isFinite(rawOffset) ? Math.max(0, Math.trunc(rawOffset)) : (page - 1) * limit;
  
  try {
    const tbl = articlesTable(language);
    
    // Get total count for pagination
    const countSql = tbl === 'articles'
      ? `SELECT COUNT(*) as total FROM ${tbl} WHERE category_id = $1 AND language_code = $2`
      : `SELECT COUNT(*) as total FROM ${tbl} WHERE category_id = $1`;
    
    const countParams = tbl === 'articles' ? [id, language] : [id];
    const countResult = await query(countSql, countParams);
    const total = parseInt(countResult.rows[0].total) || 0;
    
    // For language-specific tables, we don't need to filter by language_code
    const querySql = tbl === 'articles'
      ? `SELECT 
           id,
           title,
           slug,
           content,
           summary,
           image_url,
           language_code,
           meta_title,
           meta_description,
           canonical_url,
           reading_time_minutes,
           total_views,
           unique_views,
           trending_score,
           ai_model,
           ai_prompt,
           ai_tokens_input,
           ai_tokens_output,
           total_tokens,
           source_url,
           content_hash,
           category_id,
           published_at,
           created_at
         FROM ${tbl} 
         WHERE category_id = $1 AND language_code = $2
         ORDER BY COALESCE(published_at, created_at) DESC 
         LIMIT $3 OFFSET $4`
      : `SELECT 
           id,
           title,
           slug,
           content,
           summary,
           image_url,
           '${language}' AS language_code,
           meta_title,
           meta_description,
           canonical_url,
           reading_time_minutes,
           total_views,
           unique_views,
           trending_score,
           ai_model,
           ai_prompt,
           ai_tokens_input,
           ai_tokens_output,
           total_tokens,
           source_url,
           content_hash,
           category_id,
           published_at,
           created_at
         FROM ${tbl} 
         WHERE category_id = $1
         ORDER BY COALESCE(published_at, created_at) DESC 
         LIMIT $2 OFFSET $3`;
    
    const queryParams = tbl === 'articles' ? [id, language, limit, offset] : [id, limit, offset];
    const result = await query(querySql, queryParams);
    
    const pages = Math.ceil(total / limit);
    const hasNext = page < pages;
    const hasPrev = page > 1;
    
    // Track category view when viewing category articles
    if (res.trackView && result.rows.length > 0) {
      // Get category info for tracking
      const categoryResult = await query('SELECT id, name, slug FROM categories WHERE id = $1', [id]);
      if (categoryResult.rows.length > 0) {
        await res.trackView('category', {
          id: categoryResult.rows[0].id,
          slug: categoryResult.rows[0].slug,
          name: categoryResult.rows[0].name
        });
      }
    }
    
    res.set('Vary', 'Accept-Language');
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json({ 
      data: result.rows, 
      language,
      pagination: {
        page,
        limit,
        offset,
        total,
        pages,
        hasNext,
        hasPrev
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load articles' });
  }
});

export default router;


