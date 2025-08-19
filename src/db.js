import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.env === 'production' ? { rejectUnauthorized: false } : false,
});

export async function query(sql, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result;
  } finally {
    client.release();
  }
}

export async function withTransaction(callback) {
  const client = await pool.connect();
  let hasBegun = false;

  try {
    await client.query('BEGIN');
    hasBegun = true;

    const result = await callback(client);

    await client.query('COMMIT');
    return result;
  } catch (err) {
    if (hasBegun) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackErr) {
        // Log rollback error but don't override original error
        console.error('Transaction rollback failed:', rollbackErr.message);
      }
    }

    // Enhance error with transaction context
    const enhancedError = new Error(`Transaction failed: ${err.message}`);
    enhancedError.originalError = err;
    enhancedError.transactionRolledBack = hasBegun;

    throw enhancedError;
  } finally {
    client.release();
  }
}

/**
 * Enhanced query function with better error handling and logging
 */
export async function queryWithErrorHandling(sql, params = [], context = '') {
  const client = await pool.connect();
  const startTime = Date.now();

  try {
    const result = await client.query(sql, params);

    // Log slow queries (over 1 second)
    const executionTime = Date.now() - startTime;
    if (executionTime > 1000) {
      console.warn(`Slow query detected (${executionTime}ms)${context ? ` in ${context}` : ''}:`, {
        sql: sql.substring(0, 100) + (sql.length > 100 ? '...' : ''),
        params: params.length,
        executionTime
      });
    }

    return result;
  } catch (err) {
    // Enhanced error with query context
    const enhancedError = new Error(`Database query failed${context ? ` in ${context}` : ''}: ${err.message}`);
    enhancedError.originalError = err;
    enhancedError.sql = sql;
    enhancedError.params = params;
    enhancedError.context = context;
    enhancedError.executionTime = Date.now() - startTime;

    throw enhancedError;
  } finally {
    client.release();
  }
}


