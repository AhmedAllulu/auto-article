/*
 * Prompt templates for case study articles that showcase real-world examples and results.
 */

import { COMMON_STRUCTURE } from '../prompts/common_structure.js';

const templates = [
  {
    system: `You are a case study specialist who creates compelling stories of success and failure with actionable insights.`,
    user: `Write a detailed case study about "{{CATEGORY}}" featuring a real-world scenario, challenges faced, solutions implemented, and measurable results achieved. Include lessons learned and practical takeaways.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a business analyst who documents strategic implementations and their outcomes.`,
    user: `Create an in-depth case study on "{{CATEGORY}}" that follows a company/individual from problem identification through solution implementation to final results. Include methodology, timeline, and ROI analysis.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a researcher who analyzes successful implementations to extract replicable strategies.`,
    user: `Develop a comprehensive case study examining how "{{CATEGORY}}" was successfully implemented, including background context, decision-making process, execution phases, and quantifiable outcomes with transferable insights.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a consultant who studies both successes and failures to provide balanced learning opportunities.`,
    user: `Write a balanced case study on "{{CATEGORY}}" that examines what worked, what didn't, unexpected challenges, pivot strategies, and final outcomes with honest analysis and practical recommendations.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a storyteller who transforms business scenarios into engaging, educational narratives.`,
    user: `Create an engaging case study narrative about "{{CATEGORY}}" that reads like a story but delivers hard data, featuring character development, plot progression, climax resolution, and actionable epilogue.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a performance analyst who focuses on measurable results and data-driven conclusions.`,
    user: `Develop a metrics-focused case study on "{{CATEGORY}}" with before/after comparisons, statistical analysis, performance indicators, cost-benefit analysis, and evidence-based recommendations for replication.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an implementation expert who documents step-by-step transformation processes.`,
    user: `Write a detailed transformation case study for "{{CATEGORY}}" including initial state assessment, planning phase, implementation stages, obstacle navigation, and final state evaluation with process documentation.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a change management specialist who studies organizational transformations.`,
    user: `Create a comprehensive change management case study for "{{CATEGORY}}" covering stakeholder analysis, resistance factors, adoption strategies, training programs, and cultural impact with change metrics.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a innovation researcher who examines breakthrough implementations and their impact.`,
    user: `Develop an innovation case study on "{{CATEGORY}}" highlighting creative problem-solving, unconventional approaches, breakthrough moments, market impact, and scalability potential with innovation frameworks.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a risk assessment expert who analyzes decision-making under uncertainty.`,
    user: `Write a risk-focused case study on "{{CATEGORY}}" examining decision-making processes, risk evaluation methods, mitigation strategies, contingency planning, and outcome analysis with risk management insights.${COMMON_STRUCTURE}`,
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
