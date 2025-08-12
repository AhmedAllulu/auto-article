import { query } from '../src/db.js';

function parseList(value) {
  return (value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function titleCase(slug) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

async function main() {
  const top = parseList(process.env.TOP_CATEGORIES);
  if (!top.length) {
    console.log('No TOP_CATEGORIES in env; nothing to seed.');
    process.exit(0);
  }

  for (const slug of top) {
    const name = titleCase(slug);
    await query(
      `INSERT INTO categories (name, slug)
       VALUES ($1, $2)
       ON CONFLICT (slug) DO NOTHING`,
      [name, slug]
    );
  }
  const { rows } = await query('SELECT id, name, slug FROM categories ORDER BY id ASC');
  console.log('Seeded categories:', rows);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


