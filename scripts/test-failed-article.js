#!/usr/bin/env node

import { HTMLTranslator } from '../src/services/htmlTranslator.js';
import { query } from '../src/db.js';

async function testFailedArticle() {
  console.log('🧪 Testing Failed Article Translation\n');
  
  try {
    // Get one of the failed articles
    const { rows } = await query(`
      SELECT slug, title, content, LENGTH(content) as content_length
      FROM articles_en 
      WHERE slug = 'rapid-color-and-texture-changes-in-octopuses-explained'
    `);
    
    if (rows.length === 0) {
      console.log('❌ Article not found');
      return;
    }
    
    const article = rows[0];
    console.log(`📰 Testing article: ${article.title}`);
    console.log(`📏 Content length: ${article.content_length} characters`);
    console.log(`🔢 Estimated tokens: ${Math.ceil(article.content_length / 3.5)}`);
    
    // Test translation to different languages
    const languages = ['de', 'fr', 'es', 'pt', 'ar', 'hi'];
    
    for (const lang of languages) {
      console.log(`\n🌍 Testing ${lang} translation...`);
      
      const translator = new HTMLTranslator(lang);
      
      try {
        const startTime = Date.now();
        const result = await translator.translateHTML(article.content);
        const duration = Date.now() - startTime;
        
        console.log(`✅ ${lang} translation successful in ${duration}ms`);
        console.log(`📊 Token stats:`, translator.getTokenStats());
        console.log(`📝 Result length: ${result.length} characters`);
        
        // Check if translation looks valid
        if (result.includes('<h1>') && result.length > article.content_length * 0.5) {
          console.log(`✅ Translation appears valid`);
        } else {
          console.log(`⚠️  Translation may be incomplete`);
        }
        
      } catch (error) {
        console.log(`❌ ${lang} translation failed: ${error.message}`);
        
        // Analyze error type
        if (error.message.includes('timeout')) {
          console.log('   🕐 Error type: Timeout - article may be too long');
        } else if (error.message.includes('token') || error.message.includes('context')) {
          console.log('   🔢 Error type: Token limit exceeded');
        } else if (error.message.includes('rate limit') || error.message.includes('429')) {
          console.log('   🚦 Error type: Rate limit');
        } else {
          console.log('   ❓ Error type: Other -', error.message);
        }
      }
      
      // Add delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testFailedArticle().catch(console.error);
