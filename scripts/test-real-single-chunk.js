#!/usr/bin/env node

/**
 * Test single chunk translation with a real article
 * This will help verify that maxChunks=1 results in exactly one API call
 */

import { HTMLTranslator } from '../src/services/htmlTranslator.js';
import { query } from '../src/db.js';

async function testRealSingleChunk() {
  console.log('🧪 Testing Single Chunk Translation with Real Article\n');
  
  try {
    // Get a real article from the database
    const articleResult = await query(
      'SELECT title, content, summary, meta_description FROM articles_en WHERE slug = $1',
      ['creating-a-smart-home-a-practical-beginners-guide']
    );
    
    if (articleResult.rows.length === 0) {
      console.log('❌ Test article not found');
      return;
    }
    
    const article = articleResult.rows[0];
    console.log('📰 Test Article:');
    console.log(`   Title: ${article.title}`);
    console.log(`   Content length: ${article.content.length} characters`);
    console.log(`   Estimated tokens: ${Math.ceil(article.content.length / 4)}`);
    console.log('');
    
    // Test 1: Single chunk translation (maxChunks = 1)
    console.log('🔧 Test 1: Single Chunk Translation (maxChunks = 1)');
    
    const translator = new HTMLTranslator('hi', { maxChunks: 1 });
    
    // Mock the chatCompletion function to track API calls
    let apiCallCount = 0;
    let apiCallSizes = [];
    let apiCallContents = [];
    
    // Import and mock the openAI module
    const openAIModule = await import('../src/services/openAI.js');
    const originalChatCompletion = openAIModule.chatCompletion;
    
    openAIModule.chatCompletion = async function(params) {
      apiCallCount++;
      const contentLength = params.user ? params.user.length : 0;
      apiCallSizes.push(contentLength);
      apiCallContents.push(params.user ? params.user.substring(0, 100) + '...' : 'no content');
      
      console.log(`   📞 API Call #${apiCallCount}:`);
      console.log(`      Content length: ${contentLength} characters`);
      console.log(`      Content preview: ${params.user ? params.user.substring(0, 100) + '...' : 'no content'}`);
      
      // Return a mock translation
      return {
        content: `[TRANSLATED CONTENT ${apiCallCount}]`,
        usage: {
          prompt_tokens: 100,
          completion_tokens: 200
        }
      };
    };
    
    try {
      console.log('   Starting translation...');
      
      // Test the combined content translation
      const combinedContent = {
        html: article.content,
        title: article.title,
        summary: article.summary || '',
        metaDescription: article.meta_description || ''
      };
      
      const result = await translator.translateCombinedContent(combinedContent);
      
      console.log('   ✅ Translation completed');
      console.log(`   📊 Total API calls: ${apiCallCount}`);
      console.log(`   📊 API call sizes: ${apiCallSizes.join(', ')} characters`);
      
      // Analyze the results
      if (apiCallCount === 4) {
        console.log('   📋 API calls breakdown:');
        console.log(`      1. HTML content: ${apiCallSizes[0]} chars`);
        console.log(`      2. Title: ${apiCallSizes[1]} chars`);
        console.log(`      3. Summary: ${apiCallSizes[2]} chars`);
        console.log(`      4. Meta description: ${apiCallSizes[3]} chars`);
        
        if (apiCallSizes[0] === article.content.length) {
          console.log('   🎉 SUCCESS: HTML content translated as single chunk!');
        } else {
          console.log('   ❌ FAILURE: HTML content was split');
        }
      } else if (apiCallCount === 1) {
        console.log('   🎉 PERFECT: All content translated in single API call!');
        console.log(`      Combined content size: ${apiCallSizes[0]} chars`);
      } else {
        console.log(`   ⚠️  Unexpected number of API calls: ${apiCallCount}`);
      }
      
    } finally {
      // Restore original function
      openAIModule.chatCompletion = originalChatCompletion;
    }
    
    console.log('');
    
    // Test 2: Compare with automatic chunking
    console.log('🔧 Test 2: Automatic Chunking Comparison (maxChunks = 0)');
    
    const translator2 = new HTMLTranslator('hi', { maxChunks: 0 });
    
    // Mock again for comparison
    let autoApiCallCount = 0;
    let autoApiCallSizes = [];
    
    openAIModule.chatCompletion = async function(params) {
      autoApiCallCount++;
      const contentLength = params.user ? params.user.length : 0;
      autoApiCallSizes.push(contentLength);
      
      console.log(`   📞 Auto API Call #${autoApiCallCount}: ${contentLength} characters`);
      
      return {
        content: `[AUTO TRANSLATED CONTENT ${autoApiCallCount}]`,
        usage: { prompt_tokens: 100, completion_tokens: 200 }
      };
    };
    
    try {
      const combinedContent2 = {
        html: article.content,
        title: article.title,
        summary: article.summary || '',
        metaDescription: article.meta_description || ''
      };
      
      await translator2.translateCombinedContent(combinedContent2);
      
      console.log(`   📊 Automatic chunking API calls: ${autoApiCallCount}`);
      console.log(`   📊 Automatic chunking sizes: ${autoApiCallSizes.join(', ')} characters`);
      
      console.log('');
      console.log('🔍 Comparison:');
      console.log(`   Single chunk (maxChunks=1): ${apiCallCount} API calls`);
      console.log(`   Automatic chunking (maxChunks=0): ${autoApiCallCount} API calls`);
      
      if (apiCallCount <= autoApiCallCount) {
        console.log('   ✅ Single chunk mode uses fewer or equal API calls');
      } else {
        console.log('   ❌ Single chunk mode uses more API calls (unexpected)');
      }
      
    } finally {
      // Restore original function
      openAIModule.chatCompletion = originalChatCompletion;
    }
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    console.log(`Stack: ${error.stack}`);
  }
}

testRealSingleChunk().catch(console.error);
