import axios from 'axios';
import config from '../config/env.js';
import logger from '../lib/logger.js';

// Available models on 1min.ai platform
const AVAILABLE_MODELS = {
  // Text Generation Models
  GPT_4O_MINI: 'gpt-4o-mini',
  GPT_4O: 'gpt-4o',
  CLAUDE_SONNET_4: 'claude-sonnet-4',
  CLAUDE_OPUS_4: 'claude-opus-4',
  LLAMA_4: 'llama-4',
  GEMINI_2_5: 'gemini-2.5',
  DEEPSEEK_CHAT: 'deepseek-chat',
  MISTRAL_NEMO: 'mistral-nemo',
  
  // Image Generation Models
  MIDJOURNEY: 'midjourney',
  DALL_E_3: 'dall-e-3',
  STABLE_DIFFUSION: 'stable-diffusion'
};

// API Types available
const API_TYPES = {
  CHAT_WITH_AI: 'CHAT_WITH_AI',
  CHAT_WITH_IMAGE: 'CHAT_WITH_IMAGE',
  IMAGE_GENERATOR: 'IMAGE_GENERATOR',
  WEB_SEARCH: 'WEB_SEARCH',
  DOCUMENT_ANALYSIS: 'DOCUMENT_ANALYSIS'
};

// Language-specific model recommendations for better output quality
const LANGUAGE_MODEL_MAP = {
  'en': AVAILABLE_MODELS.GPT_4O,
  'es': AVAILABLE_MODELS.GPT_4O,
  'de': AVAILABLE_MODELS.CLAUDE_SONNET_4,
  'fr': AVAILABLE_MODELS.CLAUDE_SONNET_4,
  'ar': AVAILABLE_MODELS.GEMINI_2_5,
  'hi': AVAILABLE_MODELS.GEMINI_2_5,
  'pt': AVAILABLE_MODELS.GPT_4O,
  // Fallback
  'default': AVAILABLE_MODELS.GPT_4O_MINI
};

// Professional writing styles for different content types
const WRITING_STYLES = {
  SEO_ARTICLE: {
    tone: 'professional, authoritative, engaging',
    structure: 'SEO-optimized with clear headings, subheadings, and natural keyword integration',
    wordCount: '1200-2000 words',
    features: 'meta descriptions, compelling titles, actionable insights'
  },
  NEWS_ARTICLE: {
    tone: 'objective, informative, timely',
    structure: 'inverted pyramid with lead, body, and conclusion',
    wordCount: '800-1200 words',
    features: 'factual reporting, quotes, credible sources'
  },
  BLOG_POST: {
    tone: 'conversational, helpful, engaging',
    structure: 'introduction, main points with examples, conclusion with CTA',
    wordCount: '1000-1500 words',
    features: 'personal insights, practical tips, reader engagement'
  },
  TECHNICAL_GUIDE: {
    tone: 'technical, precise, instructional',
    structure: 'step-by-step format with code examples and explanations',
    wordCount: '1500-2500 words',
    features: 'technical accuracy, examples, troubleshooting tips'
  }
};

function roughTokenEstimate(text, languageCode = 'en') {
  if (!text) return 0;
  const length = text.length;
  // More accurate token estimation based on language characteristics
  const divisors = {
    'ar': 2.2,  // Arabic uses more tokens per character
    'hi': 2.5,  // Hindi/Devanagari script
    'zh': 1.5,  // Chinese characters
    'ja': 1.8,  // Japanese
    'ko': 2.0,  // Korean
    'default': 4.0  // Most Latin script languages
  };
  
  const divisor = divisors[languageCode] || divisors.default;
  return Math.ceil(length / divisor);
}

function selectOptimalModel(languageCode, contentType = 'article', complexity = 'medium') {
  // Select model based on language, content type, and complexity
  const baseModel = LANGUAGE_MODEL_MAP[languageCode] || LANGUAGE_MODEL_MAP.default;
  
  // For high complexity content, prefer more powerful models
  if (complexity === 'high' || contentType === 'technical') {
    return AVAILABLE_MODELS.CLAUDE_OPUS_4;
  }
  
  // For creative content, prefer models good at creative writing
  if (contentType === 'creative' || contentType === 'marketing') {
    return AVAILABLE_MODELS.GPT_4O;
  }
  
  // For multilingual content, prefer Gemini
  if (['ar', 'hi', 'zh', 'ja', 'ko'].includes(languageCode)) {
    return AVAILABLE_MODELS.GEMINI_2_5;
  }
  
  return baseModel;
}

function buildAdvancedPrompt({ 
  topic, 
  languageCode, 
  categoryName, 
  contentType = 'SEO_ARTICLE',
  targetAudience = 'general web readers',
  keywords = [],
  includeWebSearch = true,
  maxWords = 2000
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
  
  // Build comprehensive, professional prompt
  const prompt = [
    `## Content Creation Brief`,
    `**Language**: ${languageName} (${languageCode})`,
    `**Topic**: ${topic}`,
    `**Category**: ${categoryName}`,
    `**Content Type**: ${contentType.replace('_', ' ')}`,
    `**Target Audience**: ${targetAudience}`,
    `**Maximum Words**: ${maxWords}`,
    '',
    `## Writing Requirements`,
    `**Tone & Style**: ${style.tone}`,
    `**Structure**: ${style.structure}`,
    `**Word Count**: ${style.wordCount}`,
    `**Key Features**: ${style.features}`,
    '',
    `## Content Guidelines`,
    `1. **SEO Optimization**: Use natural keyword integration, semantic keywords, and LSI terms`,
    `2. **Readability**: Write for ${targetAudience} with clear, scannable formatting`,
    `3. **Structure**: Use H2/H3 headings, bullet points, numbered lists, and short paragraphs`,
    `4. **Value-Driven**: Provide actionable insights, practical tips, and genuine value`,
    `5. **Originality**: Create unique, plagiarism-free content with fresh perspectives`,
    `6. **Engagement**: Include compelling introduction, engaging examples, and strong conclusion`,
    '',
    keywords.length > 0 ? `## Target Keywords\n${keywords.join(', ')}\n` : '',
    `## Output Format`,
    `Please provide:`,
    `1. **Compelling Title** (50-60 characters, SEO-optimized)`,
    `2. **Meta Description** (150-160 characters)`,
    `3. **Article Summary** (2-3 sentences)`,
    `4. **Full Article Content** with proper H2/H3 structure`,
    `5. **Key Takeaways** (3-5 bullet points)`,
    '',
    `## Quality Standards`,
    `- Fact-check all claims and statistics`,
    `- Use authoritative sources and examples`,
    `- Maintain ${languageName} grammar and cultural context`,
    `- Ensure mobile-friendly formatting`,
    `- Create content that encourages social sharing`,
    '',
    `Begin writing the ${contentType.replace('_', ' ').toLowerCase()} about "${topic}" now.`
  ].filter(Boolean).join('\n');
  
  return prompt;
}

export async function generateArticleViaAPI({ 
  topic,
  languageCode, 
  categoryName,
  contentType = 'SEO_ARTICLE',
  targetAudience = 'general web readers',
  keywords = [],
  includeWebSearch = true,
  generateImage = false,
  maxWords = 2000,
  complexity = 'medium'
}) {
  if (!config.ai.apiKey) {
    // Enhanced development fallback with realistic content
    logger.warn('No API key provided, using enhanced mock content');
    
    const mockTitle = `Professional ${categoryName} Guide: ${topic}`;
    const mockContent = `# ${mockTitle}

## Introduction

This comprehensive guide explores ${topic} in the context of ${categoryName}, providing valuable insights for ${targetAudience}.

## Key Concepts

Understanding ${topic} requires examining several fundamental aspects:

### Primary Considerations
- **Market Analysis**: Current trends and future projections
- **Technical Implementation**: Best practices and methodologies  
- **Risk Assessment**: Potential challenges and mitigation strategies
- **Performance Metrics**: Key indicators and benchmarks

### Advanced Strategies
- Data-driven decision making
- Scalable solution architecture
- User experience optimization
- Security and compliance frameworks

## Implementation Guide

### Phase 1: Planning and Preparation
Detailed planning ensures successful implementation of ${topic} strategies.

### Phase 2: Execution and Monitoring
Active monitoring and adjustment optimize outcomes.

### Phase 3: Optimization and Scaling
Continuous improvement drives long-term success.

## Best Practices

1. **Regular Assessment**: Monitor performance indicators consistently
2. **Stakeholder Engagement**: Maintain clear communication channels
3. **Technology Integration**: Leverage appropriate tools and platforms
4. **Risk Management**: Implement comprehensive mitigation strategies

## Conclusion

Successfully implementing ${topic} strategies requires careful planning, execution, and ongoing optimization. By following these guidelines, ${targetAudience} can achieve sustainable results.

## Key Takeaways

- Thorough planning is essential for success
- Regular monitoring enables timely adjustments
- Best practices ensure optimal outcomes
- Continuous improvement drives long-term value`;

    const tokensOut = roughTokenEstimate(mockContent, languageCode);
    const prompt = buildAdvancedPrompt({ 
      topic, languageCode, categoryName, contentType, 
      targetAudience, keywords, includeWebSearch, maxWords 
    });
    const tokensIn = roughTokenEstimate(prompt, languageCode);
    
    return { 
      title: mockTitle, 
      content: mockContent, 
      summary: `Comprehensive guide to ${topic} covering key concepts, implementation strategies, and best practices for ${targetAudience}.`,
      metaDescription: `Learn about ${topic} with this detailed ${categoryName} guide. Expert insights and practical strategies for ${targetAudience}.`,
      imageUrl: null, 
      tokensIn, 
      tokensOut, 
      model: 'mock-enhanced' 
    };
  }

  try {
    const model = selectOptimalModel(languageCode, contentType.toLowerCase(), complexity);
    const prompt = buildAdvancedPrompt({ 
      topic, languageCode, categoryName, contentType, 
      targetAudience, keywords, includeWebSearch, maxWords 
    });

    logger.info({ 
      model, 
      languageCode, 
      topic: topic.slice(0, 50), 
      promptLength: prompt.length 
    }, 'Generating article with 1min.ai API');

    // Build the correct request payload for 1min.ai API
    const requestPayload = {
      type: API_TYPES.CHAT_WITH_AI,
      model: model,
      promptObject: {
        prompt: prompt,
        isMixed: false,
        imageList: [],
        webSearch: includeWebSearch,
        numOfSite: includeWebSearch ? 3 : 0,
        maxWord: maxWords,
        temperature: contentType === 'creative' ? 0.8 : 0.7,
        language: languageCode
      }
    };

    // Make the API call with correct headers and endpoint
    const response = await axios.post(
      `${config.ai.baseUrl.replace(/\/$/, '')}/api/features`,
      requestPayload,
      { 
        headers: { 
          'Content-Type': 'application/json',
          'API-KEY': config.ai.apiKey  // Correct header format
        }, 
        params: {
          isStreaming: false  // Set to true for streaming responses
        },
        timeout: 120_000  // 2 minutes timeout for long content generation
      }
    );

    const data = response.data || {};
    
    // Extract and parse the response
    const content = data.text || data.content || data.response || '';
    const usage = data.usage || {};
    
    // Parse the structured response if the AI followed our format
    const lines = content.split('\n');
    let title = '';
    let metaDescription = '';
    let summary = '';
    let articleContent = content;
    
    // Try to extract structured data from response
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.toLowerCase().includes('title:') || line.startsWith('# ')) {
        title = line.replace(/^#\s*/, '').replace(/^title:\s*/i, '').trim();
      }
      if (line.toLowerCase().includes('meta description:')) {
        metaDescription = lines[i + 1]?.trim() || '';
      }
      if (line.toLowerCase().includes('summary:')) {
        summary = lines[i + 1]?.trim() || '';
      }
    }
    
    // Fallback extractions
    if (!title) {
      const titleMatch = content.match(/^#\s*(.+)$/m);
      title = titleMatch ? titleMatch[1].trim() : `Professional ${categoryName} Guide: ${topic}`;
    }
    
    if (!summary) {
      // Extract first meaningful paragraph as summary
      const paragraphs = content.split('\n\n').filter(p => 
        p.trim().length > 50 && 
        !p.includes('#') && 
        !p.includes('**')
      );
      summary = paragraphs[0]?.slice(0, 300) + '...' || `Comprehensive guide about ${topic}`;
    }
    
    if (!metaDescription) {
      metaDescription = summary.slice(0, 160);
    }

    // Generate image if requested and we have the capability
    let imageUrl = null;
    if (generateImage && data.imageUrl) {
      imageUrl = data.imageUrl;
    } else if (generateImage) {
      // Optionally trigger image generation in a separate call
      try {
        const imageResponse = await generateImage({ topic, categoryName, languageCode });
        imageUrl = imageResponse.imageUrl;
      } catch (imageError) {
        logger.warn({ imageError }, 'Image generation failed');
      }
    }

    const tokensIn = Number(usage.prompt_tokens || roughTokenEstimate(prompt, languageCode));
    const tokensOut = Number(usage.completion_tokens || roughTokenEstimate(content, languageCode));

    logger.info({ 
      model, 
      tokensIn, 
      tokensOut, 
      contentLength: content.length,
      title: title.slice(0, 50)
    }, 'Article generated successfully');

    return {
      title: title.slice(0, 200), // Ensure reasonable title length
      content: articleContent,
      summary: summary.slice(0, 500), // Ensure reasonable summary length
      metaDescription: metaDescription.slice(0, 160),
      imageUrl,
      tokensIn,
      tokensOut,
      model
    };

  } catch (err) {
    logger.error({ 
      err: err.message, 
      status: err.response?.status,
      responseData: err.response?.data,
      languageCode, 
      topic: topic.slice(0, 50) 
    }, 'AI API call failed');
    
    // Provide more specific error handling
    if (err.response?.status === 401) {
      throw new Error('Invalid API key for 1min.ai');
    } else if (err.response?.status === 429) {
      throw new Error('Rate limit exceeded on 1min.ai API');
    } else if (err.response?.status === 400) {
      throw new Error('Invalid request format for 1min.ai API');
    }
    
    throw err;
  }
}

// Helper function for image generation
async function generateImage({ topic, categoryName, languageCode }) {
  try {
    const imagePrompt = `Create a professional, high-quality image for an article about "${topic}" in the ${categoryName} category. Style: modern, clean, professional, suitable for web publication. No text overlay.`;
    
    const requestPayload = {
      type: API_TYPES.IMAGE_GENERATOR,
      model: AVAILABLE_MODELS.MIDJOURNEY,
      promptObject: {
        prompt: imagePrompt,
        num_outputs: 1,
        aspect_ratio: "16:9", // Good for article headers
        quality: "high"
      }
    };

    const response = await axios.post(
      `${config.ai.baseUrl.replace(/\/$/, '')}/api/features`,
      requestPayload,
      { 
        headers: { 
          'Content-Type': 'application/json',
          'API-KEY': config.ai.apiKey
        },
        timeout: 60_000
      }
    );

    return {
      imageUrl: response.data?.imageUrl || response.data?.images?.[0]?.url || null
    };
  } catch (err) {
    logger.warn({ err }, 'Image generation failed');
    return { imageUrl: null };
  }
}

// Export available models and types for configuration
export { AVAILABLE_MODELS, API_TYPES, LANGUAGE_MODEL_MAP, WRITING_STYLES };