#!/usr/bin/env node

/**
 * Test script for HTML Sitemap functionality
 * Usage: node scripts/test-html-sitemap.js
 */

const BASE_URL = process.env.CANONICAL_BASE_URL || 'http://localhost:3000';

/**
 * Test HTML sitemap accessibility and structure
 */
async function testHtmlSitemap() {
  console.log('\n🗺️  Testing HTML Sitemap');
  console.log('========================');
  
  const sitemapUrl = `${BASE_URL}/sitemap`;
  console.log(`URL: ${sitemapUrl}`);
  
  try {
    const response = await fetch(sitemapUrl);
    
    // Check HTTP status
    if (!response.ok) {
      console.log(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      return { success: false, error: `HTTP ${response.status}` };
    }
    
    // Check content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('text/html')) {
      console.log(`⚠️  Warning: Content-Type is '${contentType}', expected HTML`);
    }
    
    // Get HTML content
    const htmlContent = await response.text();
    
    // Validate HTML structure
    const validation = validateHtmlSitemap(htmlContent);
    
    // Display results
    console.log(`✅ Status: ${response.status}`);
    console.log(`📄 Content-Type: ${contentType}`);
    console.log(`📏 Content Length: ${htmlContent.length} bytes`);
    console.log(`🔍 Validation: ${validation.isValid ? '✅ Valid' : '❌ Invalid'}`);
    
    if (validation.stats) {
      console.log(`📊 Statistics:`);
      console.log(`   - Internal Links: ${validation.stats.internalLinks}`);
      console.log(`   - Categories Found: ${validation.stats.categories}`);
      console.log(`   - Articles Found: ${validation.stats.articles}`);
      console.log(`   - Static Pages: ${validation.stats.staticPages}`);
    }
    
    if (validation.errors.length > 0) {
      console.log(`⚠️  Issues found:`);
      validation.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
    }
    
    if (validation.seoFeatures.length > 0) {
      console.log(`🎯 SEO Features:`);
      validation.seoFeatures.forEach(feature => {
        console.log(`   ✅ ${feature}`);
      });
    }
    
    return {
      success: true,
      status: response.status,
      contentType,
      contentLength: htmlContent.length,
      validation
    };
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Validate HTML sitemap content and structure
 */
function validateHtmlSitemap(content) {
  const errors = [];
  const seoFeatures = [];
  let isValid = true;
  
  // Check for basic HTML structure
  if (!content.includes('<!DOCTYPE html>')) {
    errors.push('Missing DOCTYPE declaration');
    isValid = false;
  }
  
  if (!content.includes('<html')) {
    errors.push('Missing HTML root element');
    isValid = false;
  }
  
  // Check for essential meta tags
  if (!content.includes('<meta charset="UTF-8">')) {
    errors.push('Missing charset meta tag');
  }
  
  if (!content.includes('<meta name="viewport"')) {
    errors.push('Missing viewport meta tag');
  }
  
  if (!content.includes('<meta name="description"')) {
    errors.push('Missing description meta tag');
  } else {
    seoFeatures.push('Meta description present');
  }
  
  if (!content.includes('<meta name="robots"')) {
    errors.push('Missing robots meta tag');
  } else {
    seoFeatures.push('Robots meta tag present');
  }
  
  // Check for canonical URL
  if (!content.includes('<link rel="canonical"')) {
    errors.push('Missing canonical URL');
  } else {
    seoFeatures.push('Canonical URL present');
  }
  
  // Check for structured data
  if (!content.includes('application/ld+json')) {
    errors.push('Missing structured data (JSON-LD)');
  } else {
    seoFeatures.push('Structured data (JSON-LD) present');
  }
  
  // Check for title tag
  if (!content.includes('<title>')) {
    errors.push('Missing title tag');
    isValid = false;
  } else {
    seoFeatures.push('Title tag present');
  }
  
  // Check for sitemap-specific content
  if (!content.includes('Site Map')) {
    errors.push('Missing sitemap heading');
  }
  
  // Count internal links
  const internalLinkMatches = content.match(/<a[^>]+href="[^"]*"[^>]*>/g) || [];
  const internalLinks = internalLinkMatches.length;
  
  if (internalLinks < 10) {
    errors.push(`Too few internal links (${internalLinks}), expected at least 10`);
  } else {
    seoFeatures.push(`${internalLinks} internal links for crawl discovery`);
  }
  
  // Check for category sections
  const categoryMatches = content.match(/category\//g) || [];
  const categories = categoryMatches.length;
  
  if (categories === 0) {
    errors.push('No category links found');
  } else {
    seoFeatures.push(`${categories} category links present`);
  }
  
  // Check for article links
  const articleMatches = content.match(/article\//g) || [];
  const articles = articleMatches.length;
  
  if (articles === 0) {
    errors.push('No article links found');
  } else {
    seoFeatures.push(`${articles} article links present`);
  }
  
  // Check for static page links
  const staticPageMatches = content.match(/(\/about|\/contact|\/faq|\/privacy|\/terms)/g) || [];
  const staticPages = staticPageMatches.length;
  
  if (staticPages === 0) {
    errors.push('No static page links found');
  } else {
    seoFeatures.push(`${staticPages} static page links present`);
  }
  
  // Check for responsive design
  if (!content.includes('viewport')) {
    errors.push('Missing responsive design meta tag');
  } else {
    seoFeatures.push('Responsive design meta tag present');
  }
  
  // Check for CSS styling
  if (!content.includes('<style>') && !content.includes('.css')) {
    errors.push('No CSS styling detected');
  } else {
    seoFeatures.push('CSS styling present');
  }
  
  // Check for semantic HTML
  if (content.includes('<nav>') || content.includes('<section>') || content.includes('<article>')) {
    seoFeatures.push('Semantic HTML elements present');
  }
  
  // Check for accessibility features
  if (content.includes('alt=') || content.includes('aria-')) {
    seoFeatures.push('Accessibility features present');
  }
  
  const stats = {
    internalLinks,
    categories,
    articles,
    staticPages
  };
  
  return {
    isValid,
    errors,
    seoFeatures,
    stats
  };
}

/**
 * Test sitemap with different language parameters
 */
async function testSitemapLanguages() {
  console.log('\n🌐 Testing Sitemap Language Support');
  console.log('===================================');
  
  const languages = ['en', 'de', 'fr', 'es'];
  const results = {};
  
  for (const lang of languages) {
    console.log(`\nTesting language: ${lang}`);
    const url = `${BASE_URL}/sitemap?lang=${lang}`;
    
    try {
      const response = await fetch(url);
      const success = response.ok;
      
      console.log(`${success ? '✅' : '❌'} ${lang}: ${response.status}`);
      
      if (success) {
        const content = await response.text();
        const hasLangAttribute = content.includes(`lang="${lang}"`);
        console.log(`   Language attribute: ${hasLangAttribute ? '✅' : '❌'}`);
        
        results[lang] = {
          success: true,
          status: response.status,
          hasLangAttribute
        };
      } else {
        results[lang] = {
          success: false,
          status: response.status
        };
      }
    } catch (error) {
      console.log(`❌ ${lang}: Error - ${error.message}`);
      results[lang] = {
        success: false,
        error: error.message
      };
    }
  }
  
  return results;
}

/**
 * Test sitemap performance and caching
 */
async function testSitemapPerformance() {
  console.log('\n⚡ Testing Sitemap Performance');
  console.log('==============================');
  
  const url = `${BASE_URL}/sitemap`;
  const startTime = Date.now();
  
  try {
    const response = await fetch(url);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`Response Time: ${responseTime}ms`);
    console.log(`Status: ${response.status}`);
    
    // Check caching headers
    const cacheControl = response.headers.get('cache-control');
    const lastModified = response.headers.get('last-modified');
    const etag = response.headers.get('etag');
    
    console.log(`Cache-Control: ${cacheControl || 'Not set'}`);
    console.log(`Last-Modified: ${lastModified || 'Not set'}`);
    console.log(`ETag: ${etag || 'Not set'}`);
    
    // Performance assessment
    let performanceRating = 'Good';
    if (responseTime > 2000) {
      performanceRating = 'Poor';
    } else if (responseTime > 1000) {
      performanceRating = 'Fair';
    }
    
    console.log(`Performance Rating: ${performanceRating}`);
    
    return {
      success: true,
      responseTime,
      performanceRating,
      caching: {
        cacheControl: !!cacheControl,
        lastModified: !!lastModified,
        etag: !!etag
      }
    };
    
  } catch (error) {
    console.log(`❌ Performance test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Main test function
 */
async function testHtmlSitemapSystem() {
  console.log('🗺️  Testing HTML Sitemap System');
  console.log('===============================');
  console.log(`Base URL: ${BASE_URL}`);
  
  const results = {
    htmlSitemap: null,
    languages: null,
    performance: null
  };
  
  // Test 1: Basic HTML sitemap functionality
  results.htmlSitemap = await testHtmlSitemap();
  
  // Test 2: Language support
  results.languages = await testSitemapLanguages();
  
  // Test 3: Performance and caching
  results.performance = await testSitemapPerformance();
  
  // Summary
  console.log('\n📊 HTML Sitemap Test Summary');
  console.log('============================');
  
  const tests = [
    { name: 'HTML Sitemap', result: results.htmlSitemap },
    { name: 'Language Support', result: results.languages },
    { name: 'Performance', result: results.performance }
  ];
  
  tests.forEach(test => {
    if (test.result?.success) {
      console.log(`✅ ${test.name}: Passed`);
    } else if (test.result?.success === false) {
      console.log(`❌ ${test.name}: Failed - ${test.result.error || 'Unknown error'}`);
    } else {
      console.log(`❓ ${test.name}: Mixed results`);
    }
  });
  
  console.log('\n💡 SEO Benefits of HTML Sitemaps:');
  console.log('=================================');
  console.log('✅ Internal linking structure for better crawl discovery');
  console.log('✅ Googlebot crawls internal links more aggressively than XML sitemaps');
  console.log('✅ User-friendly navigation and content discovery');
  console.log('✅ Improved site architecture and information hierarchy');
  console.log('✅ Enhanced crawl budget utilization');
  console.log('✅ Better indexing of deep pages and content');
  
  console.log('\n🎉 HTML Sitemap Test Completed');
  console.log('===============================');
  
  return results;
}

// Run tests
testHtmlSitemapSystem().catch(error => {
  console.error('HTML sitemap test script failed:', error);
  process.exit(1);
});
