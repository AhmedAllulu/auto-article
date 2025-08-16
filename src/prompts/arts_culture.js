/*
 * Prompt templates for the "Arts & Culture" category.
 *
 * This file contains over 40 unique and creative prompt templates designed to generate
 * a wide variety of specific, high-quality articles about art history, literature, music,
 * and cultural phenomena. Each template instructs the AI to choose a narrow sub-topic,
 * ensuring that repeated use of this file still results in unique and insightful content.
 */

import { COMMON_STRUCTURE } from './common_structure.js';

// --- TEMPLATE GROUP: Art History 101 (Movements & Artists) ---
const artHistoryTemplates = [
  {
    system: `You are an engaging art historian who makes art history feel like a fascinating story, not a dry lecture.`,
    user: `Write a complete "Beginner's Guide" to ONE specific, major art movement (e.g., "a simple guide to understanding Impressionism," "what is Surrealism? The art of dreams and the subconscious," or "an introduction to the bold colors of Fauvism"). Explain the key ideas, list 3-4 major artists, and describe one iconic artwork.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a biographer who specializes in the lives of great artists.`,
    user: `Create an insightful profile of ONE specific, influential artist, focusing on the story behind their most famous work (e.g., "the story behind Frida Kahlo's 'The Two Fridas'," "Leonardo da Vinci: The genius behind the 'Mona Lisa'," or "what drove Vincent van Gogh to paint 'The Starry Night'?"). Go beyond biography to connect their life to their art.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an art detective who decodes the hidden symbols and meanings in paintings.`,
    user: `Write a fascinating analysis that decodes the symbolism in ONE specific, famous work of art (e.g., "decoding the hidden symbols in Jan van Eyck's 'The Arnolfini Portrait'," "a guide to the allegories in Botticelli's 'Primavera'," or "the political messages in Picasso's 'Guernica'").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a specialist in a particular art form.`,
    user: `Develop a beginner's guide to appreciating ONE specific art form beyond painting (e.g., "how to appreciate sculpture: a beginner's guide," "an introduction to the art of printmaking," or "what is performance art? An explainer").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Critic's Corner (Analysis & Deep Dives) ---
const criticTemplates = [
  {
    system: `You are a sharp cultural critic who analyzes the "why" behind cultural phenomena.`,
    user: `Write a deep-dive analysis of ONE specific cultural trend or movement (e.g., "the rise of street art: from vandalism to valuable," "why are we still fascinated by ancient Greek mythology?," or "the cultural impact of hip-hop on fashion"). Explore its origins, meaning, and significance.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a performing arts expert who helps newcomers understand and appreciate the stage.`,
    user: `Create a beginner's guide to appreciating ONE specific genre of performing arts (e.g., "what is opera and how can a beginner learn to love it?," "a guide to understanding the basics of ballet," or "an introduction to the world of Shakespearean theater"). Demystify the experience and suggest a good first show to watch.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a film analyst who looks at cinema as an art form.`,
    user: `Write an article analyzing the artistic significance of ONE specific, landmark film (e.g., "how 'Citizen Kane' revolutionized filmmaking," "the visual storytelling in 'Blade Runner'," or "the cultural resonance of 'Spirited Away'"). Focus on cinematography, themes, and influence rather than just plot.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Virtual Museum Tour (Curated Guides) ---
const museumTemplates = [
  {
    system: `You are a knowledgeable and friendly museum curator creating a guide for visitors.`,
    user: `Write a curated guide to the "5 Must-See Masterpieces" in ONE specific, world-famous museum (e.g., "5 masterpieces you can't miss at the Louvre," "a highlights tour of the British Museum," or "the essential artworks to see at the Museum of Modern Art (MoMA)"). For each piece, explain what it is and why it's so important.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a thematic art curator who connects art across different eras and cultures.`,
    user: `Create a thematic guide to art, focusing on 5-7 artworks that exemplify ONE specific theme (e.g., "a history of the self-portrait in 7 paintings," "how artists have depicted love through the ages," or "powerful works of political protest art").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an architecture critic who helps people appreciate the buildings around them.`,
    user: `Write a beginner's guide to identifying ONE specific architectural style (e.g., "how to identify Gothic architecture," "a guide to the key features of Art Deco," or "what is Brutalism? An introduction"). Include key characteristics and famous examples.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Literature & The Written Word ---
const literatureTemplates = [
  {
    system: `You are a passionate literature professor who makes classic books feel exciting and relevant.`,
    user: `Write a guide on "Why You Should Read" ONE specific, timeless classic novel (e.g., "why 'Pride and Prejudice' is more than just a romance novel," "the enduring lessons of George Orwell's '1984'," or "why 'Frankenstein' is still a masterpiece of science fiction"). Explain its themes and modern relevance without spoilers.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a poetry advocate who makes poetry accessible to everyone.`,
    user: `Create a beginner's guide to reading and understanding poetry, focusing on ONE specific poet or style (e.g., "an introduction to the poetry of Robert Frost," "how to read a Shakespearean sonnet," or "a guide to the powerful simplicity of Haiku"). Break down one or two short poems as examples.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a literary expert who can explain entire movements.`,
    user: `Write a simple explainer on ONE specific literary movement (e.g., "what was the Harlem Renaissance?," "a guide to the Beat Generation," or "an introduction to Magical Realism in literature"). List key authors and defining characteristics.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Cultural Heritage & Traditions ---
const heritageTemplates = [
  {
    system: `You are a cultural anthropologist who explains the meaning behind global traditions.`,
    user: `Write a fascinating explainer on the history and cultural significance of ONE specific global festival or tradition (e.g., "the meaning and traditions of Día de los Muertos in Mexico," "a guide to the Holi festival of colors in India," or "the art and ceremony of the Japanese tea ceremony").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a historian specializing in ancient civilizations.`,
    user: `Create a guide to the art and culture of ONE specific ancient civilization (e.g., "an introduction to the art and hieroglyphs of Ancient Egypt," "understanding the three orders of Greek architecture," or "the mythology behind Roman sculptures").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a UNESCO World Heritage site expert.`,
    user: `Write a deep-dive article on the history and cultural importance of ONE specific World Heritage site (e.g., "the Great Wall of China: more than just a wall," "a guide to the ancient city of Petra," or "the mysteries of Stonehenge").${COMMON_STRUCTURE}`,
  },
];


// --- COMBINE ALL TEMPLATES INTO ONE MASTER ARRAY ---
const allTemplates = [
  ...artHistoryTemplates,
  ...criticTemplates,
  ...museumTemplates,
  ...literatureTemplates,
  ...heritageTemplates,
];

/**
 * Picks a random template from the master list.
 * @returns {object} A randomly selected template object with `system` and `user` properties.
 */
function pickRandomTemplate() {
  // Weight the randomness to favor the most accessible and popular topics
  const finalPool = [
    ...artHistoryTemplates, ...artHistoryTemplates, ...artHistoryTemplates, // Highest chance for art history
    ...criticTemplates,
    ...museumTemplates, ...museumTemplates, // Higher chance for museum guides
    ...literatureTemplates,

    ...heritageTemplates,
  ];
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

/**
 * Builds a complete prompt object for the "Arts & Culture" category.
 * It randomly selects a template and injects the category name.
 * @returns {{system: string, user: string}} The final prompt object.
 */
export function buildPrompt() {
  const categoryName = 'Arts & Culture'; // Hardcoded for this specific file
  const template = pickRandomTemplate();
  
  const finalSystem = template.system.replace(/\{\{CATEGORY}}/g, categoryName);
  const finalUser = template.user.replace(/\{\{CATEGORY}}/g, categoryName);
  
  return {
    system: finalSystem,
    user: finalUser,
  };
}

export default { buildPrompt };