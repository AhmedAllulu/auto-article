import { query } from '../db/pool.js';

export async function listCategories() {
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


