#!/usr/bin/env node

import { HTMLTranslator } from '../src/services/htmlTranslator.js';

async function testTranslation() {
  console.log('🧪 Testing HTMLTranslator directly\n');
  
  const testContent = `<h1>Test Article</h1>
<p>This is a simple test paragraph.</p>
<h2>Section 1: Important Information</h2>
<p>This section contains important details.</p>`;

  console.log('📝 Original content:');
  console.log(testContent);
  
  try {
    console.log('\n🌍 Testing Spanish translation...');
    const translator = new HTMLTranslator('es');
    const result = await translator.translateHTML(testContent);
    
    console.log('\n✅ Translation successful!');
    console.log('📄 Result:');
    console.log(result);
    
    const tokenStats = translator.getTokenStats();
    console.log('\n📊 Token stats:', tokenStats);
    
  } catch (error) {
    console.log('\n❌ Translation failed:', error.message);
    console.log('Stack:', error.stack);
  }
}

testTranslation().catch(console.error);
