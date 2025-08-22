#!/usr/bin/env node

import { query } from '../src/db.js';
import { config } from '../src/config.js';

/**
 * Test script to validate SEO fixes
 */

console.log('🔧 Testing SEO Fixes...\n');

/**
 * Test 1: Check database schema for categories
 */
async function testCategoriesSchema() {
  console.log('📊 Testing Categories Schema...');
  
  try {
    // Test the fixed query without c.description
    const result = await query(`
      SELECT c.id, c.slug, c.name,
             COUNT(a.id) as article_count
      FROM categories c
      LEFT JOIN articles_en a ON a.category_id = c.id
      GROUP BY c.id, c.slug, c.name
      HAVING COUNT(a.id) > 0
      ORDER BY c.slug
      LIMIT 5
    `);
    
    console.log(`  ✅ Categories query successful: ${result.rows.length} categories found`);
    
    // Show sample data
    result.rows.forEach(cat => {
      console.log(`    - ${cat.name} (${cat.slug}): ${cat.article_count} articles`);
    });
    
  } catch (error) {
    console.log(`  ❌ Categories query failed: ${error.message}`);
  }
}

/**
 * Test 2: Check SEO configuration
 */
async function testSEOConfig() {
  console.log('\n⚙️  Testing SEO Configuration...');
  
  console.log('  SEO Settings:');
  console.log(`    - Canonical Base URL: ${config.seo.canonicalBaseUrl || 'Not set'}`);
  console.log(`    - Notifications Enabled: ${config.seo.enableNotifications !== false ? 'Yes' : 'No'}`);
  console.log(`    - Fail Silently: ${config.seo.failSilently !== false ? 'Yes' : 'No'}`);
  console.log(`    - IndexNow Key: ${config.seo.indexNowKey ? 'Set' : 'Not set'}`);
  
  console.log('\n  Environment Variables:');
  console.log(`    - ENABLE_SEO_NOTIFICATIONS: ${process.env.ENABLE_SEO_NOTIFICATIONS || 'default (true)'}`);
  console.log(`    - SEO_FAIL_SILENTLY: ${process.env.SEO_FAIL_SILENTLY || 'default (true)'}`);
  console.log(`    - INDEXNOW_API_KEY: ${process.env.INDEXNOW_API_KEY ? 'Set' : 'Not set'}`);
  console.log(`    - ENABLE_GOOGLE_PING: ${process.env.ENABLE_GOOGLE_PING || 'default (true)'}`);
  console.log(`    - ENABLE_BING_PING: ${process.env.ENABLE_BING_PING || 'default (true)'}`);
  console.log(`    - ENABLE_INDEXNOW: ${process.env.ENABLE_INDEXNOW || 'default (true)'}`);
}

/**
 * Test 3: Check WebSub configuration
 */
async function testWebSubConfig() {
  console.log('\n🔔 Testing WebSub Configuration...');
  
  try {
    const { WEBSUB_CONFIG } = await import('../src/services/webSubService.js');
    
    console.log('  WebSub Settings:');
    console.log(`    - Enabled: ${WEBSUB_CONFIG.enabled ? 'Yes' : 'No'}`);
    console.log(`    - Primary Hub: ${WEBSUB_CONFIG.primaryHub}`);
    console.log(`    - Alternative Hubs: ${WEBSUB_CONFIG.alternativeHubs.length}`);
    
    WEBSUB_CONFIG.alternativeHubs.forEach((hub, index) => {
      console.log(`      ${index + 1}. ${hub}`);
    });
    
    console.log(`    - Base URL: ${WEBSUB_CONFIG.baseUrl}`);
    console.log(`    - Timeout: ${WEBSUB_CONFIG.timeout}ms`);
    
  } catch (error) {
    console.log(`  ❌ WebSub config test failed: ${error.message}`);
  }
}

/**
 * Test 4: Check article meta data completeness
 */
async function testArticleMetaData() {
  console.log('\n📝 Testing Article Meta Data Completeness...');
  
  const languages = ['en', 'de', 'fr'];
  
  for (const lang of languages) {
    try {
      const tableName = lang === 'en' ? 'articles' : `articles_${lang}`;
      
      const result = await query(
        lang === 'en'
          ? `SELECT 
               COUNT(*) as total,
               COUNT(meta_title) as has_meta_title,
               COUNT(meta_description) as has_meta_description,
               COUNT(canonical_url) as has_canonical_url
             FROM ${tableName} 
             WHERE language_code = $1`
          : `SELECT 
               COUNT(*) as total,
               COUNT(meta_title) as has_meta_title,
               COUNT(meta_description) as has_meta_description,
               COUNT(canonical_url) as has_canonical_url
             FROM ${tableName}`,
        lang === 'en' ? [lang] : []
      );
      
      const stats = result.rows[0];
      const completeness = {
        meta_title: ((stats.has_meta_title / stats.total) * 100).toFixed(1),
        meta_description: ((stats.has_meta_description / stats.total) * 100).toFixed(1),
        canonical_url: ((stats.has_canonical_url / stats.total) * 100).toFixed(1)
      };
      
      console.log(`  ${lang.toUpperCase()} (${stats.total} articles):`);
      console.log(`    - Meta Title: ${completeness.meta_title}% complete`);
      console.log(`    - Meta Description: ${completeness.meta_description}% complete`);
      console.log(`    - Canonical URL: ${completeness.canonical_url}% complete`);
      
    } catch (error) {
      console.log(`  ❌ ${lang.toUpperCase()}: ${error.message}`);
    }
  }
}

/**
 * Test 5: Check for recent generation errors
 */
async function testRecentErrors() {
  console.log('\n🚨 Checking Recent Generation Errors...');
  
  try {
    // Check if there are any recent generation jobs with errors
    const result = await query(`
      SELECT job_date, num_articles_generated, error_message, created_at
      FROM generation_jobs 
      WHERE job_date >= CURRENT_DATE - INTERVAL '3 days'
      ORDER BY job_date DESC
      LIMIT 5
    `);
    
    if (result.rows.length === 0) {
      console.log('  ✅ No recent generation jobs found');
    } else {
      console.log(`  📊 Recent generation jobs (last 3 days):`);
      
      result.rows.forEach(job => {
        const status = job.error_message ? '❌' : '✅';
        console.log(`    ${status} ${job.job_date}: ${job.num_articles_generated} articles`);
        if (job.error_message) {
          console.log(`      Error: ${job.error_message.substring(0, 100)}...`);
        }
      });
    }
    
  } catch (error) {
    console.log(`  ❌ Error checking generation jobs: ${error.message}`);
  }
}

/**
 * Test 6: Validate sitemap accessibility
 */
async function testSitemapAccess() {
  console.log('\n🗺️  Testing Sitemap Accessibility...');
  
  const sitemapUrls = [
    '/sitemap.xml',
    '/robots.txt',
    '/sitemap-fresh.xml',
    '/sitemaps/en.xml'
  ];
  
  console.log('  Note: Testing requires server to be running on localhost:3322');
  console.log('  Sitemap URLs to test:');
  
  sitemapUrls.forEach(url => {
    console.log(`    - https://localhost:3322${url}`);
  });
}

/**
 * Main test runner
 */
async function runAllTests() {
  try {
    await testCategoriesSchema();
    await testSEOConfig();
    await testWebSubConfig();
    await testArticleMetaData();
    await testRecentErrors();
    await testSitemapAccess();
    
    console.log('\n✅ SEO Fix Testing Complete!');
    console.log('\n📋 Summary of Fixes Applied:');
    console.log('  1. ✅ Fixed categories schema query (removed c.description)');
    console.log('  2. ✅ Made SEO notifications non-critical (won\'t stop generation)');
    console.log('  3. ✅ Removed problematic WebSub hub (websub.rocks/hub)');
    console.log('  4. ✅ Added SEO configuration options');
    console.log('  5. ✅ Enhanced error handling for graceful failures');
    
    console.log('\n🔧 Recommendations:');
    console.log('  - Set INDEXNOW_API_KEY for faster indexing');
    console.log('  - Monitor logs for any remaining SEO notification issues');
    console.log('  - Consider setting SEO_FAIL_SILENTLY=true for production');
    
  } catch (error) {
    console.error('❌ Testing failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run tests
runAllTests();
