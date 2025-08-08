import dotenv from 'dotenv';
import { pool, query } from '../src/db/pool.js';
import config from '../src/config/env.js';
import logger from '../src/lib/logger.js';

dotenv.config();

const ddl = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  summary TEXT,
  language_code VARCHAR(5) NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  image_url TEXT,
  meta_title TEXT,
  meta_description TEXT,
  canonical_url TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  twitter_title TEXT,
  twitter_description TEXT,
  twitter_image TEXT,
  reading_time_minutes INTEGER,
  source_url TEXT,
  ai_model TEXT,
  ai_prompt TEXT,
  ai_tokens_input INTEGER DEFAULT 0,
  ai_tokens_output INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_language ON articles(language_code);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_created ON articles(created_at DESC);

CREATE TABLE IF NOT EXISTS token_usage (
  day DATE PRIMARY KEY,
  tokens_input INTEGER NOT NULL DEFAULT 0,
  tokens_output INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS generation_jobs (
  id SERIAL PRIMARY KEY,
  job_date DATE NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'scheduled',
  num_articles_target INTEGER NOT NULL DEFAULT 100,
  num_articles_generated INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  error TEXT
);
`;

async function seedCategories() {
  const existing = await query('SELECT COUNT(1) AS cnt FROM categories', []);
  if (Number(existing.rows[0].cnt) > 0) return;
  const names = config.topCategories.map((s) => s.trim());
  for (const name of names) {
    await query('INSERT INTO categories (name, slug) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
      name.charAt(0).toUpperCase() + name.slice(1),
      name,
    ]);
  }
}

async function run() {
  try {
    await query(ddl);
    await seedCategories();
    logger.info('Migration completed');
  } catch (err) {
    logger.error({ err }, 'Migration failed');
  } finally {
    await pool.end();
  }
}

run();


