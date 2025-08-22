#!/usr/bin/env node

/**
 * Test script for Multiple RSS Feeds
 * Usage: node scripts/test-rss-feeds.js
 */

import { config } from '../src/config.js';

const BASE_URL = process.env.CANONICAL_BASE_URL || 'http://localhost:3000';

/**
 * Fetch available RSS feeds dynamically from the API
 */
async function getAvailableFeeds() {
  try {
    const indexUrl = `${BASE_URL}/api/feeds/index.json`;
    const response = await fetch(indexUrl);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const feedIndex = await response.json();
    const feeds = {};

    // Add main feed
    if (feedIndex.feeds?.main) {
      feeds['all'] = {
        url: feedIndex.feeds.main.url,
        title: feedIndex.feeds.main.title,
        description: feedIndex.feeds.main.description
      };
    }

    // Add category feeds
    if (feedIndex.feeds?.categories) {
      for (const [slug, feedInfo] of Object.entries(feedIndex.feeds.categories)) {
        feeds[slug] = {
          url: feedInfo.url,
          title: feedInfo.title,
          description: feedInfo.description
        };
      }
    }

    return feeds;
  } catch (error) {
    console.error('Failed to fetch available feeds:', error.message);

    // Fallback to main feed only
    return {
      'all': {
        url: `${BASE_URL}/api/feeds/all.rss`,
        title: 'All Articles',
        description: 'Main feed with latest articles from all categories'
      }
    };
  }
}

/**
 * Test RSS feed accessibility and basic structure
 */
async function testRssFeed(feedKey, feedInfo) {
  console.log(`\n🔍 Testing ${feedKey} feed...`);
  console.log(`URL: ${feedInfo.url}`);
  
  try {
    const response = await fetch(feedInfo.url);
    
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
    
    // Get RSS content
    const rssContent = await response.text();
    
    // Basic RSS validation
    const validationResults = validateRssContent(rssContent, feedKey);
    
    // Display results
    console.log(`✅ Status: ${response.status}`);
    console.log(`📄 Content-Type: ${contentType}`);
    console.log(`📏 Content Length: ${rssContent.length} bytes`);
    console.log(`🔍 Validation: ${validationResults.isValid ? '✅ Valid' : '❌ Invalid'}`);
    
    if (validationResults.itemCount !== undefined) {
      console.log(`📰 Articles: ${validationResults.itemCount} items`);
    }
    
    if (validationResults.errors.length > 0) {
      console.log(`⚠️  Issues found:`);
      validationResults.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
    }
    
    return {
      success: true,
      status: response.status,
      contentType,
      contentLength: rssContent.length,
      validation: validationResults
    };
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Basic RSS content validation
 */
function validateRssContent(content, feedKey) {
  const errors = [];
  let isValid = true;
  let itemCount = 0;
  
  // Check for XML declaration
  if (!content.includes('<?xml version="1.0"')) {
    errors.push('Missing XML declaration');
    isValid = false;
  }
  
  // Check for RSS root element
  if (!content.includes('<rss version="2.0"')) {
    errors.push('Missing RSS 2.0 root element');
    isValid = false;
  }
  
  // Check for channel element
  if (!content.includes('<channel>')) {
    errors.push('Missing channel element');
    isValid = false;
  }
  
  // Check for required channel elements
  const requiredElements = ['<title>', '<description>', '<link>'];
  for (const element of requiredElements) {
    if (!content.includes(element)) {
      errors.push(`Missing required element: ${element}`);
      isValid = false;
    }
  }
  
  // Check for self-referencing atom:link
  if (!content.includes('atom:link')) {
    errors.push('Missing self-referencing atom:link');
  }

  // Check for WebSub hub links
  if (!content.includes('rel="hub"')) {
    errors.push('Missing WebSub hub links (rel="hub")');
  }

  // Check for specific WebSub hubs
  if (!content.includes('pubsubhubbub.appspot.com')) {
    errors.push('Missing Google WebSub hub (pubsubhubbub.appspot.com)');
  }
  
  // Count items
  const itemMatches = content.match(/<item>/g);
  if (itemMatches) {
    itemCount = itemMatches.length;
  }
  
  // Check for content in items
  if (itemCount > 0) {
    if (!content.includes('<content:encoded>')) {
      errors.push('Items missing full content (content:encoded)');
    }
    
    if (!content.includes('<pubDate>')) {
      errors.push('Items missing publication dates');
    }
    
    if (!content.includes('<guid')) {
      errors.push('Items missing GUID');
    }
  }
  
  // Check for proper XML escaping (basic check)
  if (content.includes('&') && !content.includes('&amp;') && !content.includes('&lt;')) {
    // This is a simple check - might have false positives
    errors.push('Possible XML escaping issues');
  }
  
  return {
    isValid,
    errors,
    itemCount
  };
}

/**
 * Test feed index endpoint
 */
async function testFeedIndex() {
  console.log(`\n📋 Testing Feed Index...`);
  const indexUrl = `${BASE_URL}/api/feeds/index.json`;
  console.log(`URL: ${indexUrl}`);
  
  try {
    const response = await fetch(indexUrl);
    
    if (!response.ok) {
      console.log(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      return { success: false, error: `HTTP ${response.status}` };
    }
    
    const indexData = await response.json();
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📄 Content-Type: ${response.headers.get('content-type')}`);
    console.log(`🏠 Site: ${indexData.site?.title || 'Unknown'}`);
    console.log(`📰 Main Feed: ${indexData.feeds?.main?.title || 'Not found'}`);
    
    const categoryCount = Object.keys(indexData.feeds?.categories || {}).length;
    console.log(`🏷️  Category Feeds: ${categoryCount} available`);
    
    if (indexData.feeds?.categories) {
      Object.entries(indexData.feeds.categories).forEach(([key, feed]) => {
        console.log(`   - ${key}: ${feed.title}`);
      });
    }
    
    return {
      success: true,
      status: response.status,
      data: indexData
    };
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test invalid feed (should return 404)
 */
async function testInvalidFeed() {
  console.log(`\n🚫 Testing Invalid Feed...`);
  const invalidUrl = `${BASE_URL}/api/feeds/nonexistent.rss`;
  console.log(`URL: ${invalidUrl}`);
  
  try {
    const response = await fetch(invalidUrl);
    
    if (response.status === 404) {
      console.log(`✅ Correctly returns 404 for invalid feed`);
      return { success: true, status: 404 };
    } else {
      console.log(`⚠️  Expected 404, got ${response.status}`);
      return { success: false, status: response.status };
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Main test function
 */
async function testRssFeeds() {
  console.log('🎯 Testing Dynamic RSS Feeds Strategy');
  console.log('=====================================');
  console.log(`Base URL: ${BASE_URL}`);

  const results = {
    feeds: {},
    index: null,
    invalidFeed: null,
    summary: {
      total: 0,
      successful: 0,
      failed: 0
    }
  };

  // Test feed index first
  results.index = await testFeedIndex();

  // Get available feeds dynamically
  console.log('\n📡 Fetching available feeds...');
  const availableFeeds = await getAvailableFeeds();
  console.log(`Found ${Object.keys(availableFeeds).length} feeds to test`);

  // Test each RSS feed
  for (const [feedKey, feedInfo] of Object.entries(availableFeeds)) {
    const result = await testRssFeed(feedKey, feedInfo);
    results.feeds[feedKey] = result;

    results.summary.total++;
    if (result.success) {
      results.summary.successful++;
    } else {
      results.summary.failed++;
    }
  }
  
  // Test invalid feed
  results.invalidFeed = await testInvalidFeed();
  
  // Display summary
  console.log('\n📊 Test Summary');
  console.log('===============');
  console.log(`Total Feeds Tested: ${results.summary.total}`);
  console.log(`Successful: ${results.summary.successful}`);
  console.log(`Failed: ${results.summary.failed}`);
  console.log(`Success Rate: ${((results.summary.successful / results.summary.total) * 100).toFixed(1)}%`);
  
  // Display failed feeds
  if (results.summary.failed > 0) {
    console.log('\n❌ Failed Feeds:');
    Object.entries(results.feeds).forEach(([key, result]) => {
      if (!result.success) {
        console.log(`   - ${key}: ${result.error}`);
      }
    });
  }
  
  // Display recommendations
  console.log('\n💡 Recommendations for Google Search Console:');
  console.log('==============================================');
  Object.entries(availableFeeds).forEach(([key, feedInfo]) => {
    if (results.feeds[key]?.success) {
      console.log(`✅ Submit: ${feedInfo.url}`);
    } else {
      console.log(`❌ Fix first: ${feedInfo.url}`);
    }
  });
  
  console.log('\n🎉 RSS Feeds Test Completed');
  console.log('============================');
  console.log('Next steps:');
  console.log('1. Submit working feeds to Google Search Console');
  console.log('2. Monitor indexing performance per category');
  console.log('3. Fix any validation issues found');
  console.log('4. Set up RSS feed monitoring alerts');
  
  return results;
}

// Run tests
testRssFeeds().catch(error => {
  console.error('Test script failed:', error);
  process.exit(1);
});
