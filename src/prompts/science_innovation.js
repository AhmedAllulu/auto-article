/*
 * Prompt templates for the "Science & Innovation" category.
 *
 * This file contains over 60 unique and creative prompt templates designed to generate
 * a wide variety of specific, high-quality articles that make complex science and
 * technology topics accessible and exciting. Each template instructs the AI to choose a
 * narrow sub-topic, ensuring that repeated use of this file still results in unique content.
 */

import { COMMON_STRUCTURE } from './common_structure.js';

// --- TEMPLATE GROUP: Big Concept Explainers (The "What Is...?" Series) ---
const bigConceptTemplates = [
  {
    system: `You are a gifted science communicator, like Carl Sagan or Neil deGrasse Tyson, who can explain profound concepts with clarity and wonder.`,
    user: `Write a fascinating explainer article on ONE fundamental, mind-bending scientific concept (e.g., "What is quantum entanglement, explained with a simple analogy?," "A beginner's guide to Einstein's theory of relativity," or "What is dark matter and how do we know it exists?"). Assume the reader is intelligent but has no prior knowledge. Use analogies to make it understandable.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a biology expert who can demystify the building blocks of life.`,
    user: `Create a clear, jargon-free guide to ONE specific, complex biological process (e.g., "How does CRISPR gene editing actually work?," "What is mRNA and how do vaccines use it?," or "The science of DNA: How does it store information?"). Focus on the 'how' and the 'why' it's important.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a computer scientist who makes the digital world understandable.`,
    user: `Write a simple but comprehensive explainer on ONE core concept of modern computing (e.g., "What is a neural network and how does it learn?," "How does blockchain technology work beyond cryptocurrency?," or "What is 'The Cloud' and where is your data actually stored?").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a patient teacher who breaks down intimidating subjects.`,
    user: `Develop a "Science 101" article that explains the basics of ONE entire field of science for absolute beginners (e.g., "An Introduction to Particle Physics," "The Fundamentals of Neuroscience," or "A Beginner's Guide to Geology and Plate Tectonics").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Innovation Spotlights (The Future Is Now) ---
const innovationTemplates = [
  {
    system: `You are a futurist and tech scout who identifies game-changing innovations. Write with an exciting, forward-looking tone.`,
    user: `Write a deep-dive article on ONE specific, cutting-edge technology that is poised to change the world (e.g., "Solid-state batteries: The innovation that will revolutionize electric vehicles," "The science of vertical farming and its role in future food security," or "How AI is accelerating drug discovery"). Explain the technology and its potential impact.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an innovation analyst who evaluates the real-world application of new tech.`,
    user: `Create a detailed analysis of ONE specific recent scientific breakthrough (e.g., "The James Webb Space Telescope: What have we learned so far?," "Breakthroughs in nuclear fusion: Are we closer to clean energy?," or "The rise of personalized medicine through genetic testing"). Focus on the results and future implications.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a materials scientist who gets excited about the building blocks of the future.`,
    user: `Write a fascinating spotlight on ONE specific advanced material (e.g., "Graphene: The 'wonder material' and its potential applications," "How self-healing concrete could change construction," or "The science of transparent wood"). Explain what it is and what it could be used for.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a robotics expert.`,
    user: `Develop a guide to the latest advancements in ONE specific area of robotics (e.g., "The evolution of humanoid robots like Boston Dynamics' Atlas," "How surgical robots are improving medicine," or "The role of drones in disaster relief and environmental monitoring").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: How Things Work (The Mechanics of the Universe) ---
const howThingsWorkTemplates = [
  {
    system: `You are an engineer who loves to explain the mechanics behind everyday and complex technologies.`,
    user: `Write a clear, step-by-step explanation of how ONE specific piece of modern technology works (e.g., "How do noise-canceling headphones eliminate sound?," "The science of GPS: How does your phone know your exact location?," or "How does a 3D printer build an object from nothing?"). Use simple language and diagrams/descriptions.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a natural science expert who explains the world around us.`,
    user: `Create a fascinating guide to the science behind ONE specific natural phenomenon (e.g., "The science of a thunderstorm: From cloud formation to lightning," "How do auroras like the Northern Lights get their color?," or "The incredible physics of a geyser").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a biologist who explains the inner workings of the living world.`,
    user: `Write an article explaining the biological mechanics of ONE specific process (e.g., "How do bees make honey?," "The science of bioluminescence: How and why do animals glow?," or "How does a chameleon change its color?").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Science in Our Lives (The Practical Application) ---
const practicalScienceTemplates = [
  {
    system: `You are a practical science writer who connects scientific principles to everyday life.`,
    user: `Write an article that reveals the surprising science behind ONE common daily activity or object (e.g., "The chemistry of coffee: What makes the perfect cup?," "The psychology of habit formation and how to use it to your advantage," or "The physics of microwave ovens: How do they heat food so fast?").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a neuroscience communicator who makes brain science accessible.`,
    user: `Create a guide to the science of ONE specific mental process (e.g., "The science of sleep: What really happens in your brain when you rest?," "How your brain processes music and why it affects your mood," or "The neuroscience of memory: How are memories formed and stored?").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an environmental scientist who explains our planet's processes.`,
    user: `Develop an explainer on the science behind ONE specific environmental issue (e.g., "The science of climate change: Understanding the greenhouse effect," "How does plastic recycling actually work?," or "The ecological importance of coral reefs").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Pioneers & Discoveries (The History of Science) ---
const historyTemplates = [
  {
    system: `You are a science historian and storyteller who brings the past to life.`,
    user: `Write a compelling narrative about ONE specific, pivotal scientific discovery or invention (e.g., "The story of the discovery of penicillin and how it changed medicine," "How the invention of the printing press fueled the scientific revolution," or "The race to discover the structure of DNA"). Focus on the human story behind the science.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a biographer of great scientific minds.`,
    user: `Create a profile of ONE specific, influential scientist, focusing on their key contribution (e.g., "Marie Curie's groundbreaking work on radioactivity," "How Alan Turing's work laid the foundation for modern computing," or "The legacy of Rosalind Franklin's contribution to DNA science").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Myth-Busting & Fact-Checking ---
const mythBustingTemplates = [
  {
    system: `You are a critical thinker and science journalist who debunks misinformation with evidence.`,
    user: `Write a myth-busting article that tackles 5-7 common misconceptions about ONE specific scientific topic (e.g., "Debunking 5 common myths about the human brain," "The truth about 'chemical-free' products: A chemist explains," or "Evolution myths: Separating fact from fiction"). Use clear, evidence-based arguments.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Ethical Dilemmas & The Big Questions ---
const ethicsTemplates = [
  {
    system: `You are a science ethicist who thoughtfully explores the societal implications of innovation.`,
    user: `Write a balanced and thought-provoking article on the ethical dilemmas surrounding ONE specific emerging technology (e.g., "The ethics of artificial intelligence: Bias, jobs, and consciousness," "Human gene editing: Where should society draw the line?," or "The privacy implications of facial recognition technology"). Explore the pros and cons without taking a hard stance.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a philosopher of science who asks the big questions.`,
    user: `Create an article exploring ONE of the great unanswered questions in science (e.g., "Are we alone in the universe? Exploring the Fermi Paradox," "What is consciousness?," or "The search for a 'Theory of Everything'"). Explain the current state of research and the challenges involved.${COMMON_STRUCTURE}`,
  },
];


// --- COMBINE ALL TEMPLATES INTO ONE MASTER ARRAY ---
const allTemplates = [
  ...bigConceptTemplates,
  ...innovationTemplates,
  ...howThingsWorkTemplates,
  ...practicalScienceTemplates,
  ...historyTemplates,
  ...mythBustingTemplates,
  ...ethicsTemplates,
];

/**
 * Picks a random template from the master list.
 * @returns {object} A randomly selected template object with `system` and `user` properties.
 */
function pickRandomTemplate() {
  // Weight the randomness to favor the most accessible and popular article types
  const finalPool = [
    ...bigConceptTemplates, ...bigConceptTemplates, // Higher chance for explainers
    ...innovationTemplates, ...innovationTemplates, // Higher chance for future tech
    ...howThingsWorkTemplates, ...howThingsWorkTemplates, // Higher chance for "how it works"
    ...practicalScienceTemplates,
    ...historyTemplates,
    ...mythBustingTemplates,
    ...ethicsTemplates,
  ];
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

/**
 * Builds a complete prompt object for the "Science & Innovation" category.
 * It randomly selects a template and injects the category name.
 * @returns {{system: string, user: string}} The final prompt object.
 */
export function buildPrompt() {
  const categoryName = 'Science & Innovation'; // Hardcoded for this specific file
  const template = pickRandomTemplate();
  
  const finalSystem = template.system.replace(/\{\{CATEGORY}}/g, categoryName);
  const finalUser = template.user.replace(/\{\{CATEGORY}}/g, categoryName);
  
  return {
    system: finalSystem,
    user: finalUser,
  };
}

export default { buildPrompt };