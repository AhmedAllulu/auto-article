import { Router } from 'express';
import { listCategories } from '../models/categoryModel.js';

const router = Router();

/**
 * @swagger
 * /v1/categories:
 *   get:
 *     summary: List categories
 *     description: Retrieve all available article categories
 *     tags: [Categories]
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
  const categories = await listCategories();
  res.json({ items: categories });
});

export default router;


