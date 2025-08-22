/*
 * Prompt templates for the "Real Estate & Property" category.
 *
 * This file contains over 40 unique and creative prompt templates designed to generate
 * a wide variety of specific, high-quality articles about buying, selling, renting, investing,
 * and maintaining property. Each template instructs the AI to choose a narrow sub-topic,
 * ensuring that repeated use of this file still results in unique and valuable content.
 */

import { COMMON_STRUCTURE } from './common_structure.js';

// --- TEMPLATE GROUP: The Buyer's Playbook (For Homebuyers) ---
const buyerTemplates = [
  {
    system: `You are a seasoned and trustworthy real estate agent who guides first-time homebuyers through the entire process with patience and clarity.`,
    user: `Write a complete, step-by-step "Beginner's Guide" to ONE specific, crucial stage of the home-buying process. Break down the jargon and explain what happens at each step.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a mortgage expert who simplifies complex financial topics for homebuyers.`,
    user: `Create a detailed explainer on ONE specific, often misunderstood mortgage topic. Provide clear definitions and real-world examples.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a home-buying strategist who helps people find the right property.`,
    user: `Write a guide on how to approach ONE specific aspect of the property search.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a real estate market analyst.`,
    user: `Develop a guide to navigating ONE specific type of real estate market.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Seller's Toolkit (For Home Sellers) ---
const sellerTemplates = [
  {
    system: `You are a top-performing real estate agent who specializes in helping homeowners maximize their sale price.`,
    user: `Write a detailed guide on how to prepare a home for sale, focusing on ONE specific, high-impact area. Provide a checklist of actionable tasks.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a real estate pricing strategist.`,
    user: `Create an explainer on ONE specific aspect of pricing or selling a home.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a home improvement expert who advises on ROI.`,
    user: `Write an article detailing the 5-7 home improvements that offer the best return on investment (ROI) for sellers. Explain why these specific updates add value.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a "For Sale By Owner" (FSBO) coach.`,
    user: `Develop a guide to ONE specific, critical task for someone selling their home without an agent.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Renter's Guidebook ---
const renterTemplates = [
  {
    system: `You are a renter's advocate who helps tenants navigate the rental market and understand their rights.`,
    user: `Write a practical guide for renters on ONE specific aspect of the rental process.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a small-space living expert who helps renters maximize their space.`,
    user: `Create a guide with 5-7 clever, renter-friendly tips for improving a rental property.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Investor's Corner (For Property Investors) ---
const investorTemplates = [
  {
    system: `You are a seasoned real estate investor who shares strategies for building wealth through property.`,
    user: `Write a "Beginner's Guide" to ONE specific real estate investment strategy. Cover the pros, cons, and essential first steps.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a property management expert.`,
    user: `Create a guide for new landlords on ONE specific aspect of property management.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a real estate finance analyst.`,
    user: `Develop an explainer on ONE specific financial concept in real estate investing.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Homeownership & Property Maintenance ---
const homeownerTemplates = [
  {
    system: `You are a homeownership advisor who helps new owners manage their property.`,
    user: `Write a helpful guide for new homeowners on ONE specific, often overlooked aspect of owning a home.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a home equity expert.`,
    user: `Create a clear explainer on ONE specific topic related to home equity.${COMMON_STRUCTURE}`,
  },
];


// --- COMBINE ALL TEMPLATES INTO ONE MASTER ARRAY ---
const allTemplates = [
  ...buyerTemplates,
  ...sellerTemplates,
  ...renterTemplates,
  ...investorTemplates,
  ...homeownerTemplates,
];

/**
 * Picks a random template from the master list.
 * @returns {object} A randomly selected template object with `system` and `user` properties.
 */
function pickRandomTemplate() {
  // Weight the randomness to favor the most common user journeys
  const finalPool = [
    ...buyerTemplates, ...buyerTemplates, ...buyerTemplates, // Highest chance for buyers
    ...sellerTemplates, ...sellerTemplates, // Higher chance for sellers
    ...renterTemplates,
    ...investorTemplates,

    ...homeownerTemplates,
  ];
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

/**
 * Builds a complete prompt object for the "Real Estate & Property" category.
 * It randomly selects a template and injects the category name.
 * @returns {{system: string, user: string}} The final prompt object.
 */
export function buildPrompt() {
  const categoryName = 'Real Estate & Property'; // Hardcoded for this specific file
  const template = pickRandomTemplate();
  
  const finalSystem = template.system.replace(/\{\{CATEGORY}}/g, categoryName);
  const finalUser = template.user.replace(/\{\{CATEGORY}}/g, categoryName);
  
  return {
    system: finalSystem,
    user: finalUser,
  };
}

export default { buildPrompt };