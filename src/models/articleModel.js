import { query } from '../db/pool.js';

export async function createArticle(article) {
  const {
    title,
    slug,
    content,
    summary,
    languageCode,
    categoryId,
    imageUrl,
    meta,
    readingTimeMinutes,
    sourceUrl,
    aiModel,
    aiPrompt,
    aiTokensInput,
    aiTokensOutput,
  } = article;

  const sql = `
    INSERT INTO articles (
      title, slug, content, summary, language_code, category_id, image_url,
      meta_title, meta_description, canonical_url,
      og_title, og_description, og_image,
      twitter_title, twitter_description, twitter_image,
      reading_time_minutes, source_url, ai_model, ai_prompt,
      ai_tokens_input, ai_tokens_output, total_tokens
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,
      $8,$9,$10,
      $11,$12,$13,
      $14,$15,$16,
      $17,$18,$19,$20,
      $21,$22, (COALESCE($21::int, 0) + COALESCE($22::int, 0))
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING *;
  `;

  const params = [
    title,
    slug,
    content,
    summary,
    languageCode,
    categoryId,
    imageUrl,
    meta.metaTitle,
    meta.metaDescription,
    meta.canonicalUrl,
    meta.ogTitle,
    meta.ogDescription,
    meta.ogImage,
    meta.twitterTitle,
    meta.twitterDescription,
    meta.twitterImage,
    readingTimeMinutes,
    sourceUrl,
    aiModel,
    aiPrompt,
    aiTokensInput,
    aiTokensOutput,
  ];

  const { rows } = await query(sql, params);
  return rows[0] || null;
}

export async function getArticles({
  language,
  categorySlug,
  search,
  page = 1,
  pageSize = 20,
}) {
  const offset = (page - 1) * pageSize;
  const conditions = [];
  const params = [];

  if (language) {
    params.push(language);
    conditions.push(`a.language_code = $${params.length}`);
  }
  if (categorySlug) {
    params.push(categorySlug);
    conditions.push(`c.slug = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(a.title ILIKE $${params.length} OR a.summary ILIKE $${params.length})`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT a.*, c.name AS category_name, c.slug AS category_slug
    FROM articles a
    JOIN categories c ON c.id = a.category_id
    ${whereClause}
    ORDER BY a.published_at DESC NULLS LAST, a.created_at DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `;

  const { rows } = await query(sql, params);
  return rows;
}

export async function getArticleBySlug(slug) {
  const { rows } = await query(
    `SELECT a.*, c.name AS category_name, c.slug AS category_slug
     FROM articles a JOIN categories c ON c.id = a.category_id
     WHERE a.slug = $1 LIMIT 1`,
    [slug]
  );
  return rows[0] || null;
}


