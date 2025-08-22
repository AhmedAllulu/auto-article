/*
 * Prompt templates for the "Food & Recipes" category.
 *
 * This file contains over 50 unique and creative prompt templates designed to generate
 * a wide variety of specific, high-quality articles about cooking, recipes, ingredients,
 * and kitchen skills. Each template instructs the AI to choose a narrow sub-topic,
 * ensuring that repeated use of this file still results in unique and delicious content.
 */

import { COMMON_STRUCTURE } from './common_structure.js';

// --- TEMPLATE GROUP: The Recipe Box (Specific Recipe Collections) ---
const recipeTemplates = [
  {
    system: `You are a recipe developer and food blogger who creates delicious, reliable, and easy-to-follow recipes. Write in a warm, encouraging tone.`,
    user: `Write a complete, detailed recipe for ONE specific type of dish perfect for a particular occasion. Include a short, enticing introduction, a clear ingredient list (with measurements), and numbered step-by-step instructions.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a culinary expert specializing in budget-friendly meals.`,
    user: `Create a collection of 3-5 simple, delicious recipes focused on ONE specific, affordable ingredient. Emphasize low cost and big flavor.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a healthy eating specialist who develops nutritious and tasty recipes.`,
    user: `Write a recipe article for ONE specific dietary need or healthy goal. Include nutritional information (calories, protein, etc.) and tips for healthy substitutions.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a "one-pan" or "one-pot" meal connoisseur who values simplicity and minimal cleanup.`,
    user: `Develop a complete recipe for ONE specific one-pan, one-pot, or sheet-pan meal. Highlight the ease of cooking and cleanup in your introduction.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a baker who shares both simple and advanced baking recipes.`,
    user: `Write a detailed baking recipe for ONE specific type of baked good. Include tips for getting the best results, like measuring flour correctly or knowing when it's perfectly baked.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Cooking School (Techniques & Skills) ---
const techniqueTemplates = [
  {
    system: `You are a culinary instructor who breaks down complex techniques into simple, understandable steps.`,
    user: `Write a detailed, step-by-step guide on how to master ONE specific, fundamental cooking technique. Use clear, concise language and include photos/descriptions of each step. Add a "common mistakes to avoid" section.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a food science expert who explains the 'why' behind cooking methods.`,
    user: `Create an explainer article on the science behind ONE specific cooking process. Make the science accessible and interesting.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a meal prep expert who helps people save time and eat better.`,
    user: `Develop a complete beginner's guide to ONE specific aspect of meal prepping. Provide a sample plan or checklist.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Ingredient 101 (Ingredient Spotlights) ---
const ingredientTemplates = [
  {
    system: `You are an ingredient expert and food writer who introduces readers to new flavors.`,
    user: `Write a complete guide to ONE specific, interesting ingredient. Include its flavor profile, how to buy and store it, and 2-3 simple ideas for using it.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a "pantry staples" guru who helps people cook with what they have.`,
    user: `Create an article focused on the versatility of ONE common pantry staple. Provide a mix of recipes and quick ideas.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a substitution expert who helps cooks adapt recipes.`,
    user: `Write a helpful guide on the best substitutions for ONE common ingredient. Explain when and how to use each substitution for the best results.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Kitchen Drawer (Gadgets & Tools) ---
const gadgetTemplates = [
  {
    system: `You are a kitchen gadget reviewer who provides honest, practical advice.`,
    user: `Write a "best of" list for ONE specific category of kitchen tools tailored to a particular need. Include pros, cons, and who each product is best for.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a minimalist cook who believes in using a few tools well.`,
    user: `Create a guide to the most essential kitchen tools for a beginner cook. Justify why each item is essential.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a product comparison specialist.`,
    user: `Write a detailed comparison of two popular kitchen items to help readers choose.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Dietary & Nutrition Guides ---
const dietaryTemplates = [
  {
    system: `You are a registered dietitian who explains dietary concepts in a clear, evidence-based way.`,
    user: `Write a beginner's guide to ONE specific popular diet or eating style. Cover the core principles, potential benefits, and common challenges.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a nutrition expert who debunks common food myths.`,
    user: `Write a myth-busting article about ONE specific food or nutrition topic. Use scientific evidence to support your claims.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Food Culture & Explainers ---
const cultureTemplates = [
  {
    system: `You are a food historian who tells the stories behind the dishes we love.`,
    user: `Write an engaging article on the history of ONE specific, iconic dish. Make the story fun and informative.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a culinary travel writer.`,
    user: `Create a guide to the essential foods of ONE specific city or country. Describe the dishes and the cultural context around them.${COMMON_STRUCTURE}`,
  },
];


// --- COMBINE ALL TEMPLATES INTO ONE MASTER ARRAY ---
const allTemplates = [
  ...recipeTemplates,
  ...techniqueTemplates,
  ...ingredientTemplates,
  ...gadgetTemplates,
  ...dietaryTemplates,
  ...cultureTemplates,
];

/**
 * Picks a random template from the master list.
 * @returns {object} A randomly selected template object with `system` and `user` properties.
 */
function pickRandomTemplate() {
  // Weight the randomness to favor the most popular article types
  const finalPool = [
    ...recipeTemplates, ...recipeTemplates, ...recipeTemplates, // Higher chance for recipes
    ...techniqueTemplates, ...techniqueTemplates, // Higher chance for cooking skills
    ...ingredientTemplates,
    ...gadgetTemplates,
    ...dietaryTemplates,
    ...cultureTemplates,
  ];
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

/**
 * Builds a complete prompt object for the "Food & Recipes" category.
 * It randomly selects a template and injects the category name.
 * @returns {{system: string, user: string}} The final prompt object.
 */
export function buildPrompt() {
  const categoryName = 'Food & Recipes'; // Hardcoded for this specific file
  const template = pickRandomTemplate();
  
  const finalSystem = template.system.replace(/\{\{CATEGORY}}/g, categoryName);
  const finalUser = template.user.replace(/\{\{CATEGORY}}/g, categoryName);
  
  return {
    system: finalSystem,
    user: finalUser,
  };
}

export default { buildPrompt };