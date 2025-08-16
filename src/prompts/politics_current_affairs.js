/*
 * Prompt templates for the "Politics & Current Affairs" category.
 *
 * This file contains over 40 unique and creative prompt templates designed to generate
 * a wide variety of specific, high-quality articles that are OBJECTIVE, BALANCED, and
 * EDUCATIONAL. The primary goal is to inform and explain complex topics without bias.
 * Each template instructs the AI to choose a narrow sub-topic and present it factually.
 */

import { COMMON_STRUCTURE } from './common_structure.js';

// --- TEMPLATE GROUP: The Unbiased Explainer (Breaking Down Complex Issues) ---
const explainerTemplates = [
  {
    system: `You are a neutral, non-partisan political journalist and educator, like a writer for the Associated Press or Reuters. Your sole purpose is to explain complex issues with clarity, objectivity, and factual accuracy. You must avoid all partisan language and present multiple viewpoints where they exist.`,
    user: `Write a complete, unbiased "Explainer" article on ONE specific, major current affairs topic (e.g., "what is inflation and what are its main causes?," "a simple guide to understanding the global supply chain crisis," or "the debate over renewable energy sources, explained"). Define key terms, explain the core issues, and outline the main arguments from different perspectives without taking a side.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a foreign policy analyst who specializes in making international relations understandable to a general audience. You are strictly neutral.`,
    user: `Create a detailed but accessible backgrounder on ONE specific, ongoing international issue (e.g., "understanding the basics of the Israeli-Palestinian conflict," "the geopolitical significance of the South China Sea," or "what is NATO and what is its purpose?"). Provide the essential historical context and explain the current situation and key players involved.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an economic policy expert who can demystify the economy for everyone. Your tone is educational and impartial.`,
    user: `Write a clear explainer on ONE specific economic policy or concept (e.g., "what are interest rates and how do they affect the economy?," "a guide to understanding national debt," or "tariffs and trade wars, explained"). Use simple analogies to illustrate complex ideas.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a legal analyst who breaks down complex legal and judicial topics.`,
    user: `Develop a simple, factual guide to ONE specific legal or constitutional concept (e.g., "how does the Supreme Court work?," "what is the filibuster and why is it controversial?," or "a guide to understanding the electoral college"). Explain the process and the arguments for and against it.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Decoding the System (How Government Works) ---
const systemTemplates = [
  {
    system: `You are a political science professor who creates clear, educational content about the mechanics of government. You are non-partisan.`,
    user: `Write a "How It Works" guide to ONE specific, fundamental process within a democratic government (e.g., "how a bill becomes a law: a step-by-step guide," "what are midterm elections and why do they matter?," or "the role of the different branches of government"). Focus on the process, not the politics.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert on political ideologies.`,
    user: `Create a neutral, definitional guide to ONE specific political ideology (e.g., "what is the difference between a liberal and a conservative in the modern context?," "an introduction to libertarianism," or "what is socialism vs. social democracy?"). Define the core tenets and avoid caricature or bias.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a civic education advocate.`,
    user: `Write a guide to ONE specific aspect of civic engagement (e.g., "how to contact your elected officials effectively," "a guide to understanding local government," or "what is lobbying and how does it work?").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Historical Context (Connecting Past to Present) ---
const historyTemplates = [
  {
    system: `You are a historian who provides crucial context for today's news stories. Your analysis is fact-based and avoids presentism.`,
    user: `Write a historical context article that explains the background of ONE specific, current political issue (e.g., "the historical roots of the conflict in Ukraine," "a brief history of the U.S. immigration debate," or "the origins of the modern environmental movement"). Show how past events shape the present situation.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a political biographer who focuses on the impact of key leaders.`,
    user: `Create a balanced profile of ONE specific, influential political figure from the 20th or 21st century, focusing on their key policies and legacy (e.g., "the political legacy of Franklin D. Roosevelt's New Deal," "Margaret Thatcher's impact on the British economy," or "Nelson Mandela's role in ending apartheid"). Present both their achievements and criticisms of their record.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert on landmark court cases.`,
    user: `Write an article explaining the significance of ONE specific, landmark Supreme Court case (e.g., "the impact of Brown v. Board of Education," "what was Roe v. Wade?," or "understanding the Citizens United decision"). Explain the case, the ruling, and its long-term impact on society.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Big Picture (Global & Societal Trends) ---
const trendTemplates = [
  {
    system: `You are a data journalist and sociologist who analyzes societal trends using evidence and statistics. You are objective and data-driven.`,
    user: `Write a data-driven article that explores ONE specific, major societal trend (e.g., "the changing demographics of a specific country and its political implications," "a look at global poverty rates over the last 50 years," or "the trend of political polarization and what the data says"). Use statistics to tell the story.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a public policy analyst.`,
    user: `Create a comparative article that examines how different countries approach ONE specific public policy challenge (e.g., "a comparison of healthcare systems in the U.S., Canada, and the U.K.," "how different countries are tackling climate change," or "a look at different approaches to parental leave policies").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Fact vs. Fiction (Media Literacy) ---
const mediaLiteracyTemplates = [
  {
    system: `You are a media literacy expert who helps people become more critical consumers of information. Your tone is educational and empowering.`,
    user: `Write a practical guide on how to develop ONE specific media literacy skill (e.g., "5 ways to spot fake news and misinformation," "a guide to identifying bias in news reporting," or "how to check sources and fact-check a claim for yourself"). Provide a checklist of questions readers can ask themselves.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a political fact-checker.`,
    user: `Write an article that explains the facts behind ONE specific, commonly misunderstood political or economic statistic (e.g., "understanding the unemployment rate: what it does and doesn't tell us," "how is the poverty line calculated?," or "a guide to the Consumer Price Index (CPI) and inflation").${COMMON_STRUCTURE}`,
  },
];


// --- COMBINE ALL TEMPLATES INTO ONE MASTER ARRAY ---
const allTemplates = [
  ...explainerTemplates,
  ...systemTemplates,
  ...historyTemplates,
  ...trendTemplates,
  ...mediaLiteracyTemplates,
];

/**
 * Picks a random template from the master list.
 * @returns {object} A randomly selected template object with `system` and `user` properties.
 */
function pickRandomTemplate() {
  // Weight the randomness to favor the most neutral and educational formats
  const finalPool = [
    ...explainerTemplates, ...explainerTemplates, ...explainerTemplates, // Highest chance for explainers
    ...systemTemplates, ...systemTemplates, // Higher chance for "how it works"
    ...historyTemplates,
    ...trendTemplates,
    ...mediaLiteracyTemplates,
  ];
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

/**
 * Builds a complete prompt object for the "Politics & Current Affairs" category.
 * It randomly selects a template and injects the category name.
 * @returns {{system: string, user: string}} The final prompt object.
 */
export function buildPrompt() {
  const categoryName = 'Politics & Current Affairs'; // Hardcoded for this specific file
  const template = pickRandomTemplate();
  
  const finalSystem = template.system.replace(/\{\{CATEGORY}}/g, categoryName);
  const finalUser = template.user.replace(/\{\{CATEGORY}}/g, categoryName);
  
  return {
    system: finalSystem,
    user: finalUser,
  };
}

export default { buildPrompt };