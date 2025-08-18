import { query } from '../src/db.js';

async function main() {
  console.log('Adding view tracking tables (simplified)...');

  try {
    // Article Views Table - tracks individual article views
    await query(`
      CREATE TABLE IF NOT EXISTS article_views (
        id SERIAL PRIMARY KEY,
        article_id INTEGER NOT NULL,
        article_slug TEXT NOT NULL,
        language_code TEXT NOT NULL,
        category_id INTEGER,
        user_ip TEXT,
        user_agent TEXT,
        referrer TEXT,
        viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        session_id TEXT,
        is_unique_daily BOOLEAN DEFAULT true,
        is_unique_monthly BOOLEAN DEFAULT true
      );
    `);

    // Category Views Table - tracks category page views
    await query(`
      CREATE TABLE IF NOT EXISTS category_views (
        id SERIAL PRIMARY KEY,
        category_id INTEGER NOT NULL REFERENCES categories(id),
        category_slug TEXT NOT NULL,
        language_code TEXT NOT NULL,
        user_ip TEXT,
        user_agent TEXT,
        referrer TEXT,
        viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        session_id TEXT,
        is_unique_daily BOOLEAN DEFAULT true,
        is_unique_monthly BOOLEAN DEFAULT true
      );
    `);

    // Daily Analytics Aggregation Table
    await query(`
      CREATE TABLE IF NOT EXISTS daily_analytics (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        article_id INTEGER,
        article_slug TEXT,
        category_id INTEGER,
        category_slug TEXT,
        language_code TEXT NOT NULL,
        total_views INTEGER DEFAULT 0,
        unique_views INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);

    // Create basic indexes for performance
    console.log('Creating basic indexes...');
    
    await query(`CREATE INDEX IF NOT EXISTS idx_article_views_article_id ON article_views(article_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_article_views_viewed_at ON article_views(viewed_at);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_category_views_category_id ON category_views(category_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_category_views_viewed_at ON category_views(viewed_at);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON daily_analytics(date);`);

    // Add view counters to existing tables
    console.log('Adding view counters to existing tables...');
    
    // Add view counters to articles tables (all language-specific tables)
    const languages = ['en', 'de', 'fr', 'es', 'pt', 'ar', 'hi'];
    
    for (const lang of languages) {
      const tableName = `articles_${lang}`;
      try {
        // Check if table exists first
        const tableExists = await query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `, [tableName]);
        
        if (tableExists.rows[0].exists) {
          await query(`
            ALTER TABLE ${tableName} 
            ADD COLUMN IF NOT EXISTS total_views INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS unique_views INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS last_viewed TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS trending_score DECIMAL(10,2) DEFAULT 0;
          `);
          console.log(`✅ Added view counters to ${tableName}`);
        }
      } catch (err) {
        console.log(`⚠️  Skipped ${tableName}: ${err.message}`);
      }
    }

    // Add view counters to categories table
    await query(`
      ALTER TABLE categories 
      ADD COLUMN IF NOT EXISTS total_views INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS unique_views INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_viewed TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS trending_score DECIMAL(10,2) DEFAULT 0;
    `);

    console.log('');
    console.log('✅ View tracking system setup completed!');
    console.log('');
    console.log('📊 Created Tables:');
    console.log('  • article_views - Individual article view events');
    console.log('  • category_views - Category page view events');
    console.log('  • daily_analytics - Aggregated daily statistics');
    console.log('');
    console.log('📈 Added Columns:');
    console.log('  • total_views - Total view count');
    console.log('  • unique_views - Unique visitor count');
    console.log('  • last_viewed - Last view timestamp');
    console.log('  • trending_score - Calculated trending score');
    console.log('');
    console.log('🎉 Ready to track views!');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('❌ Migration failed:', e);
  process.exit(1);
});
