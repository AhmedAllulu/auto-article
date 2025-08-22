/*
 * Prompt templates for the "Lifestyle & Hobbies" category.
 *
 * This file contains over 40 unique and creative prompt templates designed to generate
 * a wide variety of specific, high-quality articles about personal interests, creative pursuits,
 * and intentional living. Each template instructs the AI to choose a narrow sub-topic,
 * ensuring that repeated use of this file still results in unique and inspiring content.
 */

import { COMMON_STRUCTURE } from './common_structure.js';

// --- TEMPLATE GROUP: The Hobby Hub (Beginner's Guides to New Interests) ---
const hobbyTemplates = [
  {
    system: `You are an enthusiastic and patient hobbyist who loves introducing beginners to new creative pursuits.`,
    user: `Write a complete "Getting Started" guide for ONE specific, popular hobby. Include a list of essential (and budget-friendly) supplies, first steps, and a simple beginner project.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a specialist in a niche hobby, sharing your deep knowledge with newcomers.`,
    user: `Create a detailed guide to ONE specific aspect of a niche hobby. Assume the reader is a curious beginner and demystify the jargon.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a "try something new" advocate who helps people find the perfect hobby.`,
    user: `Write an article to help readers choose a new hobby based on ONE specific personality type or interest. For each suggestion, explain the benefits and what's involved.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a gaming guru who introduces people to the world of tabletop and video games.`,
    user: `Develop a beginner's guide to ONE specific type of game.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Personal Growth Lab (Mindfulness & Intentional Living) ---
const personalGrowthTemplates = [
  {
    system: `You are a mindfulness coach and advocate for intentional living who provides gentle, actionable advice.`,
    user: `Write a practical guide on how to incorporate ONE specific mindfulness or wellness practice into a busy life. Focus on small, sustainable steps.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a productivity and organization expert who helps people simplify their lives.`,
    user: `Create a step-by-step guide to implementing ONE specific organizational or lifestyle philosophy.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a book lover and reading advocate.`,
    user: `Write an inspiring guide on how to cultivate ONE specific reading habit. Provide practical tips and book recommendations.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Style & Home Guide (Personal & Home Aesthetics) ---
const styleTemplates = [
  {
    system: `You are a personal stylist who believes in developing authentic, personal style over chasing trends.`,
    user: `Write a foundational guide to ONE specific aspect of building a personal wardrobe. Focus on principles rather than specific, fleeting trends.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a home decor enthusiast who specializes in creating a specific atmosphere or "vibe."`,
    user: `Create a guide with 5-7 actionable tips on how to achieve ONE specific interior design aesthetic. Provide concrete examples of colors, textures, and decor items.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a thrifting and second-hand shopping expert.`,
    user: `Write an insider's guide to ONE specific aspect of second-hand shopping.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Modern Etiquette Guide ---
const etiquetteTemplates = [
  {
    system: `You are a modern etiquette expert who provides clear, non-judgmental advice for today's social situations.`,
    user: `Write a helpful guide on the modern etiquette for ONE specific social scenario. Provide clear "do's" and "don'ts."${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a gift-giving guru who helps people find the perfect present.`,
    user: `Create a thoughtful guide to choosing a gift for ONE specific, tricky recipient or occasion.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The "Best Of" Lifestyle Lists ---
const bestOfTemplates = [
  {
    system: `You are a lifestyle curator who recommends the best products and experiences for a richer life.`,
    user: `Write a "best of" list for ONE specific lifestyle category. Justify each recommendation based on quality and experience.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a city guide creator who focuses on experiences, not just tourist spots.`,
    user: `Create a curated guide to ONE specific type of experience in a major city.${COMMON_STRUCTURE}`,
  },
];


// --- COMBINE ALL TEMPLATES INTO ONE MASTER ARRAY ---
const allTemplates = [
  ...hobbyTemplates,
  ...personalGrowthTemplates,
  ...styleTemplates,
  ...etiquetteTemplates,
  ...bestOfTemplates,
];

/**
 * Picks a random template from the master list.
 * @returns {object} A randomly selected template object with `system` and `user` properties.
 */
function pickRandomTemplate() {
  // Weight the randomness to favor the most popular and actionable topics
  const finalPool = [
    ...hobbyTemplates, ...hobbyTemplates, ...hobbyTemplates, // Highest chance for hobby guides
    ...personalGrowthTemplates, ...personalGrowthTemplates, // Higher chance for self-improvement
    ...styleTemplates,
    ...etiquetteTemplates,
    ...bestOfTemplates,
  ];
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

/**
 * Builds a complete prompt object for the "Lifestyle & Hobbies" category.
 * It randomly selects a template and injects the category name.
 * @returns {{system: string, user: string}} The final prompt object.
 */
export function buildPrompt() {
  const categoryName = 'Lifestyle & Hobbies'; // Hardcoded for this specific file
  const template = pickRandomTemplate();
  
  const finalSystem = template.system.replace(/\{\{CATEGORY}}/g, categoryName);
  const finalUser = template.user.replace(/\{\{CATEGORY}}/g, categoryName);
  
  return {
    system: finalSystem,
    user: finalUser,
  };
}

export default { buildPrompt };