/*
 * Prompt templates for trend analysis articles that explore current and future developments.
 */

import { COMMON_STRUCTURE } from '../prompts/common_structure.js';

const templates = [
  {
    system: `You are a trend analyst who identifies and explains emerging patterns and their implications. Write exactly 600-800 words focusing on current data and market intelligence.`,
    user: `Write a trend analysis article about ONE specific emerging trend within "{{CATEGORY}}" (e.g., "rise of virtual reality fitness classes" not "fitness trends"). Use a compelling title like "The Rising Wave of..." or "What's Disrupting...". Cover the latest developments, emerging patterns, current market drivers, near-term predictions, and strategic implications happening right now.

${COMMON_STRUCTURE}${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a futurist who interprets current signals to predict upcoming developments. Target exactly 600-800 words with forward-looking analysis and actionable insights.`,
    user: `Create a forward-looking trends report on ONE specific innovation within "{{CATEGORY}}" (e.g., "AI-powered personalized nutrition plans" not "health technology"). Use a future-focused title like "The Next Big Thing:..." or "Coming Soon:...". Analyze current momentum, identify emerging signals, predict breakthrough moments, and provide insights for early adopters based on the latest market data.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a market researcher who tracks consumer behavior and industry evolution patterns.`,
    user: `Develop a market trends analysis for ONE specific shift within "{{CATEGORY}}" (e.g., "Gen Z abandoning traditional banking for fintech apps" not "banking trends"). Use an insightful title like "The Great Migration:..." or "Why Everyone's Switching to...". Feature consumer preference shifts, industry disruptions, competitive landscape changes, and growth opportunity identification with data backing.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a technology scout who identifies emerging innovations and their potential impact.`,
    user: `Write a technology trends article about ONE specific breakthrough within "{{CATEGORY}}" (e.g., "quantum computing impact on cryptocurrency security" not "technology trends"). Use a tech-focused title like "The Game Changer:..." or "Revolutionary Breakthrough:...". Explore cutting-edge developments, adoption curves, disruptive potential, implementation challenges, and timeline predictions for mainstream adoption.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a cultural observer who tracks social movements and behavioral changes.`,
    user: `Create a cultural trends analysis of ONE specific social shift within "{{CATEGORY}}" (e.g., "remote work changing small town economies" not "work culture"). Use a cultural title like "The New Normal:..." or "Society's Shift Toward...". Examine social changes, generational differences, lifestyle modifications, value evolution, and their impact on society and business practices.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an investment analyst who spots trends early for strategic positioning and profit potential.`,
    user: `Develop an investment-focused trends report on ONE specific market opportunity within "{{CATEGORY}}" (e.g., "plant-based meat market explosion" not "food industry"). Use a financial title like "The Next Gold Rush:..." or "Smart Money is Betting on...". Include market sizing, growth projections, key players, competitive advantages, risk assessments, and investment recommendations.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a policy researcher who analyzes regulatory trends and their societal implications.`,
    user: `Write a policy trends analysis for ONE specific regulatory change within "{{CATEGORY}}" (e.g., "new EU data privacy laws affecting social media" not "regulation trends"). Use an authoritative title like "The New Rules of..." or "Policy Shift Alert:...". Cover regulatory developments, compliance requirements, political influences, stakeholder impacts, and adaptation strategies for organizations.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an innovation tracker who monitors breakthrough developments and their scaling potential.`,
    user: `Create an innovation trends article about ONE specific breakthrough within "{{CATEGORY}}" (e.g., "lab-grown leather disrupting fashion industry" not "fashion innovation"). Use an innovation-focused title like "The Innovation That's Changing..." or "From Lab to Market:...". Highlight breakthrough technologies, scaling challenges, adoption accelerators, market readiness factors, and commercialization timelines.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a global trends observer who identifies patterns across different markets and regions.`,
    user: `Develop a global trends analysis of ONE specific worldwide phenomenon within "{{CATEGORY}}" (e.g., "how different countries handle electric vehicle adoption" not "transportation trends"). Use a global perspective title like "Around the World:..." or "Global Spotlight:...". Compare regional differences, cultural adaptations, market maturity levels, cross-border influences, and universal vs. local patterns.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a strategic forecaster who helps organizations prepare for future scenario planning.`,
    user: `Write a strategic trends forecast for ONE specific future scenario within "{{CATEGORY}}" (e.g., "preparing retail stores for post-pandemic shopping habits" not "retail trends"). Use a strategic title like "Preparing for..." or "The Strategic Response to...". Include scenario planning, risk assessment, opportunity mapping, preparation strategies, and adaptive management approaches for uncertain futures.${COMMON_STRUCTURE}`,
  },
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function buildPrompt(categoryName) {
  const tpl = pickRandom(templates);
  const replace = (str) => str.replace(/\{\{CATEGORY}}/g, categoryName);
  return {
    system: replace(tpl.system),
    user: replace(tpl.user),
  };
}

export default { buildPrompt };