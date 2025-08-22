#!/usr/bin/env node

/**
 * RSS Validation Fixes Test Script
 * Tests the specific RSS validation issues that were reported
 * Usage: node scripts/validate-rss-fixes.js
 */

const BASE_URL = process.env.CANONICAL_BASE_URL || 'http://localhost:3000';

/**
 * Test RSS feed for specific validation issues
 */
async function validateRssFeed(feedUrl, description) {
  console.log(`\n🔍 Testing: ${description}`);
  console.log(`URL: ${feedUrl}`);
  
  try {
    const response = await fetch(feedUrl);
    
    if (!response.ok) {
      console.log(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      return { success: false, error: `HTTP ${response.status}` };
    }
    
    const rssContent = await response.text();
    
    // Test 1: Self-reference URL matches document location
    const selfRefMatch = rssContent.match(/<atom:link href="([^"]*)" rel="self"/);
    const selfRefUrl = selfRefMatch ? selfRefMatch[1] : null;
    
    console.log(`📍 Self-reference URL: ${selfRefUrl}`);
    console.log(`📍 Requested URL: ${feedUrl}`);
    
    const selfRefMatches = selfRefUrl === feedUrl;
    console.log(`✅ Self-reference matches: ${selfRefMatches ? '✅ YES' : '❌ NO'}`);
    
    // Test 2: Check for script tags in content
    const scriptTagCount = (rssContent.match(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi) || []).length;
    console.log(`🚫 Script tags found: ${scriptTagCount} ${scriptTagCount === 0 ? '✅' : '❌'}`);
    
    // Test 3: Check for unescaped ampersands
    const unescapedAmpersands = (rssContent.match(/&(?![a-zA-Z][a-zA-Z0-9]*;|#[0-9]+;|#x[0-9a-fA-F]+;)/g) || []).length;
    console.log(`🔤 Unescaped ampersands: ${unescapedAmpersands} ${unescapedAmpersands === 0 ? '✅' : '❌'}`);
    
    // Test 4: Basic RSS structure validation
    const hasXmlDeclaration = rssContent.includes('<?xml version="1.0"');
    const hasRssRoot = rssContent.includes('<rss version="2.0"');
    const hasChannel = rssContent.includes('<channel>');
    const hasTitle = rssContent.includes('<title>');
    const hasDescription = rssContent.includes('<description>');
    
    console.log(`📋 XML Declaration: ${hasXmlDeclaration ? '✅' : '❌'}`);
    console.log(`📋 RSS 2.0 Root: ${hasRssRoot ? '✅' : '❌'}`);
    console.log(`📋 Channel Element: ${hasChannel ? '✅' : '❌'}`);
    console.log(`📋 Title Element: ${hasTitle ? '✅' : '❌'}`);
    console.log(`📋 Description Element: ${hasDescription ? '✅' : '❌'}`);
    
    // Count items
    const itemCount = (rssContent.match(/<item>/g) || []).length;
    console.log(`📰 Articles: ${itemCount} items`);
    
    // Overall validation
    const isValid = selfRefMatches && 
                   scriptTagCount === 0 && 
                   unescapedAmpersands === 0 && 
                   hasXmlDeclaration && 
                   hasRssRoot && 
                   hasChannel && 
                   hasTitle && 
                   hasDescription;
    
    console.log(`🎯 Overall Validation: ${isValid ? '✅ PASSED' : '❌ FAILED'}`);
    
    return {
      success: true,
      validation: {
        selfRefMatches,
        scriptTagCount,
        unescapedAmpersands,
        hasXmlDeclaration,
        hasRssRoot,
        hasChannel,
        hasTitle,
        hasDescription,
        itemCount,
        isValid
      }
    };
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Main validation function
 */
async function validateRssFixes() {
  console.log('🔧 RSS Validation Fixes Test');
  console.log('============================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('\nTesting the specific issues that were reported:');
  console.log('1. Self reference doesn\'t match document location');
  console.log('2. content:encoded should not contain script tag');
  console.log('3. Invalid HTML: Named entity expected');

  const testFeeds = [
    {
      url: `${BASE_URL}/api/feeds/technology.rss`,
      description: 'Technology feed (default)'
    },
    {
      url: `${BASE_URL}/api/feeds/technology.rss?lang=de`,
      description: 'Technology feed (German)'
    },
    {
      url: `${BASE_URL}/api/feeds/all.rss?lang=fr`,
      description: 'Main feed (French)'
    },
    {
      url: `${BASE_URL}/api/feeds/health-wellness.rss?lang=es`,
      description: 'Health & Wellness feed (Spanish)'
    },
    {
      url: `${BASE_URL}/api/feeds/all.rss`,
      description: 'Main feed (default)'
    }
  ];

  const results = [];
  let totalTests = 0;
  let passedTests = 0;

  for (const feed of testFeeds) {
    const result = await validateRssFeed(feed.url, feed.description);
    results.push({ ...feed, result });
    
    totalTests++;
    if (result.success && result.validation?.isValid) {
      passedTests++;
    }
  }

  // Summary
  console.log('\n📊 Validation Summary');
  console.log('=====================');
  console.log(`Total Feeds Tested: ${totalTests}`);
  console.log(`Validation Passed: ${passedTests}`);
  console.log(`Validation Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  // Detailed results
  console.log('\n📋 Detailed Results');
  console.log('===================');
  
  results.forEach(({ url, description, result }) => {
    const status = result.success && result.validation?.isValid ? '✅ PASSED' : '❌ FAILED';
    console.log(`${status} ${description}`);
    
    if (result.success && result.validation && !result.validation.isValid) {
      console.log(`   Issues:`);
      if (!result.validation.selfRefMatches) console.log(`   - Self-reference URL mismatch`);
      if (result.validation.scriptTagCount > 0) console.log(`   - ${result.validation.scriptTagCount} script tags found`);
      if (result.validation.unescapedAmpersands > 0) console.log(`   - ${result.validation.unescapedAmpersands} unescaped ampersands`);
      if (!result.validation.hasXmlDeclaration) console.log(`   - Missing XML declaration`);
      if (!result.validation.hasRssRoot) console.log(`   - Missing RSS 2.0 root`);
      if (!result.validation.hasChannel) console.log(`   - Missing channel element`);
      if (!result.validation.hasTitle) console.log(`   - Missing title element`);
      if (!result.validation.hasDescription) console.log(`   - Missing description element`);
    }
  });

  if (passedTests === totalTests) {
    console.log('\n🎉 All RSS Validation Issues Fixed!');
    console.log('===================================');
    console.log('✅ Self-reference URLs now match document locations');
    console.log('✅ Script tags removed from content:encoded');
    console.log('✅ Ampersands properly escaped');
    console.log('✅ All feeds pass RSS 2.0 validation');
    console.log('\n🚀 Ready for RSS validator submission!');
  } else {
    console.log('\n⚠️  Some validation issues remain');
    console.log('=================================');
    console.log('Please check the detailed results above for specific issues.');
  }

  return results;
}

// Run validation
validateRssFixes().catch(error => {
  console.error('Validation script failed:', error);
  process.exit(1);
});
