#!/usr/bin/env node

/**
 * Test script for WebSub (PubSubHubbub) functionality
 * Usage: node scripts/test-websub.js
 */

import { 
  testWebSubHubs,
  notifyWebSubFeedUpdate,
  notifyWebSubNewArticle,
  notifyWebSubAllFeeds,
  WEBSUB_CONFIG 
} from '../src/services/webSubService.js';

/**
 * Test WebSub hub connectivity
 */
async function testHubConnectivity() {
  console.log('\n🔗 Testing WebSub Hub Connectivity');
  console.log('===================================');
  
  try {
    const result = await testWebSubHubs();
    
    console.log(`Test Feed: ${WEBSUB_CONFIG.baseUrl}/api/feeds/all.rss`);
    console.log(`Primary Hub: ${WEBSUB_CONFIG.primaryHub}`);
    console.log(`Alternative Hubs: ${WEBSUB_CONFIG.alternativeHubs.length}`);
    console.log(`Timestamp: ${result.timestamp}`);
    
    console.log('\nHub Results:');
    Object.entries(result.hubs).forEach(([hubUrl, hubResult]) => {
      if (hubResult.success) {
        console.log(`✅ ${hubUrl}: Success (Status: ${hubResult.status})`);
      } else if (hubResult.reason === 'disabled') {
        console.log(`⚠️  ${hubUrl}: Disabled`);
      } else if (hubResult.reason === 'rate_limited') {
        console.log(`⏱️  ${hubUrl}: Rate limited`);
      } else {
        console.log(`❌ ${hubUrl}: Failed - ${hubResult.error || 'Unknown error'}`);
      }
    });
    
    console.log(`\nSummary: ${result.summary.successful}/${result.summary.total} hubs successful`);
    
    return result;
  } catch (error) {
    console.error(`❌ Hub connectivity test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test single feed notification
 */
async function testSingleFeedNotification() {
  console.log('\n📡 Testing Single Feed Notification');
  console.log('===================================');
  
  const testFeedUrl = `${WEBSUB_CONFIG.baseUrl}/api/feeds/all.rss`;
  console.log(`Feed URL: ${testFeedUrl}`);
  
  try {
    const result = await notifyWebSubFeedUpdate(testFeedUrl);
    
    if (result.success === false && result.reason) {
      console.log(`⚠️  Notification skipped: ${result.reason}`);
      return result;
    }
    
    console.log(`Timestamp: ${result.timestamp}`);
    console.log(`Feed Count: ${result.feedUrls.length}`);
    
    console.log('\nHub Results:');
    Object.entries(result.hubs).forEach(([hubUrl, hubResult]) => {
      if (hubResult.success) {
        console.log(`✅ ${hubUrl}: Success (Status: ${hubResult.status})`);
      } else if (hubResult.reason === 'rate_limited') {
        console.log(`⏱️  ${hubUrl}: Rate limited`);
      } else {
        console.log(`❌ ${hubUrl}: Failed - ${hubResult.error || 'Unknown error'}`);
      }
    });
    
    console.log(`\nSummary: ${result.summary.successful}/${result.summary.total} hubs notified`);
    
    return result;
  } catch (error) {
    console.error(`❌ Single feed notification test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test new article notification
 */
async function testNewArticleNotification() {
  console.log('\n📰 Testing New Article Notification');
  console.log('===================================');
  
  const testArticle = {
    slug: 'test-websub-article-' + Date.now(),
    category_slug: 'technology',
    title: 'Test Article for WebSub Notifications',
    language_code: 'en'
  };
  
  console.log(`Article: ${testArticle.title}`);
  console.log(`Category: ${testArticle.category_slug}`);
  console.log(`Slug: ${testArticle.slug}`);
  
  try {
    const result = await notifyWebSubNewArticle(testArticle);
    
    if (result.success === false && result.reason) {
      console.log(`⚠️  Notification skipped: ${result.reason}`);
      return result;
    }
    
    console.log(`Timestamp: ${result.timestamp}`);
    console.log(`Feeds Notified: ${result.feedUrls.length}`);
    
    console.log('\nFeeds:');
    result.feedUrls.forEach(feedUrl => {
      console.log(`  - ${feedUrl}`);
    });
    
    console.log('\nHub Results:');
    Object.entries(result.hubs).forEach(([hubUrl, hubResult]) => {
      if (hubResult.success) {
        console.log(`✅ ${hubUrl}: Success (Status: ${hubResult.status})`);
      } else if (hubResult.reason === 'rate_limited') {
        console.log(`⏱️  ${hubUrl}: Rate limited`);
      } else {
        console.log(`❌ ${hubUrl}: Failed - ${hubResult.error || 'Unknown error'}`);
      }
    });
    
    console.log(`\nSummary: ${result.summary.successful}/${result.summary.total} hubs notified`);
    
    return result;
  } catch (error) {
    console.error(`❌ New article notification test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test all feeds notification
 */
async function testAllFeedsNotification() {
  console.log('\n🌐 Testing All Feeds Notification');
  console.log('=================================');
  
  try {
    const result = await notifyWebSubAllFeeds();
    
    if (result.success === false && result.reason) {
      console.log(`⚠️  Notification skipped: ${result.reason}`);
      return result;
    }
    
    console.log(`Timestamp: ${result.timestamp}`);
    console.log(`Total Feeds: ${result.feedUrls.length}`);
    
    console.log('\nFeeds:');
    result.feedUrls.forEach(feedUrl => {
      console.log(`  - ${feedUrl}`);
    });
    
    console.log('\nHub Results:');
    Object.entries(result.hubs).forEach(([hubUrl, hubResult]) => {
      if (hubResult.success) {
        console.log(`✅ ${hubUrl}: Success (Status: ${hubResult.status})`);
      } else if (hubResult.reason === 'rate_limited') {
        console.log(`⏱️  ${hubUrl}: Rate limited`);
      } else {
        console.log(`❌ ${hubUrl}: Failed - ${hubResult.error || 'Unknown error'}`);
      }
    });
    
    console.log(`\nSummary: ${result.summary.successful}/${result.summary.total} hubs notified`);
    
    return result;
  } catch (error) {
    console.error(`❌ All feeds notification test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Main test function
 */
async function testWebSub() {
  console.log('🚀 Testing WebSub (PubSubHubbub) Integration');
  console.log('============================================');
  
  // Display configuration
  console.log('\n📋 Configuration:');
  console.log(`Base URL: ${WEBSUB_CONFIG.baseUrl}`);
  console.log(`WebSub Enabled: ${WEBSUB_CONFIG.enabled ? '✅ Yes' : '❌ No'}`);
  console.log(`Primary Hub: ${WEBSUB_CONFIG.primaryHub}`);
  console.log(`Alternative Hubs: ${WEBSUB_CONFIG.alternativeHubs.length}`);
  console.log(`Request Timeout: ${WEBSUB_CONFIG.timeout}ms`);
  console.log(`Min Notification Interval: ${WEBSUB_CONFIG.minNotificationInterval}ms`);
  
  if (!WEBSUB_CONFIG.enabled) {
    console.log('\n⚠️  WebSub is disabled. Enable it by setting ENABLE_WEBSUB=true');
    return;
  }
  
  const results = {
    hubConnectivity: null,
    singleFeed: null,
    newArticle: null,
    allFeeds: null
  };
  
  // Test 1: Hub connectivity
  results.hubConnectivity = await testHubConnectivity();
  
  // Test 2: Single feed notification
  results.singleFeed = await testSingleFeedNotification();
  
  // Test 3: New article notification
  results.newArticle = await testNewArticleNotification();
  
  // Test 4: All feeds notification
  results.allFeeds = await testAllFeedsNotification();
  
  // Summary
  console.log('\n📊 WebSub Test Summary');
  console.log('======================');
  
  const tests = [
    { name: 'Hub Connectivity', result: results.hubConnectivity },
    { name: 'Single Feed', result: results.singleFeed },
    { name: 'New Article', result: results.newArticle },
    { name: 'All Feeds', result: results.allFeeds }
  ];
  
  tests.forEach(test => {
    if (test.result?.summary) {
      const success = test.result.summary.successful > 0;
      console.log(`${success ? '✅' : '❌'} ${test.name}: ${test.result.summary.successful}/${test.result.summary.total} hubs`);
    } else if (test.result?.success === false) {
      console.log(`⚠️  ${test.name}: ${test.result.reason || test.result.error || 'Failed'}`);
    } else {
      console.log(`❓ ${test.name}: Unknown result`);
    }
  });
  
  console.log('\n💡 Benefits of WebSub:');
  console.log('======================');
  console.log('✅ Instant notifications to Google when RSS feeds update');
  console.log('✅ Push-based updates instead of waiting for crawlers');
  console.log('✅ Faster content discovery and indexing');
  console.log('✅ Better SEO performance for time-sensitive content');
  console.log('✅ Reduced server load from crawler requests');
  
  console.log('\n🎉 WebSub Test Completed');
  console.log('=========================');
  
  return results;
}

// Run tests
testWebSub().catch(error => {
  console.error('WebSub test script failed:', error);
  process.exit(1);
});
