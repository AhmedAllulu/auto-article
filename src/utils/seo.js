import slugify from 'slugify';

export function createSlug(title, languageCode) {
  const base = slugify(title, { lower: true, strict: true, locale: languageCode });
  const safeBase = base && base.replace(/^-+|-+$/g, '');
  if (safeBase && safeBase.length >= 3) {
    return `${safeBase}-${languageCode}`;
  }
  const fallback = `article-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
  return `${fallback}-${languageCode}`;
}

export function buildMeta({ title, summary, imageUrl, canonicalUrl }) {
  const metaTitle = title.length > 65 ? `${title.slice(0, 62)}...` : title;
  const metaDescription = summary
    ? summary.slice(0, 160)
    : title.slice(0, 160);
  return {
    metaTitle,
    metaDescription,
    canonicalUrl: canonicalUrl || null,
    ogTitle: metaTitle,
    ogDescription: metaDescription,
    ogImage: imageUrl || null,
    twitterTitle: metaTitle,
    twitterDescription: metaDescription,
    twitterImage: imageUrl || null,
  };
}

export function estimateReadingTimeMinutes(content) {
  const words = content ? content.split(/\s+/).filter(Boolean).length : 0;
  const wordsPerMinute = 200;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}


