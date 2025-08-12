#!/usr/bin/env node
import { Command } from 'commander';
import { generateNoSearch, generateArticleWithSearch } from '../src/services/oneMinAI.js';

async function main() {
  const program = new Command();
  program
    .name('test-ai-api')
    .description('Test 1min.ai API with the correct configuration')
    .option('-p, --prompt <text>', 'User prompt text', 'Say hello world in one sentence.')
    .option('-s, --system <text>', 'System instruction', 'You are a helpful assistant.')
    .option('--search', 'Enable web search', false)
    .option('--raw', 'Print raw response object', false)
    .parse(process.argv);

  const opts = program.opts();

  console.log('🧪 Testing 1min.ai API...');
  console.log(`📝 System: ${opts.system}`);
  console.log(`👤 User: ${opts.prompt}`);
  console.log(`🔍 Web Search: ${opts.search ? 'enabled' : 'disabled'}`);
  console.log('');

  const start = Date.now();
  try {
    const result = opts.search 
      ? await generateArticleWithSearch(opts.system, opts.prompt)
      : await generateNoSearch(opts.system, opts.prompt);
    
    const elapsed = Date.now() - start;
    
    if (opts.raw) {
      console.log('📄 Raw Response:', JSON.stringify(result, null, 2));
    } else {
      console.log('✅ SUCCESS!');
      console.log(`⏱️  Time: ${elapsed}ms`);
      console.log(`🤖 Model: ${result.model}`);
      console.log(`📊 Usage: ${JSON.stringify(result.usage)}`);
      console.log('');
      console.log('💬 Response:');
      console.log('-'.repeat(40));
      console.log(result.content);
      console.log('-'.repeat(40));
    }
  } catch (error) {
    const elapsed = Date.now() - start;
    console.error(`❌ FAILED after ${elapsed}ms:`);
    console.error(error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

main();
