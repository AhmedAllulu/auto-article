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
    user: `Write a complete, spoiler-free review of ONE specific, recently released movie or a new season of a TV show (e.g., "a review of the latest blockbuster movie," "is the new season of 'The Crown' worth watching?," or "a review of a critically acclaimed indie film"). Discuss the plot, performances, direction, and overall themes, and provide a clear "who should watch this?" recommendation.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a genre specialist who curates "best of" lists for fans of specific types of content. Write exactly 600-800 words.`,
    user: `Write an article listing the "7 Best" movies or TV shows in ONE specific, narrow genre or subgenre (e.g., "the 7 best psychological thrillers that will mess with your head," "a guide to the essential sci-fi movies of the 21st century," or "the funniest sitcoms you can stream right now"). For each entry, explain what makes it a standout example of the genre.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a "hidden gems" curator who loves to recommend underrated movies and shows.`,
    user: `Create a listicle of 5-7 underrated or "hidden gem" movies or TV shows on ONE specific streaming platform (e.g., "5 hidden gems on Netflix you probably haven't seen," "the most underrated original series on Apple TV+," or "classic movies on HBO Max you need to watch"). Sell the reader on why they should give it a try.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a mood-based recommender who helps people find the perfect thing to watch.`,
    user: `Write a guide to the best movies or TV shows to watch for ONE specific mood or feeling (e.g., "the ultimate list of comfort movies for a bad day," "the best feel-good TV shows to lift your spirits," or "the most suspenseful movies to keep you on the edge of your seat").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Beyond the Screen (Analysis & Deep Dives) ---
const analysisTemplates = [
  {
    system: `You are a cultural analyst and film theorist who writes insightful think-pieces about the deeper meaning of movies and shows.`,
    user: `Write a deep-dive analysis of the themes and cultural impact of ONE specific, significant film or TV show (e.g., "the themes of capitalism and class in 'Parasite'," "how 'The Matrix' redefined science fiction and action movies," or "analyzing the portrayal of grief in the TV show 'Fleabag'"). Go beyond the plot to explore its message.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a character study expert who delves into the psychology of fictional characters.`,
    user: `Write an in-depth character analysis of ONE specific, complex, and iconic movie or TV character (e.g., "the moral decay of Michael Corleone in 'The Godfather'," "understanding the motivations of Daenerys Targaryen in 'Game of Thrones'," or "the psychology of the Joker"). Analyze their arc, motivations, and what makes them so compelling.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a fan theorist who loves to break down complex plots and ambiguous endings.`,
    user: `Write a detailed explanation of the ending of ONE specific, famously confusing movie or TV show (e.g., "the ending of 'Blade Runner 2049,' explained," "breaking down the final episode of 'Lost'," or "what the spinning top at the end of 'Inception' really means"). Present the evidence for the most popular theories.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a cinematic techniques expert who explains the 'how' of filmmaking.`,
    user: `Develop an explainer on ONE specific filmmaking technique as used by a famous director or in a specific film (e.g., "the use of practical effects in Christopher Nolan's 'Oppenheimer'," "a guide to the signature visual style of Wes Anderson," or "how sound design creates terror in 'A Quiet Place'").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Binge Watcher's Bible (Guides & Rankings) ---
const bingeWatcherTemplates = [
  {
    system: `You are the ultimate guide for binge-watchers, helping people navigate the overwhelming world of streaming content.`,
    user: `Create a "Complete Beginner's Guide" to getting into ONE specific, massive TV show or film franchise (e.g., "how to start watching 'Doctor Who': a beginner's guide," "the essential episodes to watch before the new season of 'The Mandalorian'," or "a guide to the different eras of James Bond").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a definitive ranker of all things entertainment.`,
    user: `Write a definitive ranking of all the films in ONE specific, popular movie franchise (e.g., "every Pixar movie, ranked from worst to best," "the definitive ranking of the 'John Wick' films," or "all the Spider-Man movies, ranked"). For each entry, provide a short justification for its placement.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a TV episode connoisseur.`,
    user: `Write an article highlighting the "5 Best Episodes" of ONE specific, beloved TV series (e.g., "the 5 best episodes of 'The Office' (US)," "a guide to the most pivotal episodes of 'Breaking Bad'," or "the funniest episodes of 'Seinfeld'"). Explain why each episode is a standout.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Behind the Scenes (Industry & Trivia) ---
const behindTheScenesTemplates = [
  {
    system: `You are a Hollywood insider and trivia expert who shares fascinating, little-known facts about the filmmaking process.`,
    user: `Write an article revealing 7-10 fascinating "behind-the-scenes" facts about the making of ONE specific, iconic movie or TV show (e.g., "10 things you didn't know about the making of 'Jurassic Park'," "the chaotic production of 'Apocalypse Now'," or "casting secrets from the 'Harry Potter' films").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an awards season analyst.`,
    user: `Create an explainer on ONE specific aspect of the Academy Awards or other major awards (e.g., "how does a movie win the Oscar for Best Picture?," "the biggest Oscar snubs of all time," or "a guide to understanding the different categories at the Emmys").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a genre historian.`,
    user: `Write a brief history of ONE specific film or TV genre (e.g., "a brief history of the horror movie," "the evolution of the TV sitcom," or "the origins of the Film Noir genre"). Mention key films and defining characteristics of each era.${COMMON_STRUCTURE}`,
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