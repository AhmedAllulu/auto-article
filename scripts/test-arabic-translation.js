#!/usr/bin/env node

import { HTMLTranslator } from '../src/services/htmlTranslator.js';

async function testArabicTranslation() {
  console.log('🧪 Testing Arabic Translation with Headings\n');
  
  const testContent = `<h1>Test Article</h1>
<p>This is a simple test paragraph.</p>
<h2>Section 1: Clarify expectations and goals</h2>
<p>This section contains important details about expectations.</p>
<h2>Section 2: Prepare for every meeting and contribute value</h2>
<p>This section explains how to prepare for meetings.</p>
<h3>Subsection A: Important details</h3>
<p>More detailed information here.</p>`;

  console.log('📝 Original content:');
  console.log(testContent);
  
  try {
    console.log('\n🌍 Testing Arabic translation...');
    const translator = new HTMLTranslator('ar');
    const result = await translator.translateHTML(testContent);
    
    console.log('\n✅ Translation successful!');
    console.log('📄 Result:');
    console.log(result);
    
    const tokenStats = translator.getTokenStats();
    console.log('\n📊 Token stats:', tokenStats);
    
    // Check if headings were translated
    console.log('\n🔍 Checking if headings were translated:');
    
    const originalHeadings = [
      'Test Article',
      'Section 1: Clarify expectations and goals',
      'Section 2: Prepare for every meeting and contribute value',
      'Subsection A: Important details'
    ];
    
    originalHeadings.forEach(heading => {
      if (result.includes(heading)) {
        console.log(`❌ UNTRANSLATED: "${heading}"`);
      } else {
        console.log(`✅ TRANSLATED: "${heading}"`);
      }
    });
    
  } catch (error) {
    console.log('\n❌ Translation failed:', error.message);
    console.log('Stack:', error.stack);
  }
}

testArabicTranslation().catch(console.error);
