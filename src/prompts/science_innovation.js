/*
 * Prompt templates for the "Science & Innovation" category.
 *
 * This file contains over 60 unique and creative prompt templates designed to generate
 * a wide variety of specific, high-quality articles that make complex science and
 * technology topics accessible and exciting. Each template instructs the AI to choose a
 * narrow sub-topic, ensuring that repeated use of this file still results in unique content.
 */

import { COMMON_STRUCTURE } from './common_structure.js';

// --- TEMPLATE GROUP: Big Concept Explainers (The "What Is...?" Series) ---
const bigConceptTemplates = [
  {
    system: `You are a gifted science communicator, like Carl Sagan or Neil deGrasse Tyson, who can explain profound concepts with clarity and wonder.`,
    user: `Write a fascinating explainer article on ONE fundamental, mind-bending scientific concept. Assume the reader is intelligent but has no prior knowledge. Use analogies to make it understandable.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a biology expert who can demystify the building blocks of life.`,
    user: `Create a clear, jargon-free guide to ONE specific, complex biological process. Focus on the 'how' and the 'why' it's important.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a computer scientist who makes the digital world understandable.`,
    user: `Write a simple but comprehensive explainer on ONE core concept of modern computing.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a patient teacher who breaks down intimidating subjects.`,
    user: `Develop a "Science 101" article that explains the basics of ONE entire field of science for absolute beginners.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Innovation Spotlights (The Future Is Now) ---
const innovationTemplates = [
  {
    system: `You are a futurist and tech scout who identifies game-changing innovations. Write with an exciting, forward-looking tone.`,
    user: `Write a deep-dive article on ONE specific, cutting-edge technology that is poised to change the world. Explain the technology and its potential impact.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an innovation analyst who evaluates the real-world application of new tech.`,
    user: `Create a detailed analysis of ONE specific recent scientific breakthrough. Focus on the results and future implications.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a materials scientist who gets excited about the building blocks of the future.`,
    user: `Write a fascinating spotlight on ONE specific advanced material. Explain what it is and what it could be used for.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a robotics expert.`,
    user: `Develop a guide to the latest advancements in ONE specific area of robotics.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: How Things Work (The Mechanics of the Universe) ---
const howThingsWorkTemplates = [
  {
    system: `You are an engineer who loves to explain the mechanics behind everyday and complex technologies.`,
    user: `Write a clear, step-by-step explanation of how ONE specific piece of modern technology works. Use simple language and diagrams/descriptions.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a natural science expert who explains the world around us.`,
    user: `Create a fascinating guide to the science behind ONE specific natural phenomenon.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a biologist who explains the inner workings of the living world.`,
    user: `Write an article explaining the biological mechanics of ONE specific process.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Science in Our Lives (The Practical Application) ---
const practicalScienceTemplates = [
  {
    system: `You are a practical science writer who connects scientific principles to everyday life.`,
    user: `Write an article that reveals the surprising science behind ONE common daily activity or object.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a neuroscience communicator who makes brain science accessible.`,
    user: `Create a guide to the science of ONE specific mental process.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an environmental scientist who explains our planet's processes.`,
    user: `Develop an explainer on the science behind ONE specific environmental issue.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Pioneers & Discoveries (The History of Science) ---
const historyTemplates = [
  {
    system: `You are a science historian and storyteller who brings the past to life.`,
    user: `Write a compelling narrative about ONE specific, pivotal scientific discovery or invention. Focus on the human story behind the science.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a biographer of great scientific minds.`,
    user: `Create a profile of ONE specific, influential scientist, focusing on their key contribution.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Myth-Busting & Fact-Checking ---
const mythBustingTemplates = [
  {
    system: `You are a critical thinker and science journalist who debunks misinformation with evidence.`,
    user: `Write a myth-busting article that tackles 5-7 common misconceptions about ONE specific scientific topic. Use clear, evidence-based arguments.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Ethical Dilemmas & The Big Questions ---
const ethicsTemplates = [
  {
    system: `You are a science ethicist who thoughtfully explores the societal implications of innovation.`,
    user: `Write a balanced and thought-provoking article on the ethical dilemmas surrounding ONE specific emerging technology. Explore the pros and cons without taking a hard stance.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a philosopher of science who asks the big questions.`,
    user: `Create an article exploring ONE of the great unanswered questions in science. Explain the current state of research and the challenges involved.${COMMON_STRUCTURE}`,
  },
];


// --- COMBINE ALL TEMPLATES INTO ONE MASTER ARRAY ---
const allTemplates = [
  ...bigConceptTemplates,
  ...innovationTemplates,
  ...howThingsWorkTemplates,
  ...practicalScienceTemplates,
  ...historyTemplates,
  ...mythBustingTemplates,
  ...ethicsTemplates,
];

/**
 * Picks a random template from the master list.
 * @returns {object} A randomly selected template object with `system` and `user` properties.
 */
function pickRandomTemplate() {
  // Weight the randomness to favor the most accessible and popular article types
  const finalPool = [
    ...bigConceptTemplates, ...bigConceptTemplates, // Higher chance for explainers
    ...innovationTemplates, ...innovationTemplates, // Higher chance for future tech
    ...howThingsWorkTemplates, ...howThingsWorkTemplates, // Higher chance for "how it works"
    ...practicalScienceTemplates,
    ...historyTemplates,
    ...mythBustingTemplates,
    ...ethicsTemplates,
  ];
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

/**
 * Builds a complete prompt object for the "Science & Innovation" category.
 * It randomly selects a template and injects the category name.
 * @returns {{system: string, user: string}} The final prompt object.
 */
export function buildPrompt() {
  const categoryName = 'Science & Innovation'; // Hardcoded for this specific file
  const template = pickRandomTemplate();
  
  const finalSystem = template.system.replace(/\{\{CATEGORY}}/g, categoryName);
  const finalUser = template.user.replace(/\{\{CATEGORY}}/g, categoryName);
  
  return {
    system: finalSystem,
    user: finalUser,
  };
}

export default { buildPrompt };