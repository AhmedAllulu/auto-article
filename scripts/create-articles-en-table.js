import { query } from '../src/db.js';

async function main() {
  try {
    // Check if articles_en table exists
    const checkResult = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'articles_en'
      );
    `);
    
    const tableExists = checkResult.rows[0].exists;
    
    if (!tableExists) {
      console.log('Creating articles_en table...');
      
      // Create articles_en table with the same structure as articles table
      await query(`
        CREATE TABLE articles_en (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          content TEXT NOT NULL,
          summary TEXT,
          language_code TEXT NOT NULL DEFAULT 'en',
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
      
      console.log('articles_en table created successfully!');
    } else {
      console.log('articles_en table already exists.');
    }
    
    // Check if there are any English articles in the main articles table that should be migrated
    const englishArticlesResult = await query(`
      SELECT COUNT(*) as count FROM articles WHERE language_code = 'en'
    `);
    
    const englishArticlesCount = parseInt(englishArticlesResult.rows[0].count);
    
    if (englishArticlesCount > 0) {
      console.log(`Found ${englishArticlesCount} English articles in the main articles table.`);
      console.log('You may want to migrate these to the articles_en table.');
      console.log('Run the migration script to move them: node scripts/migrate-english-articles.js');
    } else {
      console.log('No English articles found in the main articles table.');
    }
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();
