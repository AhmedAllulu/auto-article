export function resolveLanguage(req, supportedLanguages) {
  const header = (req.headers['accept-language'] || '').toString();
  const primary = header.split(',')[0].split('-')[0].toLowerCase();
  const fallback = 'en';
  if (supportedLanguages.includes(primary)) return primary;
  return supportedLanguages.includes(fallback) ? fallback : supportedLanguages[0];
}


