#!/usr/bin/env node

import { HTMLTranslator } from '../src/services/htmlTranslator.js';

async function testJsonLdTranslation() {
  console.log('🧪 Testing JSON-LD Translation in Arabic\n');
  
  const testContent = `<h1>Test Article</h1>
<p>This is a test article with FAQ content.</p>

<h2>Frequently Asked Questions</h2>
<h3>What is the first step?</h3>
<p>The first step is to understand the process.</p>

<h3>How often should I do this?</h3>
<p>You should do this regularly for best results.</p>

<script type="application/ld+json">
[{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "What is the first step?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "The first step is to understand the process completely."
    }
  }, {
    "@type": "Question", 
    "name": "How often should I do this?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "You should do this regularly for best results and optimal performance."
    }
  }]
}]
</script>`;

  console.log('📝 Original content:');
  console.log(testContent);
  
  try {
    console.log('\n🌍 Testing Arabic translation...');
    const translator = new HTMLTranslator('ar');
    const result = await translator.translateHTML(testContent);
    
    console.log('\n✅ Translation successful!');
    console.log('📄 Result:');
    console.log(result);
    
    // Check if JSON-LD questions were translated
    console.log('\n🔍 Checking JSON-LD translation:');
    
    const originalQuestions = [
      'What is the first step?',
      'How often should I do this?'
    ];
    
    let jsonLdTranslated = true;
    originalQuestions.forEach(question => {
      if (result.includes(question)) {
        console.log(`❌ UNTRANSLATED in JSON-LD: "${question}"`);
        jsonLdTranslated = false;
      } else {
        console.log(`✅ TRANSLATED in JSON-LD: "${question}"`);
      }
    });
    
    if (jsonLdTranslated) {
      console.log('\n🎉 JSON-LD content appears to be translated!');
    } else {
      console.log('\n❌ JSON-LD content still contains English text');
    }
    
    const tokenStats = translator.getTokenStats();
    console.log('\n📊 Token stats:', tokenStats);
    
  } catch (error) {
    console.log('\n❌ Translation failed:', error.message);
    console.log('Stack:', error.stack);
  }
}

testJsonLdTranslation().catch(console.error);
