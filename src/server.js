import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimiterMiddleware } from './middleware/rateLimiter.js';
import logger from './lib/logger.js';
import config, { validateConfig, calculateEstimatedMonthlyCost } from './config/env.js';

// Routes
import articlesRouter from './routes/articles.js';
import categoriesRouter from './routes/categories.js';
import healthRouter from './routes/health.js';

// Services
import { scheduleArticleGeneration } from './services/articleGeneratorService.js';
import { startBudgetMonitoring, getCurrentBudgetStatus, getBudgetReport } from './services/budgetMonitorService.js';
import { systemHealth, quickHealthCheck } from './services/systemHealthService.js';
import { validateTrendsService, getTrendsStatistics } from './services/trendsService.js';

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
  if (config.isProd) {
    const auth = req.get('Authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // In production, verify the token here
    // For now, we'll accept any bearer token
  }
  next();
};

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

app.get('/admin/budget/status', adminAuth, async (req, res) => {
  try {
    const status = await getCurrentBudgetStatus();
    res.json(status);
  } catch (err) {
    logger.error({ err }, 'Budget status check failed');
    res.status(500).json({ error: 'Failed to get budget status' });
  }
});

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

app.get('/admin/health/stats', adminAuth, async (req, res) => {
  try {
    const stats = systemHealth.getHealthStats();
    res.json(stats);
  } catch (err) {
    logger.error({ err }, 'Health stats failed');
    res.status(500).json({ error: 'Failed to get health stats' });
  }
});

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

// Manual generation trigger (admin only)
app.post('/admin/generate', adminAuth, async (req, res) => {
  try {
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

// Graceful shutdown handling
const shutdown = (signal) => {
  logger.info({ signal }, 'Received shutdown signal');
  
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

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
    if (config.trends.enabled) {
      try {
        const trendsValidation = await validateTrendsService();
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

    // 5. Start HTTP server
    const server = app.listen(port, () => {
      logger.info({ port }, 'HTTP server started successfully');
    });

    // 6. Start background services
    logger.info('Starting background services...');
    
    // Start budget monitoring
    startBudgetMonitoring();
    logger.info('Budget monitoring service started');

    // Start article generation scheduler
    scheduleArticleGeneration();
    logger.info('Article generation scheduler started');

    // If trends cache is already warm at startup, trigger a small immediate generation
    setTimeout(async () => {
      try {
        const trendsStats = await getTrendsStatistics();
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