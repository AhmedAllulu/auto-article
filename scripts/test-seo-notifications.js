#!/usr/bin/env node

/**
 * Test script for SEO notifications
 * Usage: node scripts/test-seo-notifications.js
 */

import { config } from '../src/config.js';
import { 
  notifySearchEnginesNewArticle, 
  notifySearchEnginesSitemapUpdate,
  SEO_CONFIG 
} from '../src/services/seoNotificationService.js';

// Test article data
const testArticle = {
  slug: 'test-seo-notification-' + Date.now(),
  language_code: 'en',
  title: 'Test Article for SEO Notifications',
  content: '<p>This is a test article to verify SEO notifications are working.</p>',
  summary: 'Test article summary for SEO notification testing.',
  category_id: 1,
  published_at: new Date().toISOString()
};

async function testSEONotifications() {
  console.log('🚀 Testing SEO Notifications');
  console.log('================================');
  
  // Display configuration
  console.log('\n📋 Configuration:');
  console.log(`Base URL: ${SEO_CONFIG.baseUrl}`);
  console.log(`Google Ping: ${SEO_CONFIG.enableGooglePing ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`Bing Ping: ${SEO_CONFIG.enableBingPing ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`IndexNow: ${SEO_CONFIG.enableIndexNow ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`IndexNow Key: ${SEO_CONFIG.indexNowKey ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`Request Timeout: ${SEO_CONFIG.requestTimeout}ms`);
  console.log(`Min Ping Interval: ${SEO_CONFIG.minPingInterval}ms`);

  // Test 1: Single article notification
  console.log('\n🔍 Test 1: Single Article Notification');
  console.log('---------------------------------------');
  
  try {
    const result = await notifySearchEnginesNewArticle(testArticle);
    
    console.log(`Article URL: ${result.article.url}`);
    console.log(`Language: ${result.article.language}`);
    console.log(`Timestamp: ${result.timestamp}`);
    
    console.log('\nNotification Results:');
    
    // Google result
    const google = result.notifications.google;
    if (google?.success) {
      console.log(`✅ Google: Success (Status: ${google.status})`);
    } else if (google?.reason === 'disabled') {
      console.log(`⚠️  Google: Disabled`);
    } else if (google?.reason === 'rate_limited') {
      console.log(`⏱️  Google: Rate limited`);
    } else {
      console.log(`❌ Google: Failed - ${google?.error || 'Unknown error'}`);
    }
    
    // Bing result
    const bing = result.notifications.bing;
    if (bing?.success) {
      console.log(`✅ Bing: Success (Status: ${bing.status})`);
    } else if (bing?.reason === 'disabled') {
      console.log(`⚠️  Bing: Disabled`);
    } else if (bing?.reason === 'rate_limited') {
      console.log(`⏱️  Bing: Rate limited`);
    } else {
      console.log(`❌ Bing: Failed - ${bing?.error || 'Unknown error'}`);
    }
    
    // IndexNow result
    const indexnow = result.notifications.indexnow;
    if (indexnow?.success) {
      console.log(`✅ IndexNow: Success (Status: ${indexnow.status}, URLs: ${indexnow.urlCount})`);
    } else if (indexnow?.reason === 'disabled') {
      console.log(`⚠️  IndexNow: Disabled`);
    } else if (indexnow?.reason === 'no_api_key') {
      console.log(`⚠️  IndexNow: No API key configured`);
    } else if (indexnow?.reason === 'rate_limited') {
      console.log(`⏱️  IndexNow: Rate limited`);
    } else {
      console.log(`❌ IndexNow: Failed - ${indexnow?.error || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.error(`❌ Test 1 failed: ${error.message}`);
  }

  // Test 2: Sitemap update notification
  console.log('\n🗺️  Test 2: Sitemap Update Notification');
  console.log('----------------------------------------');
  
  try {
    const result = await notifySearchEnginesSitemapUpdate();
    
    console.log(`Sitemap URL: ${result.sitemap}`);
    console.log(`Timestamp: ${result.timestamp}`);
    
    console.log('\nNotification Results:');
    
    // Google result
    const google = result.notifications.google;
    if (google?.success) {
      console.log(`✅ Google: Success (Status: ${google.status})`);
    } else if (google?.reason === 'disabled') {
      console.log(`⚠️  Google: Disabled`);
    } else if (google?.reason === 'rate_limited') {
      console.log(`⏱️  Google: Rate limited`);
    } else {
      console.log(`❌ Google: Failed - ${google?.error || 'Unknown error'}`);
    }
    
    // Bing result
    const bing = result.notifications.bing;
    if (bing?.success) {
      console.log(`✅ Bing: Success (Status: ${bing.status})`);
    } else if (bing?.reason === 'disabled') {
      console.log(`⚠️  Bing: Disabled`);
    } else if (bing?.reason === 'rate_limited') {
      console.log(`⏱️  Bing: Rate limited`);
    } else {
      console.log(`❌ Bing: Failed - ${bing?.error || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.error(`❌ Test 2 failed: ${error.message}`);
  }

  // Test 3: IndexNow key file verification
  console.log('\n🔑 Test 3: IndexNow Key File Verification');
  console.log('------------------------------------------');
  
  if (SEO_CONFIG.indexNowKey && SEO_CONFIG.indexNowKey !== 'placeholder-indexnow-key-replace-with-real-key') {
    try {
      const keyFileUrl = `${SEO_CONFIG.baseUrl}/${SEO_CONFIG.indexNowKey}.txt`;
      console.log(`Checking key file: ${keyFileUrl}`);
      
      const response = await fetch(keyFileUrl);
      if (response.ok) {
        const content = await response.text();
        const trimmedContent = content.trim();
        
        if (trimmedContent === SEO_CONFIG.indexNowKey) {
          console.log(`✅ Key file accessible and contains correct key`);
        } else {
          console.log(`❌ Key file accessible but contains wrong content`);
          console.log(`Expected: ${SEO_CONFIG.indexNowKey}`);
          console.log(`Found: ${trimmedContent}`);
        }
      } else {
        console.log(`❌ Key file not accessible (Status: ${response.status})`);
      }
    } catch (error) {
      console.log(`❌ Key file verification failed: ${error.message}`);
    }
  } else {
    console.log(`⚠️  IndexNow key not configured or using placeholder`);
  }

  console.log('\n🎉 SEO Notification Tests Completed');
  console.log('====================================');
}

// Run tests
testSEONotifications().catch(error => {
  console.error('Test script failed:', error);
  process.exit(1);
});
