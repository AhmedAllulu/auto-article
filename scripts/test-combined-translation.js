#!/usr/bin/env node

import HTMLTranslator from '../src/services/htmlTranslator.js';

// Test the new combined content translation strategy
async function testCombinedTranslation() {
  console.log('Testing Combined Content Translation Strategy...\n');

  // Create test content similar to real articles
  const testContent = {
    title: 'The Future of Artificial Intelligence in Healthcare',
    summary: 'This article explores how AI is revolutionizing healthcare through advanced diagnostics, personalized treatment plans, and improved patient outcomes.',
    metaDescription: 'Discover how artificial intelligence is transforming healthcare with innovative solutions for better patient care and medical efficiency.',
    html: `
      <h1>The Future of Artificial Intelligence in Healthcare</h1>
      <p>Artificial intelligence is rapidly transforming the healthcare industry, offering unprecedented opportunities to improve patient care, streamline operations, and advance medical research.</p>
      
      <h2>AI in Medical Diagnostics</h2>
      <p>Machine learning algorithms are now capable of analyzing medical images with accuracy that rivals or exceeds human specialists. From detecting early-stage cancers in radiology scans to identifying diabetic retinopathy in eye exams, AI is becoming an invaluable diagnostic tool.</p>
      
      <h2>Personalized Treatment Plans</h2>
      <p>By analyzing vast amounts of patient data, including genetic information, medical history, and lifestyle factors, AI systems can help doctors create highly personalized treatment plans that are more effective and have fewer side effects.</p>
      
      <h2>Drug Discovery and Development</h2>
      <p>AI is accelerating the drug discovery process by predicting how different compounds will interact with biological targets, potentially reducing the time and cost of bringing new medications to market.</p>
      
      <h2>Challenges and Considerations</h2>
      <p>While the potential benefits are enormous, the integration of AI in healthcare also raises important questions about data privacy, algorithmic bias, and the need for regulatory oversight to ensure patient safety.</p>
      
      <h2>The Road Ahead</h2>
      <p>As AI technology continues to evolve, we can expect to see even more innovative applications in healthcare, from robotic surgery assistants to AI-powered mental health support systems.</p>
      
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "The Future of Artificial Intelligence in Healthcare",
        "description": "This article explores how AI is revolutionizing healthcare through advanced diagnostics, personalized treatment plans, and improved patient outcomes.",
        "author": {
          "@type": "Organization",
          "name": "TechNews"
        },
        "datePublished": "2024-01-15",
        "inLanguage": "en"
      }
      </script>
    `.trim()
  };

  console.log('--- Test Content ---');
  console.log(`Title: ${testContent.title}`);
  console.log(`Summary length: ${testContent.summary.length} chars`);
  console.log(`Meta description length: ${testContent.metaDescription.length} chars`);
  console.log(`HTML content length: ${testContent.html.length} chars`);
  console.log(`Total content length: ${JSON.stringify(testContent).length} chars`);
  console.log(`Estimated total tokens: ${Math.ceil(JSON.stringify(testContent).length / 4)}`);

  const translator = new HTMLTranslator('es'); // Test Spanish translation
  
  // Mock the translateWhole method to avoid actual API calls
  let apiCallCount = 0;
  const originalTranslateWhole = translator.translateWhole;
  
  translator.translateWhole = async function(chunk) {
    apiCallCount++;
    console.log(`\n  API Call ${apiCallCount}:`);
    console.log(`    Chunk length: ${chunk.length} chars (${Math.ceil(chunk.length / 4)} tokens)`);
    console.log(`    Chunk preview: ${chunk.substring(0, 100)}...`);
    
    // Simple mock translation - replace English words with Spanish equivalents
    let translated = chunk
      .replace(/The Future of/g, 'El Futuro de')
      .replace(/Artificial Intelligence/g, 'Inteligencia Artificial')
      .replace(/Healthcare/g, 'Atención Médica')
      .replace(/This article explores/g, 'Este artículo explora')
      .replace(/Medical Diagnostics/g, 'Diagnósticos Médicos')
      .replace(/Personalized Treatment/g, 'Tratamiento Personalizado')
      .replace(/Drug Discovery/g, 'Descubrimiento de Medicamentos')
      .replace(/Challenges and Considerations/g, 'Desafíos y Consideraciones')
      .replace(/The Road Ahead/g, 'El Camino por Delante');
    
    return { 
      translated,
      usage: { prompt_tokens: Math.ceil(chunk.length / 4), completion_tokens: Math.ceil(translated.length / 4) }
    };
  };

  console.log('\n--- Testing Combined Translation ---');
  
  try {
    const result = await translator.translateCombinedContent(testContent);
    
    console.log(`\n✅ Translation completed successfully!`);
    console.log(`📊 Total API calls: ${apiCallCount}`);
    console.log(`🎯 Expected: 1-2 calls (vs 4+ with old method)`);
    
    console.log('\n--- Translation Results ---');
    console.log(`Translated title: ${result.title}`);
    console.log(`Translated summary: ${result.summary.substring(0, 100)}...`);
    console.log(`Translated meta desc: ${result.metaDescription.substring(0, 100)}...`);
    console.log(`Translated HTML length: ${result.html.length} chars`);
    
    // Verify all components were translated
    const hasTranslatedTitle = result.title.includes('Inteligencia Artificial');
    const hasTranslatedSummary = result.summary.includes('artículo') || result.summary.includes('Este');
    const hasTranslatedHtml = result.html.includes('Inteligencia Artificial');
    
    console.log('\n--- Validation ---');
    console.log(`✅ Title translated: ${hasTranslatedTitle ? 'Yes' : 'No'}`);
    console.log(`✅ Summary translated: ${hasTranslatedSummary ? 'Yes' : 'No'}`);
    console.log(`✅ HTML translated: ${hasTranslatedHtml ? 'Yes' : 'No'}`);
    console.log(`✅ Structure preserved: ${result.html.includes('<h1>') && result.html.includes('<script') ? 'Yes' : 'No'}`);
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    console.error(error);
  }

  console.log('\n--- Performance Comparison ---');
  console.log('🔴 OLD METHOD (per article):');
  console.log('   - HTML content: 1-4+ API calls');
  console.log('   - Title: 1 API call');
  console.log('   - Summary: 1 API call');
  console.log('   - Meta description: 1 API call');
  console.log('   - TOTAL: 4-7+ API calls per article');
  console.log('');
  console.log('🟢 NEW METHOD (per article):');
  console.log('   - Combined content: 1-2 API calls');
  console.log('   - TOTAL: 1-2 API calls per article');
  console.log('');
  console.log('📈 IMPROVEMENT:');
  console.log('   - 60 articles × 20 languages × 4-7 calls = 4,800-8,400 API calls');
  console.log('   - 60 articles × 20 languages × 1-2 calls = 1,200-2,400 API calls');
  console.log('   - REDUCTION: 50-75% fewer API calls! 🎉');
}

// Run the test
testCombinedTranslation().catch(console.error);
