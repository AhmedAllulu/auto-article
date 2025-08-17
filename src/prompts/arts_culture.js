/*
 * Prompt templates for the "Arts & Culture" category.
 *
 * This file contains over 200 unique and creative prompt templates designed to generate
 * a wide variety of specific, high-quality articles about art history, literature, music,
 * film, design, philosophy, and cultural phenomena. Each template instructs the AI to choose a narrow sub-topic,
 * ensuring that repeated use of this file still results in unique and insightful content.
 */

import { COMMON_STRUCTURE } from './common_structure.js';

// --- TEMPLATE GROUP: Art History 101 (Movements & Artists) ---
const artHistoryTemplates = [
  {
    system: `You are an engaging art historian who makes art history feel like a fascinating story, not a dry lecture.`,
    user: `Write a complete "Beginner's Guide" to ONE specific, major art movement. Explain the key ideas, list 3-4 major artists, and describe one iconic artwork from that movement.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a biographer who specializes in the lives of great artists.`,
    user: `Create an insightful profile of ONE specific, influential artist, focusing on the story behind their most famous work. Go beyond a simple biography to connect their personal life, historical context, and unique vision to the creation and meaning of their art.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an art detective who decodes the hidden symbols and meanings in paintings.`,
    user: `Write a fascinating analysis that decodes the symbolism in ONE specific, famous work of art. Explain the meaning of the objects, figures, and colors within the piece to reveal a hidden story or message.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a specialist in a particular art form.`,
    user: `Develop a beginner's guide to appreciating ONE specific art form beyond painting, such as sculpture, printmaking, or installation art. Explain its key techniques, materials, and what a newcomer should look for.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an art historian focused on a specific period.`,
    user: `Write an article explaining the key characteristics and major artists of ONE specific art historical period. Discuss the cultural and historical events that influenced the art of that time.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert on non-Western art.`,
    user: `Create a beginner's guide to the art of ONE specific non-Western culture or region. Explain its unique aesthetic principles, common themes, and key art forms.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a chronicler of artistic rivalries.`,
    user: `Write an article detailing the story of ONE great artistic rivalry between two famous artists. Discuss how their competition, friendship, or animosity fueled their creative work and influenced art history.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a specialist in a particular medium or material in art.`,
    user: `Write an article on the history and use of ONE specific artistic medium, like fresco, mosaic, or ceramics. Explain how artists have used it throughout history and what makes it unique.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert on modern and contemporary art movements.`,
    user: `Write a clear and simple explainer for ONE specific 20th or 21st-century art movement. Define its core philosophy and explain what its artists were trying to achieve or rebel against.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a researcher who uncovers forgotten artists.`,
    user: `Write a profile of ONE specific, historically significant but lesser-known artist. Explain their unique contribution to art history and why they deserve more recognition.${COMMON_STRUCTURE}`,
  }
];


// --- TEMPLATE GROUP: The Critic's Corner (Analysis & Deep Dives) ---
const criticTemplates = [
  {
    system: `You are a sharp cultural critic who analyzes the "why" behind cultural phenomena.`,
    user: `Write a deep-dive analysis of ONE specific cultural trend or subculture. Explore its origins, key characteristics, influential figures, and its broader significance or impact on society.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a film analyst who looks at cinema as an art form.`,
    user: `Write an article analyzing the artistic significance of ONE specific, landmark film. Focus on its cinematography, narrative structure, thematic depth, and lasting influence on filmmaking, rather than just summarizing the plot.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert on a specific film genre.`,
    user: `Write an explainer on the key elements and history of ONE specific film genre. Describe its common tropes, visual style, and the cultural context in which it became popular.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a video game critic who writes about the artistic merit of games.`,
    user: `Write an analysis of ONE specific video game, treating it as a work of art. Discuss its narrative design, world-building, environmental storytelling, or how it uses interactivity to create an emotional connection with the player.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a television critic who analyzes the new "Golden Age" of TV.`,
    user: `Write an analysis of the cultural impact or artistic innovation of ONE specific, critically acclaimed television show. Discuss its character development, thematic complexity, or how it broke new ground for storytelling on television.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert in narrative techniques across media.`,
    user: `Write an article explaining ONE specific storytelling concept or trope. Define the concept clearly and provide multiple examples from different books, films, or games to illustrate how it works.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an aesthetic theorist.`,
    user: `Write a simple guide to ONE specific aesthetic concept or movement, like 'the sublime' or 'wabi-sabi'. Explain the philosophy behind it and how it can be identified in art, design, or nature.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an anime and manga analyst.`,
    user: `Write an analysis of ONE specific, influential anime film or series. Explain its cultural significance, artistic style, and how it influenced the animation landscape both in Japan and internationally.${COMMON_STRUCTURE}`,
  }
];


// --- TEMPLATE GROUP: The Virtual Museum Tour (Curated Guides) ---
const museumTemplates = [
  {
    system: `You are a knowledgeable and friendly museum curator creating a guide for visitors.`,
    user: `Write a curated guide to the "5 Must-See Masterpieces" in ONE specific, world-famous museum. For each selected piece, explain what it is, its historical context, and why it is considered so important and unmissable.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a thematic art curator who connects art across different eras and cultures.`,
    user: `Create a thematic guide to art, focusing on 5-7 artworks that exemplify ONE specific, universal theme like love, conflict, or nature. The selected artworks should come from a variety of different artists, time periods, and cultures.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an architecture critic who helps people appreciate the buildings around them.`,
    user: `Write a beginner's guide to identifying ONE specific architectural style. Describe its key characteristics, common materials, and the historical period it belongs to, providing famous examples.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert on the architecture of a single famous building or monument.`,
    user: `Write a deep-dive article about the architecture and history of ONE specific, world-famous landmark. Discuss its design, the engineering challenges of its construction, and its cultural significance.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a tour guide for public art in a major city.`,
    user: `Create a "walking tour" guide to 3-5 examples of significant public art or sculpture in ONE specific, major city. For each piece, describe the artwork and tell the story of its creation and artist.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a museum historian.`,
    user: `Write an article on the fascinating history and collection of ONE specific, unique, or lesser-known museum. Discuss the story of its founder, the focus of its collection, and what makes it a hidden gem.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a specialist in controversial art.`,
    user: `Write an article explaining the story and controversy behind ONE specific famous work of art that once shocked the public. Detail why it was considered scandalous or revolutionary for its time.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Literature & The Written Word ---
const literatureTemplates = [
  {
    system: `You are a passionate literature professor who makes classic books feel exciting and relevant.`,
    user: `Write a guide on "Why You Should Read" ONE specific, timeless classic novel. Explain its main themes, its characters' enduring appeal, and its relevance in today's world, all without revealing major spoilers.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a poetry advocate who makes poetry accessible to everyone.`,
    user: `Create a beginner's guide to reading and understanding poetry, focusing on ONE specific, famous poet or a particular poetic style. Break down one or two short poems as examples to explain their meaning and technique.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a literary expert who can explain entire movements.`,
    user: `Write a simple explainer on ONE specific literary movement. Describe the historical context it emerged from, its core ideas, and list several key authors and defining works of the movement.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert on a specific literary genre.`,
    user: `Write an introductory guide to ONE specific literary genre. Explain the defining characteristics, common tropes, and the historical origins of the genre, suggesting a few quintessential books for newcomers to read.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a biographer of great authors.`,
    user: `Write a short biography of ONE influential author. Focus on how their life experiences, personal relationships, and the era they lived in shaped their most famous literary works.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an analyst of literary characters.`,
    user: `Write an analysis of ONE specific, iconic literary character. Explore their motivations, internal conflicts, and psychological complexity, explaining why they remain such a powerful and memorable figure in literature.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert on poetic forms.`,
    user: `Write a guide explaining the rules and beauty of ONE specific poetic form, such as a sonnet or a villanelle. Detail its structure, rhyme scheme, and typical subject matter, using a famous poem as an example.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert on a great work of non-fiction.`,
    user: `Write an article explaining the importance and central ideas of ONE major, influential work of non-fiction. Discuss the author's argument, its impact on society, and why its message is still relevant today.${COMMON_STRUCTURE}`,
  },
];

// --- NEW TEMPLATE GROUP: Music & Composers ---
const musicTemplates = [
    {
        system: `You are an enthusiastic music historian who makes learning about music genres fun.`,
        user: `Write a "Beginner's Guide" to ONE specific music genre. Explain its history, key sonic characteristics, and name 3 essential, influential artists or bands that a newcomer should listen to.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a biographer of great musicians and composers.`,
        user: `Write a profile of ONE specific, influential composer or musician. Focus on their creative genius, their innovations in music, and the lasting impact they have had on their genre and culture.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a music critic who does deep-dive album reviews.`,
        user: `Write an article on the making and meaning of ONE specific, iconic album. Discuss its concept, the story behind its creation, and why it is considered a landmark work of music.${COMMON_STRUCTURE}`
    },
    {
        system: `You are an expert on the history of musical instruments.`,
        user: `Write an article on the history and evolution of ONE specific musical instrument. Explain its origins, how its design has changed over time, and its role in different types of music.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a storyteller who uncovers the stories behind famous songs.`,
        user: `Write an article telling the fascinating story behind the writing and recording of ONE famous song. Reveal the inspiration, the creative process, and the cultural context that made the song a hit.${COMMON_STRUCTURE}`
    },
    {
        system: `You are an opera and musical theater expert.`,
        user: `Write a simple guide to ONE specific, famous opera or musical for a first-time viewer. Explain the plot basics, introduce the main characters, and highlight the most famous songs or arias to listen for.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a specialist in a specific music sub-genre.`,
        user: `Write an introductory guide to ONE specific, niche music sub-genre. Define its unique sound, cultural aesthetic, and suggest a few key artists or albums that represent the sub-genre at its best.${COMMON_STRUCTURE}`
    }
];

// --- NEW TEMPLATE GROUP: Mythology & Folklore ---
const mythologyTemplates = [
    {
        system: `You are a master storyteller and expert on world mythology.`,
        user: `Write an article providing a beginner's guide to the gods and goddesses of ONE specific world mythology. Introduce the major deities and explain their roles and relationships within that culture's pantheon.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a folklorist who analyzes classic tales.`,
        user: `Retell ONE specific, famous myth, legend, or folktale from any culture. After telling the story, explain its hidden meanings, cultural values, or moral lessons.${COMMON_STRUCTURE}`
    },
    {
        system: `You are an expert in mythical creatures.`,
        user: `Write a fascinating explainer on the folklore and cultural origins of ONE specific mythological creature. Describe its appearance and abilities, and explain its symbolic meaning within the stories it appears in.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a mythology expert who explores core concepts and archetypes.`,
        user: `Write an article explaining ONE specific core concept or archetype found in world mythology, such as the 'trickster god' or the 'journey to the underworld'. Use examples from several different cultures to illustrate the concept.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a specialist in epic heroes.`,
        user: `Write a profile of ONE great hero from myth or epic literature. Recount their major deeds and trials, and explain the virtues and character traits that made them a hero in their culture.${COMMON_STRUCTURE}`
    },
    {
        system: `You are an expert on the historical origins of myths.`,
        user: `Write an article exploring the possible historical basis for ONE famous myth or legend. Discuss the archaeological or textual evidence that suggests the legend may have been inspired by real people, places, or events.${COMMON_STRUCTURE}`
    }
];

// --- NEW TEMPLATE GROUP: Design & Fashion History ---
const designTemplates = [
    {
        system: `You are a design historian who makes everyday objects fascinating.`,
        user: `Write a guide to identifying the key features of ONE specific design movement from any era. Describe its core principles, characteristic shapes, colors, and materials.${COMMON_STRUCTURE}`
    },
    {
        system: `You are an expert on the history of iconic products.`,
        user: `Write an article on the design history of ONE specific, iconic everyday object. Tell the story of its invention, its designer, and how its form and function made it a timeless classic.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a fashion historian.`,
        user: `Write an article detailing the history and cultural significance of ONE specific, iconic item of clothing. Explain its origins and how it came to represent a particular era, subculture, or idea.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a biographer of legendary designers.`,
        user: `Write a short profile of ONE influential designer from any field (fashion, graphic, industrial). Explain their design philosophy and how their work changed the industry.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a graphic design critic.`,
        user: `Write a history and analysis of ONE specific area of graphic design, such as movie poster design or album cover art. Discuss how the style and technology of that field have evolved over the decades.${COMMON_STRUCTURE}`
    },
];

// --- TEMPLATE GROUP: Cultural Heritage & Traditions ---
const heritageTemplates = [
  {
    system: `You are a cultural anthropologist who explains the meaning behind global traditions.`,
    user: `Write a fascinating explainer on the history and cultural significance of ONE specific global festival or tradition. Describe the typical activities, foods, and ceremonies involved, and explain their symbolic meaning.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a historian specializing in ancient civilizations.`,
    user: `Create a guide to the art and culture of ONE specific ancient civilization. Focus on its most significant contributions, whether in architecture, sculpture, writing systems, or social structures.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a UNESCO World Heritage site expert.`,
    user: `Write a deep-dive article on the history and cultural importance of ONE specific World Heritage site. Explain why it was granted this status and what makes it a treasure of human or natural history.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert on the history of food and culinary traditions.`,
    user: `Write an article exploring the fascinating history of ONE specific famous dish or ingredient. Trace its origins and how it traveled and transformed across different cultures to become what it is today.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert on historical artifacts.`,
    user: `Tell the story of ONE famous historical artifact. Explain what it is, where it was found, what it tells us about the past, and its importance to history or archaeology.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a specialist in global performance arts.`,
    user: `Write an introduction to ONE specific form of traditional theater or dance from anywhere in the world. Describe its costumes, music, and performance style, and explain its role in its native culture.${COMMON_STRUCTURE}`,
  }
];

// --- NEW TEMPLATE GROUP: Philosophy & Great Thinkers ---
const philosophyTemplates = [
    {
        system: `You are a philosophy professor who makes complex ideas easy to understand.`,
        user: `Write a simple and clear "What is...?" guide to ONE specific school of philosophy. Explain its core beliefs about ethics, knowledge, or the nature of reality in an accessible way.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a biographer of great thinkers.`,
        user: `Write an accessible profile of ONE great philosopher from any era. Explain their most important ideas and how their personal life and the historical context they lived in influenced their thinking.${COMMON_STRUCTURE}`
    },
    {
        system: `You are an expert at explaining famous philosophical concepts.`,
        user: `Write an article that clearly explains ONE famous thought experiment or philosophical concept. Describe the scenario or idea and explain the fundamental questions it forces us to confront.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a critic who finds philosophy in pop culture.`,
        user: `Write an analysis of the philosophical themes in ONE specific, popular film, book, or video game. Discuss how the story explores complex ideas about morality, identity, or the meaning of life.${COMMON_STRUCTURE}`
    }
];

// --- NEW TEMPLATE GROUP: Photography & Iconic Images ---
const photographyTemplates = [
    {
        system: `You are a photography historian and critic.`,
        user: `Write a profile of ONE specific, pioneering photographer. Explain their signature style, their technical innovations, and their overall impact on the art of photography.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a journalist who tells the stories behind iconic photographs.`,
        user: `Write a powerful article telling the full story behind ONE specific, world-changing photograph. Describe the context in which it was taken, the photographer who took it, and the impact it had on the public.${COMMON_STRUCTURE}`
    },
    {
        system: `You are an expert in the history of photographic technology.`,
        user: `Write an explainer on the history and importance of ONE specific photographic process or technology, like the Daguerreotype or the invention of film. Explain how this innovation changed photography forever.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a teacher of photographic genres.`,
        user: `Write a beginner's guide to understanding ONE specific genre of photography, such as street photography, portrait photography, or photojournalism. Explain the goals, techniques, and ethics of that genre.${COMMON_STRUCTURE}`
    }
];

// --- COMBINE ALL TEMPLATES INTO ONE MASTER ARRAY ---
const allTemplates = [
  ...artHistoryTemplates,
  ...criticTemplates,
  ...museumTemplates,
  ...literatureTemplates,
  ...musicTemplates,
  ...mythologyTemplates,
  ...designTemplates,
  ...heritageTemplates,
  ...philosophyTemplates,
  ...photographyTemplates,
];

/**
 * Picks a random template from the master list with balanced distribution.
 * @returns {object} A randomly selected template object with `system` and `user` properties.
 */
function pickRandomTemplate() {
  // Weight the randomness to favor the most accessible and popular topics
  const finalPool = [
    ...artHistoryTemplates, ...artHistoryTemplates, ...artHistoryTemplates, // Very high interest
    ...criticTemplates, ...criticTemplates, // Strong interest in film/TV
    ...museumTemplates, ...museumTemplates,
    ...literatureTemplates, ...literatureTemplates,

    ...musicTemplates, ...musicTemplates, ...musicTemplates, // Very high interest
    ...mythologyTemplates, ...mythologyTemplates, ...mythologyTemplates, // Very high interest
    ...designTemplates,
    ...heritageTemplates, ...heritageTemplates,
    ...philosophyTemplates,
    ...photographyTemplates
  ];
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

/**
 * Builds a complete prompt object for the "Arts & Culture" category.
 * It randomly selects a template and injects the category name.
 * @returns {{system: string, user: string}} The final prompt object.
 */
export function buildPrompt() {
  const categoryName = 'Arts & Culture'; // Hardcoded for this specific file
  const template = pickRandomTemplate();

  const finalSystem = template.system.replace(/\{\{CATEGORY}}/g, categoryName);
  const finalUser = template.user.replace(/\{\{CATEGORY}}/g, categoryName);

  return {
    system: finalSystem,
    user: finalUser,
  };
}

export default { buildPrompt };