import { config } from '../config/env.js';

function normalizeLanguageCode(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Accept formats like en, en-US, fr_FR → take primary subtag
  const primary = trimmed.toLowerCase().split(/[-_]/)[0];
  return primary && primary.length >= 2 ? primary : null;
}

export function languageMiddleware(req, res, next) {
  // Priority: explicit query param > custom header > Accept-Language > default
  const fromQuery = normalizeLanguageCode(req.query?.language);
  const fromHeader = normalizeLanguageCode(req.get('x-user-language'));

  let fromAccept = null;
  const accept = req.get('accept-language');
  if (accept) {
    // Parse first language from Accept-Language header
    const token = accept.split(',')[0];
    fromAccept = normalizeLanguageCode(token);
  }

  const candidate = fromQuery || fromHeader || fromAccept || config.defaultLanguage;
  const supported = (config.languages || []).includes(candidate) ? candidate : config.defaultLanguage;

  req.languageCode = supported;
  res.set('Content-Language', supported);
  next();
}


