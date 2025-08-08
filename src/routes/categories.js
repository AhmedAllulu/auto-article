import { Router } from 'express';
import { listCategories } from '../models/categoryModel.js';

const router = Router();

router.get('/', async (req, res) => {
  const categories = await listCategories();
  res.json({ items: categories });
});

export default router;


