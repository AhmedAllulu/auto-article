import express from 'express';
import fs from 'fs';
import http from 'http';
import https from 'https';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { rateLimiterMiddleware } from './middleware/rateLimiter.js';
import logger from './lib/logger.js';
import config, { validateConfig, calculateEstimatedMonthlyCost } from './config/env.js';
import { specs } from './swagger.js';

// Routes
import articlesRouter from './routes/articles.js';
import categoriesRouter from './routes/categories.js';
import { languageMiddleware } from './middleware/language.js';
import healthRouter from './routes/health.js';

// Services
import { scheduleArticleGeneration, scheduleMasterTranslationGeneration } from './services/articleGeneratorService.js';
import { startBudgetMonitoring, getCurrentBudgetStatus, getBudgetReport } from './services/budgetMonitorService.js';
import { systemHealth, quickHealthCheck } from './services/systemHealthService.js';
import { validateAITrendsService, getAITrendsStatistics } from './services/trendsService.js';

// Initialize environment
dotenv.config();

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(cors({
  origin: config.isProd ? process.env.ALLOWED_ORIGINS?.split(',') : '*',
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate limiting
app.use(rateLimiterMiddleware);

// Language negotiation for all public endpoints
app.use(languageMiddleware);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Auto Article API Documentation'
}));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    }, 'Request completed');
  });
  next();
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Quick health check
 *     description: Basic health check endpoint for load balancers and monitoring
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [HEALTHY, WARNING, CRITICAL]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 checks:
 *                   type: object
 *                 uptime:
 *                   type: number
 *       503:
 *         description: Server is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Health check endpoint (quick check for load balancers)
app.get('/health', async (req, res) => {
  try {
    const quickCheck = await quickHealthCheck();
    const statusCode = quickCheck.overallHealth === 'HEALTHY' ? 200 : 
                      quickCheck.overallHealth === 'WARNING' ? 200 : 503;
    
    res.status(statusCode).json({
      status: quickCheck.overallHealth,
      timestamp: quickCheck.timestamp,
      checks: quickCheck.checks,
      uptime: process.uptime()
    });
  } catch (err) {
    logger.error({ err }, 'Health check failed');
    res.status(503).json({
      status: 'CRITICAL',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Admin endpoints (with basic auth in production)
const adminAuth = (req, res, next) => {
  if (!config.isProd) return next();

  // In production, require a valid static admin token
  const requiredToken = config.admin?.apiToken || process.env.ADMIN_API_TOKEN || null;
  if (!requiredToken) {
    return res.status(503).json({ error: 'Admin API disabled: ADMIN_API_TOKEN not configured' });
  }

  const auth = req.get('Authorization') || '';
  const provided = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : null;
  if (!provided || provided !== requiredToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

/**
 * @swagger
 * /admin/budget:
 *   get:
 *     summary: Get budget report
 *     description: Retrieve detailed budget and token usage report for the current month
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Budget report retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BudgetReport'
 *       401:
 *         description: Unauthorized - Invalid or missing API token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Budget monitoring endpoints
app.get('/admin/budget', adminAuth, async (req, res) => {
  try {
    const budgetReport = await getBudgetReport();
    res.json(budgetReport);
  } catch (err) {
    logger.error({ err }, 'Budget report failed');
    res.status(500).json({ error: 'Failed to generate budget report' });
  }
});

/**
 * @swagger
 * /admin/budget/status:
 *   get:
 *     summary: Get budget status
 *     description: Get current budget status and remaining tokens
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Budget status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 currentTokens:
 *                   type: number
 *                   description: Current token usage this month
 *                 monthlyCap:
 *                   type: number
 *                   description: Monthly token cap
 *                 remainingTokens:
 *                   type: number
 *                   description: Remaining tokens for the month
 *                 utilization:
 *                   type: number
 *                   description: Token utilization percentage
 *       401:
 *         description: Unauthorized - Invalid or missing API token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/admin/budget/status', adminAuth, async (req, res) => {
  try {
    const status = await getCurrentBudgetStatus();
    res.json(status);
  } catch (err) {
    logger.error({ err }, 'Budget status check failed');
    res.status(500).json({ error: 'Failed to get budget status' });
  }
});

/**
 * @swagger
 * /admin/health/full:
 *   get:
 *     summary: Full system health check
 *     description: Comprehensive system health check including database, services, and dependencies
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Full health check completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 *       401:
 *         description: Unauthorized - Invalid or missing API token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// System health endpoints
app.get('/admin/health/full', adminAuth, async (req, res) => {
  try {
    const healthCheck = await systemHealth.performHealthCheck();
    const statusCode = healthCheck.overallHealth === 'HEALTHY' ? 200 :
                      healthCheck.overallHealth === 'WARNING' ? 200 : 503;
    res.status(statusCode).json(healthCheck);
  } catch (err) {
    logger.error({ err }, 'Full health check failed');
    res.status(500).json({ error: 'Health check failed' });
  }
});

/**
 * @swagger
 * /admin/health/stats:
 *   get:
 *     summary: Get health statistics
 *     description: Retrieve system health statistics and metrics
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Health statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                 memory:
 *                   type: object
 *                   description: Memory usage statistics
 *                 cpu:
 *                   type: object
 *                   description: CPU usage statistics
 *                 database:
 *                   type: object
 *                   description: Database connection statistics
 *       401:
 *         description: Unauthorized - Invalid or missing API token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/admin/health/stats', adminAuth, async (req, res) => {
  try {
    const stats = systemHealth.getHealthStats();
    res.json(stats);
  } catch (err) {
    logger.error({ err }, 'Health stats failed');
    res.status(500).json({ error: 'Failed to get health stats' });
  }
});

/**
 * @swagger
 * /admin/config:
 *   get:
 *     summary: Get system configuration
 *     description: Retrieve current system configuration and cost estimates
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 validation:
 *                   type: object
 *                   description: Configuration validation results
 *                 costEstimate:
 *                   type: object
 *                   description: Monthly cost estimates
 *                 currentConfig:
 *                   type: object
 *                   description: Current system configuration
 *       401:
 *         description: Unauthorized - Invalid or missing API token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Configuration and cost estimation endpoint
app.get('/admin/config', adminAuth, async (req, res) => {
  try {
    const validation = validateConfig();
    const costEstimate = calculateEstimatedMonthlyCost();
    
    res.json({
      validation,
      costEstimate,
      currentConfig: {
        dailyTarget: config.generation.dailyTarget,
        monthlyTokenCap: config.generation.monthlyTokenCap,
        languages: config.languages,
        categories: config.topCategories,
        budgetMode: config.generation.budgetMode,
        trendsEnabled: config.trends.enabled
      }
    });
  } catch (err) {
    logger.error({ err }, 'Config check failed');
    res.status(500).json({ error: 'Failed to check configuration' });
  }
});

/**
 * @swagger
 * /admin/generate:
 *   post:
 *     summary: Manually trigger article generation
 *     description: Manually trigger the generation of articles with optional parameters
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerationRequest'
 *     responses:
 *       200:
 *         description: Article generation completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenerationResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing API token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Manual generation trigger (admin only)
app.post('/admin/generate', adminAuth, async (req, res) => {
  try {
    if (!config.features?.enableGeneration) {
      return res.status(403).json({ success: false, error: 'Generation is disabled by configuration' });
    }
    const { 
      batchSize = 1, 
      language = null, 
      category = null,
      forceHighValue = false 
    } = req.body;

    // Import the manual generation function
    const { triggerProfitableGeneration } = await import('./services/articleGeneratorService.js');
    
    const results = await triggerProfitableGeneration({
      batchSize: Math.min(batchSize, 10), // Max 10 for manual trigger
      forceHighValue,
      specificLanguages: language ? [language] : null,
      specificCategories: category ? [category] : null
    });

    const successful = results.filter(r => r.article).length;
    const totalTokens = results.reduce((sum, r) => sum + r.tokens, 0);

    res.json({
      success: true,
      generated: successful,
      failed: results.length - successful,
      totalTokens,
      results: results.map(r => ({
        success: !!r.article,
        title: r.article?.title || null,
        language: r.article?.language_code || null,
        tokens: r.tokens
      }))
    });
  } catch (err) {
    logger.error({ err }, 'Manual generation failed');
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// Public API routes
app.use('/v1/health', healthRouter);
app.use('/v1/categories', categoriesRouter);
app.use('/v1/articles', articlesRouter);

// Global error handler
app.use((err, req, res, next) => {
  const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  
  logger.error({ 
    err: err.message,
    stack: err.stack,
    errorId,
    url: req.url,
    method: req.method,
    body: req.body,
    headers: req.headers
  }, 'Unhandled error');

  // Don't leak error details in production
  const message = config.isProd ? 'Internal server error' : err.message;
  
  res.status(err.status || 500).json({ 
    error: message,
    errorId: config.isProd ? errorId : undefined
  });
});

// 404 handler (Express 5: avoid '*' which is invalid in path-to-regexp v6)
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    path: req.originalUrl
  });
});

const port = config.port;

// (Replaced below) Graceful shutdown is configured after server start

// Startup sequence
async function startServer() {
  try {
    logger.info({ 
      nodeEnv: config.nodeEnv,
      port,
      version: process.version
    }, 'Starting server...');

    // 1. Validate configuration
    logger.info('Validating configuration...');
    const configValidation = validateConfig();
    if (configValidation.errors.length > 0) {
      logger.error({ errors: configValidation.errors }, 'Configuration errors found');
      process.exit(1);
    }
    if (configValidation.warnings.length > 0) {
      logger.warn({ warnings: configValidation.warnings }, 'Configuration warnings');
    }

    // 2. Test database connection
    logger.info('Testing database connection...');
    const { pool } = await import('./db/pool.js');
    await pool.query('SELECT 1');
    logger.info('Database connection successful');

    // 3. Validate services
    logger.info('Validating services...');
    
    // Test trends service if enabled
    if (config.trends.enabled && config.features?.enableGeneration) {
      try {
        const trendsValidation = await validateAITrendsService();
        if (trendsValidation.healthy) {
          logger.info('Google Trends service validated successfully');
        } else {
          logger.warn('Google Trends service validation failed - will use fallback');
        }
      } catch (err) {
        logger.warn({ err }, 'Google Trends validation failed - will use fallback');
      }
    }

    // 4. Calculate cost estimates
    const costEstimate = calculateEstimatedMonthlyCost();
    logger.info({
      estimatedMonthlyTokens: costEstimate.estimatedMonthlyTokens.toLocaleString(),
      tokenCapUtilization: `${costEstimate.tokenCapUtilization.toFixed(1)}%`,
      isWithinBudget: costEstimate.isWithinBudget,
      recommendedDailyTarget: costEstimate.recommendedDailyTarget
    }, 'Monthly cost estimate');

    if (!costEstimate.isWithinBudget) {
      logger.warn({
        currentTarget: config.generation.dailyTarget,
        recommendedTarget: costEstimate.recommendedDailyTarget
      }, 'Daily target may exceed monthly budget - consider adjustment');
    }

    // 5. Start server (HTTPS if configured and certs available; otherwise HTTP)
    let server;
    const sslKeyPath = config.ssl?.keyPath || process.env.SSL_KEY_PATH;
    const sslCertPath = config.ssl?.certPath || process.env.SSL_CERT_PATH;
    const enableHttps = config.ssl?.enableHttps !== false; // default true

    if (enableHttps && sslKeyPath && sslCertPath) {
      try {
        const options = {
          key: fs.readFileSync(sslKeyPath),
          cert: fs.readFileSync(sslCertPath),
        };
        server = https.createServer(options, app).listen(port, () => {
          logger.info({ port, sslKeyPath, sslCertPath }, 'HTTPS server started successfully');
        });
      } catch (err) {
        logger.error({ err, sslKeyPath, sslCertPath }, 'Failed to start HTTPS server, falling back to HTTP');
        server = http.createServer(app).listen(port, () => {
          logger.info({ port }, 'HTTP server started successfully');
        });
      }
    } else {
      server = http.createServer(app).listen(port, () => {
        logger.info({ port }, 'HTTP server started successfully');
      });
    }

    // 6. Start background services
    logger.info('Starting background services...');
    
    // Start budget monitoring
    const { intervalTask, dailyTask } = startBudgetMonitoring();
    logger.info('Budget monitoring service started');

    // Start generation scheduler (choose mode) — gated by enableGeneration
    let generationTask = null;
    let masterTranslationTask = null;
    if (config.features?.enableGeneration) {
      if (config.features?.enableMasterTranslationMode) {
        masterTranslationTask = scheduleMasterTranslationGeneration();
        logger.info('Master+Translation scheduler started');
      } else {
        generationTask = scheduleArticleGeneration();
        logger.info('Article generation scheduler started');
      }
    } else {
      logger.warn('Article generation is disabled by feature flag ENABLE_GENERATION=false');
    }

    // If trends cache is already warm at startup, trigger a small immediate generation
    setTimeout(async () => {
      try {
        if (!config.features?.enableGeneration || !config.features?.enableImmediateGenerationOnStart) {
          logger.info('Immediate generation on start is disabled by feature flags');
          return;
        }
        const trendsStats = await getAITrendsStatistics();
        if (trendsStats.cacheSize && trendsStats.cacheSize > 0) {
          logger.info({ cacheSize: trendsStats.cacheSize }, 'Trends cache detected at startup; triggering immediate generation');
          const { triggerProfitableGeneration } = await import('./services/articleGeneratorService.js');
          const initialBatchSize = Math.min(config.generation.maxBatchPerRun, 3);
          await triggerProfitableGeneration({ batchSize: initialBatchSize });
        } else {
          logger.info('No trends cache present at startup; skipping immediate generation');
        }
      } catch (err) {
        logger.warn({ err }, 'Startup immediate generation skipped due to error');
      }
    }, 3000);

    // 7. Perform initial health check
    setTimeout(async () => {
      try {
        const healthCheck = await systemHealth.performHealthCheck();
        logger.info({
          overallHealth: healthCheck.overallHealth,
          issueCount: healthCheck.issues.length,
          checksCompleted: Object.keys(healthCheck.checks).length
        }, 'Initial system health check completed');
      } catch (err) {
        logger.error({ err }, 'Initial health check failed');
      }
    }, 5000); // Wait 5 seconds for services to initialize

    // 8. Setup graceful shutdown
    server.on('close', () => {
      logger.info('HTTP server closed');
    });

    const cleanup = async () => {
      try {
        logger.info('Cleaning up background tasks...');
        try { generationTask?.stop(); } catch (_) {}
        try { masterTranslationTask?.stop(); } catch (_) {}
        try { intervalTask?.stop(); } catch (_) {}
        try { dailyTask?.stop(); } catch (_) {}
        const { pool } = await import('./db/pool.js');
        try { await pool.end(); } catch (_) {}
        logger.info('Cleanup complete');
      } catch (err) {
        logger.error({ err }, 'Cleanup failed');
      } finally {
        process.exit(0);
      }
    };

    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);

    logger.info({
      environment: config.nodeEnv,
      budgetMode: config.generation.budgetMode,
      trendsEnabled: config.trends.enabled,
      dailyTarget: config.generation.dailyTarget,
      monthlyTokenCap: config.generation.monthlyTokenCap.toLocaleString(),
      supportedLanguages: config.languages.length,
      supportedCategories: config.topCategories.length
    }, 'Server startup completed successfully');

  } catch (err) {
    logger.error({ err }, 'Server startup failed');
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;