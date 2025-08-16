/*
 * Prompt templates for comprehensive beginner guides that assume no prior knowledge.
 */

import { COMMON_STRUCTURE } from '../prompts/common_structure.js';

const templates = [
  {
    system: `You are an expert educator who specializes in teaching complex topics to complete beginners.`,
    user: `Write a comprehensive beginner's guide to "{{CATEGORY}}" that assumes zero prior knowledge. Include fundamental concepts, essential terminology, step-by-step learning path, and practical exercises.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a patient teacher who breaks down intimidating subjects into manageable learning modules.`,
    user: `Create a complete beginner's roadmap for "{{CATEGORY}}" with clear learning objectives, prerequisite skills, progressive difficulty levels, checkpoint assessments, and resource recommendations.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a learning specialist who designs curriculum for absolute beginners in any field.`,
    user: `Develop an ultimate beginner's guide to "{{CATEGORY}}" featuring foundational concepts, common beginner mistakes to avoid, learning milestones, practice opportunities, and next-level progression paths.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a mentor who guides newcomers through their first steps in unfamiliar territory.`,
    user: `Write a supportive beginner's introduction to "{{CATEGORY}}" that addresses common fears and concerns, provides encouragement, sets realistic expectations, and offers a clear path forward.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an onboarding specialist who helps people transition from knowing nothing to basic competency.`,
    user: `Create a structured beginner's course outline for "{{CATEGORY}}" with learning modules, hands-on activities, progress tracking, troubleshooting help, and graduation criteria for each level.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a simplification expert who makes complex topics accessible to anyone.`,
    user: `Develop a jargon-free beginner's guide to "{{CATEGORY}}" using simple language, real-world analogies, visual learning aids, and practical examples that anyone can understand and apply.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a foundation builder who ensures beginners develop strong fundamental understanding.`,
    user: `Write a thorough beginner's foundation course for "{{CATEGORY}}" covering essential principles, core concepts, basic techniques, fundamental tools, and building blocks for advanced learning.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a confidence builder who helps beginners overcome intimidation and build skills gradually.`,
    user: `Create an encouraging beginner's journey through "{{CATEGORY}}" with small wins, confidence-building exercises, peer support strategies, and celebration milestones to maintain motivation.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a practical instructor who focuses on immediate applicability for beginners.`,
    user: `Develop a hands-on beginner's workshop for "{{CATEGORY}}" with simple projects, immediate results, practical applications, real-world scenarios, and tangible skill development opportunities.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a comprehensive guide creator who ensures beginners have everything they need to start.`,
    user: `Write a complete beginner's starter pack for "{{CATEGORY}}" including essential tools, recommended resources, community connections, learning schedules, and success strategies for independent learning.${COMMON_STRUCTURE}`,
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
