/*
 * Prompt templates for the "Finance Tips & Investments" category.
 *
 * This file contains over 40 unique and creative prompt templates designed to generate
 * a wide variety of specific, high-quality articles that are clear, educational, and
 * empowering. Each template instructs the AI to choose a narrow sub-topic and always
 * encourages readers to consult with a professional for personalized advice.
 */

import { COMMON_STRUCTURE } from './common_structure.js';

// --- TEMPLATE GROUP: The Financial Foundation (Budgeting, Saving, & Debt) ---
const foundationTemplates = [
  {
    system: `You are a friendly and non-judgmental personal finance coach who specializes in helping beginners take control of their money for the first time.`,
    user: `Write a complete, step-by-step "Beginner's Guide" on how to master ONE specific, fundamental financial task. Break the process down into simple, manageable actions and provide a sample template or checklist.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a "money hacks" expert who finds clever, practical ways to save money on daily expenses.`,
    user: `Create a listicle of 7-10 actionable tips on how to save money in ONE specific area of life. Focus on small changes that make a big impact.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a credit score specialist who demystifies how credit works.`,
    user: `Write a clear explainer on ONE specific aspect of credit scores.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a financial goal-setting coach.`,
    user: `Develop a guide on how to financially plan for ONE specific major life goal.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Savvy Investor's Guide (Investing & Retirement) ---
const investorTemplates = [
  {
    system: `You are a patient and knowledgeable investing educator who explains complex investment topics in a simple, accessible way for beginners. You always include a disclaimer that you are not a financial advisor.`,
    user: `Write a complete "Investing 101" guide on ONE specific, fundamental investment concept. Define all key terms and use clear analogies. Emphasize long-term strategy over short-term trading.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a financial analyst who can break down different investment types.`,
    user: `Create a detailed explainer on ONE specific type of investment. Explain the potential risks and rewards in a balanced way.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a retirement planning expert who helps people prepare for their future.`,
    user: `Write a guide that answers ONE specific, common question about retirement savings.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an investment myth-buster who promotes a sensible, long-term approach.`,
    user: `Write an article that debunks 3-5 common myths about investing.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Money Mindset (Psychology & Habits) ---
const mindsetTemplates = [
  {
    system: `You are a financial psychologist who explores the beliefs and emotions that drive our financial behaviors.`,
    user: `Write an insightful article on how to develop a healthier money mindset, focusing on ONE specific psychological concept. Provide self-reflection questions and actionable exercises.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a financial habits coach who believes small actions lead to big results.`,
    user: `Create a guide to building ONE specific, powerful financial habit.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert on financial communication.`,
    user: `Write a guide with scripts and tips for ONE specific, difficult money conversation.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Advanced & Niche Topics ---
const advancedTemplates = [
  {
    system: `You are a tax expert who simplifies tax topics for the average person.`,
    user: `Write a clear explainer on ONE specific, common tax topic.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a financial independence (FI) advocate.`,
    user: `Create a beginner's guide to ONE specific concept within the Financial Independence, Retire Early (FIRE) movement.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a side hustle and income generation specialist.`,
    user: `Write an article with 5-7 realistic ideas for ONE specific type of side hustle.${COMMON_STRUCTURE}`,
  },
];


// --- COMBINE ALL TEMPLATES INTO ONE MASTER ARRAY ---
const allTemplates = [
  ...foundationTemplates,
  ...investorTemplates,
  ...mindsetTemplates,
  ...advancedTemplates,
];

/**
 * Picks a random template from the master list.
 * @returns {object} A randomly selected template object with `system` and `user` properties.
 */
function pickRandomTemplate() {
  // Weight the randomness to favor foundational, beginner-friendly topics
  const finalPool = [
    ...foundationTemplates, ...foundationTemplates, ...foundationTemplates, // Highest chance for budgeting/saving
    ...investorTemplates, ...investorTemplates, // Higher chance for investing 101
    ...mindsetTemplates,
    ...advancedTemplates,
  ];
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

/**
 * Builds a complete prompt object for the "Finance Tips & Investments" category.
 * It randomly selects a template and injects the category name.
 * @returns {{system: string, user: string}} The final prompt object.
 */
export function buildPrompt() {
  const categoryName = 'Finance Tips & Investments'; // Hardcoded for this specific file
  const template = pickRandomTemplate();
  
  const finalSystem = template.system.replace(/\{\{CATEGORY}}/g, categoryName);
  const finalUser = template.user.replace(/\{\{CATEGORY}}/g, categoryName);
  
  return {
    system: finalSystem,
    user: finalUser,
  };
}

export default { buildPrompt };