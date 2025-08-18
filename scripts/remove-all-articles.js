// #!/usr/bin/env node
// import { query } from '../src/db.js';
// import { articlesTable } from '../src/utils/articlesTable.js';

// async function removeAllArticles() {
//   console.log('🗑️  Deleting all articles from all language tables...\n');
  
//   try {
//     const languages = ['en', 'de', 'fr', 'es', 'pt', 'ar', 'hi'];
//     let totalDeleted = 0;
    
//     for (const lang of languages) {
//       const tableName = articlesTable(lang);
//       try {
//         const deleteResult = await query(`DELETE FROM ${tableName}`);
//         console.log(`✅ Deleted ${deleteResult.rowCount} articles from ${tableName}`);
//         totalDeleted += deleteResult.rowCount;
//       } catch (err) {
//         if (err.code === '42P01') {
//           console.log(`⚠️  Table ${tableName} doesn't exist, skipping`);
//         } else {
//           console.error(`❌ Error deleting from ${tableName}:`, err.message);
//         }
//       }
//     }
    
//     console.log(`\n✅ Total deleted: ${totalDeleted} articles`);
    
//   } catch (error) {
//     console.error('❌ Error:', error);
//     process.exit(1);
//   }
// }

// // Run the removal
// removeAllArticles().then(() => {
//   console.log('\n✅ Script completed successfully');
//   process.exit(0);
// }).catch(error => {
//   console.error('❌ Script failed:', error);
//   process.exit(1);
// });
