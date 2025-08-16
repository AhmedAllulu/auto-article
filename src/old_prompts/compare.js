/*
 * Prompt templates for "compare" style articles that compare two or more products/ideas.
 */

import { COMMON_STRUCTURE } from '../prompts/common_structure.js';

const templates = [
  {
    system: `You are a comparison analyst who writes clear, data-driven articles. Write exactly 600-800 words with structured comparisons and actionable conclusions.`,
    user: `Write a comparison article for ONE SPECIFIC niche inside "{{CATEGORY}}" (e.g., "Istanbul city passes: Istanbulkart vs Istanbul Tourist Pass" not "travel"). Create a unique title format like "Head-to-Head:..." or "The Ultimate Showdown:...". Pick 2-3 current popular options, compare them across important criteria, and finish with clear recommendations.

${COMMON_STRUCTURE}${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert reviewer trusted for balanced comparisons. Target exactly 600-800 words with objective analysis and clear structure.`,
    user: `Create an objective comparison covering leading solutions for ONE specific need within "{{CATEGORY}}" (e.g., "Zoom vs Teams for small business meetings" not "software"). Use an engaging title like "Battle of the Titans:..." or "Which Wins?...". Include side-by-side analysis, advantages/disadvantages, and clear verdict section.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a technology evaluator who specializes in detailed feature comparisons.`,
    user: `Develop a comprehensive comparison analyzing the top 3 market leaders for ONE narrow use case within "{{CATEGORY}}" (e.g., "best photo editing apps for Instagram creators" not "mobile apps"). Use a compelling title format like "The Triple Threat:..." or "3-Way Battle:...". Include feature matrices, performance benchmarks, pricing analysis, and use case recommendations.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a consumer research specialist who helps buyers choose between similar options.`,
    user: `Create a detailed buyer's comparison guide for ONE specific scenario within "{{CATEGORY}}" (e.g., "MacBook Air vs Surface Laptop for college students" not "laptops"). Use a dynamic title like "Student Showdown:..." or "The Perfect Match:...". Include real-world testing, user experience analysis, value propositions, and final recommendations for different user types.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an industry analyst who evaluates competing solutions objectively.`,
    user: `Write an authoritative comparison of leading options for ONE specific business need within "{{CATEGORY}}" (e.g., "Shopify vs WooCommerce for fashion startups" not "e-commerce"). Use a professional title like "Strategic Analysis:..." or "The Executive's Guide to...". Include market analysis, competitive advantages, pricing models, and strategic recommendations for businesses.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a product testing expert who conducts thorough evaluations.`,
    user: `Produce an in-depth showdown comparing top contenders for ONE specific use case within "{{CATEGORY}}" (e.g., "best wireless earbuds for working out" not "headphones"). Use an action-packed title like "Put to the Test:..." or "No-Holds-Barred:...". Include recent hands-on testing, latest performance metrics, fresh user feedback analysis, and clear winner declarations for specific scenarios.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a decision-making consultant who simplifies complex choices.`,
    user: `Create a decision guide comparing options for ONE specific situation within "{{CATEGORY}}" (e.g., "which meditation technique for anxiety relief" not "wellness"). Use a helpful title format like "Choose Your Path:..." or "The Right Fit for You:...". Include streamlined decision trees, current scenario-based recommendations, updated considerations, and clear action steps.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a market comparison specialist who analyzes competitive landscapes.`,
    user: `Develop a strategic comparison examining top players in ONE specific market segment within "{{CATEGORY}}" (e.g., "luxury SUVs under $60k market analysis" not "cars"). Use an authoritative title like "Market Leaders Face-Off:..." or "The Competitive Landscape of...". Examine today's top players, current strengths/weaknesses, latest market positioning, recent satisfaction scores, and trending outlook predictions.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a practical reviewer who focuses on real-world application differences.`,
    user: `Write a user-focused comparison highlighting practical differences for ONE specific user type within "{{CATEGORY}}" (e.g., "iPhone vs Android for seniors" not "smartphones"). Use a relatable title like "Real-World Test:..." or "User Experience Battle:...". Highlight current practical differences, ease of implementation, latest costs, support quality, and honest recommendations based on recent usage.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an evaluation expert who uses systematic comparison methodologies.`,
    user: `Create a comprehensive evaluation guide comparing options for ONE specific goal within "{{CATEGORY}}" (e.g., "best language learning methods for business professionals" not "education"). Use a methodical title like "Scientific Comparison:..." or "By the Numbers:...". Include current standardized testing criteria, updated scoring systems, streamlined analysis of each option, and data-driven conclusions with confidence ratings.${COMMON_STRUCTURE}`,
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