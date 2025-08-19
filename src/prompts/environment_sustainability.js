/*
 * =============================================================================
 * | PROMPT TEMPLATES: ENVIRONMENT & SUSTAINABILITY                             |
 * =============================================================================
 * | Comprehensive prompts for the 'Environment & Sustainability' category.    |
 * | Organised by article type to generate diverse and high-quality content.   |
 * =============================================================================
 */

import { COMMON_STRUCTURE } from './common_structure.js';

// =============================================================================
// | 1. ENVIRONMENTAL AWARENESS & EDUCATION                                     |
// =============================================================================
const awarenessTemplates = [
  {
    system: `You are an environmental educator who makes complex environmental issues accessible to everyone.`,
    user: `Write an educational article explaining ONE specific environmental issue and its impact (e.g., "Understanding microplastics: How tiny particles are affecting our oceans and health," "The carbon footprint of fast fashion," or "Why biodiversity loss matters more than you think"). Make it engaging and actionable.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a climate science communicator who translates research into practical understanding.`,
    user: `Create an article explaining ONE aspect of climate change in simple terms (e.g., "How greenhouse gases actually work," "The difference between weather and climate," or "Why small temperature increases have big impacts"). Include current examples and data.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an environmental journalist who investigates pressing ecological issues.`,
    user: `Write an investigative piece on ONE current environmental challenge (e.g., "The hidden environmental cost of cryptocurrency mining," "How deforestation affects global weather patterns," or "The truth about recycling: What really happens to your plastic"). Focus on facts and solutions.${COMMON_STRUCTURE}`,
  },
];

// =============================================================================
// | 2. SUSTAINABLE LIVING & PRACTICAL TIPS                                    |
// =============================================================================
const sustainableLivingTemplates = [
  {
    system: `You are a sustainability coach who helps people make practical eco-friendly changes.`,
    user: `Write a practical guide for ONE specific area of sustainable living (e.g., "How to reduce food waste in your kitchen," "A beginner's guide to composting at home," or "Sustainable alternatives to common household products"). Include step-by-step instructions and cost comparisons.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a zero-waste lifestyle expert who believes in gradual, achievable changes.`,
    user: `Create a beginner-friendly guide to reducing waste in ONE specific area (e.g., "How to start a zero-waste bathroom routine," "Reducing plastic in your grocery shopping," or "Sustainable gift-giving ideas that people actually want"). Focus on realistic, budget-friendly options.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an eco-conscious consumer advocate who helps people make informed purchasing decisions.`,
    user: `Write a guide to making sustainable choices in ONE specific product category (e.g., "How to choose truly eco-friendly cleaning products," "Sustainable fashion: Building a capsule wardrobe," or "The real environmental impact of different transportation options"). Include specific brand recommendations and certifications to look for.${COMMON_STRUCTURE}`,
  },
];

// =============================================================================
// | 3. GREEN TECHNOLOGY & INNOVATION                                           |
// =============================================================================
const greenTechTemplates = [
  {
    system: `You are a clean technology enthusiast who tracks the latest environmental innovations.`,
    user: `Write an article about ONE emerging green technology and its potential impact (e.g., "How vertical farming could revolutionize food production," "The promise and challenges of hydrogen fuel cells," or "New battery technologies that could transform renewable energy storage"). Explain the technology simply and discuss real-world applications.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a renewable energy expert who explains complex systems in simple terms.`,
    user: `Create an educational article about ONE type of renewable energy (e.g., "How solar panels actually work and why they're getting cheaper," "The pros and cons of wind energy," or "Geothermal energy: The underground solution to clean power"). Include current costs, efficiency, and future prospects.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a sustainable innovation researcher who identifies game-changing environmental solutions.`,
    user: `Write about ONE innovative solution to an environmental problem (e.g., "How lab-grown meat could reduce agriculture's environmental impact," "Plastic-eating enzymes: A breakthrough in waste management," or "Carbon capture technology: Can we reverse climate change?"). Discuss both the potential and current limitations.${COMMON_STRUCTURE}`,
  },
];

// =============================================================================
// | 4. CONSERVATION & WILDLIFE                                                 |
// =============================================================================
const conservationTemplates = [
  {
    system: `You are a wildlife conservationist who shares stories of both challenges and successes.`,
    user: `Write an article about ONE specific conservation effort or endangered species (e.g., "The remarkable recovery of the gray whale," "How community conservation is saving African elephants," or "The race to save coral reefs from bleaching"). Include what individuals can do to help.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an ecosystem expert who explains the interconnectedness of nature.`,
    user: `Create an article explaining the importance of ONE specific ecosystem and the threats it faces (e.g., "Why wetlands are nature's water filters," "The Amazon rainforest: More than just trees," or "How healthy soil supports all life on Earth"). Make the connections clear and compelling.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a marine biologist who advocates for ocean protection.`,
    user: `Write about ONE aspect of ocean conservation (e.g., "The impact of overfishing on marine ecosystems," "How ocean acidification affects sea life," or "Marine protected areas: Success stories from around the world"). Include actionable steps for readers.${COMMON_STRUCTURE}`,
  },
];

// =============================================================================
// | TEMPLATE SELECTION & EXPORT                                                |
// =============================================================================

const allTemplates = [
  ...awarenessTemplates,
  ...sustainableLivingTemplates,
  ...greenTechTemplates,
  ...conservationTemplates,
];

function pickRandom(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Builds a complete prompt object for the "Environment & Sustainability" category.
 * It randomly selects a template and injects the category name.
 * @returns {{system: string, user: string}} The final prompt object.
 */
export function buildPrompt() {
  const categoryName = 'Environment & Sustainability'; // Hardcoded for this specific file
  const template = pickRandom(allTemplates);

  if (!template) {
    // Return null to trigger fallback in getPrompt function
    return null;
  }

  const finalSystem = template.system.replace(/\{\{CATEGORY\}\}/g, categoryName);
  const finalUser = template.user.replace(/\{\{CATEGORY\}\}/g, categoryName);

  return {
    system: finalSystem,
    user: finalUser,
  };
}

export default { buildPrompt };
