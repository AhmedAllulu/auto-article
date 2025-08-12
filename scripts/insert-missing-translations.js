#!/usr/bin/env node
import { query } from '../src/db.js';

async function insertMissingTranslations() {
  console.log('🔧 Inserting missing category translations...\n');
  
  try {
    // SQL query to insert all missing translations
    const insertQuery = `
      INSERT INTO category_translations (category_id, language_code, name) VALUES
      (1, 'pt', 'Technology'),
      (1, 'hi', 'Technology'),
      (2, 'pt', 'Finance'),
      (2, 'hi', 'Finance'),
      (3, 'de', 'Health'),
      (3, 'fr', 'Health'),
      (3, 'es', 'Health'),
      (3, 'pt', 'Health'),
      (3, 'hi', 'Health'),
      (4, 'de', 'Sports'),
      (4, 'fr', 'Sports'),
      (4, 'es', 'Sports'),
      (4, 'pt', 'Sports'),
      (4, 'hi', 'Sports'),
      (5, 'de', 'Entertainment'),
      (5, 'fr', 'Entertainment'),
      (5, 'es', 'Entertainment'),
      (5, 'pt', 'Entertainment'),
      (5, 'hi', 'Entertainment'),
      (6, 'de', 'Travel'),
      (6, 'fr', 'Travel'),
      (6, 'es', 'Travel'),
      (6, 'pt', 'Travel'),
      (6, 'hi', 'Travel'),
      (7, 'pt', 'Business'),
      (7, 'hi', 'Business')
      ON CONFLICT (category_id, language_code) DO NOTHING;
    `;
    
    console.log('📝 Executing bulk insert query...');
    const result = await query(insertQuery);
    
    console.log('✅ Insert completed successfully!');
    console.log(`📊 Rows affected: ${result.rowCount}`);
    
    // Verify the insert by checking current status
    console.log('\n🔍 Verifying current translation status...');
    
    const categoriesResult = await query('SELECT id, name, slug FROM categories ORDER BY id');
    const categories = categoriesResult.rows;
    
    for (const category of categories) {
      const translationsResult = await query(
        'SELECT language_code, name FROM category_translations WHERE category_id = $1 ORDER BY language_code',
        [category.id]
      );
      const translations = translationsResult.rows;
      
      console.log(`\n📁 ${category.name} (${category.slug}):`);
      console.log(`   Total translations: ${translations.length}`);
      translations.forEach(t => {
        console.log(`   ${t.language_code}: ${t.name}`);
      });
    }
    
    console.log('\n🎉 All missing translations have been added!');
    
  } catch (error) {
    console.error('❌ Error inserting translations:', error);
    process.exit(1);
  }
}

// Run the insert
insertMissingTranslations().then(() => {
  console.log('\n✅ Script completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
