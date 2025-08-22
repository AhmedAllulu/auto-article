/*
 * Prompt templates for the "Movies & TV Shows" category.
 *
 * This file contains over 40 unique and creative prompt templates designed to generate
 * a wide variety of specific, high-quality articles for film and television fans.
 * Each template instructs the AI to choose a narrow sub-topic, ensuring that repeated
 * use of this file still results in unique and engaging content.
 */

import { COMMON_STRUCTURE } from './common_structure.js';

// --- TEMPLATE GROUP: The Critic's Choice (Reviews & Recommendations) ---
const reviewTemplates = [
  {
    system: `You are a sharp, insightful film and TV critic who writes compelling, spoiler-free reviews for a general audience.`,
    user: `Write a complete, spoiler-free review of ONE specific, recently released movie or a new season of a TV show. Discuss the plot, performances, direction, and overall themes, and provide a clear "who should watch this?" recommendation.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a genre specialist who curates "best of" lists for fans of specific types of content. Write exactly 600-800 words.`,
    user: `Write an article listing the "7 Best" movies or TV shows in ONE specific, narrow genre or subgenre. For each entry, explain what makes it a standout example of the genre.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a "hidden gems" curator who loves to recommend underrated movies and shows.`,
    user: `Create a listicle of 5-7 underrated or "hidden gem" movies or TV shows on ONE specific streaming platform. Sell the reader on why they should give it a try.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a mood-based recommender who helps people find the perfect thing to watch.`,
    user: `Write a guide to the best movies or TV shows to watch for ONE specific mood or feeling.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Beyond the Screen (Analysis & Deep Dives) ---
const analysisTemplates = [
  {
    system: `You are a cultural analyst and film theorist who writes insightful think-pieces about the deeper meaning of movies and shows.`,
    user: `Write a deep-dive analysis of the themes and cultural impact of ONE specific, significant film or TV show. Go beyond the plot to explore its message.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a character study expert who delves into the psychology of fictional characters.`,
    user: `Write an in-depth character analysis of ONE specific, complex, and iconic movie or TV character. Analyze their arc, motivations, and what makes them so compelling.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a fan theorist who loves to break down complex plots and ambiguous endings.`,
    user: `Write a detailed explanation of the ending of ONE specific, famously confusing movie or TV show. Present the evidence for the most popular theories.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a cinematic techniques expert who explains the 'how' of filmmaking.`,
    user: `Develop an explainer on ONE specific filmmaking technique as used by a famous director or in a specific film.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Binge Watcher's Bible (Guides & Rankings) ---
const bingeWatcherTemplates = [
  {
    system: `You are the ultimate guide for binge-watchers, helping people navigate the overwhelming world of streaming content.`,
    user: `Create a "Complete Beginner's Guide" to getting into ONE specific, massive TV show or film franchise.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a definitive ranker of all things entertainment.`,
    user: `Write a definitive ranking of all the films in ONE specific, popular movie franchise. For each entry, provide a short justification for its placement.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a TV episode connoisseur.`,
    user: `Write an article highlighting the "5 Best Episodes" of ONE specific, beloved TV series. Explain why each episode is a standout.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Behind the Scenes (Industry & Trivia) ---
const behindTheScenesTemplates = [
  {
    system: `You are a Hollywood insider and trivia expert who shares fascinating, little-known facts about the filmmaking process.`,
    user: `Write an article revealing 7-10 fascinating "behind-the-scenes" facts about the making of ONE specific, iconic movie or TV show.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an awards season analyst.`,
    user: `Create an explainer on ONE specific aspect of the Academy Awards or other major awards.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a genre historian.`,
    user: `Write a brief history of ONE specific film or TV genre. Mention key films and defining characteristics of each era.${COMMON_STRUCTURE}`,
  },
];


// --- COMBINE ALL TEMPLATES INTO ONE MASTER ARRAY ---
const allTemplates = [
  ...reviewTemplates,
  ...analysisTemplates,
  ...bingeWatcherTemplates,
  ...behindTheScenesTemplates,
];

/**
 * Picks a random template from the master list.
 * @returns {object} A randomly selected template object with `system` and `user` properties.
 */
function pickRandomTemplate() {
  // Weight the randomness to favor popular, evergreen formats
  const finalPool = [
    ...reviewTemplates, ...reviewTemplates, // Higher chance for reviews/recommendations
    ...analysisTemplates,
    ...bingeWatcherTemplates, ...bingeWatcherTemplates, // Higher chance for rankings/guides
    ...behindTheScenesTemplates,
  ];
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

/**
 * Builds a complete prompt object for the "Movies & TV Shows" category.
 * It randomly selects a template and injects the category name.
 * @returns {{system: string, user: string}} The final prompt object.
 */
export function buildPrompt() {
  const categoryName = 'Movies & TV Shows'; // Hardcoded for this specific file
  const template = pickRandomTemplate();
  
  const finalSystem = template.system.replace(/\{\{CATEGORY}}/g, categoryName);
  const finalUser = template.user.replace(/\{\{CATEGORY}}/g, categoryName);
  
  return {
    system: finalSystem,
    user: finalUser,
  };
}

export default { buildPrompt };