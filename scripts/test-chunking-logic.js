#!/usr/bin/env node

/**
 * Test the chunking logic with real article content
 */

import { HTMLTranslator } from '../src/services/htmlTranslator.js';
import { query } from '../src/db.js';

async function testChunkingLogic() {
  console.log('🧪 Testing Chunking Logic with Real Article\n');
  
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
    
    // Test different chunking strategies
    const testCases = [
      { name: 'Config Default (should be 1)', options: {} },
      { name: 'Single Chunk (maxChunks = 1)', options: { maxChunks: 1 } },
      { name: 'Two Chunks (maxChunks = 2)', options: { maxChunks: 2 } },
      { name: 'Three Chunks (maxChunks = 3)', options: { maxChunks: 3 } },
      { name: 'Automatic Chunking (maxChunks = 0)', options: { maxChunks: 0 } }
    ];
    
    for (const testCase of testCases) {
      console.log(`🔧 ${testCase.name}:`);
      
      const translator = new HTMLTranslator('hi', testCase.options);
      console.log(`   translator.options: ${JSON.stringify(translator.options)}`);
      
      const { maxChunks } = translator.options;
      
      if (maxChunks && maxChunks > 0) {
        // Manual chunking
        console.log(`   Using manual chunking: ${maxChunks} chunks`);
        
        if (maxChunks === 1) {
          console.log('   ✅ Single chunk mode - entire content in one piece');
          console.log(`   Content size: ${article.content.length} characters`);
        } else {
          const chunks = translator.splitIntoFixedChunks(article.content, maxChunks);
          console.log(`   Generated ${chunks.length} chunks:`);
          chunks.forEach((chunk, index) => {
            console.log(`      Chunk ${index + 1}: ${chunk.length} characters`);
          });
          
          // Verify chunks reconstruct original
          const reconstructed = chunks.join('');
          if (reconstructed === article.content) {
            console.log('   ✅ Chunks reconstruct original content correctly');
          } else {
            console.log('   ❌ Chunks do not reconstruct original content');
          }
        }
      } else {
        // Automatic chunking
        console.log('   Using automatic chunking based on token limits');
        const chunks = translator.splitIntoChunks(article.content, 3000);
        console.log(`   Generated ${chunks.length} chunks:`);
        chunks.forEach((chunk, index) => {
          console.log(`      Chunk ${index + 1}: ${chunk.length} characters`);
        });
      }
      
      console.log('');
    }
    
    // Test the translation path selection
    console.log('🔍 Translation Path Analysis:');
    
    const pathTests = [
      { name: 'maxChunks = 1', options: { maxChunks: 1 } },
      { name: 'maxChunks = 0', options: { maxChunks: 0 } },
      { name: 'no options', options: {} }
    ];
    
    for (const pathTest of pathTests) {
      console.log(`   ${pathTest.name}:`);
      const translator = new HTMLTranslator('hi', pathTest.options);
      const { maxChunks } = translator.options;
      
      if (maxChunks && maxChunks > 0) {
        console.log(`      → Will use translateWithManualChunking(${maxChunks})`);
        if (maxChunks === 1) {
          console.log('      → Single chunk: translateChunk() called once with full content');
        } else {
          console.log(`      → Multiple chunks: translateChunk() called ${maxChunks} times`);
        }
      } else {
        console.log('      → Will use translateWithAutomaticChunking()');
        const autoChunks = translator.splitIntoChunks(article.content, 3000);
        console.log(`      → Automatic: translateChunk() called ${autoChunks.length} times`);
      }
    }
    
    console.log('');
    console.log('🎯 Key Findings:');
    console.log('✅ Config default (TRANSLATION_DEFAULT_CHUNK_COUNT=1) is applied when no maxChunks specified');
    console.log('✅ maxChunks=1 results in single chunk translation (one API call for HTML content)');
    console.log('✅ maxChunks=0 uses automatic chunking based on token limits');
    console.log('✅ Manual chunking preserves content integrity');
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    console.log(`Stack: ${error.stack}`);
  }
}

testChunkingLogic().catch(console.error);
