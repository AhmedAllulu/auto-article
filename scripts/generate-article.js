#!/usr/bin/env node
// Minimal CLI to generate an article using the same settings/prompt as the app
// Usage examples:
//   node scripts/generate-article.js --language en --category Technology --topic "AI Tools for Content Creation"
//   node scripts/generate-article.js -l ar -c Finance -t "إدارة المخاطر في الشركات الناشئة"

import dotenv from 'dotenv';
dotenv.config();

import { generateArticleViaAPI } from '../src/services/aiClient.js';
import config, { getLanguageConfig, getCategoryConfig } from '../src/config/env.js';
import { discoverSpecificTrends } from '../src/services/trendsService.js';
import readline from 'readline';

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    const isFlag = token.startsWith('--') || token.startsWith('-');
    if (!isFlag) { args._.push(token); continue; }

    const key = token.replace(/^--?/, '');
    // Handle boolean flags
    if (key === 'web-search' || key === 'json') {
      args[key === 'web-search' ? 'webSearch' : 'json'] = true;
      continue;
    }

    // Key-value flags
    const next = argv[i + 1];
    if (next && !next.startsWith('-')) {
      if (['language','l'].includes(key)) args.language = next;
      else if (['category','c'].includes(key)) args.category = next;
      else if (['topic','t'].includes(key)) args.topic = next;
      else if (['type'].includes(key)) args.type = next; // SEO_ARTICLE | NEWS_ARTICLE | BLOG_POST | TECHNICAL_GUIDE
      else if (['max-words'].includes(key)) args.maxWords = Number(next);
      else if (['audience'].includes(key)) args.audience = next;
      else if (['keywords'].includes(key)) args.keywords = next;
      i++;
    } else {
      // Flags provided without value but expected a value; ignore gracefully
    }
  }
  return args;
}

function coerceKeywords(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  return String(input)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function printHuman(result) {
  const { title, metaDescription, summary, content, model, tokensIn, tokensOut } = result;
  console.log('Model:', model);
  if (typeof tokensIn !== 'undefined') console.log('Tokens in:', tokensIn);
  if (typeof tokensOut !== 'undefined') console.log('Tokens out:', tokensOut);
  console.log('');
  console.log(`# ${title}`);
  if (metaDescription) {
    console.log('');
    console.log('Meta Description:');
    console.log(metaDescription);
  }
  if (summary) {
    console.log('');
    console.log('Summary:');
    console.log(summary);
  }
  console.log('');
  console.log('---');
  console.log(String(content || '').trim());
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  let languageCode = args.language || args.l;
  let categorySlug = args.category || args.c;
  let selectedTopic = args.topic || args.t;

  // Interactive mode when language/category not provided
  if (!languageCode || !categorySlug) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ask = (q) => new Promise((resolve) => rl.question(q, (ans) => resolve(ans)));

    try {
      // 1) Language selection
      const availableLanguages = config.languages || ['en', 'de', 'fr', 'es', 'pt', 'ar', 'hi'];
      console.log('Select a language:');
      availableLanguages.forEach((code, idx) => {
        console.log(`${idx + 1}. ${code}`);
      });
      const langAnswer = await ask('Enter number of your choice: ');
      const langIdx = Math.max(0, Math.min(availableLanguages.length - 1, (parseInt(langAnswer, 10) || 1) - 1));
      languageCode = availableLanguages[langIdx];

      // 2) Category selection
      const categories = config.topCategories || ['technology','finance','business','health','travel','sports','entertainment'];
      console.log('\nSelect a category:');
      categories.forEach((slug, idx) => {
        const name = slug.charAt(0).toUpperCase() + slug.slice(1);
        console.log(`${idx + 1}. ${name} (${slug})`);
      });
      const catAnswer = await ask('Enter number of your choice: ');
      const catIdx = Math.max(0, Math.min(categories.length - 1, (parseInt(catAnswer, 10) || 1) - 1));
      categorySlug = categories[catIdx];

      // 3) Auto-pick a trending topic for the chosen language/category
      console.log(`\nFetching trending topics for ${languageCode}/${categorySlug}...`);
      const topics = await discoverSpecificTrends(languageCode, categorySlug);
      if (Array.isArray(topics) && topics.length > 0) {
        selectedTopic = topics[0].topic;
        console.log(`Selected trending topic: ${selectedTopic}`);
      } else {
        selectedTopic = `Latest ${categorySlug} trends and insights`;
        console.log('No AI trends available. Using fallback topic:', selectedTopic);
      }

      rl.close();
    } catch (err) {
      rl.close();
      throw err;
    }
  }

  // Non-interactive overrides
  const contentType = args.type || 'SEO_ARTICLE';
  const maxWords = Number.isFinite(args.maxWords) ? args.maxWords : config.generation?.maxWordsPerArticle || 1200;
  const targetAudience = args.audience || 'general web readers';
  const keywords = coerceKeywords(args.keywords);
  let modelOverride = args.model || null; // e.g., deepseek-chat, gpt-4o-mini

  // Derive web search preference from config for the chosen language/category unless explicitly set
  const langCfg = getLanguageConfig(languageCode);
  const catCfg = getCategoryConfig(categorySlug);
  let includeWebSearch = typeof args.webSearch === 'boolean'
    ? !!args.webSearch
    : !!(catCfg.enableWebSearch || langCfg.enableWebSearch);

  // Ask to enable web search (default yes) so the AI can fetch current data
  const rlForSearch = readline.createInterface({ input: process.stdin, output: process.stdout });
  const askSearch = (q) => new Promise((resolve) => rlForSearch.question(q, (ans) => resolve(ans)));
  const defaultSearch = includeWebSearch ? 'Y' : 'Y';
  const ans = await askSearch(`\nEnable web search for fresher, trending results? [Y/n] (default ${defaultSearch}): `);
  rlForSearch.close();
  const normalized = String(ans || defaultSearch).trim().toLowerCase();
  includeWebSearch = !(normalized === 'n' || normalized === 'no');

  // Interactive model selection if not provided
  if (!modelOverride) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ask = (q) => new Promise((resolve) => rl.question(q, (ans) => resolve(ans)));
    const modelChoices = ['deepseek-chat', 'gpt-4o-mini'];
    console.log('\nSelect a model:');
    modelChoices.forEach((m, idx) => console.log(`${idx + 1}. ${m}${m === 'deepseek-chat' ? ' (cheapest)' : ''}`));
    const modelAns = await ask('Enter number of your choice: ');
    const modelIdx = Math.max(0, Math.min(modelChoices.length - 1, (parseInt(modelAns, 10) || 1) - 1));
    modelOverride = modelChoices[modelIdx];
    rl.close();
  }

  try {
    const result = await generateArticleViaAPI({
      topic: selectedTopic,
      languageCode,
      categoryName: categorySlug,
      categorySlug,
      contentType,
      targetAudience,
      keywords,
      includeWebSearch,
      generateImage: false,
      maxWords,
      modelOverride
    });

    if (args.json) {
      console.log(JSON.stringify({
        languageCode,
        categorySlug,
        topic: selectedTopic,
        contentType,
        includeWebSearch,
        ...result
      }, null, 2));
    } else {
      printHuman(result);
    }
  } catch (err) {
    const message = err?.message || String(err);
    console.error('Generation failed:', message);
    if (err?.response?.data) {
      try { console.error('Response (truncated):', JSON.stringify(err.response.data).slice(0, 800)); } catch (_) {}
    }
    process.exit(1);
  }
}

main();


