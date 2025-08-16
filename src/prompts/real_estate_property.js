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
    user: `Write a complete, step-by-step "Beginner's Guide" to ONE specific, crucial stage of the home-buying process (e.g., "how to get pre-approved for a mortgage," "a guide to making a winning offer on a house," or "what to expect during a home inspection"). Break down the jargon and explain what happens at each step.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a mortgage expert who simplifies complex financial topics for homebuyers.`,
    user: `Create a detailed explainer on ONE specific, often misunderstood mortgage topic (e.g., "FHA vs. Conventional loans: which is right for you?," "what are closing costs and how much should you expect to pay?," or "how to improve your credit score before buying a home"). Provide clear definitions and real-world examples.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a home-buying strategist who helps people find the right property.`,
    user: `Write a guide on how to approach ONE specific aspect of the property search (e.g., "how to choose the right neighborhood," "a checklist for your first open house visit," or "condo vs. single-family home: a complete comparison for buyers").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a real estate market analyst.`,
    user: `Develop a guide to navigating ONE specific type of real estate market (e.g., "tips for buying a home in a competitive seller's market," "how to find a good deal in a buyer's market," or "what to know before buying a new construction home").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Seller's Toolkit (For Home Sellers) ---
const sellerTemplates = [
  {
    system: `You are a top-performing real estate agent who specializes in helping homeowners maximize their sale price.`,
    user: `Write a detailed guide on how to prepare a home for sale, focusing on ONE specific, high-impact area (e.g., "10 low-cost ways to boost your home's curb appeal," "a guide to staging your living room to sell," or "how to declutter your home before listing it"). Provide a checklist of actionable tasks.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a real estate pricing strategist.`,
    user: `Create an explainer on ONE specific aspect of pricing or selling a home (e.g., "how to determine the right asking price for your home," "understanding the home appraisal process," or "a guide to navigating offers and counteroffers").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a home improvement expert who advises on ROI.`,
    user: `Write an article detailing the 5-7 home improvements that offer the best return on investment (ROI) for sellers (e.g., "a minor kitchen remodel," "updating bathroom fixtures," or "a fresh coat of neutral paint"). Explain why these specific updates add value.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a "For Sale By Owner" (FSBO) coach.`,
    user: `Develop a guide to ONE specific, critical task for someone selling their home without an agent (e.g., "how to market your home as a FSBO," "a guide to the legal paperwork you'll need to sell your own home," or "how to host a successful open house").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Renter's Guidebook ---
const renterTemplates = [
  {
    system: `You are a renter's advocate who helps tenants navigate the rental market and understand their rights.`,
    user: `Write a practical guide for renters on ONE specific aspect of the rental process (e.g., "how to find a great apartment in a competitive market," "a checklist of things to look for before signing a lease," or "a guide to understanding your rights as a tenant").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a small-space living expert who helps renters maximize their space.`,
    user: `Create a guide with 5-7 clever, renter-friendly tips for improving a rental property (e.g., "how to decorate your rental without losing your security deposit," "genius storage solutions for small apartments," or "how to upgrade your rental kitchen on a budget").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Investor's Corner (For Property Investors) ---
const investorTemplates = [
  {
    system: `You are a seasoned real estate investor who shares strategies for building wealth through property.`,
    user: `Write a "Beginner's Guide" to ONE specific real estate investment strategy (e.g., "an introduction to buying your first rental property," "what is house hacking and how to get started," or "a guide to flipping houses for beginners"). Cover the pros, cons, and essential first steps.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a property management expert.`,
    user: `Create a guide for new landlords on ONE specific aspect of property management (e.g., "how to screen and find reliable tenants," "a guide to setting the right rental price," or "5 common mistakes new landlords make and how to avoid them").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a real estate finance analyst.`,
    user: `Develop an explainer on ONE specific financial concept in real estate investing (e.g., "how to calculate cash flow on a rental property," "understanding the 1% rule of real estate investing," or "a guide to using leverage to buy investment properties").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Homeownership & Property Maintenance ---
const homeownerTemplates = [
  {
    system: `You are a homeownership advisor who helps new owners manage their property.`,
    user: `Write a helpful guide for new homeowners on ONE specific, often overlooked aspect of owning a home (e.g., "a guide to understanding property taxes and homeowner's insurance," "how to create a home maintenance budget," or "the essential tools every new homeowner should own").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a home equity expert.`,
    user: `Create a clear explainer on ONE specific topic related to home equity (e.g., "what is home equity and how can you use it?," "a guide to Home Equity Loans vs. HELOCs," or "how to increase the value of your home").${COMMON_STRUCTURE}`,
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