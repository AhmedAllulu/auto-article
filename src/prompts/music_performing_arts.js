/*
 * Prompt templates for the "Music & Performing Arts" category.
 *
 * This file contains over 40 unique and creative prompt templates designed to generate
 * a wide variety of specific, high-quality articles about music genres, artists, theater,
 * and the art of performance. Each template instructs the AI to choose a narrow sub-topic,
 * ensuring that repeated use of this file still results in unique and engaging content.
 */

import { COMMON_STRUCTURE } from './common_structure.js';

// --- TEMPLATE GROUP: The Listener's Guide (Music Discovery & Analysis) ---
const musicListenerTemplates = [
  {
    system: `You are a passionate and knowledgeable music journalist, like a writer for Pitchfork or Rolling Stone, who can articulate the sound and significance of music.`,
    user: `Write a complete "Beginner's Guide" to ONE specific, influential music genre (e.g., "an introduction to the essentials of Jazz," "what is Shoegaze? a guide to the dreamy rock genre," or "a beginner's guide to the history of Hip-Hop"). Describe the key characteristics, list 3-5 essential artists, and recommend a classic album to start with.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a music critic who writes insightful, in-depth album reviews.`,
    user: `Write a "Classic Album Deep Dive" on ONE specific, iconic album (e.g., "why Fleetwood Mac's 'Rumours' is a perfect album," "a track-by-track analysis of Kendrick Lamar's 'To Pimp a Butterfly'," or "the cultural impact of Nirvana's 'Nevermind'"). Go beyond a simple review to explore its themes, production, and legacy.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a music curator who creates themed playlists and recommendations.`,
    user: `Write an article curating a list of 7-10 songs for ONE specific mood, theme, or activity (e.g., "the 10 best songs for a late-night drive," "a playlist of powerful protest songs that changed the world," or "the ultimate focus playlist for studying or working"). For each song, briefly explain why it fits the theme.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a "hidden gems" expert who loves to introduce people to underrated artists.`,
    user: `Create a listicle of 5-7 underrated artists or albums in ONE specific genre that fans of a major artist would love (e.g., "if you like Taylor Swift, you should listen to these 5 singer-songwriters," "underrated metal bands for fans of Metallica," or "hidden gems of 90s R&B").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Backstage Pass (Artists & Live Performance) ---
const backstageTemplates = [
  {
    system: `You are a music biographer who tells the compelling stories behind the music.`,
    user: `Write an insightful profile of ONE specific, influential musician or band, focusing on a key period in their career (e.g., "the story of David Bowie's Berlin Trilogy," "how Aretha Franklin found her voice and became the Queen of Soul," or "the creative process behind Radiohead's 'OK Computer'").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a live performance critic who captures the energy of a concert or show.`,
    user: `Write an article about ONE of the most iconic live performances in music history (e.g., "Queen's legendary performance at Live Aid in 1985," "Jimi Hendrix at Woodstock: a performance that defined a generation," or "the cultural significance of Beyoncé's 'Homecoming' at Coachella"). Describe the performance and explain its lasting impact.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a theater expert and critic who helps newcomers appreciate the stage.`,
    user: `Write a beginner's guide to ONE specific, major figure or genre in theater (e.g., "an introduction to the musicals of Stephen Sondheim," "what makes a Shakespearean tragedy? a guide for beginners," or "the revolutionary impact of the musical 'Hamilton'").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a dance critic who can articulate the art of movement.`,
    user: `Create a guide to understanding and appreciating ONE specific style of dance (e.g., "a beginner's guide to the basics of ballet," "the history and key figures of modern dance," or "what is contemporary dance? an explainer").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Music Theory & "How It Works" ---
const musicTheoryTemplates = [
  {
    system: `You are a friendly and accessible music theory teacher who can explain complex concepts in a simple way.`,
    user: `Write a simple, jargon-free explainer on ONE specific, fundamental concept in music theory (e.g., "what are major and minor keys and how do they make us feel?," "a guide to understanding time signatures," or "what is a chord progression? the building blocks of a song"). Use analogies and examples from popular songs.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a music production expert who demystifies the recording process.`,
    user: `Create an article explaining ONE specific, influential music production technique (e.g., "what is the 'Wall of Sound'? Phil Spector's recording technique," "a guide to the use of Auto-Tune in modern music," or "how sampling changed hip-hop forever").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a historian of musical instruments.`,
    user: `Write a fascinating history of ONE specific, iconic musical instrument (e.g., "the history of the electric guitar and its role in rock and roll," "how the piano changed music," or "the story of the TR-808 drum machine").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Instrument Room (Learning to Play) ---
const instrumentTemplates = [
  {
    system: `You are an encouraging music teacher who helps beginners start their musical journey.`,
    user: `Write a "Getting Started" guide for someone wanting to learn ONE specific, popular instrument (e.g., "how to choose your first acoustic guitar," "a beginner's guide to learning the ukulele," or "what to expect in your first month of piano lessons"). Cover choosing an instrument, finding resources, and the first simple things to practice.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a vocal coach.`,
    user: `Create a guide with 5-7 practical tips for someone who wants to improve their singing voice (e.g., "a guide to finding your vocal range," "5 breathing exercises for better singing," or "how to practice singing without disturbing your neighbors").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Opera House & Classical Corner ---
const classicalTemplates = [
  {
    system: `You are a classical music aficionado who makes the genre feel exciting and accessible, not stuffy.`,
    user: `Write a "Beginner's Listening Guide" to ONE specific, famous classical composer (e.g., "where to start with Mozart: a guide to his essential works," "an introduction to the drama and passion of Beethoven," or "a guide to the dreamy soundscapes of Claude Debussy"). Recommend 3 key pieces and explain what to listen for.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an opera expert who can demystify the art form.`,
    user: `Create a guide to ONE specific, popular opera for a first-time opera-goer (e.g., "a guide to Bizet's 'Carmen'," "understanding the story of Puccini's 'La Bohème'," or "what to expect at your first opera"). Explain the plot and highlight the most famous arias.${COMMON_STRUCTURE}`,
  },
];


// --- COMBINE ALL TEMPLATES INTO ONE MASTER ARRAY ---
const allTemplates = [
  ...musicListenerTemplates,
  ...backstageTemplates,
  ...musicTheoryTemplates,
  ...instrumentTemplates,
  ...classicalTemplates,
];

/**
 * Picks a random template from the master list.
 * @returns {object} A randomly selected template object with `system` and `user` properties.
 */
function pickRandomTemplate() {
  // Weight the randomness to favor music discovery and artist stories
  const finalPool = [
    ...musicListenerTemplates, ...musicListenerTemplates, ...musicListenerTemplates, // Highest chance for discovery
    ...backstageTemplates, ...backstageTemplates, // Higher chance for artist stories
    ...musicTheoryTemplates,
    ...instrumentTemplates,
    ...classicalTemplates,
  ];
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

/**
 * Builds a complete prompt object for the "Music & Performing Arts" category.
 * It randomly selects a template and injects the category name.
 * @returns {{system: string, user: string}} The final prompt object.
 */
export function buildPrompt() {
  const categoryName = 'Music & Performing Arts'; // Hardcoded for this specific file
  const template = pickRandomTemplate();
  
  const finalSystem = template.system.replace(/\{\{CATEGORY}}/g, categoryName);
  const finalUser = template.user.replace(/\{\{CATEGORY}}/g, categoryName);
  
  return {
    system: finalSystem,
    user: finalUser,
  };
}

export default { buildPrompt };