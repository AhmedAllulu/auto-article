#!/usr/bin/env node
import { query } from '../src/db.js';

async function removeAllArticles() {
  console.log('🗑️  Deleting all articles...\n');
  
  try {
    // Simple delete all articles
    const deleteResult = await query('DELETE FROM articles');
    console.log(`✅ Deleted ${deleteResult.rowCount} articles`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the removal
removeAllArticles().then(() => {
  console.log('\n✅ Script completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
