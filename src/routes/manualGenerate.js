import express from 'express';
import { query, withTransaction } from '../db.js';
import { createMasterArticle, insertArticle, updateDailyTokenUsage, incrementJobCount } from '../services/generation.js';

const router = express.Router();

/**
 * @openapi
 * /generate/master:
 *   post:
 *     tags: [Generation]
 *     summary: Generate a single master article using web search.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categorySlug:
 *                 type: string
 *                 description: Optional slug of category to generate for. Defaults to first category.
 *     responses:
 *       '200':
 *         description: Generated master article
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Article'
 *       '404':
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Generation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/master', async (req, res) => {
  try {
    const { categorySlug } = req.body || {};
    // Load category – default to highest-priority first one if not specified
    const catQuery = categorySlug
      ? await query('SELECT id, name, slug FROM categories WHERE slug = $1 LIMIT 1', [categorySlug])
      : await query('SELECT id, name, slug FROM categories ORDER BY id ASC LIMIT 1');

    if (catQuery.rowCount === 0) return res.status(404).json({ error: 'Category not found' });
    const category = catQuery.rows[0];

    const { masterArticle } = await createMasterArticle(category, { preferWebSearch: true });

    await withTransaction(async (client) => {
      await insertArticle(client, masterArticle);
      await updateDailyTokenUsage(client, [{
        prompt_tokens: masterArticle.ai_tokens_input,
        completion_tokens: masterArticle.ai_tokens_output,
      }]);
      await incrementJobCount(client, 1);
    });

    res.json({ data: masterArticle });
  } catch (err) {
    console.error('manual master generation failed', err);
    res.status(500).json({ error: 'Generation failed' });
  }
});

/**
 * @openapi
 * /generate/master-no-search:
 *   post:
 *     tags: [Generation]
 *     summary: Generate a single master article without web search (faster / cheaper).
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categorySlug:
 *                 type: string
 *                 description: Optional slug of category to generate for. Defaults to first category.
 *     responses:
 *       '200':
 *         description: Generated master article
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Article'
 *       '404':
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Generation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/master-no-search', async (req, res) => {
  try {
    const { categorySlug } = req.body || {};
    const catQuery = categorySlug
      ? await query('SELECT id, name, slug FROM categories WHERE slug = $1 LIMIT 1', [categorySlug])
      : await query('SELECT id, name, slug FROM categories ORDER BY id ASC LIMIT 1');

    if (catQuery.rowCount === 0) return res.status(404).json({ error: 'Category not found' });
    const category = catQuery.rows[0];

    const { masterArticle } = await createMasterArticle(category, { preferWebSearch: false });

    await withTransaction(async (client) => {
      await insertArticle(client, masterArticle);
      await updateDailyTokenUsage(client, [{
        prompt_tokens: masterArticle.ai_tokens_input,
        completion_tokens: masterArticle.ai_tokens_output,
      }]);
      await incrementJobCount(client, 1);
    });

    res.json({ data: masterArticle });
  } catch (err) {
    console.error('manual master generation failed (no-search)', err);
    res.status(500).json({ error: 'Generation failed' });
  }
});

export default router;
