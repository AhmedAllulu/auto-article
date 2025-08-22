#!/usr/bin/env node

/**
 * Test script for 2025 SEO notifications with modern APIs
 * Usage: node scripts/test-seo-notifications-2025.js
 */

import { config } from '../src/config.js';
import { 
  notifySearchEnginesNewArticle, 
  notifySearchEnginesSitemapUpdate
} from '../src/services/seoNotificationService.js';

// Test article data
const testArticle = {
  slug: 'test-seo-notification-2025-' + Date.now(),
  language_code: 'en',
  title: 'Test Article for 2025 SEO Notifications',
  content: '<p>This is a test article to verify 2025 SEO notifications are working with modern APIs.</p>',
  summary: 'Test article summary for 2025 SEO notification testing.',
  category_id: 1,
  category_slug: 'technology',
  published_at: new Date().toISOString()
};

async function testModernSEONotifications() {
  console.log('🚀 Testing 2025 Modern SEO Notifications');
  console.log('==========================================');
  
  // Display configuration
  console.log('\n📋 Configuration:');
  console.log(`Base URL: ${process.env.CANONICAL_BASE_URL || 'https://vivaverse.top'}`);
  console.log(`IndexNow: ${process.env.ENABLE_INDEXNOW === 'true' ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`IndexNow Key: ${process.env.INDEXNOW_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`Google Indexing API: ${process.env.ENABLE_GOOGLE_INDEXING_API === 'true' ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`Google Service Account: ${process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`Bing Webmaster API: ${process.env.ENABLE_BING_WEBMASTER_API === 'true' ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`Bing API Key: ${process.env.BING_WEBMASTER_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`Yandex Webmaster API: ${process.env.ENABLE_YANDEX_WEBMASTER_API === 'true' ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`Yandex API Key: ${process.env.YANDEX_WEBMASTER_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  
  console.log('\n🔍 Test 1: Single Article Notification (Modern APIs)');
  console.log('-----------------------------------------------------');
  
  try {
    const result = await notifySearchEnginesNewArticle(testArticle);
    
    console.log(`Article URL: ${result.article.url}`);
    console.log(`Language: ${result.article.language}`);
    console.log(`Timestamp: ${result.timestamp}`);
    console.log('\nNotification Results:');
    
    // Modern APIs
    const googleIndexing = result.notifications.googleIndexingApi;
    console.log(`${googleIndexing?.success ? '✅' : '❌'} Google Indexing API: ${googleIndexing?.success ? 'Success' : 'Failed'} - ${googleIndexing?.error || googleIndexing?.reason || `${googleIndexing?.successful || 0} URLs submitted`}`);
    
    const bingWebmaster = result.notifications.bingWebmasterApi;
    console.log(`${bingWebmaster?.success ? '✅' : '❌'} Bing Webmaster API: ${bingWebmaster?.success ? 'Success' : 'Failed'} - ${bingWebmaster?.error || bingWebmaster?.reason || `${bingWebmaster?.urlCount || 0} URLs submitted`}`);
    
    const yandexWebmaster = result.notifications.yandexWebmasterApi;
    console.log(`${yandexWebmaster?.success ? '✅' : '❌'} Yandex Webmaster API: ${yandexWebmaster?.success ? 'Success' : 'Failed'} - ${yandexWebmaster?.error || yandexWebmaster?.reason || `${yandexWebmaster?.urlCount || 0} URLs submitted`}`);
    
    const indexNow = result.notifications.indexnow;
    console.log(`${indexNow?.success ? '✅' : '❌'} IndexNow API: ${indexNow?.success ? 'Success' : 'Failed'} - ${indexNow?.error || indexNow?.reason || `${indexNow?.urlCount || 0} URLs submitted`}`);
    
    const websub = result.notifications.websub;
    console.log(`${websub?.success ? '✅' : '❌'} WebSub: ${websub?.success ? 'Success' : 'Failed'} - ${websub?.error || websub?.reason || `${websub?.summary?.successful || 0} hubs notified`}`);
    
    // Legacy methods (should show as deprecated)
    const googlePing = result.notifications.google_ping_legacy;
    console.log(`${googlePing?.success ? '✅' : '⚠️'} Google Ping (Legacy): ${googlePing?.success ? 'Success' : 'Deprecated/Failed'} - ${googlePing?.error || googlePing?.reason || 'OK'}`);
    
    const bingPing = result.notifications.bing_ping_legacy;
    console.log(`${bingPing?.success ? '✅' : '⚠️'} Bing Ping (Legacy): ${bingPing?.success ? 'Success' : 'Deprecated/Failed'} - ${bingPing?.error || bingPing?.reason || 'OK'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\n🗺️  Test 2: Sitemap Update Notification');
  console.log('----------------------------------------');
  
  try {
    const result = await notifySearchEnginesSitemapUpdate();
    
    console.log(`Sitemap URL: ${result.sitemap}`);
    console.log(`Timestamp: ${result.timestamp}`);
    console.log('\nNotification Results:');
    
    const google = result.notifications.google;
    console.log(`${google?.success ? '✅' : '❌'} Google: ${google?.success ? 'Success' : 'Failed'} - ${google?.error || google?.reason || 'OK'}`);
    
    const bing = result.notifications.bing;
    console.log(`${bing?.success ? '✅' : '❌'} Bing: ${bing?.success ? 'Success' : 'Failed'} - ${bing?.error || bing?.reason || 'OK'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\n🔑 Test 3: IndexNow Key File Verification');
  console.log('------------------------------------------');
  
  const indexNowKey = process.env.INDEXNOW_API_KEY;
  if (indexNowKey) {
    try {
      const keyFileUrl = `${process.env.CANONICAL_BASE_URL || 'https://vivaverse.top'}/${indexNowKey}.txt`;
      console.log(`Checking key file: ${keyFileUrl}`);
      
      const response = await fetch(keyFileUrl);
      if (response.ok) {
        const content = await response.text();
        const trimmedContent = content.trim();
        
        if (trimmedContent === indexNowKey) {
          console.log('✅ Key file accessible and contains correct key');
        } else {
          console.log('❌ Key file accessible but contains wrong content');
          console.log(`Expected: ${indexNowKey}`);
          console.log(`Found: ${trimmedContent}`);
        }
      } else {
        console.log(`❌ Key file not accessible (HTTP ${response.status})`);
      }
    } catch (error) {
      console.log(`❌ Error checking key file: ${error.message}`);
    }
  } else {
    console.log('❌ IndexNow API key not configured');
  }
  
  console.log('\n🎉 2025 SEO Notification Tests Completed');
  console.log('=========================================');
  console.log('\n💡 Tips for better SEO indexing:');
  console.log('1. Enable Google Indexing API for fastest Google indexing');
  console.log('2. Enable Bing Webmaster API for better Bing coverage');
  console.log('3. Enable Yandex Webmaster API for Russian market');
  console.log('4. IndexNow API covers Bing, Yandex, Seznam, and others');
  console.log('5. WebSub provides instant RSS feed notifications');
  console.log('6. Legacy ping methods are deprecated in 2025');
}

testModernSEONotifications().catch(console.error);
