import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimiterMiddleware } from './middleware/rateLimiter.js';
import logger from './lib/logger.js';
import articlesRouter from './routes/articles.js';
import categoriesRouter from './routes/categories.js';
import healthRouter from './routes/health.js';
import { scheduleArticleGeneration } from './services/articleGeneratorService.js';
import './config/env.js';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(rateLimiterMiddleware);

app.use('/v1/health', healthRouter);
app.use('/v1/categories', categoriesRouter);
app.use('/v1/articles', articlesRouter);

app.use((err, req, res, next) => {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
});

const port = process.env.PORT ? Number(process.env.PORT) : 8080;

app.listen(port, () => {
  logger.info({ port }, 'Server started');
});

// Start scheduler after server starts
scheduleArticleGeneration();

export default app;


