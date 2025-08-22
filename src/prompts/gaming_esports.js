/*
 * Prompt templates for the "Gaming & eSports" category.
 *
 * This file contains over 40 unique and creative prompt templates designed to generate
 * a wide variety of specific, high-quality articles for gamers, eSports fans, and
 * those curious about the world of interactive entertainment. Each template instructs the AI
 * to choose a narrow sub-topic, ensuring that repeated use of this file still results in unique content.
 */

import { COMMON_STRUCTURE } from './common_structure.js';

// --- TEMPLATE GROUP: The Player's Handbook (Beginner's Guides & How-Tos) ---
const playerGuideTemplates = [
  {
    system: `You are a friendly and experienced gamer who loves helping new players get started in your favorite games. Your tone is encouraging and clear.`,
    user: `Write a complete "Getting Started" guide for absolute beginners to ONE specific, massively popular online game. Cover basic controls, objectives, and the 3 most important things a new player should know.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a strategy expert who breaks down complex game mechanics into easy-to-understand tips.`,
    user: `Create a guide with "5 Beginner Tips" to get better at ONE specific, popular game. Focus on actionable advice that new players can implement immediately.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a genre specialist who can introduce players to new types of games.`,
    user: `Write a "Beginner's Guide" to ONE specific, popular gaming genre. Explain the core mechanics and recommend an easy entry-point game.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a lore master who loves the stories behind the games.`,
    user: `Develop a spoiler-free "Story So Far" article for a game with a long and complex narrative, designed for players jumping into the latest sequel.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Critic's Corner (Reviews & Recommendations) ---
const criticTemplates = [
  {
    system: `You are a sharp, insightful, and unbiased video game critic, like a writer for IGN or GameSpot.`,
    user: `Write a complete, spoiler-free review of ONE specific, recently released video game. Discuss gameplay, graphics, story, and sound, and provide a final score or clear recommendation.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a "best of" list curator who helps gamers find their next favorite game. Write exactly 600-800 words.`,
    user: `Write an article listing the "7 Best" games for ONE specific, narrow category or platform. For each entry, explain what makes it a must-play.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a "hidden gems" expert who champions underrated indie games.`,
    user: `Create a listicle of 5-7 underrated or "hidden gem" indie games that players might have missed. Sell the reader on why they should give it a try.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a definitive ranker of all things gaming.`,
    user: `Write a definitive ranking of all the main entries in ONE specific, beloved game franchise. Justify the placement of each game.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The eSports Arena (Competitive Gaming) ---
const esportsTemplates = [
  {
    system: `You are a knowledgeable and enthusiastic eSports analyst and commentator.`,
    user: `Write a complete "Beginner's Guide" to understanding ONE specific, major eSport. Explain the objective, key terminology, and what makes it exciting to watch.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an eSports journalist who profiles the stars of the scene.`,
    user: `Create a profile of ONE specific, legendary eSports player or team. Focus on their journey and impact on the sport.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an eSports strategist who analyzes the meta.`,
    user: `Write an article explaining ONE specific strategic concept in a popular eSport.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Tech Bench (Hardware & Culture) ---
const techTemplates = [
  {
    system: `You are a PC building expert and hardware reviewer.`,
    user: `Write a "Best Of" guide for ONE specific category of gaming hardware. Include pros, cons, and who each product is best for.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a gaming historian and cultural analyst.`,
    user: `Write a fascinating explainer on the history and cultural impact of ONE specific, iconic console or game.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a myth-buster who debunks common misconceptions in gaming.`,
    user: `Write an article that debunks 3-5 common myths about video games. Use research and data to support your points.${COMMON_STRUCTURE}`,
  },
];


// --- COMBINE ALL TEMPLATES INTO ONE MASTER ARRAY ---
const allTemplates = [
  ...playerGuideTemplates,
  ...criticTemplates,
  ...esportsTemplates,
  ...techTemplates,
];

/**
 * Picks a random template from the master list.
 * @returns {object} A randomly selected template object with `system` and `user` properties.
 */
function pickRandomTemplate() {
  // Weight the randomness to favor guides and recommendations
  const finalPool = [
    ...playerGuideTemplates, ...playerGuideTemplates, // Higher chance for player guides
    ...criticTemplates, ...criticTemplates, ...criticTemplates, // Highest chance for reviews/lists
    ...esportsTemplates,
    ...techTemplates,
  ];
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

/**
 * Builds a complete prompt object for the "Gaming & eSports" category.
 * It randomly selects a template and injects the category name.
 * @returns {{system: string, user: string}} The final prompt object.
 */
export function buildPrompt() {
  const categoryName = 'Gaming & eSports'; // Hardcoded for this specific file
  const template = pickRandomTemplate();
  
  const finalSystem = template.system.replace(/\{\{CATEGORY}}/g, categoryName);
  const finalUser = template.user.replace(/\{\{CATEGORY}}/g, categoryName);
  
  return {
    system: finalSystem,
    user: finalUser,
  };
}

export default { buildPrompt };