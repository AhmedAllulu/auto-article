export function resolveLanguage(req, supportedLanguages) {
  // 1) Explicit query parameter takes precedence (ensures cache key can vary by URL)
  const queryLang = String((req.query?.lang ?? '')).split(',')[0].split('-')[0].toLowerCase();
  if (queryLang && supportedLanguages.includes(queryLang)) return queryLang;

  // 2) Fallback to Accept-Language header
  const header = (req.headers['accept-language'] || '').toString();
  const primary = header.split(',')[0].split('-')[0].toLowerCase();
  const fallback = 'en';
  if (supportedLanguages.includes(primary)) return primary;
  return supportedLanguages.includes(fallback) ? fallback : supportedLanguages[0];
}


