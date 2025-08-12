#!/usr/bin/env node
import { Command } from 'commander';
import axios from 'axios';
import { config } from '../src/config.js';

function combinePrompts(system, user) {
  const parts = [];
  if (system) parts.push(`System: ${system}`);
  if (user) parts.push(`User: ${user}`);
  return parts.join('\n\n');
}

async function main() {
  const program = new Command();
  program
    .name('test-ai-api')
    .description('Test 1min.ai API responses and prompts')
    .option('-p, --prompt <text>', 'User prompt text', 'Say hello world in one sentence.')
    .option('-s, --system <text>', 'System instruction', 'You are a helpful assistant.')
    .option('--search', 'Enable web search in promptObject', false)
    .option('--no-search', 'Disable web search (override)', undefined)
    .option('-m, --model <name>', 'Model to use (overrides config)')
    .option('--sites <n>', 'numOfSite when webSearch enabled', (v) => Number(v), 1)
    .option('--max-words <n>', 'maxWord when webSearch enabled', (v) => Number(v), 500)
    .option('--timeout <ms>', 'HTTP timeout in ms', (v) => Number(v), 60000)
    .option('--raw', 'Print raw JSON response', false)
    .option('--full', 'Print full content instead of first 600 chars', false)
    .option('--debug', 'Print request details before sending', false)
    .parse(process.argv);

  const opts = program.opts();

  if (!config.oneMinAI.apiKey) {
    console.error('Missing ONE_MIN_AI_API_KEY in environment (.env)');
    process.exit(1);
  }

  const http = axios.create({
    baseURL: config.oneMinAI.baseUrl,
    headers: {
      'API-KEY': config.oneMinAI.apiKey,
      'Content-Type': 'application/json',
    },
    timeout: opts.timeout,
  });

  const webSearch = opts.search ?? (opts.noSearch ? false : config.oneMinAI.enableWebSearch);
  const requestBody = {
    type: 'CHAT_WITH_AI',
    model: opts.model || config.oneMinAI.defaultModel,
    promptObject: {
      prompt: combinePrompts(opts.system, opts.prompt),
      ...(webSearch
        ? { webSearch: true, numOfSite: opts.sites, maxWord: opts['maxWords'] || opts.maxWords }
        : {}),
    },
  };

  if (opts.debug) {
    console.log('Base URL:', config.oneMinAI.baseUrl);
    console.log('Model:', requestBody.model);
    console.log('Web search:', webSearch);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
  }

  const start = Date.now();
  try {
    // Try a set of likely endpoints until one works
    const candidatePaths = ['/features', '/v1/features', '/api/features', '/v1/api/features'];
    let response = null;
    let usedPath = null;
    let lastError = null;
    for (const p of candidatePaths) {
      try {
        usedPath = p;
        response = await http.post(p, requestBody);
        break;
      } catch (e) {
        lastError = e;
        continue;
      }
    }
    if (!response) throw lastError || new Error('All endpoint attempts failed');
    const { data, status } = response;
    const elapsedMs = Date.now() - start;

    if (opts.raw) {
      console.log(JSON.stringify({ status, elapsedMs, data }, null, 2));
      return;
    }

    const content = data?.response?.text || data?.content || data?.result || '';
    const usage = data?.usage || {};
    const model = data?.model || requestBody.model;

    console.log('--- 1min.ai API Test ---');
    console.log('Status:', status);
    console.log('Elapsed:', `${elapsedMs} ms`);
    console.log('Endpoint:', usedPath);
    console.log('Model:', model);
    console.log('Web search:', webSearch ? 'enabled' : 'disabled');
    if (usage && (usage.prompt_tokens || usage.completion_tokens || usage.total_tokens)) {
      console.log('Usage:', usage);
    }
    console.log('--- Content ---');
    if (opts.full) {
      console.log(content);
    } else {
      const preview = (content || '').slice(0, 600);
      console.log(preview);
      if ((content || '').length > 600) console.log('... [truncated, use --full to print all]');
    }
  } catch (err) {
    const elapsedMs = Date.now() - start;
    console.error('Request failed after', `${elapsedMs} ms`);
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
    process.exit(1);
  }
}

main();


