import { query } from '../src/db.js';

async function main() {
  try {
    console.log('Testing database connection...');
    
    // Test a simple query
    const result = await query('SELECT NOW() as current_time');
    console.log('Database connection successful!');
    console.log('Current time from database:', result.rows[0].current_time);
    
    // Check if articles table exists
    const articlesCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'articles'
      );
    `);
    
    console.log('Articles table exists:', articlesCheck.rows[0].exists);
    
    // Check if articles_en table exists
    const articlesEnCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'articles_en'
      );
    `);
    
    console.log('Articles_en table exists:', articlesEnCheck.rows[0].exists);
    
  } catch (error) {
    console.error('Database connection failed:', error.message);
    console.error('Make sure DATABASE_URL environment variable is set correctly.');
  }
  
  process.exit(0);
}

main();

