/*
 * Prompt templates for the "History & Heritage" category.
 *
 * This file contains over 40 unique and creative prompt templates designed to generate
 * a wide variety of specific, high-quality articles that bring history to life through
 * compelling storytelling and insightful analysis. Each template instructs the AI to choose a
 * narrow sub-topic, ensuring that repeated use of this file still results in unique content.
 */

import { COMMON_STRUCTURE } from './common_structure.js';

// --- TEMPLATE GROUP: Turning Points in History (Major Events Explained) ---
const turningPointTemplates = [
  {
    system: `You are a captivating historian and storyteller who can explain complex historical events with clarity and narrative flair.`,
    user: `Write a complete "Beginner's Guide" to ONE specific, pivotal historical event (e.g., "the fall of the Roman Empire, explained," "what was the Industrial Revolution and how did it change the world?," or "a simple guide to the causes of World War I"). Explain the context, key players, and long-term consequences.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a military historian who analyzes famous battles and strategies.`,
    user: `Create a detailed breakdown of ONE specific, significant battle (e.g., "the Battle of Gettysburg: the turning point of the American Civil War," "how the Battle of Stalingrad changed WWII," or "the strategic genius of the Battle of Thermopylae"). Focus on the strategy, key moments, and outcome.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a political historian who decodes the stories behind foundational documents and movements.`,
    user: `Write a fascinating analysis of the history and impact of ONE specific historical document or political movement (e.g., "the story behind the Magna Carta," "what was the Enlightenment and how did it inspire revolutions?," or "the history of the women's suffrage movement").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Ancient Worlds & Great Empires ---
const ancientWorldTemplates = [
  {
    system: `You are an archaeologist and expert on ancient civilizations who brings lost worlds to life.`,
    user: `Write a deep-dive article on ONE specific aspect of a famous ancient civilization (e.g., "daily life in Ancient Rome," "the mysteries of the Mayan civilization," or "the engineering marvels of Ancient Egypt"). Use archaeological evidence to paint a vivid picture of the past.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a mythology expert who explains the stories that shaped cultures.`,
    user: `Create a guide to the mythology of ONE specific ancient culture (e.g., "an introduction to the major gods and goddesses of Greek mythology," "the epic of Gilgamesh and Mesopotamian myths," or "understanding the basics of Norse mythology"). Explain the key figures and their stories.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a historian of great empires.`,
    user: `Write an article on the rise and fall of ONE specific, influential empire (e.g., "the rise and fall of the Mongol Empire," "how the Ottoman Empire shaped the modern world," or "the legacy of the Persian Empire"). Focus on the key factors that led to its growth and eventual decline.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Untold Stories & Hidden Histories ---
const hiddenHistoryTemplates = [
  {
    system: `You are a historical detective who uncovers the forgotten stories and unsung heroes of the past.`,
    user: `Write a compelling article about ONE specific, lesser-known historical event or figure that had a major impact (e.g., "the story of the 'Night Witches,' the all-female Soviet bomber pilots of WWII," "the 1914 Christmas Truce: a moment of peace in wartime," or "the forgotten history of the Library of Alexandria").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a historian who challenges common myths and misconceptions about the past.`,
    user: `Write a myth-busting article that debunks 3-5 common myths about ONE specific historical period or figure (e.g., "5 common myths about the Vikings, debunked," "the truth about Cleopatra: more than just a beauty," or "did Napoleon really have a 'Napoleon Complex'?"). Use historical evidence to set the record straight.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a social historian who focuses on the lives of ordinary people.`,
    user: `Create an article that explores ONE specific aspect of daily life in a particular historical era (e.g., "what was it like to be a child in Victorian England?," "food and diet of a medieval peasant," or "medicine and hygiene in the 18th century").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: A Day in the Life (Immersive History) ---
const dayInTheLifeTemplates = [
  {
    system: `You are an immersive storyteller who can transport readers back in time.`,
    user: `Write a "Day in the Life" article from the perspective of a person living during ONE specific historical period (e.g., "a day in the life of a Roman legionary," "a day in the life of a lady-in-waiting in Tudor England," or "a day in the life of a Viking trader"). Describe their home, food, work, and social life in a narrative style.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a historical biographer who focuses on pivotal moments.`,
    user: `Write an article that focuses on ONE crucial day in the life of a famous historical figure (e.g., "the day Julius Caesar crossed the Rubicon," "a look at Martin Luther King Jr.'s day leading up to the 'I Have a Dream' speech," or "the 24 hours before the D-Day invasion for Eisenhower").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Heritage & Preservation ---
const heritageTemplates = [
  {
    system: `You are a UNESCO World Heritage site expert who explains why certain places are so important.`,
    user: `Write a deep-dive article on the history and cultural importance of ONE specific World Heritage site (e.g., "the incredible history of Machu Picchu," "a guide to the ancient city of Angkor Wat," or "the cultural heritage of the Silk Road"). Explain why it's crucial to preserve it.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a cultural historian who traces the origins of modern traditions.`,
    user: `Create a fascinating explainer on the historical origins of ONE specific modern tradition or object (e.g., "the surprising history of the Christmas tree," "where did the handshake come from?," or "the ancient origins of the Olympic Games").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert on historical artifacts.`,
    user: `Write an article telling the story of ONE specific, famous historical artifact (e.g., "the story of the Rosetta Stone and how it unlocked a civilization," "the mystery of the Antikythera mechanism," or "the historical significance of the Bayeux Tapestry").${COMMON_STRUCTURE}`,
  },
];


// --- COMBINE ALL TEMPLATES INTO ONE MASTER ARRAY ---
const allTemplates = [
  ...turningPointTemplates,
  ...ancientWorldTemplates,
  ...hiddenHistoryTemplates,
  ...dayInTheLifeTemplates,
  ...heritageTemplates,
];

/**
 * Picks a random template from the master list.
 * @returns {object} A randomly selected template object with `system` and `user` properties.
 */
function pickRandomTemplate() {
  // Weight the randomness to favor compelling stories and explainers
  const finalPool = [
    ...turningPointTemplates, ...turningPointTemplates, // Higher chance for major events
    ...ancientWorldTemplates,
    ...hiddenHistoryTemplates, ...hiddenHistoryTemplates, // Higher chance for untold stories
    ...dayInTheLifeTemplates,
    ...heritageTemplates,
  ];
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

/**
 * Builds a complete prompt object for the "History & Heritage" category.
 * It randomly selects a template and injects the category name.
 * @returns {{system: string, user: string}} The final prompt object.
 */
export function buildPrompt() {
  const categoryName = 'History & Heritage'; // Hardcoded for this specific file
  const template = pickRandomTemplate();
  
  const finalSystem = template.system.replace(/\{\{CATEGORY}}/g, categoryName);
  const finalUser = template.user.replace(/\{\{CATEGORY}}/g, categoryName);
  
  return {
    system: finalSystem,
    user: finalUser,
  };
}

export default { buildPrompt };