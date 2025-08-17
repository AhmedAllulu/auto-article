import express from 'express';
import { query } from '../db.js';
import { config } from '../config.js';
import { resolveLanguage } from '../utils/lang.js';
import { articlesTable } from '../utils/articlesTable.js';

const router = express.Router();

// (handlers documented below in OpenAPI section)

/**
 * @openapi
 * /articles/latest:
 *   get:
 *     tags: [Articles]
 *     summary: Get latest articles for the requested language
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
 *     responses:
 *       '200':
 *         description: List of latest articles
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponseArticleList'
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
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(200, Math.trunc(rawLimit))) : 12;
  try {
    const tbl = articlesTable(language);
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
         c.name AS category_name,
         c.slug AS category_slug,
         a.published_at,
         a.created_at
       FROM ${tbl} a
       LEFT JOIN categories c ON c.id = a.category_id
       WHERE a.language_code = $1
       ORDER BY COALESCE(a.published_at, a.created_at) DESC, a.id DESC
       LIMIT $2`,
      [language, limit]
    );
    res.set('Vary', 'Accept-Language');
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json({ data: result.rows, language });
  } catch (err) {
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
    // Fallback to unified table if not found
    if (result.rowCount === 0 && tblPreferred !== 'articles') {
      result = await query(
        `SELECT a.*, c.name AS category_name, c.slug AS category_slug
         FROM articles a
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
    }
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.set('Vary', 'Accept-Language');
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json({ data: result.rows[0], language });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load article' });
  }
});
router.get('/:id/related', async (req, res) => {
  const language = resolveLanguage(req, config.languages);
  const id = req.params.id;
  try {
    const baseTbl = articlesTable(language);
    const baseRes = await query(
      `SELECT category_id, language_code, slug FROM ${baseTbl} WHERE id = $1`,
      [id]
    );
    if (baseRes.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    const { category_id, slug } = baseRes.rows[0];
    const rel = await query(
      `SELECT id, title, slug, summary, meta_description, image_url, language_code, published_at, created_at
       FROM ${baseTbl}
       WHERE category_id = $1 AND language_code = $2 AND id <> $3 AND slug <> $4
       ORDER BY COALESCE(published_at, created_at) DESC, id DESC
       LIMIT 10`,
      [category_id, language, id, slug]
    );
    res.set('Vary', 'Accept-Language');
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json({ data: rel.rows, language });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load related articles' });
  }
});

export default router;


