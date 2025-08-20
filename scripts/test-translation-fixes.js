#!/usr/bin/env node

import { HTMLTranslator } from '../src/services/htmlTranslator.js';
import { query } from '../src/db.js';

/**
 * Comprehensive test script for translation fixes
 * Tests articles of varying lengths to ensure the fix works properly
 */

// Test cases with different content sizes
const testCases = [
  {
    name: 'Small Article',
    content: `<h1>Small Test Article</h1>
<p>This is a small test article with minimal content.</p>
<p>It should be translated in a single API call.</p>`,
    expectedStrategy: 'single-shot',
    expectedCalls: 1
  },
  {
    name: 'Medium Article',
    content: `<h1>Medium Test Article</h1>
<p>This is a medium-sized test article.</p>
${'<p>This paragraph is repeated to increase the content size. '.repeat(50)}</p>
<h2>Section 1</h2>
${'<p>More content to make this a medium-sized article. '.repeat(30)}</p>
<h2>Section 2</h2>
${'<p>Additional content for testing purposes. '.repeat(40)}</p>`,
    expectedStrategy: 'single-shot',
    expectedCalls: 1
  },
  {
    name: 'Two-Part Article',
    content: `<h1>Two-Part Test Article</h1>
<p>This article should be split into exactly two parts.</p>
${'<p>This is content designed to fit within the two-part strategy limits but exceed single-shot limits. '.repeat(120)}</p>
<h2>Section 1</h2>
${'<p>More content to reach the two-part threshold and ensure we exceed 4000 tokens. '.repeat(100)}</p>
<h2>Section 2</h2>
${'<p>Final content to complete the two-part test and stay under 8000 tokens. '.repeat(80)}</p>`,
    expectedStrategy: 'two-part',
    expectedCalls: 2
  },
  {
    name: 'Large Article',
    content: `<h1>Large Test Article</h1>
<p>This is a large test article that should require chunking.</p>
${'<p>This is a substantial paragraph with meaningful content that will help test the translation system. '.repeat(100)}</p>
<h2>Major Section 1</h2>
${'<p>This section contains extensive content to simulate a real large article. '.repeat(80)}</p>
<h2>Major Section 2</h2>
${'<p>More extensive content to ensure we exceed the token limits for single-shot translation. '.repeat(90)}</p>
<h2>Major Section 3</h2>
${'<p>Final section with additional content to make this a truly large article. '.repeat(70)}</p>`,
    expectedStrategy: 'four-part',
    expectedCalls: 4
  },
  {
    name: 'Very Large Article',
    content: `<h1>Very Large Test Article</h1>
<p>This is a very large test article that will definitely require multiple chunks.</p>
${'<p>This is an extensive paragraph with substantial content designed to test the limits of our translation system. It contains meaningful text that simulates real article content. '.repeat(200)}</p>
<h2>Comprehensive Section 1</h2>
${'<p>This section contains very extensive content to simulate a real very large article with substantial information. '.repeat(150)}</p>
<h2>Comprehensive Section 2</h2>
${'<p>More very extensive content to ensure we definitely exceed the token limits for both single-shot and two-part translation. '.repeat(180)}</p>
<h2>Comprehensive Section 3</h2>
${'<p>Additional comprehensive content to make this article truly large and test our four-part splitting strategy. '.repeat(160)}</p>
<h2>Comprehensive Section 4</h2>
${'<p>Final comprehensive section with substantial content to complete our very large test article. '.repeat(140)}</p>`,
    expectedStrategy: 'large-chunk-fallback',
    expectedCalls: 8
  }
];

async function testTranslationFixes() {
  console.log('🧪 Testing Translation Fixes for Long Articles\n');
  console.log('=' .repeat(60));

  let totalTests = 0;
  let passedTests = 0;

  for (const testCase of testCases) {
    console.log(`\n📄 Testing: ${testCase.name}`);
    console.log('-'.repeat(40));
    
    const contentLength = testCase.content.length;
    const estimatedTokens = Math.ceil(contentLength / 3.5);
    
    console.log(`Content length: ${contentLength} characters`);
    console.log(`Estimated tokens: ${estimatedTokens}`);
    console.log(`Expected strategy: ${testCase.expectedStrategy}`);
    console.log(`Expected API calls: ${testCase.expectedCalls}`);

    // Debug token limits
    const MAX_TOKENS_PER_CALL = 4000;
    const MAX_TOKENS_TWO_PARTS = MAX_TOKENS_PER_CALL * 2;
    const MAX_TOKENS_FOUR_PARTS = MAX_TOKENS_PER_CALL * 4;

    console.log(`Token limits: single=${MAX_TOKENS_PER_CALL}, two-part=${MAX_TOKENS_TWO_PARTS}, four-part=${MAX_TOKENS_FOUR_PARTS}`);

    if (estimatedTokens <= MAX_TOKENS_PER_CALL) {
      console.log(`→ Should use single-shot strategy`);
    } else if (estimatedTokens <= MAX_TOKENS_TWO_PARTS) {
      console.log(`→ Should use two-part strategy`);
    } else if (estimatedTokens <= MAX_TOKENS_FOUR_PARTS) {
      console.log(`→ Should use four-part strategy`);
    } else {
      console.log(`→ Should use large chunk fallback`);
    }

    // Test with Spanish translation
    const translator = new HTMLTranslator('es');
    
    // Mock the translateWhole method to track API calls
    let apiCallCount = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    const originalTranslateWhole = translator.translateWhole;
    
    translator.translateWhole = async function(chunk, retryCount = 0) {
      apiCallCount++;
      const chunkTokens = Math.ceil(chunk.length / 3.5);
      totalInputTokens += chunkTokens;
      
      console.log(`  📡 API Call ${apiCallCount}: ${chunk.length} chars (~${chunkTokens} tokens)`);
      
      // Simulate translation with simple replacements
      let translated = chunk
        .replace(/Test/g, 'Prueba')
        .replace(/Article/g, 'Artículo')
        .replace(/Section/g, 'Sección')
        .replace(/content/g, 'contenido')
        .replace(/This is/g, 'Esto es');
      
      const outputTokens = Math.ceil(translated.length / 3.5);
      totalOutputTokens += outputTokens;
      
      return { 
        translated,
        usage: { 
          prompt_tokens: chunkTokens, 
          completion_tokens: outputTokens 
        }
      };
    };

    try {
      const startTime = Date.now();
      const result = await translator.translateHTML(testCase.content);
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      const tokenStats = translator.getTokenStats();
      
      console.log(`\n✅ Translation completed successfully!`);
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`📊 API calls made: ${apiCallCount}`);
      console.log(`🎯 Expected calls: ${testCase.expectedCalls}`);
      console.log(`📈 Input tokens: ${tokenStats.input}`);
      console.log(`📉 Output tokens: ${tokenStats.output}`);
      console.log(`📝 Result length: ${result.length} characters`);
      
      // Validate results
      const callsMatch = apiCallCount === testCase.expectedCalls;
      const hasContent = result.length > 0;
      const preservesStructure = result.includes('<h1>') && result.includes('</h1>');
      
      if (callsMatch && hasContent && preservesStructure) {
        console.log(`✅ Test PASSED`);
        passedTests++;
      } else {
        console.log(`❌ Test FAILED:`);
        if (!callsMatch) console.log(`   - API calls: expected ${testCase.expectedCalls}, got ${apiCallCount}`);
        if (!hasContent) console.log(`   - No translated content returned`);
        if (!preservesStructure) console.log(`   - HTML structure not preserved`);
      }
      
    } catch (error) {
      console.log(`❌ Test FAILED with error: ${error.message}`);
    }
    
    totalTests++;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 Test Summary: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Translation fixes are working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please review the implementation.');
  }
}

async function testRealArticles() {
  console.log('\n🔍 Testing with Real Articles from Database\n');
  console.log('=' .repeat(60));

  try {
    // Get a few real articles of different sizes
    const { rows } = await query(`
      SELECT slug, title, content, LENGTH(content) as content_length
      FROM articles_en 
      ORDER BY LENGTH(content) DESC 
      LIMIT 3
    `);

    for (const article of rows) {
      console.log(`\n📰 Real Article: ${article.title}`);
      console.log('-'.repeat(50));
      console.log(`Content length: ${article.content_length} characters`);
      console.log(`Estimated tokens: ${Math.ceil(article.content_length / 3.5)}`);

      const translator = new HTMLTranslator('fr');
      
      // Mock for testing
      let apiCallCount = 0;
      translator.translateWhole = async function(chunk) {
        apiCallCount++;
        return { 
          translated: chunk.replace(/the/gi, 'le').replace(/and/gi, 'et'),
          usage: { prompt_tokens: 100, completion_tokens: 100 }
        };
      };

      try {
        const startTime = Date.now();
        await translator.translateHTML(article.content);
        const duration = Date.now() - startTime;
        
        console.log(`✅ Translation completed in ${duration}ms with ${apiCallCount} API calls`);
        
      } catch (error) {
        console.log(`❌ Translation failed: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Database test failed: ${error.message}`);
  }
}

// Run the tests
async function main() {
  await testTranslationFixes();
  await testRealArticles();
  
  console.log('\n🏁 Translation fix testing completed!');
  process.exit(0);
}

main().catch(console.error);
