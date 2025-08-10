import { query } from '../db/pool.js';

export async function listCategories({ language } = {}) {
  // If language provided, return categories that have at least one article in that language,
  // otherwise return all categories.
  if (language) {
    const { rows } = await query(
      `SELECT c.id, c.name, c.slug, COUNT(a.id) AS article_count
       FROM categories c
       JOIN articles a ON a.category_id = c.id AND a.language_code = $1
       GROUP BY c.id
       ORDER BY c.name ASC`,
      [language]
    );
    return rows;
  }
  const { rows } = await query(
    'SELECT id, name, slug FROM categories ORDER BY name ASC',
    []
  );
  return rows;
}

export async function getCategoryBySlug(slug) {
  const { rows } = await query(
    'SELECT id, name, slug FROM categories WHERE slug = $1',
    [slug]
  );
  return rows[0] || null;
}


