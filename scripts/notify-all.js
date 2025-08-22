#!/usr/bin/env node
import dotenv from 'dotenv';
dotenv.config();

import { query } from '../src/db.js';
import { articlesTable, LANG_SHARDED_ARTICLE_TABLES } from '../src/utils/articlesTable.js';
import { notifySearchEnginesBatch, notifySearchEnginesSitemapUpdate, SEO_CONFIG } from '../src/services/seoNotificationService.js';

async function fetchAllArticlesForLanguage(lang) {
  const tbl = articlesTable(lang);
  const sql = tbl === 'articles'
    ? `SELECT slug, language_code, COALESCE(published_at, created_at) AS published_at
       FROM ${tbl}
       WHERE language_code = $1
       ORDER BY COALESCE(published_at, created_at) DESC, id DESC`
    : `SELECT slug, language_code, COALESCE(published_at, created_at) AS published_at
       FROM ${tbl}
       ORDER BY COALESCE(published_at, created_at) DESC, id DESC`;
  const params = tbl === 'articles' ? [lang] : [];
  const { rows } = await query(sql, params);
  return rows;
}

async function main() {
  console.log('[notify-all] Base URL:', SEO_CONFIG.baseUrl);

  // Gather all articles across supported languages
  const languages = Array.from(LANG_SHARDED_ARTICLE_TABLES);
  const allArticles = [];

  for (const lang of languages) {
    const rows = await fetchAllArticlesForLanguage(lang);
    for (const r of rows) {
      allArticles.push({ slug: r.slug, language_code: r.language_code || lang });
    }
  }

  console.log(`[notify-all] Total articles collected: ${allArticles.length}`);

  if (allArticles.length === 0) {
    console.log('[notify-all] No articles found. Exiting.');
    process.exit(0);
  }

  // Batch notify with all article URLs
  const batchRes = await notifySearchEnginesBatch(allArticles);

  // Also submit the sitemap once at the end (best practice)
  const sitemapRes = await notifySearchEnginesSitemapUpdate();

  // Summaries
  console.log('\n[notify-all] Batch result (modern methods):');
  console.log(JSON.stringify({
    indexnow: batchRes.notifications.indexnow,
    bingWebmasterApi: batchRes.notifications.bingWebmasterApi,
    yandexWebmasterApi: batchRes.notifications.yandexWebmasterApi,
  }, null, 2));

  console.log('\n[notify-all] Sitemap submission result:');
  console.log(JSON.stringify(sitemapRes.notifications.googleSearchConsole || sitemapRes.notifications.indexnow, null, 2));
}

main().catch(err => {
  console.error('[notify-all] Error:', err.message);
  if (err.response?.data) console.error('[notify-all] Response data:', err.response.data);
  process.exit(1);
});

