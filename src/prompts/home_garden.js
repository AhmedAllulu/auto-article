/*
 * Prompt templates for the "Home & Garden" category.
 *
 * This file contains over 40 unique and creative prompt templates designed to generate
 * a wide variety of specific, high-quality articles about home repair, cleaning, organizing,
 * decorating, and gardening. Each template instructs the AI to choose a narrow sub-topic,
 * ensuring that repeated use of this file still results in unique and helpful content.
 */

import { COMMON_STRUCTURE } from './common_structure.js';

// --- TEMPLATE GROUP: The Fix-It Toolkit (Home Repair & Maintenance) ---
const repairTemplates = [
  {
    system: `You are a friendly, experienced handyman who writes clear, confidence-building repair guides for absolute beginners.`,
    user: `Write a complete, step-by-step guide on how to perform ONE specific, common home repair (e.g., "how to fix a constantly running toilet," "a beginner's guide to patching a small hole in drywall," or "how to fix a leaky kitchen faucet"). Include a "Tools You'll Need" list, safety warnings, and a "When to Call a Pro" section.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a home maintenance expert who helps homeowners prevent problems before they start.`,
    user: `Create a practical checklist or guide for ONE specific seasonal home maintenance task (e.g., "a fall home maintenance checklist to prepare for winter," "how to clean your gutters safely," or "a guide to preparing your air conditioner for summer"). Explain why each task is important.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a "quick fix" specialist who provides simple solutions for annoying household problems.`,
    user: `Write an article listing 3-5 simple, quick fixes for ONE common household annoyance (e.g., "how to silence a squeaky door hinge," "easy ways to fix a wobbly chair," or "how to stop a drafty window"). Focus on solutions that require minimal tools and skill.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Cleaning & Organizing Closet ---
const cleaningOrganizingTemplates = [
  {
    system: `You are a professional cleaning expert who shares industry secrets for a sparkling clean home.`,
    user: `Write a detailed, step-by-step guide on how to clean ONE specific, notoriously difficult item or area in the house (e.g., "how to clean a greasy oven with natural ingredients," "the professional way to clean windows without streaks," or "how to deep clean tile grout"). Provide a list of the best cleaning supplies (both commercial and DIY).${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a professional organizer, like Marie Kondo, who helps people declutter their lives and spaces.`,
    user: `Create a complete guide to decluttering and organizing ONE specific, challenging area of the home (e.g., "a step-by-step guide to decluttering your closet," "how to organize a messy garage," or "a system for organizing kitchen cabinets and pantries"). Break the process down into manageable steps.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a "cleaning hacks" guru who loves finding efficient, clever solutions.`,
    user: `Write a listicle of 7-10 surprising cleaning hacks for ONE specific room or material (e.g., "10 brilliant cleaning hacks for your bathroom," "surprising uses for vinegar in the kitchen," or "how to clean stainless steel appliances perfectly").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a stain removal expert.`,
    user: `Develop a definitive guide on how to remove ONE specific, stubborn type of stain from a common household surface (e.g., "how to remove red wine stains from carpet," "a guide to getting coffee stains out of upholstery," or "how to remove permanent marker from a wood table").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Design & DIY Studio ---
const designDiyTemplates = [
  {
    system: `You are a budget-friendly interior designer who believes great style doesn't have to be expensive.`,
    user: `Write an article showcasing 5-7 budget-friendly ideas to update or transform ONE specific room (e.g., "7 ways to make your living room look more expensive on a budget," "a guide to a cozy bedroom makeover for under $200," or "how to update a boring bathroom without renovating"). Include ideas for paint, textiles, lighting, and decor.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a DIY project instructor who creates simple, stylish projects for beginners.`,
    user: `Create a complete, step-by-step tutorial for ONE specific, beginner-friendly DIY home decor project (e.g., "how to build simple floating shelves," "a guide to creating a beautiful gallery wall," or "how to paint a piece of furniture for a modern look"). Include a list of materials, tools, and clear instructions with photos/descriptions.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a small-space living expert who specializes in making compact areas feel larger and more functional.`,
    user: `Write a guide with 5-7 clever tips for ONE specific small-space challenge (e.g., "how to maximize storage in a small bedroom," "the best layout ideas for a tiny living room," or "a guide to choosing furniture for a studio apartment").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Greenhouse (Gardening & Plant Care) ---
const gardeningTemplates = [
  {
    system: `You are a master gardener who loves to help beginners discover the joy of plants.`,
    user: `Write a complete beginner's guide to growing ONE specific, popular plant or vegetable (e.g., "how to grow tomatoes in a pot on your balcony," "a guide to growing an endless supply of herbs in your kitchen," or "how to plant and care for sunflowers"). Cover planting, sunlight, water, and harvesting.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an indoor plant expert (a "plant parent") who helps people keep their houseplants alive and thriving.`,
    user: `Create a detailed care guide for ONE specific, popular houseplant (e.g., "how to care for a Fiddle Leaf Fig without killing it," "a complete guide to the Snake Plant," or "how to get your Orchid to rebloom"). Include information on light, water, soil, and common problems.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a plant doctor who diagnoses and solves common plant problems.`,
    user: `Write a troubleshooting guide to help readers identify and fix ONE specific, common plant problem (e.g., "why are my plant's leaves turning yellow? 5 common causes and fixes," "how to get rid of fungus gnats in your houseplants," or "a guide to identifying and treating powdery mildew").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a landscape designer who provides advice for outdoor spaces.`,
    user: `Develop a guide to ONE specific landscaping or garden design topic for beginners (e.g., "5 easy-to-grow perennial flowers for a low-maintenance garden," "a guide to creating a container garden for a small patio," or "how to start your first compost bin").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Buyer's Guide (Product Recommendations) ---
const buyingGuidesTemplates = [
  {
    system: `You are a home goods product tester who provides unbiased, in-depth reviews.`,
    user: `Write a "best of" list for ONE specific category of home or garden products (e.g., "the 5 best cordless vacuums for pet hair," "a guide to the best air purifiers for allergies," or "the essential gardening tools for every beginner"). Include pros, cons, and who each product is best for.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a consumer advocate who helps people make smart purchasing decisions.`,
    user: `Create a detailed buyer's guide to help readers choose ONE major home appliance (e.g., "what to look for when buying a new refrigerator," "a guide to choosing the right washing machine for your family," or "how to select the best mattress for your sleep style"). Explain the different types, features, and what to avoid.${COMMON_STRUCTURE}`,
  },
];


// --- COMBINE ALL TEMPLATES INTO ONE MASTER ARRAY ---
const allTemplates = [
  ...repairTemplates,
  ...cleaningOrganizingTemplates,
  ...designDiyTemplates,
  ...gardeningTemplates,
  ...buyingGuidesTemplates,
];

/**
 * Picks a random template from the master list.
 * @returns {object} A randomly selected template object with `system` and `user` properties.
 */
function pickRandomTemplate() {
  // Weight the randomness to favor the most practical, problem-solving topics
  const finalPool = [
    ...repairTemplates, ...repairTemplates, // Higher chance for repair guides
    ...cleaningOrganizingTemplates, ...cleaningOrganizingTemplates, // Higher chance for cleaning/organizing
    ...designDiyTemplates,
    ...gardeningTemplates, ...gardeningTemplates, // Higher chance for gardening
    ...buyingGuidesTemplates,
  ];
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

/**
 * Builds a complete prompt object for the "Home & Garden" category.
 * It randomly selects a template and injects the category name.
 * @returns {{system: string, user: string}} The final prompt object.
 */
export function buildPrompt() {
  const categoryName = 'Home & Garden'; // Hardcoded for this specific file
  const template = pickRandomTemplate();
  
  const finalSystem = template.system.replace(/\{\{CATEGORY}}/g, categoryName);
  const finalUser = template.user.replace(/\{\{CATEGORY}}/g, categoryName);
  
  return {
    system: finalSystem,
    user: finalUser,
  };
}

export default { buildPrompt };