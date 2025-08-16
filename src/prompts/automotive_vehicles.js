/*
 * Prompt templates for the "Automotive & Vehicles" category.
 *
 * This file contains over 40 unique and creative prompt templates designed to generate
 * a wide variety of specific, high-quality articles about car buying, maintenance, driving
 * skills, and car culture. Each template instructs the AI to choose a narrow sub-topic,
 * ensuring that repeated use of this file still results in unique and valuable content.
 */

import { COMMON_STRUCTURE } from './common_structure.js';

// --- TEMPLATE GROUP: The Driver's Seat (Driving Skills & Car Care) ---
const drivingTemplates = [
  {
    system: `You are a friendly and experienced mechanic who writes clear, confidence-building maintenance guides for absolute beginners.`,
    user: `Write a complete, step-by-step "How-To" guide on ONE specific, basic car maintenance task that anyone can do at home (e.g., "how to check your car's oil level and what to look for," "a beginner's guide to checking and maintaining your tire pressure," or "how to change your windshield wiper blades in 5 minutes"). Include a "Tools You'll Need" list and explain why the task is important.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a professional driving instructor who helps people become safer, more confident drivers.`,
    user: `Create a practical guide on how to master ONE specific, challenging driving skill (e.g., "a step-by-step guide to parallel parking perfectly," "how to drive safely in heavy rain or fog," or "tips for merging onto a busy highway like a pro"). Break down the technique into simple, repeatable steps.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a "car hacks" expert who loves finding clever ways to improve the driving experience.`,
    user: `Write a listicle of 7-10 surprising car hacks for ONE specific purpose (e.g., "10 brilliant hacks to keep your car clean and organized," "surprising ways to improve your car's fuel efficiency," or "how to prepare your car for a long road trip").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a car detailing professional.`,
    user: `Develop a definitive guide on how to properly clean ONE specific part of a car for a professional result (e.g., "how to wash your car without leaving scratches," "a guide to cleaning and conditioning leather seats," or "how to restore foggy headlights").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Buyer's Showroom (Car Buying & Selling) ---
const buyingTemplates = [
  {
    system: `You are a trustworthy and savvy car buying consultant who helps people get the best deal and avoid common pitfalls.`,
    user: `Write a detailed, step-by-step guide to ONE specific, crucial stage of the car-buying process (e.g., "how to test drive a car like an expert," "a guide to negotiating the price of a new or used car," or "how to avoid common dealer tricks and fees"). Provide scripts and checklists.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a car financing expert who simplifies the complex world of auto loans.`,
    user: `Create a detailed explainer on ONE specific, often misunderstood car financing topic (e.g., "Leasing vs. Buying a car: a complete comparison," "how to get a car loan with a low credit score," or "what is GAP insurance and do you need it?").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a used car specialist who knows how to spot a great deal and a lemon.`,
    user: `Write a complete guide on how to inspect a used car before buying it (e.g., "a 10-point checklist for inspecting a used car," "how to spot signs of a previous accident," or "the most reliable used car models under $10,000").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a car selling coach who helps people get the most money for their old vehicle.`,
    user: `Develop a guide to ONE specific aspect of selling a used car (e.g., "how to prepare your car for sale to maximize its value," "a guide to selling your car privately vs. trading it in," or "how to take great photos of your car for an online listing").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Under the Hood (Technology & Mechanics Explained) ---
const mechanicsTemplates = [
  {
    system: `You are a master mechanic and automotive engineer who can explain complex car systems in a simple, accessible way.`,
    user: `Write a clear "How It Works" explainer on ONE specific, fundamental system in a modern car (e.g., "how does a car's transmission work?," "a beginner's guide to the braking system," or "what is a hybrid vehicle and how does it switch between gas and electric?"). Use analogies and simple diagrams/descriptions.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a car diagnostic expert who helps drivers understand what their car is telling them.`,
    user: `Create a helpful guide to understanding ONE specific, common car problem or warning light (e.g., "what does the 'Check Engine' light mean? 5 common causes," "why is my car overheating and what should I do?," or "a guide to common car sounds and what they mean"). Emphasize safety and when to see a mechanic.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an automotive technology journalist who covers the latest innovations.`,
    user: `Write an explainer on ONE specific piece of modern automotive technology (e.g., "what is adaptive cruise control and how does it work?," "a guide to the different levels of self-driving cars," or "the future of electric vehicle batteries").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Critic's Garage (Reviews & Comparisons) ---
const reviewTemplates = [
  {
    system: `You are a respected car critic, like those from major automotive magazines, who provides unbiased, in-depth reviews.`,
    user: `Write a "Best Of" list for ONE specific, narrow category of vehicles (e.g., "the 5 best family SUVs with a third row," "a guide to the most reliable and fuel-efficient commuter cars," or "the best sports cars for under $50,000"). For each vehicle, include pros, cons, and who it's best for.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a comparison specialist who helps buyers choose between two direct competitors.`,
    user: `Write a detailed, head-to-head comparison of two specific, popular vehicle models (e.g., "Toyota Camry vs. Honda Accord: which is the better family sedan?," "Ford F-150 vs. Chevy Silverado: a complete breakdown," or "Tesla Model 3 vs. Hyundai Ioniq 5"). Compare them on performance, interior, technology, and value.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a long-term tester who evaluates cars over thousands of miles.`,
    user: `Write a "1-Year Ownership Review" of ONE specific, popular car model (e.g., "living with a Toyota RAV4 for a year: the pros and cons," "a long-term review of the Ford Mustang," or "is the Tesla Model Y worth it after one year?"). Cover reliability, real-world fuel economy, and maintenance costs.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Car Culture & History ---
const cultureTemplates = [
  {
    system: `You are a car enthusiast and historian who tells the stories behind iconic vehicles.`,
    user: `Write a fascinating article on the history and cultural impact of ONE specific, legendary car model (e.g., "the story of the Volkswagen Beetle: the people's car," "how the Ford Mustang created the pony car," or "the legacy of the Porsche 911").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a motorsport journalist.`,
    user: `Create a beginner's guide to understanding ONE specific type of motorsport (e.g., "an introduction to Formula 1 racing," "what is rally racing? a guide for new fans," or "the 24 Hours of Le Mans, explained").${COMMON_STRUCTURE}`,
  },
];


// --- COMBINE ALL TEMPLATES INTO ONE MASTER ARRAY ---
const allTemplates = [
  ...drivingTemplates,
  ...buyingTemplates,
  ...mechanicsTemplates,
  ...reviewTemplates,
  ...cultureTemplates,
];

/**
 * Picks a random template from the master list.
 * @returns {object} A randomly selected template object with `system` and `user` properties.
 */
function pickRandomTemplate() {
  // Weight the randomness to favor the most practical, problem-solving topics
  const finalPool = [
    ...drivingTemplates, ...drivingTemplates, // Higher chance for maintenance/skills
    ...buyingTemplates, ...buyingTemplates, ...buyingTemplates, // Highest chance for buying/selling
    ...mechanicsTemplates,
    ...reviewTemplates,
    ...cultureTemplates,
  ];
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

/**
 * Builds a complete prompt object for the "Automotive & Vehicles" category.
 * It randomly selects a template and injects the category name.
 * @returns {{system: string, user: string}} The final prompt object.
 */
export function buildPrompt() {
  const categoryName = 'Automotive & Vehicles'; // Hardcoded for this specific file
  const template = pickRandomTemplate();
  
  const finalSystem = template.system.replace(/\{\{CATEGORY}}/g, categoryName);
  const finalUser = template.user.replace(/\{\{CATEGORY}}/g, categoryName);
  
  return {
    system: finalSystem,
    user: finalUser,
  };
}

export default { buildPrompt };