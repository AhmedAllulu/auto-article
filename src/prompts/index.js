// Import category prompt modules
import { buildPrompt as technology } from './technology.js';
import { buildPrompt as business_finance } from './business_finance.js';
import { buildPrompt as health_wellness } from './health_wellness.js';
import { buildPrompt as sports_fitness } from './sports_fitness.js';
import { buildPrompt as entertainment_celebrities } from './entertainment_celebrities.js';
import { buildPrompt as travel_destinations } from './travel_destinations.js';
import { buildPrompt as careers_job_search } from './careers_job_search.js';
import { buildPrompt as food_recipes } from './food_recipes.js';
import { buildPrompt as science_innovation } from './science_innovation.js';
import { buildPrompt as education_learning } from './education_learning.js';
import { buildPrompt as home_garden } from './home_garden.js';
import { buildPrompt as parenting_family } from './parenting_family.js';
import { buildPrompt as lifestyle_hobbies } from './lifestyle_hobbies.js';
import { buildPrompt as arts_culture } from './arts_culture.js';
import { buildPrompt as history_heritage } from './history_heritage.js';
import { buildPrompt as fashion_beauty } from './fashion_beauty.js';
import { buildPrompt as real_estate_property } from './real_estate_property.js';
import { buildPrompt as automotive_vehicles } from './automotive_vehicles.js';
import { buildPrompt as environment_sustainability } from './environment_sustainability.js';
import { buildPrompt as pets_animals } from './pets_animals.js';
import { buildPrompt as diy_crafts } from './diy_crafts.js';
import { buildPrompt as relationships_dating } from './relationships_dating.js';
import { buildPrompt as productivity_self_improvement } from './productivity_self_improvement.js';
import { buildPrompt as politics_current_affairs } from './politics_current_affairs.js';
import { buildPrompt as movies_tv_shows } from './movies_tv_shows.js';
import { buildPrompt as music_performing_arts } from './music_performing_arts.js';
import { buildPrompt as books_literature } from './books_literature.js';
import { buildPrompt as gaming_esports } from './gaming_esports.js';
import { buildPrompt as technology_how_tos } from './technology_how_tos.js';
import { buildPrompt as finance_tips_investments } from './finance_tips_investments.js';

// Map category slug to builder
export const categoryPromptBuilders = {
  'technology': technology,
  'business-finance': business_finance,
  'health-wellness': health_wellness,
  'sports-fitness': sports_fitness,
  'entertainment-celebrities': entertainment_celebrities,
  'travel-destinations': travel_destinations,
  'careers-job-search': careers_job_search,
  'food-recipes': food_recipes,
  'science-innovation': science_innovation,
  'education-learning': education_learning,
  'home-garden': home_garden,
  'parenting-family': parenting_family,
  'lifestyle-hobbies': lifestyle_hobbies,
  'arts-culture': arts_culture,
  'history-heritage': history_heritage,
  'fashion-beauty': fashion_beauty,
  'real-estate-property': real_estate_property,
  'automotive-vehicles': automotive_vehicles,
  'environment-sustainability': environment_sustainability,
  'pets-animals': pets_animals,
  'diy-crafts': diy_crafts,
  'relationships-dating': relationships_dating,
  'productivity-self-improvement': productivity_self_improvement,
  'politics-current-affairs': politics_current_affairs,
  'movies-tv-shows': movies_tv_shows,
  'music-performing-arts': music_performing_arts,
  'books-literature': books_literature,
  'gaming-esports': gaming_esports,
  'technology-how-tos': technology_how_tos,
  'finance-tips-investments': finance_tips_investments,
};

/**
 * Get prompt for a category. Type parameter is kept for backward compat but ignored.
 */
export function getPrompt(_typeIgnored, categoryNameOrSlug) {
  const slug = String(categoryNameOrSlug).trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const builder = categoryPromptBuilders[slug];
  if (!builder) {
    throw new Error(`Unknown category slug: ${slug}`);
  }
  const prompt = builder(categoryNameOrSlug);
  if (!prompt?.system || !prompt?.user) {
    // Fallback to generic technology prompt if category template is empty
    return technology(categoryNameOrSlug);
  }
  return prompt;
}

export { categoryPromptBuilders as promptBuilders };

