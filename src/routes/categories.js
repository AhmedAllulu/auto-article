import { Router } from 'express';
import { listCategories } from '../models/categoryModel.js';

const router = Router();

/**
 * @swagger
 * /v1/categories:
 *   get:
 *     summary: List categories
 *     description: Retrieve available article categories. When a language is specified, categories are filtered to those that have articles in that language and include an article_count.
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 5
 *         description: Language code to filter categories and counts (defaults to detected user language)
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 */
router.get('/', async (req, res) => {
  const categories = await listCategories({ language: req.query.language || req.languageCode });
  res.json({ items: categories });
});

export default router;


