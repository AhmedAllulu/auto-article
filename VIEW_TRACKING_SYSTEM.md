# View Tracking & Analytics System 📊

## Overview

A comprehensive view tracking and analytics system to monitor article and category performance, helping you understand what content resonates best with your audience.

## 🎯 **Features**

### **Real-time View Tracking**
- ✅ **Article Views**: Track individual article page views
- ✅ **Category Views**: Track category page visits
- ✅ **Unique Visitor Detection**: Daily and monthly unique tracking
- ✅ **Bot Filtering**: Excludes search engine bots and crawlers
- ✅ **Referrer Tracking**: See where your traffic comes from
- ✅ **Session Management**: Track user sessions and behavior

### **Advanced Analytics**
- ✅ **Trending Scores**: Algorithm-based content ranking
- ✅ **Popular Content**: Most viewed articles and categories
- ✅ **Time-based Analysis**: Daily, weekly, monthly statistics
- ✅ **Language-specific Metrics**: Performance by language
- ✅ **Category Performance**: Track which topics perform best

### **Performance Optimization**
- ✅ **Async Tracking**: Non-blocking view recording
- ✅ **Database Indexes**: Optimized for fast queries
- ✅ **Aggregated Data**: Daily analytics summaries
- ✅ **Trending Cache**: Pre-calculated popular content

## 🗄️ **Database Schema**

### **Core Tables**

#### `article_views` - Individual Article View Events
```sql
CREATE TABLE article_views (
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
```

#### `category_views` - Category Page View Events
```sql
CREATE TABLE category_views (
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
```

#### `daily_analytics` - Aggregated Daily Statistics
```sql
CREATE TABLE daily_analytics (
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `popular_content` - Trending Content Cache
```sql
CREATE TABLE popular_content (
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
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### **Enhanced Existing Tables**

Added view counters to existing tables:

#### Articles Tables (all languages)
```sql
-- Added to articles_en, articles_de, articles_fr, etc.
ALTER TABLE articles_en ADD COLUMN total_views INTEGER DEFAULT 0;
ALTER TABLE articles_en ADD COLUMN unique_views INTEGER DEFAULT 0;
ALTER TABLE articles_en ADD COLUMN last_viewed TIMESTAMP WITH TIME ZONE;
ALTER TABLE articles_en ADD COLUMN trending_score DECIMAL(10,2) DEFAULT 0;
```

#### Categories Table
```sql
ALTER TABLE categories ADD COLUMN total_views INTEGER DEFAULT 0;
ALTER TABLE categories ADD COLUMN unique_views INTEGER DEFAULT 0;
ALTER TABLE categories ADD COLUMN last_viewed TIMESTAMP WITH TIME ZONE;
ALTER TABLE categories ADD COLUMN trending_score DECIMAL(10,2) DEFAULT 0;
```

## 🚀 **Installation & Setup**

### **1. Run Database Migration**
```bash
# Navigate to your project directory
cd /var/www/html/auto-article

# Run the view tracking migration
node scripts/add-view-tracking.js
```

### **2. Restart Your Application**
```bash
# If using PM2
pm2 restart auto-article

# Or restart your Node.js process
```

### **3. Verify Installation**
```bash
# Check if tracking is working
curl http://localhost:3000/analytics/dashboard

# View real-time stats
curl http://localhost:3000/analytics/stats?period=today
```

## 📡 **API Endpoints**

### **Dashboard Analytics**
```http
GET /analytics/dashboard
```
Returns overall site analytics including today's stats, top articles, and top categories.

### **Top Performing Content**
```http
GET /analytics/top-content?limit=10&type=both&period=all_time
```
Parameters:
- `limit`: Number of items (default: 10)
- `type`: `article`, `category`, or `both`
- `period`: `daily`, `weekly`, `monthly`, `all_time`

### **Article Analytics**
```http
GET /analytics/article/{id}?language=en&period=30 days
```
Detailed analytics for a specific article.

### **Category Analytics**
```http
GET /analytics/category/{id}?period=30 days
```
Detailed analytics for a specific category.

### **Trending Content**
```http
GET /analytics/trending?limit=20&language=en
```
Currently trending articles and categories based on recent activity.

### **Site Statistics**
```http
GET /analytics/stats?period=today
```
Overall site statistics for specified period (`today`, `week`, `month`, `all_time`).

### **Popular by Category**
```http
GET /analytics/popular-by-category?language=en&limit=5
```
Top performing articles grouped by category.

### **Update Trending Scores** (Manual)
```http
POST /analytics/update-trending
```
Manually trigger trending score calculations.

## 🔧 **How It Works**

### **1. Automatic View Tracking**
- Middleware automatically tracks views on article and category pages
- Filters out bots and crawlers using User-Agent detection
- Records IP addresses, referrers, and session information
- Determines unique visitors based on IP and time period

### **2. Trending Score Algorithm**
```javascript
function calculateTrendingScore(totalViews, uniqueViews, daysOld, recentViews24h) {
  const recencyWeight = Math.max(0.1, 1 / (daysOld + 1));
  const popularityScore = Math.log(totalViews + 1) * 0.3 + Math.log(uniqueViews + 1) * 0.7;
  const recentPopularity = Math.log(recentViews24h + 1) * 2;
  
  return (popularityScore + recentPopularity) * recencyWeight;
}
```

### **3. Scheduled Tasks**
- **Trending Scores**: Updated every 30 minutes
- **Log Cleanup**: Daily at 2 AM
- **Analytics Aggregation**: Future enhancement for daily rollups

### **4. Performance Optimizations**
- Asynchronous tracking (doesn't block page loads)
- Indexed database queries for fast analytics
- Cached trending content for quick access
- Bot filtering to ensure accurate metrics

## 📊 **Analytics Dashboard Examples**

### **Today's Overview**
```json
{
  "data": {
    "overall": {
      "articles_views_today": 1250,
      "categories_views_today": 340,
      "unique_visitors_today": 890,
      "articles_views_week": 8760,
      "categories_views_week": 2100
    },
    "topArticles": [
      {
        "article_slug": "ai-revolution-2024",
        "language_code": "en",
        "views_today": 156,
        "unique_visitors": 134
      }
    ],
    "topCategories": [
      {
        "name": "Technology",
        "slug": "technology",
        "views_today": 89,
        "unique_visitors": 67
      }
    ]
  }
}
```

### **Trending Content**
```json
{
  "data": {
    "articles": [
      {
        "id": 123,
        "title": "AI Revolution in 2024",
        "slug": "ai-revolution-2024",
        "total_views": 2547,
        "unique_views": 1834,
        "trending_score": 45.67,
        "category_name": "Technology"
      }
    ],
    "categories": [
      {
        "id": 1,
        "name": "Technology",
        "slug": "technology",
        "total_views": 15678,
        "unique_views": 9876,
        "trending_score": 78.93
      }
    ]
  }
}
```

## 🎯 **Use Cases & Benefits**

### **Content Strategy Optimization**
- **Identify Top Performers**: See which articles get the most engagement
- **Category Analysis**: Understand which topics resonate with your audience
- **Language Performance**: Track which languages drive the most traffic
- **Trending Detection**: Spot content that's gaining momentum

### **SEO & Marketing Insights**
- **Referrer Analysis**: Understand your traffic sources
- **Popular Content**: Focus promotion on high-performing articles
- **Content Gaps**: Identify underperforming categories for improvement
- **Audience Behavior**: Track reading patterns and preferences

### **Performance Monitoring**
- **Real-time Metrics**: Monitor site performance as it happens
- **Historical Trends**: Track growth and changes over time
- **Unique vs Total Views**: Understand repeat visitor behavior
- **Geographic Insights**: Future enhancement for location-based analytics

## 🔒 **Privacy & Compliance**

### **Data Collection**
- **IP Addresses**: Hashed for uniqueness detection, not stored permanently
- **User Agents**: Used for bot detection and basic device insights
- **No Personal Data**: No cookies, usernames, or personal information stored
- **Referrer URLs**: Track traffic sources for analytics

### **Bot Filtering**
Automatically filters out:
- Search engine crawlers (Googlebot, Bingbot)
- Social media bots (Facebook, Twitter, LinkedIn)
- Automated tools (curl, wget, scrapers)
- Other known bot patterns

## 🛠️ **Maintenance**

### **Scheduled Maintenance**
- **Trending Scores**: Auto-updated every 30 minutes
- **Old Data Cleanup**: Configure retention periods as needed
- **Index Maintenance**: Periodic VACUUM and ANALYZE (PostgreSQL)

### **Performance Monitoring**
```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE tablename LIKE '%view%' OR tablename LIKE '%analytic%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check recent activity
SELECT 
  DATE(viewed_at) as date,
  COUNT(*) as total_views,
  COUNT(DISTINCT user_ip) as unique_visitors
FROM article_views 
WHERE viewed_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(viewed_at)
ORDER BY date DESC;
```

## 🚀 **Future Enhancements**

### **Planned Features**
- 📍 **Geographic Analytics**: Country/region-based insights
- ⏱️ **Reading Time Tracking**: Average time spent on articles
- 🔄 **Bounce Rate Analysis**: User engagement metrics
- 📱 **Device Analytics**: Mobile vs desktop performance
- 🔗 **Link Click Tracking**: Internal link performance
- 📈 **A/B Testing Framework**: Content optimization tools

### **Advanced Analytics**
- 📊 **Custom Dashboards**: Configurable analytics views
- 📧 **Email Reports**: Automated performance summaries
- 🎯 **Goal Tracking**: Conversion and engagement goals
- 🤖 **AI Insights**: Machine learning-powered recommendations

## 💡 **Best Practices**

### **Monitoring**
1. **Check Analytics Daily**: Review dashboard for trends
2. **Monitor Trending Content**: Promote high-performing articles
3. **Track Category Performance**: Optimize underperforming topics
4. **Review Traffic Sources**: Understand your audience acquisition

### **Content Strategy**
1. **Promote Trending Articles**: Boost already popular content
2. **Analyze Language Performance**: Focus on high-converting languages
3. **Category Optimization**: Invest in popular topic areas
4. **Content Calendar**: Use data to inform publishing schedule

### **Technical Maintenance**
1. **Regular Database Maintenance**: Keep indexes optimized
2. **Monitor Query Performance**: Ensure fast analytics responses
3. **Review Bot Filtering**: Update patterns as needed
4. **Backup Analytics Data**: Protect valuable insights

## 🎉 **Ready to Analyze!**

Your view tracking system is now active and collecting valuable insights about your content performance. Use the analytics endpoints to understand your audience better and optimize your content strategy for maximum engagement!

### **Quick Start Commands**
```bash
# View today's performance
curl http://localhost:3000/analytics/dashboard

# See trending content
curl http://localhost:3000/analytics/trending

# Check site statistics
curl http://localhost:3000/analytics/stats?period=week

# Monitor top content
curl http://localhost:3000/analytics/top-content?limit=5&type=article
```

Transform your data into actionable insights and watch your content performance soar! 🚀📈
