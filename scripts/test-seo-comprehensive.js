#!/usr/bin/env node

import { query } from '../src/db.js';
import { config } from '../src/config.js';
import { articlesTable } from '../src/utils/articlesTable.js';

/**
 * Comprehensive SEO Testing Script
 * Tests all SEO functionality across all supported languages
 */

const BASE_URL = 'https://localhost:3322';
const LANGUAGES = config.languages || ['en', 'de', 'fr', 'es', 'pt', 'ar', 'hi'];

console.log('🔍 Starting Comprehensive SEO Testing...\n');

/**
 * Test 1: Check if articles have proper meta data
 */
async function testArticleMetaData() {
  console.log('📝 Testing Article Meta Data...');
  
  for (const lang of LANGUAGES) {
    const tableName = articlesTable(lang);
    
    try {
      const result = await query(
        tableName === 'articles'
          ? `SELECT title, meta_title, meta_description, canonical_url, language_code, slug 
             FROM ${tableName} 
             WHERE language_code = $1 
             LIMIT 3`
          : `SELECT title, meta_title, meta_description, canonical_url, '${lang}' as language_code, slug 
             FROM ${tableName} 
             LIMIT 3`,
        tableName === 'articles' ? [lang] : []
      );
      
      console.log(`\n  ${lang.toUpperCase()} (${result.rows.length} articles):`);
      
      if (result.rows.length === 0) {
        console.log('    ❌ No articles found');
        continue;
      }
      
      let hasIssues = false;
      
      for (const article of result.rows) {
        const issues = [];
        
        if (!article.meta_title) issues.push('missing meta_title');
        if (!article.meta_description) issues.push('missing meta_description');
        if (!article.canonical_url) issues.push('missing canonical_url');
        
        if (issues.length > 0) {
          console.log(`    ❌ "${article.title.substring(0, 50)}...": ${issues.join(', ')}`);
          hasIssues = true;
        } else {
          console.log(`    ✅ "${article.title.substring(0, 50)}...": Complete meta data`);
        }
      }
      
      if (!hasIssues && result.rows.length > 0) {
        console.log(`    ✅ All ${lang.toUpperCase()} articles have complete meta data`);
      }
      
    } catch (error) {
      console.log(`    ❌ Error checking ${lang}: ${error.message}`);
    }
  }
}

/**
 * Test 2: Check sitemap functionality
 */
async function testSitemaps() {
  console.log('\n🗺️  Testing Sitemap Functionality...');
  
  const sitemapTests = [
    { url: '/sitemap.xml', name: 'Main Sitemap Index' },
    { url: '/sitemap-fresh.xml', name: 'Freshness Sitemap' },
    { url: '/robots.txt', name: 'Robots.txt' }
  ];
  
  for (const test of sitemapTests) {
    try {
      const response = await fetch(`${BASE_URL}${test.url}`, {
        method: 'GET',
        headers: { 'Accept': 'application/xml,text/plain' }
      });
      
      if (response.ok) {
        const content = await response.text();
        console.log(`  ✅ ${test.name}: ${response.status} (${content.length} chars)`);
      } else {
        console.log(`  ❌ ${test.name}: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`  ❌ ${test.name}: ${error.message}`);
    }
  }
  
  // Test language-specific sitemaps
  console.log('\n  Language-specific sitemaps:');
  for (const lang of LANGUAGES.slice(0, 3)) { // Test first 3 languages
    try {
      const response = await fetch(`${BASE_URL}/sitemaps/${lang}.xml`);
      if (response.ok) {
        const content = await response.text();
        const urlCount = (content.match(/<url>/g) || []).length;
        console.log(`    ✅ ${lang.toUpperCase()}: ${urlCount} URLs`);
      } else {
        console.log(`    ❌ ${lang.toUpperCase()}: ${response.status}`);
      }
    } catch (error) {
      console.log(`    ❌ ${lang.toUpperCase()}: ${error.message}`);
    }
  }
}

/**
 * Test 3: Check RSS feeds
 */
async function testRSSFeeds() {
  console.log('\n📡 Testing RSS Feeds...');
  
  try {
    // Test main feed
    const mainFeedResponse = await fetch(`${BASE_URL}/api/feeds/all.rss`);
    if (mainFeedResponse.ok) {
      const content = await mainFeedResponse.text();
      const itemCount = (content.match(/<item>/g) || []).length;
      console.log(`  ✅ Main RSS Feed: ${itemCount} items`);
    } else {
      console.log(`  ❌ Main RSS Feed: ${mainFeedResponse.status}`);
    }
    
    // Test category feeds (first few categories)
    const categoriesResult = await query('SELECT slug, name FROM categories LIMIT 3');
    
    for (const category of categoriesResult.rows) {
      try {
        const response = await fetch(`${BASE_URL}/api/feeds/${category.slug}.rss`);
        if (response.ok) {
          const content = await response.text();
          const itemCount = (content.match(/<item>/g) || []).length;
          console.log(`  ✅ ${category.name}: ${itemCount} items`);
        } else {
          console.log(`  ❌ ${category.name}: ${response.status}`);
        }
      } catch (error) {
        console.log(`  ❌ ${category.name}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.log(`  ❌ RSS Feed testing failed: ${error.message}`);
  }
}

/**
 * Test 4: Check JSON-LD schema markup
 */
async function testSchemaMarkup() {
  console.log('\n🏷️  Testing Schema Markup...');
  
  try {
    // Get a sample article from each language
    for (const lang of LANGUAGES.slice(0, 3)) {
      const tableName = articlesTable(lang);
      
      const result = await query(
        tableName === 'articles'
          ? `SELECT slug, content FROM ${tableName} WHERE language_code = $1 AND content LIKE '%application/ld+json%' LIMIT 1`
          : `SELECT slug, content FROM ${tableName} WHERE content LIKE '%application/ld+json%' LIMIT 1`,
        tableName === 'articles' ? [lang] : []
      );
      
      if (result.rows.length > 0) {
        const article = result.rows[0];
        const hasArticleSchema = article.content.includes('"@type":"Article"');
        const hasFAQSchema = article.content.includes('"@type":"FAQPage"');
        
        console.log(`  ${lang.toUpperCase()}: ${article.slug.substring(0, 40)}...`);
        console.log(`    ${hasArticleSchema ? '✅' : '❌'} Article Schema`);
        console.log(`    ${hasFAQSchema ? '✅' : '❌'} FAQ Schema`);
      } else {
        console.log(`  ❌ ${lang.toUpperCase()}: No articles with schema markup found`);
      }
    }
  } catch (error) {
    console.log(`  ❌ Schema markup testing failed: ${error.message}`);
  }
}

/**
 * Test 5: Check HTML sitemap
 */
async function testHTMLSitemap() {
  console.log('\n🌐 Testing HTML Sitemap...');
  
  try {
    const response = await fetch(`${BASE_URL}/sitemap`);
    if (response.ok) {
      const content = await response.text();
      const hasMetaTags = content.includes('<meta name="description"');
      const hasStructuredData = content.includes('application/ld+json');
      const hasCanonical = content.includes('rel="canonical"');
      
      console.log(`  ✅ HTML Sitemap accessible (${content.length} chars)`);
      console.log(`  ${hasMetaTags ? '✅' : '❌'} Meta tags present`);
      console.log(`  ${hasStructuredData ? '✅' : '❌'} Structured data present`);
      console.log(`  ${hasCanonical ? '✅' : '❌'} Canonical URL present`);
    } else {
      console.log(`  ❌ HTML Sitemap: ${response.status}`);
    }
  } catch (error) {
    console.log(`  ❌ HTML Sitemap testing failed: ${error.message}`);
  }
}

/**
 * Test 6: Language coverage summary
 */
async function testLanguageCoverage() {
  console.log('\n🌍 Language Coverage Summary...');
  
  const summary = {
    totalLanguages: LANGUAGES.length,
    languagesWithArticles: 0,
    totalArticles: 0,
    articlesByLanguage: {}
  };
  
  for (const lang of LANGUAGES) {
    try {
      const tableName = articlesTable(lang);
      const result = await query(
        tableName === 'articles'
          ? `SELECT COUNT(*) as count FROM ${tableName} WHERE language_code = $1`
          : `SELECT COUNT(*) as count FROM ${tableName}`,
        tableName === 'articles' ? [lang] : []
      );
      
      const count = parseInt(result.rows[0].count);
      summary.articlesByLanguage[lang] = count;
      summary.totalArticles += count;
      
      if (count > 0) {
        summary.languagesWithArticles++;
      }
      
      console.log(`  ${lang.toUpperCase()}: ${count} articles`);
    } catch (error) {
      console.log(`  ${lang.toUpperCase()}: Error - ${error.message}`);
      summary.articlesByLanguage[lang] = 0;
    }
  }
  
  console.log(`\n  📊 Summary:`);
  console.log(`    Total Languages: ${summary.totalLanguages}`);
  console.log(`    Languages with Articles: ${summary.languagesWithArticles}`);
  console.log(`    Total Articles: ${summary.totalArticles}`);
  console.log(`    Coverage: ${((summary.languagesWithArticles / summary.totalLanguages) * 100).toFixed(1)}%`);
}

/**
 * Main test runner
 */
async function runAllTests() {
  try {
    await testArticleMetaData();
    await testSitemaps();
    await testRSSFeeds();
    await testSchemaMarkup();
    await testHTMLSitemap();
    await testLanguageCoverage();
    
    console.log('\n✅ SEO Testing Complete!\n');
    
  } catch (error) {
    console.error('❌ Testing failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run tests
runAllTests();
