import express from 'express';
import { query, withTransaction } from '../db.js';
import { createMasterArticle, insertArticle, updateDailyTokenUsage, incrementJobCount } from '../services/generation.js';
import { articlesTable } from '../utils/articlesTable.js';
import {
  AppError,
  ErrorTypes,
  validateRequired,
  withDatabaseErrorHandling,
  withApiErrorHandling
} from '../services/errorHandler.js';
import { genLog } from '../services/logger.js';

const router = express.Router();

/**
 * @openapi
 * /generate/article:
 *   post:
 *     tags: [Generation]
 *     summary: Generate a single article for a specific category (Manual - Bypasses Time Restrictions)
 *     description: |
 *       Creates a new article in the specified category using AI generation.
 *
 *       **IMPORTANT**: This manual endpoint bypasses all time-based restrictions and can be used at any time.
 *       - Generates content in English and stores it in the articles_en table
 *       - Respects daily quotas (max 2 English articles per category per day)
 *       - Can be triggered through Swagger UI regardless of optimal timing windows
 *       - Accepts category either as query parameter or in request body
 *     parameters:
 *       - in: query
 *         name: category
 *         required: false
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
 *         description: Category slug for article generation (alternative to request body)
 *         example: "technology"
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerationRequest'
 *     responses:
 *       '200':
 *         description: Article generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponseSingleArticle'
 *       '400':
 *         description: Invalid parameters - category is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
router.post('/article', async (req, res) => {
  try {
    // MANUAL ENDPOINT: Bypasses all time-based restrictions
    genLog('🚀 Manual article generation started - BYPASSING TIME RESTRICTIONS', {
      endpoint: 'POST /generate/article',
      trigger: 'manual_swagger',
      bypassTiming: true,
      currentTime: new Date().toISOString()
    });

    // Validate input
    const categorySlug = req.query.category || req.body?.category;
    validateRequired({ category: categorySlug }, ['category'], 'article generation');

    // Resolve category with enhanced error handling
    const categoryObj = await withDatabaseErrorHandling(async () => {
      const catRes = await query('SELECT id, name, slug FROM categories WHERE slug = $1 LIMIT 1', [categorySlug]);
      if (catRes.rowCount === 0) {
        throw new AppError('Category not found', ErrorTypes.RESOURCE_NOT_FOUND, { categorySlug });
      }
      return catRes.rows[0];
    }, 'category lookup');

    // Generate article with enhanced error handling
    const { masterArticle } = await withApiErrorHandling(async () => {
      return await createMasterArticle(categoryObj, { preferWebSearch: false });
    }, 'article generation');

    // Insert article with enhanced transaction handling
    await withDatabaseErrorHandling(async () => {
      await withTransaction(async (client) => {
        await insertArticle(client, masterArticle);
        await updateDailyTokenUsage(client, [{
          prompt_tokens: masterArticle.ai_tokens_input,
          completion_tokens: masterArticle.ai_tokens_output,
        }]);
        await incrementJobCount(client, 1);
      });
    }, 'article insertion');

    res.json({ data: masterArticle });
  } catch (err) {
    if (err instanceof AppError) {
      const statusCode = err.type === ErrorTypes.VALIDATION_ERROR ? 400 :
                         err.type === ErrorTypes.RESOURCE_NOT_FOUND ? 404 : 500;
      return res.status(statusCode).json({
        error: err.message,
        type: err.type,
        context: err.context
      });
    }

    console.error('[generate/article] generation failed', err);
    res.status(500).json({ error: 'Generation failed', message: err.message });
  }
});

/**
 * @openapi
 * /generate/translate:
 *   post:
 *     tags: [Generation]
 *     summary: Generate a translation of an existing English article (Manual - Bypasses Time Restrictions)
 *     description: |
 *       Creates a translated version of an existing English article into the specified target language.
 *
 *       **IMPORTANT**: This manual endpoint bypasses all time-based restrictions and can be used at any time.
 *       - Translates existing English articles to target languages (de, fr, es, pt, ar, hi)
 *       - Preserves HTML structure and updates metadata appropriately
 *       - Can be triggered through Swagger UI regardless of optimal timing windows
 *       - Does not count toward English article quotas (translations are unlimited)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TranslationRequest'
 *     responses:
 *       '200':
 *         description: Translation generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponseSingleArticle'
 *       '400':
 *         description: Invalid parameters - slug and language are required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: English article not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '409':
 *         description: Translation already exists for this language
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Translation generation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/translate', async (req, res) => {
  try {
    // MANUAL ENDPOINT: Bypasses all time-based restrictions
    genLog('🚀 Manual translation started - BYPASSING TIME RESTRICTIONS', {
      endpoint: 'POST /generate/translate',
      trigger: 'manual_swagger',
      bypassTiming: true,
      currentTime: new Date().toISOString()
    });

    // Validate input
    const { slug, language } = req.body || {};
    validateRequired({ slug, language }, ['slug', 'language'], 'translation request');

    // Fetch the base (English) article with enhanced error handling
    const baseArticle = await withDatabaseErrorHandling(async () => {
      const artRes = await query(
        `SELECT a.*, c.id AS category_id, c.name AS category_name, c.slug AS category_slug
         FROM articles_en a
         LEFT JOIN categories c ON c.id = a.category_id
         WHERE a.slug = $1 LIMIT 1`,
        [slug]
      );
      if (artRes.rowCount === 0) {
        throw new AppError('English article not found', ErrorTypes.RESOURCE_NOT_FOUND, { slug });
      }
      return artRes.rows[0];
    }, 'base article lookup');

    // Check if translation already exists
    const translationExists = await withDatabaseErrorHandling(async () => {
      const transTbl = articlesTable(language);
      const existsQuerySql = transTbl === 'articles'
        ? `SELECT 1 FROM ${transTbl} WHERE slug LIKE $1 || '-%' AND language_code = $2 LIMIT 1`
        : `SELECT 1 FROM ${transTbl} WHERE slug LIKE $1 || '-%' LIMIT 1`;

      const existsParams = transTbl === 'articles' ? [slug, language] : [slug];
      const existsRes = await query(existsQuerySql, existsParams);
      return existsRes.rowCount > 0;
    }, 'translation existence check');

    if (translationExists) {
      throw new AppError(
        'Translation already exists for this language',
        ErrorTypes.VALIDATION_ERROR,
        { slug, language }
      );
    }

    const category = {
      id: baseArticle.category_id,
      name: baseArticle.category_name,
      slug: baseArticle.category_slug,
    };

    // Generate translation with enhanced error handling
    const { translationArticle: tArticle } = await withApiErrorHandling(async () => {
      const { generateTranslationArticle } = await import('../services/generation.js');
      const result = await generateTranslationArticle({
        lang: language,
        category,
        masterSlug: baseArticle.slug,
        masterTitle: baseArticle.title,
        masterSummary: baseArticle.summary,
        imageUrl: baseArticle.image_url,
      });
      return result;
    }, 'translation generation');

    // Insert translation with enhanced transaction handling
    await withDatabaseErrorHandling(async () => {
      await withTransaction(async (client) => {
        await insertArticle(client, tArticle);
        await updateDailyTokenUsage(client, [{
          prompt_tokens: tArticle.ai_tokens_input,
          completion_tokens: tArticle.ai_tokens_output,
        }]);
      });
    }, 'translation insertion');

    res.json({ data: tArticle });
  } catch (err) {
    if (err instanceof AppError) {
      const statusCode = err.type === ErrorTypes.VALIDATION_ERROR ?
                         (err.message.includes('already exists') ? 409 : 400) :
                         err.type === ErrorTypes.RESOURCE_NOT_FOUND ? 404 : 500;
      return res.status(statusCode).json({
        error: err.message,
        type: err.type,
        context: err.context
      });
    }

    console.error('manual translate generation failed', err);
    res.status(500).json({ error: 'Translation generation failed', message: err.message });
  }
});

export default router;
