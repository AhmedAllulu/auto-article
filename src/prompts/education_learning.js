/*
 * Prompt templates for the "Education & Learning" category.
 *
 * This file contains over 40 unique and creative prompt templates designed to generate
 * a wide variety of specific, high-quality articles about study techniques, skill acquisition,
 * and the science of learning. Each template instructs the AI to choose a narrow sub-topic,
 * ensuring that repeated use of this file still results in unique and valuable content.
 */

import { COMMON_STRUCTURE } from './common_structure.js';

// --- TEMPLATE GROUP: The Study Lab (Meta-Learning & Techniques) ---
const studyTechniqueTemplates = [
  {
    system: `You are a learning scientist and cognitive psychologist who explains evidence-based study techniques.`,
    user: `Write a detailed, step-by-step guide on how to use ONE specific, powerful learning technique (e.g., "how to use Active Recall to remember anything," "a beginner's guide to the Spaced Repetition system," or "how to use the Feynman Technique to truly understand a complex topic"). Explain the science behind why it works and provide a practical example.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a productivity coach for students who helps them overcome common learning obstacles.`,
    user: `Create a practical guide on how to solve ONE specific study-related problem (e.g., "how to stop procrastinating on a big assignment," "the best way to maintain focus while studying in a noisy environment," or "how to read a dense textbook without getting bored"). Provide 5-7 actionable strategies.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert on memory who makes complex concepts easy to apply.`,
    user: `Write an article explaining how to use ONE specific memory enhancement technique (e.g., "a guide to building a 'Memory Palace' to memorize lists," "how to use mnemonic devices to remember facts," or "the power of chunking for learning complex information"). Use a clear, real-world example.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a note-taking specialist who helps students capture and retain information effectively.`,
    user: `Develop a complete guide to ONE specific method of note-taking (e.g., "the Cornell Note-Taking Method, explained," "how to take effective notes for an open-book exam," or "a guide to digital note-taking with apps like Notion or Obsidian").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a test preparation expert.`,
    user: `Write a strategic guide on how to prepare for ONE specific type of exam (e.g., "how to study for a multiple-choice exam," "a strategy for acing essay-based exams," or "how to manage your time effectively during a standardized test").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Skill Mastery Blueprints (Learning Specific Skills) ---
const skillMasteryTemplates = [
  {
    system: `You are a skill acquisition expert who creates clear roadmaps for beginners.`,
    user: `Create a comprehensive, step-by-step roadmap for a beginner to learn ONE specific, popular skill (e.g., "a 3-month roadmap to learning conversational Spanish," "how to learn the basics of Python programming in 30 days," or "a beginner's guide to learning the guitar"). Break the journey down into manageable phases and recommend resources for each step.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a creative instructor who teaches artistic skills.`,
    user: `Write a "Your First Week" guide to learning ONE specific creative skill (e.g., "your first week of learning digital drawing," "a 7-day plan to start writing a novel," or "how to learn basic photography skills in one week"). Provide a simple, confidence-building project for each day.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a practical skills coach who focuses on real-world abilities.`,
    user: `Develop a tutorial on how to learn ONE specific, practical life or career skill (e.g., "a beginner's guide to public speaking," "how to learn basic financial literacy," or "the fundamentals of touch typing for speed and accuracy"). Focus on the core components needed for basic competency.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Digital Backpack (Tools & Resources) ---
const toolTemplates = [
  {
    system: `You are an ed-tech reviewer who provides honest, practical advice on learning tools.`,
    user: `Write a "best of" list for ONE specific category of educational apps or websites (e.g., "the 5 best language learning apps like Duolingo," "top 7 free websites for learning to code," or "the best apps for digital flashcards and spaced repetition"). Include pros, cons, and who each tool is best for.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a curator of high-quality learning content.`,
    user: `Create a curated list of the best free online resources for learning about ONE specific, popular subject (e.g., "the 10 best YouTube channels for learning history," "top 5 podcasts that will make you smarter about science," or "the best free online courses for marketing"). Justify each recommendation.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a product comparison specialist for learning platforms.`,
    user: `Write a detailed comparison of two popular online learning platforms to help readers choose (e.g., "Coursera vs. edX: Which is better for university-level courses?," "Skillshare vs. Udemy: A complete breakdown for creative skills," or "Brilliant.org vs. Khan Academy for learning math and science").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Education Explained (Concepts & Theories) ---
const conceptTemplates = [
  {
    system: `You are an education theorist who can explain complex ideas in a simple, accessible way.`,
    user: `Write a clear explainer article on ONE specific, influential learning theory or concept (e.g., "what is 'Growth Mindset' and how can you develop one?," "Bloom's Taxonomy, explained for students and teachers," or "understanding 'metacognition' or thinking about your thinking"). Explain the concept and its practical application for learners.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an educational myth-buster who separates science from pseudoscience.`,
    user: `Write a myth-busting article that debunks ONE specific, persistent myth in education (e.g., "the myth of 'learning styles': why you're not just a 'visual learner'," "do you really only use 10% of your brain?," or "the truth about speed reading"). Use scientific evidence to support your claims.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a guide to different educational philosophies.`,
    user: `Create a beginner's guide to ONE specific educational philosophy (e.g., "what is the Montessori method of education?," "an introduction to the Socratic method," or "understanding project-based learning"). Explain the core principles and how it differs from traditional education.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Future of Learning (Trends & Innovation) ---
const futureTemplates = [
  {
    system: `You are a futurist and trend analyst focused on the evolution of education.`,
    user: `Write a trend analysis article about ONE specific emerging trend in education and learning (e.g., "the rise of AI tutors and personalized learning paths," "how virtual reality is changing the classroom," or "the growing importance of micro-credentials and skill-based hiring"). Explain the trend and its potential impact on the future of learning.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an advocate for lifelong learning.`,
    user: `Create an inspiring article on the importance of ONE specific aspect of adult or lifelong learning (e.g., "how to stay curious and keep learning as an adult," "the benefits of learning a new skill for your brain health," or "a guide to choosing a new hobby for personal growth").${COMMON_STRUCTURE}`,
  },
];


// --- COMBINE ALL TEMPLATES INTO ONE MASTER ARRAY ---
const allTemplates = [
  ...studyTechniqueTemplates,
  ...skillMasteryTemplates,
  ...toolTemplates,
  ...conceptTemplates,
  ...futureTemplates,
];

/**
 * Picks a random template from the master list.
 * @returns {object} A randomly selected template object with `system` and `user` properties.
 */
function pickRandomTemplate() {
  // Weight the randomness to favor the most practical and searched-for topics
  const finalPool = [
    ...studyTechniqueTemplates, ...studyTechniqueTemplates, ...studyTechniqueTemplates, // Higher chance for study tips
    ...skillMasteryTemplates, ...skillMasteryTemplates, // Higher chance for skill roadmaps
    ...toolTemplates,
    ...conceptTemplates,
    ...futureTemplates,
  ];
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

/**
 * Builds a complete prompt object for the "Education & Learning" category.
 * It randomly selects a template and injects the category name.
 * @returns {{system: string, user: string}} The final prompt object.
 */
export function buildPrompt() {
  const categoryName = 'Education & Learning'; // Hardcoded for this specific file
  const template = pickRandomTemplate();
  
  const finalSystem = template.system.replace(/\{\{CATEGORY}}/g, categoryName);
  const finalUser = template.user.replace(/\{\{CATEGORY}}/g, categoryName);
  
  return {
    system: finalSystem,
    user: finalUser,
  };
}

export default { buildPrompt };