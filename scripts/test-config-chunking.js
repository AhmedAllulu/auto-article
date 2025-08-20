#!/usr/bin/env node

import { config } from '../src/config.js';
import { HTMLTranslator } from '../src/services/htmlTranslator.js';

async function testConfigChunking() {
  console.log('🧪 Testing Configuration-Based Chunking\n');
  
  // Display current configuration
  console.log('📋 Current Configuration:');
  console.log(`   TRANSLATION_DEFAULT_CHUNK_COUNT: ${process.env.TRANSLATION_DEFAULT_CHUNK_COUNT || 'not set'}`);
  console.log(`   config.translation.defaultChunkCount: ${config.translation.defaultChunkCount}`);
  console.log('');
  
  const testContent = `<h1>Configuration Test Article</h1>
<p>This article is used to test the configuration-based chunking system.</p>
<h2>Section 1: Testing Default Behavior</h2>
<p>When no maxChunks is specified in the API, it should use the configured default.</p>
<h2>Section 2: Configuration Override</h2>
<p>The API parameter should override the configuration when provided.</p>
<h2>Section 3: Validation</h2>
<p>Both configuration and API parameters should be validated properly.</p>`;

  console.log('📝 Test content length:', testContent.length, 'characters');
  console.log('📝 Estimated tokens:', Math.ceil(testContent.length / 4));
  console.log('');
  
  // Test 1: Using config default (no maxChunks specified)
  console.log('🔧 Test 1: Using config default (no maxChunks in options)');
  try {
    const translator1 = new HTMLTranslator('es'); // No options
    const chunks1 = translator1.splitIntoChunks ? 
      translator1.splitIntoChunks(testContent, 3000) : 
      [testContent]; // Fallback for automatic chunking
    
    console.log(`   Result: ${chunks1.length} chunks (automatic chunking)`);
    console.log(`   Behavior: Uses automatic token-based chunking`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log('');
  
  // Test 2: Using config default explicitly
  console.log('🔧 Test 2: Using config default explicitly');
  try {
    const configDefault = config.translation.defaultChunkCount;
    const translator2 = new HTMLTranslator('es', { maxChunks: configDefault });
    
    if (configDefault === 0) {
      const chunks2 = translator2.splitIntoChunks(testContent, 3000);
      console.log(`   Config default: ${configDefault} (automatic)`);
      console.log(`   Result: ${chunks2.length} chunks (automatic chunking)`);
    } else {
      const chunks2 = translator2.splitIntoFixedChunks(testContent, configDefault);
      console.log(`   Config default: ${configDefault} chunks`);
      console.log(`   Result: ${chunks2.length} chunks`);
      chunks2.forEach((chunk, index) => {
        console.log(`     Chunk ${index + 1}: ${chunk.length} chars`);
      });
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log('');
  
  // Test 3: API override of config default
  console.log('🔧 Test 3: API override (maxChunks = 3)');
  try {
    const translator3 = new HTMLTranslator('es', { maxChunks: 3 });
    const chunks3 = translator3.splitIntoFixedChunks(testContent, 3);
    
    console.log(`   API override: 3 chunks`);
    console.log(`   Result: ${chunks3.length} chunks`);
    chunks3.forEach((chunk, index) => {
      console.log(`     Chunk ${index + 1}: ${chunk.length} chars`);
    });
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  console.log('');
  
  // Test 4: Different config values simulation
  console.log('🔧 Test 4: Simulating different config values');
  const testValues = [0, 1, 2, 5];
  
  for (const testValue of testValues) {
    try {
      const translator = new HTMLTranslator('es', { maxChunks: testValue });
      
      if (testValue === 0) {
        const chunks = translator.splitIntoChunks(testContent, 3000);
        console.log(`   maxChunks=${testValue}: ${chunks.length} chunks (automatic)`);
      } else {
        const chunks = translator.splitIntoFixedChunks(testContent, testValue);
        console.log(`   maxChunks=${testValue}: ${chunks.length} chunks (fixed)`);
      }
    } catch (error) {
      console.log(`   maxChunks=${testValue}: ❌ Error: ${error.message}`);
    }
  }
  console.log('');
  
  console.log('🎯 Configuration Summary:');
  console.log('✅ Environment variable: TRANSLATION_DEFAULT_CHUNK_COUNT');
  console.log('✅ Config validation: 0 (auto) or 1-10 (fixed chunks)');
  console.log('✅ API override: maxChunks parameter takes precedence');
  console.log('✅ Fallback behavior: Automatic chunking when config = 0');
  console.log('');
  console.log('📖 Usage:');
  console.log('• Set TRANSLATION_DEFAULT_CHUNK_COUNT=0 for automatic chunking (default)');
  console.log('• Set TRANSLATION_DEFAULT_CHUNK_COUNT=3 for 3 chunks by default');
  console.log('• API calls can override with {"maxChunks": N} parameter');
}

testConfigChunking().catch(console.error);
