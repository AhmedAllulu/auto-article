import crypto from 'crypto';

/**
 * Compute a strong ETag for a given payload.
 * The payload can be a string or an object/array (stringified deterministically).
 */
export function computeEtag(payload, extra = '') {
  const str = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const hash = crypto.createHash('sha1').update(extra + '|' + str).digest('base64');
  return '"' + hash + '"'; // strong ETag format
}

/**
 * Set cache headers consistently for API responses.
 */
export function setCacheHeaders(res, { maxAge = 60, sMaxAge, swr = 300, vary = [], etag, lastModified } = {}) {
  const sMax = Number.isFinite(sMaxAge) ? sMaxAge : Math.max(maxAge * 5, swr);
  res.set('Cache-Control', `public, max-age=${maxAge}, s-maxage=${sMax}, stale-while-revalidate=${swr}`);
  if (vary && vary.length) res.set('Vary', vary.join(', '));
  if (etag) res.set('ETag', etag);
  if (lastModified) res.set('Last-Modified', new Date(lastModified).toUTCString());
}

/**
 * Handles conditional GET logic. Returns true if the response was handled (304 sent).
 */
export function handleConditionalGet(req, res, { etag, lastModified } = {}) {
  const inm = req.get('If-None-Match');
  const ims = req.get('If-Modified-Since');
  if (etag && inm && inm === etag) {
    res.status(304);
    res.set('ETag', etag);
    if (lastModified) res.set('Last-Modified', new Date(lastModified).toUTCString());
    res.end();
    return true;
  }
  if (lastModified && ims) {
    const imsTime = new Date(ims).getTime();
    const lastTime = new Date(lastModified).getTime();
    if (!Number.isNaN(imsTime) && lastTime <= imsTime) {
      res.status(304);
      if (etag) res.set('ETag', etag);
      res.set('Last-Modified', new Date(lastModified).toUTCString());
      res.end();
      return true;
    }
  }
  return false;
}

