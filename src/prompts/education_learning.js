/*
 * Prompt templates for the "Education & Learning" category.
 *
 * This file contains over 40 unique and creative prompt templates designed to generate
 * a wide variety of specific, high-quality articles about study techniques, skill acquisition,
 * and the science of learning. Each template instructs the AI to choose a narrow sub-topic,
 * ensuring that repeated use of this file still results in unique and valuable content.
 */

import { COMMON_STRUCTURE } from './common_structure.js';

// --- TEMPLATE GROUP: The Study Lab (Meta-Learning & Techniques) ---
const studyTechniqueTemplates = [
  {
    system: `You are a learning scientist and cognitive psychologist who explains evidence-based study techniques.`,
    user: `Write a detailed, step-by-step guide on how to use ONE specific, powerful learning technique. Explain the science behind why it works and provide a practical example.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a productivity coach for students who helps them overcome common learning obstacles.`,
    user: `Create a practical guide on how to solve ONE specific study-related problem. Provide 5-7 actionable strategies.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert on memory who makes complex concepts easy to apply.`,
    user: `Write an article explaining how to use ONE specific memory enhancement technique. Use a clear, real-world example.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a note-taking specialist who helps students capture and retain information effectively.`,
    user: `Develop a complete guide to ONE specific method of note-taking.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a test preparation expert.`,
    user: `Write a strategic guide on how to prepare for ONE specific type of exam.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Skill Mastery Blueprints (Learning Specific Skills) ---
const skillMasteryTemplates = [
  {
    system: `You are a skill acquisition expert who creates clear roadmaps for beginners.`,
    user: `Create a comprehensive, step-by-step roadmap for a beginner to learn ONE specific, popular skill. Break the journey down into manageable phases and recommend resources for each step.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a creative instructor who teaches artistic skills.`,
    user: `Write a "Your First Week" guide to learning ONE specific creative skill. Provide a simple, confidence-building project for each day.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a practical skills coach who focuses on real-world abilities.`,
    user: `Develop a tutorial on how to learn ONE specific, practical life or career skill. Focus on the core components needed for basic competency.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Digital Backpack (Tools & Resources) ---
const toolTemplates = [
  {
    system: `You are an ed-tech reviewer who provides honest, practical advice on learning tools.`,
    user: `Write a "best of" list for ONE specific category of educational apps or websites. Include pros, cons, and who each tool is best for.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a curator of high-quality learning content.`,
    user: `Create a curated list of the best free online resources for learning about ONE specific, popular subject. Justify each recommendation.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a product comparison specialist for learning platforms.`,
    user: `Write a detailed comparison of two popular online learning platforms to help readers choose.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Education Explained (Concepts & Theories) ---
const conceptTemplates = [
  {
    system: `You are an education theorist who can explain complex ideas in a simple, accessible way.`,
    user: `Write a clear explainer article on ONE specific, influential learning theory or concept. Explain the concept and its practical application for learners.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an educational myth-buster who separates science from pseudoscience.`,
    user: `Write a myth-busting article that debunks ONE specific, persistent myth in education. Use scientific evidence to support your claims.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a guide to different educational philosophies.`,
    user: `Create a beginner's guide to ONE specific educational philosophy. Explain the core principles and how it differs from traditional education.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Future of Learning (Trends & Innovation) ---
const futureTemplates = [
  {
    system: `You are a futurist and trend analyst focused on the evolution of education.`,
    user: `Write a trend analysis article about ONE specific emerging trend in education and learning. Explain the trend and its potential impact on the future of learning.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an advocate for lifelong learning.`,
    user: `Create an inspiring article on the importance of ONE specific aspect of adult or lifelong learning.${COMMON_STRUCTURE}`,
  },
];


// --- COMBINE ALL TEMPLATES INTO ONE MASTER ARRAY ---
const allTemplates = [
  ...studyTechniqueTemplates,
  ...skillMasteryTemplates,
  ...toolTemplates,
  ...conceptTemplates,
  ...futureTemplates,
];

/**
 * Picks a random template from the master list.
 * @returns {object} A randomly selected template object with `system` and `user` properties.
 */
function pickRandomTemplate() {
  // Weight the randomness to favor the most practical and searched-for topics
  const finalPool = [
    ...studyTechniqueTemplates, ...studyTechniqueTemplates, ...studyTechniqueTemplates, // Higher chance for study tips
    ...skillMasteryTemplates, ...skillMasteryTemplates, // Higher chance for skill roadmaps
    ...toolTemplates,
    ...conceptTemplates,
    ...futureTemplates,
  ];
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

/**
 * Builds a complete prompt object for the "Education & Learning" category.
 * It randomly selects a template and injects the category name.
 * @returns {{system: string, user: string}} The final prompt object.
 */
export function buildPrompt() {
  const categoryName = 'Education & Learning'; // Hardcoded for this specific file
  const template = pickRandomTemplate();
  
  const finalSystem = template.system.replace(/\{\{CATEGORY}}/g, categoryName);
  const finalUser = template.user.replace(/\{\{CATEGORY}}/g, categoryName);
  
  return {
    system: finalSystem,
    user: finalUser,
  };
}

export default { buildPrompt };