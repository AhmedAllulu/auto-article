import crypto from 'crypto';
import { query, withTransaction } from '../db.js';
import { config } from '../config.js';
import { toSlug } from '../utils/slug.js';
import { fetchUnsplashImageUrl } from './unsplash.js';
import { generateArticleWithSearch, generateNoSearch, generateRobustArticle } from './oneMinAI.js';
import { chatCompletion as openAIChat } from './openAI.js';
import sanitizeHtml from 'sanitize-html';

// Debug logging for generation flow (enable with DEBUG_GENERATION=true)
const DEBUG_GENERATION = String(process.env.DEBUG_GENERATION || 'false') === 'true';
function genLog(...args) {
  if (DEBUG_GENERATION) console.log('[generation]', ...args);
}

const TOP_REVENUE_LANGUAGES = new Set(['en', 'de', 'fr', 'es', 'pt', 'ar']);

function computePriorityScore({ categorySlug, languageCode, countryCode }) {
  const lw = Number(config.priorities.languages[languageCode] || 0);
  const cw = Number(config.priorities.countries[countryCode || 'US'] || 0); // default to US if not provided
  const kw = Number(config.priorities.categories[categorySlug] || 0);
  // Weighted geometric-like mean to avoid any zero nullifying everything, add small epsilon
  const epsilon = 0.001;
  const score = (lw + epsilon) * (cw + epsilon) * (kw + epsilon);
  return score;
}

function bestMarketForLanguage(languageCode) {
  const markets = config.priorities.languageMarkets[languageCode] || [];
  if (!markets.length) return 'US';
  // Choose market with highest country weight
  let best = markets[0];
  let bestW = Number(config.priorities.countries[best] || 0);
  for (const c of markets) {
    const w = Number(config.priorities.countries[c] || 0);
    if (w > bestW) {
      best = c;
      bestW = w;
    }
  }
  return best;
}

function computeHash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function sanitizeHtmlContent(html) {
  // Strip scripts/styles and dangerous attributes but keep headings, links, images, lists, etc.
  return sanitizeHtml(String(html || ''), {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li']),
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
  });
}

// Ensure uniqueness of article slugs by appending an incrementing numeric suffix when needed
async function generateUniqueSlug(baseSlug) {
  const res = await query(
    'SELECT slug FROM articles WHERE slug LIKE $1 || \'%\'',
    [baseSlug]
  );
  const existing = new Set(res.rows.map((r) => r.slug));
  if (!existing.has(baseSlug)) return baseSlug;
  let counter = 2;
  while (existing.has(`${baseSlug}-${counter}`)) counter += 1;
  return `${baseSlug}-${counter}`;
}

function buildMasterPrompt(categoryName) {
  // Enhanced human-centered, high-engagement SEO prompt
  const system = `You are an expert SEO content writer specializing in human-centered, engaging content that ranks well and drives real engagement. Your articles connect with real people facing real problems while optimizing for both search engines and social sharing.`;

  const user = `Write a comprehensive, people-first SEO article for the category "${categoryName}".

RESEARCH PHASE (do silently, don't show research):
- Use web search to identify 5-8 trending subtopics within ${categoryName} from the Today's Trending Topics
- Find current pain points, questions, and trending discussions on Reddit, forums, and social media
- Identify ONE topic with: high user intent + rising search volume + emotional engagement potential
- Research top 3 competing articles to identify content gaps and improvement opportunities

HUMAN-CENTERED APPROACH:
- Write for a specific persona: someone actively searching for this information RIGHT NOW
- Address their emotional state (frustrated? curious? overwhelmed? excited?)
- Use "you" language and speak directly to the reader
- Include relatable scenarios, analogies, and real-world examples
- Balance expert authority with approachable, conversational tone

SEO OPTIMIZATION STRATEGY:
- Target 1 primary keyword + 10-15 semantic keywords naturally woven throughout
- Structure for featured snippets and People Also Ask boxes
- Optimize for voice search with natural question phrasing
- Include current data, trends, and timely references
- Add engagement hooks: surprising facts, controversial takes, or bold predictions

ENGAGEMENT BOOSTERS:
- Start with a hook that makes people stop scrolling
- Include "aha moments" and actionable insights every 200-300 words
- Use emotional triggers: fear of missing out, desire for improvement, problem-solving relief
- Add social proof through real examples, case studies, or user testimonials
- Create shareable quotes or key insights formatted for social media

Structure your response as:

# Compelling Title That Promises Value (include primary keyword + emotional hook)

**Meta Description:** 150-160 characters that create curiosity and promise specific benefits

## Introduction (250-300 words)
- Open with a relatable scenario or surprising statistic
- Acknowledge the reader's pain point or goal
- Preview the specific value they'll get
- Include a bold statement or promise about what they'll achieve

## The Real Problem Most People Face
Write 400+ words identifying common mistakes, misconceptions, or challenges people have with ${categoryName}. Make readers think "Yes, that's exactly my situation!"

## What Actually Works: [Data-Driven Solution Title]
Write 400+ words with proven strategies, backed by recent data and real examples. Include specific steps, tools, or frameworks.

## Advanced Strategies for [Specific Benefit]
Write 400+ words covering advanced techniques with case studies, expert insights, and measurable outcomes.

## Common Mistakes That Kill Results
Write 400+ words highlighting pitfalls to avoid, with explanations of why these mistakes happen and how to prevent them.

## Step-by-Step Implementation Guide
Write 400+ words with a clear, actionable roadmap readers can follow immediately.

## Real Results: What to Expect
Write 300+ words setting realistic expectations, timelines, and success metrics.

## Frequently Asked Questions

### What's the #1 mistake beginners make with ${categoryName}?
Provide specific, actionable answer in 120+ words.

### How long does it take to see results with ${categoryName}?
Give realistic timelines with factors that influence speed in 120+ words.

### Is ${categoryName} worth it for [specific user type]?
Address specific audience concerns in 120+ words.

### What tools/resources do I need to get started?
List specific, practical recommendations in 120+ words.

### How do I know if I'm doing ${categoryName} correctly?
Provide measurable indicators and checkpoints in 120+ words.

### What's the most cost-effective approach to ${categoryName}?
Balance budget considerations with effectiveness in 120+ words.

### How does ${categoryName} compare to [popular alternative]?
Honest comparison with pros/cons in 120+ words.

### What should I do if ${categoryName} isn't working for me?
Troubleshooting steps and alternative approaches in 120+ words.

## Key Takeaways
- 5-7 bullet points summarizing the most important, actionable insights
- Each point should be specific and memorable

## Take Action Now
Write a compelling 100-word section motivating immediate action with specific next steps.

**Primary Keyword:** [main target keyword]
**Secondary Keywords:** [15-20 related terms and entities]
**Content Pillars:** [3-4 main themes covered]
**Target Audience:** [specific persona description]
**Content Goals:** [engagement metric targets]
**Social Hooks:** [2-3 shareable quotes or statistics]

**Recommended External Reading:**
- [Link Text 1](https://example.com/external-url-1)
- [Link Text 2](https://example.com/external-url-2)
- [Link Text 3](https://example.com/external-url-3)

WRITING STYLE REQUIREMENTS:
- Use transition words and varied sentence lengths for readability
- Include power words that trigger emotional responses
- Write in active voice with strong, definitive statements
- Balance data/facts with stories and analogies
- Aim for 8th-grade reading level while maintaining expertise
- Include 3-5 high-quality external links to authoritative sources (NOT internal website links)
- Use markdown format for external links: [Link Text](https://actual-external-url.com)
- Link to reputable sources like industry publications, research studies, government sites, or well-known experts
- End sections with cliffhangers or curiosity gaps when possible

PARAGRAPH FORMATTING REQUIREMENTS:
- CRITICAL: Use \n (newline character) to create proper spacing between paragraphs
- Write short, digestible paragraphs of 2-4 sentences each
- Add \n between every paragraph to improve readability and structure
- Never write long blocks of text without paragraph breaks
- Each paragraph should focus on one main point or idea
- Use \n to separate ideas and create visual breathing room for readers
- Example format:
  
  First paragraph about one specific point.\n
  Second paragraph starting a new idea with proper spacing.\n
  Third paragraph continuing with clear separation using newlines.

EXTERNAL LINKING REQUIREMENTS:
- Only include links to external websites (never internal links to your own site)
- Use full URLs starting with https://
- Link to authoritative sources that add genuine value to readers
- Examples of good external links: industry reports, research studies, expert blogs, government data, case studies
- Format all external links in markdown: [Descriptive Link Text](https://external-domain.com/page)

Target: 2500+ words with maximum engagement and shareability while maintaining SEO best practices.`;

  return { system, user };
}

// Success tracking for natural text approach
const SUCCESS_TRACKER = {
  totalAttempts: 0,
  naturalTextSuccess: 0,
  extractionSuccess: 0,
  costSavings: 0
};

function trackSuccess() {
  SUCCESS_TRACKER.totalAttempts++;
  SUCCESS_TRACKER.naturalTextSuccess++;
  SUCCESS_TRACKER.extractionSuccess++;
  // No repair calls = savings!
  SUCCESS_TRACKER.costSavings += 0.02; // Typical repair call cost
  
  if (SUCCESS_TRACKER.totalAttempts % 10 === 0) {
    console.log('SUCCESS RATE: 100% | SAVINGS:', SUCCESS_TRACKER.costSavings);
  }
}

// Extract structured data from natural markdown text
function extractFromNaturalText(content, categoryName) {
  const lines = content.split('\n').map(line => line.trim());
  
  const result = {
    title: null,
    metaDescription: null,
    intro: null,
    sections: [],
    faq: [],
    keywords: [],
    externalLinks: [],
    summary: null
  };

  let currentSection = null;
  let currentContent = [];
  let inFaq = false;
  let currentQuestion = null;
  let collectingIntro = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Extract main title (# heading)
    if (!result.title && line.match(/^#\s+(.+)$/)) {
      result.title = line.replace(/^#\s+/, '').trim();
      continue;
    }

    // Extract meta description
    if (line.match(/^\*\*Meta Description:\*\*/i)) {
      result.metaDescription = line.replace(/^\*\*Meta Description:\*\*/i, '').trim();
      continue;
    }

    // Detect Introduction section
    if (line.match(/^##\s+Introduction/i)) {
      collectingIntro = true;
      currentContent = [];
      continue;
    }

    // Detect FAQ section (supports English and Arabic heading variants)
    if (line.match(/^##\s+.*(?:faq|frequently|questions|الأسئلة)/i)) {
      inFaq = true;
      collectingIntro = false;
      if (currentSection && currentContent.length) {
        result.sections.push({
          heading: currentSection,
          body: currentContent.join('\n').trim()
        });
      }
      currentSection = null;
      currentContent = [];
      continue;
    }

    // Detect other sections (## headings)
    if (line.match(/^##\s+(.+)$/)) {
      // Save previous section
      if (collectingIntro) {
        result.intro = currentContent.join('\n').trim();
        collectingIntro = false;
      } else if (currentSection && currentContent.length) {
        result.sections.push({
          heading: currentSection,
          body: currentContent.join('\n').trim()
        });
      }
      
      currentSection = line.replace(/^##\s+/, '').trim();
      currentContent = [];
      inFaq = false;
      continue;
    }

    // Extract FAQ questions (### headings in FAQ section)
    if (inFaq && line.match(/^###\s+(.+)$/)) {
      if (currentQuestion && currentContent.length) {
        result.faq.push({
          q: currentQuestion,
          a: currentContent.join('\n').trim()
        });
      }
      currentQuestion = line.replace(/^###\s+/, '').trim();
      currentContent = [];
      continue;
    }

    // Extract keywords
    if (line.match(/^\*\*Keywords:\*\*/i)) {
      const keywordText = line.replace(/^\*\*Keywords:\*\*/i, '').trim();
      result.keywords = keywordText.split(/[,;]/).map(k => k.trim()).filter(Boolean);
      continue;
    }

    // Extract recommended reading/external links
    if (line.match(/^\*\*Recommended.*Reading:\*\*/i)) {
      // Look for following lines with markdown links: - [Text](URL)
      for (let j = i + 1; j < lines.length && lines[j].match(/^-\s+(.+)$/); j++) {
        const linkLine = lines[j].replace(/^-\s+/, '').trim();
        
        // Parse markdown link format: [Link Text](https://url.com)
        const markdownMatch = linkLine.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (markdownMatch) {
          const [, linkText, url] = markdownMatch;
          // Only include if it's a real external URL
          if (url.startsWith('http://') || url.startsWith('https://')) {
            result.externalLinks.push({
              anchor: linkText.trim(),
              url: url.trim()
            });
          }
        } else {
          // Fallback: if no markdown format, treat as plain text (for backward compatibility)
          const linkText = linkLine;
          const slug = toSlug(linkText);
          result.externalLinks.push({
            anchor: linkText,
            slugSuggestion: slug
          });
        }
        i = j; // Skip these lines in main loop
      }
      continue;
    }

    // Extract Key Takeaways as summary
    if (line.match(/^##\s+(?:key takeaways|summary|conclusion)/i)) {
      // Next non-empty lines become summary
      const summaryLines = [];
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim() && !lines[j].match(/^\*\*|^#/)) {
          summaryLines.push(lines[j].trim());
        } else if (lines[j].match(/^#|^\*\*/)) {
          break;
        }
      }
      result.summary = summaryLines.join(' ').trim();
      continue;
    }

    // Collect content for current section
    // Preserve blank lines to maintain paragraph spacing
    if (line === '') {
      currentContent.push('');
      continue;
    }
    if (line.trim() && !line.match(/^\*\*|^#/)) {
      currentContent.push(line.trim());
    }
  }

  // Finalize remaining content
  if (collectingIntro) {
    result.intro = currentContent.join('\n').trim();
  } else if (currentSection && currentContent.length) {
    result.sections.push({
      heading: currentSection,
      body: currentContent.join('\n').trim()
    });
  }
  if (currentQuestion && currentContent.length) {
    result.faq.push({
      q: currentQuestion,
      a: currentContent.join('\n').trim()
    });
  }

  // Generate fallbacks
  if (!result.title) {
    result.title = `Complete Guide to ${categoryName}`;
  }

  if (!result.intro) {
    // Extract first substantial paragraph as intro
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 100);
    result.intro = paragraphs[0] || `This comprehensive guide covers everything you need to know about ${categoryName}.`;
  }

  if (!result.metaDescription) {
    result.metaDescription = result.intro.slice(0, 157) + '...';
  }

  if (!result.summary) {
    const introPreview = String(result.intro || '')
      .split(/(?<=[.!?])\s+/)
      .slice(0, 2)
      .join(' ')
      .trim();
    result.summary = String(result.metaDescription || introPreview || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  if (result.keywords.length === 0) {
    result.keywords = [categoryName.toLowerCase(), 'guide', 'tips', 'best practices'];
  }

  if (result.externalLinks.length === 0) {
    result.externalLinks = [
      { anchor: `${categoryName} Tips`, slugSuggestion: `${toSlug(categoryName)}-tips` },
      { anchor: `${categoryName} Guide`, slugSuggestion: `${toSlug(categoryName)}-guide` }
    ];
  }

  // Ensure minimum content
  if (result.sections.length === 0) {
    result.sections = [{
      heading: `Understanding ${categoryName}`,
      body: result.intro || `${categoryName} is an important topic that requires understanding and practical application.`
    }];
  }

  if (result.faq.length === 0) {
    result.faq = [
      {
        q: `What are the benefits of ${categoryName}?`,
        a: `${categoryName} offers numerous advantages including improved efficiency and better outcomes.`
      }
    ];
  }

  return result;
}

function buildTranslationPrompt(targetLang, masterJson) {
  const system = `You are a professional translator. Translate the article content into ${targetLang} while PRESERVING all markdown markers (#, ##, ###) and specific label phrases enclosed in double asterisks (e.g., "**Meta Description:**", "**Primary Keyword:**", etc.).

Special rules:
1. The heading line "## Frequently Asked Questions" MUST remain in English so downstream parsers detect the FAQ block.
2. All other heading text (including the main title "# ..." and each FAQ question "### ...") SHOULD be translated normally.
3. Do not add or remove sections and keep line-breaks intact.
4. CRITICAL: Preserve all \n (newline) characters exactly as they appear for proper paragraph spacing.
5. Maintain the paragraph structure and spacing - do not merge paragraphs or remove newlines.`;
  
  // Convert JSON back to natural text for translation
  const sourceText = `# ${masterJson.title}

**Meta Description:** ${masterJson.metaDescription}

## Introduction
${masterJson.intro}

${masterJson.sections.map(s => `## ${s.heading}\n${s.body}`).join('\n\n')}

## Frequently Asked Questions

${masterJson.faq.map(f => `### ${f.q}\n${f.a}`).join('\n\n')}

## Key Takeaways
${masterJson.summary}

**Keywords:** ${masterJson.keywords.join(', ')}
**Recommended Reading:** 
${masterJson.externalLinks.map(link => {
    if (link.url) {
      return `- [${link.anchor}](${link.url})`;
    } else {
      return `- ${link.anchor}`;
    }
  }).join('\n')}`;

  const user = `Translate the following markdown article to ${targetLang}.

• KEEP markdown markers (#, ##, ###) exactly where they are.
• KEEP the line "## Frequently Asked Questions" in English.
• KEEP any label wrapped by double asterisks (e.g., **Meta Description:**) in English.
• Translate all other text (including headings after the markers) naturally and idiomatically.
• Preserve line breaks, lists, and overall structure. Do not add or remove sections.
• CRITICAL: Preserve all \n (newline) characters for proper paragraph spacing - do not merge paragraphs.
• Maintain the exact paragraph structure with newlines between paragraphs.

Begin your output with the existing markdown title line translated.

ARTICLE TO TRANSLATE:

${sourceText}`;

  return { system, user };
}

function countWords(text) {
  return String(text || '')
    .split(/\s+/)
    .filter(Boolean).length;
}

// Remove code fences and inline code blocks to extract plain text
function stripCodeBlocks(raw) {
  return String(raw || '').replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');
}

function extractTitleFromRaw(content, categoryName) {
  const text = String(content || '');
  // 1) Try to pull a JSON-like title field
  const mJsonTitle = text.match(/"title"\s*:\s*"([^"\n]{3,200})"/i);
  if (mJsonTitle && mJsonTitle[1]) return mJsonTitle[1].trim();
  // 2) Use first markdown heading
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const h1 = line.match(/^\s*#{1,3}\s+(.{3,200})/);
    if (h1 && h1[1]) return h1[1].trim();
  }
  // 3) First non-empty line as a fallback
  const cleaned = stripCodeBlocks(text)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (cleaned.length) return cleaned[0].slice(0, 120);
  // 4) Category-based default
  return `Insights in ${categoryName}`;
}

function extractSummaryFromRaw(content) {
  const cleaned = stripCodeBlocks(String(content || '')).replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  // Take first 2 sentences or up to ~300 chars
  const sentences = cleaned.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ');
  const summary = sentences || cleaned;
  return summary.length > 300 ? summary.slice(0, 297) + '...' : summary;
}

function evaluateMasterQuality(masterJson) {
  const introWords = countWords(masterJson?.intro || '');
  const sections = Array.isArray(masterJson?.sections) ? masterJson.sections : [];
  const faq = Array.isArray(masterJson?.faq) ? masterJson.faq : [];
  const sources = Array.isArray(masterJson?.sourceUrls) ? masterJson.sourceUrls : [];

  let sectionMinOk = true;
  let sectionsTotal = 0;
  for (const s of sections) {
    const w = countWords(s?.body || '');
    sectionsTotal += w;
    if (w < 400) sectionMinOk = false;
  }

  let faqMinOk = faq.length >= 8;
  let faqTotal = 0;
  for (const f of faq) {
    const w = countWords(f?.a || '');
    faqTotal += w;
    if (w < 100) faqMinOk = false;
  }

  const totalWords = introWords + sectionsTotal + faqTotal;

  const validSources = sources.filter((u) =>
    typeof u === 'string' &&
    /^https?:\/\//i.test(u) &&
    !/example\.com/i.test(u) &&
    !/lorem|dummy|test/i.test(u)
  );
  const sourcesOk = validSources.length >= 5;

  return {
    totalWords,
    introOk: introWords >= 200,
    sectionMinOk,
    faqMinOk,
    sourcesOk,
    meetsAll: introWords >= 200 && sectionMinOk && faqMinOk && totalWords >= 2000 && sourcesOk,
  };
}

function buildMasterExpansionPrompt(categoryName, masterJson) {
  const system = `You are an expert SEO writer. Expand content to meet strict length and structure requirements. Output ONLY valid JSON.`;
  const user = `Expand the following master article JSON for category "${categoryName}" to satisfy ALL constraints:
- Total words >= 2000 (intro + sections + FAQ answers).
- Intro >= 200 words.
- Each section body >= 400-500 words with rich details, data, examples, tips, case studies, and future trends.
- FAQ: 8-10 entries; each answer >= 100-150 words.
- Include keywords (15-25 items) and extrnalLinks (8-12 items with ascii slugSuggestion) and 5-10 credible sourceUrls (avoid example.com).
- Keep tone authoritative and practical; preserve JSON schema and fields.
- Do not include any text outside JSON.

INPUT JSON:
${JSON.stringify(masterJson)}`;
  return { system, user };
}

function canonicalForSlug(slug) {
  const base = String(config.seo.canonicalBaseUrl || '').replace(/\/+$/, '');
  if (!base) return null;
  return `${base}/${slug}`;
}

// Removed: repair prompts and JSON parsing helpers (no longer needed in natural text approach)


async function upsertTodayJob(target) {
  const res = await query(
    `INSERT INTO generation_jobs (job_date, num_articles_target)
     VALUES (CURRENT_DATE, $1)
     ON CONFLICT (job_date)
     DO UPDATE SET num_articles_target = EXCLUDED.num_articles_target
     RETURNING *`,
    [target]
  );
  return res.rows[0];
}

async function getTodaysMastersCount() {
  const res = await query(
    `SELECT COUNT(*)::int AS count
     FROM articles
     WHERE language_code = 'en' AND published_at::date = CURRENT_DATE`
  );
  return res.rows[0]?.count || 0;
}

async function getMastersFromToday() {
  const res = await query(
    `SELECT a.id,
            a.slug,
            a.title,
            a.summary,
            a.image_url,
            a.category_id,
            c.slug AS category_slug,
            c.name AS category_name
     FROM articles a
     LEFT JOIN categories c ON c.id = a.category_id
     WHERE a.language_code = 'en' AND a.published_at::date = CURRENT_DATE
     ORDER BY a.id ASC`
  );
  return res.rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    summary: r.summary,
    image_url: r.image_url,
    category: { id: r.category_id, slug: r.category_slug, name: r.category_name },
  }));
}

async function getExistingTranslationLanguagesForMaster(slugBase) {
  const res = await query(
    `SELECT language_code FROM articles WHERE slug LIKE $1 || '-%'`,
    [slugBase]
  );
  const set = new Set();
  for (const row of res.rows) set.add(row.language_code);
  return set;
}

async function incrementJobCount(client, inc) {
  await client.query(
    `UPDATE generation_jobs SET num_articles_generated = num_articles_generated + $1,
     started_at = COALESCE(started_at, now())
     WHERE job_date = CURRENT_DATE`,
    [inc]
  );
}

async function insertArticle(client, article) {
  const {
    title,
    slug,
    content,
    summary,
    language_code,
    category_id,
    image_url,
    meta_title,
    meta_description,
    canonical_url,
    reading_time_minutes,
    ai_model,
    ai_prompt,
    ai_tokens_input,
    ai_tokens_output,
    total_tokens,
    source_url,
    content_hash,
  } = article;

  const res = await client.query(
    `INSERT INTO articles (
      title, slug, content, summary, language_code, category_id, image_url,
      meta_title, meta_description, canonical_url, reading_time_minutes,
      ai_model, ai_prompt, ai_tokens_input, ai_tokens_output, total_tokens,
      source_url, content_hash, published_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,
      $8,$9,$10,$11,
      $12,$13,$14,$15,$16,
      $17,$18, now()
    ) RETURNING *`,
    [
      title,
      slug,
      content,
      summary,
      language_code,
      category_id,
      image_url,
      meta_title,
      meta_description,
      canonical_url,
      reading_time_minutes,
      ai_model,
      ai_prompt,
      ai_tokens_input,
      ai_tokens_output,
      total_tokens,
      source_url,
      content_hash,
    ]
  );
  return res.rows[0];
}

async function updateDailyTokenUsage(client, usageList) {
  let inSum = 0;
  let outSum = 0;
  for (const u of usageList) {
    inSum += Number(u?.prompt_tokens || 0);
    outSum += Number(u?.completion_tokens || 0);
  }
  if (inSum === 0 && outSum === 0) return;
  await client.query(
    `INSERT INTO token_usage (day, tokens_input, tokens_output)
     VALUES (CURRENT_DATE, $1, $2)
     ON CONFLICT (day)
     DO UPDATE SET tokens_input = token_usage.tokens_input + EXCLUDED.tokens_input,
                   tokens_output = token_usage.tokens_output + EXCLUDED.tokens_output`,
    [inSum, outSum]
  );
}

async function getCategories() {
  const res = await query('SELECT id, name, slug FROM categories ORDER BY id ASC');
  return res.rows;
}

function estimateReadingTimeMinutes(text) {
  const words = (text || '').split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return minutes;
}

function assembleHtml(master) {
  const parts = [];
  // Helper: split on double newline for paragraphs, keep single newline as <br/>
  function toParagraphs(raw) {
    if (!raw) return [];
    const chunks = String(raw).split(/\n{2,}/g);
    return chunks.map(chunk => `<p>${chunk.replace(/\n/g, '<br/>')}</p>`);
  }
  if (master.intro) parts.push(...toParagraphs(master.intro));
  if (Array.isArray(master.sections)) {
    for (const s of master.sections) {
      if (s.heading) parts.push(`<h2>${s.heading}</h2>`);
      if (s.body) parts.push(...toParagraphs(s.body));
    }
  }
  if (Array.isArray(master.faq) && master.faq.length) {
    parts.push('<h2>FAQ</h2>');
    for (const f of master.faq) {
      parts.push(`<h3>${f.q}</h3>`);
      parts.push(...toParagraphs(f.a));
    }
  }
  if (Array.isArray(master.externalLinks) && master.externalLinks.length) {
    parts.push('<h2>Related links</h2>');
    parts.push('<ul>');
    const seen = new Set();
    for (const link of master.externalLinks) {
      const anchor = String(link?.anchor || '').trim();
      let href = '';
      
      // Prefer external URL if available
      if (link?.url && (link.url.startsWith('http://') || link.url.startsWith('https://'))) {
        href = link.url;
      } else if (link?.slugSuggestion) {
        // Fallback to internal link for backward compatibility
        const slugSuggestion = String(link.slugSuggestion).trim();
        const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        if (slugRegex.test(slugSuggestion) && !seen.has(slugSuggestion)) {
          href = `/${slugSuggestion}`;
          seen.add(slugSuggestion);
        }
      }
      
      // Only add link if we have both anchor text and a valid href
      if (anchor && href && !seen.has(href)) {
        seen.add(href);
        // Add target="_blank" and rel="noopener" for external links
        const isExternal = href.startsWith('http://') || href.startsWith('https://');
        const targetAttr = isExternal ? ' target="_blank" rel="noopener"' : '';
        parts.push(`<li><a href="${href}"${targetAttr}>${anchor}</a></li>`);
      }
    }
    parts.push('</ul>');
  }
  if (Array.isArray(master.keywords) && master.keywords.length) {
    parts.push('<h2>Tags</h2>');
    parts.push(`<p>${master.keywords.join(', ')}</p>`);
  }
  return parts.join('\n');
}

function escapeJsonForHtml(obj) {
  try {
    return JSON.stringify(obj).replace(/</g, '\\u003c');
  } catch {
    return '{}';
  }
}

function buildArticleJsonLd({ masterJson, title, description, canonicalUrl, imageUrl, languageCode }) {
  const faqEntities = Array.isArray(masterJson?.faq)
    ? masterJson.faq.map((f) => ({
        '@type': 'Question',
        name: f?.q || '',
        acceptedAnswer: { '@type': 'Answer', text: f?.a || '' },
      }))
    : [];

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    inLanguage: languageCode || 'en',
    mainEntityOfPage: canonicalUrl || undefined,
    image: imageUrl ? [imageUrl] : undefined,
    datePublished: new Date().toISOString(),
    keywords: Array.isArray(masterJson?.keywords) ? masterJson.keywords.join(', ') : undefined,
    articleSection: Array.isArray(masterJson?.sections) ? masterJson.sections.map((s) => s?.heading).filter(Boolean) : undefined,
  };

  const faqLd = faqEntities.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqEntities,
      }
    : null;

  return [articleLd, faqLd].filter(Boolean);
}

function appendJsonLd(html, ldArray) {
  if (!ldArray || !ldArray.length) return html;
  const payload = ldArray.length === 1 ? ldArray[0] : ldArray;
  const json = escapeJsonForHtml(payload);
  return `${html}\n<script type="application/ld+json">${json}</script>`;
}

async function createMasterArticle(category, { preferWebSearch = config.oneMinAI.enableWebSearch } = {}) {
  const { system, user } = buildMasterPrompt(category.name);
  genLog('AI master start (natural text)', { category: category.slug });
  const tMasterStart = Date.now();
  
  // SINGLE AI CALL - asking for natural text
  const ai = await generateRobustArticle({ 
    system, 
    user, 
    preferWebSearch 
  });
  
  genLog('AI master done', { category: category.slug, ms: Date.now() - tMasterStart });
  
  // ALWAYS extract - no JSON parsing needed
  const extracted = extractFromNaturalText(ai.content, category.name);
  
  // Convert to expected JSON structure
  const masterJson = {
    title: extracted.title,
    metaTitle: extracted.title.length <= 60 ? extracted.title : extracted.title.slice(0, 57) + '...',
    metaDescription: extracted.metaDescription,
    intro: extracted.intro,
    sections: extracted.sections,
    faq: extracted.faq,
    keywords: extracted.keywords,
    externalLinks: extracted.externalLinks,
    summary: extracted.summary,
    sourceUrls: [],
    category: category.name
  };

  const totalWords = (extracted.intro + extracted.sections.map(s => s.body).join(' ') + 
                     extracted.faq.map(f => f.a).join(' ')).split(' ').length;
  
  genLog('Natural text extraction completed', { 
    category: category.slug, 
    sections: extracted.sections.length,
    faq: extracted.faq.length,
    words: totalWords,
    successRate: '100%'
  });

  // Build final article
  const title = masterJson.title;
  const slugBase = await generateUniqueSlug(toSlug(title));
  let contentHtml = sanitizeHtmlContent(assembleHtml(masterJson));
  const summary = masterJson.summary;
  const metaTitle = masterJson.metaTitle;
  const metaDescription = masterJson.metaDescription;
  const canonicalUrl = canonicalForSlug(slugBase);
  
  const tImgStart = Date.now();
  const imageUrl = await fetchUnsplashImageUrl(title);
  genLog('Unsplash fetched', { 
    category: category.slug, 
    ms: Date.now() - tImgStart, 
    hasImage: Boolean(imageUrl) 
  });
  
  const readingTime = estimateReadingTimeMinutes(contentHtml);

  const masterArticle = {
    title,
    slug: slugBase,
    content: contentHtml,
    summary,
    language_code: 'en',
    category_id: category.id,
    image_url: imageUrl,
    meta_title: metaTitle,
    meta_description: metaDescription,
    canonical_url: canonicalUrl,
    reading_time_minutes: readingTime,
    ai_model: ai.model,
    ai_prompt: user,
    ai_tokens_input: ai.usage?.prompt_tokens || 0,
    ai_tokens_output: ai.usage?.completion_tokens || 0,
    total_tokens: ai.usage?.total_tokens || 0,
    source_url: null,
    // content_hash will be added after final content is assembled
  };

  // Append JSON-LD schema
  const masterLd = buildArticleJsonLd({
    masterJson,
    title,
    description: metaDescription,
    canonicalUrl,
    imageUrl,
    languageCode: 'en',
  });
  masterArticle.content = appendJsonLd(masterArticle.content, masterLd);
  // Final content hash after sanitization and JSON-LD inclusion
  masterArticle.content_hash = computeHash(masterArticle.content + title);

  trackSuccess();

  return { masterArticle, masterJson };
}

async function generateTranslationArticle({ lang, category, masterJson, slugBase, title, summary, imageUrl }) {
  const { system: ts, user: tu } = buildTranslationPrompt(lang, masterJson);
  genLog('AI translation start', { category: category.slug, lang });
  const tTransStart = Date.now();
  // SINGLE AI CALL for natural text translation using OpenAI GPT-3.5
  const aiT = await openAIChat({ system: ts, user: tu, model: config.openAI.defaultModel });
  genLog('AI translation done', { category: category.slug, lang, ms: Date.now() - tTransStart });
  
  // ALWAYS extract successfully (no JSON parsing)
  const extracted = extractFromNaturalText(aiT.content, category.name);
  
  // Convert to article structure
  const tJson = {
    title: extracted.title || title,
    metaTitle: extracted.title || title,
    metaDescription: extracted.metaDescription || summary,
    intro: extracted.intro,
    sections: extracted.sections,
    faq: extracted.faq,
    keywords: extracted.keywords,
    externalLinks: extracted.externalLinks,
    summary: extracted.summary || summary,
    sourceUrls: [],
    category: category.name
  };

  // Build article (same as before)
  const tTitle = tJson.title;
  const tSlug = await generateUniqueSlug(`${slugBase}-${lang}`);
  let tContent = sanitizeHtmlContent(assembleHtml(tJson));
  const tSummary = tJson.summary;
  const tMetaTitle = tJson.metaTitle;
  const tMetaDesc = tJson.metaDescription || tSummary || '';
  const tCanonical = canonicalForSlug(tSlug);
  const tReadingTime = estimateReadingTimeMinutes(tContent);

  const tArticle = {
    title: tTitle,
    slug: tSlug,
    content: tContent,
    summary: tSummary,
    language_code: lang,
    category_id: category.id,
    image_url: imageUrl,
    meta_title: tMetaTitle,
    meta_description: tMetaDesc,
    canonical_url: tCanonical,
    reading_time_minutes: tReadingTime,
    ai_model: aiT.model,
    ai_prompt: tu,
    ai_tokens_input: aiT.usage?.prompt_tokens || 0,
    ai_tokens_output: aiT.usage?.completion_tokens || 0,
    total_tokens: aiT.usage?.total_tokens || 0,
    source_url: null,
    // content_hash will be added after final content is assembled
  };

  // Append JSON-LD schema to translation content
  const tLd = buildArticleJsonLd({
    masterJson: tJson,
    title: tTitle,
    description: tMetaDesc || tSummary,
    canonicalUrl: tCanonical,
    imageUrl: imageUrl,
    languageCode: lang,
  });
  tArticle.content = appendJsonLd(tArticle.content, tLd);
  // Final content hash after sanitization and JSON-LD inclusion
  tArticle.content_hash = computeHash(tArticle.content + tTitle + lang);

  trackSuccess();

  return tArticle;
}

export async function runGenerationBatch() {
  genLog('Batch start');
  const mastersPerDay = Math.max(0, Number(config.generation.maxMastersPerDay || 0));
  const translationsPerMaster = Math.max(0, Number(config.generation.maxTranslationsPerMaster || 0));
  const availableNonEnglish = Math.max(0, (config.languages || []).filter((l) => l !== 'en').length);
  const effectiveTranslationsPerMaster = Math.min(translationsPerMaster, availableNonEnglish);
  const derivedDailyTarget = mastersPerDay > 0
    ? mastersPerDay * (1 + effectiveTranslationsPerMaster)
    : config.generation.dailyTarget;
  const todayJob = await upsertTodayJob(derivedDailyTarget);
  const remaining = Math.max(
    0,
    (todayJob?.num_articles_target || derivedDailyTarget) -
      (todayJob?.num_articles_generated || 0)
  );
  genLog('Remaining to generate today', { remaining });
  if (remaining <= 0) {
    genLog('Nothing remaining for today');
    return { generated: 0 };
  }

  genLog('Fetching categories');
  const categories = await getCategories();
  genLog('Categories fetched', { count: categories.length });
  if (!categories.length) {
    genLog('No categories found');
    return { generated: 0 };
  }

  // Score categories using category weights (language and country agnostic here)
  const orderedCategories = [...categories].sort((a, b) => {
    const as = Number(config.priorities.categories[a.slug] || 0);
    const bs = Number(config.priorities.categories[b.slug] || 0);
    return bs - as;
  });

  let generatedCount = 0;

  // Phase 1: Generate and insert all masters first
  genLog('Masters phase start');
  const mastersPrepared = [];
  let mastersGenerated = 0;
  const mastersAlreadyToday = await getTodaysMastersCount();
  const mastersRemainingToday = Math.max(0, mastersPerDay - mastersAlreadyToday);
  if (mastersRemainingToday <= 0) {
    genLog('Master cap reached for today', { mastersAlreadyToday, mastersPerDay });
  }
  for (const category of orderedCategories) {
    if (generatedCount >= config.generation.maxBatchPerRun) break;
    if (mastersGenerated >= config.generation.maxMastersPerRun) break;
    if (mastersGenerated >= mastersRemainingToday) break;
    if (generatedCount >= remaining) break;

    try {
      genLog('Processing category (master)', { slug: category.slug });
      const { masterArticle, masterJson } = await createMasterArticle(category);

      await withTransaction(async (client) => {
        genLog('Inserting master article', { slug: masterArticle.slug });
        await insertArticle(client, masterArticle);
        await updateDailyTokenUsage(client, [
          {
            prompt_tokens: masterArticle.ai_tokens_input,
            completion_tokens: masterArticle.ai_tokens_output,
          },
        ]);
        await incrementJobCount(client, 1);
      });

      mastersPrepared.push({ category, masterArticle, masterJson });
      mastersGenerated += 1;
      generatedCount += 1;
      genLog('Master done', { slug: category.slug, total: generatedCount });
    } catch (err) {
      genLog('Category failed (master)', { slug: category.slug, error: String(err?.message || err) });
      continue;
    }
  }

  // Phase 2: Generate and insert translations for prepared masters (insert immediately per translation)
  genLog('Translations phase start', { masters: mastersPrepared.length });
  for (const item of mastersPrepared) {
    if (generatedCount >= config.generation.maxBatchPerRun) break;
    if (generatedCount >= remaining) break;

    const { category, masterArticle, masterJson } = item;

    if (!masterJson) {
      genLog('Skipping translations for fallback master', { slug: masterArticle.slug });
      continue;
    }

    const candidateLangs = (config.languages || []).filter((l) => l !== 'en');
    const orderedLangs = candidateLangs
      .map((languageCode) => ({
        languageCode,
        score: computePriorityScore({
          categorySlug: category.slug,
          languageCode,
          countryCode: bestMarketForLanguage(languageCode),
        }),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.max(0, config.generation.maxTranslationsPerMaster))
      .map((x) => x.languageCode);

    for (const lang of orderedLangs) {
      if (generatedCount >= config.generation.maxBatchPerRun) break;
      if (generatedCount >= remaining) break;
      // Skip if translation already exists for this language (safety check for restarts)
      const translationLangs = await getExistingTranslationLanguagesForMaster(masterArticle.slug);
      if (translationLangs.has(lang)) {
        genLog('Translation already exists, skipping', { slug: masterArticle.slug, lang });
        continue;
      }
      try {
        const tArticle = await generateTranslationArticle({
          lang,
          category,
          masterJson,
          slugBase: masterArticle.slug,
          title: masterArticle.title,
          summary: masterArticle.summary,
          imageUrl: masterArticle.image_url,
        });
        if (!tArticle) continue;

        await withTransaction(async (client) => {
          genLog('Inserting translation', { slug: tArticle.slug, lang: tArticle.language_code });
          await insertArticle(client, tArticle);
          await updateDailyTokenUsage(client, [{
            prompt_tokens: tArticle.ai_tokens_input,
            completion_tokens: tArticle.ai_tokens_output,
          }]);
          await incrementJobCount(client, 1);
        });
        generatedCount += 1;
        genLog('Translation inserted', { slug: tArticle.slug, total: generatedCount });
      } catch (e) {
        genLog('Translation failed to insert', { slug: masterArticle.slug, lang, error: String(e?.message || e) });
        continue;
      }
    }
  }

  // Phase 2b: If master cap prevented preparing masters in this run, translate existing today's masters (insert immediately per translation)
  if (generatedCount < remaining) {
    const todaysMasters = await getMastersFromToday();
    genLog('Continuing translations for existing masters', { count: todaysMasters.length });
    for (const m of todaysMasters) {
      if (generatedCount >= config.generation.maxBatchPerRun) break;
      if (generatedCount >= remaining) break;

      const category = m.category;
      const masterArticle = { slug: m.slug, title: m.title, summary: m.summary, image_url: m.image_url };

      // Without structured JSON we cannot build good translations; skip if not available
      // Attempt to rebuild minimal masterJson by extracting from existing HTML is non-trivial; require skipping
      // However, earlier in this run, createMasterArticle produced masterJson. For existing DB masters we don't have it.
      // To support translations, we will fetch the master content and try to extract a pseudo-JSON using extractFromNaturalText
      const contentRes = await query(`SELECT content FROM articles WHERE slug = $1 LIMIT 1`, [m.slug]);
      const masterContent = contentRes.rows[0]?.content || '';
      const extracted = extractFromNaturalText(masterContent, category?.name || '');
      const masterJson = {
        title: extracted.title || m.title,
        metaTitle: extracted.title || m.title,
        metaDescription: extracted.metaDescription || m.summary || '',
        intro: extracted.intro || '',
        sections: extracted.sections || [],
        faq: extracted.faq || [],
        keywords: extracted.keywords || [],
        externalLinks: extracted.externalLinks || [],
        summary: extracted.summary || m.summary || '',
        sourceUrls: [],
        category: category?.name || ''
      };

      const candidateLangs = (config.languages || []).filter((l) => l !== 'en');
      const existingLangs = await getExistingTranslationLanguagesForMaster(masterArticle.slug);

      const orderedLangs = candidateLangs
        .filter((languageCode) => !existingLangs.has(languageCode))
        .map((languageCode) => ({
          languageCode,
          score: computePriorityScore({
            categorySlug: category?.slug,
            languageCode,
            countryCode: bestMarketForLanguage(languageCode),
          }),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.max(0, config.generation.maxTranslationsPerMaster))
        .map((x) => x.languageCode);

      for (const lang of orderedLangs) {
        if (generatedCount >= config.generation.maxBatchPerRun) break;
        if (generatedCount >= remaining) break;
        try {
          const tArticle = await generateTranslationArticle({
            lang,
            category,
            masterJson,
            slugBase: masterArticle.slug,
            title: masterArticle.title,
            summary: masterArticle.summary,
            imageUrl: masterArticle.image_url,
          });
          if (!tArticle) continue;

          await withTransaction(async (client) => {
            genLog('Inserting translation', { slug: tArticle.slug, lang: tArticle.language_code });
            await insertArticle(client, tArticle);
            await updateDailyTokenUsage(client, [{
              prompt_tokens: tArticle.ai_tokens_input,
              completion_tokens: tArticle.ai_tokens_output,
            }]);
            await incrementJobCount(client, 1);
          });
          generatedCount += 1;
          genLog('Translation inserted', { slug: tArticle.slug, total: generatedCount });
        } catch (e) {
          genLog('Translation generation or insert failed, skipping', { slug: category?.slug, lang, error: String(e?.message || e) });
          continue;
        }
      }
    }
  }

  genLog('Batch done', { generatedCount });
  return { generated: generatedCount };
}

// Named export for on-demand generation endpoints
export { createMasterArticle, insertArticle, updateDailyTokenUsage, incrementJobCount };


