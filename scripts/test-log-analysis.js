#!/usr/bin/env node

/**
 * Test script for Log File Analysis and Crawl Budget Optimization
 * Usage: node scripts/test-log-analysis.js
 */

import fs from 'fs';
import path from 'path';
import { analyzeServerLogs, generateRobotsRules, LOG_ANALYSIS_CONFIG } from '../src/services/logAnalysisService.js';

const BASE_URL = process.env.CANONICAL_BASE_URL || 'http://localhost:3000';

/**
 * Generate sample log data for testing
 */
function generateSampleLogData() {
  const sampleLogs = [];
  const now = new Date();
  
  // Sample Googlebot requests with various waste patterns
  const wasteUrls = [
    // Deep pagination
    '/category/technology?page=25',
    '/category/business?page=50',
    '/articles?page=100',
    
    // Faceted search
    '/search?category=tech&sort=date&filter=recent&page=5',
    '/products?color=red&size=large&brand=nike&price=100-200',
    
    // Search pages
    '/search?q=artificial+intelligence',
    '/search?query=machine+learning',
    
    // Tracking parameters
    '/article/ai-trends?utm_source=google&utm_medium=cpc&utm_campaign=tech',
    '/category/business?ref=newsletter&affiliate=partner123',
    
    // Session IDs
    '/dashboard?PHPSESSID=abc123def456',
    '/user/profile?sessionid=xyz789',
    
    // Old date archives
    '/2019/01/old-article',
    '/2020/archive/outdated-content',
    
    // Tag pages
    '/tag/machine-learning',
    '/tag/artificial-intelligence',
    
    // Print versions
    '/article/tech-news?print=1',
    '/category/business?mobile=1'
  ];
  
  const goodUrls = [
    '/',
    '/category/technology',
    '/category/business',
    '/article/latest-ai-trends',
    '/article/business-insights-2025',
    '/about',
    '/contact'
  ];
  
  // Generate waste requests
  wasteUrls.forEach((url, index) => {
    for (let i = 0; i < 3; i++) {
      const timestamp = new Date(now.getTime() - (index * 3600000) - (i * 1800000));
      const logLine = `66.249.66.1 - - [${formatLogDate(timestamp)}] "GET ${url} HTTP/1.1" 200 1234 "-" "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"`;
      sampleLogs.push(logLine);
    }
  });
  
  // Generate good requests
  goodUrls.forEach((url, index) => {
    for (let i = 0; i < 2; i++) {
      const timestamp = new Date(now.getTime() - (index * 1800000) - (i * 900000));
      const logLine = `66.249.66.1 - - [${formatLogDate(timestamp)}] "GET ${url} HTTP/1.1" 200 2345 "-" "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"`;
      sampleLogs.push(logLine);
    }
  });
  
  // Add some 404 errors
  const errorUrls = ['/missing-page', '/old-article', '/broken-link'];
  errorUrls.forEach(url => {
    const timestamp = new Date(now.getTime() - Math.random() * 86400000);
    const logLine = `66.249.66.1 - - [${formatLogDate(timestamp)}] "GET ${url} HTTP/1.1" 404 512 "-" "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"`;
    sampleLogs.push(logLine);
  });
  
  // Add some regular user requests (non-Googlebot)
  goodUrls.forEach(url => {
    const timestamp = new Date(now.getTime() - Math.random() * 86400000);
    const logLine = `192.168.1.100 - - [${formatLogDate(timestamp)}] "GET ${url} HTTP/1.1" 200 3456 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"`;
    sampleLogs.push(logLine);
  });
  
  return sampleLogs.join('\n');
}

/**
 * Format date for log file format
 */
function formatLogDate(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const time = date.toTimeString().split(' ')[0];
  return `${day}/${month}/${year}:${time} +0000`;
}

/**
 * Create sample log file for testing
 */
async function createSampleLogFile() {
  const logDir = './logs';
  const logFile = path.join(logDir, 'access.log');
  
  // Create logs directory if it doesn't exist
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const sampleData = generateSampleLogData();
  fs.writeFileSync(logFile, sampleData);
  
  console.log(`✅ Created sample log file: ${logFile}`);
  console.log(`📊 Generated ${sampleData.split('\n').length} log entries`);
  
  return logFile;
}

/**
 * Test log analysis functionality
 */
async function testLogAnalysis() {
  console.log('\n📊 Testing Log File Analysis');
  console.log('============================');
  
  try {
    // Create sample log file
    const logFile = await createSampleLogFile();
    
    // Update config to use our sample log file
    LOG_ANALYSIS_CONFIG.logPaths = [logFile];
    
    console.log(`Analyzing log file: ${logFile}`);
    
    const analysis = await analyzeServerLogs();
    
    if (!analysis || analysis.logFilesAnalyzed === 0) {
      console.log('❌ No log files analyzed');
      return { success: false, error: 'No log files analyzed' };
    }
    
    console.log(`✅ Log files analyzed: ${analysis.logFilesAnalyzed}`);
    console.log(`📈 Total requests: ${analysis.totalAnalysis.totalRequests}`);
    console.log(`🤖 Googlebot requests: ${analysis.totalAnalysis.googlebotRequests}`);
    console.log(`💸 Crawl budget waste: ${analysis.totalAnalysis.summary.crawlBudgetWaste} requests`);
    console.log(`📊 Waste percentage: ${analysis.totalAnalysis.summary.wastePercentage}%`);
    
    console.log('\n🔍 Waste Breakdown:');
    Object.entries(analysis.totalAnalysis.crawlWaste).forEach(([pattern, count]) => {
      console.log(`   ${pattern}: ${count} requests`);
    });
    
    console.log('\n⚠️  Top Recommendations:');
    analysis.totalAnalysis.recommendations.slice(0, 5).forEach((rec, index) => {
      console.log(`   ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.issue}`);
      console.log(`      Solution: ${rec.solution}`);
    });
    
    console.log('\n🗑️  Top Waste URLs:');
    analysis.totalAnalysis.topWasteUrls.slice(0, 10).forEach((url, index) => {
      console.log(`   ${index + 1}. ${url.url} (${url.crawls} crawls)`);
      console.log(`      Reasons: ${url.wasteReasons.join(', ')}`);
    });
    
    return {
      success: true,
      analysis,
      logFile
    };
    
  } catch (error) {
    console.log(`❌ Log analysis test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test robots.txt rule generation
 */
async function testRobotsGeneration(analysis) {
  console.log('\n🤖 Testing Robots.txt Rule Generation');
  console.log('====================================');
  
  try {
    if (!analysis) {
      console.log('⚠️  No analysis data available for robots generation');
      return { success: false, error: 'No analysis data' };
    }
    
    const robotsRules = generateRobotsRules(analysis.totalAnalysis);
    
    console.log('Generated robots.txt rules:');
    console.log('---------------------------');
    console.log(robotsRules);
    
    // Count rules
    const ruleCount = robotsRules.split('Disallow:').length - 1;
    console.log(`✅ Generated ${ruleCount} disallow rules`);
    
    return {
      success: true,
      robotsRules,
      ruleCount
    };
    
  } catch (error) {
    console.log(`❌ Robots generation test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test API endpoints
 */
async function testApiEndpoints() {
  console.log('\n🌐 Testing API Endpoints');
  console.log('========================');
  
  const endpoints = [
    '/crawl-optimization/analyze',
    '/crawl-optimization/recommendations',
    '/crawl-optimization/waste-urls',
    '/crawl-optimization/robots-rules',
    '/crawl-optimization/dashboard'
  ];
  
  const results = {};
  
  for (const endpoint of endpoints) {
    console.log(`\nTesting: ${endpoint}`);
    
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      const success = response.ok;
      
      console.log(`${success ? '✅' : '❌'} ${endpoint}: ${response.status}`);
      
      if (success) {
        const contentType = response.headers.get('content-type');
        console.log(`   Content-Type: ${contentType}`);
        
        if (contentType?.includes('application/json')) {
          const data = await response.json();
          console.log(`   Success: ${data.success}`);
          if (data.data) {
            const keys = Object.keys(data.data);
            console.log(`   Data keys: ${keys.join(', ')}`);
          }
        }
      }
      
      results[endpoint] = {
        success,
        status: response.status
      };
      
    } catch (error) {
      console.log(`❌ ${endpoint}: Error - ${error.message}`);
      results[endpoint] = {
        success: false,
        error: error.message
      };
    }
  }
  
  return results;
}

/**
 * Test robots.txt text format endpoint
 */
async function testRobotsTextEndpoint() {
  console.log('\n📄 Testing Robots.txt Text Endpoint');
  console.log('===================================');
  
  try {
    const response = await fetch(`${BASE_URL}/crawl-optimization/robots-rules?format=text`);
    
    if (!response.ok) {
      console.log(`❌ HTTP Error: ${response.status}`);
      return { success: false, status: response.status };
    }
    
    const contentType = response.headers.get('content-type');
    const robotsText = await response.text();
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📄 Content-Type: ${contentType}`);
    console.log(`📏 Content Length: ${robotsText.length} bytes`);
    
    console.log('\nGenerated robots.txt content:');
    console.log('-----------------------------');
    console.log(robotsText.substring(0, 500) + (robotsText.length > 500 ? '...' : ''));
    
    return {
      success: true,
      status: response.status,
      contentType,
      contentLength: robotsText.length
    };
    
  } catch (error) {
    console.log(`❌ Robots text endpoint test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Main test function
 */
async function testLogAnalysisSystem() {
  console.log('📊 Testing Log File Analysis & Crawl Budget Optimization');
  console.log('=========================================================');
  console.log(`Base URL: ${BASE_URL}`);
  
  const results = {
    logAnalysis: null,
    robotsGeneration: null,
    apiEndpoints: null,
    robotsTextEndpoint: null
  };
  
  // Test 1: Log analysis
  results.logAnalysis = await testLogAnalysis();
  
  // Test 2: Robots.txt generation
  results.robotsGeneration = await testRobotsGeneration(results.logAnalysis?.analysis);
  
  // Test 3: API endpoints
  results.apiEndpoints = await testApiEndpoints();
  
  // Test 4: Robots.txt text endpoint
  results.robotsTextEndpoint = await testRobotsTextEndpoint();
  
  // Summary
  console.log('\n📊 Log Analysis Test Summary');
  console.log('============================');
  
  const tests = [
    { name: 'Log Analysis', result: results.logAnalysis },
    { name: 'Robots Generation', result: results.robotsGeneration },
    { name: 'API Endpoints', result: results.apiEndpoints },
    { name: 'Robots Text Endpoint', result: results.robotsTextEndpoint }
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
  
  console.log('\n💡 Crawl Budget Optimization Benefits:');
  console.log('======================================');
  console.log('✅ Identify URLs wasting Googlebot crawl budget');
  console.log('✅ Block low-value pages from being crawled');
  console.log('✅ Optimize crawl budget for important content');
  console.log('✅ Reduce server load from unnecessary crawling');
  console.log('✅ Improve indexing efficiency and speed');
  console.log('✅ Generate actionable robots.txt rules');
  
  console.log('\n🎯 Common Crawl Budget Waste Patterns:');
  console.log('======================================');
  console.log('• Deep pagination (page=50+)');
  console.log('• Faceted search with multiple parameters');
  console.log('• Search result pages');
  console.log('• Old date archives');
  console.log('• Session IDs and tracking parameters');
  console.log('• Print/mobile versions');
  console.log('• Tag pages with low value');
  
  console.log('\n🎉 Log Analysis Test Completed');
  console.log('===============================');
  
  return results;
}

// Run tests
testLogAnalysisSystem().catch(error => {
  console.error('Log analysis test script failed:', error);
  process.exit(1);
});
