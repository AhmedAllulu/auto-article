/*
 * =============================================================================
 * | PROMPT TEMPLATES: ENVIRONMENT & SUSTAINABILITY                             |
 * =============================================================================
 * | Over 200+ specific, narrow-topic prompts for the 'Environment & Sustainability' category. |
 * | Organised by article type to generate diverse and high-quality content.   |
 * =============================================================================
 */

import { COMMON_STRUCTURE } from './common_structure.js';

// =============================================================================
// | TEMPLATE SELECTION & EXPORT                                                |
// =============================================================================

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function buildPrompt(categoryName) {
  // Placeholder for future templates
  const allTemplates = [];
  
  const tpl = pickRandom(allTemplates);
  const replace = (str) => str.replace(/\{\{CATEGORY\}\}/g, categoryName);
  
  return {
    system: replace(tpl.system),
    user: replace(tpl.user),
  };
}

export default { buildPrompt };
