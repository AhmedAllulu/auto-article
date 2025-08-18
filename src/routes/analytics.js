import express from 'express';
import { query } from '../db.js';
import { 
  getArticleAnalytics, 
  getCategoryAnalytics, 
  getTopPerformingContent,
  getDashboardAnalytics,
  updateTrendingScores 
} from '../services/viewTracker.js';

const router = express.Router();

/**
 * @openapi
 * /analytics/dashboard:
 *   get:
 *     tags: [Analytics]
 *     summary: Get overall analytics dashboard
 *     responses:
 *       '200':
 *         description: Dashboard analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     overall:
 *                       type: object
 *                     topArticles:
 *                       type: array
 *                     topCategories:
 *                       type: array
 *       '500':
 *         description: Failed to load analytics
 */
router.get('/dashboard', async (_req, res) => {
  try {
    const analytics = await getDashboardAnalytics();
    res.json({ data: analytics });
  } catch (err) {
    console.error('Dashboard analytics error:', err);
    res.status(500).json({ error: 'Failed to load dashboard analytics' });
  }
});

/**
 * @openapi
 * /analytics/top-content:
 *   get:
 *     tags: [Analytics]
 *     summary: Get top performing content
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items to return
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [article, category, both]
 *           default: both
 *         description: Type of content to return
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, all_time]
 *           default: all_time
 *         description: Time period for analysis
 *     responses:
 *       '200':
 *         description: Top performing content
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       '500':
 *         description: Failed to load top content
 */
router.get('/top-content', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const contentType = req.query.type || 'both';
    const period = req.query.period || 'all_time';
    
    const topContent = await getTopPerformingContent(limit, period, contentType);
    res.json({ data: topContent });
  } catch (err) {
    console.error('Top content analytics error:', err);
    res.status(500).json({ error: 'Failed to load top content' });
  }
});

/**
 * @openapi
 * /analytics/article/{id}:
 *   get:
 *     tags: [Analytics]
 *     summary: Get analytics for specific article
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           default: en
 *         description: Article language
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           default: 30 days
 *         description: Time period for analysis
 *     responses:
 *       '200':
 *         description: Article analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *       '500':
 *         description: Failed to load article analytics
 */
router.get('/article/:id', async (req, res) => {
  try {
    const articleId = parseInt(req.params.id);
    const language = req.query.language || 'en';
    const period = req.query.period || '30 days';
    
    const analytics = await getArticleAnalytics(articleId, language, period);
    res.json({ data: analytics });
  } catch (err) {
    console.error('Article analytics error:', err);
    res.status(500).json({ error: 'Failed to load article analytics' });
  }
});

/**
 * @openapi
 * /analytics/category/{id}:
 *   get:
 *     tags: [Analytics]
 *     summary: Get analytics for specific category
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           default: 30 days
 *         description: Time period for analysis
 *     responses:
 *       '200':
 *         description: Category analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *       '500':
 *         description: Failed to load category analytics
 */
router.get('/category/:id', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const period = req.query.period || '30 days';
    
    const analytics = await getCategoryAnalytics(categoryId, period);
    res.json({ data: analytics });
  } catch (err) {
    console.error('Category analytics error:', err);
    res.status(500).json({ error: 'Failed to load category analytics' });
  }
});

/**
 * @openapi
 * /analytics/trending:
 *   get:
 *     tags: [Analytics]
 *     summary: Get trending articles and categories
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items to return
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           default: en
 *         description: Language filter
 *     responses:
 *       '200':
 *         description: Trending content
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     articles:
 *                       type: array
 *                     categories:
 *                       type: array
 *       '500':
 *         description: Failed to load trending content
 */
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const language = req.query.language || 'en';
    
    // Get trending articles
    const tableName = `articles_${language}`;
    const articlesResult = await query(`
      SELECT 
        a.id,
        a.title,
        a.slug,
        a.total_views,
        a.unique_views,
        a.trending_score,
        a.published_at,
        c.name as category_name,
        c.slug as category_slug
      FROM ${tableName} a
      LEFT JOIN categories c ON c.id = a.category_id
      WHERE a.trending_score > 0
      ORDER BY a.trending_score DESC
      LIMIT $1
    `, [Math.floor(limit * 0.7)]); // 70% for articles
    
    // Get trending categories
    const categoriesResult = await query(`
      SELECT 
        id,
        name,
        slug,
        total_views,
        unique_views,
        trending_score
      FROM categories
      WHERE trending_score > 0
      ORDER BY trending_score DESC
      LIMIT $1
    `, [Math.floor(limit * 0.3)]); // 30% for categories
    
    res.json({ 
      data: {
        articles: articlesResult.rows,
        categories: categoriesResult.rows
      }
    });
  } catch (err) {
    console.error('Trending content error:', err);
    res.status(500).json({ error: 'Failed to load trending content' });
  }
});

/**
 * @openapi
 * /analytics/stats:
 *   get:
 *     tags: [Analytics]
 *     summary: Get overall site statistics
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, all_time]
 *           default: today
 *         description: Time period for statistics
 *     responses:
 *       '200':
 *         description: Site statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *       '500':
 *         description: Failed to load statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const period = req.query.period || 'today';
    
    let timeCondition = '';
    switch (period) {
      case 'today':
        timeCondition = 'viewed_at >= CURRENT_DATE';
        break;
      case 'week':
        timeCondition = "viewed_at >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'month':
        timeCondition = "viewed_at >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      case 'all_time':
      default:
        timeCondition = '1=1';
        break;
    }
    
    // Get article view stats
    const articleStatsResult = await query(`
      SELECT 
        COUNT(*) as total_article_views,
        COUNT(DISTINCT user_ip) as unique_visitors,
        COUNT(DISTINCT article_id) as articles_viewed,
        COUNT(DISTINCT category_id) as categories_viewed
      FROM article_views 
      WHERE ${timeCondition}
    `);
    
    // Get category view stats
    const categoryStatsResult = await query(`
      SELECT 
        COUNT(*) as total_category_views,
        COUNT(DISTINCT user_ip) as category_unique_visitors
      FROM category_views 
      WHERE ${timeCondition}
    `);
    
    // Get top referrers
    const referrersResult = await query(`
      SELECT 
        referrer,
        COUNT(*) as visits
      FROM (
        SELECT referrer FROM article_views WHERE ${timeCondition} AND referrer IS NOT NULL
        UNION ALL
        SELECT referrer FROM category_views WHERE ${timeCondition} AND referrer IS NOT NULL
      ) combined_views
      GROUP BY referrer
      ORDER BY visits DESC
      LIMIT 10
    `);
    
    const stats = {
      period,
      article_stats: articleStatsResult.rows[0],
      category_stats: categoryStatsResult.rows[0],
      top_referrers: referrersResult.rows,
      generated_at: new Date().toISOString()
    };
    
    res.json({ data: stats });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to load statistics' });
  }
});

/**
 * @openapi
 * /analytics/update-trending:
 *   post:
 *     tags: [Analytics]
 *     summary: Update trending scores for all content
 *     responses:
 *       '200':
 *         description: Trending scores updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       '500':
 *         description: Failed to update trending scores
 */
router.post('/update-trending', async (_req, res) => {
  try {
    await updateTrendingScores();
    res.json({ message: 'Trending scores updated successfully' });
  } catch (err) {
    console.error('Update trending scores error:', err);
    res.status(500).json({ error: 'Failed to update trending scores' });
  }
});

/**
 * @openapi
 * /analytics/popular-by-category:
 *   get:
 *     tags: [Analytics]
 *     summary: Get popular articles grouped by category
 *     parameters:
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           default: en
 *         description: Language filter
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of articles per category
 *     responses:
 *       '200':
 *         description: Popular articles by category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *       '500':
 *         description: Failed to load popular articles
 */
router.get('/popular-by-category', async (req, res) => {
  try {
    const language = req.query.language || 'en';
    const limit = parseInt(req.query.limit) || 5;
    const tableName = `articles_${language}`;
    
    const result = await query(`
      SELECT 
        c.id as category_id,
        c.name as category_name,
        c.slug as category_slug,
        json_agg(
          json_build_object(
            'id', a.id,
            'title', a.title,
            'slug', a.slug,
            'total_views', a.total_views,
            'unique_views', a.unique_views,
            'trending_score', a.trending_score,
            'published_at', a.published_at
          ) ORDER BY a.total_views DESC
        ) as popular_articles
      FROM categories c
      LEFT JOIN LATERAL (
        SELECT * FROM ${tableName} 
        WHERE category_id = c.id AND total_views > 0
        ORDER BY total_views DESC 
        LIMIT $1
      ) a ON true
      WHERE a.id IS NOT NULL
      GROUP BY c.id, c.name, c.slug
      ORDER BY c.total_views DESC
    `, [limit]);
    
    res.json({ data: result.rows });
  } catch (err) {
    console.error('Popular by category error:', err);
    res.status(500).json({ error: 'Failed to load popular articles by category' });
  }
});

export default router;
