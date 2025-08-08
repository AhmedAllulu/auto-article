import cron from 'node-cron';
import { config } from '../config/env.js';
import logger from '../lib/logger.js';
import { getCategoryBySlug, listCategories } from '../models/categoryModel.js';
import { createArticle } from '../models/articleModel.js';
import { recordTokenUsage, getMonthlyTokenUsage } from '../models/tokenUsageModel.js';
import { upsertDailyJobTarget, incrementJobProgress, getJobForDay } from '../models/jobModel.js';
import { generateArticleViaAPI } from './aiClient.js';
import { buildMeta, createSlug, estimateReadingTimeMinutes } from '../utils/seo.js';
import { getTrendingTopics } from './trendsService.js';

function getYearMonth(d = new Date()) {
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

function todayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

async function remainingArticlesForToday() {
  const day = todayUTC();
  await upsertDailyJobTarget({ day, target: config.generation.dailyTarget });
  const job = await getJobForDay(day);
  const generated = job?.num_articles_generated || 0;
  return Math.max(0, config.generation.dailyTarget - generated);
}

async function tokensRemainingForMonth() {
  const { year, month } = getYearMonth();
  const used = await getMonthlyTokenUsage(year, month);
  return Math.max(0, config.generation.monthlyTokenCap - used);
}

function buildPrompt({ languageCode, categoryName, topic }) {
  return [
    `Write a professional, SEO-optimized long-form article in ${languageCode} about: ${topic}.`,
    `Category: ${categoryName}. Audience: general web readers seeking value.`,
    'Requirements: 1200-2000 words, clear headings (H2/H3), bullet points, actionable insights, natural keyword usage.',
    'Include a compelling title. Provide a concise 2-3 sentence summary at the top.',
    'Tone: authoritative, friendly, ad-friendly. Avoid fluff and repetition. Ensure originality.',
  ].join('\n');
}

async function selectTargets(batchSize) {
  const categories = await listCategories();
  const targets = [];
  for (const languageCode of config.languages) {
    const trends = await getTrendingTopics({ languageCode, maxPerCategory: 1 });
    for (const t of trends) {
      const category = categories.find((c) => c.slug === t.category) || categories[0];
      targets.push({ languageCode, categoryId: category.id, categoryName: category.name, topic: t.topic });
      if (targets.length >= batchSize) return targets;
    }
  }
  return targets.slice(0, batchSize);
}

async function generateOne(target) {
  const prompt = buildPrompt({
    languageCode: target.languageCode,
    categoryName: target.categoryName,
    topic: target.topic,
  });
  try {
    const { title, content, imageUrl, tokensIn, tokensOut, model } = await generateArticleViaAPI({
      prompt,
      languageCode: target.languageCode,
    });

    const summary = content.split('\n').find((p) => p.trim().length > 0)?.slice(0, 300) || title;
    const slug = createSlug(title, target.languageCode);
    const meta = buildMeta({ title, summary, imageUrl, canonicalUrl: null });
    const readingTimeMinutes = estimateReadingTimeMinutes(content);

    const article = await createArticle({
      title,
      slug,
      content,
      summary,
      languageCode: target.languageCode,
      categoryId: target.categoryId,
      imageUrl,
      meta,
      readingTimeMinutes,
      sourceUrl: null,
      aiModel: model,
      aiPrompt: prompt,
      aiTokensInput: tokensIn,
      aiTokensOutput: tokensOut,
    });

    if (article) {
      await recordTokenUsage({
        day: todayUTC(),
        tokensInput: tokensIn,
        tokensOutput: tokensOut,
      });
    }
    return { article, tokens: (tokensIn || 0) + (tokensOut || 0) };
  } catch (err) {
    logger.warn({ err, language: target.languageCode, topic: target.topic }, 'Single article generation failed');
    return { article: null, tokens: 0 };
  }
}

export function scheduleArticleGeneration() {
  // Ensure job row exists for today
  upsertDailyJobTarget({ day: todayUTC(), target: config.generation.dailyTarget }).catch(() => {});

  cron.schedule(config.generation.schedule, async () => {
    try {
      const remainingArticles = await remainingArticlesForToday();
      if (remainingArticles <= 0) {
        logger.info('Daily target reached; skipping run');
        return;
      }

      const tokensLeft = await tokensRemainingForMonth();
      if (tokensLeft <= 0) {
        logger.warn('Monthly token cap reached; skipping');
        return;
      }

      // Simple heuristic: assume average 2,500 tokens per article (prompt + output)
      const averageTokensPerArticle = 2500;
      const maxByTokens = Math.floor(tokensLeft / averageTokensPerArticle);
      if (maxByTokens <= 0) {
        logger.info({ tokensLeft }, 'Not enough tokens for a safe article; skipping run');
        return;
      }
      const plannedBatch = Math.min(
        config.generation.maxBatchPerRun,
        remainingArticles,
        maxByTokens
      );

      const targets = await selectTargets(plannedBatch);
      let generated = 0;
      let tokensSpent = 0;
      for (const t of targets) {
        if (tokensSpent >= tokensLeft) break;
        // Guard for tokens per article
        const { article, tokens } = await generateOne(t);
        if (article) {
          generated += 1;
          tokensSpent += tokens;
        }
      }
      if (generated > 0) {
        await incrementJobProgress({ day: todayUTC(), count: generated });
        logger.info({ generated, tokensSpent }, 'Generation run completed');
      } else {
        logger.info('No articles generated in this run');
      }
    } catch (err) {
      logger.error({ err }, 'Generation run failed');
    }
  });
}


