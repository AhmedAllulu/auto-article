import { query } from '../src/db.js';

async function main() {
  try {
    console.log('Checking database schema for UUID fields...');
    
    // Check article_views table structure
    console.log('\n=== article_views table ===');
    const articleViewsSchema = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'article_views' 
      ORDER BY ordinal_position;
    `);
    
    if (articleViewsSchema.rows.length > 0) {
      console.log('Columns:');
      articleViewsSchema.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
      });
    } else {
      console.log('Table does not exist');
    }
    
    // Check category_views table structure
    console.log('\n=== category_views table ===');
    const categoryViewsSchema = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'category_views' 
      ORDER BY ordinal_position;
    `);
    
    if (categoryViewsSchema.rows.length > 0) {
      console.log('Columns:');
      categoryViewsSchema.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
      });
    } else {
      console.log('Table does not exist');
    }
    
    // Check for any UUID columns in the database
    console.log('\n=== All UUID columns in database ===');
    const uuidColumns = await query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns 
      WHERE data_type = 'uuid'
      ORDER BY table_name, column_name;
    `);
    
    if (uuidColumns.rows.length > 0) {
      console.log('UUID columns found:');
      uuidColumns.rows.forEach(row => {
        console.log(`  ${row.table_name}.${row.column_name}: ${row.data_type}`);
      });
    } else {
      console.log('No UUID columns found in database');
    }
    
    // Check recent article_views entries to see what data is being inserted
    console.log('\n=== Recent article_views entries (last 5) ===');
    try {
      const recentViews = await query(`
        SELECT id, article_id, category_id, session_id, viewed_at
        FROM article_views 
        ORDER BY viewed_at DESC 
        LIMIT 5;
      `);
      
      if (recentViews.rows.length > 0) {
        console.log('Recent entries:');
        recentViews.rows.forEach(row => {
          console.log(`  ID: ${row.id}, Article: ${row.article_id}, Category: ${row.category_id}, Session: ${row.session_id}, Time: ${row.viewed_at}`);
        });
      } else {
        console.log('No entries found');
      }
    } catch (error) {
      console.log('Error querying article_views:', error.message);
    }
    
  } catch (error) {
    console.error('Error checking schema:', error);
  }
  
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
