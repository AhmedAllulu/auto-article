/*
 * Prompt templates for "best-of" (top list / roundup) articles.
 * Edit or add templates as needed. The generator will randomly choose one.
 */

import { COMMON_STRUCTURE } from '../prompts/common_structure.js';

const templates = [
  {
    system: `You are a product review specialist who writes unbiased "best of" round-up articles. Write exactly 600-800 words with clear structure and balanced analysis.`,
    user: `Write an article listing the top 6-7 items for ONE NARROW sub-topic inside "{{CATEGORY}}" (e.g., "best boutique hotels in Istanbul" not "travel"). Create a unique title format like "7 Hidden Gems:..." or "The Ultimate Roundup of...". For each include pros/cons and who it's best suited for.

${COMMON_STRUCTURE}
${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert curator who creates comparison round-ups for shoppers. Target exactly 600-800 words with clear comparisons and practical insights.`,
    user: `Produce a listicle highlighting the 5-6 best options for ONE specific need within "{{CATEGORY}}" (e.g., "best noise-canceling headphones under $200" not "headphones"). Use an engaging title like "The Definitive List of..." or "5 Game-Changers for...". Provide key features, pricing insights, and clear verdict for each.

${COMMON_STRUCTURE}
${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a trend analyst who identifies the most popular and effective options in any field.`,
    user: `Create a ranking of the top 6-8 options for ONE specific use case within "{{CATEGORY}}" (e.g., "top project management tools for remote teams" not "software"). Use a compelling title like "Ranked: The 6 Best..." or "Which Reigns Supreme?...". Include focused analysis of why each item made the list, current market position, and recent user feedback.
${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a consumer advocate who helps people make informed purchasing decisions.`,
    user: `Write an authoritative guide for ONE specific buyer category within "{{CATEGORY}}" (e.g., "best cameras for travel bloggers" not "cameras"). Use a dynamic title like "The Complete Buyer's Guide to..." or "Every [User Type] Needs These...". Include current budget, mid-range, and premium options with updated buying criteria, trending pitfalls to avoid, and recent money-saving tips.
${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an industry expert who evaluates and ranks solutions based on performance metrics.`,
    user: `Develop a data-driven article about the top 6 trending options for ONE specific scenario within "{{CATEGORY}}" (e.g., "best meditation apps for busy professionals" not "wellness apps"). Use a creative title like "The Science-Backed Top 6..." or "Tested and Ranked:...". Include current performance comparisons, recent expert scores, latest user ratings, and streamlined feature breakdowns.
${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a lifestyle consultant who recommends the best products and services for different needs.`,
    user: `Create a personalized guide for ONE specific situation within "{{CATEGORY}}" (e.g., "best kitchen gadgets for small apartments" not "kitchen tools"). Use an engaging title format like "Small Space, Big Flavor:..." or "The Minimalist's Guide to...". Include categories like beginners, professionals, budget-conscious, and premium seekers using trending options.
${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a market researcher who analyzes trends and consumer preferences.`,
    user: `Write an article about what's trending RIGHT NOW for ONE specific niche within "{{CATEGORY}}" (e.g., "hottest sustainable fashion brands for Gen Z" not "fashion"). Use a dynamic title like "What's Hot Right Now:..." or "The Rising Stars of...". Include this month's rising stars and trending favorites based on latest sales data, recent reviews, and current expert opinions.
${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a quality assessor who evaluates products based on multiple criteria.`,
    user: `Produce a comparison featuring the highest-rated options for ONE specific need within "{{CATEGORY}}" (e.g., "top-rated ergonomic chairs for gaming" not "office furniture"). Use a compelling title like "Cream of the Crop:..." or "The Gold Standard for...". Feature current testing methodology, updated scoring criteria, and unbiased recommendations for top 6 trending choices.
${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a value-focused reviewer who finds the best deals and quality combinations.`,
    user: `Create a value guide highlighting the best quality-to-price options for ONE specific use case within "{{CATEGORY}}" (e.g., "best value smartphones for photography enthusiasts" not "phones"). Use an attention-grabbing title like "Maximum Bang for Your Buck:..." or "Premium Quality, Budget Price:...". Highlight current products offering the best quality-to-price ratio, recent hidden gems, and trending overpriced items to avoid.
${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a specialist curator who identifies emerging trends and innovative solutions.`,
    user: `Write an innovation spotlight about the most cutting-edge options in ONE specific area of "{{CATEGORY}}" (e.g., "most innovative electric bike designs of 2024" not "transportation"). Use a forward-thinking title like "The Future is Here:..." or "Revolutionary Breakthrough:...". Feature the latest cutting-edge options, recent game-changing features, and current predictions for future development in this space.
${COMMON_STRUCTURE}`,
  },
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function buildPrompt(categoryName) {
  const tpl = pickRandom(templates);
  const repl = (s) => s.replace(/\{\{CATEGORY}}/g, categoryName);
  return { system: repl(tpl.system), user: repl(tpl.user) };
}

export default { buildPrompt };