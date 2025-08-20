#!/usr/bin/env node

import { HTMLTranslator } from '../src/services/htmlTranslator.js';

/**
 * Test script to reproduce and verify the heading translation issue
 */

async function testHeadingTranslation() {
  console.log('🧪 Testing Heading Translation Issue\n');
  console.log('=' .repeat(60));

  // Test content with various heading structures that should be translated
  const testContent = `<h1>Main Article Title</h1>
<p>This is the introduction paragraph that should be translated.</p>

<h2>Section 1: Clarify expectations and goals</h2>
<p>This section content should be translated properly.</p>

<h2>Section 2: Prepare for every meeting and contribute value</h2>
<p>Another section with content that should be translated.</p>

<h3>Subsection A: Important details</h3>
<p>Subsection content that needs translation.</p>

<h3>Subsection B: Additional information</h3>
<p>More subsection content for translation.</p>

<h4>Sub-subsection: Specific points</h4>
<p>Even deeper level content.</p>

<h2>Final Section: Summary and conclusions</h2>
<p>Final paragraph content.</p>`;

  console.log('📝 Original Content:');
  console.log(testContent);
  console.log('\n' + '=' .repeat(60));

  // Test with Arabic (the reported problematic language)
  console.log('\n🌍 Testing Arabic Translation...');
  
  const arabicTranslator = new HTMLTranslator('ar');
  
  try {
    const startTime = Date.now();
    const arabicResult = await arabicTranslator.translateHTML(testContent);
    const duration = Date.now() - startTime;
    
    console.log(`✅ Arabic translation completed in ${duration}ms`);
    console.log('\n📄 Arabic Result:');
    console.log(arabicResult);
    
    // Check if headings were translated
    const originalHeadings = testContent.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/g) || [];
    const translatedHeadings = arabicResult.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/g) || [];
    
    console.log('\n🔍 Heading Analysis:');
    console.log(`Original headings found: ${originalHeadings.length}`);
    console.log(`Translated headings found: ${translatedHeadings.length}`);
    
    let untranslatedCount = 0;
    
    originalHeadings.forEach((originalHeading, index) => {
      const originalText = originalHeading.match(/>([^<]+)</)[1];
      const translatedHeading = translatedHeadings[index];
      
      if (translatedHeading) {
        const translatedText = translatedHeading.match(/>([^<]+)</)[1];
        
        console.log(`\nHeading ${index + 1}:`);
        console.log(`  Original: "${originalText}"`);
        console.log(`  Translated: "${translatedText}"`);
        
        // Check if it looks like it was translated (contains Arabic characters or is different)
        const hasArabicChars = /[\u0600-\u06FF]/.test(translatedText);
        const isDifferent = originalText !== translatedText;
        
        if (!hasArabicChars && !isDifferent) {
          console.log(`  ❌ ISSUE: Heading appears untranslated`);
          untranslatedCount++;
        } else {
          console.log(`  ✅ Appears translated`);
        }
      }
    });
    
    console.log(`\n📊 Summary: ${untranslatedCount} untranslated headings out of ${originalHeadings.length}`);
    
    if (untranslatedCount > 0) {
      console.log('❌ ISSUE CONFIRMED: Some headings are not being translated');
    } else {
      console.log('✅ All headings appear to be translated correctly');
    }
    
  } catch (error) {
    console.log(`❌ Arabic translation failed: ${error.message}`);
  }

  // Test with other languages to see if the issue is widespread
  const testLanguages = ['es', 'fr', 'de'];
  
  for (const lang of testLanguages) {
    console.log(`\n🌍 Testing ${lang.toUpperCase()} Translation...`);
    
    const translator = new HTMLTranslator(lang);
    
    try {
      const result = await translator.translateHTML(testContent);
      
      // Quick check for heading translation
      const originalHeadings = testContent.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/g) || [];
      const translatedHeadings = result.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/g) || [];
      
      let untranslatedCount = 0;
      
      originalHeadings.forEach((originalHeading, index) => {
        const originalText = originalHeading.match(/>([^<]+)</)[1];
        const translatedHeading = translatedHeadings[index];
        
        if (translatedHeading) {
          const translatedText = translatedHeading.match(/>([^<]+)</)[1];
          
          // For non-Arabic languages, check if text changed
          if (originalText === translatedText) {
            untranslatedCount++;
          }
        }
      });
      
      if (untranslatedCount > 0) {
        console.log(`❌ ${lang.toUpperCase()}: ${untranslatedCount} untranslated headings`);
      } else {
        console.log(`✅ ${lang.toUpperCase()}: All headings appear translated`);
      }
      
    } catch (error) {
      console.log(`❌ ${lang.toUpperCase()} translation failed: ${error.message}`);
    }
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('🏁 Heading translation test completed');
}

testHeadingTranslation().catch(console.error);
