export const LANG_SHARDED_ARTICLE_TABLES = new Set(['de', 'fr', 'es', 'pt', 'ar', 'hi']);

/**
 * Return the physical articles table name for a given language.
 * If the language is one of the sharded tables (de, fr, es, pt, ar, hi) we
 * route to `articles_<lang>`; otherwise we fall back to the legacy `articles`
 * table which still stores English and any yet-to-be-migrated languages.
 *
 * @param {string} languageCode ISO-639-1 lower-case language code
 * @returns {string}
 */
export function articlesTable(languageCode) {
  const code = String(languageCode || '').toLowerCase();
  return LANG_SHARDED_ARTICLE_TABLES.has(code) ? `articles_${code}` : 'articles';
}
