#!/usr/bin/env node

import axios from 'axios';
import https from 'https';

// Create axios instance with custom timeout and SSL settings
const api = axios.create({
  baseURL: 'https://localhost:3322',
  timeout: 180000, // 3 minutes
  httpsAgent: new https.Agent({
    rejectUnauthorized: false // Accept self-signed certificates
  })
});

async function testTranslationEndpoint() {
  console.log('🧪 Testing Translation Endpoint\n');

  let startTime;

  try {
    // Test with a recent article
    const testData = {
      masterSlug: 'rapid-color-and-texture-changes-in-octopuses-explained',
      targetLanguage: 'es'
    };
    
    console.log(`📡 Testing POST /generate/translate`);
    console.log(`📰 Article: ${testData.masterSlug}`);
    console.log(`🌍 Target language: ${testData.targetLanguage}`);
    console.log(`🕐 Started at: ${new Date().toISOString()}`);

    startTime = Date.now();

    const response = await api.post('/generate/translate', testData);

    const duration = Date.now() - startTime;
    
    console.log(`\n✅ Translation completed successfully!`);
    console.log(`⏱️  Duration: ${duration}ms (${(duration/1000).toFixed(1)}s)`);
    console.log(`📊 Response status: ${response.status}`);
    console.log(`📝 Response data:`, {
      slug: response.data?.data?.slug,
      title: response.data?.data?.title,
      contentLength: response.data?.data?.content?.length,
      aiTokensInput: response.data?.data?.ai_tokens_input,
      aiTokensOutput: response.data?.data?.ai_tokens_output
    });
    
    // Check if translation is valid
    if (response.data?.data?.content && response.data.data.content.length > 1000) {
      console.log(`✅ Translation appears complete`);
    } else {
      console.log(`⚠️  Translation may be incomplete`);
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`\n❌ Translation failed after ${duration}ms`);
    
    if (error.code === 'ECONNABORTED') {
      console.log('🕐 Error: Request timeout');
    } else if (error.response) {
      console.log(`📊 HTTP Status: ${error.response.status}`);
      console.log(`📝 Error response:`, error.response.data);
    } else {
      console.log(`❓ Error: ${error.message}`);
    }
  }
}

async function testMultipleLanguages() {
  console.log('\n🌍 Testing Multiple Languages\n');
  
  const languages = ['de', 'fr', 'es'];
  const testSlug = 'how-mobile-apps-are-made-a-simple-beginners-guide';
  
  for (const lang of languages) {
    console.log(`\n🧪 Testing ${lang} translation...`);
    
    try {
      const startTime = Date.now();
      
      const response = await api.post('/generate/translate', {
        masterSlug: testSlug,
        targetLanguage: lang
      });
      
      const duration = Date.now() - startTime;
      
      console.log(`✅ ${lang} translation successful in ${duration}ms`);
      console.log(`📊 Tokens: ${response.data?.data?.ai_tokens_input} input, ${response.data?.data?.ai_tokens_output} output`);
      
    } catch (error) {
      console.log(`❌ ${lang} translation failed: ${error.message}`);
    }
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

async function main() {
  console.log('🔍 TRANSLATION ENDPOINT TESTING\n');
  console.log('🕐 Started at:', new Date().toISOString());
  console.log('=' .repeat(50));
  
  // Test single translation
  await testTranslationEndpoint();
  
  // Test multiple languages
  await testMultipleLanguages();
  
  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Testing completed at:', new Date().toISOString());
}

main().catch(console.error);
