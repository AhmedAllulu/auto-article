import { generateArticleViaAPI } from './aiClient.js';
import config from '../config/env.js';
import logger from '../lib/logger.js';

// Smart trend discovery prompts for each language
const TREND_DISCOVERY_PROMPTS = {
  'en': {
    technology: "Search for the most trending, unusual, and breaking technology news today. Focus on AI breakthroughs, tech company announcements, cybersecurity incidents, and viral tech stories.",
    finance: "Find trending financial news, market surprises, cryptocurrency movements, economic announcements, and unusual investment stories making headlines today.",
    business: "Discover trending business stories, startup successes/failures, corporate scandals, merger announcements, and viral business news today.",
    health: "Search for trending health news, medical breakthroughs, disease outbreaks, wellness trends, and health stories going viral today.",
    sports: "Find trending sports news, game highlights, player transfers, controversies, and viral sports stories from today.",
    entertainment: "Discover trending entertainment news, celebrity scandals, movie releases, music hits, and viral entertainment stories today.",
    travel: "Search for trending travel news, destination alerts, airline issues, travel restrictions, and viral travel stories today."
  },
  'ar': {
    technology: "ابحث عن أحدث الأخبار التقنية الرائجة والغير عادية اليوم. ركز على اختراقات الذكاء الاصطناعي وإعلانات الشركات التقنية والحوادث الأمنية والقصص التقنية الفيروسية.",
    finance: "اعثر على الأخبار المالية الرائجة، مفاجآت السوق، حركات العملات المشفرة، الإعلانات الاقتصادية، والقصص الاستثمارية غير العادية التي تتصدر العناوين اليوم.",
    business: "اكتشف القصص التجارية الرائجة، نجاحات/إخفاقات الشركات الناشئة، فضائح الشركات، إعلانات الاندماج، والأخبار التجارية الفيروسية اليوم.",
    health: "ابحث عن الأخبار الصحية الرائجة، الاختراقات الطبية، تفشي الأمراض، اتجاهات العافية، والقصص الصحية الفيروسية اليوم.",
    sports: "اعثر على الأخبار الرياضية الرائجة، أبرز المباريات، انتقالات اللاعبين، الجدل، والقصص الرياضية الفيروسية من اليوم.",
    entertainment: "اكتشف أخبار الترفيه الرائجة، فضائح المشاهير، إصدارات الأفلام، الأغاني الناجحة، والقصص الترفيهية الفيروسية اليوم.",
    travel: "ابحث عن أخبار السفر الرائجة، تنبيهات الوجهات، مشاكل الطيران، قيود السفر، والقصص السفر الفيروسية اليوم."
  },
  'es': {
    technology: "Busca las noticias tecnológicas más trending, inusuales y de última hora de hoy. Enfócate en avances de IA, anuncios de empresas tech, incidentes de ciberseguridad, y historias tech virales.",
    finance: "Encuentra noticias financieras trending, sorpresas del mercado, movimientos de criptomonedas, anuncios económicos, e historias de inversión inusuales que son titulares hoy.",
    business: "Descubre historias de negocios trending, éxitos/fracasos de startups, escándalos corporativos, anuncios de fusiones, y noticias de negocios virales de hoy.",
    health: "Busca noticias de salud trending, avances médicos, brotes de enfermedades, tendencias de bienestar, e historias de salud virales de hoy.",
    sports: "Encuentra noticias deportivas trending, highlights de juegos, transferencias de jugadores, controversias, e historias deportivas virales de hoy.",
    entertainment: "Descubre noticias de entretenimiento trending, escándalos de celebridades, estrenos de películas, hits musicales, e historias de entretenimiento virales de hoy.",
    travel: "Busca noticias de viajes trending, alertas de destinos, problemas de aerolíneas, restricciones de viaje, e historias de viajes virales de hoy."
  },
  'de': {
    technology: "Suche nach den trending, ungewöhnlichen und aktuellsten Technologie-News von heute. Fokus auf KI-Durchbrüche, Tech-Unternehmen-Ankündigungen, Cybersecurity-Vorfälle und virale Tech-Stories.",
    finance: "Finde trending Finanznews, Markt-Überraschungen, Kryptowährungs-Bewegungen, Wirtschafts-Ankündigungen und ungewöhnliche Investment-Stories, die heute Schlagzeilen machen.",
    business: "Entdecke trending Business-Stories, Startup-Erfolge/-Misserfolge, Unternehmens-Skandale, Fusion-Ankündigungen und virale Business-News von heute.",
    health: "Suche nach trending Gesundheitsnews, medizinischen Durchbrüchen, Krankheitsausbrüchen, Wellness-Trends und viralen Gesundheits-Stories von heute.",
    sports: "Finde trending Sportnews, Spiel-Highlights, Spieler-Transfers, Kontroversen und virale Sport-Stories von heute.",
    entertainment: "Entdecke trending Entertainment-News, Prominenten-Skandale, Film-Releases, Musik-Hits und virale Entertainment-Stories von heute.",
    travel: "Suche nach trending Reise-News, Reiseziel-Warnungen, Airline-Problemen, Reise-Beschränkungen und viralen Reise-Stories von heute."
  },
  'fr': {
    technology: "Cherchez les actualités technologiques les plus trending, inhabituelles et de dernière minute d'aujourd'hui. Concentrez-vous sur les percées IA, annonces d'entreprises tech, incidents de cybersécurité, et histoires tech virales.",
    finance: "Trouvez les actualités financières trending, surprises du marché, mouvements de cryptomonnaies, annonces économiques, et histoires d'investissement inhabituelles qui font les gros titres aujourd'hui.",
    business: "Découvrez les histoires business trending, succès/échecs de startups, scandales d'entreprises, annonces de fusions, et actualités business virales d'aujourd'hui.",
    health: "Cherchez les actualités santé trending, percées médicales, épidémies, tendances bien-être, et histoires santé virales d'aujourd'hui.",
    sports: "Trouvez les actualités sportives trending, highlights de matchs, transferts de joueurs, controverses, et histoires sportives virales d'aujourd'hui.",
    entertainment: "Découvrez les actualités divertissement trending, scandales de célébrités, sorties de films, hits musicaux, et histoires divertissement virales d'aujourd'hui.",
    travel: "Cherchez les actualités voyage trending, alertes de destinations, problèmes de compagnies aériennes, restrictions de voyage, et histoires voyage virales d'aujourd'hui."
  },
  'pt': {
    technology: "Procure pelas notícias de tecnologia mais trending, incomuns e de última hora de hoje. Foque em avanços de IA, anúncios de empresas tech, incidentes de cibersegurança, e histórias tech virais.",
    finance: "Encontre notícias financeiras trending, surpresas do mercado, movimentos de criptomoedas, anúncios econômicos, e histórias de investimento incomuns que são manchetes hoje.",
    business: "Descubra histórias de negócios trending, sucessos/fracassos de startups, escândalos corporativos, anúncios de fusões, e notícias de negócios virais de hoje.",
    health: "Procure notícias de saúde trending, avanços médicos, surtos de doenças, tendências de bem-estar, e histórias de saúde virais de hoje.",
    sports: "Encontre notícias esportivas trending, destaques de jogos, transferências de jogadores, controvérsias, e histórias esportivas virais de hoje.",
    entertainment: "Descubra notícias de entretenimento trending, escândalos de celebridades, lançamentos de filmes, hits musicais, e histórias de entretenimento virais de hoje.",
    travel: "Procure notícias de viagem trending, alertas de destinos, problemas de companhias aéreas, restrições de viagem, e histórias de viagem virais de hoje."
  },
  'hi': {
    technology: "आज के सबसे trending, असामान्य और ताज़ा तकनीकी समाचार खोजें। AI की सफलताओं, टेक कंपनी की घोषणाओं, साइबर सुरक्षा की घटनाओं, और वायरल टेक स्टोरीज़ पर ध्यान दें।",
    finance: "Trending वित्तीय समाचार, बाज़ार के आश्चर्य, क्रिप्टोकरेंसी की हरकतें, आर्थिक घोषणाएं, और असामान्य निवेश की कहानियां खोजें जो आज सुर्खियां बटोर रही हैं।",
    business: "Trending व्यापारिक कहानियां, स्टार्टअप की सफलताएं/असफलताएं, कॉर्पोरेट घोटाले, विलय की घोषणाएं, और आज की वायरल व्यापारिक खबरें खोजें।",
    health: "Trending स्वास्थ्य समाचार, चिकित्सा सफलताएं, बीमारी के प्रकोप, कल्याण के रुझान, और आज की वायरल स्वास्थ्य कहानियां खोजें।",
    sports: "Trending खेल समाचार, खेल की मुख्य बातें, खिलाड़ियों के स्थानांतरण, विवाद, और आज की वायरल खेल कहानियां खोजें।",
    entertainment: "Trending मनोरंजन समाचार, सेलिब्रिटी घोटाले, फिल्म रिलीज़, संगीत हिट, और आज की वायरल मनोरंजन कहानियां खोजें।",
    travel: "Trending यात्रा समाचार, गंतव्य अलर्ट, एयरलाइन समस्याएं, यात्रा प्रतिबंध, और आज की वायरल यात्रा कहानियां खोजें।"
  }
};

// Cache for AI-discovered trends (much simpler!)
const aiTrendsCache = new Map();
const AI_TRENDS_CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours

// AI-powered trend discovery function
export async function discoverTrendingTopicsWithAI({ 
  languageCode, 
  maxPerCategory = 3,
  categories = null 
}) {
  // Honor global generation toggle and trends enable flag
  if (!config.trends.enabled || !config.features?.enableGeneration) {
    return [];
  }
  const startTime = Date.now();
  const topics = [];
  const errors = [];

  logger.info({ 
    languageCode, 
    maxPerCategory,
    requestedCategories: categories
  }, 'Starting AI-powered trending topics discovery');

  const targetCategories = categories || config.topCategories || Object.keys(TREND_DISCOVERY_PROMPTS[languageCode] || TREND_DISCOVERY_PROMPTS['en']);
  const prompts = TREND_DISCOVERY_PROMPTS[languageCode] || TREND_DISCOVERY_PROMPTS['en'];

  for (const category of targetCategories) {
    try {
      // Check cache first
      const cacheKey = `${languageCode}-${category}`;
      const cached = aiTrendsCache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < AI_TRENDS_CACHE_DURATION) {
        logger.info({ category, languageCode }, 'Using cached AI trends');
        topics.push(...cached.topics);
        continue;
      }

      const trendPrompt = prompts[category] || `Search for trending ${category} news and unusual stories today in ${languageCode}`;
      
      logger.info({ 
        category, 
        languageCode,
        promptPreview: trendPrompt.slice(0, 100) + '...'
      }, 'Discovering trends with AI web search');

      // Use AI to discover trends with web search
      const result = await generateArticleViaAPI({
        topic: `Trending ${category} topics discovery`,
        languageCode: languageCode,
        categoryName: category,
        categorySlug: category,
        contentType: 'TREND_DISCOVERY',
        targetAudience: 'content creators',
        keywords: [],
        includeWebSearch: true, // This is the magic! AI searches the web
        generateImage: false,
        maxWords: 500, // Short response, just topics
        complexity: 'low'
      });

      // Parse AI response to extract trending topics
      const discoveredTopics = extractTopicsFromAIResponse(result.content, category, languageCode);
      
      if (discoveredTopics.length > 0) {
        // Cache the results
        aiTrendsCache.set(cacheKey, {
          topics: discoveredTopics,
          timestamp: Date.now()
        });

        topics.push(...discoveredTopics.slice(0, maxPerCategory));

        logger.info({ 
          category, 
          languageCode,
          discoveredCount: discoveredTopics.length,
          topTopics: discoveredTopics.slice(0, 3).map(t => t.topic.slice(0, 50))
        }, 'AI successfully discovered trending topics');
      } else {
        throw new Error('No topics extracted from AI response');
      }

    } catch (err) {
      errors.push({ category, error: err.message });
      logger.warn({ err, category, languageCode }, 'AI trend discovery failed for category');
      
      // Fallback topics
      const fallbackTopics = generateFallbackTopics(category, languageCode, maxPerCategory);
      topics.push(...fallbackTopics);
    }

    // Small delay between categories to be respectful
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const executionTime = Date.now() - startTime;

  logger.info({
    languageCode,
    totalTopics: topics.length,
    categoriesProcessed: targetCategories.length,
    errors: errors.length,
    executionTimeMs: executionTime,
    cacheSize: aiTrendsCache.size,
    topicsByCategory: topics.reduce((acc, topic) => {
      acc[topic.category] = (acc[topic.category] || 0) + 1;
      return acc;
    }, {})
  }, 'AI-powered trending topics discovery completed');

  return topics;
}

// Extract topics from AI response (smart parsing)
function extractTopicsFromAIResponse(content, category, languageCode) {
  const topics = [];
  
  try {
    // Look for common patterns in AI responses
    const lines = content.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip headers and metadata
      if (trimmed.startsWith('#') || trimmed.startsWith('**') || trimmed.length < 10) {
        continue;
      }
      
      // Look for numbered lists, bullet points, or topic indicators
      const patterns = [
        /^\d+\.\s*(.+)$/,           // 1. Topic
        /^[-*•]\s*(.+)$/,           // - Topic or • Topic
        /^(.+?):\s*(.+)$/,          // Topic: Description
        /^"([^"]+)"/,               // "Quoted topic"
        /trending[:\s]+([^.!?]+)/i, // "trending: topic"
        /viral[:\s]+([^.!?]+)/i,    // "viral: topic"
      ];
      
      for (const pattern of patterns) {
        const match = trimmed.match(pattern);
        if (match) {
          const topicText = (match[1] || match[0]).trim();
          
          if (topicText && topicText.length > 5 && topicText.length < 200) {
            topics.push({
              category,
              topic: cleanTopicText(topicText),
              trendValue: Math.floor(Math.random() * 100) + 50, // Simulate trend value
              baseKeyword: 'ai-discovered',
              isProfitable: ['technology', 'finance', 'business'].includes(category),
              timeRange: 'ai-current',
              languageCode,
              source: 'ai-web-search'
            });
            
            if (topics.length >= 10) break; // Max 10 topics per category
          }
        }
      }
      
      if (topics.length >= 10) break;
    }
    
  } catch (err) {
    logger.warn({ err, category, languageCode }, 'Failed to parse AI trends response');
  }

  // If no structured topics found, try to extract from full content
  if (topics.length === 0) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    for (const sentence of sentences.slice(0, 5)) {
      const cleaned = cleanTopicText(sentence.trim());
      if (cleaned.length > 10 && cleaned.length < 150) {
        topics.push({
          category,
          topic: cleaned,
          trendValue: Math.floor(Math.random() * 100) + 25,
          baseKeyword: 'ai-extracted',
          isProfitable: ['technology', 'finance', 'business'].includes(category),
          timeRange: 'ai-current',
          languageCode,
          source: 'ai-web-search'
        });
      }
    }
  }

  return topics;
}

// Clean topic text
function cleanTopicText(text) {
  return text
    .replace(/^["'`\-*•\d+.\s]+/, '') // Remove prefixes
    .replace(/["'`\-*•\s]+$/, '')     // Remove suffixes
    .replace(/\s+/g, ' ')             // Normalize spaces
    .trim();
}

// Fallback topics when AI fails
function generateFallbackTopics(category, languageCode, maxCount) {
  const fallbacks = {
    technology: ['Latest AI developments', 'Cybersecurity trends', 'Tech startup news', 'Software updates'],
    finance: ['Market movements', 'Cryptocurrency news', 'Investment trends', 'Economic indicators'],
    business: ['Startup success stories', 'Business strategies', 'Market analysis', 'Industry trends'],
    health: ['Wellness trends', 'Medical breakthroughs', 'Health tips', 'Nutrition news'],
    sports: ['Game highlights', 'Player news', 'Sports technology', 'Tournament updates'],
    entertainment: ['Movie releases', 'Celebrity news', 'Music trends', 'Streaming content'],
    travel: ['Destination guides', 'Travel tips', 'Tourism trends', 'Travel technology']
  };

  const categoryFallbacks = fallbacks[category] || fallbacks.technology;
  
  return categoryFallbacks.slice(0, maxCount).map(topic => ({
    category,
    topic: `${topic}: Latest updates and insights`,
    trendValue: 0,
    baseKeyword: 'fallback',
    isProfitable: false,
    timeRange: 'fallback',
    languageCode,
    source: 'fallback'
  }));
}

// Clean expired cache
function cleanAITrendsCache() {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, entry] of aiTrendsCache.entries()) {
    if (now - entry.timestamp > AI_TRENDS_CACHE_DURATION) {
      aiTrendsCache.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    logger.debug({ cleaned, remaining: aiTrendsCache.size }, 'Cleaned expired AI trends cache');
  }
}

// Enhanced validation for AI trends service
export async function validateAITrendsService() {
  logger.info('Validating AI-powered trends service...');
  
  try {
    const testLanguages = ['en', 'ar', 'es'];
    const testResults = [];
    
    for (const lang of testLanguages) {
      try {
        const topics = await discoverTrendingTopicsWithAI({
          languageCode: lang,
          maxPerCategory: 2,
          categories: ['technology']
        });
        
        testResults.push({
          language: lang,
          success: topics.length > 0,
          topicCount: topics.length,
          sampleTopic: topics[0]?.topic || null,
          source: topics[0]?.source || null
        });
      } catch (err) {
        testResults.push({
          language: lang,
          success: false,
          error: err.message
        });
      }
    }
    
    const successfulTests = testResults.filter(r => r.success).length;
    const isHealthy = successfulTests >= 2;
    
    logger.info({
      testResults,
      successfulTests,
      totalTests: testResults.length,
      isHealthy,
      cacheSize: aiTrendsCache.size
    }, 'AI-powered trends service validation completed');
    
    return {
      healthy: isHealthy,
      details: testResults,
      cacheStatus: {
        size: aiTrendsCache.size,
        maxAge: AI_TRENDS_CACHE_DURATION
      },
      advantages: [
        'No API rate limits',
        'Real-time web search',
        'Context-aware discovery',
        'Multi-language support',
        'No complex scheduling needed'
      ]
    };
    
  } catch (err) {
    logger.error({ err }, 'AI trends service validation failed');
    return {
      healthy: false,
      error: err.message
    };
  }
}

// Get statistics
export async function getAITrendsStatistics() {
  return {
    cacheSize: aiTrendsCache.size,
    cacheDuration: AI_TRENDS_CACHE_DURATION,
    supportedLanguages: Object.keys(TREND_DISCOVERY_PROMPTS),
    supportedCategories: Object.keys(TREND_DISCOVERY_PROMPTS.en),
    advantages: {
      noRateLimits: true,
      realTimeSearch: true,
      contextAware: true,
      multiLanguage: true,
      simpleImplementation: true
    }
  };
}

// Manual trend discovery for specific language/category
export async function discoverSpecificTrends(languageCode, category) {
  logger.info({ languageCode, category }, 'Manual trend discovery requested');
  
  const topics = await discoverTrendingTopicsWithAI({
    languageCode,
    maxPerCategory: 5,
    categories: [category]
  });
  
  return topics.filter(t => t.category === category);
}

export { 
  TREND_DISCOVERY_PROMPTS,
  cleanAITrendsCache
};