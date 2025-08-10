import { Router } from 'express';
import { z } from 'zod';
import { getArticles, getArticleBySlug } from '../models/articleModel.js';
import { getJobForDay } from '../models/jobModel.js';
import { config } from '../config/env.js';

function todayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

const router = Router();

const listSchema = z.object({
  language: z.string().min(2).max(5).optional(),
  category: z.string().min(2).max(64).optional(),
  search: z.string().min(1).max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * @swagger
 * /v1/articles:
 *   get:
 *     summary: List articles
 *     description: Retrieve a paginated list of articles with optional filtering
 *     tags: [Articles]
 *     parameters:
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 5
 *         description: Filter by language code (e.g., en, es, fr)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 64
 *         description: Filter by category slug
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 200
 *         description: Search term for title and content
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Articles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Article'
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', async (req, res) => {
  const parse = listSchema.safeParse(req.query);
  if (!parse.success) return res.status(400).json({ error: 'Invalid query' });
  const { language, category, search, page, pageSize } = parse.data;
  const effectiveLanguage = language || req.languageCode;
  const rows = await getArticles({ language: effectiveLanguage, categorySlug: category, search, page, pageSize });
  res.json({ items: rows });
});

/**
 * @swagger
 * /v1/articles/generation/status:
 *   get:
 *     summary: Get today's generation status
 *     description: Returns how many articles were generated today and how many remain to reach the daily target.
 *     tags: [Articles]
 *     responses:
 *       200:
 *         description: Status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 day:
 *                   type: string
 *                   format: date
 *                 generated:
 *                   type: integer
 *                 target:
 *                   type: integer
 *                 remaining:
 *                   type: integer
 */
router.get('/generation/status', async (req, res) => {
  const day = todayUTC();
  const job = await getJobForDay(day);
  const generated = job?.num_articles_generated || 0;
  const target = job?.num_articles_target || config.generation.dailyTarget;
  const remaining = Math.max(0, target - generated);
  res.json({ day: day.toISOString().slice(0, 10), generated, target, remaining });
});

/**
 * @swagger
 * /v1/articles/{slug}:
 *   get:
 *     summary: Get article by slug
 *     description: Retrieve a specific article by its URL slug
 *     tags: [Articles]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Article URL slug
 *     responses:
 *       200:
 *         description: Article retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Article'
 *       404:
 *         description: Article not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:slug', async (req, res) => {
  const article = await getArticleBySlug(req.params.slug);
  if (!article) return res.status(404).json({ error: 'Not found' });
  res.json(article);
});

export default router;


