#!/usr/bin/env node

import { HTMLTranslator } from '../src/services/htmlTranslator.js';

async function testRealTranslation() {
  console.log('🧪 Testing Real Translation with Conservative Limits\n');
  
  const testContent = `<h1>Test Article</h1>
<p>This is a test article for translation with the new conservative token limits.</p>
<p>The system should now handle articles of all sizes without timeout errors.</p>
<h2>Key Improvements</h2>
<p>Conservative token limits prevent timeouts and ensure reliable translation.</p>`;
  
  console.log('Original content:');
  console.log(testContent);
  console.log(`\nContent length: ${testContent.length} characters`);
  console.log(`Estimated tokens: ${Math.ceil(testContent.length / 3.5)}`);
  
  const translator = new HTMLTranslator('es');
  
  try {
    console.log('\n🔄 Starting translation...');
    const result = await translator.translateHTML(testContent);
    
    console.log('\n✅ Translation successful!');
    console.log('\nTranslated content:');
    console.log(result);
    console.log(`\nTranslated length: ${result.length} characters`);
    
    const tokenStats = translator.getTokenStats();
    console.log('\n📊 Token Statistics:');
    console.log(`Input tokens: ${tokenStats.input}`);
    console.log(`Output tokens: ${tokenStats.output}`);
    console.log(`Total tokens: ${tokenStats.input + tokenStats.output}`);
    
  } catch (error) {
    console.log('\n❌ Translation failed:', error.message);
    console.log('Stack trace:', error.stack);
  }
}

testRealTranslation().catch(console.error);
