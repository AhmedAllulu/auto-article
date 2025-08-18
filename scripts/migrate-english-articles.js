import { query } from '../src/db.js';

async function main() {
  try {
    console.log('Starting migration of English articles...');
    
    // First, check if articles_en table exists
    const checkResult = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'articles_en'
      );
    `);
    
    if (!checkResult.rows[0].exists) {
      console.error('articles_en table does not exist. Please run create-articles-en-table.js first.');
      process.exit(1);
    }
    
    // Count English articles in the main table
    const countResult = await query(`
      SELECT COUNT(*) as count FROM articles WHERE language_code = 'en'
    `);
    
    const englishArticlesCount = parseInt(countResult.rows[0].count);
    
    if (englishArticlesCount === 0) {
      console.log('No English articles found in the main articles table.');
      return;
    }
    
    console.log(`Found ${englishArticlesCount} English articles to migrate.`);
    
    // Get all English articles from the main table
    const articlesResult = await query(`
      SELECT * FROM articles WHERE language_code = 'en' ORDER BY id
    `);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const article of articlesResult.rows) {
      try {
        // Check if article already exists in articles_en table
        const existingResult = await query(`
          SELECT id FROM articles_en WHERE slug = $1
        `, [article.slug]);
        
        if (existingResult.rowCount > 0) {
          console.log(`Skipping article "${article.title}" (slug: ${article.slug}) - already exists in articles_en`);
          skippedCount++;
          continue;
        }
        
        // Insert article into articles_en table
        await query(`
          INSERT INTO articles_en (
            id, title, slug, content, summary, language_code, category_id,
            image_url, meta_title, meta_description, canonical_url,
            reading_time_minutes, ai_model, ai_prompt, ai_tokens_input,
            ai_tokens_output, total_tokens, source_url, content_hash,
            published_at, created_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
            $15, $16, $17, $18, $19, $20, $21
          )
        `, [
          article.id, article.title, article.slug, article.content, article.summary,
          article.language_code, article.category_id, article.image_url, article.meta_title,
          article.meta_description, article.canonical_url, article.reading_time_minutes,
          article.ai_model, article.ai_prompt, article.ai_tokens_input, article.ai_tokens_output,
          article.total_tokens, article.source_url, article.content_hash,
          article.published_at, article.created_at
        ]);
        
        console.log(`Migrated article "${article.title}" (ID: ${article.id})`);
        migratedCount++;
        
      } catch (error) {
        console.error(`Error migrating article "${article.title}" (ID: ${article.id}):`, error.message);
      }
    }
    
    console.log(`\nMigration completed:`);
    console.log(`- Migrated: ${migratedCount} articles`);
    console.log(`- Skipped: ${skippedCount} articles (already existed)`);
    console.log(`- Total processed: ${migratedCount + skippedCount} articles`);
    
    if (migratedCount > 0) {
      console.log('\nNote: English articles have been copied to articles_en table.');
      console.log('You may want to delete them from the main articles table after verifying the migration.');
      console.log('To delete them, run: DELETE FROM articles WHERE language_code = \'en\';');
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();
