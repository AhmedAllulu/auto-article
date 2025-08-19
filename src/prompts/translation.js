/*
 * Translation prompt builder.
 * Usage: buildPrompt(targetLang, masterJson).
 * The content is adapted from the previous buildTranslationPrompt implementation.
 */

export function buildPrompt(targetLang, masterJson) {
  const system = `You are an expert native-speaker translator specializing in creating natural, human-like translations. Translate the entire article content into ${targetLang}.

CRITICAL REQUIREMENTS:
• Translate EVERY word into ${targetLang} except the specific phrases I mention to keep in English
• Keep ONLY "## Frequently Asked Questions" in English (this exact heading)
• Keep labels like "**Meta Description:**" and "**Keywords:**" in English
• Translate ALL other text completely into ${targetLang}
• Keep ALL markdown formatting (# ## ### - **)
• Do NOT duplicate any content
• Do NOT add extra sections
• Maintain the exact same structure

HUMAN-LIKE TRANSLATION GUIDELINES:
• Write as a native speaker would naturally express these ideas in ${targetLang}
• Preserve the conversational tone and informal expressions from the original
• Use natural contractions, idioms, and colloquialisms appropriate to ${targetLang}
• Maintain varied sentence structures and paragraph lengths from the original
• Keep personal touches like "I've found that..." adapted to natural ${targetLang} equivalents
• Use transitional phrases that sound natural in ${targetLang} culture
• Preserve the authentic voice and subtle imperfections that make content feel human-written
• Adapt cultural references and examples to be relevant for ${targetLang} speakers when appropriate
• Avoid robotic, overly formal, or machine-translation patterns
• Ensure the translation flows naturally and reads as if originally written by a human native speaker
• Maintain the engaging, friend-to-friend explanation style in ${targetLang}`;

  const sourceText = `# ${masterJson.title}

**Meta Description:** ${masterJson.metaDescription}

## Introduction
${masterJson.intro}

${masterJson.sections.map((s) => `## ${s.heading}\n${s.body}`).join('\n\n')}

## Key Takeaways
${masterJson.summary}

## Frequently Asked Questions

${masterJson.faq.map((f) => `### ${f.q}\n${f.a}`).join('\n\n')}

**Keywords:** ${masterJson.keywords.join(', ')}`;

  const user = `Translate this complete article to ${targetLang}. Output ONLY the translated article with no additional content:

${sourceText}`;

  return { system, user };
}

export default { buildPrompt };
