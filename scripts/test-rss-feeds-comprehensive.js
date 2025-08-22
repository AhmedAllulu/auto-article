#!/usr/bin/env node

/**
 * Comprehensive RSS Feeds Test Script
 * Tests RSS feeds for all supported languages and categories
 * Usage: node scripts/test-rss-feeds-comprehensive.js
 */

import { config } from '../src/config.js';

const BASE_URL = process.env.CANONICAL_BASE_URL || 'http://localhost:3000';
const SUPPORTED_LANGUAGES = config.languages || ['en', 'de', 'fr', 'es', 'pt', 'ar', 'hi'];

/**
 * Test RSS feed for a specific language and category
 */
async function testRssFeed(feedUrl, description) {
  console.log(`\n🔍 Testing: ${description}`);
  console.log(`URL: ${feedUrl}`);
  
  try {
    const response = await fetch(feedUrl);
    
    if (!response.ok) {
      console.log(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      return { success: false, error: `HTTP ${response.status}`, url: feedUrl };
    }
    
    const contentType = response.headers.get('content-type');
    const rssContent = await response.text();
    
    // Basic validation
    const validation = validateRssContent(rssContent);
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📄 Content-Type: ${contentType}`);
    console.log(`📏 Content Length: ${rssContent.length} bytes`);
    console.log(`📰 Articles: ${validation.itemCount} items`);
    console.log(`🔍 Valid: ${validation.isValid ? '✅' : '❌'}`);
    
    if (validation.errors.length > 0) {
      console.log(`⚠️  Issues:`);
      validation.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    return {
      success: true,
      status: response.status,
      contentType,
      contentLength: rssContent.length,
      itemCount: validation.itemCount,
      isValid: validation.isValid,
      errors: validation.errors,
      url: feedUrl
    };
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return { success: false, error: error.message, url: feedUrl };
  }
}

/**
 * Basic RSS content validation
 */
function validateRssContent(content) {
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
  
  // Check for required elements
  const requiredElements = ['<channel>', '<title>', '<description>', '<link>'];
  for (const element of requiredElements) {
    if (!content.includes(element)) {
      errors.push(`Missing required element: ${element}`);
      isValid = false;
    }
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
  
  return { isValid, errors, itemCount };
}

/**
 * Get available categories from the feed index
 */
async function getAvailableCategories() {
  try {
    const response = await fetch(`${BASE_URL}/api/feeds/index.json`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const feedIndex = await response.json();
    return Object.keys(feedIndex.feeds?.categories || {});
  } catch (error) {
    console.error('Failed to fetch categories:', error.message);
    return [];
  }
}

/**
 * Main test function
 */
async function testRssFeedsComprehensive() {
  console.log('🎯 Comprehensive RSS Feeds Test');
  console.log('================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Languages: ${SUPPORTED_LANGUAGES.join(', ')}`);

  const results = {
    mainFeeds: {},
    categoryFeeds: {},
    summary: {
      total: 0,
      successful: 0,
      failed: 0,
      languages: SUPPORTED_LANGUAGES.length,
      categories: 0
    }
  };

  // Test main feeds for all languages
  console.log('\n📡 Testing Main Feeds for All Languages');
  console.log('========================================');
  
  for (const language of SUPPORTED_LANGUAGES) {
    const feedUrl = `${BASE_URL}/api/feeds/all.rss?lang=${language}`;
    const result = await testRssFeed(feedUrl, `Main feed (${language})`);
    
    results.mainFeeds[language] = result;
    results.summary.total++;
    
    if (result.success) {
      results.summary.successful++;
    } else {
      results.summary.failed++;
    }
  }

  // Get available categories
  console.log('\n📋 Getting Available Categories');
  console.log('===============================');
  const categories = await getAvailableCategories();
  results.summary.categories = categories.length;
  console.log(`Found ${categories.length} categories: ${categories.slice(0, 5).join(', ')}${categories.length > 5 ? '...' : ''}`);

  // Test category feeds for all languages
  console.log('\n🏷️  Testing Category Feeds for All Languages');
  console.log('=============================================');
  
  for (const category of categories.slice(0, 3)) { // Test first 3 categories to avoid too many requests
    results.categoryFeeds[category] = {};
    
    for (const language of SUPPORTED_LANGUAGES) {
      const feedUrl = `${BASE_URL}/api/feeds/${category}.rss?lang=${language}`;
      const result = await testRssFeed(feedUrl, `${category} feed (${language})`);
      
      results.categoryFeeds[category][language] = result;
      results.summary.total++;
      
      if (result.success) {
        results.summary.successful++;
      } else {
        results.summary.failed++;
      }
    }
  }

  // Display summary
  console.log('\n📊 Test Summary');
  console.log('===============');
  console.log(`Total Tests: ${results.summary.total}`);
  console.log(`Successful: ${results.summary.successful}`);
  console.log(`Failed: ${results.summary.failed}`);
  console.log(`Success Rate: ${((results.summary.successful / results.summary.total) * 100).toFixed(1)}%`);
  console.log(`Languages Tested: ${results.summary.languages}`);
  console.log(`Categories Available: ${results.summary.categories}`);

  // Language-specific analysis
  console.log('\n🌍 Language Analysis');
  console.log('====================');
  for (const language of SUPPORTED_LANGUAGES) {
    const mainFeed = results.mainFeeds[language];
    const categoryFeeds = Object.values(results.categoryFeeds).map(cat => cat[language]).filter(Boolean);
    
    const totalForLang = 1 + categoryFeeds.length;
    const successfulForLang = (mainFeed?.success ? 1 : 0) + categoryFeeds.filter(f => f?.success).length;
    
    console.log(`${language.toUpperCase()}: ${successfulForLang}/${totalForLang} feeds working (${((successfulForLang/totalForLang)*100).toFixed(1)}%)`);
    
    if (mainFeed?.success && mainFeed.itemCount > 0) {
      console.log(`  ✅ Main feed: ${mainFeed.itemCount} articles`);
    } else {
      console.log(`  ❌ Main feed: ${mainFeed?.error || 'No articles'}`);
    }
  }

  // Failed feeds analysis
  if (results.summary.failed > 0) {
    console.log('\n❌ Failed Feeds Analysis');
    console.log('========================');
    
    // Main feeds failures
    const failedMainFeeds = Object.entries(results.mainFeeds).filter(([, result]) => !result.success);
    if (failedMainFeeds.length > 0) {
      console.log('Main feeds failures:');
      failedMainFeeds.forEach(([lang, result]) => {
        console.log(`  - ${lang}: ${result.error}`);
      });
    }
    
    // Category feeds failures
    const failedCategoryFeeds = [];
    Object.entries(results.categoryFeeds).forEach(([category, languages]) => {
      Object.entries(languages).forEach(([lang, result]) => {
        if (!result.success) {
          failedCategoryFeeds.push({ category, lang, error: result.error });
        }
      });
    });
    
    if (failedCategoryFeeds.length > 0) {
      console.log('Category feeds failures:');
      failedCategoryFeeds.forEach(({ category, lang, error }) => {
        console.log(`  - ${category} (${lang}): ${error}`);
      });
    }
  }

  console.log('\n🎉 Comprehensive Test Completed');
  console.log('===============================');
  
  return results;
}

// Run tests
testRssFeedsComprehensive().catch(error => {
  console.error('Test script failed:', error);
  process.exit(1);
});
