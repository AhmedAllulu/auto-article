import express from 'express';
import { query } from '../db.js';
import { config } from '../config.js';
import { resolveLanguage } from '../utils/lang.js';

const router = express.Router();

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
 *               $ref: '#/components/schemas/ApiResponseArticleList'
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
  try {
    const result = await query(
      `SELECT id, title, slug, summary, image_url, language_code, meta_title, meta_description, created_at
       FROM articles WHERE category_id = $1 AND language_code = $2
       ORDER BY created_at DESC LIMIT 200`,
      [id, language]
    );
    res.json({ data: result.rows, language });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load articles' });
  }
});

export default router;


