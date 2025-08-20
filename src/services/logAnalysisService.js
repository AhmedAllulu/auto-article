import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { genLog, genError } from './logger.js';

/**
 * Log File Analysis Service
 * Analyzes server logs to identify Googlebot crawl budget waste
 * and provides recommendations for optimization
 */

// Log Analysis Configuration
const LOG_ANALYSIS_CONFIG = {
  // Log file paths (adjust based on your server setup)
  logPaths: [
    '/var/log/nginx/access.log',
    '/var/log/apache2/access.log',
    './logs/access.log',
    process.env.ACCESS_LOG_PATH
  ].filter(Boolean),
  
  // Googlebot user agents to track
  googlebotUserAgents: [
    'Googlebot',
    'Googlebot-Mobile',
    'Googlebot-Image',
    'Googlebot-News',
    'Googlebot-Video',
    'AdsBot-Google',
    'Google-InspectionTool'
  ],
  
  // URL patterns that waste crawl budget
  crawlWastePatterns: {
    // Pagination beyond reasonable limits
    deepPagination: /[?&]page=([5-9]\d|\d{3,})/i,
    
    // Faceted search with multiple parameters
    facetedSearch: /[?&].*?[?&].*?[?&]/,
    
    // Search result pages
    searchPages: /[?&](q|search|query)=/i,
    
    // Calendar/date archives beyond current year
    oldDateArchives: /\/(19|20[01])\d\//,
    
    // Tag pages with low value
    tagPages: /\/tag\//i,
    
    // Author pages (if not valuable)
    authorPages: /\/author\//i,
    
    // Feed pages with parameters
    feedParams: /\/feed\/?\?/i,
    
    // Print/mobile versions
    printPages: /[?&](print|mobile)=1/i,
    
    // Session IDs and tracking parameters
    sessionIds: /[?&](sid|sessionid|PHPSESSID)=/i,
    
    // Sorting and filtering parameters
    sortingParams: /[?&](sort|order|filter)=/i,
    
    // Language parameters (if using subdirectories)
    langParams: /[?&]lang=/i,
    
    // Affiliate and tracking codes
    trackingParams: /[?&](utm_|ref=|affiliate)/i
  },
  
  // Analysis time range (days)
  analysisRangeDays: 30,
  
  // Minimum crawl frequency to consider waste
  minCrawlsForWaste: 5
};

/**
 * Parse log line to extract relevant information
 */
function parseLogLine(line) {
  // Common log format: IP - - [timestamp] "method URL protocol" status size "referer" "user-agent"
  const logRegex = /^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+) ([^"]*) \S+" (\d+) (\S+) "([^"]*)" "([^"]*)"/;
  const match = line.match(logRegex);
  
  if (!match) return null;
  
  const [, ip, timestamp, method, url, status, size, referer, userAgent] = match;
  
  return {
    ip,
    timestamp: new Date(timestamp.replace(/(\d{2})\/(\w{3})\/(\d{4}):/, '$2 $1, $3 ')),
    method,
    url: decodeURIComponent(url),
    status: parseInt(status),
    size: size === '-' ? 0 : parseInt(size),
    referer,
    userAgent
  };
}

/**
 * Check if request is from Googlebot
 */
function isGooglebot(userAgent) {
  return LOG_ANALYSIS_CONFIG.googlebotUserAgents.some(bot => 
    userAgent.toLowerCase().includes(bot.toLowerCase())
  );
}

/**
 * Analyze URL for crawl budget waste patterns
 */
function analyzeUrlForWaste(url) {
  const wasteReasons = [];
  
  for (const [pattern, regex] of Object.entries(LOG_ANALYSIS_CONFIG.crawlWastePatterns)) {
    if (regex.test(url)) {
      wasteReasons.push(pattern);
    }
  }
  
  return wasteReasons;
}

/**
 * Analyze log file for Googlebot activity
 */
async function analyzeLogFile(logPath) {
  if (!fs.existsSync(logPath)) {
    genLog(`Log file not found: ${logPath}`);
    return null;
  }
  
  genLog(`Analyzing log file: ${logPath}`);
  
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  const analysis = {
    totalRequests: 0,
    googlebotRequests: 0,
    crawlWaste: {},
    urlStats: new Map(),
    statusCodes: {},
    hourlyActivity: {},
    topWasteUrls: [],
    recommendations: []
  };
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - LOG_ANALYSIS_CONFIG.analysisRangeDays);
  
  try {
    for await (const line of rl) {
      const logEntry = parseLogLine(line);
      if (!logEntry || logEntry.timestamp < cutoffDate) continue;
      
      analysis.totalRequests++;
      
      if (isGooglebot(logEntry.userAgent)) {
        analysis.googlebotRequests++;
        
        // Track status codes
        analysis.statusCodes[logEntry.status] = (analysis.statusCodes[logEntry.status] || 0) + 1;
        
        // Track hourly activity
        const hour = logEntry.timestamp.getHours();
        analysis.hourlyActivity[hour] = (analysis.hourlyActivity[hour] || 0) + 1;
        
        // Analyze URL for waste patterns
        const wasteReasons = analyzeUrlForWaste(logEntry.url);
        
        if (wasteReasons.length > 0) {
          // Track waste by pattern
          wasteReasons.forEach(reason => {
            analysis.crawlWaste[reason] = (analysis.crawlWaste[reason] || 0) + 1;
          });
          
          // Track individual URLs
          const urlKey = logEntry.url;
          if (!analysis.urlStats.has(urlKey)) {
            analysis.urlStats.set(urlKey, {
              url: urlKey,
              crawls: 0,
              wasteReasons,
              lastCrawled: logEntry.timestamp,
              statusCodes: {}
            });
          }
          
          const urlStat = analysis.urlStats.get(urlKey);
          urlStat.crawls++;
          urlStat.lastCrawled = logEntry.timestamp;
          urlStat.statusCodes[logEntry.status] = (urlStat.statusCodes[logEntry.status] || 0) + 1;
        }
      }
    }
    
    // Process results
    analysis.topWasteUrls = Array.from(analysis.urlStats.values())
      .filter(stat => stat.crawls >= LOG_ANALYSIS_CONFIG.minCrawlsForWaste)
      .sort((a, b) => b.crawls - a.crawls)
      .slice(0, 50);
    
    // Generate recommendations
    analysis.recommendations = generateRecommendations(analysis);
    
    genLog(`Log analysis completed: ${analysis.googlebotRequests} Googlebot requests analyzed`);
    return analysis;
    
  } catch (error) {
    genError(`Error analyzing log file ${logPath}`, { error: error.message });
    return null;
  }
}

/**
 * Generate optimization recommendations based on analysis
 */
function generateRecommendations(analysis) {
  const recommendations = [];
  
  // Deep pagination waste
  if (analysis.crawlWaste.deepPagination > 10) {
    recommendations.push({
      type: 'robots_disallow',
      priority: 'high',
      issue: 'Deep pagination crawl waste',
      description: `Googlebot crawled ${analysis.crawlWaste.deepPagination} deep pagination URLs`,
      solution: 'Add to robots.txt: Disallow: /*?page= or Disallow: /*&page=',
      robotsRule: 'Disallow: /*?page=\nDisallow: /*&page='
    });
  }
  
  // Faceted search waste
  if (analysis.crawlWaste.facetedSearch > 20) {
    recommendations.push({
      type: 'robots_disallow',
      priority: 'high',
      issue: 'Faceted search crawl waste',
      description: `Googlebot crawled ${analysis.crawlWaste.facetedSearch} faceted search URLs`,
      solution: 'Block faceted search parameters or use noindex meta tag',
      robotsRule: 'Disallow: /*?*&*'
    });
  }
  
  // Search pages waste
  if (analysis.crawlWaste.searchPages > 15) {
    recommendations.push({
      type: 'robots_disallow',
      priority: 'medium',
      issue: 'Search result pages crawl waste',
      description: `Googlebot crawled ${analysis.crawlWaste.searchPages} search result pages`,
      solution: 'Block search result pages from crawling',
      robotsRule: 'Disallow: /*?q=\nDisallow: /*?search=\nDisallow: /*?query='
    });
  }
  
  // Old date archives
  if (analysis.crawlWaste.oldDateArchives > 5) {
    recommendations.push({
      type: 'robots_disallow',
      priority: 'medium',
      issue: 'Old date archive crawl waste',
      description: `Googlebot crawled ${analysis.crawlWaste.oldDateArchives} old date archive pages`,
      solution: 'Block old date archives (keep recent years only)',
      robotsRule: 'Disallow: /19*/\nDisallow: /200*/\nDisallow: /201*/'
    });
  }
  
  // Tracking parameters
  if (analysis.crawlWaste.trackingParams > 10) {
    recommendations.push({
      type: 'url_parameters',
      priority: 'medium',
      issue: 'Tracking parameter crawl waste',
      description: `Googlebot crawled ${analysis.crawlWaste.trackingParams} URLs with tracking parameters`,
      solution: 'Configure URL parameters in Google Search Console or use canonical URLs',
      robotsRule: 'Disallow: /*?utm_*\nDisallow: /*&utm_*'
    });
  }
  
  // Session IDs
  if (analysis.crawlWaste.sessionIds > 5) {
    recommendations.push({
      type: 'robots_disallow',
      priority: 'high',
      issue: 'Session ID crawl waste',
      description: `Googlebot crawled ${analysis.crawlWaste.sessionIds} URLs with session IDs`,
      solution: 'Block URLs with session IDs - these create infinite crawl loops',
      robotsRule: 'Disallow: /*?sid=\nDisallow: /*&sid=\nDisallow: /*?sessionid=\nDisallow: /*?PHPSESSID='
    });
  }
  
  // 404 errors
  const notFoundCount = analysis.statusCodes[404] || 0;
  if (notFoundCount > 20) {
    recommendations.push({
      type: 'fix_errors',
      priority: 'high',
      issue: '404 error crawl waste',
      description: `Googlebot encountered ${notFoundCount} 404 errors`,
      solution: 'Fix broken internal links or add proper redirects',
      action: 'audit_internal_links'
    });
  }
  
  // Server errors
  const serverErrorCount = (analysis.statusCodes[500] || 0) + (analysis.statusCodes[502] || 0) + (analysis.statusCodes[503] || 0);
  if (serverErrorCount > 10) {
    recommendations.push({
      type: 'fix_errors',
      priority: 'critical',
      issue: 'Server error crawl waste',
      description: `Googlebot encountered ${serverErrorCount} server errors`,
      solution: 'Fix server issues to prevent crawl budget waste',
      action: 'check_server_health'
    });
  }
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

/**
 * Analyze all available log files
 */
export async function analyzeServerLogs() {
  genLog('Starting server log analysis for crawl budget optimization');
  
  const results = {
    analysisDate: new Date().toISOString(),
    logFilesAnalyzed: 0,
    totalAnalysis: {
      totalRequests: 0,
      googlebotRequests: 0,
      crawlWaste: {},
      topWasteUrls: [],
      recommendations: [],
      summary: {}
    }
  };
  
  // Find and analyze available log files
  for (const logPath of LOG_ANALYSIS_CONFIG.logPaths) {
    if (fs.existsSync(logPath)) {
      const analysis = await analyzeLogFile(logPath);
      if (analysis) {
        results.logFilesAnalyzed++;
        
        // Merge results
        results.totalAnalysis.totalRequests += analysis.totalRequests;
        results.totalAnalysis.googlebotRequests += analysis.googlebotRequests;
        
        // Merge crawl waste
        for (const [pattern, count] of Object.entries(analysis.crawlWaste)) {
          results.totalAnalysis.crawlWaste[pattern] = (results.totalAnalysis.crawlWaste[pattern] || 0) + count;
        }
        
        // Merge top waste URLs
        results.totalAnalysis.topWasteUrls.push(...analysis.topWasteUrls);
        
        // Merge recommendations
        results.totalAnalysis.recommendations.push(...analysis.recommendations);
      }
    }
  }
  
  if (results.logFilesAnalyzed === 0) {
    genError('No log files found for analysis', { 
      searchedPaths: LOG_ANALYSIS_CONFIG.logPaths 
    });
    return results;
  }
  
  // Sort and deduplicate results
  results.totalAnalysis.topWasteUrls = results.totalAnalysis.topWasteUrls
    .sort((a, b) => b.crawls - a.crawls)
    .slice(0, 100);
  
  // Deduplicate recommendations by type and issue
  const uniqueRecommendations = new Map();
  results.totalAnalysis.recommendations.forEach(rec => {
    const key = `${rec.type}-${rec.issue}`;
    if (!uniqueRecommendations.has(key) || uniqueRecommendations.get(key).priority < rec.priority) {
      uniqueRecommendations.set(key, rec);
    }
  });
  results.totalAnalysis.recommendations = Array.from(uniqueRecommendations.values());
  
  // Generate summary
  results.totalAnalysis.summary = {
    crawlBudgetWaste: Object.values(results.totalAnalysis.crawlWaste).reduce((a, b) => a + b, 0),
    wastePercentage: results.totalAnalysis.googlebotRequests > 0 
      ? ((Object.values(results.totalAnalysis.crawlWaste).reduce((a, b) => a + b, 0) / results.totalAnalysis.googlebotRequests) * 100).toFixed(2)
      : 0,
    topWastePattern: Object.entries(results.totalAnalysis.crawlWaste)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none',
    recommendationCount: results.totalAnalysis.recommendations.length
  };
  
  genLog('Server log analysis completed', {
    logFilesAnalyzed: results.logFilesAnalyzed,
    googlebotRequests: results.totalAnalysis.googlebotRequests,
    crawlWaste: results.totalAnalysis.summary.crawlBudgetWaste,
    wastePercentage: results.totalAnalysis.summary.wastePercentage
  });
  
  return results;
}

/**
 * Generate robots.txt rules based on analysis
 */
export function generateRobotsRules(analysis) {
  const rules = [];
  
  analysis.recommendations
    .filter(rec => rec.type === 'robots_disallow' && rec.robotsRule)
    .forEach(rec => {
      rules.push(`# ${rec.issue}`);
      rules.push(rec.robotsRule);
      rules.push('');
    });
  
  return rules.join('\n');
}

export { LOG_ANALYSIS_CONFIG };
