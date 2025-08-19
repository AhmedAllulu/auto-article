import { query } from '../src/db.js';

async function main() {
  try {
    console.log('Checking articles table structure and data...');
    
    // Check articles_en table structure
    console.log('\n=== articles_en table structure ===');
    const articlesEnSchema = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'articles_en' 
      ORDER BY ordinal_position;
    `);
    
    if (articlesEnSchema.rows.length > 0) {
      console.log('Columns:');
      articlesEnSchema.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
      });
    }
    
    // Check sample articles data
    console.log('\n=== Sample articles_en data ===');
    const sampleArticles = await query(`
      SELECT id, title, slug, category_id
      FROM articles_en 
      ORDER BY created_at DESC 
      LIMIT 5;
    `);
    
    if (sampleArticles.rows.length > 0) {
      console.log('Sample articles:');
      sampleArticles.rows.forEach(row => {
        console.log(`  ID: ${row.id} (type: ${typeof row.id}), Title: ${row.title}, Slug: ${row.slug}, Category: ${row.category_id}`);
      });
    } else {
      console.log('No articles found');
    }
    
    // Check if there's a mapping between integer IDs and UUIDs
    console.log('\n=== Checking for integer ID patterns ===');
    const integerLikeIds = await query(`
      SELECT id, title, slug
      FROM articles_en 
      WHERE id::text ~ '^[0-9]+$'
      LIMIT 5;
    `);
    
    if (integerLikeIds.rows.length > 0) {
      console.log('Articles with integer-like UUIDs:');
      integerLikeIds.rows.forEach(row => {
        console.log(`  ID: ${row.id}, Title: ${row.title}, Slug: ${row.slug}`);
      });
    } else {
      console.log('No integer-like UUIDs found');
    }
    
    // Check categories table
    console.log('\n=== categories table structure ===');
    const categoriesSchema = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'categories' 
      ORDER BY ordinal_position;
    `);
    
    if (categoriesSchema.rows.length > 0) {
      console.log('Categories columns:');
      categoriesSchema.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
      });
    }
    
    // Check sample categories
    console.log('\n=== Sample categories data ===');
    const sampleCategories = await query(`
      SELECT id, name, slug
      FROM categories 
      LIMIT 5;
    `);
    
    if (sampleCategories.rows.length > 0) {
      console.log('Sample categories:');
      sampleCategories.rows.forEach(row => {
        console.log(`  ID: ${row.id} (type: ${typeof row.id}), Name: ${row.name}, Slug: ${row.slug}`);
      });
    }
    
  } catch (error) {
    console.error('Error checking articles:', error);
  }
  
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
