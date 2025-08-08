import axios from 'axios';
import config from '../config/env.js';
import logger from '../lib/logger.js';

// Available models مرتبة حسب التكلفة (من الأرخص للأغلى)
const AVAILABLE_MODELS = {
  // Cost-effective models (أولوية للاستخدام)
  GPT_4O_MINI: 'gpt-4o-mini',        // الأرخص - للمقالات البسيطة
  GEMINI_2_5: 'gemini-2.5',           // متوسط التكلفة - جيد للغات المتعددة
  MISTRAL_NEMO: 'mistral-nemo',       // اقتصادي - جيد للمحتوى العام
  
  // Premium models (استخدام محدود)
  GPT_4O: 'gpt-4o',                   // مكلف - للمحتوى المتقدم فقط
  CLAUDE_SONNET_4: 'claude-sonnet-4', // مكلف جداً - للمحتوى التقني فقط
  CLAUDE_OPUS_4: 'claude-opus-4',     // الأغلى - للمحتوى الممتاز فقط
  
  // Specialized models
  DEEPSEEK_CHAT: 'deepseek-chat',
  LLAMA_4: 'llama-4',
  
  // Image models (معطل حالياً)
  MIDJOURNEY: 'midjourney',
  DALL_E_3: 'dall-e-3',
  STABLE_DIFFUSION: 'stable-diffusion'
};

// 1min.ai provider model mapping
function mapProviderModelName(selectedModel) {
  // Known working default on 1min.ai
  const FALLBACK = AVAILABLE_MODELS.GPT_4O_MINI;
  // Map internal names to provider-supported identifiers
  const MAP = {
    [AVAILABLE_MODELS.GPT_4O_MINI]: 'gpt-4o-mini',
    [AVAILABLE_MODELS.GEMINI_2_5]: 'gpt-4o-mini',
    [AVAILABLE_MODELS.MISTRAL_NEMO]: 'gpt-4o-mini',
    [AVAILABLE_MODELS.GPT_4O]: 'gpt-4o-mini',
    [AVAILABLE_MODELS.CLAUDE_SONNET_4]: 'gpt-4o-mini',
    [AVAILABLE_MODELS.CLAUDE_OPUS_4]: 'gpt-4o-mini',
    [AVAILABLE_MODELS.DEEPSEEK_CHAT]: 'gpt-4o-mini',
    [AVAILABLE_MODELS.LLAMA_4]: 'gpt-4o-mini'
  };
  return MAP[selectedModel] || FALLBACK;
}

// استراتيجية اختيار الموديل الاقتصادية
const COST_EFFICIENT_MODEL_STRATEGY = {
  // 80% من المقالات تستخدم النماذج الاقتصادية
  BUDGET_MODELS: [
    AVAILABLE_MODELS.GPT_4O_MINI,    // 50% من الإجمالي
    AVAILABLE_MODELS.GEMINI_2_5,     // 20% من الإجمالي  
    AVAILABLE_MODELS.MISTRAL_NEMO    // 10% من الإجمالي
  ],
  
  // 20% فقط للنماذج المتقدمة (للمحتوى عالي القيمة)
  PREMIUM_MODELS: [
    AVAILABLE_MODELS.GPT_4O,         // 15% من الإجمالي
    AVAILABLE_MODELS.CLAUDE_SONNET_4 // 5% من الإجمالي
  ],
  
  // أولويات حسب نوع المحتوى
  CONTENT_TYPE_PRIORITY: {
    'technology': 'premium',    // تقنية = محتوى عالي القيمة
    'finance': 'premium',       // مالية = محتوى عالي القيمة
    'business': 'premium',      // أعمال = محتوى عالي القيمة
    'health': 'balanced',       // صحة = متوازن
    'sports': 'budget',         // رياضة = اقتصادي
    'entertainment': 'budget',  // ترفيه = اقتصادي
    'travel': 'budget'          // سفر = اقتصادي
  },
  
  // أولويات حسب اللغة (حسب معدل الربح)
  LANGUAGE_PRIORITY: {
    'en': 'premium',    // إنجليزية = أعلى ربح
    'de': 'premium',    // ألمانية = ربح عالي
    'fr': 'balanced',   // فرنسية = ربح متوسط
    'es': 'balanced',   // إسبانية = ربح متوسط
    'pt': 'budget',     // برتغالية = ربح منخفض
    'ar': 'budget',     // عربية = ربح منخفض
    'hi': 'budget'      // هندية = ربح منخفض
  }
};

// تقدير توكنز أكثر دقة حسب الموديل
const TOKEN_ESTIMATION_BY_MODEL = {
  [AVAILABLE_MODELS.GPT_4O_MINI]: {
    inputDivisor: 4.0,
    outputDivisor: 4.0,
    costMultiplier: 1.0      // مرجع التكلفة
  },
  [AVAILABLE_MODELS.GEMINI_2_5]: {
    inputDivisor: 3.8,
    outputDivisor: 3.8,
    costMultiplier: 1.2
  },
  [AVAILABLE_MODELS.MISTRAL_NEMO]: {
    inputDivisor: 4.2,
    outputDivisor: 4.2,
    costMultiplier: 1.1
  },
  [AVAILABLE_MODELS.GPT_4O]: {
    inputDivisor: 4.0,
    outputDivisor: 4.0,
    costMultiplier: 8.0      // أغلى بـ 8 مرات
  },
  [AVAILABLE_MODELS.CLAUDE_SONNET_4]: {
    inputDivisor: 3.5,
    outputDivisor: 3.5,
    costMultiplier: 12.0     // أغلى بـ 12 مرة
  },
  [AVAILABLE_MODELS.CLAUDE_OPUS_4]: {
    inputDivisor: 3.0,
    outputDivisor: 3.0,
    costMultiplier: 25.0     // أغلى بـ 25 مرة
  }
};

function roughTokenEstimate(text, model = AVAILABLE_MODELS.GPT_4O_MINI, type = 'output') {
  if (!text) return 0;
  
  const modelConfig = TOKEN_ESTIMATION_BY_MODEL[model] || TOKEN_ESTIMATION_BY_MODEL[AVAILABLE_MODELS.GPT_4O_MINI];
  const divisor = type === 'input' ? modelConfig.inputDivisor : modelConfig.outputDivisor;
  
  return Math.ceil(text.length / divisor);
}

// دالة تقدير التكلفة المالية (للمراقبة)
function estimateTokenCost(inputTokens, outputTokens, model) {
  const modelConfig = TOKEN_ESTIMATION_BY_MODEL[model] || TOKEN_ESTIMATION_BY_MODEL[AVAILABLE_MODELS.GPT_4O_MINI];
  const baseCost = (inputTokens + outputTokens) * modelConfig.costMultiplier;
  return baseCost;
}

// اختيار موديل ذكي واقتصادي
function selectCostEfficientModel(languageCode, categorySlug, complexity = 'medium', monthlyTokensUsed = 0, monthlyTokenLimit = 4000000) {
  const remainingTokens = monthlyTokenLimit - monthlyTokensUsed;
  const daysRemaining = Math.max(1, Math.ceil((new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate())));
  const dailyTokenBudget = remainingTokens / daysRemaining;
  
  // تحديد مستوى الأولوية
  const categoryPriority = COST_EFFICIENT_MODEL_STRATEGY.CONTENT_TYPE_PRIORITY[categorySlug] || 'budget';
  const languagePriority = COST_EFFICIENT_MODEL_STRATEGY.LANGUAGE_PRIORITY[languageCode] || 'budget';
  
  // حساب الأولوية النهائية
  let finalPriority = 'budget';
  if (categoryPriority === 'premium' || languagePriority === 'premium') {
    finalPriority = 'premium';
  } else if (categoryPriority === 'balanced' || languagePriority === 'balanced') {
    finalPriority = 'balanced';
  }
  
  // إذا كان الميزانية المتبقية قليلة، استخدم النماذج الاقتصادية فقط
  if (dailyTokenBudget < 10000) {
    finalPriority = 'budget';
    logger.warn({ dailyTokenBudget, remainingTokens }, 'Low token budget - forcing budget models');
  }
  
  // اختيار الموديل حسب الأولوية
  let selectedModel;
  
  if (finalPriority === 'premium') {
    // إلغاء استخدام الموديلات المكلفة: اختر بدائل اقتصادية احترافية
    if (complexity === 'high' || categorySlug === 'technology' || categorySlug === 'finance') {
      selectedModel = AVAILABLE_MODELS.GEMINI_2_5; // دقة أعلى للغات الأوروبية والتقنية مع تكلفة مناسبة
    } else {
      selectedModel = AVAILABLE_MODELS.GPT_4O_MINI;
    }
  } else if (finalPriority === 'balanced' && Math.random() < 0.25) { // 25% احتمال للنماذج المتوسطة
    selectedModel = AVAILABLE_MODELS.GEMINI_2_5;
  } else {
    // النماذج الاقتصادية (الافتراضية)
    const random = Math.random();
    if (random < 0.8) {                // 80% احتمال
      selectedModel = AVAILABLE_MODELS.GPT_4O_MINI;
    } else if (random < 0.95) {        // 15% احتمال
      selectedModel = AVAILABLE_MODELS.MISTRAL_NEMO;
    } else {                           // 5% احتمال
      selectedModel = AVAILABLE_MODELS.GEMINI_2_5;
    }
  }
  
  logger.info({
    languageCode,
    categorySlug,
    complexity,
    categoryPriority,
    languagePriority,
    finalPriority,
    selectedModel,
    dailyTokenBudget,
    remainingTokens
  }, 'Model selected with cost optimization');
  
  return selectedModel;
}

// Language-specific model recommendations (مع التركيز على الاقتصاد)
const LANGUAGE_MODEL_MAP = {
  'en': AVAILABLE_MODELS.GPT_4O_MINI,    // إنجليزية = gpt-4o-mini (اقتصادي)
  'es': AVAILABLE_MODELS.GPT_4O_MINI,    // إسبانية = gpt-4o-mini
  'de': AVAILABLE_MODELS.GEMINI_2_5,     // ألمانية = gemini (أفضل للألمانية)
  'fr': AVAILABLE_MODELS.GEMINI_2_5,     // فرنسية = gemini
  'ar': AVAILABLE_MODELS.GEMINI_2_5,     // عربية = gemini (أفضل للعربية)
  'hi': AVAILABLE_MODELS.GEMINI_2_5,     // هندية = gemini
  'pt': AVAILABLE_MODELS.GPT_4O_MINI,    // برتغالية = gpt-4o-mini
  'default': AVAILABLE_MODELS.GPT_4O_MINI
};

// Professional writing styles محسنة للاقتصاد
const WRITING_STYLES = {
  SEO_ARTICLE: {
    tone: 'professional, authoritative, engaging',
    structure: 'SEO-optimized with clear headings, subheadings, and natural keyword integration',
    wordCount: '1000-1500 words',  // مخفض من 1200-2000
    features: 'meta descriptions, compelling titles, actionable insights',
    maxTokens: 2500                // حد أقصى للتوكنز
  },
  NEWS_ARTICLE: {
    tone: 'objective, informative, timely',
    structure: 'inverted pyramid with lead, body, and conclusion',
    wordCount: '600-1000 words',   // مخفض من 800-1200
    features: 'factual reporting, quotes, credible sources',
    maxTokens: 2000
  },
  BLOG_POST: {
    tone: 'conversational, helpful, engaging',
    structure: 'introduction, main points with examples, conclusion with CTA',
    wordCount: '800-1200 words',   // مخفض من 1000-1500
    features: 'personal insights, practical tips, reader engagement',
    maxTokens: 2200
  },
  TECHNICAL_GUIDE: {
    tone: 'technical, precise, instructional',
    structure: 'step-by-step format with code examples and explanations',
    wordCount: '1200-1800 words', // مخفض من 1500-2500
    features: 'technical accuracy, examples, troubleshooting tips',
    maxTokens: 3000
  }
};

function buildOptimizedPrompt({ 
  topic, 
  languageCode, 
  categoryName, 
  contentType = 'SEO_ARTICLE',
  targetAudience = 'general web readers',
  keywords = [],
  maxWords = 1500    // مخفض من 2000
}) {
  const style = WRITING_STYLES[contentType] || WRITING_STYLES.SEO_ARTICLE;
  
  const languageNames = {
    'en': 'English',
    'es': 'Spanish', 
    'de': 'German',
    'fr': 'French',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'pt': 'Portuguese'
  };
  
  const languageName = languageNames[languageCode] || 'English';
  
  // بناء prompt محسن ومختصر لتوفير التوكنز
  const prompt = [
    `# Content Brief`,
    `**Language**: ${languageName}`,
    `**Topic**: ${topic}`,
    `**Type**: ${contentType.replace('_', ' ')}`,
    `**Category**: ${categoryName}`,
    `**Max Words**: ${maxWords}`,
    `**Target**: ${targetAudience}`,
    '',
    `## Requirements`,
    `- **Style**: ${style.tone}`,
    `- **Structure**: ${style.structure}`,
    `- **Features**: ${style.features}`,
    keywords.length > 0 ? `- **Keywords**: ${keywords.slice(0, 5).join(', ')}` : '',
    '',
    `## Output Format`,
    `1. **Title** (50-60 chars)`,
    `2. **Meta Description** (150 chars)`, 
    `3. **Summary** (2-3 sentences)`,
    `4. **Article** with H2/H3 structure`,
    '',
    `Write a high-quality ${contentType.replace('_', ' ').toLowerCase()} about "${topic}" in ${languageName}.`
  ].filter(Boolean).join('\n');
  
  return prompt;
}

export async function generateArticleViaAPI({ 
  topic,
  languageCode, 
  categoryName,
  categorySlug = null,
  contentType = 'SEO_ARTICLE',
  targetAudience = 'general web readers',
  keywords = [],
  includeWebSearch = true,
  generateImage = false,  // معطل افتراضياً
  maxWords = 1500,        // مخفض من 2000
  complexity = 'medium',
  monthlyTokensUsed = 0
}) {
  if (!config.ai.apiKey) {
    // Enhanced development fallback
    logger.warn('No API key provided, using enhanced mock content');
    
    const mockTitle = `${categoryName}: Complete Guide to ${topic}`;
    const mockContent = `# ${mockTitle}

## Introduction
This comprehensive guide explores ${topic} within ${categoryName}, providing valuable insights for ${targetAudience}.

## Key Points
- Understanding core concepts and fundamentals
- Practical implementation strategies  
- Best practices and common pitfalls
- Future trends and opportunities

## Implementation
1. **Planning Phase**: Define objectives and requirements
2. **Execution Phase**: Apply proven methodologies
3. **Optimization Phase**: Monitor and improve results

## Conclusion
Mastering ${topic} requires consistent effort and strategic approach. Follow these guidelines for optimal results.`;

    return { 
      title: mockTitle, 
      content: mockContent, 
      summary: `Complete guide to ${topic} in ${categoryName} with practical insights.`,
      metaDescription: `Learn ${topic} fundamentals with this ${categoryName} guide. Expert tips and strategies.`,
      imageUrl: null, 
      tokensIn: 250, 
      tokensOut: 400, 
      model: 'mock-optimized' 
    };
  }

  // استخدم slug إن توفر، أو اسم الفئة بشكل lowercased كبديل (معلن خارج الـ try لاستخدامه في الـ catch)
  const categorySlugLower = (categorySlug || categoryName || '').toString().trim().toLowerCase();

  try {

    // اختيار موديل محسن اقتصادياً
    const selectedModel = selectCostEfficientModel(languageCode, categorySlugLower, complexity, monthlyTokensUsed);
    const model = mapProviderModelName(selectedModel);
    const prompt = buildOptimizedPrompt({ 
      topic, languageCode, categoryName, contentType, 
      targetAudience, keywords, maxWords 
    });

    // تقدير التوكنز قبل الإرسال
    const estimatedInputTokens = roughTokenEstimate(prompt, model, 'input');
    const estimatedOutputTokens = maxWords * 1.3; // تقدير تقريبي
    const estimatedCost = estimateTokenCost(estimatedInputTokens, estimatedOutputTokens, model);

    logger.info({ 
      model, 
      languageCode, 
      categoryName,
      topic: topic.slice(0, 50), 
      estimatedInputTokens,
      estimatedOutputTokens,
      estimatedCost,
      promptLength: prompt.length 
    }, 'Starting cost-optimized article generation');

    // Build API request
    const requestPayload = {
      type: 'CHAT_WITH_AI',
      model: model,
      promptObject: {
        prompt: prompt,
        isMixed: false,
        imageList: [],
        // Enable provider web search when requested
        webSearch: !!includeWebSearch,
        numOfSite: includeWebSearch ? 2 : 0,  // مخفض من 3 إلى 2
        maxWord: maxWords,
        temperature: 0.7,  // ثابت لتوفير التوكنز
        language: languageCode
      }
    };

    const response = await axios.post(
      `${config.ai.baseUrl}/api/features`,
      requestPayload,
      { 
        headers: { 
          'Content-Type': 'application/json',
          'API-KEY': config.ai.apiKey
        }, 
        params: {
          isStreaming: false
        },
        timeout: 90_000  // مخفض من 120 ثانية إلى 90
      }
    );

    const data = response.data || {};
    // 1min.ai non-streaming shape: { aiRecord: { aiRecordDetail: { resultObject: [text] } } }
    let content = '';
    const aiRecord = data.aiRecord;
    const resultObject = aiRecord?.aiRecordDetail?.resultObject;
    if (Array.isArray(resultObject)) {
      content = resultObject.filter(Boolean).map(item => String(item)).join('\n\n');
    } else if (typeof resultObject === 'string') {
      content = resultObject;
    }
    if (!content) {
      content = data.text || data.content || aiRecord?.content || '';
    }
    const usage = data.usage || {};
    
    // Parse response
    const lines = content.split('\n');
    let title = '';
    let metaDescription = '';
    let summary = '';
    let articleContent = content;
    
    // Extract structured data
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('# ') && !title) {
        title = line.replace(/^#\s*/, '').trim();
      }
      if (line.toLowerCase().includes('meta description:')) {
        metaDescription = lines[i + 1]?.trim() || '';
      }
      if (line.toLowerCase().includes('summary:')) {
        summary = lines[i + 1]?.trim() || '';
      }
    }
    
    // Fallbacks
    if (!title) {
      const titleMatch = content.match(/^#\s*(.+)$/m);
      title = titleMatch ? titleMatch[1].trim() : `${categoryName} Guide: ${topic}`;
    }
    
    if (!summary) {
      const paragraphs = content.split('\n\n').filter(p => p.trim().length > 50);
      summary = paragraphs[0]?.slice(0, 250) + '...' || `Guide about ${topic}`;
    }
    
    if (!metaDescription) {
      metaDescription = summary.slice(0, 160);
    }

    const tokensIn = Number(usage.prompt_tokens || roughTokenEstimate(prompt, selectedModel, 'input'));
    const tokensOut = Number(usage.completion_tokens || roughTokenEstimate(content, selectedModel, 'output'));
    const actualCost = estimateTokenCost(tokensIn, tokensOut, model);

    logger.info({ 
      model: selectedModel,
      tokensIn, 
      tokensOut,
      actualCost,
      contentLength: content.length,
      title: title.slice(0, 50),
      estimatedVsActual: {
        inputDiff: tokensIn - estimatedInputTokens,
        outputDiff: tokensOut - estimatedOutputTokens
      }
    }, 'Cost-optimized article generated successfully');

    return {
      title: title.slice(0, 180),
      content: articleContent,
      summary: summary.slice(0, 400),
      metaDescription: metaDescription.slice(0, 160),
      imageUrl: null, // معطل لتوفير التكلفة
      tokensIn,
      tokensOut,
      model: selectedModel,
      estimatedCost: actualCost
    };

  } catch (err) {
    logger.error({ 
      err: err.message, 
      status: err.response?.status,
      languageCode, 
      categoryName,
      categorySlug: categorySlugLower,
      topic: topic.slice(0, 50) 
    }, 'Cost-optimized AI API call failed');
    
    if (err.response?.status === 401) {
      throw new Error('Invalid API key for 1min.ai');
    } else if (err.response?.status === 429) {
      throw new Error('Rate limit exceeded on 1min.ai API');
    }
    
    throw err;
  }
}

// Export للتحكم في التكلفة
export { 
  AVAILABLE_MODELS, 
  COST_EFFICIENT_MODEL_STRATEGY,
  TOKEN_ESTIMATION_BY_MODEL,
  selectCostEfficientModel,
  estimateTokenCost,
  roughTokenEstimate,
  WRITING_STYLES 
};