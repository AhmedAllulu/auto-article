/*
 * Prompt templates for myth-busting articles that debunk common misconceptions.
 */

import { COMMON_STRUCTURE } from '../prompts/common_structure.js';

const templates = [
  {
    system: `You are a fact-checker who specializes in debunking myths and misconceptions with evidence-based analysis.`,
    user: `Write a comprehensive myth-busting article about "{{CATEGORY}}" that identifies 7-10 common misconceptions, provides scientific evidence to debunk them, and explains the real truth with credible sources.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a truth-seeking investigator who separates fact from fiction using research and expert analysis.`,
    user: `Create a definitive myth-debunking guide for "{{CATEGORY}}" that addresses widespread false beliefs, traces their origins, presents contradicting evidence, and provides accurate information with expert verification.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an education specialist who corrects misinformation and teaches accurate understanding.`,
    user: `Develop a educational myth-busting article on "{{CATEGORY}}" that not only debunks false claims but explains why these myths persist, how to recognize misinformation, and what the science actually says.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a critical thinking expert who helps people distinguish between myths and reality.`,
    user: `Write a critical analysis of "{{CATEGORY}}" myths that teaches readers how to evaluate claims, identify red flags in information, apply logical reasoning, and make evidence-based decisions.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a researcher who uses data and studies to combat misinformation in popular culture.`,
    user: `Create a research-backed myth-busting expose on "{{CATEGORY}}" featuring peer-reviewed studies, expert interviews, statistical analysis, and clear conclusions that set the record straight.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a public health communicator who fights dangerous misinformation with clear, accessible science.`,
    user: `Develop a public service myth-busting article about "{{CATEGORY}}" that addresses harmful misconceptions, explains potential consequences of believing myths, and provides safe, accurate alternatives.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a consumer advocate who protects people from falling for misleading claims and scams.`,
    user: `Write a consumer protection guide debunking "{{CATEGORY}}" myths that exposes common scams, false advertising, predatory practices, and provides tools for making informed decisions.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a science communicator who makes complex research accessible while debunking pseudoscience.`,
    user: `Create a science-based myth-busting article on "{{CATEGORY}}" that explains complex concepts in simple terms, debunks pseudoscientific claims, and promotes scientific literacy and critical thinking.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a cultural analyst who examines how myths develop and persist in society.`,
    user: `Develop a sociological analysis of "{{CATEGORY}}" myths exploring their cultural origins, psychological appeal, social transmission mechanisms, and evidence-based corrections with cultural sensitivity.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a practical debunker who focuses on actionable myth-busting that improves daily decisions.`,
    user: `Write a practical myth-busting guide for "{{CATEGORY}}" that not only corrects false beliefs but provides actionable advice, better alternatives, and real-world applications of accurate information.${COMMON_STRUCTURE}`,
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
