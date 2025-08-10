#!/usr/bin/env node

/**
 * Enhanced Article Generation Test Script
 * 
 * This script tests the enhanced professional article generation system
 * with support for different content types, quality levels, and analysis.
 * 
 * Usage:
 *   node scripts/generate-article.js [options]
 * 
 * Examples:
 *   node scripts/generate-article.js --topic "AI in healthcare" --category technology --language en
 *   node scripts/generate-article.js --content-type THOUGHT_LEADERSHIP --professional-grade
 *   node scripts/generate-article.js --news-analysis --headline "Major tech acquisition announced"
 *   node scripts/generate-article.js --batch 5 --mixed-types
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import fs from 'fs/promises';
import { program } from 'commander';

// Load environment variables
dotenv.config();

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// Import services
import { 
  triggerProfitableGeneration,
  generateNewsBasedArticle,
  ENHANCED_CONTENT_STRATEGIES,
  PROFESSIONAL_WRITING_STYLES 
} from '../src/services/articleGeneratorService.js';
import { generateArticleViaAPI } from '../src/services/aiClient.js';
import { listCategories } from '../src/models/categoryModel.js';
import { createSlug, buildMeta, estimateReadingTimeMinutes } from '../src/utils/seo.js';
import { discoverTrendingTopicsWithAI } from '../src/services/trendsService.js';
import logger from '../src/lib/logger.js';

// Test configurations
const SUPPORTED_LANGUAGES = ['en', 'de', 'fr', 'es', 'pt', 'ar', 'hi'];
const SUPPORTED_CATEGORIES = ['technology', 'finance', 'business', 'health', 'travel', 'sports', 'entertainment'];
const CONTENT_TYPES = Object.keys(ENHANCED_CONTENT_STRATEGIES);

// Quality analysis functions
function analyzeArticleQuality(article, target = {}) {
  const content = article.content || '';
  const title = article.title || '';
  
  return {
    // Professional tone analysis
    professionalTone: analyzeProfessionalTone(content),
    
    // Structure and formatting
    structuralIntegrity: analyzeStructure(content),
    
    // Content depth and value
    contentDepth: analyzeDepth(content),
    
    // Actionability for readers
    actionability: analyzeActionability(content),
    
    // Readability optimization
    readability: analyzeReadability(content),
    
    // SEO optimization
    seoOptimization: analyzeSEO(title, content, article.metaDescription),
    
    // Professional grade indicators
    executiveReadiness: analyzeExecutiveReadiness(content),
    
    // Business value assessment
    businessValue: analyzeBusinessValue(content, target.categorySlug),
    
    // Evidence and credibility
    evidenceQuality: analyzeEvidenceQuality(content),
    
    // Strategic insights
    strategicInsights: analyzeStrategicInsights(content)
  };
}

function analyzeProfessionalTone(content) {
  const professionalIndicators = [
    /\b(according to|research shows|data indicates|studies reveal|analysis suggests)\b/gi,
    /\b(furthermore|moreover|consequently|therefore|however|nevertheless)\b/gi,
    /\b(strategic|implement|optimize|leverage|framework|methodology)\b/gi,
    /\b(\d+\.?\d*%|\$[\d,]+|Q[1-4]\s\d{4}|[A-Z]{2,}\s\d{4})\b/gi, // Data points
    /\b(executives?|leadership|decision.makers?|stakeholders?)\b/gi,
    /\b(competitive\s+advantage|market\s+position|strategic\s+initiative)\b/gi
  ];
  
  const matches = professionalIndicators.reduce((sum, pattern) => {
    return sum + (content.match(pattern) || []).length;
  }, 0);
  
  const words = content.split(/\s+/).length;
  const score = Math.min(1, (matches / Math.max(words / 100, 1)) * 2);
  
  return {
    score,
    indicators: matches,
    wordsAnalyzed: words,
    grade: score >= 0.8 ? 'Excellent' : score >= 0.6 ? 'Good' : score >= 0.4 ? 'Fair' : 'Poor'
  };
}

function analyzeStructure(content) {
  const structuralElements = {
    headers: (content.match(/^#{1,3}\s+.+$/gm) || []).length,
    bulletPoints: (content.match(/^\s*[-*•]\s+/gm) || []).length,
    numberedLists: (content.match(/^\s*\d+\.\s+/gm) || []).length,
    boldText: (content.match(/\*\*[^*]+\*\*/g) || []).length,
    sections: content.split(/\n\s*\n/).length
  };
  
  // Professional article should have good structure
  const hasGoodStructure = 
    structuralElements.headers >= 4 && // At least 4 headers
    (structuralElements.bulletPoints + structuralElements.numberedLists) >= 8 && // At least 8 list items
    structuralElements.sections >= 6; // At least 6 sections
  
  const score = hasGoodStructure ? 0.9 : 
    (structuralElements.headers >= 2 && structuralElements.bulletPoints >= 3) ? 0.7 : 0.4;
  
  return {
    score,
    elements: structuralElements,
    grade: score >= 0.8 ? 'Excellent' : score >= 0.6 ? 'Good' : score >= 0.4 ? 'Fair' : 'Poor'
  };
}

function analyzeDepth(content) {
  const depthIndicators = [
    /\b(case study|example|specifically|particularly|for instance)\b/gi,
    /\b(because|since|due to|as a result|consequently|therefore)\b/gi,
    /\b(however|although|despite|while|whereas|nevertheless)\b/gi,
    /\b(framework|methodology|approach|strategy|process|system)\b/gi,
    /\b(analysis|assessment|evaluation|examination|review)\b/gi,
    /\b(implications|consequences|outcomes|results|benefits)\b/gi
  ];
  
  const matches = depthIndicators.reduce((sum, pattern) => {
    return sum + (content.match(pattern) || []).length;
  }, 0);
  
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 50).length;
  const score = Math.min(1, matches / Math.max(paragraphs, 1));
  
  return {
    score,
    indicators: matches,
    paragraphs,
    grade: score >= 0.8 ? 'Excellent' : score >= 0.6 ? 'Good' : score >= 0.4 ? 'Fair' : 'Poor'
  };
}

function analyzeActionability(content) {
  const actionableIndicators = [
    /\b(step \d+|first|next|then|finally|start by|begin with)\b/gi,
    /\b(should|must|need to|recommend|suggest|advise|propose)\b/gi,
    /\b(implement|execute|apply|start|begin|take action|proceed)\b/gi,
    /\b(checklist|action|todo|task|priority|focus on)\b/gi,
    /\b(immediate|urgent|critical|essential|important)\b/gi
  ];
  
  const matches = actionableIndicators.reduce((sum, pattern) => {
    return sum + (content.match(pattern) || []).length;
  }, 0);
  
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10).length;
  const score = Math.min(1, (matches / Math.max(sentences / 10, 1)) * 1.5);
  
  return {
    score,
    indicators: matches,
    sentences,
    grade: score >= 0.8 ? 'Excellent' : score >= 0.6 ? 'Good' : score >= 0.4 ? 'Fair' : 'Poor'
  };
}

function analyzeReadability(content) {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 5);
  const words = content.split(/\s+/).filter(w => w.trim().length > 0);
  
  if (sentences.length === 0) return { score: 0, grade: 'Poor' };
  
  const avgWordsPerSentence = words.length / sentences.length;
  const complexWords = words.filter(word => word.length > 6).length;
  const readabilityScore = Math.max(0, Math.min(1, 
    (1 - (avgWordsPerSentence - 15) / 20) * 
    (1 - complexWords / words.length)
  ));
  
  return {
    score: readabilityScore,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
    complexWords,
    totalWords: words.length,
    totalSentences: sentences.length,
    grade: readabilityScore >= 0.8 ? 'Excellent' : readabilityScore >= 0.6 ? 'Good' : 'Fair'
  };
}

function analyzeSEO(title, content, metaDescription) {
  const seoFactors = {
    titleLength: title && title.length >= 30 && title.length <= 65,
    metaDescription: metaDescription && metaDescription.length >= 120 && metaDescription.length <= 165,
    h1Tag: /^#{1}\s+/.test(content),
    h2Tags: (content.match(/^#{2}\s+/gm) || []).length >= 3,
    h3Tags: (content.match(/^#{3}\s+/gm) || []).length >= 2,
    internalStructure: content.includes('FAQ') || content.includes('Questions'),
    keywordDensity: analyzeKeywordDensity(content),
    listElements: (content.match(/^\s*[-*•]\s+/gm) || []).length >= 5
  };
  
  const passedFactors = Object.values(seoFactors).filter(Boolean).length;
  const score = passedFactors / Object.keys(seoFactors).length;
  
  return {
    score,
    factors: seoFactors,
    grade: score >= 0.8 ? 'Excellent' : score >= 0.6 ? 'Good' : score >= 0.4 ? 'Fair' : 'Poor'
  };
}

function analyzeKeywordDensity(content) {
  const words = content.toLowerCase().split(/\s+/);
  const wordCount = words.length;
  const uniqueWords = [...new Set(words)];
  return uniqueWords.length / wordCount; // Higher diversity is better
}

function analyzeExecutiveReadiness(content) {
  const executiveIndicators = [
    /\b(ROI|return on investment|cost.benefit|budget|revenue|profit)\b/gi,
    /\b(strategic|competitive|market|industry|business)\b/gi,
    /\b(decision|choice|option|recommendation|priority)\b/gi,
    /\b(risk|opportunity|challenge|threat|advantage)\b/gi,
    /\b(executive|leadership|management|board|stakeholder)\b/gi
  ];
  
  const matches = executiveIndicators.reduce((sum, pattern) => {
    return sum + (content.match(pattern) || []).length;
  }, 0);
  
  const words = content.split(/\s+/).length;
  const score = Math.min(1, (matches / Math.max(words / 150, 1)) * 3);
  
  return {
    score,
    indicators: matches,
    grade: score >= 0.8 ? 'Board-Ready' : score >= 0.6 ? 'Executive-Level' : score >= 0.4 ? 'Management-Level' : 'General'
  };
}

function analyzeBusinessValue(content, category) {
  const businessValueIndicators = [
    /\b(increase|improve|enhance|optimize|boost|maximize)\b/gi,
    /\b(reduce|minimize|decrease|eliminate|streamline)\b/gi,
    /\b(efficiency|productivity|performance|results|outcomes)\b/gi,
    /\b(growth|expansion|scale|development|innovation)\b/gi,
    /\b(cost.saving|profit|revenue|market.share)\b/gi
  ];
  
  const matches = businessValueIndicators.reduce((sum, pattern) => {
    return sum + (content.match(pattern) || []).length;
  }, 0);
  
  const paragraphs = content.split(/\n\s*\n/).length;
  const score = Math.min(1, matches / Math.max(paragraphs, 1));
  
  return {
    score,
    indicators: matches,
    grade: score >= 0.8 ? 'High Value' : score >= 0.6 ? 'Good Value' : score >= 0.4 ? 'Some Value' : 'Limited Value'
  };
}

function analyzeEvidenceQuality(content) {
  const evidenceIndicators = [
    /\b(\d+\.?\d*%)\b/g, // Percentages
    /\b\$[\d,]+/g, // Dollar amounts
    /\b(study|research|survey|report|analysis)\b/gi,
    /\b(according to|source|citation|reference)\b/gi,
    /\b(data|statistics|metrics|findings|results)\b/gi
  ];
  
  const matches = evidenceIndicators.reduce((sum, pattern) => {
    return sum + (content.match(pattern) || []).length;
  }, 0);
  
  const paragraphs = content.split(/\n\s*\n/).length;
  const score = Math.min(1, (matches / Math.max(paragraphs, 1)) * 1.5);
  
  return {
    score,
    indicators: matches,
    grade: score >= 0.8 ? 'Well-Evidenced' : score >= 0.6 ? 'Good Evidence' : score >= 0.4 ? 'Some Evidence' : 'Limited Evidence'
  };
}

function analyzeStrategicInsights(content) {
  const strategicIndicators = [
    /\b(trend|pattern|shift|change|evolution|transformation)\b/gi,
    /\b(future|outlook|forecast|prediction|anticipate|expect)\b/gi,
    /\b(opportunity|potential|possibility|prospect|advantage)\b/gi,
    /\b(challenge|threat|risk|barrier|obstacle|concern)\b/gi,
    /\b(strategy|approach|method|framework|model|system)\b/gi
  ];
  
  const matches = strategicIndicators.reduce((sum, pattern) => {
    return sum + (content.match(pattern) || []).length;
  }, 0);
  
  const paragraphs = content.split(/\n\s*\n/).length;
  const score = Math.min(1, matches / Math.max(paragraphs, 1));
  
  return {
    score,
    indicators: matches,
    grade: score >= 0.8 ? 'Strategic' : score >= 0.6 ? 'Tactical' : score >= 0.4 ? 'Operational' : 'Basic'
  };
}

// Article generation functions
async function generateSingleArticle(options) {
  const {
    topic,
    category,
    language = 'en',
    contentType = 'SEO_ARTICLE',
    professionalGrade = false,
    useWebSearch = true,
    maxWords = 1500,
    newsHeadline = null
  } = options;

  const categories = await listCategories();
  const categoryObj = categories.find(c => c.slug === category);
  
  if (!categoryObj) {
    throw new Error(`Category '${category}' not found. Available: ${categories.map(c => c.slug).join(', ')}`);
  }

  let result;

  if (newsHeadline) {
    // Generate news-based article
    result = await generateNewsBasedArticle({
      newsStory: {
        headline: newsHeadline,
        summary: `Breaking development in ${category}`,
        keywords: [category, 'news', 'analysis']
      },
      languageCode: language,
      categoryName: categoryObj.name,
      categorySlug: category,
      targetAudience: professionalGrade ? 'executives and decision makers' : 'professionals',
      maxWords
    });
  } else {
    // Generate regular article
    const strategy = ENHANCED_CONTENT_STRATEGIES[contentType];
    const targetAudience = professionalGrade ? 
      strategy?.audience || 'executives and decision makers' : 
      'professionals and informed readers';

    result = await generateArticleViaAPI({
      topic,
      languageCode: language,
      categoryName: categoryObj.name,
      categorySlug: category,
      contentType,
      targetAudience,
      keywords: [category, topic.split(' ')[0]],
      includeWebSearch: useWebSearch,
      generateImage: false,
      maxWords,
      complexity: professionalGrade ? 'high' : 'medium',
      monthlyTokensUsed: 0
    });
  }

  // Add metadata
  result.generationMetadata = {
    contentType,
    professionalGrade,
    category,
    language,
    useWebSearch,
    newsHeadline,
    generatedAt: new Date().toISOString(),
    wordCount: result.content?.split(/\s+/).length || 0,
    readingTime: estimateReadingTimeMinutes(result.content || ''),
    slug: createSlug(result.title || 'untitled', language)
  };

  return result;
}

async function generateBatchArticles(options) {
  const {
    batchSize = 3,
    mixedTypes = false,
    professionalGrade = false,
    languages = ['en'],
    categories = ['technology', 'business'],
    contentTypes = ['SEO_ARTICLE']
  } = options;

  const results = [];
  
  for (let i = 0; i < batchSize; i++) {
    const language = languages[i % languages.length];
    const category = categories[i % categories.length];
    const contentType = mixedTypes ? 
      CONTENT_TYPES[i % CONTENT_TYPES.length] : 
      contentTypes[i % contentTypes.length];

    // Generate varied topics
    const topics = {
      technology: ['AI automation strategies', 'Cybersecurity frameworks', 'Digital transformation'],
      business: ['Leadership effectiveness', 'Operational excellence', 'Strategic planning'],
      finance: ['Investment strategies', 'Risk management', 'Market analysis'],
      health: ['Healthcare innovation', 'Medical technology', 'Wellness strategies']
    };
    
    const categoryTopics = topics[category] || topics.technology;
    const topic = categoryTopics[i % categoryTopics.length];

    try {
      console.log(`\n📝 Generating ${i + 1}/${batchSize}: ${contentType} about "${topic}" in ${language}`);
      
      const result = await generateSingleArticle({
        topic,
        category,
        language,
        contentType,
        professionalGrade,
        useWebSearch: true,
        maxWords: 1400
      });

      results.push(result);
      console.log(`✅ Generated: ${result.title?.slice(0, 60)}...`);
      
      // Small delay between generations
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (err) {
      console.log(`❌ Failed: ${err.message}`);
      results.push({ error: err.message, topic, category, language, contentType });
    }
  }

  return results;
}

// File operations
async function saveArticleToFile(article, filepath, options = {}) {
  const qualityAnalysis = analyzeArticleQuality(article, options);
  
  const markdown = [
    `# ${article.title}`,
    '',
    `**Generated**: ${new Date().toISOString()}`,
    `**Category**: ${options.category || 'Unknown'}`,
    `**Language**: ${options.language || 'en'}`,
    `**Content Type**: ${options.contentType || 'SEO_ARTICLE'}`,
    `**Professional Grade**: ${options.professionalGrade ? 'Yes' : 'No'}`,
    `**Model**: ${article.model || 'Unknown'}`,
    `**Tokens**: Input: ${article.tokensIn || 0}, Output: ${article.tokensOut || 0}, Total: ${(article.tokensIn || 0) + (article.tokensOut || 0)}`,
    `**Word Count**: ${article.generationMetadata?.wordCount || 'Unknown'}`,
    `**Reading Time**: ${article.generationMetadata?.readingTime || 'Unknown'} minutes`,
    '',
    '## Quality Analysis',
    '',
    Object.entries(qualityAnalysis).map(([metric, data]) => {
      const score = typeof data === 'object' ? data.score : data;
      const grade = typeof data === 'object' ? data.grade : '';
      const emoji = score >= 0.8 ? '🟢' : score >= 0.6 ? '🟡' : score >= 0.4 ? '🟠' : '🔴';
      return `${emoji} **${metric}**: ${(score * 100).toFixed(0)}% ${grade ? `(${grade})` : ''}`;
    }).join('\n'),
    '',
    '## Meta Description',
    article.metaDescription || 'Not generated',
    '',
    '## Summary',
    article.summary || 'Not generated',
    '',
    '---',
    '',
    article.content || 'No content generated'
  ].join('\n');
  
  await fs.writeFile(filepath, markdown, 'utf8');
  return qualityAnalysis;
}

async function generateQualityReport(results, outputDir) {
  const successful = results.filter(r => r.title);
  const failed = results.filter(r => r.error);
  
  if (successful.length === 0) {
    return { error: 'No successful generations to analyze' };
  }

  // Analyze all successful articles
  const qualityAnalyses = successful.map(result => 
    analyzeArticleQuality(result, result.generationMetadata || {})
  );

  // Calculate aggregate metrics
  const aggregateMetrics = {};
  const qualityCategories = Object.keys(qualityAnalyses[0] || {});
  
  qualityCategories.forEach(category => {
    const scores = qualityAnalyses
      .map(analysis => typeof analysis[category] === 'object' ? analysis[category].score : analysis[category])
      .filter(score => typeof score === 'number');
    
    if (scores.length > 0) {
      aggregateMetrics[category] = {
        average: scores.reduce((sum, score) => sum + score, 0) / scores.length,
        min: Math.min(...scores),
        max: Math.max(...scores),
        samples: scores.length
      };
    }
  });

  // Generate detailed report
  const report = {
    summary: {
      totalGenerated: results.length,
      successful: successful.length,
      failed: failed.length,
      successRate: (successful.length / results.length) * 100,
      generatedAt: new Date().toISOString()
    },
    
    performance: {
      averageWordCount: successful.reduce((sum, r) => sum + (r.generationMetadata?.wordCount || 0), 0) / successful.length,
      averageTokens: successful.reduce((sum, r) => sum + ((r.tokensIn || 0) + (r.tokensOut || 0)), 0) / successful.length,
      averageReadingTime: successful.reduce((sum, r) => sum + (r.generationMetadata?.readingTime || 0), 0) / successful.length
    },
    
    qualityMetrics: aggregateMetrics,
    
    contentDistribution: {
      byContentType: successful.reduce((acc, r) => {
        const type = r.generationMetadata?.contentType || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {}),
      
      byLanguage: successful.reduce((acc, r) => {
        const lang = r.generationMetadata?.language || 'Unknown';
        acc[lang] = (acc[lang] || 0) + 1;
        return acc;
      }, {}),
      
      byCategory: successful.reduce((acc, r) => {
        const cat = r.generationMetadata?.category || 'Unknown';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {}),
      
      professionalGrade: successful.filter(r => r.generationMetadata?.professionalGrade).length
    },
    
    topPerformers: successful
      .map(result => ({
        title: result.title?.slice(0, 60),
        contentType: result.generationMetadata?.contentType,
        language: result.generationMetadata?.language,
        category: result.generationMetadata?.category,
        overallScore: Object.values(analyzeArticleQuality(result)).reduce((sum, metric) => {
          const score = typeof metric === 'object' ? metric.score : metric;
          return sum + (score || 0);
        }, 0) / qualityCategories.length
      }))
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 5),
    
    errors: failed.map(f => ({ error: f.error, topic: f.topic, category: f.category }))
  };

  // Save report
  const reportPath = join(outputDir, 'quality-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  return { report, reportPath };
}

// Main execution functions
async function runSingleGeneration(options) {
  console.log('\n🚀 Enhanced Article Generation - Single Mode\n');
  console.log('=' .repeat(60));
  
  const outputDir = './test-outputs';
  await fs.mkdir(outputDir, { recursive: true });
  
  try {
    console.log('📝 Generating article...');
    console.log(`📊 Topic: ${options.topic}`);
    console.log(`📂 Category: ${options.category}`);
    console.log(`🌍 Language: ${options.language}`);
    console.log(`📋 Content Type: ${options.contentType}`);
    console.log(`💼 Professional Grade: ${options.professionalGrade ? 'Yes' : 'No'}`);
    
    if (options.newsHeadline) {
      console.log(`📰 News Analysis: ${options.newsHeadline}`);
    }
    
    const startTime = Date.now();
    const article = await generateSingleArticle(options);
    const endTime = Date.now();
    
    console.log(`\n✅ Generation completed in ${endTime - startTime}ms`);
    console.log(`📄 Title: ${article.title}`);
    console.log(`📝 Word Count: ${article.generationMetadata?.wordCount}`);
    console.log(`⏱️  Reading Time: ${article.generationMetadata?.readingTime} minutes`);
    console.log(`🔗 Tokens Used: ${(article.tokensIn || 0) + (article.tokensOut || 0)}`);
    console.log(`🤖 Model: ${article.model}`);
    
    // Save article
    const filename = `single-${options.contentType.toLowerCase()}-${Date.now()}.md`;
    const filepath = join(outputDir, filename);
    const qualityAnalysis = await saveArticleToFile(article, filepath, options);
    
    console.log(`\n📁 Article saved to: ${filepath}`);
    
    // Display quality metrics
    console.log('\n📈 Quality Analysis:');
    Object.entries(qualityAnalysis).forEach(([metric, data]) => {
      const score = typeof data === 'object' ? data.score : data;
      const grade = typeof data === 'object' ? data.grade : '';
      const emoji = score >= 0.8 ? '🟢' : score >= 0.6 ? '🟡' : score >= 0.4 ? '🟠' : '🔴';
      console.log(`  ${emoji} ${metric}: ${(score * 100).toFixed(0)}% ${grade ? `(${grade})` : ''}`);
    });
    
    return { success: true, article, qualityAnalysis, filepath };
    
  } catch (err) {
    console.error(`\n❌ Generation failed: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function runBatchGeneration(options) {
  console.log('\n🚀 Enhanced Article Generation - Batch Mode\n');
  console.log('=' .repeat(60));
  
  const outputDir = './test-outputs';
  await fs.mkdir(outputDir, { recursive: true });
  
  console.log(`📦 Batch Size: ${options.batchSize}`);
  console.log(`🎲 Mixed Types: ${options.mixedTypes ? 'Yes' : 'No'}`);
  console.log(`💼 Professional Grade: ${options.professionalGrade ? 'Yes' : 'No'}`);
  console.log(`🌍 Languages: ${options.languages.join(', ')}`);
  console.log(`📂 Categories: ${options.categories.join(', ')}`);
  
  const startTime = Date.now();
  const results = await generateBatchArticles(options);
  const endTime = Date.now();
  
  console.log(`\n⏱️  Batch completed in ${endTime - startTime}ms`);
  
  // Save individual articles
  const savedFiles = [];
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.title) {
      const filename = `batch-${i + 1}-${result.generationMetadata?.contentType?.toLowerCase() || 'unknown'}.md`;
      const filepath = join(outputDir, filename);
      await saveArticleToFile(result, filepath, result.generationMetadata || {});
      savedFiles.push(filepath);
    }
  }
  
  // Generate quality report
  const { report, reportPath } = await generateQualityReport(results, outputDir);
  
  console.log('\n📊 Batch Summary:');
  console.log(`✅ Successful: ${report.summary.successful}/${report.summary.totalGenerated}`);
  console.log(`❌ Failed: ${report.summary.failed}/${report.summary.totalGenerated}`);
  console.log(`📈 Success Rate: ${report.summary.successRate.toFixed(1)}%`);
  console.log(`📝 Average Words: ${report.performance.averageWordCount.toFixed(0)}`);
  console.log(`🔗 Average Tokens: ${report.performance.averageTokens.toFixed(0)}`);
  console.log(`⏱️  Average Reading Time: ${report.performance.averageReadingTime.toFixed(1)} minutes`);
  
  console.log('\n🏆 Top Quality Performers:');
  report.topPerformers.forEach((performer, index) => {
    console.log(`  ${index + 1}. ${performer.title} (${(performer.overallScore * 100).toFixed(0)}%)`);
  });
  
  console.log(`\n📁 Files saved: ${savedFiles.length} articles`);
  console.log(`📄 Quality report: ${reportPath}`);
  
  return { results, report, savedFiles };
}

async function runTrendAnalysis(options) {
  console.log('\n🔍 AI Trend Discovery and Analysis\n');
  console.log('=' .repeat(60));
  
  try {
    const trends = await discoverTrendingTopicsWithAI({
      languageCode: options.language,
      maxPerCategory: 5,
      categories: options.categories
    });
    
    console.log(`📈 Discovered ${trends.length} trending topics:`);
    trends.forEach((trend, index) => {
      console.log(`  ${index + 1}. [${trend.category}] ${trend.topic.slice(0, 80)}...`);
    });
    
    if (trends.length > 0 && options.generateFromTrends) {
      console.log('\n📝 Generating article from top trend...');
      const topTrend = trends[0];
      
      const article = await generateSingleArticle({
        topic: topTrend.topic,
        category: topTrend.category,
        language: options.language,
        contentType: 'NEWS_ANALYSIS',
        professionalGrade: true,
        useWebSearch: true,
        maxWords: 1500
      });
      
      const outputDir = './test-outputs';
      await fs.mkdir(outputDir, { recursive: true });
      
      const filename = `trend-analysis-${Date.now()}.md`;
      const filepath = join(outputDir, filename);
      await saveArticleToFile(article, filepath, {
        category: topTrend.category,
        language: options.language,
        contentType: 'NEWS_ANALYSIS',
        professionalGrade: true
      });
      
      console.log(`✅ Trend-based article generated: ${filepath}`);
      console.log(`📄 Title: ${article.title}`);
    }
    
    return trends;
    
  } catch (err) {
    console.error(`❌ Trend analysis failed: ${err.message}`);
    return [];
  }
}

// CLI setup
program
  .name('generate-article')
  .description('Enhanced professional article generation and testing')
  .version('2.0.0');

// Single article generation
program
  .command('single')
  .description('Generate a single professional article')
  .option('-t, --topic <topic>', 'Article topic', 'Latest industry developments')
  .option('-c, --category <category>', 'Article category', 'technology')
  .option('-l, --language <language>', 'Article language', 'en')
  .option('--content-type <type>', 'Content type', 'SEO_ARTICLE')
  .option('--professional-grade', 'Generate professional grade content', false)
  .option('--no-web-search', 'Disable web search', false)
  .option('--max-words <words>', 'Maximum word count', '1500')
  .option('--news-headline <headline>', 'Generate news analysis based on headline')
  .action(async (options) => {
    // Validate inputs
    if (!SUPPORTED_LANGUAGES.includes(options.language)) {
      console.error(`❌ Unsupported language: ${options.language}`);
      console.log(`   Supported: ${SUPPORTED_LANGUAGES.join(', ')}`);
      process.exit(1);
    }
    
    if (!SUPPORTED_CATEGORIES.includes(options.category)) {
      console.error(`❌ Unsupported category: ${options.category}`);
      console.log(`   Supported: ${SUPPORTED_CATEGORIES.join(', ')}`);
      process.exit(1);
    }
    
    if (!CONTENT_TYPES.includes(options.contentType)) {
      console.error(`❌ Unsupported content type: ${options.contentType}`);
      console.log(`   Supported: ${CONTENT_TYPES.join(', ')}`);
      process.exit(1);
    }
    
    await runSingleGeneration({
      topic: options.topic,
      category: options.category,
      language: options.language,
      contentType: options.contentType,
      professionalGrade: options.professionalGrade,
      useWebSearch: options.webSearch,
      maxWords: parseInt(options.maxWords),
      newsHeadline: options.newsHeadline
    });
  });

// Batch generation
program
  .command('batch')
  .description('Generate multiple articles in batch')
  .option('-n, --batch-size <size>', 'Number of articles to generate', '3')
  .option('--mixed-types', 'Use different content types for each article', false)
  .option('--professional-grade', 'Generate professional grade content', false)
  .option('-l, --languages <languages>', 'Comma-separated languages', 'en,es')
  .option('-c, --categories <categories>', 'Comma-separated categories', 'technology,business')
  .option('--content-types <types>', 'Comma-separated content types', 'SEO_ARTICLE')
  .action(async (options) => {
    await runBatchGeneration({
      batchSize: parseInt(options.batchSize),
      mixedTypes: options.mixedTypes,
      professionalGrade: options.professionalGrade,
      languages: options.languages.split(','),
      categories: options.categories.split(','),
      contentTypes: options.contentTypes.split(',')
    });
  });

// Trend analysis
program
  .command('trends')
  .description('Discover trending topics and optionally generate articles')
  .option('-l, --language <language>', 'Language for trend discovery', 'en')
  .option('-c, --categories <categories>', 'Comma-separated categories', 'technology,business,finance')
  .option('--generate-from-trends', 'Generate article from top trend', false)
  .action(async (options) => {
    await runTrendAnalysis({
      language: options.language,
      categories: options.categories.split(','),
      generateFromTrends: options.generateFromTrends
    });
  });

// Test suite
program
  .command('test-suite')
  .description('Run comprehensive test suite')
  .option('--quick', 'Run quick test (fewer articles)', false)
  .action(async (options) => {
    console.log('\n🧪 Enhanced Article Generation Test Suite\n');
    console.log('=' .repeat(60));
    
    const testConfigs = options.quick ? [
      { contentType: 'THOUGHT_LEADERSHIP', professionalGrade: true, category: 'technology' },
      { contentType: 'SEO_ARTICLE', professionalGrade: false, category: 'business' }
    ] : [
      { contentType: 'THOUGHT_LEADERSHIP', professionalGrade: true, category: 'technology' },
      { contentType: 'NEWS_ANALYSIS', professionalGrade: true, category: 'finance' },
      { contentType: 'STRATEGIC_GUIDE', professionalGrade: true, category: 'business' },
      { contentType: 'SEO_ARTICLE', professionalGrade: false, category: 'health' },
      { contentType: 'QUICK_INSIGHTS', professionalGrade: false, category: 'travel' }
    ];
    
    const allResults = [];
    
    for (const config of testConfigs) {
      console.log(`\n🔬 Testing ${config.contentType} (${config.professionalGrade ? 'Professional' : 'Standard'})`);
      
      const result = await runSingleGeneration({
        topic: `Strategic analysis of ${config.category} trends`,
        category: config.category,
        language: 'en',
        contentType: config.contentType,
        professionalGrade: config.professionalGrade,
        useWebSearch: true,
        maxWords: 1500
      });
      
      allResults.push(result);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    const successful = allResults.filter(r => r.success).length;
    console.log(`\n🎯 Test Suite Complete: ${successful}/${allResults.length} successful`);
  });

// Default command (interactive mode)
program
  .command('interactive', { isDefault: true })
  .description('Interactive article generation')
  .action(async () => {
    console.log('\n🚀 Enhanced Professional Article Generation\n');
    console.log('Welcome to the enhanced article generation system!');
    console.log('This system can generate professional-grade content with quality analysis.\n');
    
    console.log('📋 Available Commands:');
    console.log('  single     - Generate a single article with full customization');
    console.log('  batch      - Generate multiple articles in batch mode');
    console.log('  trends     - Discover trending topics and generate articles');
    console.log('  test-suite - Run comprehensive testing of all features\n');
    
    console.log('📖 Examples:');
    console.log('  node scripts/generate-article.js single --topic "AI in healthcare" --professional-grade');
    console.log('  node scripts/generate-article.js batch --batch-size 5 --mixed-types');
    console.log('  node scripts/generate-article.js trends --generate-from-trends\n');
    
    console.log('💡 For help with any command, use: node scripts/generate-article.js <command> --help');
  });

// Error handling
process.on('uncaughtException', (err) => {
  console.error('\n💥 Uncaught Exception:', err.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse();
}