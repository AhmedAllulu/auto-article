import fs from 'fs';
import https from 'https';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cron from 'node-cron';
import pino from 'pino';
import swaggerUi from 'swagger-ui-express';

import { config, isProduction } from './config.js';
import categoriesRoute from './routes/categories.js';
import articlesRoute from './routes/articles.js';
import jobsRoute from './routes/jobs.js';
import manualGenerateRoute from './routes/manualGenerate.js';
import generationRoute from './routes/generation.js';
import analyticsRoute from './routes/analytics.js';
import mostReadRoute from './routes/mostRead.js';

import { runDailyGeneration, runStartupGeneration } from './services/dailyGenerationService.js';
import { genLog, genError, cleanupOldLogs } from './services/logger.js';
import { updateTrendingScores } from './services/viewTracker.js';
import { validateConfigurationOnStartup } from './services/configValidator.js';
import { expressErrorHandler } from './services/errorHandler.js';
import seoRoute from './routes/seo.js';
import { query } from './db.js';
import { openapiSpecification } from './docs/swagger.js';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const app = express();

// Trust proxy for accurate IP addresses (important for view tracking)
app.set('trust proxy', true);

app.use(express.json({ limit: '1mb' }));
app.use(cors());
app.use(helmet());

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     responses:
 *       '200':
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *       '500':
 *         description: Service error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
app.get('/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', env: config.env, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'error' });
  }
});

app.use('/categories', categoriesRoute);
app.use('/articles', articlesRoute);
app.use('/jobs', jobsRoute);
app.use('/generate', manualGenerateRoute);
app.use('/generation', generationRoute);
app.use('/analytics', analyticsRoute);
app.use('/most-read', mostReadRoute);
app.use('/', seoRoute);

// OpenAPI/Swagger endpoints
app.get('/openapi.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(openapiSpecification);
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification));

// Enhanced error handling middleware
app.use(expressErrorHandler);

// Enhanced daily generation with comprehensive error handling and logging
async function ensureDailyQuota() {
  try {
    genLog('Starting enhanced daily generation process');

    // Use the new daily generation service
    const result = await runDailyGeneration();

    if (result.status === 'error') {
      genError('Daily generation failed with error', {
        error: result.message,
        details: result.details
      });
      return {
        status: 'error',
        error: result.message,
        generated: result.details.totalArticlesGenerated || 0,
        translations: result.details.totalTranslationsCompleted || 0
      };
    }

    if (result.status === 'skipped') {
      genLog('Daily generation skipped', {
        reason: result.reason,
        message: result.message
      });
      return {
        status: 'skipped',
        reason: result.reason,
        message: result.message
      };
    }

    genLog('Daily generation completed successfully', {
      status: result.status,
      articlesGenerated: result.details.totalArticlesGenerated,
      translationsCompleted: result.details.totalTranslationsCompleted,
      categoriesProcessed: result.details.categoriesProcessed.length,
      executionTimeMs: result.details.executionTimeMs
    });

    return {
      status: 'success',
      generated: result.details.totalArticlesGenerated,
      translations: result.details.totalTranslationsCompleted,
      processedCategories: result.details.categoriesProcessed.length,
      executionTimeMs: result.details.executionTimeMs
    };

  } catch (error) {
    genError('Daily generation process failed', {
      error: error.message,
      stack: error.stack
    });
    return { status: 'critical_error', error: error.message };
  }
}

// Log cleanup scheduler - runs daily at 2 AM
async function dailyLogCleanup() {
  try {
    genLog('Starting daily log cleanup');
    const cleanedCount = await cleanupOldLogs(10);
    genLog('Daily log cleanup completed', { cleanedCount });
  } catch (error) {
    genError('Daily log cleanup failed', { error: error.message }, false);
  }
}

if (config.generation.enabled) {
  // Daily article generation - runs at 10 AM EVERY DAY
  cron.schedule('0 10 * * *', async () => {
    try {
      genLog('🚀 Starting daily article generation at 10 AM');
      const result = await ensureDailyQuota();
      
      if (result.status === 'success') {
        genLog(`✅ Daily generation completed successfully: ${result.generated} articles, ${result.translations} translations`);
      } else if (result.status === 'skipped') {
        genLog(`📊 Daily generation skipped: ${result.message || result.reason}`);
      } else if (result.status === 'error' || result.status === 'critical_error') {
        genError('❌ Daily generation stopped due to error', result);
      }
    } catch (error) {
      genError('❌ Daily generation scheduler error', { error: error.message });
    }
  });
  
  // Log cleanup scheduler - runs daily at 2 AM
  cron.schedule('0 2 * * *', dailyLogCleanup);
  
  // Trending scores update scheduler - runs every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    try {
      await updateTrendingScores();
    } catch (error) {
      genError('Trending scores update failed', { error: error.message }, false);
    }
  });
  
  genLog('📅 Auto-generation schedulers initialized', {
    dailyGeneration: '0 10 * * * (10 AM daily)',
    logCleanup: '0 2 * * * (2 AM daily)',
    trendingUpdates: '*/30 * * * * (every 30 min)',
    articlesPerCategory: config.generation.articlesPerCategoryPerDay
  });
}

// Enhanced startup generation on server start
if (config.generation.enabled) {
  // Immediate startup check (conservative)
  runStartupGeneration().then(result => {
    if (result.status === 'success') {
      genLog(`🚀 Startup generation completed: ${result.details.totalArticlesGenerated} articles, ${result.details.totalTranslationsCompleted} translations`);
    } else if (result.status === 'skipped') {
      genLog(`📊 Startup generation skipped: ${result.message}`);
    } else if (result.status === 'error') {
      genError('❌ Startup generation failed', result.details);
    }
  }).catch(error => {
    genError('Startup generation error', { error: error.message }, false);
  });

  // Also schedule a delayed startup check (after 2 minutes) for additional safety
  setTimeout(async () => {
    try {
      genLog('Running delayed startup generation check');
      const result = await runStartupGeneration();
      if (result.status === 'success' && result.details.totalArticlesGenerated > 0) {
        genLog(`Delayed startup generation completed: ${result.details.totalArticlesGenerated} articles, ${result.details.totalTranslationsCompleted} translations`);
      }
    } catch (error) {
      genError('Delayed startup generation failed', { error: error.message }, false);
    }
  }, 2 * 60 * 1000); // 2 minutes delay
} else {
  genLog('⚠️  Auto-generation is DISABLED. Set ENABLE_GENERATION=true to enable automatic article generation.');
}

function startServer() {
  // Validate configuration before starting server
  if (!validateConfigurationOnStartup()) {
    console.error('❌ Server startup aborted due to configuration errors');
    process.exit(1);
  }

  if (isProduction && config.https.certPath && config.https.keyPath) {
    const cert = fs.readFileSync(config.https.certPath);
    const key = fs.readFileSync(config.https.keyPath);
    https.createServer({ key, cert }, app).listen(config.port, () => {
      logger.info(`✅ HTTPS server listening on ${config.port}`);
      genLog('Server started successfully', {
        port: config.port,
        protocol: 'HTTPS',
        generationEnabled: config.generation.enabled
      });
    });
  } else {
    app.listen(config.port, () => {
      logger.info(`✅ HTTP server listening on ${config.port}`);
      genLog('Server started successfully', {
        port: config.port,
        protocol: 'HTTP',
        generationEnabled: config.generation.enabled
      });
    });
  }
}

startServer();


