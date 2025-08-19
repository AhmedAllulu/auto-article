import express from 'express';
import { query } from '../db.js';
import {
  checkGenerationHealth,
  isOptimalTime,
  getCategoriesNeedingArticles,
  ARTICLES_PER_CATEGORY_PER_DAY
} from '../services/optimizedGeneration.js';
import { runManualGeneration } from '../services/manualGenerationService.js';
import { genLog } from '../services/logger.js';

const router = express.Router();

/**
 * @openapi
 * /generation/health:
 *   get:
 *     tags: [Generation]
 *     summary: Check generation system health
 *     responses:
 *       '200':
 *         description: System health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, unhealthy]
 *                 currentJob:
 *                   type: object
 *                 totalCategories:
 *                   type: integer
 *                 todayTotal:
 *                   type: integer
 *                 isOptimalTime:
 *                   type: boolean
 *                 timestamp:
 *                   type: string
 *       '500':
 *         description: Health check failed
 */
router.get('/health', async (_req, res) => {
  try {
    const health = await checkGenerationHealth();
    const statusCode = health.status === 'healthy' ? 200 : 500;
    res.status(statusCode).json({ data: health });
  } catch (err) {
    res.status(500).json({ error: 'Health check failed', message: err.message });
  }
});

/**
 * @openapi
 * /generation/status:
 *   get:
 *     tags: [Generation]
 *     summary: Get detailed generation status
 *     responses:
 *       '200':
 *         description: Detailed generation status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     isOptimalTime:
 *                       type: boolean
 *                     categoriesNeedingArticles:
 *                       type: array
 *                     articlesPerCategoryPerDay:
 *                       type: integer
 *                     todayProgress:
 *                       type: object
 *       '500':
 *         description: Failed to get status
 */
router.get('/status', async (_req, res) => {
  try {
    const categoriesNeeding = await getCategoriesNeedingArticles();
    
    // Get today's progress by category
    const { rows: progressRows } = await query(`
      SELECT 
        c.slug,
        c.name,
        COUNT(a.id)::int as today_count,
        $1 - COUNT(a.id)::int as remaining
      FROM categories c
      LEFT JOIN articles_en a ON a.category_id = c.id AND a.published_at::date = CURRENT_DATE
      GROUP BY c.id, c.slug, c.name
      ORDER BY c.slug
    `, [ARTICLES_PER_CATEGORY_PER_DAY]);

    const status = {
      isOptimalTime: isOptimalTime(),
      articlesPerCategoryPerDay: ARTICLES_PER_CATEGORY_PER_DAY,
      categoriesNeedingArticles: categoriesNeeding.map(c => ({
        slug: c.slug,
        name: c.name,
        needed: c.needed,
        priority: c.priority
      })),
      todayProgress: progressRows.map(row => ({
        category: row.slug,
        name: row.name,
        completed: row.today_count,
        remaining: Math.max(0, row.remaining),
        target: ARTICLES_PER_CATEGORY_PER_DAY
      })),
      timestamp: new Date().toISOString()
    };

    res.json({ data: status });
  } catch (err) {
    genLog('Failed to get generation status', { error: err.message }, 'error');
    res.status(500).json({ error: 'Failed to get status', message: err.message });
  }
});

/**
 * @openapi
 * /generation/run:
 *   post:
 *     tags: [Generation]
 *     summary: Manually trigger daily generation process (Manual - Bypasses Time Restrictions)
 *     description: |
 *       Manually triggers the daily generation process with the following behavior:
 *
 *       **IMPORTANT**: This manual endpoint bypasses all time-based restrictions and can be used at any time.
 *       - Bypasses all time-based restrictions and scheduling checks (unlike automated daily generation)
 *       - Can be triggered through Swagger UI regardless of optimal timing windows
 *       - Queries database to count articles generated today for each category
 *       - For each category with fewer than 2 English articles today, generates missing articles to reach exactly 2
 *       - Automatically translates each newly generated English article to all supported languages (de, fr, es, pt, ar, hi)
 *       - Returns detailed response showing categories processed, articles generated, and translation status
 *       - If all categories already have 2 English articles for today, returns completion status
 *       - Respects daily quotas while ignoring timing constraints
 *     responses:
 *       '200':
 *         description: Generation process completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponseGenerationRun'
 *       '500':
 *         description: Generation process failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/run', async (_req, res) => {
  try {
    genLog('🚀 Manual generation triggered via API - BYPASSING TIME RESTRICTIONS', {
      endpoint: 'POST /generation/run',
      trigger: 'manual_swagger',
      bypassTiming: true,
      currentTime: new Date().toISOString(),
      currentHour: new Date().getHours(),
      currentDay: new Date().getDay()
    });

    const result = await runManualGeneration();

    if (result.status === 'error') {
      return res.status(500).json({
        error: 'Generation failed',
        message: result.message,
        details: result.details
      });
    }

    res.json({ data: result });
  } catch (err) {
    genLog('Manual generation failed', { error: err.message }, 'error');
    res.status(500).json({
      error: 'Generation failed',
      message: err.message,
      details: {
        categoriesProcessed: [],
        totalArticlesGenerated: 0,
        totalTranslationsCompleted: 0,
        executionTimeMs: 0,
        timestamp: new Date().toISOString(),
        error: err.message
      }
    });
  }
});

/**
 * @openapi
 * /generation/logs:
 *   get:
 *     tags: [Generation]
 *     summary: Get recent generation logs
 *     parameters:
 *       - in: query
 *         name: lines
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of recent log lines to return
 *     responses:
 *       '200':
 *         description: Recent logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     logs:
 *                       type: array
 *                       items:
 *                         type: string
 *                     count:
 *                       type: integer
 *       '500':
 *         description: Failed to read logs
 */
router.get('/logs', async (req, res) => {
  try {
    const lines = parseInt(req.query.lines) || 100;
    const fs = await import('fs');
    const path = await import('path');
    
    const today = new Date().toISOString().split('T')[0];
    const logFile = path.join(process.cwd(), 'logs', `generation-${today}.log`);
    
    let logs = [];
    
    if (fs.existsSync(logFile)) {
      const logContent = fs.readFileSync(logFile, 'utf8');
      logs = logContent.split('\n')
        .filter(line => line.trim())
        .slice(-lines)
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return { message: line, timestamp: new Date().toISOString() };
          }
        });
    }

    res.json({ 
      data: { 
        logs,
        count: logs.length,
        logFile: `generation-${today}.log`
      } 
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read logs', message: err.message });
  }
});

export default router;
