#!/usr/bin/env node

/**
 * Production Audit Fixes Script
 * Addresses issues found in production deployment audit
 */

const BASE_URL = process.env.CANONICAL_BASE_URL || 'https://chato-app.com:3322';

/**
 * Test database connectivity and content
 */
async function testDatabaseHealth() {
  console.log('\n🔍 Testing Database Health');
  console.log('==========================');
  
  try {
    const response = await fetch(`${BASE_URL}/debug/db-health`);
    
    if (!response.ok) {
      console.log(`❌ Database health check failed: ${response.status}`);
      return { success: false, status: response.status };
    }
    
    const data = await response.json();
    
    console.log(`✅ Database Status: ${data.status}`);
    console.log(`🔗 DB Connected: ${data.dbConnected}`);
    console.log(`📊 Categories Count: ${data.categoriesCount}`);
    console.log(`📰 Articles Count: ${data.articlesCount}`);
    
    // Identify issues
    const issues = [];
    if (data.categoriesCount == 0) {
      issues.push('No categories found in database');
    }
    if (data.articlesCount == 0) {
      issues.push('No articles found in database');
    }
    
    if (issues.length > 0) {
      console.log('\n⚠️  Database Issues Found:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    return {
      success: true,
      data,
      issues
    };
    
  } catch (error) {
    console.log(`❌ Database health test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test freshness sitemap specifically
 */
async function testFreshnessSitemap() {
  console.log('\n🚀 Testing Freshness Sitemap Fix');
  console.log('================================');
  
  try {
    const response = await fetch(`${BASE_URL}/sitemap-fresh.xml`);
    
    if (!response.ok) {
      console.log(`❌ Freshness sitemap failed: ${response.status}`);
      return { success: false, status: response.status };
    }
    
    const content = await response.text();
    const sitemapType = response.headers.get('x-sitemap-type');
    
    // Check if it's actually a freshness sitemap
    const isFreshnessSitemap = content.includes('Freshness Sitemap') || sitemapType === 'freshness';
    const isSitemapIndex = content.includes('<sitemapindex');
    
    console.log(`📄 Content Type: ${response.headers.get('content-type')}`);
    console.log(`🏷️  Sitemap Type Header: ${sitemapType || 'Not set'}`);
    console.log(`📏 Content Length: ${content.length} bytes`);
    console.log(`🚀 Is Freshness Sitemap: ${isFreshnessSitemap ? '✅ Yes' : '❌ No'}`);
    console.log(`📋 Is Sitemap Index: ${isSitemapIndex ? '⚠️  Yes (should be No)' : '✅ No'}`);
    
    if (isSitemapIndex) {
      console.log('❌ Issue: Freshness sitemap is returning sitemap index instead of fresh URLs');
      return { 
        success: false, 
        issue: 'returning_sitemap_index',
        isFreshnessSitemap,
        isSitemapIndex
      };
    }
    
    // Count URLs if it's a proper sitemap
    const urlCount = (content.match(/<url>/g) || []).length;
    console.log(`🔗 URL Count: ${urlCount}`);
    
    if (urlCount === 0) {
      console.log('⚠️  Warning: No URLs found in freshness sitemap');
    } else if (urlCount > 100) {
      console.log('⚠️  Warning: Too many URLs for optimal freshness sitemap');
    } else {
      console.log('✅ Optimal URL count for freshness sitemap');
    }
    
    return {
      success: true,
      isFreshnessSitemap,
      isSitemapIndex,
      urlCount,
      contentLength: content.length
    };
    
  } catch (error) {
    console.log(`❌ Freshness sitemap test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test RSS feeds with content validation
 */
async function testRssFeeds() {
  console.log('\n📡 Testing RSS Feeds Content');
  console.log('============================');
  
  const results = {
    feedIndex: null,
    mainFeed: null,
    categoryFeeds: []
  };
  
  try {
    // Test feed index
    const indexResponse = await fetch(`${BASE_URL}/api/feeds/index.json`);
    if (indexResponse.ok) {
      const indexData = await indexResponse.json();
      results.feedIndex = {
        success: true,
        categoriesCount: Object.keys(indexData.feeds?.categories || {}).length,
        data: indexData
      };
      
      console.log(`📋 Feed Index: ✅ Working`);
      console.log(`🏷️  Categories Available: ${results.feedIndex.categoriesCount}`);
      
      // Test category feeds
      for (const [slug, feedInfo] of Object.entries(indexData.feeds?.categories || {})) {
        try {
          const feedResponse = await fetch(feedInfo.url);
          const feedContent = await feedResponse.text();
          const itemCount = (feedContent.match(/<item>/g) || []).length;
          
          results.categoryFeeds.push({
            slug,
            success: feedResponse.ok,
            status: feedResponse.status,
            itemCount,
            title: feedInfo.title
          });
          
          console.log(`📰 ${slug}: ${feedResponse.ok ? '✅' : '❌'} (${itemCount} items)`);
          
        } catch (error) {
          results.categoryFeeds.push({
            slug,
            success: false,
            error: error.message
          });
          console.log(`📰 ${slug}: ❌ Error - ${error.message}`);
        }
      }
    } else {
      results.feedIndex = { success: false, status: indexResponse.status };
      console.log(`📋 Feed Index: ❌ Failed (${indexResponse.status})`);
    }
    
    // Test main feed
    const mainResponse = await fetch(`${BASE_URL}/api/feeds/all.rss`);
    if (mainResponse.ok) {
      const mainContent = await mainResponse.text();
      const itemCount = (mainContent.match(/<item>/g) || []).length;
      const hasWebSub = mainContent.includes('rel="hub"');
      
      results.mainFeed = {
        success: true,
        itemCount,
        hasWebSub,
        contentLength: mainContent.length
      };
      
      console.log(`📡 Main RSS Feed: ✅ Working (${itemCount} items)`);
      console.log(`🔗 WebSub Hub Links: ${hasWebSub ? '✅ Present' : '❌ Missing'}`);
      
    } else {
      results.mainFeed = { success: false, status: mainResponse.status };
      console.log(`📡 Main RSS Feed: ❌ Failed (${mainResponse.status})`);
    }
    
  } catch (error) {
    console.log(`❌ RSS feeds test failed: ${error.message}`);
  }
  
  return results;
}

/**
 * Test HTML sitemap on both backend and frontend
 */
async function testHtmlSitemaps() {
  console.log('\n🗺️  Testing HTML Sitemaps');
  console.log('=========================');
  
  const results = {
    backend: null,
    frontend: null
  };
  
  // Test backend HTML sitemap
  try {
    const backendResponse = await fetch(`${BASE_URL}/sitemap`);
    results.backend = {
      success: backendResponse.ok,
      status: backendResponse.status,
      contentType: backendResponse.headers.get('content-type')
    };
    
    if (backendResponse.ok) {
      const content = await backendResponse.text();
      results.backend.contentLength = content.length;
      results.backend.hasContent = content.includes('Site Map');
    }
    
    console.log(`🔧 Backend HTML Sitemap: ${backendResponse.ok ? '✅' : '❌'} (${backendResponse.status})`);
    
  } catch (error) {
    results.backend = { success: false, error: error.message };
    console.log(`🔧 Backend HTML Sitemap: ❌ Error - ${error.message}`);
  }
  
  // Test frontend HTML sitemap
  try {
    const frontendResponse = await fetch('https://megaquantum.net/en/sitemap');
    results.frontend = {
      success: frontendResponse.ok,
      status: frontendResponse.status,
      contentType: frontendResponse.headers.get('content-type')
    };
    
    console.log(`🌐 Frontend HTML Sitemap: ${frontendResponse.ok ? '✅' : '❌'} (${frontendResponse.status})`);
    
  } catch (error) {
    results.frontend = { success: false, error: error.message };
    console.log(`🌐 Frontend HTML Sitemap: ❌ Error - ${error.message}`);
  }
  
  return results;
}

/**
 * Generate comprehensive audit report
 */
async function generateAuditReport() {
  console.log('🔍 PRODUCTION AUDIT & FIXES REPORT');
  console.log('==================================');
  console.log(`🌐 Backend: ${BASE_URL}`);
  console.log(`🖥️  Frontend: https://megaquantum.net`);
  console.log(`📅 Date: ${new Date().toISOString()}`);
  
  const results = {
    database: await testDatabaseHealth(),
    freshnessSitemap: await testFreshnessSitemap(),
    rssFeeds: await testRssFeeds(),
    htmlSitemaps: await testHtmlSitemaps()
  };
  
  // Generate summary
  console.log('\n📊 AUDIT SUMMARY');
  console.log('================');
  
  const issues = [];
  const successes = [];
  
  // Database analysis
  if (results.database.success) {
    if (results.database.issues && results.database.issues.length > 0) {
      issues.push(...results.database.issues);
    } else {
      successes.push('Database connectivity and content');
    }
  } else {
    issues.push('Database connectivity failed');
  }
  
  // Freshness sitemap analysis
  if (results.freshnessSitemap.success && results.freshnessSitemap.isFreshnessSitemap) {
    successes.push('Freshness sitemap working correctly');
  } else if (results.freshnessSitemap.isSitemapIndex) {
    issues.push('Freshness sitemap returning sitemap index instead of fresh URLs');
  } else {
    issues.push('Freshness sitemap not working');
  }
  
  // RSS feeds analysis
  if (results.rssFeeds.mainFeed?.success) {
    if (results.rssFeeds.mainFeed.itemCount > 0) {
      successes.push(`Main RSS feed with ${results.rssFeeds.mainFeed.itemCount} items`);
    } else {
      issues.push('Main RSS feed has no content');
    }
    
    if (results.rssFeeds.mainFeed.hasWebSub) {
      successes.push('WebSub hub links present in RSS');
    } else {
      issues.push('WebSub hub links missing in RSS');
    }
  } else {
    issues.push('Main RSS feed not accessible');
  }
  
  // HTML sitemaps analysis
  if (results.htmlSitemaps.backend?.success) {
    successes.push('Backend HTML sitemap working');
  } else {
    issues.push('Backend HTML sitemap not working');
  }
  
  if (results.htmlSitemaps.frontend?.success) {
    successes.push('Frontend HTML sitemap working');
  } else {
    issues.push('Frontend HTML sitemap not working');
  }
  
  // Display results
  console.log(`✅ Working Components: ${successes.length}`);
  successes.forEach(success => console.log(`   ✅ ${success}`));
  
  console.log(`\n❌ Issues Found: ${issues.length}`);
  issues.forEach(issue => console.log(`   ❌ ${issue}`));
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('==================');
  
  if (issues.includes('No categories found in database') || issues.includes('No articles found in database')) {
    console.log('🔧 CRITICAL: Populate database with categories and articles');
    console.log('   - Add categories to the categories table');
    console.log('   - Add articles to articles_en table with proper category_id');
    console.log('   - Ensure articles have recent published_at or updated_at dates');
  }
  
  if (issues.includes('Freshness sitemap returning sitemap index instead of fresh URLs')) {
    console.log('🔧 HIGH: Fix freshness sitemap route conflict');
    console.log('   - Ensure /sitemap-fresh.xml route is properly implemented');
    console.log('   - Check route order in server.js');
    console.log('   - Verify generateFreshnessSitemap() function is working');
  }
  
  if (issues.includes('Main RSS feed has no content')) {
    console.log('🔧 HIGH: RSS feeds need content');
    console.log('   - Verify database has articles with proper category assignments');
    console.log('   - Check articlesTable() function for correct table names');
    console.log('   - Ensure articles have recent dates for freshness');
  }
  
  console.log('\n🎯 NEXT STEPS');
  console.log('=============');
  console.log('1. Fix database content issues (add categories and articles)');
  console.log('2. Restart server after fixes');
  console.log('3. Re-run this audit to verify fixes');
  console.log('4. Submit working sitemaps to Google Search Console');
  console.log('5. Monitor crawl performance improvements');
  
  return results;
}

// Run audit
generateAuditReport().catch(error => {
  console.error('Audit script failed:', error);
  process.exit(1);
});
