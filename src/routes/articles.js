import express from 'express';
import { query } from '../db.js';
import { config } from '../config.js';
import { resolveLanguage } from '../utils/lang.js';

const router = express.Router();

/**
 * @openapi
 * /articles/{id}/related:
 *   get:
 *     summary: Get related articles for the given article id
 *     tags:
 *       - Articles
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: header
 *         name: Accept-Language
 *         required: false
 *         description: Preferred language code, e.g., en, es
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of related article summaries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ArticleSummary'
 *                 language:
 *                   type: string
 *       404:
 *         description: Not found
 *       500:
 *         description: Failed to load related articles
 */
router.get('/:id/related', async (req, res) => {
  const language = resolveLanguage(req, config.languages);
  const id = req.params.id;
  try {
    const baseRes = await query(
      'SELECT category_id, language_code FROM articles WHERE id = $1',
      [id]
    );
    if (baseRes.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    const { category_id } = baseRes.rows[0];
    const rel = await query(
      `SELECT id, title, slug, summary, image_url, language_code, created_at
       FROM articles
       WHERE category_id = $1 AND language_code = $2 AND id <> $3
       ORDER BY created_at DESC LIMIT 10`,
      [category_id, language, id]
    );
    res.json({ data: rel.rows, language });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load related articles' });
  }
});

export default router;


