#!/usr/bin/env node

import { HTMLTranslator } from '../src/services/htmlTranslator.js';

async function testManualChunking() {
  console.log('🧪 Testing Manual Chunking Feature\n');
  
  const testContent = `<h1>Test Article for Chunking</h1>
<p>This is the first paragraph with some content to test chunking behavior.</p>
<h2>Section 1: Introduction</h2>
<p>This section introduces the topic and provides background information that should be translated consistently.</p>
<h2>Section 2: Main Content</h2>
<p>This is the main content section with detailed information about the subject matter.</p>
<p>Additional paragraph with more details and explanations to make the content longer.</p>
<h2>Section 3: Advanced Topics</h2>
<p>This section covers advanced topics and complex scenarios that require careful translation.</p>
<p>More content to ensure we have enough text for meaningful chunking tests.</p>
<h2>Section 4: Conclusion</h2>
<p>Final thoughts and summary of the key points discussed in this article.</p>
<p>Last paragraph with concluding remarks and future considerations.</p>`;

  console.log('📝 Original content length:', testContent.length, 'characters');
  console.log('📝 Estimated tokens:', Math.ceil(testContent.length / 4));
  
  // Test different chunk counts
  const chunkCounts = [1, 2, 3, 4];
  
  for (const maxChunks of chunkCounts) {
    console.log(`\n🔧 Testing with maxChunks = ${maxChunks}`);
    console.log('='.repeat(50));
    
    try {
      const translator = new HTMLTranslator('es', { maxChunks });
      
      // Test the chunking logic without actually translating
      const chunks = translator.splitIntoFixedChunks(testContent, maxChunks);
      
      console.log(`📊 Generated ${chunks.length} chunks:`);
      chunks.forEach((chunk, index) => {
        console.log(`  Chunk ${index + 1}: ${chunk.length} chars`);
        console.log(`    Preview: "${chunk.substring(0, 60)}..."`);
      });
      
      // Verify chunks reconstruct the original
      const reconstructed = chunks.join('');
      if (reconstructed === testContent) {
        console.log('✅ Chunks reconstruct original content correctly');
      } else {
        console.log('❌ Chunks do not reconstruct original content');
        console.log('Original length:', testContent.length);
        console.log('Reconstructed length:', reconstructed.length);
      }
      
    } catch (error) {
      console.log(`❌ Error with maxChunks=${maxChunks}:`, error.message);
    }
  }
  
  // Test automatic chunking (no maxChunks)
  console.log(`\n🔧 Testing automatic chunking (no maxChunks)`);
  console.log('='.repeat(50));
  
  try {
    const translator = new HTMLTranslator('es'); // No maxChunks option
    
    // Test the automatic chunking logic
    const chunks = translator.splitIntoChunks(testContent, 3000); // Using default MAX_TOKENS
    
    console.log(`📊 Automatic chunking generated ${chunks.length} chunks:`);
    chunks.forEach((chunk, index) => {
      console.log(`  Chunk ${index + 1}: ${chunk.length} chars`);
      console.log(`    Preview: "${chunk.substring(0, 60)}..."`);
    });
    
  } catch (error) {
    console.log('❌ Error with automatic chunking:', error.message);
  }
}

testManualChunking().catch(console.error);
