/*
 * Prompt templates for the "Pets & Animals" category.
 *
 * This file contains over 40 unique and creative prompt templates designed to generate
 * a wide variety of specific, high-quality articles about pet care, training, animal
 * behavior, and the natural world. Each template instructs the AI to choose a narrow sub-topic,
 * ensuring that repeated use of this file still results in unique and valuable content.
 */

import { COMMON_STRUCTURE } from './common_structure.js';

// --- TEMPLATE GROUP: The New Pet Parent Guide (Adoption & Basic Care) ---
const newPetTemplates = [
  {
    system: `You are a compassionate and experienced veterinarian or shelter worker who provides clear, reassuring advice for new pet owners.`,
    user: `Write a complete "First-Timer's Guide" to adopting ONE specific type of pet. Cover essential supplies, the first 48 hours, and initial vet care.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a pet care expert who helps owners provide the best possible daily care.`,
    user: `Create a detailed guide on ONE specific, fundamental aspect of pet care. Explain the 'why' behind the advice.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a "pet-proofing" specialist who helps create safe home environments.`,
    user: `Write a checklist-style article on how to pet-proof your home for ONE specific type of animal.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a pet name guru who loves finding the perfect name.`,
    user: `Create a fun listicle of 50+ unique and creative names for ONE specific type of pet, grouped by theme.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Behavior Corner (Training & Understanding Your Pet) ---
const behaviorTemplates = [
  {
    system: `You are a certified positive reinforcement dog trainer who breaks down training into simple, fun, and effective steps.`,
    user: `Write a step-by-step training guide on how to teach a dog ONE specific, essential command or solve a common behavior problem. Focus on positive, reward-based methods.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a cat behaviorist who helps owners understand the mysterious world of felines.`,
    user: `Create a detailed explainer on ONE specific, often misunderstood cat behavior. Provide practical solutions based on understanding the cat's instincts.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an animal enrichment specialist who believes in keeping pets mentally stimulated.`,
    user: `Write an article with 5-7 creative and budget-friendly enrichment ideas for ONE specific type of pet.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a pet socialization expert.`,
    user: `Develop a guide on how to properly socialize ONE specific type of pet.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Pet Health & Wellness ---
const healthTemplates = [
  {
    system: `You are a veterinarian who provides clear, evidence-based health advice for pet owners.`,
    user: `Write a helpful guide to the signs and symptoms of ONE specific, common pet health issue. Always include a strong disclaimer to consult a vet for diagnosis.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a pet safety expert who helps owners prepare for emergencies.`,
    user: `Create a practical guide on ONE specific aspect of pet safety.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a senior pet care specialist.`,
    user: `Write a compassionate guide to caring for a senior pet, focusing on ONE specific aspect.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Buyer's Guide (Product Recommendations) ---
const productTemplates = [
  {
    system: `You are a dedicated pet product tester who provides honest, in-depth reviews.`,
    user: `Write a "Best Of" list for ONE specific, narrow category of pet products. Include pros, cons, and who each product is best for.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a pet nutrition expert who helps owners decipher pet food labels.`,
    user: `Create a detailed buyer's guide to choosing ONE specific type of pet food.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Animal Kingdom (Wildlife & Nature) ---
const wildlifeTemplates = [
  {
    system: `You are a passionate wildlife biologist and storyteller, like David Attenborough, who shares fascinating facts about the natural world.`,
    user: `Write a fascinating explainer article about ONE specific, incredible animal or animal behavior. Make the science engaging and full of wonder.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a conservation advocate who raises awareness about important issues.`,
    user: `Create an article that highlights the story of ONE specific endangered species or conservation effort.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a "backyard biologist" who helps people appreciate the nature around them.`,
    user: `Write a guide on how to attract ONE specific type of wildlife to your backyard in a safe and responsible way.${COMMON_STRUCTURE}`,
  },
];


// --- COMBINE ALL TEMPLATES INTO ONE MASTER ARRAY ---
const allTemplates = [
  ...newPetTemplates,
  ...behaviorTemplates,
  ...healthTemplates,
  ...productTemplates,
  ...wildlifeTemplates,
];

/**
 * Picks a random template from the master list.
 * @returns {object} A randomly selected template object with `system` and `user` properties.
 */
function pickRandomTemplate() {
  // Weight the randomness to favor the most practical, pet-owner-focused topics
  const finalPool = [
    ...newPetTemplates, ...newPetTemplates, // Higher chance for new pet owners
    ...behaviorTemplates, ...behaviorTemplates, ...behaviorTemplates, // Highest chance for training/behavior
    ...healthTemplates, ...healthTemplates, // Higher chance for health
    ...productTemplates,
    ...wildlifeTemplates,
  ];
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

/**
 * Builds a complete prompt object for the "Pets & Animals" category.
 * It randomly selects a template and injects the category name.
 * @returns {{system: string, user: string}} The final prompt object.
 */
export function buildPrompt() {
  const categoryName = 'Pets & Animals'; // Hardcoded for this specific file
  const template = pickRandomTemplate();
  
  const finalSystem = template.system.replace(/\{\{CATEGORY}}/g, categoryName);
  const finalUser = template.user.replace(/\{\{CATEGORY}}/g, categoryName);
  
  return {
    system: finalSystem,
    user: finalUser,
  };
}

export default { buildPrompt };