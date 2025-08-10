import cron from 'node-cron';
import { config } from '../config/env.js';
import logger from '../lib/logger.js';
import { listCategories } from '../models/categoryModel.js';
import { createArticle } from '../models/articleModel.js';
import { recordTokenUsage, getMonthlyTokenUsage } from '../models/tokenUsageModel.js';
import { upsertDailyJobTarget, incrementJobProgress, getJobForDay } from '../models/jobModel.js';
import { generateArticleViaAPI, translateArticleViaAPI } from './aiClient.js';
import { buildMeta, createSlug, estimateReadingTimeMinutes } from '../utils/seo.js';
import { discoverTrendingTopicsWithAI } from './trendsService.js';
import { canRunOperation } from './budgetMonitorService.js';
import { withLock } from './persistentLockService.js';
import { initQueue, resetQueue, getQueueSnapshot, peekNextItem, commitIndex, isForToday } from './persistentQueueService.js';
import { getTrendsWithResilience } from './trendsFacadeService.js';
import { config as appConfig } from '../config/env.js';
import { getAdjustedEstimate, updateEstimate } from './budgetLearningService.js';
import { startCacheMaintenance } from './cacheMaintenanceService.js';

// Enhanced profitability strategy with professional content focus
const PROFITABILITY_STRATEGY = {
  LANGUAGE_DISTRIBUTION: {
    'en': { 
      percentage: 35, 
      priority: 1, 
      avgRPM: 15.50, 
      categories: ['technology', 'finance', 'business'],
      professionalFocus: 'executives and decision makers',
      contentTypes: ['THOUGHT_LEADERSHIP', 'NEWS_ANALYSIS', 'STRATEGIC_GUIDE']
    },
    'de': { 
      percentage: 20, 
      priority: 2, 
      avgRPM: 12.80, 
      categories: ['technology', 'finance', 'business', 'health'],
      professionalFocus: 'industry professionals',
      contentTypes: ['PRACTICAL_GUIDE', 'NEWS_ANALYSIS', 'SEO_ARTICLE']
    },
    'fr': { 
      percentage: 15, 
      priority: 3, 
      avgRPM: 9.40, 
      categories: ['technology', 'business', 'travel', 'health'],
      professionalFocus: 'professional audience',
      contentTypes: ['SEO_ARTICLE', 'PRACTICAL_GUIDE']
    },
    'es': { 
      percentage: 12, 
      priority: 4, 
      avgRPM: 7.20, 
      categories: ['technology', 'health', 'sports', 'entertainment'],
      professionalFocus: 'general professionals',
      contentTypes: ['SEO_ARTICLE', 'QUICK_INSIGHTS']
    },
    'pt': { 
      percentage: 8, 
      priority: 5, 
      avgRPM: 5.60, 
      categories: ['health', 'sports', 'entertainment', 'travel'],
      professionalFocus: 'informed readers',
      contentTypes: ['SEO_ARTICLE', 'QUICK_INSIGHTS']
    },
    'ar': { 
      percentage: 6, 
      priority: 6, 
      avgRPM: 4.80, 
      categories: ['technology', 'business', 'health'],
      professionalFocus: 'business professionals',
      contentTypes: ['SEO_ARTICLE', 'PRACTICAL_GUIDE']
    },
    'hi': { 
      percentage: 4, 
      priority: 7, 
      avgRPM: 3.20, 
      categories: ['technology', 'health', 'entertainment'],
      professionalFocus: 'educated audience',
      contentTypes: ['SEO_ARTICLE', 'QUICK_INSIGHTS']
    }
  },

  CATEGORY_DISTRIBUTION: {
    'technology': { 
      percentage: 25, 
      priority: 1, 
      avgRPM: 18.20,
      professionalLevel: 'high',
      contentFocus: 'industry implications and strategic insights',
      preferredTypes: ['THOUGHT_LEADERSHIP', 'NEWS_ANALYSIS', 'STRATEGIC_GUIDE']
    },
    'finance': { 
      percentage: 20, 
      priority: 2, 
      avgRPM: 16.80,
      professionalLevel: 'high',
      contentFocus: 'market analysis and investment insights',
      preferredTypes: ['NEWS_ANALYSIS', 'STRATEGIC_GUIDE', 'THOUGHT_LEADERSHIP']
    },
    'business': { 
      percentage: 15, 
      priority: 3, 
      avgRPM: 14.50,
      professionalLevel: 'high',
      contentFocus: 'leadership and operational excellence',
      preferredTypes: ['THOUGHT_LEADERSHIP', 'PRACTICAL_GUIDE', 'NEWS_ANALYSIS']
    },
    'health': { 
      percentage: 15, 
      priority: 4, 
      avgRPM: 12.30,
      professionalLevel: 'medium',
      contentFocus: 'professional health insights and research',
      preferredTypes: ['SEO_ARTICLE', 'PRACTICAL_GUIDE']
    },
    'travel': { 
      percentage: 10, 
      priority: 5, 
      avgRPM: 8.90,
      professionalLevel: 'medium',
      contentFocus: 'business travel and industry trends',
      preferredTypes: ['SEO_ARTICLE', 'PRACTICAL_GUIDE']
    },
    'sports': { 
      percentage: 8, 
      priority: 6, 
      avgRPM: 7.60,
      professionalLevel: 'low',
      contentFocus: 'sports business and analytics',
      preferredTypes: ['SEO_ARTICLE', 'QUICK_INSIGHTS']
    },
    'entertainment': { 
      percentage: 7, 
      priority: 7, 
      avgRPM: 6.40,
      professionalLevel: 'low',
      contentFocus: 'industry analysis and trends',
      preferredTypes: ['SEO_ARTICLE', 'QUICK_INSIGHTS']
    }
  }
};

// Enhanced content strategies with professional quality benchmarks
const ENHANCED_CONTENT_STRATEGIES = {
  'THOUGHT_LEADERSHIP': { 
    weight: 0.25, 
    complexity: 'high', 
    audience: 'executives and senior decision makers', 
    avgTokens: 3200,
    qualityBenchmark: 'Harvard Business Review',
    features: 'provocative insights, industry predictions, strategic frameworks',
    minWords: 1500,
    maxWords: 2200,
    requiresWebSearch: true,
    professionalGrade: true
  },
  'NEWS_ANALYSIS': { 
    weight: 0.30, 
    complexity: 'high', 
    audience: 'professionals seeking current insights', 
    avgTokens: 2800,
    qualityBenchmark: 'Wall Street Journal Analysis',
    features: 'breaking news analysis, immediate implications, expert perspectives',
    minWords: 1200,
    maxWords: 1800,
    requiresWebSearch: true,
    professionalGrade: true
  },
  'STRATEGIC_GUIDE': { 
    weight: 0.25, 
    complexity: 'medium', 
    audience: 'professionals implementing solutions', 
    avgTokens: 2600,
    qualityBenchmark: 'McKinsey Insights',
    features: 'step-by-step frameworks, implementation roadmaps, best practices',
    minWords: 1200,
    maxWords: 1800,
    requiresWebSearch: false,
    professionalGrade: true
  },
  'SEO_ARTICLE': { 
    weight: 0.15, 
    complexity: 'medium', 
    audience: 'informed general readers', 
    avgTokens: 2200,
    qualityBenchmark: 'Premium Blog Content',
    features: 'SEO optimization, comprehensive coverage, actionable insights',
    minWords: 1000,
    maxWords: 1500,
    requiresWebSearch: false,
    professionalGrade: false
  },
  'QUICK_INSIGHTS': { 
    weight: 0.05, 
    complexity: 'low', 
    audience: 'casual professional readers', 
    avgTokens: 1600,
    qualityBenchmark: 'Professional Newsletter',
    features: 'quick takeaways, key points, accessible insights',
    minWords: 800,
    maxWords: 1200,
    requiresWebSearch: false,
    professionalGrade: false
  }
};

// Enhanced professional writing styles
const PROFESSIONAL_WRITING_STYLES = {
  THOUGHT_LEADERSHIP: {
    tone: 'visionary but grounded, challenging conventional wisdom',
    structure: 'provocative thesis, supporting evidence, contrarian insights, future implications',
    features: 'original frameworks, industry predictions, paradigm shifts, strategic recommendations',
    qualityStandard: 'Harvard Business Review caliber'
  },
  NEWS_ANALYSIS: {
    tone: 'urgent but measured, insider perspective with analytical depth',
    structure: 'breaking news lead, context and background, implications analysis, actionable recommendations',
    features: 'immediate implications, stakeholder impact, strategic recommendations, expert perspectives',
    qualityStandard: 'Wall Street Journal analysis level'
  },
  STRATEGIC_GUIDE: {
    tone: 'experienced mentor, authoritative yet accessible',
    structure: 'challenge identification, framework presentation, implementation roadmap, success metrics',
    features: 'detailed workflows, common pitfalls, success metrics, real-world examples',
    qualityStandard: 'McKinsey Insights depth'
  },
  SEO_ARTICLE: {
    tone: 'professional expert speaking to informed audience',
    structure: 'problem-agitation-solution with comprehensive coverage',
    features: 'SEO optimization, actionable insights, comprehensive coverage, expert credibility',
    qualityStandard: 'Premium content marketing'
  },
  QUICK_INSIGHTS: {
    tone: 'knowledgeable professional, concise and practical',
    structure: 'key insight, supporting evidence, immediate application',
    features: 'quick takeaways, key points, accessible insights, immediate value',
    qualityStandard: 'Professional newsletter quality'
  }
};

// Enhanced prompt building for professional content
function buildEnhancedProfessionalPrompt({ 
  topic, 
  languageCode, 
  categoryName, 
  contentType = 'SEO_ARTICLE',
  targetAudience = 'professionals',
  keywords = [],
  maxWords = 1500,
  geoScope = 'global',
  variationHint = '',
  newsAngle = null,
  professionalGrade = false
}) {
  const style = PROFESSIONAL_WRITING_STYLES[contentType] || PROFESSIONAL_WRITING_STYLES.SEO_ARTICLE;
  const strategy = ENHANCED_CONTENT_STRATEGIES[contentType] || ENHANCED_CONTENT_STRATEGIES.SEO_ARTICLE;
  
  const languageNames = {
    'en': 'English', 'es': 'Spanish', 'de': 'German', 'fr': 'French',
    'ar': 'Arabic', 'hi': 'Hindi', 'pt': 'Portuguese'
  };
  
  const languageName = languageNames[languageCode] || 'English';
  const today = new Date().toISOString().slice(0, 10);
  
  const professionalPrompt = [
    `# PROFESSIONAL ${contentType.replace('_', ' ')} BRIEF`,
    `**Target Quality**: ${strategy.qualityBenchmark}`,
    `**Language**: ${languageName} | **Date**: ${today}`,
    `**Category**: ${categoryName} | **Audience**: ${targetAudience}`,
    `**Word Range**: ${strategy.minWords}-${strategy.maxWords} words`,
    newsAngle ? `**News Foundation**: ${newsAngle}` : '',
    variationHint ? `**Unique Angle**: ${variationHint}` : '',
    '',
    `## 🎯 MISSION: PROFESSIONAL EXCELLENCE`,
    `Create content that busy ${targetAudience} would:`,
    `- Bookmark for future reference`,
    `- Share with colleagues and peers`, 
    `- Use in their decision-making process`,
    `- Consider a valuable use of their time`,
    '',
    `**Quality Standard**: ${style.qualityStandard}`,
    `**Professional Grade**: ${professionalGrade ? 'EXECUTIVE LEVEL' : 'STANDARD'}`,
    '',
    `## 📊 CONTENT STRATEGY`,
    `### Writing Approach:`,
    `- **Tone**: ${style.tone}`,
    `- **Structure**: ${style.structure}`,
    `- **Key Features**: ${style.features}`,
    '',
    `### Value Proposition:`,
    newsAngle ? 
    `- **News-Driven Analysis**: Transform "${newsAngle}" into actionable business intelligence` +
    `\n- **Strategic Context**: Connect this development to broader industry implications` +
    `\n- **Decision Support**: Provide clear recommendations for different stakeholder groups` :
    `- **Industry Leadership**: Position as authoritative voice in ${categoryName}`,
    `- **Practical Value**: Deliver immediately applicable insights and frameworks`,
    `- **Strategic Depth**: Go beyond surface-level to provide meaningful analysis`,
    '',
    `## 🔥 PROFESSIONAL STANDARDS`,
    `### Content Depth Requirements:`,
    `- **Current Context**: What's happening now in this space`,
    `- **Strategic Analysis**: Why this matters for business decisions`,
    `- **Actionable Framework**: Specific steps readers can implement`,
    `- **Future Implications**: What this means for the next 6-12 months`,
    '',
    `### Evidence & Credibility:`,
    `- **Data Points**: Include specific percentages, dollar amounts, timeframes`,
    `- **Industry Examples**: Reference real companies, products, or case studies`,
    `- **Expert Perspective**: Professional insights and authoritative viewpoints`,
    `- **Comparative Analysis**: How this relates to industry benchmarks or competitors`,
    '',
    `## 📝 ENHANCED ARTICLE STRUCTURE`,
    `### 1. **Professional Headline** (45-60 characters)`,
    `- Lead with impact: "How [Topic] is Reshaping [Industry]"`,
    `- Include specific benefit or surprising insight`,
    `- Make it boardroom-worthy, not clickbait`,
    '',
    `### 2. **Executive Summary** (120-150 words)`,
    `- **Bottom Line**: One sentence capturing the core insight`,
    `- **Key Metrics**: 2-3 most important data points`,
    `- **Strategic Implication**: What business leaders need to know`,
    `- **Action Required**: Primary recommendation`,
    '',
    `### 3. **Professional Introduction** (150-200 words)`,
    newsAngle ?
    `- **Breaking Development**: "${newsAngle}"` +
    `\n- **Business Impact**: Why this matters more than it appears` +
    `\n- **Stakeholder Implications**: Who wins, who loses, who needs to act` :
    `- **Industry Challenge**: The problem every professional in ${categoryName} faces`,
    `- **Current State**: Where the industry stands today`,
    `- **Value Preview**: What readers will gain from this analysis`,
    '',
    `### 4. **Strategic Context** (200-300 words)`,
    `#### **Market Landscape**`,
    `- Current industry dynamics and key players`,
    `- Recent shifts in ${categoryName} landscape`,
    `- Economic and regulatory factors at play`,
    '',
    `#### **Competitive Intelligence**`,
    `- How leading companies are responding`,
    `- Emerging best practices and proven strategies`,
    `- Competitive advantages being created or lost`,
    '',
    `### 5. **Deep Professional Analysis** (400-600 words)`,
    `Break into focused subsections:`,
    '',
    `#### **🔍 Strategic Impact Assessment**`,
    `- **Winners and Losers**: Which segments, companies, or roles benefit/suffer`,
    `- **Revenue Implications**: Cost structures, pricing power, market opportunities`,
    `- **Operational Changes**: How this affects day-to-day business operations`,
    '',
    `#### **💼 Executive Decision Framework**`,
    `- **Strategic Options**: The main paths forward for businesses`,
    `- **Risk Assessment**: What could go wrong and how to mitigate`,
    `- **Investment Priorities**: Where to allocate resources and attention`,
    '',
    `#### **📈 Performance Metrics & KPIs**`,
    `- **Success Indicators**: How to measure progress and results`,
    `- **Benchmarking**: Industry standards and best-in-class performance`,
    `- **ROI Considerations**: Financial implications and payback periods`,
    '',
    `#### **🏆 Implementation Excellence**`,
    `- **Proven Approaches**: What has worked for early adopters`,
    `- **Common Pitfalls**: Mistakes to avoid based on industry experience`,
    `- **Critical Success Factors**: Non-negotiable elements for success`,
    '',
    `### 6. **Actionable Professional Recommendations** (250-350 words)`,
    `#### **For Different Professional Roles:**`,
    `- **C-Suite Executives**: Strategic decisions and resource allocation`,
    `- **Department Heads**: Operational changes and team preparation`,
    `- **Individual Contributors**: Skill development and career positioning`,
    '',
    `#### **Implementation Roadmap:**`,
    `- **Immediate Actions (Next 30 Days)**: Critical first steps`,
    `- **Strategic Moves (Next Quarter)**: Medium-term positioning`,
    `- **Long-term Positioning (6-12 Months)**: Future-proofing strategies`,
    '',
    `### 7. **Future Outlook & Scenario Planning** (150-200 words)`,
    `- **Base Case Scenario**: Most likely developments over next 12 months`,
    `- **Optimistic Scenario**: Best-case outcomes and how to capitalize`,
    `- **Risk Scenario**: Potential challenges and defensive strategies`,
    `- **Wild Card Events**: Low-probability, high-impact possibilities to monitor`,
    '',
    `### 8. **Professional Conclusion** (100-150 words)`,
    `- **Strategic Synthesis**: Connect all insights into coherent business intelligence`,
    `- **Call to Action**: One specific step every reader should take this week`,
    `- **Competitive Edge**: How acting on this information provides advantage`,
    '',
    `### 9. **Professional FAQ** (200-250 words)`,
    `Address 4-5 strategic questions:`,
    `- **Budget/Resource Questions**: "What's the typical investment required?"`,
    `- **Timeline Queries**: "When should we expect to see results?"`,
    `- **Risk Management**: "What are the main risks and how do we mitigate them?"`,
    `- **Competitive Positioning**: "How does this compare to what competitors are doing?"`,
    '',
    `## 🔍 RESEARCH & CITATIONS (if web search enabled)`,
    `**Priority Sources**:`,
    `1. **Financial Reports**: Quarterly earnings, annual reports, SEC filings`,
    `2. **Industry Research**: Gartner, McKinsey, BCG, Deloitte reports`,
    `3. **Business News**: WSJ, Bloomberg, Financial Times, Reuters`,
    `4. **Expert Commentary**: Industry leaders, analysts, academic research`,
    `5. **Government Data**: Regulatory filings, economic indicators, policy announcements`,
    '',
    `**Citation Format**: [1], [2], etc. with sources listed at end`,
    '',
    `## 🎨 PROFESSIONAL STYLE GUIDELINES`,
    `### Voice & Authority:`,
    `- **Confident Expertise**: Authoritative without being condescending`,
    `- **Business Acumen**: Demonstrate deep understanding of commercial implications`,
    `- **Strategic Thinking**: Show ability to connect dots across the industry`,
    `- **Executive Communication**: Language appropriate for C-suite consumption`,
    '',
    `### Language Excellence:`,
    `- **Precision**: Use specific metrics, timeframes, and quantified outcomes`,
    `- **Professional Vocabulary**: Industry terminology used correctly and naturally`,
    `- **Active Voice**: Direct, accountable language that conveys confidence`,
    `- **Strategic Framing**: Position insights within broader business context`,
    '',
    `### Quality Assurance:`,
    `- **Fact-Based**: Every claim supported by evidence or logical reasoning`,
    `- **Balanced Perspective**: Acknowledge complexity while providing clear direction`,
    `- **Actionable Content**: Every section should enable better decision-making`,
    `- **Professional Polish**: Error-free, well-structured, publication-ready`,
    '',
    `## 📊 SEO & DISCOVERABILITY`,
    keywords.length > 0 ? 
    `**Strategic Keywords**: ${keywords.slice(0, 5).join(', ')}` : 
    `**Keyword Strategy**: Professional terminology and industry-specific language`,
    `- **Authority Signals**: Use terms that establish expertise and credibility`,
    `- **Business Context**: Include commercial and strategic terminology`,
    `- **Professional Search**: Optimize for how business users search for solutions`,
    '',
    `## 🚀 EXCELLENCE REQUIREMENTS`,
    `This article must represent the pinnacle of professional content in ${categoryName}.`,
    `**Success Criteria**:`,
    `- Would a ${targetAudience} forward this to their team?`,
    `- Does it provide genuine competitive intelligence?`,
    `- Could someone make a business decision based on this analysis?`,
    `- Does it demonstrate thought leadership worthy of industry recognition?`,
    '',
    `**Professional Grade Checklist**:`,
    `- [ ] Industry expertise clearly demonstrated`,
    `- [ ] Strategic implications thoroughly analyzed`,
    `- [ ] Actionable recommendations provided`,
    `- [ ] Professional writing standard maintained`,
    `- [ ] Business value proposition clear`,
    '',
    `**Write the complete professional-grade article in ${languageName}.**`,
    `**Target the highest standards of business journalism and thought leadership.**`
  ].filter(Boolean).join('\n');
  
  return professionalPrompt;
}

// Utility functions
function getYearMonth(d = new Date()) {
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

function todayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

async function calculateTokenBudget() {
  const { year, month } = getYearMonth();
  const usedTokens = await getMonthlyTokenUsage(year, month);
  const monthlyLimit = config.generation.monthlyTokenCap;
  const remainingTokens = Math.max(0, monthlyLimit - usedTokens);

  // Fixed daily budget: monthly/30 regardless of remaining days
  const fixedDailyBudget = Math.floor(monthlyLimit / 30);

  const now = new Date();
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const currentDay = now.getUTCDate();
  const daysRemaining = Math.max(1, lastDayOfMonth - currentDay + 1);

  return {
    totalRemaining: remainingTokens,
    daysRemaining,
    dailyBudget: fixedDailyBudget,
    usedTokens,
    monthlyLimit,
    utilizationRate: (usedTokens / monthlyLimit) * 100
  };
}

async function remainingArticlesForToday() {
  const day = todayUTC();
  await upsertDailyJobTarget({ day, target: config.generation.dailyTarget });
  const job = await getJobForDay(day);
  const generated = job?.num_articles_generated || 0;
  return Math.max(0, config.generation.dailyTarget - generated);
}

function calculateOptimalDistribution(totalArticles, tokenBudget) {
  const distribution = { byLanguage: {}, byCategory: {}, byContentType: {}, totalEstimatedTokens: 0 };
  
  // Language distribution with professional focus
  Object.entries(PROFITABILITY_STRATEGY.LANGUAGE_DISTRIBUTION).forEach(([lang, config]) => {
    const articleCount = Math.floor((totalArticles * config.percentage) / 100);
    distribution.byLanguage[lang] = articleCount;
  });
  
  // Category distribution with professional focus
  Object.entries(PROFITABILITY_STRATEGY.CATEGORY_DISTRIBUTION).forEach(([category, config]) => {
    const articleCount = Math.floor((totalArticles * config.percentage) / 100);
    distribution.byCategory[category] = articleCount;
  });
  
  // Content type distribution with professional focus
  Object.entries(ENHANCED_CONTENT_STRATEGIES).forEach(([contentType, config]) => {
    const articleCount = Math.floor((totalArticles * config.weight) / 100);
    distribution.byContentType[contentType] = articleCount;
    distribution.totalEstimatedTokens += articleCount * config.avgTokens;
  });
  
  // Budget-based scaling
  if (distribution.totalEstimatedTokens > tokenBudget.dailyBudget) {
    const scalingFactor = tokenBudget.dailyBudget / distribution.totalEstimatedTokens;
    Object.keys(distribution.byLanguage).forEach(lang => {
      distribution.byLanguage[lang] = Math.floor(distribution.byLanguage[lang] * scalingFactor);
    });
    Object.keys(distribution.byCategory).forEach(category => {
      distribution.byCategory[category] = Math.floor(distribution.byCategory[category] * scalingFactor);
    });
  }
  
  return distribution;
}

// Enhanced professional target selection
async function selectProfessionalTargetsWithAI(plannedDistribution) {
  const targets = [];
  const categories = await listCategories();
  
  logger.info('Starting AI-powered professional content target selection');
  
  const languageEntries = Object.entries(plannedDistribution.byLanguage)
    .filter(([_, count]) => count > 0)
    .sort(([, a], [, b]) => b - a);
  
  // Discover trends for priority languages
  const aiTrendsByLanguage = {};
  
  for (const [languageCode, targetCount] of languageEntries) {
    if (targetCount === 0) continue;
    
    if (!appConfig.features?.enableTrendDiscovery) {
      aiTrendsByLanguage[languageCode] = [];
      continue;
    }
    
    logger.info({ languageCode, targetCount }, 'Discovering professional trends for language');
    try {
      const langConfig = PROFITABILITY_STRATEGY.LANGUAGE_DISTRIBUTION[languageCode];
      const aiTrends = await getTrendsWithResilience({ 
        languageCode, 
        maxPerCategory: 3, 
        categories: langConfig.categories 
      });
      aiTrendsByLanguage[languageCode] = aiTrends;
      logger.info({ languageCode, aiTrendsCount: aiTrends.length }, 'Professional trends discovered successfully');
    } catch {
      aiTrendsByLanguage[languageCode] = [];
    }
  }
  
  // Generate professional targets
  for (const [languageCode, targetCount] of languageEntries) {
    const langConfig = PROFITABILITY_STRATEGY.LANGUAGE_DISTRIBUTION[languageCode];
    const aiTrends = aiTrendsByLanguage[languageCode] || [];
    
    for (let i = 0; i < targetCount; i++) {
      const availableCategories = langConfig.categories;
      const categorySlug = availableCategories[i % availableCategories.length];
      const category = categories.find(c => c.slug === categorySlug);
      
      if (!category) continue;
      
      const categoryConfig = PROFITABILITY_STRATEGY.CATEGORY_DISTRIBUTION[categorySlug];
      const contentTypes = langConfig.contentTypes || ['SEO_ARTICLE'];
      const contentType = contentTypes[i % contentTypes.length];
      const strategy = ENHANCED_CONTENT_STRATEGIES[contentType];
      
      // Enhanced topic generation for professional content
      let topic, trendBased = false, newsAngle = null;
      
      if (aiTrends.length > 0 && Math.random() < 0.7) {
        // Use AI-discovered trends for professional analysis
        const trend = aiTrends[Math.floor(Math.random() * aiTrends.length)];
        topic = `Professional Analysis: ${trend.topic}`;
        trendBased = true;
        newsAngle = trend.topic;
      } else {
        // Generate professional topics based on category focus
        const professionalTopics = {
          'technology': [
            'Strategic implications of enterprise AI adoption',
            'Cybersecurity risk management for executives',
            'Digital transformation ROI optimization',
            'Technology investment decision frameworks'
          ],
          'finance': [
            'Market volatility impact on corporate strategy',
            'Investment risk assessment methodologies', 
            'Financial planning in uncertain economies',
            'Corporate treasury management best practices'
          ],
          'business': [
            'Leadership effectiveness in remote environments',
            'Operational excellence through process optimization',
            'Strategic decision-making under uncertainty',
            'Organizational change management frameworks'
          ],
          'health': [
            'Healthcare industry transformation strategies',
            'Medical technology adoption frameworks',
            'Healthcare cost optimization approaches',
            'Regulatory compliance in healthcare operations'
          ]
        };
        
        const categoryTopics = professionalTopics[categorySlug] || professionalTopics.technology;
        const selectedTopic = categoryTopics[Math.floor(Math.random() * categoryTopics.length)];
        topic = selectedTopic;
      }
      
      const priority = langConfig.priority + (categoryConfig.priority * 0.1);
      const complexity = categoryConfig.professionalLevel === 'high' ? 'high' : 
                        categoryConfig.professionalLevel === 'medium' ? 'medium' : 'low';
      
      targets.push({
        languageCode,
        categoryId: category.id,
        categoryName: category.name,
        categorySlug,
        topic,
        contentType,
        complexity,
        targetAudience: langConfig.professionalFocus,
        keywords: [],
        priority,
        estimatedTokens: strategy.avgTokens,
        profitabilityScore: langConfig.avgRPM * (6 - categoryConfig.priority),
        trendBased,
        aiPowered: trendBased,
        useWebSearch: strategy.requiresWebSearch || trendBased,
        professionalGrade: strategy.professionalGrade,
        newsAngle,
        qualityBenchmark: strategy.qualityBenchmark,
        minWords: strategy.minWords,
        maxWords: strategy.maxWords
      });
    }
  }
  
  // Sort by profitability and professional grade
  targets.sort((a, b) => {
    if (a.professionalGrade !== b.professionalGrade) {
      return b.professionalGrade - a.professionalGrade;
    }
    return b.profitabilityScore - a.profitabilityScore;
  });
  
  logger.info({
    totalTargets: targets.length,
    professionalGradeCount: targets.filter(t => t.professionalGrade).length,
    aiPoweredCount: targets.filter(t => t.aiPowered).length,
    avgProfitabilityScore: targets.reduce((sum, t) => sum + t.profitabilityScore, 0) / targets.length,
    contentTypeDistribution: targets.reduce((acc, t) => {
      acc[t.contentType] = (acc[t.contentType] || 0) + 1;
      return acc;
    }, {}),
    languageDistribution: Object.fromEntries(languageEntries.filter(([_, count]) => count > 0))
  }, 'Professional content targets selection completed');
  
  return targets;
}

// Enhanced article generation with professional standards
async function generateOne(target, monthlyTokensUsed = 0) {
  const startTime = Date.now();
  
  logger.info({
    language: target.languageCode,
    category: target.categorySlug,
    contentType: target.contentType,
    topic: target.topic.slice(0, 50),
    professionalGrade: target.professionalGrade,
    qualityBenchmark: target.qualityBenchmark,
    profitabilityScore: target.profitabilityScore,
    aiPowered: target.aiPowered,
    useWebSearch: target.useWebSearch
  }, 'Starting professional article generation');

  try {
    const baseEstimate = target.estimatedTokens;
    const estimatedTokensForArticle = await getAdjustedEstimate(target.contentType, target.languageCode, baseEstimate);

    const permission = await canRunOperation(estimatedTokensForArticle);
    if (!permission.allowed) {
      logger.warn({ reason: permission.reason, estimatedTokensForArticle }, 'Skipping article due to budget constraints');
      return { 
        article: null, 
        tokens: 0, 
        generationTime: Date.now() - startTime, 
        estimatedCost: 0, 
        profitabilityScore: 0,
        professionalGrade: target.professionalGrade
      };
    }

    // Use enhanced professional prompt
    const prompt = buildEnhancedProfessionalPrompt({
      topic: target.topic,
      languageCode: target.languageCode,
      categoryName: target.categoryName,
      contentType: target.contentType,
      targetAudience: target.targetAudience,
      keywords: target.keywords,
      maxWords: target.maxWords,
      geoScope: 'global',
      variationHint: `Professional ${target.contentType} targeting ${target.qualityBenchmark} standards`,
      newsAngle: target.newsAngle,
      professionalGrade: target.professionalGrade
    });

    const result = await generateArticleViaAPI({
      topic: target.topic,
      languageCode: target.languageCode,
      categoryName: target.categoryName,
      categorySlug: target.categorySlug,
      contentType: target.contentType,
      targetAudience: target.targetAudience,
      keywords: target.keywords,
      includeWebSearch: target.useWebSearch,
      generateImage: false,
      maxWords: target.maxWords,
      complexity: target.complexity,
      monthlyTokensUsed,
      customPrompt: prompt // Pass the enhanced prompt
    });

    const { title, content, summary, metaDescription, imageUrl, tokensIn, tokensOut, model, estimatedCost } = result;

    const slug = createSlug(title, target.languageCode);
    const meta = buildMeta({ 
      title, 
      summary: summary || metaDescription, 
      imageUrl: null,
      canonicalUrl: null 
    });
    
    if (metaDescription) {
      meta.metaDescription = metaDescription;
      meta.ogDescription = metaDescription;
      meta.twitterDescription = metaDescription;
    }
    
    const readingTimeMinutes = estimateReadingTimeMinutes(content);

    const article = await createArticle({
      title,
      slug,
      content,
      summary: summary || content.slice(0, 300) + '...',
      languageCode: target.languageCode,
      categoryId: target.categoryId,
      imageUrl: null,
      meta,
      readingTimeMinutes,
      sourceUrl: null,
      aiModel: model,
      aiPrompt: `${target.contentType}:${target.professionalGrade ? 'PROFESSIONAL_GRADE' : 'STANDARD'}:${target.qualityBenchmark}`,
      aiTokensInput: tokensIn,
      aiTokensOutput: tokensOut,
    });

    if (article) {
      try {
        await upsertDailyJobTarget({ day: todayUTC(), target: config.generation.dailyTarget });
        await incrementJobProgress({ day: todayUTC(), count: 1 });
      } catch (err) {
        logger.warn({ err }, 'Failed to persist generation progress');
      }

      await recordTokenUsage({
        day: todayUTC(),
        tokensInput: tokensIn,
        tokensOutput: tokensOut,
      });
      
      const generationTime = Date.now() - startTime;
      
      logger.info({
        articleId: article.id,
        title: title.slice(0, 50),
        model,
        tokensIn,
        tokensOut,
        estimatedCost,
        contentLength: content.length,
        generationTimeMs: generationTime,
        language: target.languageCode,
        category: target.categorySlug,
        contentType: target.contentType,
        professionalGrade: target.professionalGrade,
        qualityBenchmark: target.qualityBenchmark,
        profitabilityScore: target.profitabilityScore,
        aiPowered: target.aiPowered,
        webSearchUsed: target.useWebSearch
      }, 'Professional article generated successfully');
    }

    const ret = { 
      article, 
      tokens: (tokensIn || 0) + (tokensOut || 0),
      generationTime: Date.now() - startTime,
      estimatedCost,
      profitabilityScore: target.profitabilityScore,
      professionalGrade: target.professionalGrade,
      qualityBenchmark: target.qualityBenchmark,
      contentType: target.contentType
    };
    
    try { 
      await updateEstimate(target.contentType, target.languageCode, estimatedTokensForArticle, ret.tokens); 
    } catch {}
    
    return ret;

  } catch (err) {
    const generationTime = Date.now() - startTime;
    
    logger.error({ 
      err: err.message,
      language: target.languageCode, 
      topic: target.topic.slice(0, 50),
      contentType: target.contentType,
      professionalGrade: target.professionalGrade,
      generationTimeMs: generationTime,
      profitabilityScore: target.profitabilityScore,
      aiPowered: target.aiPowered
    }, 'Professional article generation failed');
    
    return { 
      article: null, 
      tokens: 0, 
      generationTime,
      estimatedCost: 0,
      profitabilityScore: 0,
      professionalGrade: target.professionalGrade,
      contentType: target.contentType
    };
  }
}

// Enhanced scheduler with professional content focus
export function scheduleArticleGeneration() {
  upsertDailyJobTarget({ 
    day: todayUTC(), 
    target: config.generation.dailyTarget 
  }).catch(err => {
    logger.error({ err }, 'Failed to create daily job target');
  });

  logger.info({
    schedule: config.generation.schedule,
    dailyTarget: config.generation.dailyTarget,
    monthlyTokenCap: config.generation.monthlyTokenCap,
    maxBatchPerRun: config.generation.maxBatchPerRun,
    professionalContent: 'enabled',
    aiPoweredTrends: 'enabled',
    webSearchIntegration: 'enabled'
  }, 'Professional article generation scheduler started');
  
  startCacheMaintenance();

  const task = cron.schedule(config.generation.schedule, async () => {
    const runStartTime = Date.now();
    
    try {
      logger.info('Starting professional article generation run');
      await initQueue();
      
      const { skipped } = await withLock('generation-runner', async () => {
        const tokenBudget = await calculateTokenBudget();
        const remainingArticles = await remainingArticlesForToday();
        
        logger.info({ tokenBudget, remainingArticles }, 'Budget and targets calculated');
        
        if (remainingArticles <= 0) {
          logger.info('Daily target reached; skipping run');
          return;
        }
        
        if (tokenBudget.totalRemaining <= 0) {
          logger.warn({ 
            monthlyTokenCap: config.generation.monthlyTokenCap,
            utilizationRate: tokenBudget.utilizationRate
          }, 'Monthly token cap reached; skipping');
          return;
        }
        
        const maxByTokens = Math.floor(tokenBudget.dailyBudget / 2800); // Higher token estimate for professional content
        if (maxByTokens <= 0) {
          logger.info({ dailyBudget: tokenBudget.dailyBudget }, 'Insufficient daily token budget; skipping run');
          return;
        }
        
        const plannedBatch = Math.min(config.generation.maxBatchPerRun, remainingArticles, maxByTokens);

        const snapshot = await getQueueSnapshot();
        const forToday = await isForToday();
        const pending = Math.max(0, snapshot.items.length - snapshot.cursor);
        
        if (!forToday || pending === 0) {
          const distribution = calculateOptimalDistribution(plannedBatch, tokenBudget);
          const targets = await selectProfessionalTargetsWithAI(distribution);
          if (targets.length === 0) {
            logger.warn('No professional targets generated');
            return;
          }
          await resetQueue(targets.slice(0, plannedBatch));
        } else {
          logger.info({ pending }, 'Resuming from persisted queue');
        }

        let generated = 0;
        let failed = 0;
        let tokensSpent = 0;
        let totalProfitabilityScore = 0;
        
        const generationStats = {
          byLanguage: {},
          byCategory: {},
          byContentType: {},
          professionalGradeCount: 0,
          aiPoweredCount: 0,
          webSearchUsedCount: 0,
          totalGenerationTime: 0,
          avgCostPerArticle: 0,
          qualityBenchmarks: {}
        };

        while (generated + failed < plannedBatch) {
          const peek = await peekNextItem();
          if (peek.done) break;

          const currentUsage = await getMonthlyTokenUsage(getYearMonth().year, getYearMonth().month);
          if (currentUsage + tokensSpent >= config.generation.monthlyTokenCap) {
            logger.warn('Monthly token budget exhausted during batch, stopping');
            break;
          }

          const target = peek.value;
          const result = await generateOne(target, currentUsage + tokensSpent);
          generationStats.totalGenerationTime += result.generationTime;

          if (result.article) {
            generated += 1;
            tokensSpent += result.tokens;
            totalProfitabilityScore += result.profitabilityScore;
            
            // Enhanced statistics tracking
            generationStats.byLanguage[target.languageCode] = (generationStats.byLanguage[target.languageCode] || 0) + 1;
            generationStats.byCategory[target.categorySlug] = (generationStats.byCategory[target.categorySlug] || 0) + 1;
            generationStats.byContentType[target.contentType] = (generationStats.byContentType[target.contentType] || 0) + 1;
            
            if (target.professionalGrade) generationStats.professionalGradeCount += 1;
            if (target.aiPowered) generationStats.aiPoweredCount += 1;
            if (target.useWebSearch) generationStats.webSearchUsedCount += 1;
            
            generationStats.qualityBenchmarks[target.qualityBenchmark] = (generationStats.qualityBenchmarks[target.qualityBenchmark] || 0) + 1;
            generationStats.avgCostPerArticle += result.estimatedCost;
            
            await commitIndex(peek.index);
          } else {
            failed += 1;
            await commitIndex(peek.index);
          }

          await new Promise(resolve => setTimeout(resolve, 1500));
        }

        const runTime = Date.now() - runStartTime;
        const avgProfitabilityScore = generated > 0 ? totalProfitabilityScore / generated : 0;
        generationStats.avgCostPerArticle = generated > 0 ? generationStats.avgCostPerArticle / generated : 0;

        logger.info({
          generated,
          failed,
          tokensSpent,
          plannedBatch,
          runTimeMs: runTime,
          averageGenerationTimeMs: generationStats.totalGenerationTime / Math.max(1, generated + failed),
          avgProfitabilityScore,
          professionalGradeRate: generated > 0 ? (generationStats.professionalGradeCount / generated) * 100 : 0,
          aiPoweredRate: generated > 0 ? (generationStats.aiPoweredCount / generated) * 100 : 0,
          webSearchRate: generated > 0 ? (generationStats.webSearchUsedCount / generated) * 100 : 0,
          stats: generationStats,
          updatedTokenBudget: {
            remaining: tokenBudget.totalRemaining - tokensSpent,
            utilizationRate: ((tokenBudget.usedTokens + tokensSpent) / config.generation.monthlyTokenCap) * 100
          },
          approach: 'professional-ai-powered-enhanced'
        }, 'Professional article generation run completed');
      });
      
      if (skipped) {
        logger.warn('Another generation run is in progress; skipping this tick');
      }

    } catch (err) {
      const runTime = Date.now() - runStartTime;
      logger.error({ 
        err: err.message,
        runTimeMs: runTime
      }, 'Professional article generation run failed');
    }
  });

  return task;
}

// Master + Translation workflow with professional standards
export function scheduleMasterTranslationGeneration() {
  logger.info('Starting Master+Translation generation scheduler with professional standards');

  const task = cron.schedule(config.generation.schedule, async () => {
    const runStartTime = Date.now();
    try {
      logger.info('Professional Master+Translation run started');

      const categories = await listCategories();
      const topCategorySlugs = config.topCategories || [];
      const targetCategories = categories.filter(c => topCategorySlugs.includes(c.slug));

      const allLanguages = config.languages || ['en'];
      const targetLanguages = allLanguages.filter(l => l !== 'en');

      // Phase 1: Generate professional master articles in English
      const masterResults = [];
      for (const category of targetCategories) {
        const permission = await canRunOperation(3200); // Higher token budget for professional content
        if (!permission.allowed) {
          logger.warn({ category: category.slug }, 'Skipping master due to budget constraints');
          continue;
        }

        // Determine content type based on category priority
        const categoryConfig = PROFITABILITY_STRATEGY.CATEGORY_DISTRIBUTION[category.slug];
        const contentType = categoryConfig?.preferredTypes?.[0] || 'THOUGHT_LEADERSHIP';
        const strategy = ENHANCED_CONTENT_STRATEGIES[contentType];

        // Use AI to pick a professional topic
        let masterTopic = `Strategic ${category.slug} analysis for business leaders`;
        let newsAngle = null;
        
        try {
          const aiTrends = await discoverTrendingTopicsWithAI({ 
            languageCode: 'en', 
            maxPerCategory: 3, 
            categories: [category.slug] 
          });
          const relevant = aiTrends.filter(t => t.category === category.slug);
          if (relevant.length > 0) {
            masterTopic = `Professional Analysis: ${relevant[0].topic}`;
            newsAngle = relevant[0].topic;
          }
        } catch (err) {
          logger.warn({ err, category: category.slug }, 'AI trends fetch failed for master topic, using fallback');
        }

        const prompt = buildEnhancedProfessionalPrompt({
          topic: masterTopic,
          languageCode: 'en',
          categoryName: category.name,
          contentType,
          targetAudience: 'executives and senior decision makers',
          keywords: [],
          maxWords: strategy.maxWords,
          geoScope: 'global',
          variationHint: `Master article for translation - professional grade content`,
          newsAngle,
          professionalGrade: true
        });

        const result = await generateArticleViaAPI({
          topic: masterTopic,
          languageCode: 'en',
          categoryName: category.name,
          categorySlug: category.slug,
          contentType,
          targetAudience: 'executives and senior decision makers',
          keywords: [],
          includeWebSearch: strategy.requiresWebSearch,
          generateImage: false,
          maxWords: strategy.maxWords,
          complexity: 'high',
          customPrompt: prompt
        });

        const masterMeta = buildMeta({
          title: result.title,
          summary: result.summary || result.metaDescription,
          imageUrl: null,
          canonicalUrl: null
        });

        if (result.metaDescription) {
          masterMeta.metaDescription = result.metaDescription;
          masterMeta.ogDescription = result.metaDescription;
          masterMeta.twitterDescription = result.metaDescription;
        }

        const masterSlug = createSlug(result.title, 'en');
        const masterReadingTime = estimateReadingTimeMinutes(result.content);
        
        const masterArticle = await createArticle({
          title: result.title,
          slug: masterSlug,
          content: result.content,
          summary: result.summary || result.content.slice(0, 300) + '...',
          languageCode: 'en',
          categoryId: category.id,
          imageUrl: null,
          meta: masterMeta,
          readingTimeMinutes: masterReadingTime,
          sourceUrl: null,
          aiModel: result.model,
          aiPrompt: `MASTER_${contentType}:PROFESSIONAL_GRADE:${category.slug}`,
          aiTokensInput: result.tokensIn,
          aiTokensOutput: result.tokensOut,
        });

        if (masterArticle) {
          try {
            await upsertDailyJobTarget({ day: todayUTC(), target: config.generation.dailyTarget });
            await incrementJobProgress({ day: todayUTC(), count: 1 });
          } catch (err) {
            logger.warn({ err }, 'Failed to persist master generation progress');
          }
          await recordTokenUsage({ 
            day: todayUTC(), 
            tokensInput: result.tokensIn, 
            tokensOutput: result.tokensOut 
          });
        }

        masterResults.push({ category, result, article: masterArticle, contentType });
        await new Promise(r => setTimeout(r, 2000));
      }

      // Phase 2: Professional translations
      for (const master of masterResults) {
        if (!master.article) continue;
        const { category, result, contentType } = master;
        
        for (const lang of targetLanguages) {
          const permission = await canRunOperation(1800);
          if (!permission.allowed) {
            logger.warn({ lang, category: category.slug }, 'Skipping translation due to budget constraints');
            continue;
          }

          const t = await translateArticleViaAPI({
            masterTitle: result.title,
            masterContent: result.content,
            targetLanguage: lang,
            maxWords: ENHANCED_CONTENT_STRATEGIES[contentType]?.maxWords || 1500,
            professionalGrade: true
          });

          const meta = buildMeta({
            title: t.title,
            summary: t.summary || t.metaDescription,
            imageUrl: null,
            canonicalUrl: null
          });
          
          if (t.metaDescription) {
            meta.metaDescription = t.metaDescription;
            meta.ogDescription = t.metaDescription;
            meta.twitterDescription = t.metaDescription;
          }

          const slug = createSlug(t.title, lang);
          const readingTimeMinutes = estimateReadingTimeMinutes(t.content);
          
          const article = await createArticle({
            title: t.title,
            slug,
            content: t.content,
            summary: t.summary || t.content.slice(0, 300) + '...',
            languageCode: lang,
            categoryId: category.id,
            imageUrl: null,
            meta,
            readingTimeMinutes,
            sourceUrl: null,
            aiModel: t.model,
            aiPrompt: `TRANSLATION_${contentType}:PROFESSIONAL_GRADE:${master.article.slug}`,
            aiTokensInput: t.tokensIn,
            aiTokensOutput: t.tokensOut,
          });

          if (article) {
            try {
              await upsertDailyJobTarget({ day: todayUTC(), target: config.generation.dailyTarget });
              await incrementJobProgress({ day: todayUTC(), count: 1 });
            } catch (err) {
              logger.warn({ err }, 'Failed to persist translation progress');
            }
            await recordTokenUsage({ 
              day: todayUTC(), 
              tokensInput: t.tokensIn, 
              tokensOutput: t.tokensOut 
            });
          }

          await new Promise(r => setTimeout(r, 1000));
        }
      }

      const runTime = Date.now() - runStartTime;
      logger.info({ 
        masters: masterResults.length, 
        runTimeMs: runTime,
        approach: 'professional-master-translation'
      }, 'Professional Master+Translation run completed');

    } catch (err) {
      const runTime = Date.now() - runStartTime;
      logger.error({ err: err.message, runTimeMs: runTime }, 'Professional Master+Translation run failed');
    }
  });

  return task;
}

// Enhanced manual generation with professional focus
export async function triggerProfitableGeneration(options = {}) {
  const {
    batchSize = 5,
    forceHighValue = false,
    forceProfessionalGrade = false,
    specificLanguages = null,
    specificCategories = null,
    specificContentTypes = null,
    forceAITrends = true
  } = options;
  
  logger.info({ 
    options: { ...options, approach: 'professional-enhanced' } 
  }, 'Manual professional generation triggered');
  
  try {
    const tokenBudget = await calculateTokenBudget();
    
    if (tokenBudget.totalRemaining <= 0) {
      throw new Error('Monthly token budget exhausted');
    }
    
    let distribution;
    if (specificLanguages || specificCategories) {
      distribution = { byLanguage: {}, byCategory: {}, byContentType: {} };
      
      if (specificLanguages) {
        specificLanguages.forEach(lang => {
          distribution.byLanguage[lang] = Math.ceil(batchSize / specificLanguages.length);
        });
      }
      
      if (specificCategories) {
        specificCategories.forEach(cat => {
          distribution.byCategory[cat] = Math.ceil(batchSize / specificCategories.length);
        });
      }
    } else {
      distribution = calculateOptimalDistribution(batchSize, tokenBudget);
    }
    
    const targets = await selectProfessionalTargetsWithAI(distribution);
    
    // Apply manual overrides
    if (forceHighValue || forceProfessionalGrade) {
      targets.forEach(target => {
        if (forceHighValue) {
          target.contentType = 'THOUGHT_LEADERSHIP';
          target.complexity = 'high';
          target.estimatedTokens = 3200;
          target.professionalGrade = true;
        }
        if (forceProfessionalGrade) {
          target.professionalGrade = true;
        }
      });
    }
    
    if (specificContentTypes) {
      targets.forEach((target, index) => {
        const contentType = specificContentTypes[index % specificContentTypes.length];
        const strategy = ENHANCED_CONTENT_STRATEGIES[contentType];
        if (strategy) {
          target.contentType = contentType;
          target.estimatedTokens = strategy.avgTokens;
          target.professionalGrade = strategy.professionalGrade;
          target.qualityBenchmark = strategy.qualityBenchmark;
          target.minWords = strategy.minWords;
          target.maxWords = strategy.maxWords;
        }
      });
    }
    
    if (forceAITrends) {
      targets.forEach(target => {
        target.useWebSearch = true;
      });
    }
    
    const results = [];
    for (const target of targets.slice(0, batchSize)) {
      const result = await generateOne(target, tokenBudget.usedTokens);
      results.push(result);
    }
    
    const successful = results.filter(r => r.article).length;
    const totalTokens = results.reduce((sum, r) => sum + r.tokens, 0);
    const avgProfitability = results.reduce((sum, r) => sum + r.profitabilityScore, 0) / results.length;
    const professionalGradeCount = results.filter(r => r.professionalGrade).length;
    const aiPoweredCount = targets.filter(t => t.aiPowered).length;
    
    logger.info({
      requested: batchSize,
      successful,
      totalTokens,
      avgProfitability,
      professionalGradeCount,
      aiPoweredCount,
      approach: 'professional-manual-enhanced',
      qualityDistribution: results.reduce((acc, r) => {
        if (r.qualityBenchmark) {
          acc[r.qualityBenchmark] = (acc[r.qualityBenchmark] || 0) + 1;
        }
        return acc;
      }, {}),
      results: results.map(r => ({
        success: !!r.article,
        title: r.article?.title?.slice(0, 50),
        language: r.article?.language_code,
        tokens: r.tokens,
        profitabilityScore: r.profitabilityScore,
        professionalGrade: r.professionalGrade,
        contentType: r.contentType,
        qualityBenchmark: r.qualityBenchmark
      }))
    }, 'Manual professional generation completed');
    
    return results;
    
  } catch (err) {
    logger.error({ err, options }, 'Manual professional generation failed');
    throw err;
  }
}

// News-based article generation
export async function generateNewsBasedArticle({
  newsStory,
  languageCode,
  categoryName,
  categorySlug = null,
  targetAudience = 'professionals in the field',
  maxWords = 1500
}) {
  if (!config.ai.apiKey) {
    return {
      title: `Breaking: ${newsStory.headline}`,
      content: `Professional analysis of ${newsStory.headline} coming soon...`,
      summary: `In-depth analysis of recent ${categoryName} development`,
      metaDescription: `Expert breakdown of ${newsStory.headline.slice(0, 100)}`,
      imageUrl: null,
      tokensIn: 200,
      tokensOut: 300,
      model: 'mock-news-analysis'
    };
  }

  try {
    const prompt = buildEnhancedProfessionalPrompt({
      topic: `Professional Analysis: ${newsStory.headline}`,
      languageCode,
      categoryName,
      contentType: 'NEWS_ANALYSIS',
      targetAudience,
      keywords: newsStory.keywords || [],
      maxWords,
      geoScope: 'global',
      variationHint: `Focus on professional implications and actionable insights`,
      newsAngle: newsStory.summary || newsStory.headline,
      professionalGrade: true
    });

    logger.info({
      newsHeadline: newsStory.headline?.slice(0, 50),
      languageCode,
      categoryName,
      promptLength: prompt.length
    }, 'Generating news-based professional article');

    const result = await generateArticleViaAPI({
      topic: `${newsStory.headline} - Professional Analysis`,
      languageCode,
      categoryName,
      categorySlug,
      contentType: 'NEWS_ANALYSIS',
      targetAudience,
      keywords: newsStory.keywords || [],
      includeWebSearch: true,
      maxWords,
      complexity: 'high',
      customPrompt: prompt
    });

    return result;

  } catch (err) {
    logger.error({ err, newsStory: newsStory.headline }, 'News-based article generation failed');
    throw err;
  }
}

export { 
  PROFITABILITY_STRATEGY, 
  ENHANCED_CONTENT_STRATEGIES,
  PROFESSIONAL_WRITING_STYLES,
  calculateTokenBudget,
  calculateOptimalDistribution,
  selectProfessionalTargetsWithAI,
  buildEnhancedProfessionalPrompt,
  generateNewsBasedArticle
};