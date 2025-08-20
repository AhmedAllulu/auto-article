# Smart Sitemap Priority & Freshness System

This document explains the intelligent priority and changefreq calculation system implemented for SEO optimization.

## Overview

Instead of using static priority values, the system dynamically calculates priority and changefreq based on:
- **Content freshness** (how recently published)
- **Category importance** (business value of content type)
- **Content type** (static pages vs dynamic articles)

## Priority Calculation

### Article Priority Formula
```
Final Priority = Base Category Priority × Freshness Factor
```

### Category Base Priorities
```javascript
const CATEGORY_PRIORITY_WEIGHTS = {
  'technology': 1.0,    // Highest priority - trending content
  'business': 0.95,     // High priority - valuable content
  'finance': 0.95,      // High priority - valuable content
  'health': 0.9,        // Important evergreen content
  'science': 0.85,      // Quality evergreen content
  'education': 0.8,     // Valuable evergreen content
  'travel': 0.75,       // Seasonal/trending content
  'sports': 0.7,        // Time-sensitive content
  'entertainment': 0.65, // Lower priority content
  'lifestyle': 0.6,     // Lower priority content
  'default': 0.7        // Fallback for unknown categories
};
```

### Freshness Boost Factors
- **Within 1 hour**: 1.3× boost (brand new content)
- **Within 6 hours**: 1.2× boost (very fresh)
- **Within 24 hours**: 1.1× boost (fresh)
- **Within 1 week**: 1.05× boost (recent)
- **Within 1 month**: 1.0× (normal)
- **1-3 months**: 0.95× (slightly lower)
- **Older than 3 months**: 0.9× (older content)

### Static Page Priorities
- **Homepage**: 1.0 (maximum priority)
- **Categories**: 0.9 (high priority)
- **Contact**: 0.6 (important but static)
- **About**: 0.5 (informational)
- **FAQ**: 0.4 (helpful but static)
- **Legal pages**: 0.3 (required but low priority)

## Change Frequency Rules

### Base Frequencies by Category
```javascript
const CHANGEFREQ_RULES = {
  // Time-sensitive content
  'breaking': 'hourly',
  'news': 'daily',
  'technology': 'daily',
  'business': 'daily',
  'finance': 'daily',
  
  // Evergreen content
  'education': 'weekly',
  'health': 'weekly',
  'travel': 'monthly',
  'lifestyle': 'monthly',
  
  'default': 'weekly'
};
```

### Age-Based Frequency Adjustment
- **Within 6 hours**: `hourly` (very fresh content)
- **Within 24 hours**: `daily` (fresh content)
- **Within 1 week**: Base frequency or upgraded
- **Within 1 month**: Base frequency
- **Older content**: Downgraded frequency

### Static Page Frequencies
- **Homepage**: `hourly` (constantly updated)
- **Categories**: `daily` (new articles added)
- **About/Contact**: `monthly` (rarely change)
- **Legal pages**: `yearly` (very stable)

## Examples

### New Technology Article (1 hour old)
```xml
<url>
  <loc>https://vivaverse.top/en/article/ai-breakthrough-2025</loc>
  <lastmod>2025-08-20T10:00:00Z</lastmod>
  <changefreq>hourly</changefreq>
  <priority>1.0</priority>  <!-- 1.0 × 1.3 = 1.3, capped at 1.0 -->
</url>
```

### Week-Old Health Article
```xml
<url>
  <loc>https://vivaverse.top/en/article/healthy-diet-tips</loc>
  <lastmod>2025-08-13T10:00:00Z</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.9</priority>  <!-- 0.9 × 1.05 = 0.945, rounded to 0.9 -->
</url>
```

### 6-Month-Old Travel Article
```xml
<url>
  <loc>https://vivaverse.top/en/article/paris-travel-guide</loc>
  <lastmod>2025-02-20T10:00:00Z</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>  <!-- 0.75 × 0.9 = 0.675, rounded to 0.7 -->
</url>
```

### Technology Category Page
```xml
<url>
  <loc>https://vivaverse.top/en/category/technology</loc>
  <lastmod>2025-08-20T10:00:00Z</lastmod>
  <changefreq>daily</changefreq>
  <priority>1.0</priority>  <!-- 1.0 + 0.1 = 1.1, capped at 1.0 -->
</url>
```

## Benefits for SEO

### 1. Crawler Efficiency
- **High-priority fresh content** gets crawled first
- **Time-sensitive content** marked as `hourly` for rapid indexing
- **Stable content** marked appropriately to avoid unnecessary crawling

### 2. Search Engine Signals
- **Priority hints** help search engines understand content importance
- **Changefreq hints** indicate update expectations
- **Fresh lastmod** signals active content management

### 3. Competitive Advantage
- **Breaking news** gets maximum priority (1.0) and hourly frequency
- **Trending topics** (technology, business) get priority boost
- **Evergreen content** maintains appropriate baseline priority

## Implementation Details

### Database Queries
The system fetches additional data for smart calculations:
```sql
SELECT a.slug, a.published_at, a.created_at, c.slug AS category_slug
FROM articles a
LEFT JOIN categories c ON c.id = a.category_id
ORDER BY COALESCE(a.published_at, a.created_at) DESC
```

### Performance Considerations
- **Calculations are fast** - simple math operations
- **Database queries optimized** - minimal additional overhead
- **Caching friendly** - results can be cached with TTL

### Monitoring
Monitor sitemap generation logs for:
- Priority distribution across content
- Changefreq patterns by category
- Performance impact of calculations

## Configuration

### Adjusting Category Priorities
Edit `CATEGORY_PRIORITY_WEIGHTS` in `/src/routes/seo.js`:
```javascript
const CATEGORY_PRIORITY_WEIGHTS = {
  'your-category': 0.95,  // Adjust as needed
  // ...
};
```

### Adjusting Freshness Factors
Modify the `calculateArticlePriority` function to change:
- Time thresholds (1 hour, 6 hours, etc.)
- Boost multipliers (1.3×, 1.2×, etc.)
- Decay rates for older content

### Adding New Categories
1. Add to `CATEGORY_PRIORITY_WEIGHTS`
2. Add to `CHANGEFREQ_RULES` if needed
3. Test with sample content

## Best Practices

### For News Sites
- Set breaking news category to priority 1.0
- Use `hourly` changefreq for time-sensitive content
- Boost freshness factors for rapid indexing

### For Evergreen Content
- Use appropriate base priorities (0.7-0.9)
- Set realistic changefreq (`weekly` or `monthly`)
- Don't over-optimize older content

### For E-commerce
- Product pages: high priority, daily changefreq
- Category pages: very high priority, daily changefreq
- Static pages: appropriate priority, monthly changefreq

## Validation

### Google Search Console
Monitor for:
- Faster indexing of new content
- Improved crawl efficiency
- Better priority distribution

### Bing Webmaster Tools
Check for:
- IndexNow submission success
- Sitemap processing status
- Crawl frequency improvements

The smart priority system ensures search engines focus on your most important and freshest content first!
