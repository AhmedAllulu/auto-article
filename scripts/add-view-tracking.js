import { query } from '../src/db.js';

async function main() {
  console.log('Adding view tracking tables...');

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
      country_code TEXT,
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
      country_code TEXT,
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
      avg_reading_time INTEGER DEFAULT 0,
      bounce_rate DECIMAL(5,2) DEFAULT 0,
      top_referrers JSONB DEFAULT '[]',
      top_countries JSONB DEFAULT '[]',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      UNIQUE(date, article_id, category_id, language_code)
    );
  `);

  // Popular Content Cache Table - for quick access to trending content
  await query(`
    CREATE TABLE IF NOT EXISTS popular_content (
      id SERIAL PRIMARY KEY,
      content_type TEXT NOT NULL, -- 'article' or 'category'
      content_id INTEGER NOT NULL,
      content_slug TEXT NOT NULL,
      title TEXT NOT NULL,
      language_code TEXT NOT NULL,
      category_id INTEGER,
      category_name TEXT,
      period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'all_time'
      total_views INTEGER DEFAULT 0,
      unique_views INTEGER DEFAULT 0,
      trending_score DECIMAL(10,2) DEFAULT 0,
      rank_position INTEGER DEFAULT 0,
      last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
      UNIQUE(content_type, content_id, language_code, period)
    );
  `);

  // Create indexes for performance
  console.log('Creating indexes for view tracking...');
  
  await query(`CREATE INDEX IF NOT EXISTS idx_article_views_article_id ON article_views(article_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_article_views_viewed_at ON article_views(viewed_at);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_article_views_daily_unique ON article_views(article_id, date(viewed_at), user_ip) WHERE is_unique_daily = true;`);
  
  await query(`CREATE INDEX IF NOT EXISTS idx_category_views_category_id ON category_views(category_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_category_views_viewed_at ON category_views(viewed_at);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_category_views_daily_unique ON category_views(category_id, date(viewed_at), user_ip) WHERE is_unique_daily = true;`);
  
  await query(`CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON daily_analytics(date);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_daily_analytics_article ON daily_analytics(article_id, date);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_daily_analytics_category ON daily_analytics(category_id, date);`);
  
  await query(`CREATE INDEX IF NOT EXISTS idx_popular_content_type_period ON popular_content(content_type, period, rank_position);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_popular_content_trending ON popular_content(trending_score DESC, period);`);

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
        console.log(`Added view counters to ${tableName}`);
      }
    } catch (err) {
      console.log(`Skipped ${tableName} (table may not exist): ${err.message}`);
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

  // Create view to get top performing content
  await query(`
    CREATE OR REPLACE VIEW top_performing_content AS
    SELECT 
      'article' as content_type,
      a.id as content_id,
      a.slug as content_slug,
      a.title,
      a.language_code,
      a.category_id,
      c.name as category_name,
      a.total_views,
      a.unique_views,
      a.trending_score,
      a.last_viewed,
      a.published_at as created_at
    FROM articles_en a
    LEFT JOIN categories c ON c.id = a.category_id
    WHERE a.total_views > 0
    
    UNION ALL
    
    SELECT 
      'category' as content_type,
      c.id as content_id,
      c.slug as content_slug,
      c.name as title,
      'en' as language_code,
      c.id as category_id,
      c.name as category_name,
      c.total_views,
      c.unique_views,
      c.trending_score,
      c.last_viewed,
      c.created_at
    FROM categories c
    WHERE c.total_views > 0
    
    ORDER BY trending_score DESC, total_views DESC;
  `);

  console.log('View tracking system setup completed!');
  console.log('');
  console.log('📊 Created Tables:');
  console.log('  • article_views - Individual article view events');
  console.log('  • category_views - Category page view events');
  console.log('  • daily_analytics - Aggregated daily statistics');
  console.log('  • popular_content - Trending content cache');
  console.log('');
  console.log('📈 Added Columns:');
  console.log('  • total_views - Total view count');
  console.log('  • unique_views - Unique visitor count');
  console.log('  • last_viewed - Last view timestamp');
  console.log('  • trending_score - Calculated trending score');
  console.log('');
  console.log('🔍 Created Indexes:');
  console.log('  • Performance indexes for fast analytics queries');
  console.log('  • Unique constraints for data integrity');
  console.log('');
  console.log('Ready to track views! 🎉');
  
  process.exit(0);
}

main().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
