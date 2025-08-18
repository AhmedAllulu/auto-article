import express from 'express';
import { query } from '../db.js';
import { config } from '../config.js';
import { resolveLanguage } from '../utils/lang.js';
import { articlesTable } from '../utils/articlesTable.js';
import { autoTrackViews } from '../middleware/viewTracking.js';

const router = express.Router();

// Add view tracking middleware to all routes
router.use(autoTrackViews);

// (handlers documented below in OpenAPI section)

/**
 * @openapi
 * /articles/latest:
 *   get:
 *     tags: [Articles]
 *     summary: Get latest articles for the requested language with pagination
 *     parameters:
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 200
 *           default: 12
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: offset
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *     responses:
 *       '200':
 *         description: List of latest articles with pagination info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Article'
 *                 language:
 *                   type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 *       '500':
 *         description: Failed to load latest articles
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/latest', async (req, res) => {
  const language = resolveLanguage(req, config.languages);
  const rawLimit = Number(req.query.limit);
  const rawPage = Number(req.query.page);
  const rawOffset = Number(req.query.offset);
  
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(200, Math.trunc(rawLimit))) : 12;
  const page = Number.isFinite(rawPage) ? Math.max(1, Math.trunc(rawPage)) : 1;
  const offset = Number.isFinite(rawOffset) ? Math.max(0, Math.trunc(rawOffset)) : (page - 1) * limit;
  
  try {
    const tbl = articlesTable(language);
    
    // Get total count for pagination
    const countResult = await query(
      `SELECT COUNT(*) as total 
       FROM ${tbl} a 
       WHERE a.language_code = $1`,
      [language]
    );
    const total = parseInt(countResult.rows[0].total) || 0;
    
    // Get articles with pagination
    const result = await query(
      `SELECT 
         a.id,
         a.title,
         a.slug,
         a.summary,
         a.meta_description,
         a.image_url,
         a.language_code,
         a.category_id,
         a.reading_time_minutes,
         a.total_views,
         a.unique_views,
         a.trending_score,
         c.name AS category_name,
         c.slug AS category_slug,
         a.published_at,
         a.created_at
       FROM ${tbl} a
       LEFT JOIN categories c ON c.id = a.category_id
       WHERE a.language_code = $1
       ORDER BY COALESCE(a.published_at, a.created_at) DESC, a.id DESC
       LIMIT $2 OFFSET $3`,
      [language, limit, offset]
    );
    
    const pages = Math.ceil(total / limit);
    const hasNext = page < pages;
    const hasPrev = page > 1;
    
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
    console.error('[articles/latest] Error:', err);
    res.status(500).json({ error: 'Failed to load latest articles' });
  }
});

/**
 * @openapi
 * /articles/slug/{slug}:
 *   get:
 *     tags: [Articles]
 *     summary: Get an article by slug with language-aware matching
 *     parameters:
 *       - name: slug
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - $ref: '#/components/parameters/AcceptLanguage'
 *     responses:
 *       '200':
 *         description: Article
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Article'
 *                 language:
 *                   type: string
 *       '404':
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Failed to load article
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/slug/:slug', async (req, res) => {
  const language = resolveLanguage(req, config.languages);
  const rawSlug = String(req.params.slug || '').trim();
  if (!rawSlug) return res.status(400).json({ error: 'Invalid slug' });
  try {
    const langs = (config.languages || []).map((l) => String(l).toLowerCase());
    const suffixRe = new RegExp(`-(?:${langs.join('|')})$`, 'i');
    const base = rawSlug.replace(suffixRe, '');
    const preferred = language === 'en' ? base : `${base}-${language}`;
    const candidates = [];
    const seen = new Set();
    for (const s of [preferred, rawSlug, `${base}-en`, base]) {
      const v = String(s || '').trim();
      if (!v || seen.has(v)) continue;
      seen.add(v);
      candidates.push(v);
    }
    if (candidates.length === 0) return res.status(404).json({ error: 'Not found' });

    while (candidates.length < 4) candidates.push(candidates[candidates.length - 1]);
    const tblPreferred = articlesTable(language);
    // Search preferred language table first
    let result = await query(
      `SELECT a.*, c.name AS category_name, c.slug AS category_slug
       FROM ${tblPreferred} a
       LEFT JOIN categories c ON c.id = a.category_id
       WHERE a.slug = ANY($1)
       ORDER BY CASE a.slug
         WHEN $2 THEN 1
         WHEN $3 THEN 2
         WHEN $4 THEN 3
         WHEN $5 THEN 4
         ELSE 5 END
       LIMIT 1`,
      [candidates, candidates[0], candidates[1], candidates[2], candidates[3]]
    );
    // Fallback to other language tables if not found in preferred table
    if (result.rowCount === 0) {
      const languages = ['en', 'de', 'fr', 'es', 'pt', 'ar', 'hi'];
      for (const lang of languages) {
        if (lang === language) continue; // Skip preferred language table we already checked
        
        const fallbackTable = articlesTable(lang);
        try {
          result = await query(
            `SELECT a.*, c.name AS category_name, c.slug AS category_slug
             FROM ${fallbackTable} a
             LEFT JOIN categories c ON c.id = a.category_id
             WHERE a.slug = ANY($1)
             ORDER BY CASE a.slug
               WHEN $2 THEN 1
               WHEN $3 THEN 2
               WHEN $4 THEN 3
               WHEN $5 THEN 4
               ELSE 5 END
             LIMIT 1`,
            [candidates, candidates[0], candidates[1], candidates[2], candidates[3]]
          );
          if (result.rowCount > 0) break;
        } catch (err) {
          // Skip if table doesn't exist yet
          if (err.code !== '42P01') throw err;
        }
      }
    }
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    
    const article = result.rows[0];
    
    // Track article view
    if (res.trackView) {
      await res.trackView('article', {
        id: parseInt(article.id), // Ensure ID is integer
        slug: article.slug,
        language_code: article.language_code || language,
        category_id: parseInt(article.category_id) || null // Ensure category_id is integer
      });
    }
    
    res.set('Vary', 'Accept-Language');
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json({ data: article, language });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load article' });
  }
});
router.get('/:id/related', async (req, res) => {
  const language = resolveLanguage(req, config.languages);
  const id = req.params.id;
  try {
    const baseTbl = articlesTable(language);
    // For language-specific tables, we need to handle the language_code column differently
    const baseQuerySql = baseTbl === 'articles'
      ? `SELECT category_id, language_code, slug FROM ${baseTbl} WHERE id = $1`
      : `SELECT category_id, '${language}' AS language_code, slug FROM ${baseTbl} WHERE id = $1`;
    
    const baseRes = await query(baseQuerySql, [id]);
    if (baseRes.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    const { category_id, slug } = baseRes.rows[0];
    
    const relQuerySql = baseTbl === 'articles'
      ? `SELECT id, title, slug, summary, meta_description, image_url, language_code, published_at, created_at
         FROM ${baseTbl}
         WHERE category_id = $1 AND language_code = $2 AND id <> $3 AND slug <> $4
         ORDER BY COALESCE(published_at, created_at) DESC, id DESC
         LIMIT 10`
      : `SELECT id, title, slug, summary, meta_description, image_url, '${language}' AS language_code, published_at, created_at
         FROM ${baseTbl}
         WHERE category_id = $1 AND id <> $2 AND slug <> $3
         ORDER BY COALESCE(published_at, created_at) DESC, id DESC
         LIMIT 10`;
    
    const relParams = baseTbl === 'articles' ? [category_id, language, id, slug] : [category_id, id, slug];
    const rel = await query(relQuerySql, relParams);
    res.set('Vary', 'Accept-Language');
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json({ data: rel.rows, language });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load related articles' });
  }
});

export default router;


