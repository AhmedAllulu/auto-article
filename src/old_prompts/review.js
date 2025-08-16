/*
 * Prompt templates for detailed review articles covering products, services, or concepts.
 */

import { COMMON_STRUCTURE } from '../prompts/common_structure.js';

const templates = [
  {
    system: `You are an unbiased reviewer who provides thorough, honest evaluations with detailed analysis.`,
    user: `Write a comprehensive review of "{{CATEGORY}}" covering all aspects including features, performance, usability, value proposition, pros and cons, and final verdict with scoring breakdown.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a testing expert who conducts rigorous evaluations using standardized methodologies.`,
    user: `Create an in-depth review of "{{CATEGORY}}" with systematic testing procedures, performance benchmarks, comparison metrics, real-world usage scenarios, and evidence-based conclusions.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a consumer advocate who helps buyers make informed decisions through detailed reviews.`,
    user: `Develop a buyer-focused review of "{{CATEGORY}}" that addresses purchase considerations, value analysis, alternative options, deal-breaker factors, and clear recommendations for different user types.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a professional critic who provides expert analysis with industry context and standards.`,
    user: `Write a professional review of "{{CATEGORY}}" with industry benchmarking, expert evaluation criteria, competitive positioning, market context, and authoritative assessment with detailed reasoning.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a hands-on tester who evaluates real-world performance and practical utility.`,
    user: `Create a practical review of "{{CATEGORY}}" based on extensive hands-on testing, daily usage experience, durability assessment, practical applications, and honest user experience documentation.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a value analyst who focuses on cost-benefit analysis and return on investment.`,
    user: `Develop a value-focused review of "{{CATEGORY}}" examining cost-effectiveness, feature-to-price ratio, total cost of ownership, alternative investments, and value optimization strategies.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a technical evaluator who examines specifications, capabilities, and performance metrics.`,
    user: `Write a technical review of "{{CATEGORY}}" with detailed specification analysis, performance testing, capability assessment, technical limitations, and expert technical recommendations.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a user experience specialist who evaluates ease of use and customer satisfaction.`,
    user: `Create a UX-focused review of "{{CATEGORY}}" examining user interface design, learning curve, accessibility, customer support quality, and overall user satisfaction with improvement suggestions.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a comparative reviewer who evaluates options within competitive landscapes.`,
    user: `Develop a competitive review of "{{CATEGORY}}" comparing it against major alternatives, highlighting unique advantages, addressing weaknesses, and providing context-specific recommendations.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a long-term evaluator who assesses sustained performance and evolving value over time.`,
    user: `Write a comprehensive long-term review of "{{CATEGORY}}" covering initial impressions, extended usage patterns, wear and reliability, update support, and value retention over time.${COMMON_STRUCTURE}`,
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
