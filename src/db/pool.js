import pg from 'pg';
import config from '../config/env.js';
import logger from '../lib/logger.js';

const { Pool } = pg;

export const pool = new Pool({ connectionString: config.databaseUrl });

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected PG pool error');
});

export async function query(sql, params) {
  const start = Date.now();
  const res = await pool.query(sql, params);
  const duration = Date.now() - start;
  const slowThreshold = config.monitoring?.slowQueryThreshold ?? 500;
  if (duration > slowThreshold) {
    logger.warn({ duration, rowCount: res.rowCount }, 'slow query');
  }
  return res;
}


