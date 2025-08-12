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
import { runGenerationBatch } from './services/generation.js';
import { query } from './db.js';
import { openapiSpecification } from './docs/swagger.js';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const app = express();
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

// OpenAPI/Swagger endpoints
app.get('/openapi.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(openapiSpecification);
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification));

// Scheduler: continue generating until daily target is met
async function ensureDailyQuota() {
  try {
    const { rows } = await query(
      `SELECT num_articles_generated, num_articles_target FROM generation_jobs WHERE job_date = CURRENT_DATE`
    );
    const generated = rows[0]?.num_articles_generated || 0;
    const target = rows[0]?.num_articles_target || config.generation.dailyTarget;
    if (generated >= target) return;
  } catch (_) {
    // ignore, generation will upsert job row
  }
  const result = await runGenerationBatch();
  logger.info({ generated: result.generated }, 'generation batch done');
}

if (config.generation.enabled) {
  cron.schedule(config.generation.cronSchedule, () => {
    ensureDailyQuota().catch((e) => logger.warn({ err: e }, 'generation failed'));
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


