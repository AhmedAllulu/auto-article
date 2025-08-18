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

import { runGenerationBatch } from './services/generation.js';
import { runOptimizedGeneration } from './services/optimizedGeneration.js';
import { genLog, genError, cleanupOldLogs } from './services/logger.js';
import { updateTrendingScores } from './services/viewTracker.js';
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

// Enhanced scheduler with optimized generation and error handling
async function ensureDailyQuota() {
  try {
    genLog('Starting daily quota check');
    
    // Check current progress
    const { rows } = await query(
      `SELECT num_articles_generated, num_articles_target FROM generation_jobs WHERE job_date = CURRENT_DATE`
    );
    const generated = rows[0]?.num_articles_generated || 0;
    const target = rows[0]?.num_articles_target || config.generation.dailyTarget;
    
    genLog('Daily quota status', { generated, target, remaining: target - generated });
    
    if (generated >= target) {
      genLog('Daily quota already met');
      return { status: 'quota_met', generated, target };
    }
    
    // Use optimized generation system
    const result = await runOptimizedGeneration();
    
    if (result.error) {
      genError('Generation batch failed with error', { 
        error: result.error,
        generated: result.generated || 0
      });
      // Don't continue processing to avoid wasting tokens
      return { status: 'error', error: result.error, generated: result.generated || 0 };
    }
    
    if (result.skipped) {
      genLog('Generation batch skipped', { reason: result.reason });
      return { status: 'skipped', reason: result.reason };
    }
    
    genLog('Generation batch completed successfully', {
      generated: result.generated,
      processedCategories: result.processedCategories,
      categoriesRemaining: result.categoriesRemaining
    });
    
    return { 
      status: 'success', 
      generated: result.generated,
      processedCategories: result.processedCategories,
      categoriesRemaining: result.categoriesRemaining
    };
    
  } catch (error) {
    genError('Daily quota check failed', {
      error: error.message,
      stack: error.stack
    });
    // Return error status to prevent continued processing
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
  // Main generation scheduler - runs every 30 minutes during optimal hours
  cron.schedule(config.generation.cronSchedule || '*/30 6-11 * * 2-4', async () => {
    try {
      const result = await ensureDailyQuota();
      if (result.status === 'error' || result.status === 'critical_error') {
        genError('Generation scheduler stopped due to error', result);
        // Don't schedule next run if there's an error
        return;
      }
    } catch (error) {
      genError('Generation scheduler error', { error: error.message });
    }
  });
  
  // Log cleanup scheduler - runs daily at 2 AM
  cron.schedule('0 2 * * *', dailyLogCleanup);
  
  // Trending scores update scheduler - runs every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    try {
      genLog('Updating trending scores...');
      await updateTrendingScores();
      genLog('Trending scores updated successfully');
    } catch (error) {
      genError('Trending scores update failed', { error: error.message }, false);
    }
  });
  
  genLog('Schedulers initialized', {
    generationSchedule: config.generation.cronSchedule || '*/30 6-11 * * 2-4',
    logCleanupSchedule: '0 2 * * *',
    trendingScoresSchedule: '*/30 * * * *'
  });
}

// Kick off on server start
if (config.generation.enabled) {
  ensureDailyQuota().catch(() => {});
}

function startServer() {
  if (isProduction && config.https.certPath && config.https.keyPath) {
    const cert = fs.readFileSync(config.https.certPath);
    const key = fs.readFileSync(config.https.keyPath);
    https.createServer({ key, cert }, app).listen(config.port, () => {
      logger.info(`HTTPS server listening on ${config.port}`);
    });
  } else {
    app.listen(config.port, () => {
      logger.info(`HTTP server listening on ${config.port}`);
    });
  }
}

startServer();


