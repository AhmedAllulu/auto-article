/*
 * Prompt templates for the "DIY & Crafts" category.
 *
 * This file contains over 40 unique and creative prompt templates designed to generate
 * a wide variety of specific, high-quality, and easy-to-follow project tutorials and
 * crafting guides. Each template instructs the AI to choose a narrow sub-topic,
 * ensuring that repeated use of this file still results in unique and inspiring content.
 */

import { COMMON_STRUCTURE } from './common_structure.js';

// --- TEMPLATE GROUP: The Beginner's Workshop (Step-by-Step Projects) ---
const projectTemplates = [
  {
    system: `You are a friendly and encouraging DIY project instructor who writes clear, detailed tutorials that even an absolute beginner can follow successfully.`,
    user: `Write a complete, step-by-step tutorial for ONE specific, stylish, and beginner-friendly DIY project. Include a "Materials & Tools" list, numbered instructions with clear action verbs, and photos/descriptions for each key step.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a holiday and seasonal craft expert who loves creating festive decor.`,
    user: `Create a detailed tutorial for ONE specific, charming seasonal or holiday craft project. Focus on projects that are festive and achievable in an afternoon.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a "quick craft" specialist who focuses on projects that take under an hour.`,
    user: `Write a simple, fast tutorial for ONE specific craft project that can be completed in less than an hour.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a DIY gift-giving guru.`,
    user: `Develop a complete tutorial for ONE specific, thoughtful handmade gift idea.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Upcycling Studio (Transforming the Old) ---
const upcyclingTemplates = [
  {
    system: `You are a creative and resourceful upcycling expert who sees potential in everyday objects and old furniture.`,
    user: `Write a complete, step-by-step tutorial on how to upcycle ONE specific, common household item. Provide clear before-and-after inspiration.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a thrifty crafter who loves turning trash into treasure.`,
    user: `Create a tutorial for a craft project that uses ONE specific, commonly discarded material.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a furniture flipping specialist.`,
    user: `Develop a beginner's guide to ONE specific, essential furniture refinishing technique.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Hobby Starter Kit (Learning a New Craft) ---
const hobbyTemplates = [
  {
    system: `You are a patient and enthusiastic teacher who loves introducing people to new crafting hobbies.`,
    user: `Write a complete "Absolute Beginner's Guide" to learning ONE specific, popular craft. Cover the essential tools, basic terminology, and a very simple first project.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a craft skills instructor who breaks down fundamental techniques.`,
    user: `Create a detailed tutorial on ONE specific, foundational skill within a larger craft.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a "next steps" coach for crafters who have mastered the basics.`,
    user: `Write a guide for intermediate crafters on how to learn ONE specific, more advanced technique.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Crafter's Toolkit (Supplies & Organization) ---
const toolkitTemplates = [
  {
    system: `You are a craft supply expert who helps people choose the right tools for the job without overspending.`,
    user: `Write a "Buyer's Guide" for the essential supplies for ONE specific craft. Explain what to look for and what to avoid.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a professional organizer who specializes in taming craft room chaos.`,
    user: `Create a guide with 5-7 clever and budget-friendly ideas for organizing ONE specific type of craft supply.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a "what's the difference" specialist.`,
    user: `Write a clear explainer comparing two similar craft supplies to help beginners choose.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Inspiration Board ---
const inspirationTemplates = [
  {
    system: `You are a creative trend spotter and inspiration curator.`,
    user: `Write an inspirational article showcasing 10-15 beautiful and achievable project ideas for ONE specific craft or theme. Use descriptive language to paint a picture of the final projects.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a color theory expert for crafters.`,
    user: `Create a guide to choosing color palettes for ONE specific type of DIY project.${COMMON_STRUCTURE}`,
  },
];


// --- COMBINE ALL TEMPLATES INTO ONE MASTER ARRAY ---
const allTemplates = [
  ...projectTemplates,
  ...upcyclingTemplates,
  ...hobbyTemplates,
  ...toolkitTemplates,
  ...inspirationTemplates,
];

/**
 * Picks a random template from the master list.
 * @returns {object} A randomly selected template object with `system` and `user` properties.
 */
function pickRandomTemplate() {
  // Weight the randomness to favor actionable, project-based content
  const finalPool = [
    ...projectTemplates, ...projectTemplates, ...projectTemplates, // Highest chance for specific projects
    ...upcyclingTemplates,
    ...hobbyTemplates, ...hobbyTemplates, // Higher chance for learning new hobbies
    ...toolkitTemplates,
    ...inspirationTemplates,
  ];
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

/**
 * Builds a complete prompt object for the "DIY & Crafts" category.
 * It randomly selects a template and injects the category name.
 * @returns {{system: string, user: string}} The final prompt object.
 */
export function buildPrompt() {
  const categoryName = 'DIY & Crafts'; // Hardcoded for this specific file
  const template = pickRandomTemplate();
  
  const finalSystem = template.system.replace(/\{\{CATEGORY}}/g, categoryName);
  const finalUser = template.user.replace(/\{\{CATEGORY}}/g, categoryName);
  
  return {
    system: finalSystem,
    user: finalUser,
  };
}

export default { buildPrompt };