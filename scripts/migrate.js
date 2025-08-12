import { query } from '../src/db.js';

async function main() {
  // Base tables
  await query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS category_translations (
      id SERIAL PRIMARY KEY,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      language_code TEXT NOT NULL,
      name TEXT NOT NULL,
      UNIQUE(category_id, language_code)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS articles (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      content TEXT NOT NULL,
      summary TEXT,
      language_code TEXT NOT NULL,
      category_id INTEGER REFERENCES categories(id),
      image_url TEXT,
      meta_title TEXT,
      meta_description TEXT,
      canonical_url TEXT,
      reading_time_minutes INTEGER,
      ai_model TEXT,
      ai_prompt TEXT,
      ai_tokens_input INTEGER DEFAULT 0,
      ai_tokens_output INTEGER DEFAULT 0,
      total_tokens INTEGER DEFAULT 0,
      source_url TEXT,
      content_hash TEXT,
      published_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS generation_jobs (
      job_date DATE PRIMARY KEY,
      num_articles_target INTEGER DEFAULT 0,
      num_articles_generated INTEGER DEFAULT 0,
      started_at TIMESTAMP WITH TIME ZONE,
      finished_at TIMESTAMP WITH TIME ZONE
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS token_usage (
      day DATE PRIMARY KEY,
      tokens_input BIGINT DEFAULT 0,
      tokens_output BIGINT DEFAULT 0
    );
  `);

  // Ensure today's generation job row exists
  await query(
    `INSERT INTO generation_jobs (job_date) VALUES (CURRENT_DATE)
     ON CONFLICT (job_date) DO NOTHING`
  );

  console.log('Migration completed.');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


