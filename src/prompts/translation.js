/*
 * Translation prompt builder.
 * Usage: buildPrompt(targetLang, masterJson).
 * The content is adapted from the previous buildTranslationPrompt implementation.
 */

export function buildPrompt(targetLang, masterJson) {
  const system = `You are an expert translator. Translate the entire article content into ${targetLang}.

CRITICAL REQUIREMENTS:
• Translate EVERY word into ${targetLang} except the specific phrases I mention to keep in English
• Keep ONLY "## Frequently Asked Questions" in English (this exact heading)
• Keep labels like "**Meta Description:**" and "**Keywords:**" in English
• Translate ALL other text completely into ${targetLang}
• Keep ALL markdown formatting (# ## ### - **)
• Do NOT duplicate any content
• Do NOT add extra sections
• Maintain the exact same structure`;

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
