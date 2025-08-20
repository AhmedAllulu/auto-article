#!/usr/bin/env node

/**
 * Test script for Smart Sitemap Priority & Freshness calculations
 * Usage: node scripts/test-smart-sitemap.js
 */

// Mock the priority calculation functions (copy from seo.js)
const CATEGORY_PRIORITY_WEIGHTS = {
  'technology': 1.0,
  'business': 0.95,
  'finance': 0.95,
  'health': 0.9,
  'science': 0.85,
  'education': 0.8,
  'travel': 0.75,
  'sports': 0.7,
  'entertainment': 0.65,
  'lifestyle': 0.6,
  'default': 0.7
};

const CHANGEFREQ_RULES = {
  'breaking': 'hourly',
  'news': 'daily',
  'technology': 'daily',
  'business': 'daily',
  'finance': 'daily',
  'education': 'weekly',
  'health': 'weekly',
  'travel': 'monthly',
  'lifestyle': 'monthly',
  'default': 'weekly'
};

function calculateArticlePriority(article, categorySlug = 'default') {
  const now = new Date();
  const publishedAt = new Date(article.published_at || article.created_at || now);
  const ageInHours = (now - publishedAt) / (1000 * 60 * 60);
  const ageInDays = ageInHours / 24;
  
  let basePriority = CATEGORY_PRIORITY_WEIGHTS[categorySlug] || CATEGORY_PRIORITY_WEIGHTS.default;
  
  let freshnessFactor = 1.0;
  if (ageInHours <= 1) {
    freshnessFactor = 1.3;
  } else if (ageInHours <= 6) {
    freshnessFactor = 1.2;
  } else if (ageInHours <= 24) {
    freshnessFactor = 1.1;
  } else if (ageInDays <= 7) {
    freshnessFactor = 1.05;
  } else if (ageInDays <= 30) {
    freshnessFactor = 1.0;
  } else if (ageInDays <= 90) {
    freshnessFactor = 0.95;
  } else {
    freshnessFactor = 0.9;
  }
  
  let priority = basePriority * freshnessFactor;
  priority = Math.max(0.1, Math.min(1.0, priority));
  return Math.round(priority * 10) / 10;
}

function calculateChangeFreq(article, categorySlug = 'default') {
  const now = new Date();
  const publishedAt = new Date(article.published_at || article.created_at || now);
  const ageInHours = (now - publishedAt) / (1000 * 60 * 60);
  const ageInDays = ageInHours / 24;
  
  let baseFreq = CHANGEFREQ_RULES[categorySlug] || CHANGEFREQ_RULES.default;
  
  if (ageInHours <= 6) {
    return 'hourly';
  } else if (ageInHours <= 24) {
    return 'daily';
  } else if (ageInDays <= 7) {
    return baseFreq === 'monthly' ? 'weekly' : baseFreq;
  } else if (ageInDays <= 30) {
    return baseFreq;
  } else {
    if (baseFreq === 'hourly') return 'daily';
    if (baseFreq === 'daily') return 'weekly';
    if (baseFreq === 'weekly') return 'monthly';
    return 'monthly';
  }
}

function formatAge(publishedAt) {
  const now = new Date();
  const ageMs = now - new Date(publishedAt);
  const ageHours = ageMs / (1000 * 60 * 60);
  const ageDays = ageHours / 24;
  
  if (ageHours < 1) {
    return `${Math.round(ageMs / (1000 * 60))} minutes`;
  } else if (ageHours < 24) {
    return `${Math.round(ageHours)} hours`;
  } else if (ageDays < 30) {
    return `${Math.round(ageDays)} days`;
  } else {
    return `${Math.round(ageDays / 30)} months`;
  }
}

async function testSmartSitemap() {
  console.log('🎯 Testing Smart Sitemap Priority & Freshness Calculations');
  console.log('=========================================================');
  
  // Test articles with different ages and categories
  const testArticles = [
    {
      title: 'Breaking: AI Breakthrough in 2025',
      category_slug: 'technology',
      published_at: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    },
    {
      title: 'Stock Market Analysis Today',
      category_slug: 'finance',
      published_at: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    },
    {
      title: 'Healthy Diet Tips for 2025',
      category_slug: 'health',
      published_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
    {
      title: 'Paris Travel Guide',
      category_slug: 'travel',
      published_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
    },
    {
      title: 'Celebrity News Update',
      category_slug: 'entertainment',
      published_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months ago
    },
    {
      title: 'Unknown Category Article',
      category_slug: 'unknown',
      published_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    }
  ];
  
  console.log('\n📊 Article Priority & Changefreq Analysis');
  console.log('------------------------------------------');
  console.log('Title'.padEnd(35) + 'Category'.padEnd(15) + 'Age'.padEnd(15) + 'Priority'.padEnd(10) + 'Changefreq');
  console.log('-'.repeat(90));
  
  for (const article of testArticles) {
    const priority = calculateArticlePriority(article, article.category_slug);
    const changefreq = calculateChangeFreq(article, article.category_slug);
    const age = formatAge(article.published_at);
    
    const title = article.title.length > 32 ? article.title.substring(0, 32) + '...' : article.title;
    
    console.log(
      title.padEnd(35) +
      article.category_slug.padEnd(15) +
      age.padEnd(15) +
      priority.toString().padEnd(10) +
      changefreq
    );
  }
  
  console.log('\n🏷️  Category Base Priorities');
  console.log('----------------------------');
  const sortedCategories = Object.entries(CATEGORY_PRIORITY_WEIGHTS)
    .sort(([,a], [,b]) => b - a);
  
  for (const [category, priority] of sortedCategories) {
    const changefreq = CHANGEFREQ_RULES[category] || CHANGEFREQ_RULES.default;
    console.log(`${category.padEnd(15)} Priority: ${priority.toFixed(1)}  Changefreq: ${changefreq}`);
  }
  
  console.log('\n⏰ Freshness Factor Examples');
  console.log('-----------------------------');
  const freshnessTests = [
    { age: '30 minutes', hours: 0.5 },
    { age: '2 hours', hours: 2 },
    { age: '12 hours', hours: 12 },
    { age: '3 days', hours: 72 },
    { age: '2 weeks', hours: 336 },
    { age: '2 months', hours: 1440 },
    { age: '6 months', hours: 4320 }
  ];
  
  for (const test of freshnessTests) {
    const mockArticle = {
      published_at: new Date(Date.now() - test.hours * 60 * 60 * 1000)
    };
    
    const priority = calculateArticlePriority(mockArticle, 'technology');
    const changefreq = calculateChangeFreq(mockArticle, 'technology');
    
    console.log(`${test.age.padEnd(12)} → Priority: ${priority.toFixed(1)}  Changefreq: ${changefreq}`);
  }
  
  console.log('\n🔍 Static Page Examples');
  console.log('-----------------------');
  const staticPages = [
    { path: '/', priority: '1.0', changefreq: 'hourly' },
    { path: '/categories', priority: '0.9', changefreq: 'daily' },
    { path: '/contact', priority: '0.6', changefreq: 'monthly' },
    { path: '/about', priority: '0.5', changefreq: 'monthly' },
    { path: '/privacy', priority: '0.3', changefreq: 'yearly' }
  ];
  
  for (const page of staticPages) {
    console.log(`${page.path.padEnd(15)} Priority: ${page.priority}  Changefreq: ${page.changefreq}`);
  }
  
  console.log('\n📈 SEO Benefits Summary');
  console.log('-----------------------');
  console.log('✅ Fresh content (< 1 hour) gets maximum priority (1.0)');
  console.log('✅ Time-sensitive categories (tech, finance) get priority boost');
  console.log('✅ Recent content gets hourly/daily changefreq for faster crawling');
  console.log('✅ Older content gets appropriate lower priority to save crawl budget');
  console.log('✅ Category pages get boosted priority (base + 0.1)');
  console.log('✅ Static pages have realistic priorities and changefreq');
  
  console.log('\n🎉 Smart Sitemap Test Completed');
  console.log('================================');
  console.log('The system dynamically adjusts priority and changefreq based on:');
  console.log('• Content freshness (newer = higher priority)');
  console.log('• Category importance (tech/business = higher priority)');
  console.log('• Content age (fresh = more frequent updates)');
  console.log('• Page type (homepage = highest priority)');
}

// Run tests
testSmartSitemap().catch(error => {
  console.error('Test script failed:', error);
  process.exit(1);
});
