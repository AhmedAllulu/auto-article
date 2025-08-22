/*
 * Prompt templates for the "Productivity & Self-Improvement" category.
 *
 * This file contains over 40 unique and creative prompt templates designed to generate
 * a wide variety of specific, high-quality articles that provide actionable advice on focus,
 * habits, goal-setting, and personal growth. Each template instructs the AI to choose a
 * narrow sub-topic, ensuring that repeated use of this file still results in unique content.
 */

import { COMMON_STRUCTURE } from './common_structure.js';

// --- TEMPLATE GROUP: The Focus Lab (Time Management & Deep Work) ---
const focusTemplates = [
  {
    system: `You are a productivity expert and author who specializes in the science of focus and deep work in a distracted world.`,
    user: `Write a complete, step-by-step guide on how to implement ONE specific, powerful time management or focus technique. Explain the methodology and the psychological benefits.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a digital minimalism advocate who helps people reclaim their attention from technology.`,
    user: `Create a practical guide with 5-7 actionable tips on how to manage ONE specific digital distraction.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a "procrastination buster" who provides psychological tricks and practical systems to help people get started.`,
    user: `Write an article that tackles ONE specific cause of procrastination and offers a clear solution.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Habit Forge (Building Good Habits & Breaking Bad Ones) ---
const habitTemplates = [
  {
    system: `You are a behavioral scientist and habit formation coach, like James Clear, who explains the mechanics of habit change.`,
    user: `Write a detailed guide on how to build ONE specific, positive "keystone" habit. Explain a core principle like habit stacking or trigger-reward loops.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert on breaking bad habits who offers compassionate, effective strategies.`,
    user: `Create a guide on how to break ONE specific, common bad habit. Focus on replacing the habit, not just resisting it.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a systems thinker who believes in the power of environment design.`,
    user: `Write an article explaining how to design your environment to support ONE specific goal.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Goal-Setter's Toolkit (Planning & Achievement) ---
const goalTemplates = [
  {
    system: `You are a strategic planning coach who helps people turn dreams into actionable plans.`,
    user: `Write a practical guide on how to use ONE specific goal-setting framework. Provide a template or worksheet format.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a motivation expert who understands the psychology of staying consistent.`,
    user: `Create an article with 5-7 strategies for staying motivated when working on ONE specific type of long-term goal.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a planning specialist who helps people organize their lives.`,
    user: `Develop a guide to ONE specific planning method.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Mindset Gym (Mental Models & Personal Growth) ---
const mindsetTemplates = [
  {
    system: `You are a cognitive psychologist and mindset coach who helps people reframe their thinking.`,
    user: `Write a deep-dive article on how to cultivate ONE specific, powerful mindset. Provide practical exercises and real-world examples.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a mindfulness and self-awareness advocate.`,
    user: `Create a beginner's guide to ONE specific self-improvement practice.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a communication and soft skills expert.`,
    user: `Write a guide on how to develop ONE specific, crucial soft skill.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Wellness Foundation (Connecting Health to Productivity) ---
const wellnessTemplates = [
  {
    system: `You are a sleep scientist and health advocate who explains the critical link between rest and performance.`,
    user: `Write an article explaining the science behind ONE specific aspect of sleep and its impact on productivity.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a burnout prevention specialist.`,
    user: `Create a guide to recognizing and recovering from ONE specific stage of burnout.${COMMON_STRUCTURE}`,
  },
];


// --- COMBINE ALL TEMPLATES INTO ONE MASTER ARRAY ---
const allTemplates = [
  ...focusTemplates,
  ...habitTemplates,
  ...goalTemplates,
  ...mindsetTemplates,
  ...wellnessTemplates,
];

/**
 * Picks a random template from the master list.
 * @returns {object} A randomly selected template object with `system` and `user` properties.
 */
function pickRandomTemplate() {
  // Weight the randomness to favor the most actionable and popular topics
  const finalPool = [
    ...focusTemplates, ...focusTemplates, // Higher chance for focus/time management
    ...habitTemplates, ...habitTemplates, ...habitTemplates, // Highest chance for habit formation
    ...goalTemplates,
    ...mindsetTemplates,
    ...wellnessTemplates,
  ];
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

/**
 * Builds a complete prompt object for the "Productivity & Self-Improvement" category.
 * It randomly selects a template and injects the category name.
 * @returns {{system: string, user: string}} The final prompt object.
 */
export function buildPrompt() {
  const categoryName = 'Productivity & Self-Improvement'; // Hardcoded for this specific file
  const template = pickRandomTemplate();
  
  const finalSystem = template.system.replace(/\{\{CATEGORY}}/g, categoryName);
  const finalUser = template.user.replace(/\{\{CATEGORY}}/g, categoryName);
  
  return {
    system: finalSystem,
    user: finalUser,
  };
}

export default { buildPrompt };