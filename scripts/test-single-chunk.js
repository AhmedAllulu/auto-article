#!/usr/bin/env node

import { HTMLTranslator } from '../src/services/htmlTranslator.js';

async function testSingleChunk() {
  console.log('🧪 Testing Single Chunk Translation (maxChunks = 1)\n');
  
  const testContent = `<h1>Single Chunk Test Article</h1>
<p>This article tests whether maxChunks = 1 results in true single-chunk translation.</p>
<h2>Section 1: First Section</h2>
<p>This is the first section with some content that should be translated as part of a single chunk.</p>
<h2>Section 2: Second Section</h2>
<p>This is the second section that should also be included in the same single chunk.</p>
<h2>Section 3: Final Section</h2>
<p>This final section completes our test content for single chunk translation.</p>`;

  console.log('📝 Test content:');
  console.log(`   Length: ${testContent.length} characters`);
  console.log(`   Estimated tokens: ${Math.ceil(testContent.length / 4)}`);
  console.log('');
  
  // Test 1: maxChunks = 1 explicitly
  console.log('🔧 Test 1: maxChunks = 1 (explicit)');
  try {
    const translator1 = new HTMLTranslator('es', { maxChunks: 1 });
    
    // Test the chunking logic
    const chunks1 = translator1.splitIntoFixedChunks(testContent, 1);
    console.log(`   ✅ splitIntoFixedChunks(content, 1): ${chunks1.length} chunks`);
    console.log(`   Chunk 1 length: ${chunks1[0].length} characters`);
    console.log(`   Content matches original: ${chunks1[0] === testContent}`);
    
    // Test the translation path
    console.log('   Testing translation path...');
    const { maxChunks } = translator1.options;
    console.log(`   translator.options.maxChunks: ${maxChunks}`);
    
    if (maxChunks && maxChunks > 0) {
      console.log('   ✅ Will use manual chunking path');
      if (maxChunks === 1) {
        console.log('   ✅ Single chunk - should call translateChunk() once');
      } else {
        console.log(`   Will split into ${maxChunks} chunks`);
      }
    } else {
      console.log('   ❌ Will use automatic chunking path (WRONG!)');
    }
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log('');
  
  // Test 2: Default config (should be 1 based on your setting)
  console.log('🔧 Test 2: Using config default (no maxChunks specified)');
  try {
    const translator2 = new HTMLTranslator('es'); // No options
    console.log(`   translator.options: ${JSON.stringify(translator2.options)}`);
    
    const { maxChunks } = translator2.options;
    console.log(`   translator.options.maxChunks: ${maxChunks}`);
    
    if (maxChunks && maxChunks > 0) {
      console.log('   ✅ Will use manual chunking path');
    } else {
      console.log('   ❌ Will use automatic chunking path');
    }
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log('');
  
  // Test 3: Simulate the actual translation flow
  console.log('🔧 Test 3: Simulating actual translation flow');
  try {
    const translator3 = new HTMLTranslator('es', { maxChunks: 1 });
    
    // Mock the translateChunk method to track calls
    let chunkCallCount = 0;
    let chunkSizes = [];
    
    const originalTranslateChunk = translator3.translateChunk;
    translator3.translateChunk = async function(chunk) {
      chunkCallCount++;
      chunkSizes.push(chunk.length);
      console.log(`   📞 translateChunk() call #${chunkCallCount}: ${chunk.length} chars`);
      return `[TRANSLATED CHUNK ${chunkCallCount}]`;
    };
    
    // Test the translateHTML method
    console.log('   Calling translateHTML()...');
    const result = await translator3.translateHTML(testContent);
    
    console.log(`   ✅ Translation completed`);
    console.log(`   📊 translateChunk() called ${chunkCallCount} times`);
    console.log(`   📊 Chunk sizes: ${chunkSizes.join(', ')} characters`);
    console.log(`   📄 Result: ${result}`);
    
    if (chunkCallCount === 1 && chunkSizes[0] === testContent.length) {
      console.log('   🎉 SUCCESS: Single chunk translation working correctly!');
    } else {
      console.log('   ❌ FAILURE: Not using single chunk translation');
    }
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    console.log(`   Stack: ${error.stack}`);
  }
  console.log('');
  
  console.log('🎯 Summary:');
  console.log('For maxChunks = 1, the expected behavior is:');
  console.log('✅ translateChunk() should be called exactly once');
  console.log('✅ The entire article content should be passed as a single chunk');
  console.log('✅ No splitting or chunking should occur');
  console.log('✅ Perfect context preservation across the entire article');
}

testSingleChunk().catch(console.error);
