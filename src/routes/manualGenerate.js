import express from 'express';
import { query, withTransaction } from '../db.js';
import { createMasterArticle, insertArticle, updateDailyTokenUsage, incrementJobCount } from '../services/generation.js';
import { articlesTable } from '../utils/articlesTable.js';

const router = express.Router();

/**
 * @openapi
 * /generate/article:
 *   post:
 *     tags: [Generation]
 *     summary: Generate an article for any category.
 *     description: Generate an article for the selected category. The system will randomly choose from available prompt templates in that category's file.
 *     parameters:
 *       - in: query
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [
 *             "technology", "business-finance", "health-wellness", "sports-fitness",
 *             "entertainment-celebrities", "travel-destinations", "careers-job-search",
 *             "food-recipes", "science-innovation", "education-learning", "home-garden",
 *             "parenting-family", "lifestyle-hobbies", "arts-culture", "history-heritage",
 *             "fashion-beauty", "real-estate-property", "automotive-vehicles",
 *             "environment-sustainability", "pets-animals", "diy-crafts",
 *             "relationships-dating", "productivity-self-improvement",
 *             "politics-current-affairs", "movies-tv-shows", "music-performing-arts",
 *             "books-literature", "gaming-esports", "technology-how-tos",
 *             "finance-tips-investments"
 *           ]
 *         description: Category to generate article for (system will randomly select prompt template)
 *         example: "technology"
 *       - in: query
 *         name: preferWebSearch
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Use web search to improve freshness (where supported)
 *     responses:
 *       '200':
 *         description: Generated article
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Article'
 *       '400':
 *         description: Invalid parameters
 *       '404':
 *         description: Category not found
 *       '500':
 *         description: Generation failed
 */
router.post('/article', async (req, res) => {
  try {
    const categorySlug = req.query.category || req.body?.category;
    const preferWebSearchRaw = req.query.preferWebSearch ?? req.body?.preferWebSearch ?? false;
    const preferWebSearch = String(preferWebSearchRaw).toLowerCase() === 'true';
    
    if (!categorySlug) {
      return res.status(400).json({ error: 'category is required' });
    }

    // Resolve category
    const catRes = await query('SELECT id, name, slug FROM categories WHERE slug = $1 LIMIT 1', [categorySlug]);
    if (catRes.rowCount === 0) return res.status(404).json({ error: 'Category not found' });
    const categoryObj = catRes.rows[0];

    // Use createMasterArticle which now uses the category-based prompt system
    // The prompt system will randomly select from all available templates in that category
    const { masterArticle } = await createMasterArticle(categoryObj, { preferWebSearch: Boolean(preferWebSearch) });

    // Insert article & token usage
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
    console.error('[generate/article] generation failed', err);
    res.status(500).json({ error: 'Generation failed' });
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
    const transTbl = articlesTable(language);
    const existsRes = await query(
      `SELECT 1 FROM ${transTbl} WHERE slug LIKE $1 || '-%' AND language_code = $2 LIMIT 1`,
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
