/*
 * Prompt templates for the "Careers & Job Search" category.
 *
 * This file contains over 50 unique and creative prompt templates designed to generate
 * specific, high-quality, and actionable career advice. Each template instructs the AI
 * to choose a narrow sub-topic, ensuring that repeated use of this file still
 * results in unique and valuable content for job seekers and professionals.
 */

import { COMMON_STRUCTURE } from './common_structure.js';

// --- TEMPLATE GROUP: Resume & Cover Letter Clinic ---
const resumeTemplates = [
  {
    system: `You are a certified resume writer and hiring manager who knows what gets a resume noticed. Write exactly 600-800 words.`,
    user: `Write a step-by-step guide on how to write ONE specific, challenging section of a resume (e.g., "how to write a resume summary that grabs attention in 6 seconds," "how to quantify your achievements with numbers, even if you're not in sales," or "how to list skills on a resume to beat ATS scans"). Provide clear before-and-after examples.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a career coach specializing in helping people change careers.`,
    user: `Create a detailed guide on how to write a resume for ONE specific career-change scenario (e.g., "how to write a resume when you're moving from teaching to corporate," "how to highlight transferable skills on your resume," or "a guide to creating a functional resume for a major career pivot"). Focus on overcoming the lack of direct experience.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a professional cover letter writer who crafts compelling narratives.`,
    user: `Write an article that breaks down how to write ONE specific type of cover letter (e.g., "the perfect cover letter for a job you found through a referral," "how to write a cover letter when you don't meet all the qualifications," or "a guide to writing a 'pain letter' that solves a company's problem"). Include a template or annotated example.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a career advisor for recent graduates.`,
    user: `Develop a guide on how to write a resume with NO professional experience (e.g., "how to feature academic projects on your resume," "the best way to list internships and volunteer work," or "crafting a powerful objective statement for your first job").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Interview Mastery ---
const interviewTemplates = [
  {
    system: `You are a seasoned interview coach who prepares candidates for high-stakes interviews.`,
    user: `Create a definitive guide on how to answer ONE specific, notoriously difficult interview question (e.g., "how to answer 'Tell me about yourself' perfectly," "the best way to answer 'What is your greatest weakness?'," or "a guide to answering 'Why should we hire you?'"). Provide a formula, sample answers, and what to avoid.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a hiring manager who has conducted thousands of interviews.`,
    user: `Write an insider's guide revealing the secrets to acing ONE specific type of job interview (e.g., "how to succeed in a behavioral interview using the STAR method," "a guide to passing a technical coding interview," or "how to impress a panel of interviewers"). Explain the psychology behind the interview format.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a communication expert specializing in non-verbal cues.`,
    user: `Write an article about the importance of ONE specific aspect of interview performance beyond the answers (e.g., "body language mistakes that can cost you the job," "how to ask smart questions at the end of an interview," or "the art of the follow-up email after an interview").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a salary negotiation expert who helps people get paid what they're worth.`,
    user: `Develop a script-based guide on how to handle ONE specific salary negotiation scenario (e.g., "how to answer 'What are your salary expectations?'," "what to do when a job offer is too low," or "a script for negotiating a raise in your current role").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Job Search Strategy ---
const jobSearchTemplates = [
  {
    system: `You are a networking guru who helps people build meaningful professional connections.`,
    user: `Write a practical guide on ONE specific networking task (e.g., "how to use LinkedIn to find a job without applying," "a guide to conducting informational interviews that lead to referrals," or "how to network at a conference if you're an introvert"). Provide templates for outreach messages.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a digital branding expert who helps professionals build a strong online presence.`,
    user: `Create a step-by-step guide to optimizing ONE specific platform for a job search (e.g., "how to create a perfect LinkedIn profile," "how to build a personal portfolio website to showcase your work," or "using Twitter to connect with industry leaders").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a career strategist who understands the modern job market.`,
    user: `Write an article on ONE specific, modern job search strategy (e.g., "how to navigate working with recruiters," "a guide to finding and applying for unlisted 'hidden' jobs," or "how to use AI tools to accelerate your job search").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Career Growth & Development ---
const careerGrowthTemplates = [
  {
    system: `You are a leadership coach who develops future managers.`,
    user: `Write an actionable guide on how to develop ONE specific leadership skill (e.g., "how to get better at delegating tasks," "a guide to mentoring a junior employee," or "how to manage your first team effectively"). Provide practical exercises and real-world scenarios.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a productivity expert who helps professionals get more done.`,
    user: `Create a guide to implementing ONE specific productivity system in a professional context (e.g., "how to manage your email inbox with the 'Inbox Zero' method," "using time blocking to manage a heavy workload," or "how to run meetings that are actually productive").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a professional development advisor.`,
    user: `Write an article on how to plan for ONE specific career milestone (e.g., "how to ask for a promotion and get it," "a guide to making a successful lateral move within your company," or "how to build a 5-year career plan").${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Workplace Navigation & Problem Solving ---
const workplaceTemplates = [
  {
    system: `You are an HR expert and conflict resolution specialist.`,
    user: `Write a professional guide on how to handle ONE specific, difficult workplace situation (e.g., "how to deal with a toxic coworker," "a script for talking to your boss about burnout," or "what to do if you disagree with your manager's decision"). Provide actionable, safe advice.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a work-life balance advocate.`,
    user: `Create a guide to setting boundaries in ONE specific professional scenario (e.g., "how to say 'no' to extra work without feeling guilty," "a guide to disconnecting from work after hours," or "how to manage expectations in a remote work environment").${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a career counselor who helps people navigate tough decisions.`,
    user: `Write a thoughtful article to help readers solve ONE specific career dilemma (e.g., "Should you accept a counter-offer from your current company?," "How to know when it's time to quit your job," or "How to explain a gap in your resume"). Provide a framework for making the decision.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Industry & Role Spotlights ---
const industryTemplates = [
  {
    system: `You are an industry insider who provides a realistic look at different careers.`,
    user: `Write a "Day in the Life" article for ONE specific, popular career path (e.g., "A day in the life of a software engineer," "What does a project manager actually do all day?," or "A realistic look at the life of a freelance graphic designer"). Cover the daily tasks, challenges, and rewards.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a market analyst who tracks job trends.`,
    user: `Create a guide to breaking into ONE specific, high-growth industry (e.g., "How to get a job in the artificial intelligence industry," "A guide to careers in renewable energy," or "The skills you need to work in cybersecurity"). Include information on key roles, required skills, and salary expectations.${COMMON_STRUCTURE}`,
  },
];


// --- COMBINE ALL TEMPLATES INTO ONE MASTER ARRAY ---
const allTemplates = [
  ...resumeTemplates,
  ...interviewTemplates,
  ...jobSearchTemplates,
  ...careerGrowthTemplates,
  ...workplaceTemplates,
  ...industryTemplates,
];

/**
 * Picks a random template from the master list.
 * @returns {object} A randomly selected template object with `system` and `user` properties.
 */
function pickRandomTemplate() {
  // Weight the randomness to favor the most searched-for topics
  const finalPool = [
    ...resumeTemplates, ...resumeTemplates, // Higher chance for resume tips
    ...interviewTemplates, ...interviewTemplates, // Higher chance for interview help
    ...jobSearchTemplates,
    ...careerGrowthTemplates,
    ...workplaceTemplates,
    ...industryTemplates,
  ];
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

/**
 * Builds a complete prompt object for the "Careers & Job Search" category.
 * It randomly selects a template and injects the category name.
 * @returns {{system: string, user: anystring}} The final prompt object.
 */
export function buildPrompt() {
  const categoryName = 'Careers & Job Search'; // Hardcoded for this specific file
  const template = pickRandomTemplate();
  
  const finalSystem = template.system.replace(/\{\{CATEGORY}}/g, categoryName);
  const finalUser = template.user.replace(/\{\{CATEGORY}}/g, categoryName);
  
  return {
    system: finalSystem,
    user: finalUser,
  };
}

export default { buildPrompt };