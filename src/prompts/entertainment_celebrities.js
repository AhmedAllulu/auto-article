/*
 * Prompt templates for the "Entertainment & Celebrities" category.
 *
 * This file contains over 50 unique and creative prompt templates designed to generate
 * a wide variety of specific, high-quality articles about film, TV, music, and pop culture.
 * Each template instructs the AI to choose a narrow sub-topic, ensuring that repeated
 * use of this file still results in unique and engaging content.
 */

import { COMMON_STRUCTURE } from './common_structure.js';

// --- TEMPLATE GROUP: "Best-Of" & Recommendation Lists ---
const bestOfTemplates = [
  {
    system: `You are a seasoned film and TV critic who writes compelling "best of" lists for streaming services. Write exactly 600-800 words.`,
    user: `Write an article listing the top 5-7 items for ONE NARROW, specific streaming category. Create a unique title. For each, explain why it's a must-watch and who would enjoy it.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a music journalist with a deep knowledge of genres and eras. Target exactly 600-800 words.`,
    user: `Produce a listicle highlighting the 7-10 best songs or albums for ONE specific theme or genre. Use an engaging title and justify each choice.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a pop culture expert who creates fun, shareable rankings.`,
    user: `Create a ranking of the top 10 characters for ONE specific archetype. Use a compelling title like "Ranked:..." and analyze what makes each character memorable.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a lifestyle curator who recommends content based on mood or occasion.`,
    user: `Write a guide to the best entertainment for a specific mood or situation. Structure the article around the feeling or experience.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a video game critic specializing in specific genres.`,
    user: `Develop a data-driven article about the top 5 trending games for ONE specific niche. Include details on gameplay, story, and why it's popular now.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Deep Dives & Cultural Analysis ---
const deepDiveTemplates = [
  {
    system: `You are a cultural analyst who writes insightful think-pieces about entertainment.`,
    user: `Write a deep-dive analysis on ONE specific film, TV show, or album. Go beyond a simple review and explore its deeper meaning and significance.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a fan theorist who excels at explaining complex plots and hidden meanings.`,
    user: `Create a detailed explanation of the ending of ONE specific, famously ambiguous movie or TV show. Present the most popular theories and offer a compelling conclusion.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a film studies expert who analyzes cinematic techniques.`,
    user: `Develop an explainer on ONE specific cinematic element within a famous director's work. Explain the technique and its effect on the audience.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a character analyst who explores the psychology of fictional characters.`,
    user: `Write an in-depth character study of ONE complex and iconic character. Analyze their motivations, flaws, and character arc.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Celebrity Spotlights & Career Retrospectives ---
const celebrityTemplates = [
  {
    system: `You are a celebrity biographer who tells compelling stories about famous figures.`,
    user: `Write a compelling profile of ONE specific celebrity, focusing on a unique angle. Go beyond the headlines to tell a deeper story.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a fashion critic who analyzes celebrity style.`,
    user: `Create a visual-driven article (using descriptive language) on the style evolution of ONE specific fashion icon. Describe key looks and their impact.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a career analyst who evaluates an actor's body of work.`,
    user: `Write an article highlighting the most underrated or transformative performances of ONE specific, well-known actor. Justify why these specific roles are significant.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a "Where Are They Now?" specialist who reconnects audiences with past stars.`,
    user: `Develop a "Where Are They Now?" piece on the cast of ONE specific, beloved movie or TV show from the past. Provide updates on their careers and lives.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Industry Explainers & "Behind the Scenes" ---
const industryTemplates = [
  {
    system: `You are an industry insider who explains the business of entertainment.`,
    user: `Write a clear, in-depth explainer article on ONE specific "behind-the-scenes" aspect of Hollywood. Demystify a complex part of the industry for the average reader.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a casting director expert who analyzes casting choices.`,
    user: `Create an article about ONE specific aspect of film or TV casting. Provide interesting, verifiable trivia.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a box office analyst who breaks down the numbers.`,
    user: `Write an analysis of ONE specific box office phenomenon. Explain the factors that led to the financial outcome.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Beginner's Guides to Franchises ---
const beginnerGuideTemplates = [
  {
    system: `You are a pop culture expert who helps newcomers navigate complex fictional universes.`,
    user: `Write a comprehensive beginner's guide to getting into ONE specific, large entertainment franchise. Provide a recommended viewing order and explain the core concepts without spoilers.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: News, Trends, and Current Affairs ---
const trendTemplates = [
  {
    system: `You are a pop culture journalist who identifies and explains emerging trends.`,
    user: `Write a trend analysis article about ONE specific emerging trend in entertainment. Explain why the trend is happening now and what it means for the industry.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a truth-seeking investigator who separates fact from fiction.`,
    user: `Write a myth-busting article debunking a common myth or rumor about ONE specific celebrity or film production. Use credible sources to set the record straight.${COMMON_STRUCTURE}`,
  },
];


// --- COMBINE ALL TEMPLATES INTO ONE MASTER ARRAY ---
const allTemplates = [
  ...bestOfTemplates,
  ...deepDiveTemplates,
  ...celebrityTemplates,
  ...industryTemplates,
  ...beginnerGuideTemplates,
  ...trendTemplates,
];

/**
 * Picks a random template from the master list.
 * @returns {object} A randomly selected template object with `system` and `user` properties.
 */
function pickRandomTemplate() {
  // To ensure a good mix, we'll add some templates multiple times to the final pool
  const finalPool = [
    ...bestOfTemplates, ...bestOfTemplates, // Higher chance of getting a listicle
    ...deepDiveTemplates,
    ...celebrityTemplates, ...celebrityTemplates, // Higher chance of celebrity content
    ...industryTemplates,
    ...beginnerGuideTemplates,
    ...trendTemplates,
    // Add more duplicates here to weigh the randomness if needed
  ];
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

/**
 * Builds a complete prompt object for the "Entertainment & Celebrities" category.
 * It randomly selects a template and injects the category name.
 * @returns {{system: string, user: string}} The final prompt object.
 */
export function buildPrompt() {
  const categoryName = 'Entertainment & Celebrities'; // Hardcoded for this specific file
  const template = pickRandomTemplate();
  
  const finalSystem = template.system.replace(/\{\{CATEGORY}}/g, categoryName);
  const finalUser = template.user.replace(/\{\{CATEGORY}}/g, categoryName);
  
  return {
    system: finalSystem,
    user: finalUser,
  };
}

export default { buildPrompt };