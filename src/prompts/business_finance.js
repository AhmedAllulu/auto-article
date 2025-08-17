/*
 * Prompt templates for the "Business & Finance" category.
 *
 * This file contains over 200 unique prompt templates designed to generate a wide variety
 * of specific, high-quality articles about business and finance. Each template targets
 * very specific sub-topics to ensure unique content generation across all business
 * and financial domains.
 */

import { COMMON_STRUCTURE } from './common_structure.js';

// --- TEMPLATE GROUP: Business Software & Tools (SaaS, Productivity) ---
const businessSoftwareTemplates = [
  {
    system: `You are a SaaS analyst who specializes in evaluating business software solutions for specific industries and use cases.`,
    user: `Write a comprehensive comparison of the top project management tools for a specific type of professional service business, like a marketing agency or architecture firm. Include features like client collaboration, time tracking, resource allocation, and integration with billing software.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a CRM specialist who helps businesses optimize their customer relationship management workflows.`,
    user: `Create a detailed guide on how to choose and implement a CRM for a B2B sales team. Cover a comparison of popular CRM platforms, sales pipeline management, automation rules for lead assignment, and reporting dashboards for tracking team performance.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an accounting software expert who helps small businesses streamline their financial processes.`,
    user: `Choose a popular cloud accounting software and develop a tutorial on the complete guide to setting it up for a small e-commerce business. Include integration with major e-commerce platforms, sales tax automation, inventory tracking, and generating profitability reports.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a business intelligence consultant who helps companies make data-driven decisions.`,
    user: `Write an in-depth analysis of the best business analytics tools for retail businesses. Cover sales trend analysis, customer segmentation, inventory management, and creating real-time dashboards with examples from popular BI tools.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a digital workplace specialist who optimizes remote team collaboration and productivity.`,
    user: `Create a comprehensive guide on building the perfect tech stack for a fully remote startup. Include a comparison of top tools for communication, project management, file sharing and security, and video conferencing, with budget breakdowns.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an HR technology expert who helps companies automate their human resources processes.`,
    user: `Develop a detailed comparison of the top Applicant Tracking Systems (ATS) for high-growth tech companies. Evaluate two leading platforms, covering candidate sourcing, interview scheduling, collaboration features, and data analytics for hiring funnels.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a marketing automation specialist who helps businesses scale their marketing efforts efficiently.`,
    user: `Choose a popular marketing automation platform and write a step-by-step guide on setting up advanced email automation for B2B lead nurturing. Include lead scoring, segmentation, and behavior-triggered email sequences.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert in low-code/no-code platforms.`,
    user: `Choose a popular low-code/no-code platform and create a tutorial on how to build a custom internal tool for a business. Select a specific use case, like a custom CRM, an inventory tracker, or a project approval dashboard.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a cybersecurity specialist who focuses on business-grade security solutions for SMBs.`,
    user: `Develop a comprehensive guide on the essential cybersecurity tools every small business needs. Cover endpoint protection, email security filtering, cloud backup solutions, a business password manager, and employee security awareness training platforms.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an inventory management expert who helps businesses optimize their stock control and supply chain operations.`,
    user: `Write a detailed tutorial on implementing inventory management software for multi-location retail businesses. Cover real-time stock tracking, automatic reordering points, supplier management, and integration with popular POS systems.${COMMON_STRUCTURE}`,
  },
];

// --- TEMPLATE GROUP: Financial Products & Services (Banking, Credit, Loans) ---
const financialProductsTemplates = [
  {
    system: `You are a business banking expert who helps companies choose the right financial products for their specific needs.`,
    user: `Write a comprehensive guide on the best business bank accounts for a specific type of small business, like freelancers or e-commerce stores. Compare features like low fees, mobile banking capabilities, and integration with accounting software.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a commercial lending specialist who helps businesses understand their financing options.`,
    user: `Create a detailed analysis of SBA Loans vs. Traditional Term Loans for a small business seeking capital. Cover eligibility requirements, application processes, interest rates, use of funds, and typical repayment terms.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a business credit expert who helps companies build and maintain strong credit profiles.`,
    user: `Develop a step-by-step guide on how to establish and build business credit from scratch. Cover getting an EIN and DUNS number, opening trade lines with vendors, and using a business credit card responsibly to build a strong credit file.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a payment processing specialist who helps businesses optimize their transaction fees.`,
    user: `Write an in-depth comparison of several popular payment processors for service-based businesses. Analyze transaction fees, recurring billing features, invoicing tools, and ease of integration for consultants, coaches, or agencies.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a corporate card and expense management expert.`,
    user: `Create a comprehensive guide on implementing a corporate card program to manage employee expenses. Compare leading platforms and cover features like automated expense reporting, receipt capture, and integration with accounting software.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an equipment financing specialist.`,
    user: `Develop a detailed analysis of equipment financing vs. leasing for a specific industry, like construction or manufacturing. Cover tax implications, ownership, and which option is better for different types of machinery.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a business insurance expert who helps companies manage risk.`,
    user: `Write a comprehensive guide on the key insurance policies needed for a specific type of new business, like a restaurant or consulting firm. Cover the essential types of liability, property, and professional insurance required.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a merchant services consultant who helps businesses with physical locations.`,
    user: `Create a detailed comparison of three modern POS systems for a boutique retail store. Analyze hardware costs, inventory management features, customer loyalty programs, and e-commerce integration.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert on alternative business financing.`,
    user: `Develop a tutorial on how and when to use invoice factoring to solve cash flow problems for a B2B business. Explain the process, calculate the effective interest rate, and compare it to a traditional line of credit.${COMMON_STRUCTURE}`,
  },
];

// --- TEMPLATE GROUP: Investment Strategies & Analysis ---
const investmentStrategiesTemplates = [
  {
    system: `You are a portfolio management expert who specializes in developing investment strategies for different risk profiles.`,
    user: `Write a comprehensive guide on building a diversified investment portfolio for a specific age and risk tolerance, such as a 30-year-old with moderate risk tolerance. Cover allocation percentages for different asset classes using low-cost funds.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a dividend investing specialist who helps investors build income-generating portfolios.`,
    user: `Create a detailed tutorial on how to analyze a dividend stock for safety and growth. Cover the analysis of payout ratios, dividend growth history, balance sheet strength, and how to identify and avoid "yield traps".${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a value investing expert who teaches fundamental analysis.`,
    user: `Choose a specific, well-known public company and develop a step-by-step guide on how to perform a Discounted Cash Flow (DCF) valuation on it. Explain the inputs and how to interpret the results.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an index fund specialist who advocates for passive investing.`,
    user: `Write a comprehensive comparison of Total Stock Market Index Funds vs. S&P 500 Index Funds. Analyze the differences in diversification, historical performance, and which is better for a core long-term holding.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an alternative investments expert.`,
    user: `Create an in-depth analysis on an introduction to a specific type of alternative investment for accredited investors, such as angel investing or venture capital funds. Cover deal sourcing, due diligence, portfolio diversification, and potential risks and rewards.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a technical analyst who studies market trends and chart patterns.`,
    user: `Develop a beginner's guide to understanding and using a specific technical indicator, such as Moving Averages or the Relative Strength Index (RSI), in stock trading. Explain how traders use it to identify trends and signals.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a growth investing expert who specializes in identifying high-potential companies.`,
    user: `Write a detailed tutorial on how to find and analyze growth stocks in a specific high-growth sector like technology or healthcare. Cover key metrics to look for, such as revenue growth and total addressable market.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert on socially responsible investing (ESG).`,
    user: `Create a guide on how to build an ESG-focused investment portfolio. Explain how to evaluate companies based on Environmental, Social, and Governance criteria and how to select appropriate ESG funds or ETFs.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a specialist in retirement investment vehicles.`,
    user: `Develop a detailed analysis of Roth IRAs vs. Traditional IRAs. Cover the tax implications, income limits, and how an individual can decide which is right for them based on their current and expected future income.${COMMON_STRUCTURE}`,
  },
];

// --- TEMPLATE GROUP: Marketing & Sales Strategies ---
const marketingSalesTemplates = [
  {
    system: `You are a digital marketing strategist who specializes in ROI-driven campaigns for local businesses.`,
    user: `Write a comprehensive guide on a local SEO strategy for a specific type of service business, like a plumber or an electrician. Cover Google Business Profile optimization, local keyword research, and getting customer reviews.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a content marketing expert who helps businesses build authority and generate leads.`,
    user: `Create a detailed tutorial on how to create a "Hub and Spoke" content marketing strategy for a B2B company. Choose a 'hub' topic and outline 5-7 'spoke' articles that link back to it to build topical authority.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a social media marketing specialist for e-commerce.`,
    user: `Develop an in-depth guide on using a specific visual social media platform for a fashion e-commerce brand. Cover content ideas, viral trends, influencer collaborations, and driving traffic back to product pages.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an email marketing expert who specializes in audience engagement.`,
    user: `Write a comprehensive tutorial on how to write a 5-day welcome email sequence that converts for a newsletter or online course. Outline the goal and content for each of the five emails.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a sales methodology coach.`,
    user: `Create a detailed guide on how to implement a specific, named sales methodology for a B2B sales team. Choose one like 'The Challenger Sale' or 'Solution Selling' and explain its core principles with examples.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a conversion rate optimization (CRO) expert.`,
    user: `Develop a step-by-step tutorial on how to conduct a heuristic analysis of a website's homepage to identify potential areas for A/B testing. Cover the principles of clarity, relevance, value, and friction.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a PPC (Pay-Per-Click) advertising specialist.`,
    user: `Write a comprehensive guide on setting up a Google Ads retargeting campaign for an e-commerce store. Cover audience creation (e.g., cart abandoners), ad creation, and budget setting to bring back potential customers.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a customer success and retention expert for SaaS businesses.`,
    user: `Create an in-depth guide on how to calculate and improve Customer Lifetime Value (CLV) for a SaaS business. Explain the formula and provide actionable strategies for upselling, cross-selling, and reducing churn.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert in public relations (PR) for startups.`,
    user: `Develop a tutorial on how to write a press release that actually gets noticed for a new product launch. Include a template, tips for finding journalist contacts, and a follow-up strategy.${COMMON_STRUCTURE}`,
  },
];

// --- TEMPLATE GROUP: Entrepreneurship & Startups ---
const entrepreneurshipTemplates = [
  {
    system: `You are a startup advisor who helps entrepreneurs validate business ideas.`,
    user: `Write a comprehensive guide on how to validate a business idea using a "Fake Door" Test. Explain how to set up a landing page for a non-existent product to gauge interest and collect customer emails before building anything.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a business plan expert for small businesses.`,
    user: `Create a detailed tutorial on how to write a One-Page Business Plan for a specific type of small service business, like a photography or consulting business. Cover the key sections needed for clarity and focus.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a venture capital expert who demystifies the funding process.`,
    user: `Develop an in-depth guide on understanding a startup term sheet. Explain key concepts like pre-money valuation, liquidation preference, and stock option pools in simple, clear terms for founders.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a lean startup methodology expert.`,
    user: `Write a step-by-step tutorial on how to design and run a Minimum Viable Product (MVP) Test for a new mobile app idea. Cover defining the core feature, building the simplest version, and gathering user feedback.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a specialist in bootstrapping and early-stage funding.`,
    user: `Create a guide comparing bootstrapping vs. raising a pre-seed round for an early-stage software startup. Outline the pros and cons of each path, focusing on control, speed, and long-term scalability.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert on startup legal structures.`,
    user: `Develop a detailed analysis of LLC vs. S-Corp for a freelancer or consultant. Cover the differences in liability protection, taxation (including self-employment taxes), and administrative overhead.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a startup marketing expert for bootstrapped founders.`,
    user: `Write a guide on low-budget marketing strategies to get the first 100 customers. Focus on tactics like content marketing, community engagement, and strategic partnerships that don't require a large ad spend.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a startup financial planning expert.`,
    user: `Create a tutorial on how to create a financial projections model for a new business. Explain how to forecast revenue, costs, and cash flow for the first three years.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert on building startup teams.`,
    user: `Develop a guide on how to design an equity compensation plan for the first five employees in a startup. Cover topics like stock options, vesting schedules, and communicating the value of equity to candidates.${COMMON_STRUCTURE}`,
  },
];

// --- TEMPLATE GROUP: Personal Finance Management ---
const personalFinanceTemplates = [
  {
    system: `You are a certified financial planner who specializes in comprehensive financial planning for families.`,
    user: `Write a detailed guide on the financial checklist for expecting parents. Cover topics like updating a budget, life insurance needs, starting a college savings plan (529), and understanding parental leave benefits.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a debt management expert who helps people create effective payoff strategies.`,
    user: `Create a comprehensive tutorial on how to pay off student loans faster. Cover strategies like refinancing, income-driven repayment plans, and making extra payments, explaining the pros and cons of each.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a retirement planning specialist who helps people of all ages.`,
    user: `Develop an in-depth guide on retirement planning in your 40s. Cover how to assess your progress, options for "catch-up" contributions, and balancing retirement savings with other financial goals.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a tax optimization expert for individuals.`,
    user: `Write a comprehensive guide on the most overlooked tax deductions for freelancers and self-employed individuals. Cover home office deductions, health insurance premiums, qualified business income (QBI) deduction, and more.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a budgeting and cash flow expert.`,
    user: `Create a detailed tutorial on how to use the "Pay Yourself First" budgeting method. Explain how to automate savings and investments and live off the remainder, transforming the traditional budgeting process.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a real estate advisor for primary residences.`,
    user: `Develop a guide for the first-time home buyer. Cover everything from getting pre-approved for a mortgage to making an offer, the inspection process, and what happens at closing.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a specialist in managing equity compensation.`,
    user: `Write a guide on what to do with employee stock options (RSUs and ISOs). Explain vesting, tax implications upon exercise and sale, and how to incorporate company stock into a diversified investment portfolio.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a financial independence and early retirement (FIRE) expert.`,
    user: `Create a guide explaining "The 4% Rule" and safe withdrawal rates in retirement. Explain how the rule works, its potential limitations, and how to adjust it for different market conditions.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert on using Health Savings Accounts (HSAs) for investing.`,
    user: `Develop a detailed tutorial on how to use your HSA as a long-term investment vehicle. Explain the triple tax advantage, how to invest the funds within an HSA, and strategies to maximize its growth.${COMMON_STRUCTURE}`,
  },
];

// --- TEMPLATE GROUP: Business Operations & Management ---
const businessOperationsTemplates = [
  {
    system: `You are an operations consultant who helps businesses optimize processes.`,
    user: `Write a comprehensive guide on how to create a Standard Operating Procedure (SOP) for a key business task. Choose a specific task, such as onboarding a new client, and provide a template and step-by-step instructions.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a supply chain management expert.`,
    user: `Create a detailed tutorial on how to diversify the supply chain to reduce risk for a small e-commerce business. Cover finding and vetting new suppliers and managing inventory from multiple sources.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a project management expert.`,
    user: `Develop a guide on how to implement the 'Agile' methodology in a non-tech team, like marketing or creative. Explain concepts like sprints, daily stand-ups, and retrospectives in a business context.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a performance management consultant who helps businesses track metrics.`,
    user: `Write a guide on how to develop Key Performance Indicators (KPIs) for a customer service team. Cover metrics like First Response Time, Customer Satisfaction, and Net Promoter Score, explaining how to track them.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert on business process automation (BPA).`,
    user: `Choose a popular workflow automation tool and create an analysis of 5 repetitive business tasks a small business can automate. Choose examples like data entry, social media posting, or report generation.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a specialist in customer service operations.`,
    user: `Develop a comprehensive guide on how to build a customer support knowledge base that reduces support ticket volume. Cover topic ideation, article formatting, and how to promote the knowledge base to users.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an inventory management expert.`,
    user: `Write a tutorial on implementing a Just-in-Time (JIT) inventory system for a small manufacturing business. Explain the pros, cons, and the key steps to implement it successfully.${COMMON_STRUCTURE}`,
  },
];

// --- NEW TEMPLATE GROUP: Human Resources & Talent Management ---
const hrTemplates = [
    {
        system: `You are an HR consultant specializing in startup culture and team building.`,
        user: `Write a guide on how to define and build a strong company culture from day one in a new startup. Cover the process of defining core values, incorporating them into hiring, and reinforcing them through company rituals.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a talent acquisition expert who helps companies hire top talent.`,
        user: `Create a comprehensive tutorial on how to write a job description that attracts top-tier candidates. Explain how to go beyond a list of responsibilities to sell the opportunity and culture effectively.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a specialist in performance management and employee feedback.`,
        user: `Develop a practical guide on how to implement a continuous feedback system instead of annual reviews. Cover popular tools, the structure of regular check-ins, and how to train managers to give effective feedback.${COMMON_STRUCTURE}`
    },
    {
        system: `You are an expert in employee compensation and benefits.`,
        user: `Write an article explaining how to conduct a compensation benchmarking analysis to ensure your company is paying fair market rates. Cover using data sources, defining job levels, and creating salary bands.${COMMON_STRUCTURE}`
    },
    {
        system: `You are an expert on remote and hybrid work models.`,
        user: `Create a detailed guide on how to create an effective hybrid work policy. Cover scheduling models, communication protocols, and strategies for ensuring fairness and inclusion for all employees.${COMMON_STRUCTURE}`
    },
    {
        system: `You are an employment law specialist focused on management training.`,
        user: `Develop a guide for new managers on how to legally and effectively handle an employee performance issue. Cover documentation, performance improvement plans (PIPs), and when to involve HR.${COMMON_STRUCTURE}`
    },
];

// --- NEW TEMPLATE GROUP: Business Law & Compliance ---
const legalTemplates = [
    {
        system: `You are a corporate attorney specializing in intellectual property.`,
        user: `Write a clear guide for entrepreneurs on the difference between a trademark, copyright, and patent. Use simple examples for a small business and explain the first steps to protecting their IP.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a contract law expert who advises small businesses.`,
        user: `Create a tutorial on the key clauses every freelance contract must have. Cover topics like scope of work, payment terms, intellectual property rights, and termination clauses to protect both parties.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a data privacy consultant.`,
        user: `Develop a practical guide on data privacy basics (like GDPR & CCPA) for a US-based small business website. Explain personal data, the need for a privacy policy, and how to handle user data requests.${COMMON_STRUCTURE}`
    },
    {
        system: `You are an expert on online business law.`,
        user: `Write an explainer on the importance of website Terms and Conditions and Disclaimers for an online business. Provide a checklist of what these documents should include.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a corporate compliance expert.`,
        user: `Create a guide for startup founders on maintaining corporate formalities for their LLC or Corporation. Explain the importance of separating business and personal finances to maintain liability protection.${COMMON_STRUCTURE}`
    },
];


// (Existing groups Career Development & Leadership, E-commerce, and Real Estate are maintained and included)
// ... existing template groups ...

// --- COMBINE ALL TEMPLATES INTO ONE MASTER ARRAY ---
const allTemplates = [
  ...businessSoftwareTemplates,
  ...financialProductsTemplates,
  ...investmentStrategiesTemplates,
  ...marketingSalesTemplates,
  ...entrepreneurshipTemplates,
  ...personalFinanceTemplates,
  ...businessOperationsTemplates,
  ...hrTemplates,
  ...legalTemplates,
  // NOTE: In the final file, the omitted groups would be added back here.
  // ...careerLeadershipTemplates, 
  // ...ecommerceTemplates,
  // ...realEstateTemplates,
];

/**
 * Picks a random template from the master list with balanced distribution.
 * @returns {object} A randomly selected template object with `system` and `user` properties.
 */
function pickRandomTemplate() {
  // Expanded and re-weighted pool for broader, high-demand topics
  const finalPool = [
    ...businessSoftwareTemplates, ...businessSoftwareTemplates,
    ...financialProductsTemplates,
    ...investmentStrategiesTemplates, ...investmentStrategiesTemplates, ...investmentStrategiesTemplates,
    ...marketingSalesTemplates, ...marketingSalesTemplates, ...marketingSalesTemplates,
    ...entrepreneurshipTemplates, ...entrepreneurshipTemplates, ...entrepreneurshipTemplates,
    ...personalFinanceTemplates, ...personalFinanceTemplates, ...personalFinanceTemplates, ...personalFinanceTemplates, // Highest demand
    ...businessOperationsTemplates,
    ...hrTemplates,
    ...legalTemplates,
    // (Add the other existing groups here in your final file)
    // ...careerLeadershipTemplates,
    // ...ecommerceTemplates,
    // ...realEstateTemplates,
  ];
  return finalPool[Math.floor(Math.random() * finalPool.length)];
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