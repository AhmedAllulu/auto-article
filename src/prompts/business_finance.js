/*
 * Prompt templates for the "Business & Finance" category.
 *
 * This file contains over 50 unique prompt templates designed to generate a wide variety
 * of specific, high-quality articles about business and finance. Each template instructs the AI
 * to choose a narrow sub-topic, ensuring that repeated use of this file still
 * results in unique content.
 *
 * The templates are grouped by article type (e.g., Best-Of, How-To, Comparison)
 * to cover a full range of content needs.
 */

import { COMMON_STRUCTURE } from './common_structure.js';

// --- TEMPLATE GROUP: "Best-Of" (Top Lists / Roundups) ---
const bestOfTemplates = [
  {
    system: `You are a B2B software review specialist who writes unbiased "best of" round-up articles. Write exactly 600-800 words with clear structure and balanced analysis.`,
    user: `Write an article listing the top 5-6 software tools for ONE NARROW business sub-topic (e.g., "best accounting software for freelancers," "best CRM platforms for small e-commerce stores," or "top project management tools for construction companies"). Create a unique title. For each item, include pros/cons and who it's best suited for.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a financial advisor who creates comparison round-ups for consumers. Target exactly 600-800 words with practical insights.`,
    user: `Produce a listicle highlighting the 5 best financial products for ONE specific need (e.g., "best high-yield savings accounts for an emergency fund," "best robo-advisors for beginner investors," or "top business credit cards for travel rewards"). Use an engaging title. Provide key features, fees, and a clear verdict for each.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a marketing expert who identifies the most effective strategies and tools.`,
    user: `Create a ranking of the top 5-7 marketing strategies for ONE specific business goal (e.g., "top social media platforms for reaching Gen Z," "best content marketing strategies for B2B SaaS," or "leading email marketing services for authors"). Use a compelling title like "Ranked: The 7 Best..." and analyze why each strategy is effective.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a small business consultant who helps entrepreneurs make informed decisions.`,
    user: `Write an authoritative guide to the best services for a specific startup need (e.g., "best payroll services for a company's first 10 employees," "best legal services for incorporating a business," or "best business bank accounts with no monthly fees"). Include budget and premium options with updated buying criteria.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a value-focused analyst who finds the best deals for businesses and individuals.`,
    user: `Create a value guide highlighting the best quality-to-price options for ONE specific business expense (e.g., "best value laptops for a remote workforce," "most affordable shipping solutions for small e-commerce," or "best free software for startups"). Use a title like "Maximum Bang for Your Buck:...".${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a specialist curator who identifies emerging business models and investment opportunities.`,
    user: `Write an innovation spotlight on the most promising opportunities in ONE specific business area (e.g., "top franchise opportunities in the wellness industry," "emerging investment trends in renewable energy," or "breakthrough business ideas in the circular economy"). Use a forward-thinking title like "The Next Big Thing:...".${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a human resources expert advising on workplace tools and practices.`,
    user: `Create a "best of" list for a specific HR need (e.g., "best employee recognition platforms," "top remote onboarding tools," or "leading applicant tracking systems (ATS) for small businesses"). Tailor the recommendations to improving company culture and efficiency.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an investment analyst who evaluates different asset classes.`,
    user: `Write a roundup of the top 5 investment types for a specific financial goal (e.g., "best long-term investments for retirement," "top income-generating assets for passive income," or "best low-risk investments for preserving capital"). Focus on risk, potential return, and time horizon.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: "How-To" (Step-by-Step Tutorials) ---
const howToTemplates = [
  {
    system: `You are a business strategist specializing in clear, actionable guides for entrepreneurs.`,
    user: `Write a step-by-step article about ONE SPECIFIC business task (e.g., "how to write a business plan for a coffee shop," "how to register an LLC in your state," or "how to conduct market research for a new product"). Use numbered steps and include a checklist or template.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a personal finance expert who simplifies complex financial processes.`,
    user: `Create a guide for ONE specific financial task (e.g., "how to create your first budget using the 50/30/20 rule," "how to open a Roth IRA," or "how to improve your credit score by 100 points"). Cover common mistakes, tools needed, and expert tips.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a digital marketing instructor who creates detailed learning materials.`,
    user: `Develop a tutorial on ONE narrow aspect of digital marketing (e.g., "how to set up your first Google Ads campaign," "a beginner's guide to SEO for a local business," or "how to create a content calendar for your blog"). Include clear objectives, prerequisites, and examples.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a management consultant providing actionable advice for leaders.`,
    user: `Write a foolproof guide to ONE specific leadership task (e.g., "how to run an effective weekly team meeting," "how to give constructive feedback to an employee," or "how to delegate tasks effectively"). Assume no prior management experience and explain the 'why' behind each step.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a sales expert who helps people improve their sales techniques.`,
    user: `Create an efficiency guide for ONE specific sales workflow (e.g., "how to write a cold email that gets replies," "how to handle common sales objections," or "how to build a sales funnel for an online course"). Focus on proven techniques and provide scripts or templates.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a hands-on instructor who emphasizes practical application in finance.`,
    user: `Develop a practical tutorial on ONE specific investing or analysis task (e.g., "how to read a stock chart for beginners," "how to analyze a company's balance sheet," or "a beginner's guide to buying your first cryptocurrency"). Include definitions and walk through a real example.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a productivity coach for professionals.`,
    user: `Write a step-by-step guide on a specific productivity system (e.g., "how to use the Pomodoro Technique to stop procrastinating," "how to implement the 'Getting Things Done' (GTD) method with a digital app," or "how to plan your week for maximum focus").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a career advisor helping job seekers.`,
    user: `Create a tutorial on a specific job search task (e.g., "how to tailor your resume for a specific job description," "how to prepare for a behavioral interview," or "how to negotiate a higher salary"). Emphasize best practices to stand out from other candidates.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: "Comparison" (Head-to-Head Analysis) ---
const comparisonTemplates = [
  {
    system: `You are a business analyst who specializes in detailed comparisons. Write exactly 600-800 words.`,
    user: `Write a comparison article for ONE SPECIFIC business structure or strategy (e.g., "Sole Proprietorship vs. LLC for freelancers," "In-house marketing vs. hiring an agency," or "Bootstrapping vs. seeking venture capital for a startup"). Compare them across key criteria (cost, liability, control) and provide a clear recommendation.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a financial product evaluator who writes objective showdowns.`,
    user: `Create an objective comparison between two leading financial products in a specific niche (e.g., "Roth IRA vs. Traditional IRA for retirement," "a fixed-rate vs. an adjustable-rate mortgage," or "using a personal loan vs. a 0% APR credit card for debt consolidation"). Include a comparison table and a clear verdict.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a software research specialist helping businesses choose the right tools.`,
    user: `Develop a detailed buyer's comparison guide for ONE specific software choice (e.g., "Google Workspace vs. Microsoft 365 for small businesses," "QuickBooks vs. Xero for accounting," or "Zoom vs. Google Meet for video conferencing"). Include real-world use cases and pricing breakdowns.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an investment strategist who analyzes different investment approaches.`,
    user: `Write an authoritative comparison of two competing investment philosophies (e.g., "Index Fund Investing vs. Active Stock Picking," "Growth Investing vs. Value Investing," or "Real Estate vs. Stock Market for long-term growth"). Explain the underlying principles and provide data-backed arguments.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: "Beginner's Guides" (Introductory Content) ---
const beginnerGuideTemplates = [
  {
    system: `You are an expert educator who specializes in teaching complex business and finance topics to complete beginners.`,
    user: `Write a comprehensive beginner's guide to ONE specific field (e.g., "An Introduction to the Stock Market," "Digital Marketing 101 for Small Business Owners," or "What is Entrepreneurship?"). Assume zero prior knowledge. Include fundamental concepts, essential terminology, and common mistakes to avoid.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a patient teacher who breaks down intimidating subjects into manageable learning modules.`,
    user: `Create a complete beginner's roadmap for learning ONE specific business skill (e.g., "Your First Steps in Learning to Manage a Team," "A Beginner's Roadmap to Financial Literacy," or "Getting Started with E-commerce"). Include a step-by-step learning path and resource recommendations.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a simplification expert who makes complex topics accessible to anyone.`,
    user: `Develop a jargon-free beginner's guide to ONE complex business concept (e.g., "What is SEO, explained with a simple analogy?," "How does a 401(k) work?," or "What is a supply chain?"). Use real-world analogies and simple language.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: "Explainer" Articles ("What is...?" / "Why...") ---
const explainerTemplates = [
  {
    system: `You are a business journalist who excels at explaining the significance of economic trends.`,
    user: `Write a clear, in-depth explainer article on ONE specific business or economic concept (e.g., "What is inflation and how does it affect me?," "Why do stock prices go up and down?," or "What is a recession?"). Cover the definition, its causes, and its impact on the average person.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a researcher who transforms complex topics into accessible, engaging articles.`,
    user: `Create an in-depth exploration of ONE trending business issue (e.g., "The role of corporate social responsibility (CSR)," "What is the 'gig economy'?," or "Explaining intellectual property for creators"). Break down the concept and explain why it matters.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a foundation builder who ensures readers develop strong fundamental understanding.`,
    user: `Write a thorough explainer on a core business principle (e.g., "What is a competitive advantage?," "How does compound interest work?," or "The difference between revenue and profit explained"). Use clear definitions and helpful examples.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: "Trend Analysis" (Future-Focused) ---
const trendAnalysisTemplates = [
  {
    system: `You are a futurist who interprets current signals to predict upcoming business developments. Target 600-800 words.`,
    user: `Write a trend analysis article about ONE specific emerging business trend (e.g., "The rise of the subscription economy," "The future of artificial intelligence in marketing," or "How sustainable business practices are becoming profitable"). Cover the latest developments, key players, and strategic implications.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a market researcher who tracks consumer behavior and industry evolution.`,
    user: `Develop a market trends analysis for ONE specific shift (e.g., "How Gen Z's spending habits are changing retail," "The shift to remote work and its impact on commercial real estate," or "The growing demand for personalized products"). Feature consumer data and growth opportunities.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: In-Depth Reviews & Case Studies ---
const reviewTemplates = [
  {
    system: `You are an unbiased reviewer who provides thorough, honest evaluations of business tools or financial services.`,
    user: `Write a comprehensive, hands-on review of ONE specific, popular business service or software (e.g., "a deep-dive review of Shopify for e-commerce," "an honest review of the American Express Business Platinum card," or "testing the features of Asana for project management"). Cover features, pricing, support, pros, and cons, and provide a final verdict.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a business analyst who documents strategic implementations and their outcomes.`,
    user: `Create an in-depth case study on ONE specific real-world business success or failure (e.g., "Case Study: How a local restaurant used Instagram to triple its sales," "Why a promising startup failed: Lessons learned," or "The marketing strategy behind a successful product launch"). Include actionable takeaways.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Myth-Busting ---
const mythBustingTemplates = [
  {
    system: `You are a fact-checker who specializes in debunking business and finance myths with evidence-based analysis.`,
    user: `Write a comprehensive myth-busting article about ONE specific topic (e.g., "common myths about starting a business," "debunking misconceptions about investing in the stock market," or "7 personal finance myths that are keeping you poor"). Identify 5-7 myths and provide the real truth with data.${COMMON_STRUCTURE}`,
  },
];


// --- COMBINE ALL TEMPLATES INTO ONE MASTER ARRAY ---
const allTemplates = [
  ...bestOfTemplates,
  ...howToTemplates,
  ...comparisonTemplates,
  ...beginnerGuideTemplates,
  ...explainerTemplates,
  ...trendAnalysisTemplates,
  ...reviewTemplates,
  ...mythBustingTemplates,
];

/**
 * Picks a random template from the master list.
 * @returns {object} A randomly selected template object with `system` and `user` properties.
 */
function pickRandomTemplate() {
  return allTemplates[Math.floor(Math.random() * allTemplates.length)];
}

/**
 * Builds a complete prompt object for the "Business & Finance" category.
 * It randomly selects a template and injects the category name.
 * @returns {{system: string, user: string}} The final prompt object.
 */
export function buildPrompt() {
  const categoryName = 'Business & Finance'; // Hardcoded for this specific file
  const template = pickRandomTemplate();
  
  const finalSystem = template.system.replace(/\{\{CATEGORY}}/g, categoryName);
  const finalUser = template.user.replace(/\{\{CATEGORY}}/g, categoryName);
  
  return {
    system: finalSystem,
    user: finalUser,
  };
}

export default { buildPrompt };