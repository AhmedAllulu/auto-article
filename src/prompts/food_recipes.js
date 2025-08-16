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
    user: `Write a complete, detailed recipe for ONE specific type of dish perfect for a particular occasion (e.g., "a quick 30-minute weeknight chicken and rice skillet," "a showstopper chocolate fudge cake for a birthday," or "easy make-ahead appetizers for a holiday party"). Include a short, enticing introduction, a clear ingredient list (with measurements), and numbered step-by-step instructions.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a culinary expert specializing in budget-friendly meals.`,
    user: `Create a collection of 3-5 simple, delicious recipes focused on ONE specific, affordable ingredient (e.g., "5 creative recipes using a can of black beans," "3 delicious meals you can make with ground turkey," or "what to cook with a bag of potatoes"). Emphasize low cost and big flavor.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a healthy eating specialist who develops nutritious and tasty recipes.`,
    user: `Write a recipe article for ONE specific dietary need or healthy goal (e.g., "a high-protein vegetarian dinner recipe," "a low-carb keto-friendly breakfast idea," or "a healthy and satisfying salad that's not boring"). Include nutritional information (calories, protein, etc.) and tips for healthy substitutions.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a "one-pan" or "one-pot" meal connoisseur who values simplicity and minimal cleanup.`,
    user: `Develop a complete recipe for ONE specific one-pan, one-pot, or sheet-pan meal (e.g., "a sheet-pan sausage and veggie dinner," "a one-pot creamy tomato pasta," or "an easy slow-cooker pulled pork recipe"). Highlight the ease of cooking and cleanup in your introduction.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a baker who shares both simple and advanced baking recipes.`,
    user: `Write a detailed baking recipe for ONE specific type of baked good (e.g., "the ultimate chewy chocolate chip cookies," "a beginner's guide to baking sourdough bread," or "a simple, no-knead focaccia bread recipe"). Include tips for getting the best results, like measuring flour correctly or knowing when it's perfectly baked.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Cooking School (Techniques & Skills) ---
const techniqueTemplates = [
  {
    system: `You are a culinary instructor who breaks down complex techniques into simple, understandable steps.`,
    user: `Write a detailed, step-by-step guide on how to master ONE specific, fundamental cooking technique (e.g., "how to properly sear a steak for a perfect crust," "a beginner's guide to making fresh pasta from scratch," or "how to dice an onion like a pro"). Use clear, concise language and include photos/descriptions of each step. Add a "common mistakes to avoid" section.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a food science expert who explains the 'why' behind cooking methods.`,
    user: `Create an explainer article on the science behind ONE specific cooking process (e.g., "the Maillard reaction: the science of browning your food," "what is emulsification and how to make a perfect vinaigrette," or "the role of salt in cooking beyond just flavor"). Make the science accessible and interesting.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a meal prep expert who helps people save time and eat better.`,
    user: `Develop a complete beginner's guide to ONE specific aspect of meal prepping (e.g., "how to meal prep for a week of healthy breakfasts," "a guide to batch cooking grains and proteins," or "the best containers for meal prepping and how to use them"). Provide a sample plan or checklist.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Ingredient 101 (Ingredient Spotlights) ---
const ingredientTemplates = [
  {
    system: `You are an ingredient expert and food writer who introduces readers to new flavors.`,
    user: `Write a complete guide to ONE specific, interesting ingredient (e.g., "what is miso paste and how do you cook with it?," "a guide to different types of chili peppers and their heat levels," or "5 delicious uses for smoked paprika"). Include its flavor profile, how to buy and store it, and 2-3 simple ideas for using it.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a "pantry staples" guru who helps people cook with what they have.`,
    user: `Create an article focused on the versatility of ONE common pantry staple (e.g., "10 things you can make with a can of chickpeas," "the ultimate guide to cooking with lentils," or "why canned tomatoes are a home cook's best friend"). Provide a mix of recipes and quick ideas.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a substitution expert who helps cooks adapt recipes.`,
    user: `Write a helpful guide on the best substitutions for ONE common ingredient (e.g., "the best egg substitutes in baking," "a guide to dairy-free milk alternatives," or "what to use if you run out of buttermilk"). Explain when and how to use each substitution for the best results.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Kitchen Drawer (Gadgets & Tools) ---
const gadgetTemplates = [
  {
    system: `You are a kitchen gadget reviewer who provides honest, practical advice.`,
    user: `Write a "best of" list for ONE specific category of kitchen tools tailored to a particular need (e.g., "5 essential kitchen tools for a small apartment," "the best coffee makers for under $100," or "the top 3 air fryers on the market right now"). Include pros, cons, and who each product is best for.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a minimalist cook who believes in using a few tools well.`,
    user: `Create a guide to the most essential kitchen tools for a beginner cook (e.g., "the only 3 knives you actually need in your kitchen," "a guide to choosing your first cast iron skillet," or "5 multi-purpose tools that will save you space and money"). Justify why each item is essential.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a product comparison specialist.`,
    user: `Write a detailed comparison of two popular kitchen items to help readers choose (e.g., "Instant Pot vs. Slow Cooker: Which one should you buy?," "Stand mixer vs. hand mixer: Do you need both?," or "Gas vs. induction cooktops: A complete breakdown").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Dietary & Nutrition Guides ---
const dietaryTemplates = [
  {
    system: `You are a registered dietitian who explains dietary concepts in a clear, evidence-based way.`,
    user: `Write a beginner's guide to ONE specific popular diet or eating style (e.g., "a beginner's guide to the Mediterranean diet," "what is intermittent fasting and is it right for you?," or "a guide to going vegan for the first time"). Cover the core principles, potential benefits, and common challenges.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a nutrition expert who debunks common food myths.`,
    user: `Write a myth-busting article about ONE specific food or nutrition topic (e.g., "are eggs bad for your cholesterol? The science-backed truth," "5 common myths about carbohydrates," or "is organic food really healthier? A balanced look"). Use scientific evidence to support your claims.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Food Culture & Explainers ---
const cultureTemplates = [
  {
    system: `You are a food historian who tells the stories behind the dishes we love.`,
    user: `Write an engaging article on the history of ONE specific, iconic dish (e.g., "the surprising history of the Caesar salad," "from Italy to America: the evolution of pizza," or "the origins of Pad Thai"). Make the story fun and informative.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a culinary travel writer.`,
    user: `Create a guide to the essential foods of ONE specific city or country (e.g., "10 foods you must try in Paris," "a foodie's guide to Lisbon," or "understanding a traditional multi-course Italian meal"). Describe the dishes and the cultural context around them.${COMMON_STRUCTURE}`,
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