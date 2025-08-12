import { query } from '../src/db.js';
import { config } from '../src/config.js';

function parseMap(jsonLike) {
  try {
    if (!jsonLike) return {};
    return JSON.parse(jsonLike);
  } catch {
    return {};
  }
}

async function main() {
  // Expect env var CATEGORY_TRANSLATIONS as JSON object
  // Example: {"technology":{"de":"Technologie","fr":"Technologie"},"finance":{"de":"Finanzen"}}
  const map = parseMap(process.env.CATEGORY_TRANSLATIONS);

  // Load categories
  const { rows: categories } = await query('SELECT id, slug, name FROM categories');

  // For each category and each language, insert translation
  for (const c of categories) {
    const byLang = map[c.slug] || {};
    for (const lang of config.languages) {
      if (lang === 'en') {
        // Seed English canonical name into translations table for fallback
        await query(
          `INSERT INTO category_translations (category_id, language_code, name)
           VALUES ($1, 'en', $2)
           ON CONFLICT (category_id, language_code) DO NOTHING`,
          [c.id, c.name]
        );
        continue;
      }

      const translated = byLang[lang];
      if (!translated) continue;
      await query(
        `INSERT INTO category_translations (category_id, language_code, name)
         VALUES ($1, $2, $3)
         ON CONFLICT (category_id, language_code) DO UPDATE SET name = EXCLUDED.name`,
        [c.id, lang, translated]
      );
    }
  }

  const { rows } = await query(
    `SELECT c.slug, ct.language_code, ct.name
     FROM category_translations ct
     JOIN categories c ON c.id = ct.category_id
     ORDER BY c.slug, ct.language_code`
  );
  console.log('Seeded category translations:', rows);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


