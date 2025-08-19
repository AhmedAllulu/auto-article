import { query, withTransaction, queryWithErrorHandling } from '../db.js';
import { articlesTable } from '../utils/articlesTable.js';
import { AppError, ErrorTypes, withDatabaseErrorHandling } from './errorHandler.js';
import { genLog } from './logger.js';

/**
 * Reusable article service that consolidates common database operations
 * and provides optimized queries for article management.
 */

/**
 * Get category by slug with caching and error handling
 */
export async function getCategoryBySlug(slug) {
  return await withDatabaseErrorHandling(async () => {
    const result = await queryWithErrorHandling(
      'SELECT id, name, slug FROM categories WHERE slug = $1 LIMIT 1',
      [slug],
      'category lookup'
    );
    
    if (result.rowCount === 0) {
      throw new AppError('Category not found', ErrorTypes.RESOURCE_NOT_FOUND, { slug });
    }
    
    return result.rows[0];
  }, 'getCategoryBySlug');
}

/**
 * Get all categories with optional filtering
 */
export async function getCategories(options = {}) {
  const { orderBy = 'id ASC', limit = null } = options;
  
  return await withDatabaseErrorHandling(async () => {
    let sql = `SELECT id, name, slug, created_at FROM categories ORDER BY ${orderBy}`;
    const params = [];
    
    if (limit) {
      sql += ' LIMIT $1';
      params.push(limit);
    }
    
    const result = await queryWithErrorHandling(sql, params, 'categories list');
    return result.rows;
  }, 'getCategories');
}

/**
 * Get article counts by category for today
 */
export async function getTodayArticleCountsByCategory() {
  return await withDatabaseErrorHandling(async () => {
    const result = await queryWithErrorHandling(`
      SELECT 
        c.id,
        c.name,
        c.slug,
        COUNT(a.id)::int as today_count,
        $1 - COUNT(a.id)::int as needed
      FROM categories c
      LEFT JOIN articles_en a ON a.category_id = c.id AND a.published_at::date = CURRENT_DATE
      GROUP BY c.id, c.name, c.slug
      ORDER BY c.id ASC
    `, [2], 'today article counts by category');
    
    return result.rows;
  }, 'getTodayArticleCountsByCategory');
}

/**
 * Check if article exists by slug in any language table
 */
export async function articleExistsBySlug(slug, language = null) {
  return await withDatabaseErrorHandling(async () => {
    if (language) {
      // Check specific language table
      const tableName = articlesTable(language);
      const result = await queryWithErrorHandling(
        `SELECT 1 FROM ${tableName} WHERE slug = $1 LIMIT 1`,
        [slug],
        `article existence check (${language})`
      );
      return result.rowCount > 0;
    } else {
      // Check all language tables
      const languages = ['en', 'de', 'fr', 'es', 'pt', 'ar', 'hi'];
      
      for (const lang of languages) {
        const tableName = articlesTable(lang);
        try {
          const result = await queryWithErrorHandling(
            `SELECT 1 FROM ${tableName} WHERE slug = $1 LIMIT 1`,
            [slug],
            `article existence check (${lang})`
          );
          if (result.rowCount > 0) {
            return true;
          }
        } catch (err) {
          // Skip if table doesn't exist yet
          if (err.code !== '42P01') throw err;
        }
      }
      return false;
    }
  }, 'articleExistsBySlug');
}

/**
 * Get article by slug with category information
 */
export async function getArticleBySlug(slug, language = 'en') {
  return await withDatabaseErrorHandling(async () => {
    const tableName = articlesTable(language);
    const result = await queryWithErrorHandling(`
      SELECT 
        a.*,
        c.id AS category_id,
        c.name AS category_name,
        c.slug AS category_slug
      FROM ${tableName} a
      LEFT JOIN categories c ON c.id = a.category_id
      WHERE a.slug = $1 LIMIT 1
    `, [slug], `article lookup (${language})`);
    
    if (result.rowCount === 0) {
      throw new AppError('Article not found', ErrorTypes.RESOURCE_NOT_FOUND, { slug, language });
    }
    
    return result.rows[0];
  }, 'getArticleBySlug');
}

/**
 * Check if translation exists for a base article
 */
export async function translationExists(baseSlug, targetLanguage) {
  return await withDatabaseErrorHandling(async () => {
    const tableName = articlesTable(targetLanguage);
    const result = await queryWithErrorHandling(
      `SELECT 1 FROM ${tableName} WHERE slug LIKE $1 || '-%' LIMIT 1`,
      [baseSlug],
      `translation existence check (${targetLanguage})`
    );
    return result.rowCount > 0;
  }, 'translationExists');
}

/**
 * Get articles with pagination and filtering
 */
export async function getArticles(options = {}) {
  const {
    language = 'en',
    categoryId = null,
    limit = 12,
    offset = 0,
    orderBy = 'published_at DESC'
  } = options;
  
  return await withDatabaseErrorHandling(async () => {
    const tableName = articlesTable(language);
    let sql = `
      SELECT 
        a.*,
        c.name AS category_name,
        c.slug AS category_slug
      FROM ${tableName} a
      LEFT JOIN categories c ON c.id = a.category_id
    `;
    
    const params = [];
    const conditions = [];
    
    if (categoryId) {
      conditions.push(`a.category_id = $${params.length + 1}`);
      params.push(categoryId);
    }
    
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    sql += ` ORDER BY ${orderBy}`;
    
    if (limit) {
      sql += ` LIMIT $${params.length + 1}`;
      params.push(limit);
    }
    
    if (offset) {
      sql += ` OFFSET $${params.length + 1}`;
      params.push(offset);
    }
    
    const result = await queryWithErrorHandling(sql, params, `articles list (${language})`);
    return result.rows;
  }, 'getArticles');
}

/**
 * Get article count for pagination
 */
export async function getArticleCount(options = {}) {
  const {
    language = 'en',
    categoryId = null
  } = options;
  
  return await withDatabaseErrorHandling(async () => {
    const tableName = articlesTable(language);
    let sql = `SELECT COUNT(*)::int as count FROM ${tableName}`;
    
    const params = [];
    const conditions = [];
    
    if (categoryId) {
      conditions.push(`category_id = $${params.length + 1}`);
      params.push(categoryId);
    }
    
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    const result = await queryWithErrorHandling(sql, params, `article count (${language})`);
    return result.rows[0].count;
  }, 'getArticleCount');
}

/**
 * Insert article with comprehensive error handling and logging
 */
export async function insertArticleWithLogging(client, article, context = 'article insertion') {
  const {
    title,
    slug,
    content,
    summary,
    language_code,
    category_id,
    image_url,
    meta_title,
    meta_description,
    canonical_url,
    reading_time_minutes,
    ai_model,
    ai_prompt,
    ai_tokens_input,
    ai_tokens_output,
    total_tokens,
    source_url,
    content_hash,
  } = article;

  const tableName = articlesTable(language_code);
  
  genLog('Inserting article', {
    context,
    slug,
    language: language_code,
    table: tableName,
    category_id,
    tokens: { input: ai_tokens_input, output: ai_tokens_output }
  });

  const result = await client.query(
    `INSERT INTO ${tableName} (
      title, slug, content, summary, language_code, category_id, image_url,
      meta_title, meta_description, canonical_url, reading_time_minutes,
      ai_model, ai_prompt, ai_tokens_input, ai_tokens_output, total_tokens,
      source_url, content_hash, published_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,
      $8,$9,$10,$11,
      $12,$13,$14,$15,$16,
      $17,$18, now()
    ) RETURNING *`,
    [
      title, slug, content, summary, language_code, category_id, image_url,
      meta_title, meta_description, canonical_url, reading_time_minutes,
      ai_model, ai_prompt, ai_tokens_input, ai_tokens_output, total_tokens,
      source_url, content_hash,
    ]
  );

  genLog('Article inserted successfully', {
    context,
    id: result.rows[0].id,
    slug,
    language: language_code
  });

  return result.rows[0];
}

/**
 * Batch insert articles with transaction support
 */
export async function batchInsertArticles(articles, context = 'batch article insertion') {
  return await withDatabaseErrorHandling(async () => {
    return await withTransaction(async (client) => {
      const insertedArticles = [];
      
      for (const article of articles) {
        const inserted = await insertArticleWithLogging(client, article, context);
        insertedArticles.push(inserted);
      }
      
      genLog('Batch article insertion completed', {
        context,
        count: insertedArticles.length,
        languages: [...new Set(articles.map(a => a.language_code))]
      });
      
      return insertedArticles;
    });
  }, 'batchInsertArticles');
}

export default {
  getCategoryBySlug,
  getCategories,
  getTodayArticleCountsByCategory,
  articleExistsBySlug,
  getArticleBySlug,
  translationExists,
  getArticles,
  getArticleCount,
  insertArticleWithLogging,
  batchInsertArticles
};
