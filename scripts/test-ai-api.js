// Simple script to test 1min.ai credentials and endpoint directly
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const baseUrl = (process.env.ONE_MIN_AI_BASE_URL || 'https://api.1min.ai').replace(/\/$/, '');
const apiKey = process.env.ONE_MIN_AI_API_KEY || '';

async function main() {
  const payload = {
    type: 'CHAT_WITH_AI',
    model: 'gpt-4o-mini',
    promptObject: {
      prompt: 'Say hello in one short sentence.',
      isMixed: false,
      imageList: [],
      webSearch: false,
      numOfSite: 0,
      maxWord: 100,
      temperature: 0.2,
      language: 'en'
    }
  };

  const url = `${baseUrl}/api/features`;
  console.log('Testing 1min.ai…');
  console.log('Base URL:', baseUrl);
  console.log('API key present:', apiKey ? 'yes' : 'no');

  try {
    const res = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'API-KEY': apiKey
      },
      params: { isStreaming: false },
      timeout: 30000
    });
    const data = res.data || {};
    console.log('Status:', res.status);
    console.log('Keys:', Object.keys(data));
    const aiRecord = data.aiRecord || {};
    const possibleText = aiRecord.content || aiRecord.text || aiRecord.message || aiRecord.output || data.text || data.content || '';
    console.log('aiRecord keys:', Object.keys(aiRecord));
    console.log('Text sample:', String(possibleText).slice(0, 500));
    // Raw JSON preview (truncated)
    try {
      console.log('Raw JSON preview:', JSON.stringify(data).slice(0, 2000));
    } catch (_) {
      // ignore
    }
    process.exit(0);
  } catch (err) {
    const status = err.response?.status;
    const body = err.response?.data;
    console.error('Request failed');
    console.error('Status:', status);
    console.error('Message:', err.message);
    if (body) {
      console.error('Response body (truncated):', JSON.stringify(body).slice(0, 300));
    }
    if (!apiKey) {
      console.error('Missing ONE_MIN_AI_API_KEY environment variable.');
    }
    process.exit(1);
  }
}

main();


