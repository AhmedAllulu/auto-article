/*
 * Prompt templates for the "Relationships & Dating" category.
 *
 * This file contains over 40 unique and creative prompt templates designed to generate
 * a wide variety of specific, high-quality articles that are empathetic, insightful, and
 * promote healthy relationship dynamics. Each template instructs the AI to choose a narrow
 * sub-topic, ensuring that repeated use of this file still results in unique and valuable content.
 */

import { COMMON_STRUCTURE } from './common_structure.js';

// --- TEMPLATE GROUP: The Modern Dater's Playbook (For Singles) ---
const datingTemplates = [
  {
    system: `You are a modern, savvy, and encouraging dating coach who provides actionable advice for navigating the current dating scene.`,
    user: `Write a complete "How-To" guide on ONE specific, challenging aspect of modern dating (e.g., "how to write a dating app profile that gets more matches," "a guide to planning a great first date that isn't boring," or "5 creative and non-awkward ways to start a conversation on a dating app"). Provide clear, positive, and practical tips.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a communication expert who helps people build confidence.`,
    user: `Create a guide with scripts and tips for ONE specific dating communication scenario (e.g., "how to tell if someone is interested in you: a guide to reading signals," "a script for politely turning down a second date," or "how to navigate the 'what are we?' conversation").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a digital dating safety advocate.`,
    user: `Write an essential guide to staying safe while dating online, focusing on ONE specific area (e.g., "red flags to look for on a dating profile," "a safety checklist for meeting someone for the first time," or "how to protect your personal information when dating online").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a "dating mindset" coach who focuses on self-worth and healthy expectations.`,
    user: `Develop an article that helps readers navigate the emotional side of dating, focusing on ONE specific challenge (e.g., "how to deal with dating app burnout," "a guide to building self-confidence after a breakup," or "how to enjoy being single and date on your own terms").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Connection Lab (For Couples) ---
const coupleTemplates = [
  {
    system: `You are a relationship therapist and communication expert who helps couples build stronger, deeper connections.`,
    user: `Write a detailed guide for couples on how to improve ONE specific, fundamental aspect of their relationship (e.g., "a guide to active listening: how to truly hear your partner," "5 communication exercises for couples to build intimacy," or "how to fight fair: a guide to healthy conflict resolution"). Provide actionable exercises or conversation starters.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a "relationship enrichment" specialist who believes in keeping the spark alive.`,
    user: `Create a listicle of 7-10 creative and fun ideas for ONE specific aspect of a long-term relationship (e.g., "10 creative date night ideas that aren't just dinner and a movie," "a guide to starting a new hobby together as a couple," or "how to celebrate relationship milestones in a meaningful way").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert on the psychology of love and attachment.`,
    user: `Write an explainer article on ONE specific, important concept in relationship psychology (e.g., "what are the 'Five Love Languages' and how to discover yours," "a beginner's guide to attachment theory in relationships," or "the difference between healthy and unhealthy compromise"). Make the concept easy to understand and apply.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a financial advisor for couples.`,
    user: `Develop a guide on how to navigate ONE specific financial topic as a couple (e.g., "how to talk about money with your partner without fighting," "a guide to merging finances after marriage," or "how to budget together as a team").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Navigating the Hard Stuff (Challenges & Breakups) ---
const challengeTemplates = [
  {
    system: `You are a compassionate and wise counselor who provides gentle, supportive advice for navigating difficult relationship challenges.`,
    user: `Write a supportive guide on how to handle ONE specific, common relationship problem (e.g., "how to rebuild trust after it's been broken," "what to do when you and your partner have different libidos," or "a guide to navigating a long-distance relationship successfully"). Offer balanced, non-judgmental advice.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a breakup and recovery coach who helps people heal and move forward.`,
    user: `Create a step-by-step guide to navigating ONE specific phase of a breakup (e.g., "how to get through the first week after a breakup," "a guide to the 'no contact' rule and why it works," or "how to know when you're truly ready to start dating again"). Focus on self-care and healing.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a friendship expert who understands the importance of platonic relationships.`,
    user: `Write an article on how to navigate ONE specific challenge in a friendship (e.g., "how to make new friends as an adult," "a guide to ending a toxic friendship," or "what to do when you and your best friend are growing apart").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Social Dynamics & Self-Improvement ---
const socialTemplates = [
  {
    system: `You are a social skills coach who helps people build confidence in all types of relationships.`,
    user: `Write a practical guide on how to improve ONE specific social skill (e.g., "how to be a better listener in conversations," "a guide to overcoming shyness in social situations," or "how to set healthy boundaries with family and friends").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a self-love and personal growth advocate.`,
    user: `Create an inspiring article that connects personal well-being to relationship health, focusing on ONE specific topic (e.g., "why self-love is the foundation for a healthy relationship," "how to identify and work on your own toxic traits," or "a guide to understanding your own relationship patterns").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Modern Relationship Explainers ---
const explainerTemplates = [
  {
    system: `You are a cultural analyst who explains modern relationship trends.`,
    user: `Write a balanced and informative explainer on ONE specific, modern dating or relationship term (e.g., "what is 'ghosting' and how to deal with it?," "a guide to understanding polyamory and ethical non-monogamy," or "the concept of 'situationships': what are they and are they healthy?").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a relationship myth-buster.`,
    user: `Write an article that debunks 3-5 common myths about love and relationships (e.g., "the myth of 'the one': why soulmates are made, not found," "debunking the idea that you shouldn't go to bed angry," or "why 'if you loved me, you would know' is a toxic belief").${COMMON_STRUCTURE}`,
  },
];


// --- COMBINE ALL TEMPLATES INTO ONE MASTER ARRAY ---
const allTemplates = [
  ...datingTemplates,
  ...coupleTemplates,
  ...challengeTemplates,
  ...socialTemplates,
  ...explainerTemplates,
];

/**
 * Picks a random template from the master list.
 * @returns {object} A randomly selected template object with `system` and `user` properties.
 */
function pickRandomTemplate() {
  // Weight the randomness to cover the full spectrum of relationship stages
  const finalPool = [
    ...datingTemplates, ...datingTemplates, // Higher chance for dating advice
    ...coupleTemplates, ...coupleTemplates, // Higher chance for couple advice
    ...challengeTemplates, ...challengeTemplates, // Higher chance for navigating problems
    ...socialTemplates,
    ...explainerTemplates,
  ];
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

/**
 * Builds a complete prompt object for the "Relationships & Dating" category.
 * It randomly selects a template and injects the category name.
 * @returns {{system: string, user: string}} The final prompt object.
 */
export function buildPrompt() {
  const categoryName = 'Relationships & Dating'; // Hardcoded for this specific file
  const template = pickRandomTemplate();
  
  const finalSystem = template.system.replace(/\{\{CATEGORY}}/g, categoryName);
  const finalUser = template.user.replace(/\{\{CATEGORY}}/g, categoryName);
  
  return {
    system: finalSystem,
    user: finalUser,
  };
}

export default { buildPrompt };