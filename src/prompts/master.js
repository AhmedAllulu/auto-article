/*
 * Prompt templates for the primary "master" SEO article.
 * Each template focuses on creating highly specific, targeted content with varied title formats.
 */

import { COMMON_STRUCTURE } from './common_structure.js';

const templates = [
  {
    system: `You are an expert SEO content writer specializing in human-centered, engaging content that ranks well. Write exactly 600-800 words with strong SEO optimization and user engagement focus.`,
    user: `Write a comprehensive, people-first SEO article for "{{CATEGORY}}" focusing on ONE highly specific sub-topic that is trending right now (e.g., instead of "travel" use "solo female travel in Istanbul in 2024"). Create a unique, compelling title that breaks typical patterns. Include actionable insights and recent data.

${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a content strategist who creates viral, shareable articles that solve real problems. Target exactly 600-800 words with high engagement potential and practical solutions.`,
    user: `Create an authoritative guide on ONE specific aspect of "{{CATEGORY}}" (e.g., "negotiating rent prices in competitive markets" not "real estate"). Use an engaging title format like "The Insider's Secret to..." or "What Nobody Tells You About...". Include expert insights, case studies, and actionable takeaways that readers will bookmark and share.

${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a digital marketing expert who writes content that converts visitors into loyal readers.`,
    user: `Develop a comprehensive article about ONE narrow topic within "{{CATEGORY}}" (e.g., "growing Instagram followers through Reels in 2024" not "social media"). Use a dynamic title like "From Zero to Hero:..." or "The 2024 Blueprint for...". Include trending subtopics, expert quotes, and practical applications with real-world examples.

${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a thought leader who creates definitive content that establishes authority in any subject.`,
    user: `Write the ultimate guide to ONE specific challenge within "{{CATEGORY}}" (e.g., "overcoming procrastination for remote workers" not "productivity"). Use an authoritative title format like "The Definitive Solution to..." or "Everything You Need to Know About...". Make it the most comprehensive resource available, with unique insights and expert analysis.

${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a content researcher who transforms complex topics into accessible, engaging articles.`,
    user: `Create an in-depth exploration of ONE trending issue within "{{CATEGORY}}" (e.g., "AI impact on graphic design jobs in 2024" not "technology"). Use a compelling title like "The Hard Truth About..." or "Breaking Down the Myths of...". Break down complex concepts, provide clear explanations, and offer practical implementation strategies for readers at all levels.

${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a trend analyst who writes forward-thinking content about emerging topics.`,
    user: `Develop a cutting-edge article on ONE specific emerging trend within "{{CATEGORY}}" (e.g., "vertical farming in urban apartments" not "gardening"). Use a forward-thinking title like "The Future of..." or "What's Next for...". Explore the latest developments, emerging patterns, current market drivers, near-term predictions, and strategic implications happening right now.

${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an industry insider who shares exclusive knowledge and behind-the-scenes insights.`,
    user: `Write an insider's guide to ONE specific practice within "{{CATEGORY}}" (e.g., "how Netflix chooses which shows to cancel" not "entertainment"). Use an intriguing title format like "Behind the Scenes:..." or "Industry Secrets:...". Share expert secrets, industry best practices, common misconceptions debunked, and professional-level strategies most people don't know about.

${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a problem-solving expert who creates solution-focused content that addresses real pain points.`,
    user: `Create a comprehensive problem-solving guide for ONE specific challenge within "{{CATEGORY}}" (e.g., "dealing with difficult coworkers in open offices" not "workplace issues"). Use a solution-focused title like "Finally! How to..." or "The End of... Forever". Identify today's common challenges, provide multiple solution paths, and include preventive strategies and troubleshooting tips.

${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a data-driven analyst who writes evidence-based articles with research backing.`,
    user: `Develop a research-backed article on ONE specific phenomenon within "{{CATEGORY}}" (e.g., "why Mediterranean diet works for weight loss over 40" not "nutrition"). Use a credible title like "Science Proves:..." or "Research Reveals:...". Feature current statistics, recent studies, latest expert opinions, 2024 market data, and evidence-based recommendations readers can trust.

${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a practical consultant who writes actionable content that delivers immediate value.`,
    user: `Write a results-oriented guide to ONE specific goal within "{{CATEGORY}}" (e.g., "landing your first freelance writing client in 30 days" not "freelancing"). Use an action-oriented title like "30-Day Challenge:..." or "Your Step-by-Step Path to...". Include current implementation plans, measurable outcomes, trending success metrics, and recent case studies showing proven 2024 results.

${COMMON_STRUCTURE}`,
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