/*
 * Prompt templates for the "Health & Wellness" category.
 *
 * This file contains over 50 unique prompt templates designed to generate a wide variety
 * of specific, high-quality articles about health and wellness. Each template instructs the AI
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
    system: `You are a health and wellness product reviewer who writes unbiased "best of" round-up articles. Write exactly 600-800 words with clear structure and balanced analysis.`,
    user: `Write an article listing the top 5-6 items for ONE NARROW health sub-topic. Create a unique title. For each item, include pros/cons and who it's best suited for.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a registered dietitian who creates comparison round-ups for healthy eating. Target exactly 600-800 words with practical insights.`,
    user: `Produce a listicle highlighting the 5 best foods or supplements for ONE specific health need. Use an engaging title. Provide nutritional insights and practical tips for each.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a fitness coach who identifies the most effective exercises for specific goals.`,
    user: `Create a ranking of the top 5-7 exercises for ONE specific fitness goal. Use a compelling title like "Ranked: The 7 Best..." and explain the science behind each exercise.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a mental health advocate who helps people find useful resources.`,
    user: `Write an authoritative guide to the best resources for a specific mental wellness need. Include information on pricing, features, and user experience.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a data-driven health analyst who ranks options based on scientific evidence.`,
    user: `Develop a data-driven article about the top 5 trending options for ONE specific wellness scenario. Use a creative title and cite research where appropriate.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a value-focused consumer who finds the best deals on health products.`,
    user: `Create a value guide highlighting the best quality-to-price options for ONE specific health category. Use a title like "Healthy on a Budget:...".${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a specialist curator who identifies emerging trends in wellness.`,
    user: `Write an innovation spotlight on the most cutting-edge options in ONE specific health area. Use a forward-thinking title like "The Future of Wellness:...".${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: "How-To" (Step-by-Step Tutorials) ---
const howToTemplates = [
  {
    system: `You are a certified personal trainer specializing in clear, safe, and effective exercise guides.`,
    user: `Write a step-by-step article about how to perform ONE SPECIFIC exercise. Use numbered steps, describe the correct form, and list common mistakes to avoid.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a nutritionist who simplifies healthy eating into actionable steps.`,
    user: `Create a guide for ONE specific nutritional task. Cover practical tips, tools needed, and simple recipes.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a mindfulness instructor who creates detailed learning materials for mental wellness.`,
    user: `Develop a tutorial on ONE narrow aspect of mental health. Include clear objectives and guided steps.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a sleep specialist providing actionable advice for better rest.`,
    user: `Write a foolproof guide to ONE specific sleep hygiene task. Explain the science behind each step.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a health coach who helps people build sustainable healthy habits.`,
    user: `Create an efficiency guide for ONE specific health habit. Focus on simple, easy-to-implement techniques.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a hands-on instructor who emphasizes practical application for wellness.`,
    user: `Develop a practical tutorial on ONE specific wellness activity. Include a list of materials and step-by-step instructions.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: "Comparison" (Head-to-Head Analysis) ---
const comparisonTemplates = [
  {
    system: `You are a health journalist who specializes in evidence-based comparisons. Write exactly 600-800 words.`,
    user: `Write a comparison article for ONE SPECIFIC health choice. Compare them across key criteria (benefits, risks, accessibility) and provide a clear recommendation.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a fitness equipment evaluator who writes objective showdowns.`,
    user: `Create an objective comparison between two leading types of fitness equipment for a specific goal. Include a comparison table and a clear verdict.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a nutrition science expert helping consumers make informed choices.`,
    user: `Develop a detailed buyer's comparison guide for ONE specific food choice. Include a breakdown of nutritional content, health benefits, and best uses.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a wellness strategist who analyzes different health approaches.`,
    user: `Write an authoritative comparison of two competing wellness practices. Explain the underlying principles and cite relevant studies.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: "Beginner's Guides" (Introductory Content) ---
const beginnerGuideTemplates = [
  {
    system: `You are an expert educator who specializes in teaching complex health topics to complete beginners.`,
    user: `Write a comprehensive beginner's guide to ONE specific health field. Assume zero prior knowledge. Include fundamental principles, benefits, and a simple getting-started plan.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a patient teacher who breaks down intimidating subjects into manageable learning modules.`,
    user: `Create a complete beginner's roadmap for starting ONE specific wellness journey. Include a step-by-step path and resource recommendations.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a simplification expert who makes complex health topics accessible to anyone.`,
    user: `Develop a jargon-free beginner's guide to ONE complex health concept. Use real-world analogies and simple language.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: "Explainer" Articles ("What is...?" / "Why...") ---
const explainerTemplates = [
  {
    system: `You are a medical writer who excels at explaining health conditions and scientific concepts.`,
    user: `Write a clear, in-depth explainer article on ONE specific health topic. Cover the definition, its function in the body, and its importance for overall health.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a science communicator who transforms complex research into accessible, engaging articles.`,
    user: `Create an in-depth exploration of ONE trending wellness topic. Break down the science and explain its practical implications.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a foundation builder who ensures readers develop strong fundamental understanding.`,
    user: `Write a thorough explainer on a core health principle. Use clear definitions and helpful examples.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: "Trend Analysis" (Future-Focused) ---
const trendAnalysisTemplates = [
  {
    system: `You are a futurist who interprets current signals to predict upcoming wellness developments. Target 600-800 words.`,
    user: `Write a trend analysis article about ONE specific emerging wellness trend. Cover the latest developments, key players, and potential impact.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Myth-Busting & Symptom Guides ---
const mythBustingTemplates = [
  {
    system: `You are a fact-checker who specializes in debunking health myths with scientific evidence.`,
    user: `Write a comprehensive myth-busting article about ONE specific health topic. Identify 5-7 myths and provide the scientific truth.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a health journalist who creates clear, helpful guides about symptoms.`,
    user: `Create a helpful guide on the common signs and symptoms of ONE specific, non-emergency health issue. Emphasize that this is not medical advice and when to see a doctor.${COMMON_STRUCTURE}`,
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
 * Builds a complete prompt object for the "Health & Wellness" category.
 * It randomly selects a template and injects the category name.
 * @returns {{system: string, user: string}} The final prompt object.
 */
export function buildPrompt() {
  const categoryName = 'Health & Wellness'; // Hardcoded for this specific file
  const template = pickRandomTemplate();
  
  const finalSystem = template.system.replace(/\{\{CATEGORY}}/g, categoryName);
  const finalUser = template.user.replace(/\{\{CATEGORY}}/g, categoryName);
  
  return {
    system: finalSystem,
    user: finalUser,
  };
}

export default { buildPrompt };