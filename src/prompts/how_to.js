/*
 * Prompt templates for "how-to" articles.
 * Edit or add templates as needed. The generator will pick one at random.
 */

import { COMMON_STRUCTURE } from './common_structure.js';

const templates = [
  {
    system: `You are an expert tutorial writer who creates concise, actionable guides with clear structure and practical value.`,
    user: `Write a step-by-step article about ONE SPECIFIC task within "{{CATEGORY}}" (e.g., not just travel, but "planning a 3-day budget trip to Istanbul"). Create a unique, compelling title (avoid repetitive patterns). Ensure the sub-topic is narrow and actionable. Use numbered steps and include troubleshooting tips.

${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a seasoned instructor who creates comprehensive explanatory articles with logical flow and practical application.`,
    user: `Create a guide about ONE specific skill within "{{CATEGORY}}" (e.g., "making authentic Italian carbonara" not "cooking"). Use an engaging title format like "Master the Art of..." or "The Complete Guide to...". Present modern tools/methods, clear steps, common mistakes, and proven tips.

${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a DIY expert who simplifies complex processes into easy-to-follow instructions with clear sections and practical details.`,
    user: `Write a guide for ONE very specific task within "{{CATEGORY}}" (e.g., "installing a smart doorbell" not "home improvement"). Create an attention-grabbing title and cover: tools needed, time required, difficulty level, step-by-step instructions, safety warnings, and troubleshooting.

${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a professional trainer who creates detailed learning materials with clear objectives and structured progression.`,
    user: `Develop a tutorial on ONE narrow aspect of "{{CATEGORY}}" with a unique, compelling title (try formats like "Your Blueprint for...", "The Ultimate Method to...", "Secrets of..."). Include clear objectives, prerequisites, efficient steps with explanations, common pitfalls to avoid, and practice exercises.

${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a technical writer specializing in beginner-friendly tutorials.`,
    user: `Create a foolproof guide to ONE specific technique within "{{CATEGORY}}" (e.g., "parallel parking in tight spaces" not "driving"). Use a creative title format and assume no prior knowledge. Include overview, modern tools/materials, streamlined step-by-step process, quality checks, and trending FAQs.

${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a craftsperson who teaches skills through clear, methodical instruction.`,
    user: `Write an article about ONE specific process within "{{CATEGORY}}" (e.g., "refinishing antique wooden furniture" not "woodworking"). Use a creative title like "From Scratch to Perfection:..." or "The Art of...". Cover current preparation methods, efficient execution, modern finishing touches, and maintenance.

${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an educator who breaks down complex topics into digestible lessons.`,
    user: `Create an educational guide on ONE specific skill within "{{CATEGORY}}" (e.g., "memorizing vocabulary for Spanish conversations" not "language learning"). Use an engaging title format like "Unlock the Secret to..." or "The 5-Step Method for...". Include clear objectives, current background info, streamlined methodology, and success criteria.

${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a problem-solving specialist who creates solution-oriented content.`,
    user: `Develop a guide for ONE specific problem within "{{CATEGORY}}" (e.g., "fixing a running toilet" not "plumbing"). Create a compelling title like "Stop the Drip: ..." or "Never Again: ...". Identify today's common challenges, current solution approaches, quick decision frameworks, and modern backup plans.

${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a productivity expert who optimizes processes for efficiency.`,
    user: `Write an efficiency guide for ONE specific workflow within "{{CATEGORY}}" (e.g., "automating social media posting for small businesses" not "marketing"). Use a dynamic title like "Double Your Results: ..." or "The Lazy Person's Guide to...". Focus on 2024 time-saving techniques, current optimal workflows, trending automation tools, and modern result measurement.

${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a hands-on instructor who emphasizes practical application.`,
    user: `Create a practical tutorial on ONE specific technique within "{{CATEGORY}}" (e.g., "negotiating salary during job interviews" not "career development"). Use an engaging title format like "Land the Deal: ..." or "The Power Move: ...". Include current real-world examples, hands-on exercises, quick checkpoint validations, today's troubleshooting scenarios, and trending resources.

${COMMON_STRUCTURE}`,
  },
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function buildPrompt(categoryName) {
  const tpl = pickRandom(templates);
  const replace = (str) => str.replace(/\{\{CATEGORY}}/g, categoryName);
  return {
    system: replace(tpl.system),
    user: replace(tpl.user),
  };
}

export default { buildPrompt };

