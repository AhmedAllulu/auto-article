/*
 * Prompt templates for the "Fashion & Beauty" category.
 *
 * This file contains over 40 unique and creative prompt templates designed to generate
 * a wide variety of specific, high-quality articles about style, skincare, makeup, and
 * industry trends. Each template instructs the AI to choose a narrow sub-topic,
 * ensuring that repeated use of this file still results in unique and valuable content.
 */

import { COMMON_STRUCTURE } from './common_structure.js';

// --- TEMPLATE GROUP: The Style Academy (Wardrobe & Fashion Advice) ---
const styleTemplates = [
  {
    system: `You are a knowledgeable and encouraging personal stylist who helps people discover their unique style and build a functional wardrobe.`,
    user: `Write a complete "How-To" guide on ONE specific, foundational aspect of personal style (e.g., "how to find your personal style in 5 easy steps," "a beginner's guide to building a capsule wardrobe," or "how to master the art of layering clothes for a chic look"). Provide actionable tips and visual examples (described in text).${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a fashion expert who knows how to dress for any occasion.`,
    user: `Create a practical style guide for ONE specific, tricky dress code or event (e.g., "what to wear to a 'smart casual' event," "a guide to wedding guest attire for different seasons," or "how to build a professional and stylish work wardrobe"). Offer 3-4 complete outfit ideas.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a body positivity advocate and style expert who believes fashion is for every body.`,
    user: `Write an empowering style guide focused on ONE specific body type or fit challenge (e.g., "the best jeans for curvy body types," "a guide to dressing for a petite frame," or "how to find clothes that fit and flatter when you're tall"). Focus on principles of fit and proportion, not on hiding or changing the body.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a sustainable fashion expert who promotes conscious consumerism.`,
    user: `Develop a beginner's guide to ONE specific aspect of sustainable or ethical fashion (e.g., "how to build a sustainable wardrobe from scratch," "a guide to caring for your clothes so they last longer," or "5 tips for a successful thrift store shopping trip").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an accessory guru who knows the power of finishing touches.`,
    user: `Write an article on how to use ONE specific type of accessory to elevate an outfit (e.g., "how to choose the right handbag for any occasion," "a guide to layering necklaces," or "5 ways to style a silk scarf").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Beauty Lab (Skincare & Makeup Tutorials) ---
const beautyTemplates = [
  {
    system: `You are a licensed esthetician and skincare expert who explains the science behind skincare in a simple, accessible way.`,
    user: `Write a detailed, step-by-step guide to ONE specific skincare topic for beginners (e.g., "how to build a basic skincare routine for the morning and evening," "a beginner's guide to understanding active ingredients like Vitamin C and Retinol," or "how to find the right cleanser for your skin type"). Explain the 'why' behind each step.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a professional makeup artist who creates easy-to-follow tutorials for achievable, beautiful looks.`,
    user: `Create a complete, step-by-step tutorial for ONE specific, popular makeup technique or look (e.g., "how to achieve a flawless 'no-makeup' makeup look," "a beginner's guide to winged eyeliner," or "how to properly apply foundation for a natural finish"). List the types of products needed and describe the application process clearly.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a "skin problem" solver who provides gentle, effective advice for common concerns.`,
    user: `Write a helpful guide on how to manage ONE specific, common skin concern (e.g., "a skincare routine for acne-prone skin," "how to deal with dry, flaky skin in the winter," or "the best ingredients for fading dark spots"). Emphasize consistency and when to see a dermatologist.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a beauty product expert who helps people understand what they're buying.`,
    user: `Develop an explainer article on ONE specific category of beauty products (e.g., "what's the difference between chemical and mineral sunscreen?," "a guide to the different types of face masks," or "serums, essences, and ampoules: what's the difference and do you need them?").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a haircare specialist.`,
    user: `Write a complete care guide for ONE specific hair type or concern (e.g., "how to care for fine, flat hair," "a beginner's guide to the curly girl method," or "the best tips for preventing split ends and breakage").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Savvy Shopper (Product Recommendations & Reviews) ---
const shoppingTemplates = [
  {
    system: `You are a discerning beauty editor who tests and reviews products to find the best of the best.`,
    user: `Write a "best of" list for ONE specific, narrow category of beauty products (e.g., "the 5 best hydrating serums for dry skin," "top 7 drugstore mascaras that rival high-end brands," or "the best gentle cleansers for sensitive skin"). For each product, explain why it's great and who it's best for.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a fashion editor who knows where to find the best wardrobe staples.`,
    user: `Create a curated guide to the best places to buy ONE specific wardrobe essential (e.g., "the 5 best brands for a perfect white t-shirt," "a guide to finding high-quality, affordable cashmere sweaters," or "where to buy the most comfortable and stylish work pants").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a "dupe" finder who helps people get a luxury look for less.`,
    user: `Write an article showcasing 3-5 amazing, affordable alternatives ("dupes") for ONE specific, popular high-end beauty or fashion item (e.g., "affordable alternatives to the popular La Mer face cream," "look for less: 5 great alternatives to the classic Chanel flap bag," or "the best drugstore dupes for high-end makeup products").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Trend Reports & Cultural Analysis ---
const trendTemplates = [
  {
    system: `You are a fashion trend forecaster who analyzes runway and street style to see what's next.`,
    user: `Write a trend report on ONE specific, current fashion or beauty trend (e.g., "the return of '90s minimalism: how to wear it in a modern way," "a guide to the 'dopamine dressing' color trend," or "glass skin: what is the Korean beauty trend and how to achieve it"). Explain the trend and offer tips on how to incorporate it realistically.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a fashion historian who tells the stories behind the clothes we wear.`,
    user: `Create a fascinating explainer on the history of ONE specific, iconic fashion item (e.g., "the surprising history of the little black dress," "from workwear to fashion staple: the story of blue jeans," or "how the trench coat became a timeless classic").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a beauty culture analyst.`,
    user: `Write a thoughtful article on ONE specific cultural shift in the beauty industry (e.g., "the rise of gender-neutral beauty," "how social media has changed beauty standards," or "the movement towards clean and sustainable beauty").${COMMON_STRUCTURE}`,
  },
];


// --- COMBINE ALL TEMPLATES INTO ONE MASTER ARRAY ---
const allTemplates = [
  ...styleTemplates,
  ...beautyTemplates,
  ...shoppingTemplates,
  ...trendTemplates,
];

/**
 * Picks a random template from the master list.
 * @returns {object} A randomly selected template object with `system` and `user` properties.
 */
function pickRandomTemplate() {
  // Weight the randomness to favor practical, problem-solving content
  const finalPool = [
    ...styleTemplates, ...styleTemplates, // Higher chance for style advice
    ...beautyTemplates, ...beautyTemplates, ...beautyTemplates, // Highest chance for beauty/skincare
    ...shoppingTemplates,
    ...trendTemplates,
  ];
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

/**
 * Builds a complete prompt object for the "Fashion & Beauty" category.
 * It randomly selects a template and injects the category name.
 * @returns {{system: string, user: string}} The final prompt object.
 */
export function buildPrompt() {
  const categoryName = 'Fashion & Beauty'; // Hardcoded for this specific file
  const template = pickRandomTemplate();
  
  const finalSystem = template.system.replace(/\{\{CATEGORY}}/g, categoryName);
  const finalUser = template.user.replace(/\{\{CATEGORY}}/g, categoryName);
  
  return {
    system: finalSystem,
    user: finalUser,
  };
}

export default { buildPrompt };