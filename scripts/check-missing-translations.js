#!/usr/bin/env node
import { query } from '../src/db.js';
import { config } from '../src/config.js';

async function checkMissingTranslations() {
  console.log('🔍 Checking for missing category translations...\n');
  
  try {
    // Get all categories
    const categoriesResult = await query('SELECT id, name, slug FROM categories ORDER BY id');
    const categories = categoriesResult.rows;
    
    if (categories.length === 0) {
      console.log('❌ No categories found in database');
      return;
    }
    
    console.log(`📊 Found ${categories.length} categories:`);
    categories.forEach(cat => {
      console.log(`   ${cat.id}. ${cat.name} (${cat.slug})`);
    });
    
    console.log(`\n🌍 Supported languages: ${config.languages.join(', ')}`);
    console.log(`\n📋 Checking translations for each category...\n`);
    
    const missingTranslations = [];
    const existingTranslations = [];
    
    for (const category of categories) {
      console.log(`\n📁 Category: ${category.name} (${category.slug})`);
      
      // Get existing translations for this category
      const translationsResult = await query(
        'SELECT language_code, name FROM category_translations WHERE category_id = $1 ORDER BY language_code',
        [category.id]
      );
      const existing = translationsResult.rows;
      
      console.log(`   Existing translations: ${existing.length > 0 ? existing.map(t => `${t.language_code} (${t.name})`).join(', ') : 'None'}`);
      
      // Check which languages are missing
      const missing = config.languages.filter(lang => 
        !existing.some(t => t.language_code === lang)
      );
      
      if (missing.length > 0) {
        console.log(`   ❌ Missing: ${missing.join(', ')}`);
        missingTranslations.push({
          category_id: category.id,
          category_name: category.name,
          category_slug: category.slug,
          missing_languages: missing
        });
      } else {
        console.log(`   ✅ All languages covered`);
      }
      
      existingTranslations.push({
        category_id: category.id,
        category_name: category.name,
        existing: existing
      });
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    
    if (missingTranslations.length === 0) {
      console.log('🎉 All categories have translations for all supported languages!');
    } else {
      console.log(`❌ Found ${missingTranslations.length} categories with missing translations:`);
      missingTranslations.forEach(item => {
        console.log(`\n   📁 ${item.category_name} (${item.category_slug})`);
        console.log(`      Missing: ${item.missing_languages.join(', ')}`);
      });
      
      console.log('\n' + '='.repeat(60));
      console.log('🔧 SQL QUERIES TO ADD MISSING TRANSLATIONS');
      console.log('='.repeat(60));
      
      // Generate SQL queries
      missingTranslations.forEach(item => {
        console.log(`\n-- Add missing translations for ${item.category_name} (${item.category_slug})`);
        item.missing_languages.forEach(lang => {
          console.log(`INSERT INTO category_translations (category_id, language_code, name) VALUES (${item.category_id}, '${lang}', '${item.category_name}');`);
        });
      });
      
      // Generate bulk insert query
      console.log('\n' + '='.repeat(60));
      console.log('🚀 BULK INSERT QUERY (all missing translations at once)');
      console.log('='.repeat(60));
      
      console.log('\nINSERT INTO category_translations (category_id, language_code, name) VALUES');
      const values = [];
      missingTranslations.forEach(item => {
        item.missing_languages.forEach(lang => {
          values.push(`(${item.category_id}, '${lang}', '${item.category_name}')`);
        });
      });
      console.log(values.join(',\n') + ';');
    }
    
    // Show existing translations summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 EXISTING TRANSLATIONS SUMMARY');
    console.log('='.repeat(60));
    
    existingTranslations.forEach(item => {
      console.log(`\n${item.category_name}:`);
      if (item.existing.length === 0) {
        console.log('   No translations found');
      } else {
        item.existing.forEach(t => {
          console.log(`   ${t.language_code}: ${t.name}`);
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking translations:', error);
    process.exit(1);
  }
}

// Run the check
checkMissingTranslations().then(() => {
  console.log('\n✅ Translation check completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
