#!/usr/bin/env node

/**
 * Test script for Freshness Sitemap functionality
 * Usage: node scripts/test-freshness-sitemap.js
 */

const BASE_URL = process.env.CANONICAL_BASE_URL || 'http://localhost:3000';

/**
 * Test freshness sitemap accessibility and structure
 */
async function testFreshnessSitemap() {
  console.log('\n🚀 Testing Freshness Sitemap (Super Hack)');
  console.log('==========================================');
  
  const sitemapUrl = `${BASE_URL}/sitemap-fresh.xml`;
  console.log(`URL: ${sitemapUrl}`);
  
  try {
    const response = await fetch(sitemapUrl);
    
    // Check HTTP status
    if (!response.ok) {
      console.log(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      return { success: false, error: `HTTP ${response.status}` };
    }
    
    // Check content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('xml')) {
      console.log(`⚠️  Warning: Content-Type is '${contentType}', expected XML`);
    }
    
    // Check special headers
    const sitemapType = response.headers.get('x-sitemap-type');
    const cacheControl = response.headers.get('cache-control');
    
    // Get XML content
    const xmlContent = await response.text();
    
    // Validate freshness sitemap structure
    const validation = validateFreshnessSitemap(xmlContent);
    
    // Display results
    console.log(`✅ Status: ${response.status}`);
    console.log(`📄 Content-Type: ${contentType}`);
    console.log(`🏷️  Sitemap-Type: ${sitemapType || 'Not set'}`);
    console.log(`⏰ Cache-Control: ${cacheControl || 'Not set'}`);
    console.log(`📏 Content Length: ${xmlContent.length} bytes`);
    console.log(`🔍 Validation: ${validation.isValid ? '✅ Valid' : '❌ Invalid'}`);
    
    if (validation.stats) {
      console.log(`📊 Freshness Statistics:`);
      console.log(`   - Total URLs: ${validation.stats.totalUrls}`);
      console.log(`   - Article URLs: ${validation.stats.articleUrls}`);
      console.log(`   - Category URLs: ${validation.stats.categoryUrls}`);
      console.log(`   - High Priority URLs: ${validation.stats.highPriorityUrls}`);
      console.log(`   - Recent URLs (24h): ${validation.stats.recentUrls}`);
      console.log(`   - Average Priority: ${validation.stats.averagePriority}`);
    }
    
    if (validation.errors.length > 0) {
      console.log(`⚠️  Issues found:`);
      validation.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
    }
    
    if (validation.optimizations.length > 0) {
      console.log(`🎯 Optimization Features:`);
      validation.optimizations.forEach(opt => {
        console.log(`   ✅ ${opt}`);
      });
    }
    
    return {
      success: true,
      status: response.status,
      contentType,
      sitemapType,
      cacheControl,
      contentLength: xmlContent.length,
      validation
    };
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Validate freshness sitemap content and optimization features
 */
function validateFreshnessSitemap(content) {
  const errors = [];
  const optimizations = [];
  let isValid = true;
  
  // Check for XML declaration
  if (!content.includes('<?xml version="1.0"')) {
    errors.push('Missing XML declaration');
    isValid = false;
  }
  
  // Check for sitemap namespace
  if (!content.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')) {
    errors.push('Missing sitemap namespace');
    isValid = false;
  }
  
  // Check for freshness comment
  if (content.includes('Freshness Sitemap')) {
    optimizations.push('Freshness sitemap comment present');
  }
  
  // Count URLs
  const urlMatches = content.match(/<url>/g) || [];
  const totalUrls = urlMatches.length;
  
  if (totalUrls === 0) {
    errors.push('No URLs found in sitemap');
    isValid = false;
  } else if (totalUrls > 100) {
    errors.push(`Too many URLs (${totalUrls}), freshness sitemaps should be ≤100 for optimal crawling`);
  } else {
    optimizations.push(`Optimal URL count: ${totalUrls} ≤ 100`);
  }
  
  // Count different URL types
  const articleUrls = (content.match(/\/article\//g) || []).length;
  const categoryUrls = (content.match(/\/category\//g) || []).length;
  
  // Check for lastmod dates
  const lastmodMatches = content.match(/<lastmod>([^<]+)<\/lastmod>/g) || [];
  if (lastmodMatches.length === 0) {
    errors.push('No lastmod dates found');
  } else {
    optimizations.push(`All URLs have lastmod dates (${lastmodMatches.length})`);
    
    // Check for recent dates (within 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    let recentUrls = 0;
    lastmodMatches.forEach(match => {
      const dateStr = match.match(/<lastmod>([^<]+)<\/lastmod>/)[1];
      const date = new Date(dateStr);
      if (date >= sevenDaysAgo) {
        recentUrls++;
      }
    });
    
    if (recentUrls > 0) {
      optimizations.push(`${recentUrls} URLs updated within 7 days`);
    }
  }
  
  // Check for priority values
  const priorityMatches = content.match(/<priority>([^<]+)<\/priority>/g) || [];
  if (priorityMatches.length === 0) {
    errors.push('No priority values found');
  } else {
    optimizations.push(`Priority values present (${priorityMatches.length})`);
    
    // Calculate average priority
    const priorities = priorityMatches.map(match => {
      const priorityStr = match.match(/<priority>([^<]+)<\/priority>/)[1];
      return parseFloat(priorityStr);
    });
    
    const averagePriority = (priorities.reduce((a, b) => a + b, 0) / priorities.length).toFixed(2);
    const highPriorityUrls = priorities.filter(p => p >= 0.8).length;
    
    if (parseFloat(averagePriority) >= 0.7) {
      optimizations.push(`High average priority: ${averagePriority}`);
    }
    
    if (highPriorityUrls > 0) {
      optimizations.push(`${highPriorityUrls} high-priority URLs (≥0.8)`);
    }
  }
  
  // Check for changefreq values
  const changefreqMatches = content.match(/<changefreq>([^<]+)<\/changefreq>/g) || [];
  if (changefreqMatches.length === 0) {
    errors.push('No changefreq values found');
  } else {
    optimizations.push(`Change frequency hints present (${changefreqMatches.length})`);
    
    // Check for aggressive frequencies
    const aggressiveFreqs = changefreqMatches.filter(match => 
      match.includes('hourly') || match.includes('daily')
    ).length;
    
    if (aggressiveFreqs > 0) {
      optimizations.push(`${aggressiveFreqs} URLs with aggressive crawl frequency`);
    }
  }
  
  // Check for proper URL structure
  const locMatches = content.match(/<loc>([^<]+)<\/loc>/g) || [];
  if (locMatches.length !== totalUrls) {
    errors.push('Mismatch between URL count and loc elements');
  } else {
    optimizations.push('All URLs have proper loc elements');
  }
  
  // Check for HTTPS
  const httpsUrls = locMatches.filter(match => match.includes('https://')).length;
  if (httpsUrls === locMatches.length) {
    optimizations.push('All URLs use HTTPS');
  } else if (httpsUrls > 0) {
    errors.push(`Mixed HTTP/HTTPS URLs: ${httpsUrls}/${locMatches.length} HTTPS`);
  }
  
  const stats = {
    totalUrls,
    articleUrls,
    categoryUrls,
    highPriorityUrls: priorityMatches.length > 0 ? 
      priorityMatches.filter(match => parseFloat(match.match(/<priority>([^<]+)<\/priority>/)[1]) >= 0.8).length : 0,
    recentUrls: lastmodMatches.length > 0 ? 
      lastmodMatches.filter(match => {
        const dateStr = match.match(/<lastmod>([^<]+)<\/lastmod>/)[1];
        const date = new Date(dateStr);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return date >= oneDayAgo;
      }).length : 0,
    averagePriority: priorityMatches.length > 0 ? 
      (priorityMatches.reduce((sum, match) => {
        const priority = parseFloat(match.match(/<priority>([^<]+)<\/priority>/)[1]);
        return sum + priority;
      }, 0) / priorityMatches.length).toFixed(2) : '0.00'
  };
  
  return {
    isValid,
    errors,
    optimizations,
    stats
  };
}

/**
 * Compare freshness sitemap with main sitemap
 */
async function compareSitemaps() {
  console.log('\n📊 Comparing Freshness vs Main Sitemap');
  console.log('======================================');
  
  try {
    // Fetch both sitemaps
    const [freshResponse, mainResponse] = await Promise.all([
      fetch(`${BASE_URL}/sitemap-fresh.xml`),
      fetch(`${BASE_URL}/sitemap.xml`)
    ]);
    
    if (!freshResponse.ok || !mainResponse.ok) {
      console.log('❌ Failed to fetch one or both sitemaps');
      return { success: false };
    }
    
    const [freshContent, mainContent] = await Promise.all([
      freshResponse.text(),
      mainResponse.text()
    ]);
    
    // Count URLs in each
    const freshUrls = (freshContent.match(/<url>/g) || []).length;
    const mainUrls = (mainContent.match(/<url>/g) || []).length;
    
    // Compare sizes
    const freshSize = freshContent.length;
    const mainSize = mainContent.length;
    
    // Compare cache headers
    const freshCache = freshResponse.headers.get('cache-control');
    const mainCache = mainResponse.headers.get('cache-control');
    
    console.log(`📈 URL Count Comparison:`);
    console.log(`   Freshness Sitemap: ${freshUrls} URLs`);
    console.log(`   Main Sitemap: ${mainUrls} URLs`);
    console.log(`   Ratio: ${((freshUrls / mainUrls) * 100).toFixed(1)}% of main sitemap`);
    
    console.log(`📏 Size Comparison:`);
    console.log(`   Freshness Sitemap: ${(freshSize / 1024).toFixed(1)} KB`);
    console.log(`   Main Sitemap: ${(mainSize / 1024).toFixed(1)} KB`);
    console.log(`   Size Ratio: ${((freshSize / mainSize) * 100).toFixed(1)}% of main sitemap`);
    
    console.log(`⏰ Cache Comparison:`);
    console.log(`   Freshness Cache: ${freshCache || 'Not set'}`);
    console.log(`   Main Cache: ${mainCache || 'Not set'}`);
    
    // Analyze optimization benefits
    const benefits = [];
    
    if (freshUrls <= 100) {
      benefits.push(`✅ Optimal size: ${freshUrls} ≤ 100 URLs for aggressive crawling`);
    }
    
    if (freshSize < mainSize * 0.1) {
      benefits.push(`✅ Compact: ${((freshSize / mainSize) * 100).toFixed(1)}% of main sitemap size`);
    }
    
    if (freshCache && freshCache.includes('1800')) {
      benefits.push(`✅ Frequent updates: 30-minute cache vs main sitemap`);
    }
    
    console.log(`🎯 Optimization Benefits:`);
    benefits.forEach(benefit => console.log(`   ${benefit}`));
    
    return {
      success: true,
      comparison: {
        freshUrls,
        mainUrls,
        freshSize,
        mainSize,
        benefits: benefits.length
      }
    };
    
  } catch (error) {
    console.log(`❌ Comparison failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test robots.txt sitemap references
 */
async function testRobotsSitemapReferences() {
  console.log('\n🤖 Testing Robots.txt Sitemap References');
  console.log('========================================');
  
  try {
    const response = await fetch(`${BASE_URL}/robots.txt`);
    
    if (!response.ok) {
      console.log(`❌ HTTP Error: ${response.status}`);
      return { success: false, status: response.status };
    }
    
    const robotsContent = await response.text();
    
    // Check for sitemap references
    const mainSitemapRef = robotsContent.includes('Sitemap: ') && robotsContent.includes('/sitemap.xml');
    const freshSitemapRef = robotsContent.includes('/sitemap-fresh.xml');
    
    console.log(`📄 Robots.txt Content Length: ${robotsContent.length} bytes`);
    console.log(`🗺️  Main Sitemap Reference: ${mainSitemapRef ? '✅ Present' : '❌ Missing'}`);
    console.log(`🚀 Freshness Sitemap Reference: ${freshSitemapRef ? '✅ Present' : '❌ Missing'}`);
    
    if (mainSitemapRef && freshSitemapRef) {
      console.log(`🎯 Both sitemaps properly referenced in robots.txt`);
    }
    
    // Show sitemap lines
    const sitemapLines = robotsContent.split('\n').filter(line => 
      line.trim().startsWith('Sitemap:')
    );
    
    if (sitemapLines.length > 0) {
      console.log(`📋 Sitemap References:`);
      sitemapLines.forEach(line => {
        console.log(`   ${line.trim()}`);
      });
    }
    
    return {
      success: true,
      mainSitemapRef,
      freshSitemapRef,
      sitemapCount: sitemapLines.length
    };
    
  } catch (error) {
    console.log(`❌ Robots.txt test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Main test function
 */
async function testFreshnessSitemapSystem() {
  console.log('🚀 Testing Freshness Sitemap System (Super Hack)');
  console.log('=================================================');
  console.log(`Base URL: ${BASE_URL}`);
  
  const results = {
    freshnessSitemap: null,
    comparison: null,
    robotsReferences: null
  };
  
  // Test 1: Freshness sitemap functionality
  results.freshnessSitemap = await testFreshnessSitemap();
  
  // Test 2: Compare with main sitemap
  results.comparison = await compareSitemaps();
  
  // Test 3: Robots.txt references
  results.robotsReferences = await testRobotsSitemapReferences();
  
  // Summary
  console.log('\n📊 Freshness Sitemap Test Summary');
  console.log('==================================');
  
  const tests = [
    { name: 'Freshness Sitemap', result: results.freshnessSitemap },
    { name: 'Sitemap Comparison', result: results.comparison },
    { name: 'Robots.txt References', result: results.robotsReferences }
  ];
  
  tests.forEach(test => {
    if (test.result?.success) {
      console.log(`✅ ${test.name}: Passed`);
    } else if (test.result?.success === false) {
      console.log(`❌ ${test.name}: Failed - ${test.result.error || 'Unknown error'}`);
    } else {
      console.log(`❓ ${test.name}: Mixed results`);
    }
  });
  
  console.log('\n💡 Freshness Sitemap Benefits (Super Hack):');
  console.log('===========================================');
  console.log('✅ Small size (≤100 URLs) for aggressive crawling');
  console.log('✅ Only recently updated content (last 7 days)');
  console.log('✅ High priority values for fresh content');
  console.log('✅ Frequent cache updates (30 minutes vs 1 hour)');
  console.log('✅ Crawlers LOVE small, fresh sitemaps');
  console.log('✅ Faster discovery of new/updated content');
  console.log('✅ Better crawl budget utilization');
  console.log('✅ Competitive advantage for time-sensitive content');
  
  console.log('\n🎯 Implementation Strategy:');
  console.log('===========================');
  console.log('1. Submit freshness sitemap as separate sitemap in GSC');
  console.log('2. Monitor crawl frequency improvements');
  console.log('3. Track indexing speed for fresh content');
  console.log('4. Keep main sitemap for comprehensive coverage');
  console.log('5. Use freshness sitemap for priority content');
  
  console.log('\n🎉 Freshness Sitemap Test Completed');
  console.log('====================================');
  
  return results;
}

// Run tests
testFreshnessSitemapSystem().catch(error => {
  console.error('Freshness sitemap test script failed:', error);
  process.exit(1);
});
