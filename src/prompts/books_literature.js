/*
 * Prompt templates for the "Books & Literature" category.
 *
 * This file contains over 40 unique and creative prompt templates designed to generate
 * a wide variety of specific, high-quality articles for readers, writers, and literary
 * enthusiasts. Each template instructs the AI to choose a narrow sub-topic,
 * ensuring that repeated use of this file still results in unique and inspiring content.
 */

import { COMMON_STRUCTURE } from './common_structure.js';

// --- TEMPLATE GROUP: The Reader's Advisory (Book Recommendations & Lists) ---
const recommendationTemplates = [
  {
    system: `You are a passionate and well-read librarian or bookseller who excels at recommending the perfect book to any reader.`,
    user: `Write a curated reading list of 5-7 books for ONE specific, niche genre or theme (e.g., "7 mind-bending science fiction books you won't be able to put down," "a guide to the best modern gothic novels," or "essential non-fiction books that will change how you see the world"). For each book, provide a short, enticing, spoiler-free summary and explain why it's a must-read.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a "readalike" expert who helps fans of a popular book find their next great read.`,
    user: `Create a listicle of 5 books to read if you loved ONE specific, wildly popular book or series (e.g., "what to read after 'Harry Potter'," "5 books for fans of 'The Hunger Games'," or "if you loved 'Where the Crawdads Sing,' you should read these books"). Explain the similarities in theme, tone, or plot.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a mood-based book curator who believes there's a book for every feeling.`,
    user: `Write a guide to the best books to read for ONE specific mood or situation (e.g., "the best comforting books to read when you're feeling down," "page-turning thrillers to get you out of a reading slump," or "the perfect short books you can read in a single weekend").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a genre gateway specialist who helps readers try something new.`,
    user: `Develop a "Gateway to..." guide for readers who want to get into ONE specific, sometimes intimidating, genre (e.g., "a gateway to reading classic literature: 5 accessible classics to start with," "how to get into fantasy: 5 books that aren't 'Lord of the Rings'," or "a beginner's guide to reading poetry").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Literary Deep Dive (Analysis & Classics) ---
const analysisTemplates = [
  {
    system: `You are an insightful literature professor who makes classic novels feel exciting and relevant to a modern audience.`,
    user: `Write a deep-dive analysis on "Why You Should Read" ONE specific, timeless classic novel (e.g., "why 'Frankenstein' is more than just a monster story," "the enduring relevance of Jane Austen's 'Pride and Prejudice'," or "the powerful lessons in George Orwell's 'Animal Farm'"). Explain its major themes and why it still matters today, without giving away major spoilers.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a character analyst who explores the psychology of literary figures.`,
    user: `Write an in-depth character study of ONE specific, complex, and iconic literary character (e.g., "the tragic heroism of Jay Gatsby," "understanding the complexity of Severus Snape," or "the feminist power of Jane Eyre"). Analyze their motivations, flaws, and what makes them so memorable.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a literary historian who explains the context behind the books.`,
    user: `Create an explainer on ONE specific, influential literary movement (e.g., "what was the Lost Generation? a guide to Hemingway and Fitzgerald," "an introduction to the Beat poets," or "a beginner's guide to the Harlem Renaissance"). List key authors, major works, and defining ideas.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a literary critic who can break down the elements of a story.`,
    user: `Write an article that explains ONE specific literary device or concept using examples from famous books (e.g., "what is an 'unreliable narrator'? 5 great examples in literature," "a guide to understanding symbolism in 'The Great Gatsby'," or "the art of foreshadowing in mystery novels").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Book Lover's Lifestyle ---
const lifestyleTemplates = [
  {
    system: `You are a passionate advocate for the reading life who provides practical tips for fellow bookworms.`,
    user: `Write a practical guide on how to cultivate a richer reading life, focusing on ONE specific habit or activity (e.g., "how to read more books: 7 practical tips for a busy schedule," "a step-by-step guide to starting your own book club," or "how to keep a reading journal to remember what you've read").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a cozy lifestyle curator who loves creating the perfect reading environment.`,
    user: `Create an article with 5-7 tips on how to create the perfect, cozy reading nook in your home (e.g., "essential elements for a cozy reading corner," "the best reading lights for late-night book lovers," or "how to organize your bookshelf for both function and beauty").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a literary travel expert.`,
    user: `Write a guide to ONE specific literary destination (e.g., "a book lover's guide to Paris," "visiting the real-life locations that inspired the Brontë sisters," or "a tour of Shakespeare's London").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Writer's Nook (For Aspiring Writers) ---
const writerTemplates = [
  {
    system: `You are an encouraging and experienced creative writing teacher.`,
    user: `Write a practical guide for aspiring writers on ONE specific, fundamental aspect of the craft of writing (e.g., "how to write compelling characters," "a beginner's guide to 'show, don't tell'," or "5 simple exercises to overcome writer's block"). Provide clear examples and a small, actionable exercise.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a literary agent or editor who can demystify the publishing world.`,
    user: `Create a simple explainer on ONE specific aspect of the publishing industry (e.g., "how to write a query letter that gets an agent's attention," "what's the difference between traditional and self-publishing?," or "a guide to finding a literary agent").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Author Spotlights ---
const authorTemplates = [
  {
    system: `You are a literary biographer who tells the fascinating stories behind the authors.`,
    user: `Write an engaging profile of ONE specific, beloved author, focusing on their life and what inspired their work (e.g., "the adventurous life of Ernest Hemingway," "the quiet genius of Virginia Woolf," or "how J.R.R. Tolkien created Middle-earth"). Connect their personal history to the themes in their books.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a literary journalist who introduces readers to exciting contemporary authors.`,
    user: `Write an article on "Why You Should Be Reading" ONE specific, acclaimed contemporary author (e.g., "why everyone is talking about Sally Rooney," "an introduction to the brilliant sci-fi of N.K. Jemisin," or "the powerful storytelling of Ta-Nehisi Coates"). Introduce their major works and recurring themes.${COMMON_STRUCTURE}`,
  },
];


// --- COMBINE ALL TEMPLATES INTO ONE MASTER ARRAY ---
const allTemplates = [
  ...recommendationTemplates,
  ...analysisTemplates,
  ...lifestyleTemplates,
  ...writerTemplates,
  ...authorTemplates,
];

/**
 * Picks a random template from the master list.
 * @returns {object} A randomly selected template object with `system` and `user` properties.
 */
function pickRandomTemplate() {
  // Weight the randomness to favor book recommendations and literary deep dives
  const finalPool = [
    ...recommendationTemplates, ...recommendationTemplates, ...recommendationTemplates, // Highest chance for book lists
    ...analysisTemplates, ...analysisTemplates, // Higher chance for analysis
    ...lifestyleTemplates,
    ...writerTemplates,
    ...authorTemplates,
  ];
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

/**
 * Builds a complete prompt object for the "Books & Literature" category.
 * It randomly selects a template and injects the category name.
 * @returns {{system: string, user: string}} The final prompt object.
 */
export function buildPrompt() {
  const categoryName = 'Books & Literature'; // Hardcoded for this specific file
  const template = pickRandomTemplate();
  
  const finalSystem = template.system.replace(/\{\{CATEGORY}}/g, categoryName);
  const finalUser = template.user.replace(/\{\{CATEGORY}}/g, categoryName);
  
  return {
    system: finalSystem,
    user: finalUser,
  };
}

export default { buildPrompt };