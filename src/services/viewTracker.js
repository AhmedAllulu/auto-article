import { query } from '../db.js';
import crypto from 'crypto';

/**
 * View tracking service for articles and categories
 */

// Generate session ID for user
function generateSessionId(ip, userAgent) {
  const hash = crypto.createHash('sha256');
  hash.update(`${ip}-${userAgent}-${Date.now()}`);
  return hash.digest('hex').substring(0, 16);
}

// Calculate trending score based on recent views
function calculateTrendingScore(totalViews, uniqueViews, daysOld, recentViews24h) {
  const recencyWeight = Math.max(0.1, 1 / (daysOld + 1));
  const popularityScore = Math.log(totalViews + 1) * 0.3 + Math.log(uniqueViews + 1) * 0.7;
  const recentPopularity = Math.log(recentViews24h + 1) * 2;
  
  return (popularityScore + recentPopularity) * recencyWeight;
}

// Check if view should be counted as unique
async function isUniqueView(type, contentId, userIp, period = 'daily') {
  // Validate input parameters
  const numericContentId = parseInt(contentId);
  if (!Number.isInteger(numericContentId) || numericContentId <= 0) {
    console.error(`Invalid contentId for ${type} tracking:`, contentId);
    return false; // Don't count as unique if ID is invalid
  }
  
  const table = type === 'article' ? 'article_views' : 'category_views';
  const column = type === 'article' ? 'article_id' : 'category_id';
  
  const timeCondition = period === 'daily' 
    ? "viewed_at::date = CURRENT_DATE"
    : "viewed_at >= CURRENT_DATE - INTERVAL '30 days'";
  
  try {
    const result = await query(`
      SELECT COUNT(*) as count 
      FROM ${table} 
      WHERE ${column} = $1 AND user_ip = $2 AND ${timeCondition}
    `, [numericContentId, userIp]);
    
    return parseInt(result.rows[0].count) === 0;
  } catch (error) {
    console.error(`Error checking unique view for ${type} ${numericContentId}:`, error.message);
    return false; // Default to not unique on error
  }
}

/**
 * Track article view
 */
export async function trackArticleView(req, articleData) {
  try {
    // Validate input data
    if (!articleData || !articleData.id) {
      console.error('Invalid article data for tracking:', articleData);
      return;
    }
    
    const userIp = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const referrer = req.get('Referer') || req.get('Referrer') || null;
    const sessionId = generateSessionId(userIp, userAgent);
    
    // Ensure IDs are properly converted to integers
    const articleId = parseInt(articleData.id);
    const categoryId = articleData.category_id ? parseInt(articleData.category_id) : null;
    
    if (!Number.isInteger(articleId) || articleId <= 0) {
      console.error('Invalid article ID for tracking:', articleData.id);
      return;
    }
    
    const { slug, language_code } = articleData;
    
    // Check if this is a unique view
    const isDailyUnique = await isUniqueView('article', articleId, userIp, 'daily');
    const isMonthlyUnique = await isUniqueView('article', articleId, userIp, 'monthly');
    
    // Insert view record
    await query(`
      INSERT INTO article_views (
        article_id, article_slug, language_code, category_id,
        user_ip, user_agent, referrer, session_id,
        is_unique_daily, is_unique_monthly
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      articleId, slug, language_code, categoryId,
      userIp, userAgent, referrer, sessionId,
      isDailyUnique, isMonthlyUnique
    ]);
    
    // Update article counters
    const tableName = `articles_${language_code}`;
    await query(`
      UPDATE ${tableName} 
      SET 
        total_views = total_views + 1,
        unique_views = unique_views + $1,
        last_viewed = now()
      WHERE id = $2
    `, [isDailyUnique ? 1 : 0, articleId]);
    
    // Update category counters if category exists
    if (categoryId) {
      await query(`
        UPDATE categories 
        SET 
          total_views = total_views + 1,
          unique_views = unique_views + $1,
          last_viewed = now()
        WHERE id = $2
      `, [isDailyUnique ? 1 : 0, categoryId]);
    }
    
    console.log(`📈 Tracked view: Article ${slug} (${language_code}) - Unique: ${isDailyUnique}`);
    
  } catch (error) {
    console.error('Error tracking article view:', error);
    // Don't throw error - view tracking shouldn't break the main request
  }
}

/**
 * Track category view
 */
export async function trackCategoryView(req, categoryData) {
  try {
    // Validate input data
    if (!categoryData || !categoryData.id) {
      console.error('Invalid category data for tracking:', categoryData);
      return;
    }
    
    const userIp = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const referrer = req.get('Referer') || req.get('Referrer') || null;
    const sessionId = generateSessionId(userIp, userAgent);
    const language = req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
    
    // Ensure ID is properly converted to integer
    const categoryId = parseInt(categoryData.id);
    
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      console.error('Invalid category ID for tracking:', categoryData.id);
      return;
    }
    
    const { slug } = categoryData;
    
    // Check if this is a unique view
    const isDailyUnique = await isUniqueView('category', categoryId, userIp, 'daily');
    const isMonthlyUnique = await isUniqueView('category', categoryId, userIp, 'monthly');
    
    // Insert view record
    await query(`
      INSERT INTO category_views (
        category_id, category_slug, language_code,
        user_ip, user_agent, referrer, session_id,
        is_unique_daily, is_unique_monthly
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      categoryId, slug, language,
      userIp, userAgent, referrer, sessionId,
      isDailyUnique, isMonthlyUnique
    ]);
    
    // Update category counters
    await query(`
      UPDATE categories 
      SET 
        total_views = total_views + 1,
        unique_views = unique_views + $1,
        last_viewed = now()
      WHERE id = $2
    `, [isDailyUnique ? 1 : 0, categoryId]);
    
    console.log(`📈 Tracked view: Category ${slug} (${language}) - Unique: ${isDailyUnique}`);
    
  } catch (error) {
    console.error('Error tracking category view:', error);
    // Don't throw error - view tracking shouldn't break the main request
  }
}

/**
 * Get article analytics
 */
export async function getArticleAnalytics(articleId, language, period = '30 days') {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total_views,
        COUNT(DISTINCT user_ip) as unique_visitors,
        COUNT(CASE WHEN is_unique_daily THEN 1 END) as unique_daily_views,
        COUNT(*) FILTER (WHERE viewed_at >= CURRENT_DATE - INTERVAL '1 day') as views_24h,
        COUNT(*) FILTER (WHERE viewed_at >= CURRENT_DATE - INTERVAL '7 days') as views_7d,
        COUNT(*) FILTER (WHERE viewed_at >= CURRENT_DATE - INTERVAL '30 days') as views_30d,
        array_agg(DISTINCT referrer) FILTER (WHERE referrer IS NOT NULL) as top_referrers,
        date_trunc('day', viewed_at) as view_date
      FROM article_views 
      WHERE article_id = $1 
        AND language_code = $2 
        AND viewed_at >= CURRENT_DATE - INTERVAL $3
      GROUP BY date_trunc('day', viewed_at)
      ORDER BY view_date DESC
    `, [articleId, language, period]);
    
    return result.rows;
  } catch (error) {
    console.error('Error getting article analytics:', error);
    return [];
  }
}

/**
 * Get category analytics
 */
export async function getCategoryAnalytics(categoryId, period = '30 days') {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total_views,
        COUNT(DISTINCT user_ip) as unique_visitors,
        COUNT(CASE WHEN is_unique_daily THEN 1 END) as unique_daily_views,
        COUNT(*) FILTER (WHERE viewed_at >= CURRENT_DATE - INTERVAL '1 day') as views_24h,
        COUNT(*) FILTER (WHERE viewed_at >= CURRENT_DATE - INTERVAL '7 days') as views_7d,
        COUNT(*) FILTER (WHERE viewed_at >= CURRENT_DATE - INTERVAL '30 days') as views_30d,
        array_agg(DISTINCT referrer) FILTER (WHERE referrer IS NOT NULL) as top_referrers,
        date_trunc('day', viewed_at) as view_date
      FROM category_views 
      WHERE category_id = $1 
        AND viewed_at >= CURRENT_DATE - INTERVAL $2
      GROUP BY date_trunc('day', viewed_at)
      ORDER BY view_date DESC
    `, [categoryId, period]);
    
    return result.rows;
  } catch (error) {
    console.error('Error getting category analytics:', error);
    return [];
  }
}

/**
 * Update trending scores for all content
 */
export async function updateTrendingScores() {
  try {
    console.log('📊 Updating trending scores...');
    
    // Update article trending scores for each language
    const languages = ['en', 'de', 'fr', 'es', 'pt', 'ar', 'hi'];
    
    for (const lang of languages) {
      const tableName = `articles_${lang}`;
      
      // Check if table exists
      const tableExists = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = $1
        );
      `, [tableName]);
      
      if (!tableExists.rows[0].exists) continue;
      
      await query(`
        UPDATE ${tableName} 
        SET trending_score = CASE 
          WHEN published_at IS NULL THEN 0
          ELSE (
            (LN(GREATEST(total_views, 1)) * 0.3 + LN(GREATEST(unique_views, 1)) * 0.7) *
            GREATEST(0.1, 1.0 / (EXTRACT(days FROM (now() - published_at)) + 1))
          )
        END
      `);
    }
    
    // Update category trending scores
    await query(`
      UPDATE categories 
      SET trending_score = (
        LN(GREATEST(total_views, 1)) * 0.4 + 
        LN(GREATEST(unique_views, 1)) * 0.6
      ) * GREATEST(0.1, 1.0 / (EXTRACT(days FROM (now() - created_at)) + 1))
    `);
    
    console.log('✅ Trending scores updated');
    
  } catch (error) {
    console.error('Error updating trending scores:', error);
  }
}

/**
 * Get top performing content
 */
export async function getTopPerformingContent(limit = 10, period = 'all_time', contentType = 'both') {
  try {
    let whereClause = '';
    let params = [limit];
    
    if (contentType !== 'both') {
      whereClause = 'WHERE content_type = $2';
      params = [limit, contentType];
    }
    
    const result = await query(`
      SELECT * FROM top_performing_content 
      ${whereClause}
      ORDER BY trending_score DESC, total_views DESC 
      LIMIT $1
    `, params);
    
    return result.rows;
  } catch (error) {
    console.error('Error getting top performing content:', error);
    return [];
  }
}

/**
 * Get dashboard analytics summary
 */
export async function getDashboardAnalytics() {
  try {
    // Get overall stats
    const overallStats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM article_views WHERE viewed_at >= CURRENT_DATE) as articles_views_today,
        (SELECT COUNT(*) FROM category_views WHERE viewed_at >= CURRENT_DATE) as categories_views_today,
        (SELECT COUNT(DISTINCT user_ip) FROM article_views WHERE viewed_at >= CURRENT_DATE) as unique_visitors_today,
        (SELECT COUNT(*) FROM article_views WHERE viewed_at >= CURRENT_DATE - INTERVAL '7 days') as articles_views_week,
        (SELECT COUNT(*) FROM category_views WHERE viewed_at >= CURRENT_DATE - INTERVAL '7 days') as categories_views_week
    `);
    
    // Get top articles today
    const topArticlesToday = await query(`
      SELECT 
        av.article_slug,
        av.language_code,
        COUNT(*) as views_today,
        COUNT(DISTINCT av.user_ip) as unique_visitors
      FROM article_views av
      WHERE av.viewed_at >= CURRENT_DATE
      GROUP BY av.article_slug, av.language_code
      ORDER BY views_today DESC
      LIMIT 5
    `);
    
    // Get top categories today
    const topCategoriesToday = await query(`
      SELECT 
        c.name,
        c.slug,
        COUNT(cv.*) as views_today,
        COUNT(DISTINCT cv.user_ip) as unique_visitors
      FROM categories c
      LEFT JOIN category_views cv ON cv.category_id = c.id AND cv.viewed_at >= CURRENT_DATE
      GROUP BY c.id, c.name, c.slug
      ORDER BY views_today DESC
      LIMIT 5
    `);
    
    return {
      overall: overallStats.rows[0],
      topArticles: topArticlesToday.rows,
      topCategories: topCategoriesToday.rows
    };
    
  } catch (error) {
    console.error('Error getting dashboard analytics:', error);
    return null;
  }
}

export { calculateTrendingScore, isUniqueView };
