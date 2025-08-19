import { query } from '../src/db.js';
import { config } from '../src/config.js';

async function checkGenerationStatus() {
  console.log('🔍 Auto-Article Generation Status Check');
  console.log('=======================================');
  
  try {
    // Check if generation is enabled
    console.log('\n📋 Configuration Status:');
    console.log(`• Generation Enabled: ${config.generation.enabled ? '✅ YES' : '❌ NO'}`);
    console.log(`• Daily Target: ${config.generation.dailyTarget} articles`);
    console.log(`• Articles per Category: ${config.generation.articlesPerCategoryPerDay} per day`);
    console.log(`• Max Categories per Run: ${config.generation.maxCategoriesPerRun}`);
    console.log(`• Stop on Error: ${config.generation.stopOnError ? '✅ YES' : '❌ NO'}`);
    
    if (!config.generation.enabled) {
      console.log('\n⚠️  AUTO-GENERATION IS DISABLED!');
      console.log('   To enable, run: chmod +x enable-auto-generation.sh && ./enable-auto-generation.sh');
      console.log('   Or manually set: ENABLE_GENERATION=true in your .env file');
      return;
    }
    
    // Check today's job status
    const { rows: jobRows } = await query(
      'SELECT * FROM generation_jobs WHERE job_date = CURRENT_DATE LIMIT 1'
    );
    
    const job = jobRows[0];
    console.log('\n📊 Today\'s Generation Status:');
    if (job) {
      console.log(`• Target: ${job.num_articles_target} articles`);
      console.log(`• Generated: ${job.num_articles_generated} articles`);
      console.log(`• Remaining: ${Math.max(0, job.num_articles_target - job.num_articles_generated)} articles`);
      console.log(`• Started: ${job.started_at || 'Not started'}`);
      console.log(`• Progress: ${Math.round((job.num_articles_generated / job.num_articles_target) * 100)}%`);
    } else {
      console.log('• No generation job found for today');
    }
    
    // Check categories that need articles
    const categories = await query('SELECT id, name, slug FROM categories ORDER BY id ASC');
    console.log(`\n📂 Categories: ${categories.rows.length} total`);
    
    let needingArticles = 0;
    for (const category of categories.rows) {
      const { rows } = await query(
        'SELECT COUNT(*)::int AS count FROM articles_en WHERE category_id = $1 AND published_at::date = CURRENT_DATE',
        [category.id]
      );
      const todayCount = rows[0]?.count || 0;
      const needed = Math.max(0, config.generation.articlesPerCategoryPerDay - todayCount);
      
      if (needed > 0) {
        needingArticles++;
        console.log(`  • ${category.name}: ${todayCount}/${config.generation.articlesPerCategoryPerDay} (need ${needed})`);
      }
    }
    
    if (needingArticles === 0) {
      console.log('  ✅ All categories have enough articles for today!');
    } else {
      console.log(`  📝 ${needingArticles} categories need more articles`);
    }
    
    // Check recent generation activity
    const { rows: recentRows } = await query(`
      SELECT COUNT(*) as count, MAX(published_at) as last_generated
      FROM articles_en 
      WHERE published_at >= CURRENT_DATE - INTERVAL '24 hours'
    `);
    
    console.log('\n🕐 Recent Activity:');
    console.log(`• Articles in last 24h: ${recentRows[0]?.count || 0}`);
    console.log(`• Last generated: ${recentRows[0]?.last_generated || 'Never'}`);
    
    // Check token usage
    const { rows: tokenRows } = await query(
      'SELECT tokens_input, tokens_output FROM token_usage WHERE day = CURRENT_DATE'
    );
    
    if (tokenRows.length > 0) {
      const { tokens_input, tokens_output } = tokenRows[0];
      const total = Number(tokens_input) + Number(tokens_output);
      console.log('\n💰 Today\'s Token Usage:');
      console.log(`• Input tokens: ${Number(tokens_input).toLocaleString()}`);
      console.log(`• Output tokens: ${Number(tokens_output).toLocaleString()}`);
      console.log(`• Total tokens: ${total.toLocaleString()}`);
    }
    
    console.log('\n🚀 Auto-Generation Schedule:');
    console.log('• Daily generation: 10 AM sharp (every day) - Optimal SEO time');
    console.log('• Startup check: Immediate on server restart');
    console.log('• Trending updates: Every 30 minutes');
    console.log('• Clean system: Only essential functions enabled');
    
    console.log('\n📋 Manual Controls:');
    console.log('• Trigger now: curl -X POST http://localhost:3000/generation/run');
    console.log('• Check status: curl http://localhost:3000/generation/status');
    console.log('• View analytics: curl http://localhost:3000/analytics/dashboard');
    console.log('• Monitor logs: pm2 logs auto-article --lines 50');
    
    if (config.generation.enabled && needingArticles > 0) {
      console.log('\n✨ READY TO GENERATE! Auto-generation is active and will run automatically.');
    } else if (config.generation.enabled && needingArticles === 0) {
      console.log('\n✅ QUOTA COMPLETE! All categories have enough articles for today.');
    }
    
  } catch (error) {
    console.error('\n❌ Error checking generation status:', error.message);
  }
  
  process.exit(0);
}

checkGenerationStatus().catch(console.error);
