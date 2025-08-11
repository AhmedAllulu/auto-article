import express from 'express';
import { query } from '../db.js';
import { config } from '../config.js';
import { resolveLanguage } from '../utils/lang.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const language = resolveLanguage(req, config.languages);
    const result = await query(
      `SELECT c.id, c.name, c.slug
       FROM categories c
       WHERE EXISTS (
         SELECT 1 FROM articles a WHERE a.category_id = c.id AND a.language_code = $1
       )
       ORDER BY c.name ASC`,
      [language]
    );
    res.json({ data: result.rows, language });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

router.get('/:id/articles', async (req, res) => {
  const language = resolveLanguage(req, config.languages);
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    const result = await query(
      `SELECT id, title, slug, summary, image_url, language_code, meta_title, meta_description, created_at
       FROM articles WHERE category_id = $1 AND language_code = $2
       ORDER BY created_at DESC LIMIT 200`,
      [id, language]
    );
    res.json({ data: result.rows, language });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load articles' });
  }
});

export default router;


