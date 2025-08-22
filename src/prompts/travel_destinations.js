/*
 * Prompt templates for the "Travel & Destinations" category.
 *
 * This file contains over 50 unique and creative prompt templates designed to generate
 * a wide variety of specific, high-quality articles about travel planning, destinations,
 * and smart travel skills. Each template instructs the AI to choose a narrow sub-topic,
 * ensuring that repeated use of this file still results in unique and engaging content.
 */

import { COMMON_STRUCTURE } from './common_structure.js';

// --- TEMPLATE GROUP: Detailed Itineraries & Trip Planning Guides ---
const itineraryTemplates = [
  {
    system: `You are an expert travel planner who creates detailed, day-by-day itineraries. Write exactly 600-800 words.`,
    user: `Write a complete, day-by-day itinerary for ONE specific type of trip. Include recommendations for sights, food, and transportation for each day.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a travel strategist who creates comprehensive guides for planning complex trips.`,
    user: `Create a step-by-step guide on how to plan ONE specific, major trip. Cover budget, visas, booking timeline, and packing.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a thematic travel expert who designs trips around specific interests.`,
    user: `Develop a detailed itinerary for a trip focused on ONE specific interest. Ensure all recommended activities and locations align with the theme.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a local expert sharing insider knowledge.`,
    user: `Write an "insider's guide" itinerary for your city or a city you know well, focusing on ONE specific neighborhood or theme.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Destination Spotlights & "Best Of" Lists ---
const bestOfTemplates = [
  {
    system: `You are a travel writer who creates inspiring "best of" lists for specific types of travelers. Target exactly 600-800 words.`,
    user: `Produce a listicle highlighting the 7-10 best destinations for ONE specific type of traveler or experience. Use an engaging title and justify each choice with compelling details.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a food critic who travels the world to find the best culinary experiences.`,
    user: `Create a ranking of the top 5-7 culinary experiences in ONE specific city or country. Describe the food, the atmosphere, and where to find it.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a travel curator who helps people find unique accommodations.`,
    user: `Write an article listing the top 5-7 unique places to stay for ONE specific destination or theme. Focus on the experience of staying there.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an adventure travel specialist.`,
    user: `Develop a guide to the best adventures in ONE specific region. Include details on difficulty, required gear, and the best time to go.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Travel Hacking & Budget Guides ---
const budgetTemplates = [
  {
    system: `You are a budget travel expert who shares actionable tips for saving money.`,
    user: `Write a detailed guide on how to travel to ONE specific, typically expensive destination on a budget. Provide specific tips on flights, accommodation, food, and activities.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a travel hacker who specializes in points and miles.`,
    user: `Create a beginner's guide to ONE specific aspect of travel hacking. Break down the complex topic into simple, actionable steps.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a frugal guru who finds the best deals.`,
    user: `Write an article listing the top 7-10 ways to save money on ONE specific part of travel. Provide concrete examples and tools.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Practical "How-To" Travel Skills ---
const howToTemplates = [
  {
    system: `You are a seasoned traveler who teaches essential travel skills.`,
    user: `Write a step-by-step tutorial on ONE specific, practical travel task. Include common mistakes and pro tips.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a travel safety expert.`,
    user: `Create a guide on how to stay safe in ONE specific travel scenario. Provide actionable, reassuring advice.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a digital nomad who has mastered the art of working from anywhere.`,
    user: `Develop a guide on ONE specific aspect of the digital nomad lifestyle.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Cultural Deep Dives & Experience Guides ---
const culturalTemplates = [
  {
    system: `You are a cultural expert who helps travelers understand local customs.`,
    user: `Write an essential guide to the local etiquette and customs of ONE specific country. Help travelers avoid embarrassing mistakes and show respect.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a travel writer focused on immersive, authentic experiences.`,
    user: `Create a guide to finding authentic, non-touristy experiences in ONE specific popular destination.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Comparison & Decision Guides ---
const comparisonTemplates = [
  {
    system: `You are a travel analyst who helps people choose the right trip for them.`,
    user: `Write a detailed comparison article for ONE specific travel decision. Compare them across key criteria like cost, social opportunities, and flexibility.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a destination expert who helps travelers choose between two popular places.`,
    user: `Create a head-to-head comparison of two similar destinations to help travelers decide where to go. Compare food, cost, sights, and overall vibe.${COMMON_STRUCTURE}`,
  },
];


// --- COMBINE ALL TEMPLATES INTO ONE MASTER ARRAY ---
const allTemplates = [
  ...itineraryTemplates,
  ...bestOfTemplates,
  ...budgetTemplates,
  ...howToTemplates,
  ...culturalTemplates,
  ...comparisonTemplates,
];

/**
 * Picks a random template from the master list.
 * @returns {object} A randomly selected template object with `system` and `user` properties.
 */
function pickRandomTemplate() {
  // Weight the randomness to favor more popular article types
  const finalPool = [
    ...itineraryTemplates, ...itineraryTemplates, // Higher chance of getting itineraries
    ...bestOfTemplates, ...bestOfTemplates, // Higher chance of getting listicles
    ...budgetTemplates,
    ...howToTemplates,
    ...culturalTemplates,
    ...comparisonTemplates,
  ];
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

/**
 * Builds a complete prompt object for the "Travel & Destinations" category.
 * It randomly selects a template and injects the category name.
 * @returns {{system: string, user: string}} The final prompt object.
 */
export function buildPrompt() {
  const categoryName = 'Travel & Destinations'; // Hardcoded for this specific file
  const template = pickRandomTemplate();
  
  const finalSystem = template.system.replace(/\{\{CATEGORY}}/g, categoryName);
  const finalUser = template.user.replace(/\{\{CATEGORY}}/g, categoryName);
  
  return {
    system: finalSystem,
    user: finalUser,
  };
}

export default { buildPrompt };