import axios from 'axios';
import config from '../config/env.js';
import logger from '../lib/logger.js';

// Available models (restricted to two per request)
const AVAILABLE_MODELS = {
  GPT_4O_MINI: 'gpt-4o-mini',
  DEEPSEEK_CHAT: 'deepseek-chat'
};

// 1min.ai provider model mapping
function mapProviderModelName(selectedModel) {
  const FALLBACK = 'gpt-4o-mini';
  const MAP = {
    [AVAILABLE_MODELS.GPT_4O_MINI]: 'gpt-4o-mini',
    [AVAILABLE_MODELS.DEEPSEEK_CHAT]: 'deepseek-chat'
  };
  return MAP[selectedModel] || FALLBACK;
}

// استراتيجية اختيار الموديل الاقتصادية
const COST_EFFICIENT_MODEL_STRATEGY = {
  BUDGET_MODELS: [AVAILABLE_MODELS.GPT_4O_MINI, AVAILABLE_MODELS.DEEPSEEK_CHAT],
  PREMIUM_MODELS: [],
  CONTENT_TYPE_PRIORITY: {},
  LANGUAGE_PRIORITY: {}
};

// تقدير توكنز أكثر دقة حسب الموديل
const TOKEN_ESTIMATION_BY_MODEL = {
  [AVAILABLE_MODELS.GPT_4O_MINI]: {
    inputDivisor: 4.0,
    outputDivisor: 4.0,
    costMultiplier: 1.0
  },
  // DeepSeek is generally cheaper; treat as ~30% of gpt-4o-mini cost in estimator
  [AVAILABLE_MODELS.DEEPSEEK_CHAT]: {
    inputDivisor: 4.0,
    outputDivisor: 4.0,
    costMultiplier: 0.3
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

// اختيار موديل ثابت واقتصادي: دائماً gpt-4o-mini وبميزانية يومية ثابتة = 4,000,000 / 30
function selectCostEfficientModel(languageCode, categorySlug, complexity = 'medium', monthlyTokensUsed = 0, monthlyTokenLimit = 4000000) {
  // Prefer DeepSeek for maximum savings; fallback to gpt-4o-mini
  const remainingTokens = Math.max(0, monthlyTokenLimit - monthlyTokensUsed);
  const selectedModel = AVAILABLE_MODELS.DEEPSEEK_CHAT;
  logger.info({ languageCode, categorySlug, complexity, selectedModel, remainingTokens }, 'Model selected (lean: deepseek)');
  return selectedModel;
}

// Language-specific model recommendations (collapsed)
const LANGUAGE_MODEL_MAP = {
  'en': AVAILABLE_MODELS.GPT_4O_MINI,
  'es': AVAILABLE_MODELS.GPT_4O_MINI,
  'de': AVAILABLE_MODELS.GPT_4O_MINI,
  'fr': AVAILABLE_MODELS.GPT_4O_MINI,
  'ar': AVAILABLE_MODELS.GPT_4O_MINI,
  'hi': AVAILABLE_MODELS.GPT_4O_MINI,
  'pt': AVAILABLE_MODELS.GPT_4O_MINI,
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
  maxWords = 1500,    // مخفض من 2000
  geoScope = 'global',
  variationHint = ''
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
  const today = new Date();
  const isoDate = today.toISOString().slice(0, 10); // YYYY-MM-DD
  
  const autoTrend = !topic || /__AUTO_TREND__/i.test(String(topic)) || /^auto[\s_-]?trend$/i.test(String(topic));
  // Prompt غني ومتقدم يركز على القيمة والحداثة وSEO
  const prompt = [
    `# Content Brief`,
    `**Language**: ${languageName}`,
    `**Date**: ${isoDate} (use up-to-date information; avoid outdated years)`,
    autoTrend ? `**Topic**: (auto-discovered trending topic within ${categoryName})` : `**Topic**: ${topic}`,
    `**Type**: ${contentType.replace('_', ' ')}`,
    `**Category**: ${categoryName}`,
    `**Target Audience**: ${targetAudience}`,
    `**Max Words**: ${maxWords}`,
    `**Scope**: ${geoScope} (cover international developments; not country-limited)`,
    variationHint ? `**Variation Hint**: ${variationHint}` : '',
    '',
    autoTrend ? `## Topic Selection (Auto-Discover)
- Identify ONE highly trending, newsworthy topic in ${categoryName} now (last 24–72 hours), in ${languageName}.
- If web search is available, use it to verify recency and credibility.
- Selection criteria: high impact, strong interest, clear professional/business implications.
- Output a single line immediately before the article:
Selected Topic: <final topic>
- Base the entire article on this selected topic.` : '',
    '',
    `## Objectives`,
    `- Deliver high-value insights with E-E-A-T (experience, expertise, authoritativeness, trust).`,
    `- Be practical and actionable with clear steps, examples, and recent references.`,
    `- Maintain accuracy and avoid speculation or hallucinations.`,
    `- Provide a GLOBAL view: summarize what's happening across regions (Americas, EMEA, APAC).`,
    '',
    `## Style & Tone`,
    `- ${style.tone}.`,
    `- ${style.structure}.`,
    `- Include ${style.features}.`,
    `- Write naturally and idiomatically in ${languageName}.`,
    '',
    `## SEO Requirements`,
    keywords.length > 0 ? `- Primary and secondary keywords: ${keywords.slice(0, 8).join(', ')}.` : `- Integrate natural, relevant keywords for ${categoryName}.`,
    `- Title: compelling, within 50–60 chars; avoid clickbait.`,
    `- Meta Description: persuasive, within 140–160 chars.`,
    `- Use meaningful H2/H3 headings; include bullet lists where helpful.`,
    `- Add a short FAQ (4–6 Q&A) covering long-tail queries.`,
    '',
    `## Recency & Sources`,
    `- If web search is enabled:`,
    `  - Use at least 3 credible, recent sources (prefer last 7–30 days; OK to include last 24–72 hours when relevant).`,
    `  - Use inline citations like [1], [2] in the text.`,
    `  - Add a final "Sources" section listing title, publisher, region, and URL for each citation.`,
    `  - Ensure sources cover multiple regions (e.g., US, EU, Asia) and different publishers (avoid same-domain duplicates).`,
    `- If web search is disabled: rely on established knowledge; do not fabricate sources.`,
    '',
    `## Structure`,
    `1. # Title`,
    `2. ## Meta Description`,
    `3. ## Summary (2–3 sentences)`,
    `4. ---`,
    `5. ## Introduction (context + why it matters now; global angle)`,
    `6. ## Global Trends Overview (what changed this week + key drivers)`,
    `7. ## Regional Snapshots`,
    `   - ### Americas (key updates + implications)`,
    `   - ### EMEA (key updates + implications)`,
    `   - ### APAC (key updates + implications)`,
    `8. ## Deep Dives (3–5 sections) each with H3 subsections including:`,
    `   - Practical steps or frameworks`,
    `   - Concrete examples or mini case studies`,
    `   - Recent data points or observations (with [n] if from web)`,
    `9. ## Key Takeaways (3–6 bullets)`,
    `10. ## FAQ (4–6 Q&A)`,
    `11. ## Conclusion (actionable wrap-up)`,
    `12. ## Sources (if web search used)`,
    '',
    `## Constraints`,
    `- Ensure factual consistency with the date ${isoDate}.`,
    `- Do not include placeholders like YYYY or outdated years.`,
    `- Avoid fluff; keep paragraphs concise and scannable.`,
    `- Avoid repeating generic content across runs; reflect the variation hint if present.`,
    '',
    `Produce the full article in ${languageName}.`
  ].filter(Boolean).join('\n');
  
  return prompt;
}

export async function generateArticleViaAPI({ 
  topic,
  languageCode, 
  categoryName,
  categorySlug = null,
  contentType = 'CONTENT_GENERATOR_BLOG_ARTICLE',
  targetAudience = 'general web readers',
  keywords = [],
  includeWebSearch = true,
  generateImage = false,  // معطل افتراضياً
  maxWords = 1500,        // مخفض من 2000
  complexity = 'medium',
  monthlyTokensUsed = 0,
  modelOverride = null,
  customPrompt = null
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
    const selectedModel = modelOverride || selectCostEfficientModel(languageCode, categorySlugLower, complexity, monthlyTokensUsed);
    const model = mapProviderModelName(selectedModel);
    const prompt = customPrompt && typeof customPrompt === 'string' && customPrompt.trim().length > 0
      ? customPrompt
      : buildOptimizedPrompt({ 
          topic,
          languageCode,
          categoryName,
          contentType,
          targetAudience,
          keywords,
          maxWords,
          geoScope: 'global',
          variationHint: `Run-ID ${Date.now()} | Emphasize unique angles and different examples from previous runs.`
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
      type: 'CONTENT_GENERATOR_BLOG_ARTICLE',
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
        timeout: 500_000  // مخفض من 120 ثانية إلى 90
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

    // Cleanup: strip front-matter (Title/Meta/Summary and horizontal rule) from articleContent
    try {
      const allLines = content.split('\n');
      let startIdx = 0;
      const isMetaHeading = (line) => /^##\s+(meta\s+description|summary)\b/i.test(line.trim());
      
      for (let i = 0; i < allLines.length; i++) {
        const line = allLines[i];
        if (/^---\s*$/.test(line.trim())) {
          startIdx = i + 1; // keep after horizontal rule
          break;
        }
        if (/^##\s+/.test(line.trim())) {
          if (!isMetaHeading(line)) {
            startIdx = i; // first real H2/H3 section
            break;
          }
        }
      }
      const kept = allLines.slice(startIdx);
      // Trim leading blank lines
      while (kept.length && kept[0].trim() === '') kept.shift();
      articleContent = kept.join('\n').trim() || content.trim();
      
      // If content still starts with a stray '# Title' header, drop it and the immediate next line
      if (/^#\s*Title\b/i.test(articleContent)) {
        const tmp = articleContent.split('\n');
        // Remove the '# Title' line
        tmp.shift();
        // If next line is a short standalone title/blank, remove it as well
        if (tmp.length && tmp[0].trim().length > 0 && !/^#|^##/.test(tmp[0])) {
          tmp.shift();
        }
        // Remove leading blanks
        while (tmp.length && tmp[0].trim() === '') tmp.shift();
        articleContent = tmp.join('\n').trim() || articleContent;
      }
    } catch (_) {
      // On any parsing error, keep original content
      articleContent = content;
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

// Lightweight translation caller to avoid heavy content briefs and web search
export async function translateArticleViaAPI({
  masterTitle,
  masterContent,
  targetLanguage,
  maxWords = 1500,
  monthlyTokensUsed = 0
}) {
  if (!config.ai.apiKey) {
    const translatedTitle = `${masterTitle} (${targetLanguage})`;
    const translatedContent = `# ${translatedTitle}\n\n${masterContent}`;
    return {
      title: translatedTitle,
      content: translatedContent,
      summary: masterContent.slice(0, 250) + '...',
      metaDescription: masterContent.slice(0, 160),
      imageUrl: null,
      tokensIn: 150,
      tokensOut: 350,
      model: 'mock-translation'
    };
  }

  const categorySlugLower = 'translation';

  try {
    // Cost-efficient model for translations
    const selectedModel = selectCostEfficientModel(targetLanguage, categorySlugLower, 'low', monthlyTokensUsed);
    const model = mapProviderModelName(selectedModel);

    const languageNames = {
      'en': 'English', 'es': 'Spanish', 'de': 'German', 'fr': 'French',
      'ar': 'Arabic', 'hi': 'Hindi', 'pt': 'Portuguese'
    };
    const targetLanguageName = languageNames[targetLanguage] || targetLanguage;

    const translationPrompt = [
      `Translate the following article to ${targetLanguageName}.`,
      `- Maintain professional tone`,
      `- Keep all headings and structure (H2/H3)`,
      `- Adapt cultural references`,
      `- Preserve SEO keywords when applicable`,
      `- Keep roughly the same article length`,
      '',
      `Title: ${masterTitle}`,
      '',
      masterContent,
      '',
      'Output format:',
      '1. Title (as a single H1 heading starting with # )',
      '2. Meta Description (one concise sentence)',
      '3. Summary (2-3 sentences)',
      '4. Article content with H2/H3 structure'
    ].join('\n');

    const estimatedInputTokens = roughTokenEstimate(translationPrompt, model, 'input');
    const estimatedOutputTokens = maxWords * 1.2;
    const estimatedCost = estimateTokenCost(estimatedInputTokens, estimatedOutputTokens, model);

    logger.info({
      model,
      targetLanguage,
      estimatedInputTokens,
      estimatedOutputTokens,
      estimatedCost,
      promptLength: translationPrompt.length
    }, 'Starting cost-optimized translation');

    const requestPayload = {
      type: 'CHAT_WITH_AI',
      model,
      promptObject: {
        prompt: translationPrompt,
        isMixed: false,
        imageList: [],
        webSearch: false,
        numOfSite: 0,
        maxWord: maxWords,
        temperature: 0.3,
        language: targetLanguage
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
        params: { isStreaming: false },
        timeout: 60_000
      }
    );

    const data = response.data || {};
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

    // Parse structured parts similar to generateArticleViaAPI
    const lines = content.split('\n');
    let title = '';
    let metaDescription = '';
    let summary = '';
    let articleContent = content;

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

    if (!title) {
      const titleMatch = content.match(/^#\s*(.+)$/m);
      title = titleMatch ? titleMatch[1].trim() : `${masterTitle} (${targetLanguage})`;
    }
    if (!summary) {
      const paragraphs = content.split('\n\n').filter(p => p.trim().length > 50);
      summary = paragraphs[0]?.slice(0, 250) + '...' || `Translation of ${masterTitle}`;
    }
    if (!metaDescription) {
      metaDescription = summary.slice(0, 160);
    }

    try {
      const allLines = content.split('\n');
      let startIdx = 0;
      const isMetaHeading = (line) => /^##\s+(meta\s+description|summary)\b/i.test(line.trim());
      for (let i = 0; i < allLines.length; i++) {
        const line = allLines[i];
        if (/^---\s*$/.test(line.trim())) { startIdx = i + 1; break; }
        if (/^##\s+/.test(line.trim())) {
          if (!isMetaHeading(line)) { startIdx = i; break; }
        }
      }
      const kept = allLines.slice(startIdx);
      while (kept.length && kept[0].trim() === '') kept.shift();
      articleContent = kept.join('\n').trim() || content.trim();
    } catch (_) {
      articleContent = content;
    }

    const tokensIn = Number(usage.prompt_tokens || roughTokenEstimate(translationPrompt, selectedModel, 'input'));
    const tokensOut = Number(usage.completion_tokens || roughTokenEstimate(content, selectedModel, 'output'));
    const actualCost = estimateTokenCost(tokensIn, tokensOut, model);

    logger.info({
      model: selectedModel,
      tokensIn,
      tokensOut,
      actualCost,
      title: title.slice(0, 50)
    }, 'Translation generated successfully');

    return {
      title: title.slice(0, 180),
      content: articleContent,
      summary: summary.slice(0, 400),
      metaDescription: metaDescription.slice(0, 160),
      imageUrl: null,
      tokensIn,
      tokensOut,
      model: selectedModel,
      estimatedCost: actualCost
    };

  } catch (err) {
    logger.error({
      err: err.message,
      targetLanguage
    }, 'Translation API call failed');
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