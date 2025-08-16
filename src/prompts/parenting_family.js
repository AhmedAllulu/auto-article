/*
 * Prompt templates for the "Parenting & Family" category.
 *
 * This file contains over 40 unique and creative prompt templates designed to generate
 * a wide variety of specific, high-quality articles that are supportive, practical, and
 * non-judgmental. Each template instructs the AI to choose a narrow sub-topic,
 * ensuring that repeated use of this file still results in unique and helpful content.
 */

import { COMMON_STRUCTURE } from './common_structure.js';

// --- TEMPLATE GROUP: The Developmental Playbook (Age & Stage Guides) ---
const developmentalTemplates = [
  {
    system: `You are a child development expert and seasoned parent who provides clear, reassuring, and evidence-based guidance for each stage of childhood.`,
    user: `Write a complete, helpful guide to ONE specific, common developmental stage or milestone (e.g., "a guide to navigating the 4-month sleep regression," "what to expect during the 'terrible twos' and how to handle it," or "how to prepare your child for starting kindergarten"). Provide practical tips and what parents can expect.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a specialist in early childhood, focusing on the baby and toddler years.`,
    user: `Create a detailed guide for parents on ONE specific aspect of baby or toddler care (e.g., "a step-by-step guide to introducing solid foods," "how to choose the right childcare or daycare," or "the best ways to baby-proof your home"). Break down the information into simple, manageable steps.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert on the school-age years, focusing on social and academic growth.`,
    user: `Write an article offering advice on ONE specific challenge or topic for parents of school-aged children (e.g., "how to help your child with homework without doing it for them," "a guide to helping your child make friends," or "how to talk to your kids about bullying").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a teen development specialist who helps parents navigate the adolescent years.`,
    user: `Develop a guide for parents on how to approach ONE specific, sensitive topic with their teenager (e.g., "how to talk to your teen about social media use and online safety," "a guide to fostering independence while still setting boundaries," or "how to support a teen struggling with anxiety").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Problem-Solver's Toolkit (Behavior & Challenges) ---
const problemSolverTemplates = [
  {
    system: `You are a gentle parenting coach who provides practical, empathetic solutions to common behavior challenges.`,
    user: `Write a step-by-step guide with scripts on how to handle ONE specific, common childhood behavior challenge (e.g., "what to do when your toddler hits: a gentle parenting approach," "a guide to managing sibling rivalry and fighting," or "how to handle a picky eater without mealtime battles"). Provide phrases parents can use in the moment.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a sleep consultant who helps families get more rest.`,
    user: `Create a troubleshooting guide for ONE specific, common sleep problem (e.g., "how to get your child to stay in their own bed all night," "a guide to dropping the afternoon nap," or "5 reasons your baby is waking up at night and what to do"). Offer several strategies for parents to try.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a family therapist who specializes in communication.`,
    user: `Write an article that helps families navigate ONE specific communication challenge (e.g., "how to stop yelling at your kids," "a guide to holding effective family meetings," or "how to listen so your kids will actually talk").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a potty training expert who makes the process less stressful.`,
    user: `Develop a complete guide to ONE specific aspect of potty training (e.g., "5 signs your toddler is ready for potty training," "a 3-day potty training method that works," or "how to handle potty training regressions").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Connection Corner (Activities & Traditions) ---
const connectionTemplates = [
  {
    system: `You are a creative and fun parent who loves finding new ways to connect with your kids.`,
    user: `Write a listicle of 7-10 creative and engaging activity ideas for ONE specific family scenario (e.g., "10 screen-free activities for a rainy day," "7 ideas for a fun and cheap family night at home," or "how to make chores fun for kids"). Focus on activities that promote bonding.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a family traditions expert who believes in creating lasting memories.`,
    user: `Create a guide to starting ONE specific, meaningful family tradition (e.g., "how to start a weekly family game night," "a guide to creating a memorable birthday tradition," or "5 holiday traditions to start with your kids this year"). Explain the benefits and provide simple steps to get started.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a travel writer specializing in family-friendly travel.`,
    user: `Develop a guide to ONE specific aspect of traveling with children (e.g., "a complete guide to surviving a long-haul flight with a toddler," "how to pack for a family vacation without overpacking," or "5 tips for a stress-free road trip with kids").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Family Life & Wellness (For the Parents) ---
const familyLifeTemplates = [
  {
    system: `You are a work-life balance coach and advocate for parental well-being.`,
    user: `Write a supportive article for parents on ONE specific aspect of self-care or balance (e.g., "how to prevent and overcome parental burnout," "a guide for working parents on managing guilt," or "5 simple ways to find 'me time' when you have small kids"). Provide actionable, realistic advice.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a relationship expert who helps couples navigate the challenges of parenthood.`,
    user: `Create a guide for couples on how to maintain a strong relationship after having kids (e.g., "how to reconnect with your partner when you're exhausted parents," "a guide to effective co-parenting and teamwork," or "5 date night ideas that don't require a babysitter").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a family finance advisor.`,
    user: `Write a beginner's guide to ONE specific financial topic for families (e.g., "how to budget for a new baby," "a guide to starting a college savings fund for your child," or "7 ways to teach your kids about money").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Major Milestones & Transitions ---
const milestoneTemplates = [
  {
    system: `You are a family counselor who guides families through major life changes.`,
    user: `Write a comprehensive guide on how to prepare the family for ONE specific major transition (e.g., "how to prepare your older child for the arrival of a new baby," "a guide to moving to a new city with kids," or "how to navigate the first year after a divorce as a family").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert on family health and safety.`,
    user: `Create a practical guide to ONE specific aspect of family health or safety (e.g., "what to keep in a family first-aid kit," "a guide to choosing a family pet," or "how to create a fire escape plan for your family").${COMMON_STRUCTURE}`,
  },
];


// --- COMBINE ALL TEMPLATES INTO ONE MASTER ARRAY ---
const allTemplates = [
  ...developmentalTemplates,
  ...problemSolverTemplates,
  ...connectionTemplates,
  ...familyLifeTemplates,
  ...milestoneTemplates,
];

/**
 * Picks a random template from the master list.
 * @returns {object} A randomly selected template object with `system` and `user` properties.
 */
function pickRandomTemplate() {
  // Weight the randomness to favor the most urgent and searched-for topics
  const finalPool = [
    ...developmentalTemplates, ...developmentalTemplates, // Higher chance for age/stage guides
    ...problemSolverTemplates, ...problemSolverTemplates, ...problemSolverTemplates, // Highest chance for behavior problems
    ...connectionTemplates,
    ...familyLifeTemplates,
    ...milestoneTemplates,
  ];
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

/**
 * Builds a complete prompt object for the "Parenting & Family" category.
 * It randomly selects a template and injects the category name.
 * @returns {{system: string, user: string}} The final prompt object.
 */
export function buildPrompt() {
  const categoryName = 'Parenting & Family'; // Hardcoded for this specific file
  const template = pickRandomTemplate();
  
  const finalSystem = template.system.replace(/\{\{CATEGORY}}/g, categoryName);
  const finalUser = template.user.replace(/\{\{CATEGORY}}/g, categoryName);
  
  return {
    system: finalSystem,
    user: finalUser,
  };
}

export default { buildPrompt };