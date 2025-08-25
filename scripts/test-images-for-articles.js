import { query } from '../src/db.js';
import { fetchBestImageUrl } from '../src/services/unsplash.js';
import { articlesTable } from '../src/utils/articlesTable.js';
import fs from 'fs/promises';

async function main() {
  console.log('🔍 Testing image search for existing articles...');
  
  const language = 'en';
  const tableName = articlesTable(language);
  
  // Get articles without images or with potentially broken images
  const articlesResult = await query(`
    SELECT
      a.id, a.title, a.slug, a.summary, a.meta_description, a.category_id, a.image_url,
      c.name AS category_name, c.slug AS category_slug
    FROM ${tableName} a
    LEFT JOIN categories c ON c.id = a.category_id
    WHERE a.language_code = $1
    ORDER BY a.published_at DESC
    LIMIT 20
  `, [language]);
  
  const articles = articlesResult.rows;
  console.log(`Found ${articles.length} articles to test`);
  
  const results = [];
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    console.log(`\n[${i + 1}/${articles.length}] Testing: "${article.title}"`);
    console.log(`Category: ${article.category_name} (${article.category_slug})`);
    console.log(`Current image: ${article.image_url || 'NONE'}`);
    
    const testResult = {
      id: article.id,
      title: article.title,
      slug: article.slug,
      category: article.category_slug,
      currentImage: article.image_url,
      searches: []
    };
    
    // Test different search strategies
    const searchQueries = [
      { type: 'title', query: article.title },
      { type: 'summary', query: article.summary || article.meta_description },
      { type: 'title_simplified', query: simplifyTitle(article.title) },
      { type: 'category_fallback', query: article.category_name }
    ].filter(s => s.query && s.query.trim());
    
    for (const search of searchQueries) {
      console.log(`  Testing search: ${search.type} - "${search.query}"`);
      
      try {
        const imageUrl = await fetchBestImageUrl(search.query, article.category_slug);
        
        const searchResult = {
          type: search.type,
          query: search.query,
          imageUrl: imageUrl,
          success: !!imageUrl,
          provider: imageUrl ? getProvider(imageUrl) : null,
          isSvg: imageUrl ? imageUrl.toLowerCase().includes('.svg') : false,
          isOptimized: imageUrl ? isOptimizedUrl(imageUrl) : false
        };
        
        testResult.searches.push(searchResult);
        
        if (imageUrl) {
          console.log(`    ✅ Found: ${getProvider(imageUrl)}`);
          console.log(`    🔗 ${imageUrl.substring(0, 80)}...`);
          if (searchResult.isSvg) console.log(`    ⚠️  SVG detected`);
          if (searchResult.isOptimized) console.log(`    ⚡ Optimized`);
          break; // Stop at first successful result
        } else {
          console.log(`    ❌ No image found`);
        }
      } catch (error) {
        console.log(`    💥 Error: ${error.message}`);
        testResult.searches.push({
          type: search.type,
          query: search.query,
          error: error.message,
          success: false
        });
      }
    }
    
    const hasValidImage = testResult.searches.some(s => s.success && !s.isSvg);
    if (hasValidImage) {
      successCount++;
      console.log(`  ✅ SUCCESS: Found valid image`);
    } else {
      failCount++;
      console.log(`  ❌ FAILED: No valid image found`);
    }
    
    results.push(testResult);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalArticles: articles.length,
      successCount,
      failCount,
      successRate: Math.round((successCount / articles.length) * 100)
    },
    results
  };
  
  // Save detailed results to file
  const filename = `image-search-test-${Date.now()}.json`;
  await fs.writeFile(filename, JSON.stringify(report, null, 2));
  
  // Generate summary report
  const summaryLines = [
    '# Image Search Test Results',
    `Generated: ${new Date().toLocaleString()}`,
    '',
    '## Summary',
    `- Total articles tested: ${articles.length}`,
    `- Successful image searches: ${successCount}`,
    `- Failed searches: ${failCount}`,
    `- Success rate: ${report.summary.successRate}%`,
    '',
    '## Provider Distribution',
  ];
  
  const providerCounts = {};
  results.forEach(r => {
    r.searches.forEach(s => {
      if (s.success && s.provider) {
        providerCounts[s.provider] = (providerCounts[s.provider] || 0) + 1;
      }
    });
  });
  
  Object.entries(providerCounts).forEach(([provider, count]) => {
    summaryLines.push(`- ${provider}: ${count}`);
  });
  
  summaryLines.push('', '## Issues Found');
  const svgCount = results.reduce((acc, r) => acc + r.searches.filter(s => s.isSvg).length, 0);
  const errorCount = results.reduce((acc, r) => acc + r.searches.filter(s => s.error).length, 0);
  
  summaryLines.push(`- SVG images: ${svgCount}`);
  summaryLines.push(`- Errors: ${errorCount}`);
  
  summaryLines.push('', '## Sample Results');
  results.slice(0, 5).forEach(r => {
    const successfulSearch = r.searches.find(s => s.success);
    summaryLines.push(`### ${r.title}`);
    summaryLines.push(`- Category: ${r.category}`);
    if (successfulSearch) {
      summaryLines.push(`- Found via: ${successfulSearch.type}`);
      summaryLines.push(`- Provider: ${successfulSearch.provider}`);
      summaryLines.push(`- URL: ${successfulSearch.imageUrl}`);
    } else {
      summaryLines.push(`- Status: No image found`);
    }
    summaryLines.push('');
  });
  
  const summaryFilename = `image-search-summary-${Date.now()}.md`;
  await fs.writeFile(summaryFilename, summaryLines.join('\n'));
  
  console.log(`\n📊 FINAL RESULTS`);
  console.log(`================`);
  console.log(`✅ Success rate: ${successCount}/${articles.length} (${report.summary.successRate}%)`);
  console.log(`📁 Detailed results: ${filename}`);
  console.log(`📋 Summary report: ${summaryFilename}`);
  
  if (report.summary.successRate >= 80) {
    console.log(`\n🎉 EXCELLENT! High success rate achieved.`);
  } else if (report.summary.successRate >= 60) {
    console.log(`\n✅ GOOD! Reasonable success rate.`);
  } else {
    console.log(`\n⚠️  NEEDS IMPROVEMENT: Low success rate.`);
  }
  
  process.exit(0);
}

function simplifyTitle(title) {
  return title
    .replace(/\b(the|best|top|guide|to|for|of|in|on|with|how|what|why|when|where|a|an)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getProvider(url) {
  if (url.includes('unsplash.com')) return 'Unsplash';
  if (url.includes('openverse.org')) return 'Openverse (proxy)';
  if (url.includes('wikimedia.org')) return 'Wikimedia';
  if (url.includes('flickr.com')) return 'Flickr';
  return 'Other';
}

function isOptimizedUrl(url) {
  return url.includes('full_size=true') || 
         url.includes('compressed=true') || 
         url.includes('auto=format') || 
         url.includes('q=85');
}

main().catch(console.error);
