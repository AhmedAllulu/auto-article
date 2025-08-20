import express from 'express';
import { analyzeServerLogs, generateRobotsRules } from '../services/logAnalysisService.js';
import { genLog, genError } from '../services/logger.js';

const router = express.Router();

/**
 * Crawl Budget Optimization Routes
 * Provides log analysis and crawl budget optimization recommendations
 */

/**
 * @openapi
 * /crawl-optimization/analyze:
 *   get:
 *     summary: Analyze server logs for crawl budget optimization
 *     description: Analyzes server logs to identify Googlebot crawl budget waste and provides optimization recommendations
 *     tags:
 *       - Crawl Optimization
 *     responses:
 *       200:
 *         description: Log analysis results with recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     analysisDate:
 *                       type: string
 *                       format: date-time
 *                     logFilesAnalyzed:
 *                       type: integer
 *                     totalAnalysis:
 *                       type: object
 *                       properties:
 *                         googlebotRequests:
 *                           type: integer
 *                         crawlWaste:
 *                           type: object
 *                         recommendations:
 *                           type: array
 *                         summary:
 *                           type: object
 *       500:
 *         description: Analysis failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.get('/analyze', async (req, res) => {
  try {
    genLog('Starting crawl budget analysis via API');
    
    const analysis = await analyzeServerLogs();
    
    res.json({
      success: true,
      data: analysis
    });
    
  } catch (error) {
    genError('Crawl budget analysis failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to analyze server logs',
      message: error.message
    });
  }
});

/**
 * @openapi
 * /crawl-optimization/recommendations:
 *   get:
 *     summary: Get crawl budget optimization recommendations
 *     description: Returns actionable recommendations for optimizing crawl budget based on log analysis
 *     tags:
 *       - Crawl Optimization
 *     responses:
 *       200:
 *         description: Optimization recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                           priority:
 *                             type: string
 *                           issue:
 *                             type: string
 *                           description:
 *                             type: string
 *                           solution:
 *                             type: string
 *                           robotsRule:
 *                             type: string
 *                     robotsRules:
 *                       type: string
 *                     summary:
 *                       type: object
 */
router.get('/recommendations', async (req, res) => {
  try {
    genLog('Generating crawl budget recommendations');
    
    const analysis = await analyzeServerLogs();
    
    if (!analysis || analysis.logFilesAnalyzed === 0) {
      return res.json({
        success: false,
        error: 'No log files available for analysis',
        data: {
          recommendations: [],
          robotsRules: '',
          summary: {
            message: 'Configure log file paths to enable crawl budget analysis'
          }
        }
      });
    }
    
    const robotsRules = generateRobotsRules(analysis.totalAnalysis);
    
    res.json({
      success: true,
      data: {
        recommendations: analysis.totalAnalysis.recommendations,
        robotsRules,
        summary: {
          totalWaste: analysis.totalAnalysis.summary.crawlBudgetWaste,
          wastePercentage: analysis.totalAnalysis.summary.wastePercentage,
          topWastePattern: analysis.totalAnalysis.summary.topWastePattern,
          recommendationCount: analysis.totalAnalysis.summary.recommendationCount,
          analysisDate: analysis.analysisDate
        }
      }
    });
    
  } catch (error) {
    genError('Failed to generate recommendations', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to generate recommendations',
      message: error.message
    });
  }
});

/**
 * @openapi
 * /crawl-optimization/waste-urls:
 *   get:
 *     summary: Get URLs wasting crawl budget
 *     description: Returns list of URLs that are wasting Googlebot's crawl budget
 *     tags:
 *       - Crawl Optimization
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of URLs to return
 *       - in: query
 *         name: pattern
 *         schema:
 *           type: string
 *         description: Filter by waste pattern (e.g., deepPagination, facetedSearch)
 *     responses:
 *       200:
 *         description: List of URLs wasting crawl budget
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     wasteUrls:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           url:
 *                             type: string
 *                           crawls:
 *                             type: integer
 *                           wasteReasons:
 *                             type: array
 *                           lastCrawled:
 *                             type: string
 *                     totalUrls:
 *                       type: integer
 *                     filters:
 *                       type: object
 */
router.get('/waste-urls', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const patternFilter = req.query.pattern;
    
    genLog('Fetching crawl budget waste URLs', { limit, patternFilter });
    
    const analysis = await analyzeServerLogs();
    
    if (!analysis || analysis.logFilesAnalyzed === 0) {
      return res.json({
        success: false,
        error: 'No log files available for analysis',
        data: { wasteUrls: [], totalUrls: 0 }
      });
    }
    
    let wasteUrls = analysis.totalAnalysis.topWasteUrls;
    
    // Apply pattern filter if specified
    if (patternFilter) {
      wasteUrls = wasteUrls.filter(url => 
        url.wasteReasons.includes(patternFilter)
      );
    }
    
    // Apply limit
    wasteUrls = wasteUrls.slice(0, limit);
    
    res.json({
      success: true,
      data: {
        wasteUrls,
        totalUrls: wasteUrls.length,
        filters: {
          pattern: patternFilter,
          limit
        },
        availablePatterns: Object.keys(analysis.totalAnalysis.crawlWaste)
      }
    });
    
  } catch (error) {
    genError('Failed to fetch waste URLs', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch waste URLs',
      message: error.message
    });
  }
});

/**
 * @openapi
 * /crawl-optimization/robots-rules:
 *   get:
 *     summary: Generate robots.txt rules for crawl optimization
 *     description: Generates robots.txt rules based on log analysis to block crawl budget waste
 *     tags:
 *       - Crawl Optimization
 *     responses:
 *       200:
 *         description: Generated robots.txt rules
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     robotsRules:
 *                       type: string
 *                     recommendations:
 *                       type: array
 */
router.get('/robots-rules', async (req, res) => {
  try {
    const format = req.query.format || 'json';
    
    genLog('Generating robots.txt rules for crawl optimization');
    
    const analysis = await analyzeServerLogs();
    
    if (!analysis || analysis.logFilesAnalyzed === 0) {
      const message = '# No log analysis data available\n# Configure log file paths to enable crawl budget optimization\n';
      
      if (format === 'text') {
        res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
        return res.send(message);
      }
      
      return res.json({
        success: false,
        error: 'No log files available for analysis',
        data: { robotsRules: message, recommendations: [] }
      });
    }
    
    const robotsRules = generateRobotsRules(analysis.totalAnalysis);
    const fullRules = `# Crawl Budget Optimization Rules\n# Generated on ${new Date().toISOString()}\n# Based on ${analysis.totalAnalysis.googlebotRequests} Googlebot requests\n\n${robotsRules}`;
    
    if (format === 'text') {
      res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
      res.send(fullRules);
    } else {
      res.json({
        success: true,
        data: {
          robotsRules: fullRules,
          recommendations: analysis.totalAnalysis.recommendations.filter(r => r.type === 'robots_disallow'),
          summary: analysis.totalAnalysis.summary
        }
      });
    }
    
  } catch (error) {
    genError('Failed to generate robots rules', { error: error.message });
    
    const errorMessage = `# Error generating crawl optimization rules\n# ${error.message}\n`;
    
    if (req.query.format === 'text') {
      res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
      res.status(500).send(errorMessage);
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to generate robots rules',
        message: error.message
      });
    }
  }
});

/**
 * @openapi
 * /crawl-optimization/dashboard:
 *   get:
 *     summary: Get crawl optimization dashboard data
 *     description: Returns comprehensive dashboard data for crawl budget optimization
 *     tags:
 *       - Crawl Optimization
 *     responses:
 *       200:
 *         description: Dashboard data with charts and metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                     wasteBreakdown:
 *                       type: object
 *                     topIssues:
 *                       type: array
 *                     actionItems:
 *                       type: array
 */
router.get('/dashboard', async (req, res) => {
  try {
    genLog('Generating crawl optimization dashboard');
    
    const analysis = await analyzeServerLogs();
    
    if (!analysis || analysis.logFilesAnalyzed === 0) {
      return res.json({
        success: false,
        error: 'No log files available for analysis',
        data: {
          overview: { message: 'Configure log file paths to enable analysis' },
          wasteBreakdown: {},
          topIssues: [],
          actionItems: []
        }
      });
    }
    
    const dashboard = {
      overview: {
        totalRequests: analysis.totalAnalysis.totalRequests,
        googlebotRequests: analysis.totalAnalysis.googlebotRequests,
        crawlWaste: analysis.totalAnalysis.summary.crawlBudgetWaste,
        wastePercentage: analysis.totalAnalysis.summary.wastePercentage,
        logFilesAnalyzed: analysis.logFilesAnalyzed,
        analysisDate: analysis.analysisDate
      },
      wasteBreakdown: analysis.totalAnalysis.crawlWaste,
      topIssues: analysis.totalAnalysis.recommendations.slice(0, 10),
      actionItems: analysis.totalAnalysis.recommendations
        .filter(r => r.priority === 'critical' || r.priority === 'high')
        .map(r => ({
          priority: r.priority,
          issue: r.issue,
          solution: r.solution,
          type: r.type
        })),
      topWasteUrls: analysis.totalAnalysis.topWasteUrls.slice(0, 20)
    };
    
    res.json({
      success: true,
      data: dashboard
    });
    
  } catch (error) {
    genError('Failed to generate dashboard', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to generate dashboard',
      message: error.message
    });
  }
});

export default router;
