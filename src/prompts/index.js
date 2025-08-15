import { buildPrompt as howToPrompt } from './how_to.js';
import { buildPrompt as bestOfPrompt } from './best_of.js';
import { buildPrompt as comparePrompt } from './compare.js';
import { buildPrompt as masterPrompt } from './master.js';
import { buildPrompt as caseStudyPrompt } from './case_study.js';
import { buildPrompt as beginnerGuidePrompt } from './beginner_guide.js';
import { buildPrompt as mythBusterPrompt } from './myth_buster.js';
import { buildPrompt as trendsPrompt } from './trends.js';
import { buildPrompt as reviewPrompt } from './review.js';

// If you add new prompt modules, import them here and extend the map below.
const promptBuilders = {
  'how_to': howToPrompt,
  'best_of': bestOfPrompt,
  'compare': comparePrompt,
  'master': masterPrompt,
  'case_study': caseStudyPrompt,
  'beginner_guide': beginnerGuidePrompt,
  'myth_buster': mythBusterPrompt,
  'trends': trendsPrompt,
  'review': reviewPrompt,
};

/**
 * Generic prompt getter. For simple types that only need categoryName.
 */
export function getPrompt(type, categoryName) {
  const builder = promptBuilders[type];
  if (!builder) {
    throw new Error(`Unknown article type: ${type}`);
  }
  return builder(categoryName);
}

/**
 * Expose builders map for advanced use cases (e.g., translation needs custom args).
 */
export { promptBuilders };

