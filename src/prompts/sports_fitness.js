/*
 * Prompt templates for the "Sports & Fitness" category.
 *
 * This file contains over 50 unique prompt templates designed to generate a wide variety
 * of specific, high-quality articles about sports and fitness. Each template instructs the AI
 * to choose a narrow sub-topic, ensuring that repeated use of this file still
 * results in unique content.
 *
 * The templates are grouped by article type (Best-Of, How-To, Comparison)
 * to cover a full range of content needs.
 */

import { COMMON_STRUCTURE } from './common_structure.js';

// --- TEMPLATE GROUP: "Best-Of" (Top Lists / Roundups) ---
const bestOfTemplates = [
  {
    system: `You are a sports equipment review expert who writes unbiased "best of" round-up articles. Write exactly 600-800 words with clear structure and balanced analysis.`,
    user: `Write an article listing the top 5-6 items for ONE NARROW sports equipment sub-topic. Create a unique title. For each item, include pros/cons and who it's best suited for.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a certified personal trainer who creates round-ups of the most effective exercises. Target exactly 600-800 words with practical insights.`,
    user: `Produce a listicle highlighting the 5-7 best exercises for ONE specific fitness goal. Use an engaging title. Explain the proper form and benefits for each.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a sports nutritionist who identifies the best foods and supplements for athletes.`,
    user: `Create a ranking of the top 5 foods or supplements for ONE specific athletic purpose. Use a compelling title like "Ranked: The 5 Best..." and explain the science behind your choices.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a tech reviewer specializing in fitness technology.`,
    user: `Write an authoritative guide to the best tech for a specific fitness need. Include information on features, accuracy, and user experience.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a sports historian and analyst.`,
    user: `Develop a data-driven article about the top 5 most iconic moments in ONE specific sport's history. Use a creative title and explain the significance of each moment.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a value-focused consumer who finds the best deals on fitness gear.`,
    user: `Create a value guide highlighting the best quality-to-price options for ONE specific fitness category. Use a title like "Build Your Gym on a Budget:...".${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a specialist curator who identifies emerging trends in fitness.`,
    user: `Write an innovation spotlight on the most cutting-edge training methods or gear in ONE specific fitness area. Use a forward-thinking title like "The Future of Fitness:...".${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: "How-To" (Step-by-Step Tutorials) ---
const howToTemplates = [
  {
    system: `You are a certified coach specializing in clear, safe, and effective technique guides.`,
    user: `Write a step-by-step article about how to perform ONE SPECIFIC sports skill or exercise. Use numbered steps, describe the correct form, and list common mistakes to avoid.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a fitness programmer who designs workout routines.`,
    user: `Create a guide for ONE specific workout routine. Cover the exercises, sets, reps, and rest periods.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a sports strategy analyst who creates detailed guides for understanding a sport.`,
    user: `Develop a tutorial on ONE narrow aspect of sports strategy. Include diagrams or descriptions of plays.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a recovery specialist providing actionable advice for athletes.`,
    user: `Write a foolproof guide to ONE specific recovery technique. Explain the science and benefits behind each step.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a mental performance coach who helps athletes build mental toughness.`,
    user: `Create a guide for ONE specific mental skill. Focus on simple, actionable techniques.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a hands-on instructor who emphasizes practical application for fitness.`,
    user: `Develop a practical tutorial on ONE specific fitness-related activity. Include a list of materials and step-by-step instructions.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: "Comparison" (Head-to-Head Analysis) ---
const comparisonTemplates = [
  {
    system: `You are a sports analyst who specializes in evidence-based comparisons. Write exactly 600-800 words.`,
    user: `Write a comparison article for ONE SPECIFIC sports debate. Compare them across key criteria (statistics, impact, era) and provide a clear conclusion.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a fitness expert who evaluates different workout methodologies.`,
    user: `Create an objective comparison between two leading fitness styles for a specific goal. Include a comparison table and a clear verdict.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an equipment evaluator helping consumers make informed choices.`,
    user: `Develop a detailed buyer's comparison guide for ONE specific equipment choice. Include a breakdown of pros, cons, cost, and effectiveness.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a sports strategist who analyzes different playing styles or philosophies.`,
    user: `Write an authoritative comparison of two competing strategies in a sport. Explain the principles and when each is most effective.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: "Beginner's Guides" (Introductory Content) ---
const beginnerGuideTemplates = [
  {
    system: `You are an expert coach who specializes in teaching sports to complete beginners.`,
    user: `Write a comprehensive beginner's guide to ONE specific sport. Assume zero prior knowledge. Include the basic rules, essential equipment, and fundamental skills to practice.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a patient fitness instructor who breaks down intimidating subjects into manageable learning modules.`,
    user: `Create a complete beginner's roadmap for starting ONE specific fitness discipline. Include a step-by-step weekly plan and resource recommendations.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a simplification expert who makes complex sports rules accessible to anyone.`,
    user: `Develop a jargon-free beginner's guide to understanding ONE complex sport. Use real-world analogies and simple language.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: "Explainer" Articles ("What is...?" / "Why...") ---
const explainerTemplates = [
  {
    system: `You are a sports scientist who excels at explaining the physiology behind fitness.`,
    user: `Write a clear, in-depth explainer article on ONE specific fitness concept. Cover the definition, its function in the body, and its importance for performance.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a sports journalist who transforms complex rules into accessible, engaging articles.`,
    user: `Create an in-depth exploration of ONE specific, often misunderstood sports rule. Break down the rule and explain its strategic implications.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a foundation builder who ensures readers develop strong fundamental understanding.`,
    user: `Write a thorough explainer on a core fitness principle. Use clear definitions and helpful examples.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: "Trend Analysis" (Future-Focused) ---
const trendAnalysisTemplates = [
  {
    system: `You are a futurist who interprets current signals to predict upcoming developments in sports. Target 600-800 words.`,
    user: `Write a trend analysis article about ONE specific emerging trend in sports. Cover the latest developments, key players, and potential impact.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Myth-Busting & Biographies ---
const mythBustingTemplates = [
  {
    system: `You are a fact-checker who specializes in debunking fitness myths with scientific evidence.`,
    user: `Write a comprehensive myth-busting article about ONE specific fitness topic. Identify 5-7 myths and provide the scientific truth.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a sports biographer who tells compelling stories about athletes.`,
    user: `Create a short biographical article on the career of ONE specific, iconic athlete. Focus on their journey, challenges, and impact on the sport.${COMMON_STRUCTURE}`,
  },
];


// --- COMBINE ALL TEMPLATES INTO ONE MASTER ARRAY ---
const allTemplates = [
  ...bestOfTemplates,
  ...howToTemplates,
  ...comparisonTemplates,
  ...beginnerGuideTemplates,
  ...explainerTemplates,
  ...trendAnalysisTemplates,
  ...mythBustingTemplates,
];

/**
 * Picks a random template from the master list.
 * @returns {object} A randomly selected template object with `system` and `user` properties.
 */
function pickRandomTemplate() {
  return allTemplates[Math.floor(Math.random() * allTemplates.length)];
}

/**
 * Builds a complete prompt object for the "Sports & Fitness" category.
 * It randomly selects a template and injects the category name.
 * @returns {{system: string, user: string}} The final prompt object.
 */
export function buildPrompt() {
  const categoryName = 'Sports & Fitness'; // Hardcoded for this specific file
  const template = pickRandomTemplate();
  
  const finalSystem = template.system.replace(/\{\{CATEGORY}}/g, categoryName);
  const finalUser = template.user.replace(/\{\{CATEGORY}}/g, categoryName);
  
  return {
    system: finalSystem,
    user: finalUser,
  };
}

export default { buildPrompt };