import { Router } from 'express';
import { z } from 'zod';
import { getArticles, getArticleBySlug } from '../models/articleModel.js';

const router = Router();

const listSchema = z.object({
  language: z.string().min(2).max(5).optional(),
  category: z.string().min(2).max(64).optional(),
  search: z.string().min(1).max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

router.get('/', async (req, res) => {
  const parse = listSchema.safeParse(req.query);
  if (!parse.success) return res.status(400).json({ error: 'Invalid query' });
  const { language, category, search, page, pageSize } = parse.data;
  const rows = await getArticles({ language, categorySlug: category, search, page, pageSize });
  res.json({ items: rows });
});

router.get('/:slug', async (req, res) => {
  const article = await getArticleBySlug(req.params.slug);
  if (!article) return res.status(404).json({ error: 'Not found' });
  res.json(article);
});

export default router;


