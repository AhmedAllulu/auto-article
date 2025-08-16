/*
 * Prompt templates for the "Technology How-Tos" category.
 *
 * This file contains over 40 unique and creative prompt templates designed to generate
 * a wide variety of specific, high-quality, and easy-to-follow tutorials for software,
 * hardware, and online services. Each template instructs the AI to choose a narrow sub-topic,
 * ensuring that repeated use of this file still results in unique and valuable content.
 */

import { COMMON_STRUCTURE } from './common_structure.js';

// --- TEMPLATE GROUP: The Digital Toolkit (Software & Apps) ---
const softwareTemplates = [
  {
    system: `You are a patient and clear technical writer who specializes in creating step-by-step software tutorials for absolute beginners.`,
    user: `Write a complete, step-by-step "How-To" guide on how to perform ONE specific, common task in a popular piece of software (e.g., "how to use pivot tables in Microsoft Excel," "a beginner's guide to using layers in Adobe Photoshop," or "how to create a shared calendar in Google Calendar"). Use numbered steps, clear action verbs (e.g., "Click on...", "Type in..."), and describe what the user should see.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a productivity expert who helps people get the most out of their apps.`,
    user: `Create a guide showcasing 5-7 "hidden" or power-user features for ONE specific, popular app (e.g., "7 hidden features in Spotify you're not using," "a guide to power-user tricks in Notion," or "how to use advanced search operators in Gmail"). Explain how each feature can save time or improve workflow.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a "problem-solver" who writes troubleshooting guides for common software issues.`,
    user: `Write a simple, easy-to-follow troubleshooting guide for ONE specific, common software problem (e.g., "what to do when Microsoft Word crashes and you haven't saved," "how to fix a browser that's running slow," or "why is my app not updating? 5 common fixes").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a cross-platform integration specialist.`,
    user: `Develop a tutorial on how to connect or use TWO different popular services together (e.g., "how to connect your Google Calendar to your Alexa device," "a guide to using Zapier to automate tasks between Trello and Slack," or "how to sync your iPhone contacts with your Google account").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Hardware Helper (Devices & Gadgets) ---
const hardwareTemplates = [
  {
    system: `You are a friendly tech support guru who can walk anyone through a hardware setup or fix.`,
    user: `Write a complete, step-by-step guide on how to set up or perform a basic task on ONE specific piece of hardware (e.g., "how to set up a new wireless printer," "a beginner's guide to installing more RAM in your desktop PC," or "how to properly clean your laptop screen and keyboard"). Include a "What You'll Need" section and clear instructions.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a device optimization expert who helps people make their tech run faster and last longer.`,
    user: `Create a guide with 5-7 practical tips to improve the performance of ONE specific device (e.g., "7 ways to speed up a slow Windows computer," "how to improve the battery life on your Android smartphone," or "a guide to freeing up storage space on your iPhone").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a "get the most out of your gadget" specialist.`,
    user: `Write an article on how to use ONE specific feature on a popular gadget to its full potential (e.g., "how to use your iPhone's camera for professional-looking photos," "a guide to all the things you can do with an Apple Pencil," or "how to use the accessibility features on your smartphone").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a DIY repair advocate for simple fixes.`,
    user: `Develop a very simple, beginner-friendly tutorial for ONE specific, low-risk hardware repair (e.g., "how to replace the batteries in Apple AirTags," "a guide to fixing a sticky key on a keyboard," or "how to safely open a desktop computer to clean out dust"). Emphasize safety and when NOT to attempt a repair.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Privacy & Security Manual ---
const securityTemplates = [
  {
    system: `You are a cybersecurity expert and privacy advocate who provides clear, actionable advice to protect everyday users.`,
    user: `Write a crucial, step-by-step guide on how to enable or use ONE specific digital security feature (e.g., "how to enable two-factor authentication (2FA) on your Google and social media accounts," "a beginner's guide to using a password manager," or "how to check and manage your privacy settings on Facebook"). Explain why this action is so important.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a digital self-defense instructor.`,
    user: `Create a guide on how to spot and avoid ONE specific type of online scam or threat (e.g., "how to recognize a phishing email," "a guide to creating a strong, unhackable password," or "5 signs a website is not safe to use"). Provide clear examples of what to look for.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a data management specialist who helps people control their digital footprint.`,
    user: `Write a tutorial on how to manage your personal data on ONE specific platform (e.g., "how to download a copy of all your data from Google," "a guide to permanently deleting your old social media accounts," or "how to use a VPN to protect your online privacy").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Smart Home Setup ---
const smartHomeTemplates = [
  {
    system: `You are a smart home enthusiast who makes home automation simple and fun.`,
    user: `Write a complete beginner's guide on how to set up ONE specific, popular smart home device (e.g., "how to set up your first Amazon Echo and Alexa," "a guide to installing and using Philips Hue smart lights," or "how to set up a Google Nest thermostat"). Cover the unboxing, app connection, and a few useful first commands or routines.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a home automation creator who loves making devices work together.`,
    user: `Create a tutorial on how to create ONE specific, useful smart home routine or automation (e.g., "how to create a 'Good Morning' routine that turns on your lights and reads the news," "a guide to setting up smart plugs to save energy," or "how to use IFTTT to connect your smart home devices").${COMMON_STRUCTURE}`,
  },
];


// --- COMBINE ALL TEMPLATES INTO ONE MASTER ARRAY ---
const allTemplates = [
  ...softwareTemplates,
  ...hardwareTemplates,
  ...securityTemplates,
  ...smartHomeTemplates,
];

/**
 * Picks a random template from the master list.
 * @returns {object} A randomly selected template object with `system` and `user` properties.
 */
function pickRandomTemplate() {
  // Weight the randomness to favor the most common and urgent user problems
  const finalPool = [
    ...softwareTemplates, ...softwareTemplates, // Higher chance for software help
    ...hardwareTemplates, ...hardwareTemplates, // Higher chance for device help
    ...securityTemplates, ...securityTemplates, // Higher chance for crucial security tips
    ...smartHomeTemplates,
  ];
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

/**
 * Builds a complete prompt object for the "Technology How-Tos" category.
 * It randomly selects a template and injects the category name.
 * @returns {{system: string, user: string}} The final prompt object.
 */
export function buildPrompt() {
  const categoryName = 'Technology How-Tos'; // Hardcoded for this specific file
  const template = pickRandomTemplate();
  
  const finalSystem = template.system.replace(/\{\{CATEGORY}}/g, categoryName);
  const finalUser = template.user.replace(/\{\{CATEGORY}}/g, categoryName);
  
  return {
    system: finalSystem,
    user: finalUser,
  };
}

export default { buildPrompt };