#!/usr/bin/env node

/**
 * SEO Notifications Monitoring Script
 * Monitors the health and performance of all SEO notification services
 * Usage: node scripts/monitor-seo-notifications.js
 */

import { config } from '../src/config.js';
import { 
  notifySearchEnginesNewArticle, 
  notifySearchEnginesSitemapUpdate
} from '../src/services/seoNotificationService.js';

// Test configurations for different scenarios
const TEST_SCENARIOS = [
  {
    name: 'English Article',
    article: {
      slug: 'monitor-test-en-' + Date.now(),
      language_code: 'en',
      title: 'Monitor Test Article English',
      category_slug: 'technology'
    }
  },
  {
    name: 'German Article',
    article: {
      slug: 'monitor-test-de-' + Date.now(),
      language_code: 'de',
      title: 'Monitor Test Artikel Deutsch',
      category_slug: 'technology'
    }
  },
  {
    name: 'Arabic Article',
    article: {
      slug: 'monitor-test-ar-' + Date.now(),
      language_code: 'ar',
      title: 'مقال اختبار المراقبة العربية',
      category_slug: 'technology'
    }
  }
];

class SEONotificationMonitor {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      overall: { success: 0, failed: 0, total: 0 },
      services: {},
      languages: {},
      errors: []
    };
  }

  async runHealthCheck() {
    console.log('🔍 SEO Notifications Health Check');
    console.log('==================================');
    
    // Check IndexNow key file
    await this.checkIndexNowKey();
    
    // Test each language
    for (const scenario of TEST_SCENARIOS) {
      await this.testScenario(scenario);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Test sitemap notifications
    await this.testSitemapNotifications();
    
    // Generate report
    this.generateReport();
  }

  async checkIndexNowKey() {
    console.log('\n🔑 Checking IndexNow Key Configuration');
    console.log('-------------------------------------');
    
    const indexNowKey = process.env.INDEXNOW_API_KEY;
    if (!indexNowKey) {
      this.addError('IndexNow API key not configured');
      console.log('❌ IndexNow API key not configured');
      return;
    }

    try {
      const keyFileUrl = `${process.env.CANONICAL_BASE_URL || 'https://megaquantum.net'}/${indexNowKey}.txt`;
      const response = await fetch(keyFileUrl);
      
      if (response.ok) {
        const content = await response.text();
        if (content.trim() === indexNowKey) {
          console.log('✅ IndexNow key file accessible and valid');
          this.results.services.indexnow_key = { status: 'healthy', url: keyFileUrl };
        } else {
          this.addError('IndexNow key file contains incorrect content');
          console.log('❌ IndexNow key file contains incorrect content');
        }
      } else {
        this.addError(`IndexNow key file not accessible (HTTP ${response.status})`);
        console.log(`❌ IndexNow key file not accessible (HTTP ${response.status})`);
      }
    } catch (error) {
      this.addError(`IndexNow key file check failed: ${error.message}`);
      console.log(`❌ IndexNow key file check failed: ${error.message}`);
    }
  }

  async testScenario(scenario) {
    console.log(`\n🌍 Testing ${scenario.name}`);
    console.log(''.padEnd(20 + scenario.name.length, '-'));
    
    try {
      const result = await notifySearchEnginesNewArticle(scenario.article);
      
      // Analyze results
      const analysis = this.analyzeNotificationResult(result, scenario.name);
      this.results.languages[scenario.article.language_code] = analysis;
      
      console.log(`📊 Results for ${scenario.name}:`);
      console.log(`   ✅ Successful: ${analysis.successful}`);
      console.log(`   ❌ Failed: ${analysis.failed}`);
      console.log(`   📈 Success Rate: ${analysis.successRate}%`);
      
      if (analysis.errors.length > 0) {
        console.log(`   🚨 Errors: ${analysis.errors.join(', ')}`);
      }
      
    } catch (error) {
      this.addError(`${scenario.name} test failed: ${error.message}`);
      console.log(`❌ ${scenario.name} test failed: ${error.message}`);
    }
  }

  async testSitemapNotifications() {
    console.log('\n🗺️  Testing Sitemap Notifications');
    console.log('----------------------------------');
    
    try {
      const result = await notifySearchEnginesSitemapUpdate();
      const analysis = this.analyzeNotificationResult(result, 'Sitemap Update');
      this.results.services.sitemap_notifications = analysis;
      
      console.log(`📊 Sitemap Notification Results:`);
      console.log(`   ✅ Successful: ${analysis.successful}`);
      console.log(`   ❌ Failed: ${analysis.failed}`);
      console.log(`   📈 Success Rate: ${analysis.successRate}%`);
      
    } catch (error) {
      this.addError(`Sitemap notification test failed: ${error.message}`);
      console.log(`❌ Sitemap notification test failed: ${error.message}`);
    }
  }

  analyzeNotificationResult(result, testName) {
    const analysis = {
      testName,
      successful: 0,
      failed: 0,
      total: 0,
      successRate: 0,
      services: {},
      errors: []
    };

    if (result && result.notifications) {
      const notifications = result.notifications;
      
      // Count modern services (exclude legacy)
      const modernServices = [
        'googleIndexingApi', 'bingWebmasterApi', 'yandexWebmasterApi',
        'indexnow', 'languageSpecificSitemaps', 'rss_feeds', 'websub'
      ];

      for (const service of modernServices) {
        if (notifications[service]) {
          analysis.total++;
          const serviceResult = notifications[service];
          
          if (serviceResult.success) {
            analysis.successful++;
            analysis.services[service] = 'success';
          } else {
            analysis.failed++;
            analysis.services[service] = 'failed';
            
            if (serviceResult.reason !== 'disabled' && serviceResult.reason !== 'disabled_or_not_configured') {
              analysis.errors.push(`${service}: ${serviceResult.error || serviceResult.reason}`);
            }
          }
        }
      }
    }

    analysis.successRate = analysis.total > 0 ? Math.round((analysis.successful / analysis.total) * 100) : 0;
    
    // Update overall stats
    this.results.overall.successful += analysis.successful;
    this.results.overall.failed += analysis.failed;
    this.results.overall.total += analysis.total;

    return analysis;
  }

  addError(error) {
    this.results.errors.push({
      timestamp: new Date().toISOString(),
      error
    });
  }

  generateReport() {
    console.log('\n📋 SEO Notifications Health Report');
    console.log('===================================');
    
    const overallSuccessRate = this.results.overall.total > 0 
      ? Math.round((this.results.overall.successful / this.results.overall.total) * 100) 
      : 0;
    
    console.log(`\n📊 Overall Statistics:`);
    console.log(`   Total Tests: ${this.results.overall.total}`);
    console.log(`   Successful: ${this.results.overall.successful}`);
    console.log(`   Failed: ${this.results.overall.failed}`);
    console.log(`   Success Rate: ${overallSuccessRate}%`);
    
    // Service status
    console.log(`\n🔧 Service Status:`);
    console.log(`   IndexNow API: ${this.getServiceStatus('indexnow')}`);
    console.log(`   Google Indexing API: ${this.getServiceStatus('googleIndexingApi')}`);
    console.log(`   Bing Webmaster API: ${this.getServiceStatus('bingWebmasterApi')}`);
    console.log(`   Yandex Webmaster API: ${this.getServiceStatus('yandexWebmasterApi')}`);
    console.log(`   WebSub: ${this.getServiceStatus('websub')}`);
    
    // Language coverage
    console.log(`\n🌍 Language Coverage:`);
    for (const [lang, analysis] of Object.entries(this.results.languages)) {
      console.log(`   ${lang.toUpperCase()}: ${analysis.successRate}% success rate`);
    }
    
    // Errors
    if (this.results.errors.length > 0) {
      console.log(`\n🚨 Errors Detected:`);
      this.results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.error}`);
      });
    }
    
    // Recommendations
    this.generateRecommendations();
    
    // Save report
    this.saveReport();
  }

  getServiceStatus(serviceName) {
    const statuses = [];
    
    for (const analysis of Object.values(this.results.languages)) {
      if (analysis.services[serviceName]) {
        statuses.push(analysis.services[serviceName]);
      }
    }
    
    if (this.results.services.sitemap_notifications?.services[serviceName]) {
      statuses.push(this.results.services.sitemap_notifications.services[serviceName]);
    }
    
    if (statuses.length === 0) return '❓ Not tested';
    
    const successCount = statuses.filter(s => s === 'success').length;
    const totalCount = statuses.length;
    
    if (successCount === totalCount) return '✅ Healthy';
    if (successCount > 0) return '⚠️ Partial';
    return '❌ Failed';
  }

  generateRecommendations() {
    console.log(`\n💡 Recommendations:`);
    
    const recommendations = [];
    
    // Check IndexNow
    if (this.getServiceStatus('indexnow') !== '✅ Healthy') {
      recommendations.push('Configure IndexNow API key for better search engine coverage');
    }
    
    // Check Bing
    if (this.getServiceStatus('bingWebmasterApi') === '❓ Not tested') {
      recommendations.push('Enable Bing Webmaster API for better Bing indexing');
    }
    
    // Check Yandex
    if (this.getServiceStatus('yandexWebmasterApi') === '❓ Not tested') {
      recommendations.push('Enable Yandex Webmaster API for Russian market coverage');
    }
    
    // Check overall success rate
    const overallSuccessRate = this.results.overall.total > 0 
      ? Math.round((this.results.overall.successful / this.results.overall.total) * 100) 
      : 0;
    
    if (overallSuccessRate < 50) {
      recommendations.push('Low success rate detected - review API configurations');
    }
    
    if (recommendations.length === 0) {
      console.log('   ✅ All systems operating optimally');
    } else {
      recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }
  }

  async saveReport() {
    try {
      const fs = await import('fs');
      const reportPath = `logs/seo-health-report-${new Date().toISOString().split('T')[0]}.json`;
      
      fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
      console.log(`\n💾 Report saved to: ${reportPath}`);
    } catch (error) {
      console.log(`\n❌ Failed to save report: ${error.message}`);
    }
  }
}

// Run the monitor
async function runMonitor() {
  const monitor = new SEONotificationMonitor();
  await monitor.runHealthCheck();
}

runMonitor().catch(console.error);
