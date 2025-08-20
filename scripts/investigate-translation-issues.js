#!/usr/bin/env node

import { config } from '../src/config.js';
import { chatCompletion } from '../src/services/openAI.js';
import { HTMLTranslator } from '../src/services/htmlTranslator.js';
import { query } from '../src/db.js';

/**
 * Comprehensive investigation of translation issues
 */

async function checkAPIConfiguration() {
  console.log('🔧 Checking API Configuration\n');
  console.log('=' .repeat(50));
  
  console.log('OpenAI Configuration:');
  console.log(`- API Keys configured: ${config.openAI.apiKeys.length}`);
  console.log(`- Default model: ${config.openAI.defaultModel}`);
  console.log(`- Base URL: ${config.openAI.baseUrl}`);
  
  // Test basic API connectivity
  try {
    console.log('\n🧪 Testing OpenAI API connectivity...');
    const testResult = await chatCompletion({
      system: 'You are a test assistant.',
      user: 'Say "API test successful" in Spanish.',
      model: config.openAI.defaultModel
    });
    
    console.log('✅ API Test Result:', testResult.content);
    console.log('📊 Token Usage:', testResult.usage);
    
  } catch (error) {
    console.log('❌ API Test Failed:', error.message);
    return false;
  }
  
  return true;
}

async function checkRecentErrors() {
  console.log('\n🔍 Checking Recent Translation Errors\n');
  console.log('=' .repeat(50));
  
  try {
    // Check for recent translation failures in the database
    const { rows } = await query(`
      SELECT 
        category_id,
        language_code,
        COUNT(*) as failure_count,
        MAX(created_at) as last_failure
      FROM articles_en a
      WHERE created_at >= CURRENT_DATE - INTERVAL '2 days'
      AND NOT EXISTS (
        SELECT 1 FROM articles_de ad WHERE ad.slug LIKE a.slug || '-%'
        UNION ALL
        SELECT 1 FROM articles_fr af WHERE af.slug LIKE a.slug || '-%'
        UNION ALL
        SELECT 1 FROM articles_es ae WHERE ae.slug LIKE a.slug || '-%'
        UNION ALL
        SELECT 1 FROM articles_pt ap WHERE ap.slug LIKE a.slug || '-%'
        UNION ALL
        SELECT 1 FROM articles_ar aa WHERE aa.slug LIKE a.slug || '-%'
        UNION ALL
        SELECT 1 FROM articles_hi ah WHERE ah.slug LIKE a.slug || '-%'
      )
      GROUP BY category_id, language_code
      ORDER BY failure_count DESC
    `);
    
    if (rows.length === 0) {
      console.log('✅ No recent translation failures detected in database');
    } else {
      console.log('⚠️  Recent translation failures detected:');
      rows.forEach(row => {
        console.log(`- Category ${row.category_id}: ${row.failure_count} failures, last: ${row.last_failure}`);
      });
    }
    
  } catch (error) {
    console.log('❌ Database check failed:', error.message);
  }
}

async function testTranslationEndpoint() {
  console.log('\n🧪 Testing Translation Functionality\n');
  console.log('=' .repeat(50));
  
  // Get a recent article to test with
  try {
    const { rows } = await query(`
      SELECT slug, title, content, LENGTH(content) as content_length
      FROM articles_en 
      WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    if (rows.length === 0) {
      console.log('⚠️  No recent articles found for testing');
      return;
    }
    
    const article = rows[0];
    console.log(`📰 Testing with article: ${article.title}`);
    console.log(`📏 Content length: ${article.content_length} characters`);
    console.log(`🔢 Estimated tokens: ${Math.ceil(article.content_length / 3.5)}`);
    
    // Test translation with different languages
    const testLanguages = ['es', 'fr', 'de'];
    
    for (const lang of testLanguages) {
      console.log(`\n🌍 Testing ${lang} translation...`);
      
      const translator = new HTMLTranslator(lang);
      
      try {
        const startTime = Date.now();
        const result = await translator.translateHTML(article.content.substring(0, 1000)); // Test with first 1000 chars
        const duration = Date.now() - startTime;
        
        console.log(`✅ ${lang} translation successful in ${duration}ms`);
        console.log(`📊 Token stats:`, translator.getTokenStats());
        console.log(`📝 Sample result: ${result.substring(0, 100)}...`);
        
      } catch (error) {
        console.log(`❌ ${lang} translation failed: ${error.message}`);
        
        // Check if it's a token limit or timeout error
        if (error.message.includes('timeout')) {
          console.log('   🕐 Error type: Timeout');
        } else if (error.message.includes('token') || error.message.includes('context')) {
          console.log('   🔢 Error type: Token limit');
        } else {
          console.log('   ❓ Error type: Other');
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Translation test failed:', error.message);
  }
}

async function checkArticleSizes() {
  console.log('\n📊 Analyzing Article Sizes\n');
  console.log('=' .repeat(50));
  
  try {
    const { rows } = await query(`
      SELECT 
        LENGTH(content) as content_length,
        LENGTH(content)/3.5 as estimated_tokens,
        title,
        slug,
        created_at
      FROM articles_en 
      WHERE created_at >= CURRENT_DATE - INTERVAL '2 days'
      ORDER BY LENGTH(content) DESC 
      LIMIT 10
    `);
    
    console.log('Recent articles by size:');
    rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.title}`);
      console.log(`   📏 ${row.content_length} chars, ~${Math.ceil(row.estimated_tokens)} tokens`);
      console.log(`   🕐 Created: ${row.created_at}`);
      
      // Determine expected chunking strategy
      const tokens = Math.ceil(row.estimated_tokens);
      let strategy = 'single-shot';
      if (tokens > 4000 && tokens <= 8000) strategy = 'two-part';
      else if (tokens > 8000 && tokens <= 16000) strategy = 'four-part';
      else if (tokens > 16000) strategy = 'large-chunks';
      
      console.log(`   🎯 Expected strategy: ${strategy}`);
      console.log('');
    });
    
  } catch (error) {
    console.log('❌ Article size analysis failed:', error.message);
  }
}

async function testChunkingLogic() {
  console.log('\n🧩 Testing Chunking Logic\n');
  console.log('=' .repeat(50));
  
  // Test different content sizes
  const testCases = [
    { name: 'Small', size: 500, expectedStrategy: 'single-shot' },
    { name: 'Medium', size: 5000, expectedStrategy: 'single-shot' },
    { name: 'Large', size: 15000, expectedStrategy: 'two-part' },
    { name: 'Very Large', size: 30000, expectedStrategy: 'four-part' },
    { name: 'Huge', size: 60000, expectedStrategy: 'large-chunks' }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📝 Testing ${testCase.name} content (${testCase.size} chars):`);
    
    // Generate test content
    const testContent = `<h1>Test Article</h1>` + 
      '<p>Test paragraph content. '.repeat(Math.floor(testCase.size / 25)) + 
      '</p>';
    
    const actualSize = testContent.length;
    const estimatedTokens = Math.ceil(actualSize / 3.5);
    
    console.log(`   📏 Actual size: ${actualSize} chars`);
    console.log(`   🔢 Estimated tokens: ${estimatedTokens}`);
    
    // Determine what strategy should be used
    let expectedStrategy = 'single-shot';
    if (estimatedTokens > 4000 && estimatedTokens <= 8000) expectedStrategy = 'two-part';
    else if (estimatedTokens > 8000 && estimatedTokens <= 16000) expectedStrategy = 'four-part';
    else if (estimatedTokens > 16000) expectedStrategy = 'large-chunks';
    
    console.log(`   🎯 Expected strategy: ${expectedStrategy}`);
    
    // Test with mock translator
    const translator = new HTMLTranslator('es');
    let apiCallCount = 0;
    
    translator.translateWhole = async function(chunk) {
      apiCallCount++;
      return { 
        translated: chunk.replace(/Test/g, 'Prueba'),
        usage: { prompt_tokens: 100, completion_tokens: 100 }
      };
    };
    
    try {
      await translator.translateHTML(testContent);
      console.log(`   📡 API calls made: ${apiCallCount}`);
      
      // Validate strategy
      let actualStrategy = 'single-shot';
      if (apiCallCount === 2) actualStrategy = 'two-part';
      else if (apiCallCount === 4) actualStrategy = 'four-part';
      else if (apiCallCount > 4) actualStrategy = 'large-chunks';
      
      console.log(`   ✅ Actual strategy: ${actualStrategy}`);
      
      if (actualStrategy === expectedStrategy) {
        console.log(`   ✅ Strategy matches expectation`);
      } else {
        console.log(`   ⚠️  Strategy mismatch: expected ${expectedStrategy}, got ${actualStrategy}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Test failed: ${error.message}`);
    }
  }
}

async function main() {
  console.log('🔍 COMPREHENSIVE TRANSLATION INVESTIGATION\n');
  console.log('🕐 Started at:', new Date().toISOString());
  console.log('=' .repeat(60));
  
  try {
    // 1. Check API configuration
    const apiWorking = await checkAPIConfiguration();
    
    if (!apiWorking) {
      console.log('\n❌ API configuration issues detected. Stopping investigation.');
      return;
    }
    
    // 2. Check recent errors
    await checkRecentErrors();
    
    // 3. Test translation functionality
    await testTranslationEndpoint();
    
    // 4. Analyze article sizes
    await checkArticleSizes();
    
    // 5. Test chunking logic
    await testChunkingLogic();
    
    console.log('\n' + '=' .repeat(60));
    console.log('🏁 Investigation completed at:', new Date().toISOString());
    
  } catch (error) {
    console.log('\n❌ Investigation failed:', error.message);
    console.log('Stack trace:', error.stack);
  }
}

main().catch(console.error);
