/*
 * Translation prompt builder.
 * Usage: buildPrompt(targetLang, masterJson).
 * The content is adapted from the previous buildTranslationPrompt implementation.
 */

export function buildPrompt(targetLang, masterJson) {
  const system = `You are a professional translator. Translate the article content into ${targetLang} while PRESERVING all markdown markers (#, ##, ###) and specific label phrases enclosed in double asterisks (e.g., "**Meta Description:**", "**Primary Keyword:**", etc.).

QUALITY REQUIREMENTS (VERY IMPORTANT):
• Translate EVERY visible word unless explicitly told to keep it in English (see special rules below).
• Maintain the SAME logical ordering, headings, sub-headings, bullet lists, numbered steps, bold/italic markers, block quotes, code blocks, and all HTML tags/attributes.
• Use clear, formal, and natural style appropriate for a published web guide in ${targetLang}. Avoid literal word-for-word output and awkward phrasing.
• When translating technical concepts, favour common local terminology over transliterated English words whenever possible.
• Preserve punctuation and sentence boundaries to keep paragraph flow intact.

Special rules:
1. The heading line "## Frequently Asked Questions" MUST remain in English so downstream parsers detect the FAQ block.
2. All other heading text SHOULD be translated naturally.
3. Do not add or remove sections and keep line-breaks intact.
4. CRITICAL: Preserve all \n (newline) characters exactly as they appear for proper paragraph spacing.
5. Maintain the paragraph structure and spacing - do not merge paragraphs or remove newlines.
6. KEEP every label wrapped by double asterisks in English, but translate the value that follows it.
7. Translate EVERY FAQ question heading (lines starting with "### ").
`;

  const sourceText = `# ${masterJson.title}

**Meta Description:** ${masterJson.metaDescription}

## Introduction
${masterJson.intro}

${masterJson.sections.map((s) => `## ${s.heading}\n${s.body}`).join('\n\n')}

## Frequently Asked Questions

${masterJson.faq.map((f) => `### ${f.q}\n${f.a}`).join('\n\n')}

## Key Takeaways
${masterJson.summary}

**Keywords:** ${masterJson.keywords.join(', ')}
`;

  const user = `Translate the following markdown article to ${targetLang}.

• KEEP markdown markers (#, ##, ###) exactly where they are.
• KEEP the line "## Frequently Asked Questions" in English.
• KEEP any label wrapped by double asterisks in English.
• Translate all other text naturally and idiomatically.
• Preserve line breaks, lists, and overall structure. Do not add or remove sections.
• CRITICAL: Preserve all \n (newline) characters for proper paragraph spacing.

Begin your output with the existing markdown title line translated.

ARTICLE TO TRANSLATE:

${sourceText}`;

  return { system, user };
}

export default { buildPrompt };
