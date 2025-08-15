import express from 'express';
import { query, withTransaction } from '../db.js';
import { createMasterArticle, createHowToArticle, insertArticle, updateDailyTokenUsage, incrementJobCount } from '../services/generation.js';

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

/**
 * @openapi
 * /generate/how-to:
 *   post:
 *     tags: [Generation]
 *     summary: Generate a practical how-to guide article without web search.
 *     description: Creates step-by-step tutorial articles with troubleshooting sections, safety tips, and practical instructions for solving real problems.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categorySlug:
 *                 type: string
 *                 description: Optional slug of category to generate how-to article for. Defaults to first category.
 *                 example: "technology"
 *     responses:
 *       '200':
 *         description: Generated how-to article
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Article'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       example: "how-to"
 *                     difficulty:
 *                       type: string
 *                       example: "Beginner"
 *                     timeRequired:
 *                       type: string
 *                       example: "30 minutes"
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
router.post('/how-to', async (req, res) => {
  try {
    const { categorySlug } = req.body || {};
    // Load category – default to highest-priority first one if not specified
    const catQuery = categorySlug
      ? await query('SELECT id, name, slug FROM categories WHERE slug = $1 LIMIT 1', [categorySlug])
      : await query('SELECT id, name, slug FROM categories ORDER BY id ASC LIMIT 1');

    if (catQuery.rowCount === 0) return res.status(404).json({ error: 'Category not found' });
    const category = catQuery.rows[0];

    const { howToArticle } = await createHowToArticle(category, { preferWebSearch: false });

    await withTransaction(async (client) => {
      await insertArticle(client, howToArticle);
      await updateDailyTokenUsage(client, [{
        prompt_tokens: howToArticle.ai_tokens_input,
        completion_tokens: howToArticle.ai_tokens_output,
      }]);
      await incrementJobCount(client, 1);
    });

    res.json({ 
      data: howToArticle,
      meta: {
        type: "how-to",
        category: category.name,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('manual how-to generation failed', err);
    res.status(500).json({ error: 'How-to generation failed' });
  }
});

/**
 * @openapi
 * /generate/translate:
 *   post:
 *     tags: [Generation]
 *     summary: Generate a translation of an existing English article.
 *     description: Creates a translated version of an existing master or how-to article into the specified language.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [slug, language]
 *             properties:
 *               slug:
 *                 type: string
 *                 description: Slug of the English article to translate.
 *                 example: "how-to-fix-computer-wont-start-troubleshooting-guide"
 *               language:
 *                 type: string
 *                 description: Target language code (e.g., de, fr, es).
 *                 example: "de"
 *     responses:
 *       '200':
 *         description: Translated article
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Article'
 *       '404':
 *         description: Article not found / category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '409':
 *         description: Translation already exists
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
router.post('/translate', async (req, res) => {
  try {
    const { slug, language } = req.body || {};
    if (!slug || !language) {
      return res.status(400).json({ error: 'slug and language are required' });
    }

    // Fetch the base (English) article
    const artRes = await query(
      `SELECT a.*, c.id AS category_id, c.name AS category_name, c.slug AS category_slug
       FROM articles a
       LEFT JOIN categories c ON c.id = a.category_id
       WHERE a.slug = $1 AND a.language_code = 'en' LIMIT 1`,
      [slug]
    );
    if (artRes.rowCount === 0) return res.status(404).json({ error: 'Article not found' });
    const baseArticle = artRes.rows[0];

    // Check if translation already exists
    const existsRes = await query(
      `SELECT 1 FROM articles WHERE slug LIKE $1 || '-%' AND language_code = $2 LIMIT 1`,
      [slug, language]
    );
    if (existsRes.rowCount > 0) {
      return res.status(409).json({ error: 'Translation already exists for this language' });
    }

    const category = {
      id: baseArticle.category_id,
      name: baseArticle.category_name,
      slug: baseArticle.category_slug,
    };

    // Re-extract structured JSON from existing HTML
    const { extractFromNaturalText } = await import('../services/generation.js');
    const masterJson = extractFromNaturalText(baseArticle.content, category.name);
    // Ensure we keep the original English title & meta if extraction missed them (HTML lacks h1)
    if (!masterJson.title || /Complete Guide/i.test(masterJson.title)) {
      masterJson.title = baseArticle.title;
    }
    if (!masterJson.metaDescription && baseArticle.meta_description) {
      masterJson.metaDescription = baseArticle.meta_description;
    }

    const { generateTranslationArticle } = await import('../services/generation.js');
    const tArticle = await generateTranslationArticle({
      lang: language,
      category,
      masterJson,
      slugBase: baseArticle.slug,
      title: baseArticle.title,
      summary: baseArticle.summary,
      imageUrl: baseArticle.image_url,
    });

    await withTransaction(async (client) => {
      await insertArticle(client, tArticle);
      await updateDailyTokenUsage(client, [{
        prompt_tokens: tArticle.ai_tokens_input,
        completion_tokens: tArticle.ai_tokens_output,
      }]);
    });

    res.json({ data: tArticle });
  } catch (err) {
    console.error('manual translate generation failed', err);
    res.status(500).json({ error: 'Translation generation failed' });
  }
});

export default router;
