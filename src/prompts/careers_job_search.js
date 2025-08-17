/*
 * Prompt templates for the "Careers & Job Search" category.
 *
 * This file contains over 200 unique prompt possibilities designed to generate specific,
 * high-quality, and actionable career advice. Every template is ultimately flexible,
 * instructing the AI to choose a narrow sub-topic to ensure unique content generation.
 */

import { COMMON_STRUCTURE } from './common_structure.js';

// --- TEMPLATE GROUP: Resume & Cover Letter Clinic ---
const resumeTemplates = [
  {
    system: `You are a certified resume writer and hiring manager who knows what gets a resume noticed. Write exactly 600-800 words.`,
    user: `Write a step-by-step guide on how to write ONE specific, challenging section of a resume. Select a single section, such as the professional summary, the work experience bullet points, or the skills section. Provide clear before-and-after examples to illustrate your advice.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a career coach specializing in helping people change careers.`,
    user: `Create a detailed guide on how to write a resume for ONE specific career-change scenario. Choose a scenario like moving from one industry to another, re-entering the workforce after a break, or transitioning from a technical to a management role. Focus on highlighting transferable skills.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a professional cover letter writer who crafts compelling narratives.`,
    user: `Write an article that breaks down how to write ONE specific type of cover letter. Choose a single scenario, such as writing a letter for a job found through a referral, for a role where you lack some qualifications, or for a speculative application to a dream company. Include a template or annotated example.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a career advisor for recent graduates.`,
    user: `Develop a guide on how to write a resume with NO professional experience. Focus on ONE specific strategy, such as how to effectively showcase academic projects, how to frame internship or volunteer experience, or how to write a compelling objective statement for an entry-level position.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert resume strategist.`,
    user: `Write an article detailing ONE specific, critical resume mistake that can cause immediate rejection. Select a common error, such as formatting issues, unprofessional contact information, or using clichés, and explain why it's so damaging to a job application.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert in applicant tracking systems (ATS).`,
    user: `Create a guide on how to optimize your resume for ONE specific aspect of passing through an Applicant Tracking System. Focus on a single technique, such as keyword optimization, proper formatting, or section heading choices.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a resume design and formatting specialist.`,
    user: `Develop a detailed comparison of TWO specific resume formats, explaining the pros and cons of each. Choose from common formats like chronological, functional, or combination, and describe the ideal candidate and situation for each format.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Interview Mastery ---
const interviewTemplates = [
  {
    system: `You are a seasoned interview coach who prepares candidates for high-stakes interviews.`,
    user: `Create a definitive guide on how to answer ONE specific, notoriously difficult interview question. Choose a classic hardball question about weaknesses, salary expectations, or reasons for leaving a past job. Provide a formula, sample answers, and what to avoid.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a hiring manager who has conducted thousands of interviews.`,
    user: `Write an insider's guide revealing the secrets to acing ONE specific type of job interview. Choose a format like a behavioral interview, a technical interview, or a panel interview, and explain the unique strategy required for success.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a communication expert specializing in non-verbal cues.`,
    user: `Write an article about the importance of ONE specific aspect of interview performance beyond the words you say. Select a single topic like professional body language, asking insightful questions to the interviewer, or crafting the perfect follow-up correspondence.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a salary negotiation expert who helps people get paid what they're worth.`,
    user: `Develop a script-based guide on how to handle ONE specific salary negotiation scenario. Choose a common situation like how to respond to the salary expectations question, how to counter a low job offer, or how to negotiate a raise in your current role.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a corporate recruiter who prepares candidates.`,
    user: `Write a complete guide on how to prepare for ONE specific stage of the interview process. Choose either a phone screen with a recruiter, a video interview with the hiring manager, or the final round of interviews.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert in behavioral interviewing techniques.`,
    user: `Develop a tutorial on how to use a structured storytelling method to answer behavioral interview questions. Explain the steps of the technique and provide a detailed example for a common question about teamwork or problem-solving.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a career advisor who helps people overcome interview anxiety.`,
    user: `Write a reassuring guide on how to recover from ONE specific type of interview blunder. Select a scenario like drawing a blank on a question, realizing you made a factual error, or having a tech failure during a video call. Provide calming strategies and follow-up advice.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Job Search Strategy ---
const jobSearchTemplates = [
  {
    system: `You are a career strategist who understands the modern job market.`,
    user: `Write an article on ONE specific, modern job search strategy beyond just applying to online job boards. Choose a topic like how to effectively work with recruiters, how to find unlisted "hidden" jobs, or how to leverage new technology tools to enhance your job search.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert on targeted job searching.`,
    user: `Create a guide on how to create and execute a targeted job search plan. Focus on ONE specific aspect, such as creating a target list of companies, tailoring your application for each role, or tracking your application progress systematically.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a job market researcher.`,
    user: `Develop a guide on how to effectively research a company *before* you apply or interview. Explain how to analyze a company's culture, financial health, and recent news to determine if it's a good fit and to prepare insightful questions.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a career counselor focused on mental resilience.`,
    user: `Write a supportive article on ONE specific strategy for staying motivated and managing the emotional challenges of a long job search. Choose a topic like dealing with rejection, avoiding burnout, or maintaining a positive mindset.${COMMON_STRUCTURE}`,
  },
];


// --- NEW TEMPLATE GROUP: Networking & Personal Branding ---
const networkingTemplates = [
  {
    system: `You are a networking guru who helps people build meaningful professional connections.`,
    user: `Write a practical guide on ONE specific networking strategy for job seekers. Choose a method such as using an online professional network, conducting informational interviews, or attending industry events, and provide templates for professional outreach messages.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a digital branding expert who helps professionals build a strong online presence.`,
    user: `Create a step-by-step guide to optimizing ONE specific professional platform for a job search. Select a single platform like a professional networking site or a personal portfolio website, and detail how to perfect your profile or content.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a public speaking coach for professionals.`,
    user: `Write a guide on how to develop and use a compelling "elevator pitch" or personal brand statement for professional events. Break down the components of an effective pitch and how to deliver it confidently.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a career coach for introverts.`,
    user: `Develop an actionable guide to professional networking for people who are naturally introverted. Focus on ONE specific strategy, like one-on-one networking, leveraging written communication, or how to navigate large industry events without feeling overwhelmed.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a relationship management expert.`,
    user: `Create a guide with templates for following up after ONE specific type of networking interaction. Choose a scenario like after a conference, after an informational interview, or a long-term "staying in touch" email to maintain a connection.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Career Growth & Development ---
const careerGrowthTemplates = [
  {
    system: `You are a leadership coach who develops future managers.`,
    user: `Write an actionable guide on how to develop ONE specific leadership skill essential for career growth. Select a skill such as delegation, giving constructive feedback, or effective team management. Provide practical exercises.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a professional development advisor.`,
    user: `Write an article on how to plan for ONE specific career milestone. Choose a single goal like asking for a promotion, making a successful lateral move within your company, or creating a comprehensive five-year career plan.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a mentorship program expert.`,
    user: `Develop a guide on how to be successful in ONE specific aspect of a professional mentorship relationship. Choose a topic like how to find the right mentor, how to be a valuable mentee, or how to structure a productive mentorship meeting.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a performance review specialist.`,
    user: `Create a guide on how to prepare for and excel in a performance review. Focus on ONE specific goal, such as how to document your accomplishments throughout the year, how to effectively self-evaluate, or how to receive and act on constructive criticism.${COMMON_STRUCTURE}`,
  },
];

// --- NEW TEMPLATE GROUP: Skills Development & Upskilling ---
const upskillingTemplates = [
  {
    system: `You are a skills development expert who helps professionals stay relevant.`,
    user: `Write a guide on how to effectively learn a new professional skill. Focus on ONE specific category of skill, such as a new software program, a programming language, or a crucial soft skill like public speaking.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a certification and online course advisor.`,
    user: `Develop an article on how to choose the right professional certification or online course to advance your career. Explain how to evaluate the ROI, the credibility of the provider, and how to feature it on your resume and professional profiles.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert on soft skills in the workplace.`,
    user: `Create a deep-dive article on how to develop ONE specific, critical soft skill. Select a skill like emotional intelligence, adaptability, or creative problem-solving, and provide actionable steps to improve it.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a specialist in industry-specific hard skills.`,
    user: `Write a guide to ONE specific, in-demand hard skill that is transforming a particular industry. Choose a skill and explain what it is, why it's valuable, and the common paths to acquiring it, such as through bootcamps, courses, or on-the-job training.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Workplace Navigation & Problem Solving ---
const workplaceTemplates = [
  {
    system: `You are an HR expert and conflict resolution specialist.`,
    user: `Write a professional guide on how to handle ONE specific, difficult workplace situation. Select a single common problem, like dealing with a difficult coworker, approaching your boss about burnout, or respectfully disagreeing with a manager's decision. Provide actionable, safe advice.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a work-life balance advocate.`,
    user: `Create a guide to setting professional boundaries in ONE specific work scenario. Choose a topic like how to say 'no' to additional work, how to mentally disconnect after hours, or how to manage expectations in a remote environment.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a productivity expert who helps professionals get more done.`,
    user: `Create a guide to implementing ONE specific productivity system in a professional context. Choose a well-known system for time management or task management, and explain how to apply it at work for better results.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert in organizational politics.`,
    user: `Write a guide on how to ethically navigate ONE specific aspect of office politics. Choose a scenario like how to increase your visibility for a promotion, how to build allies across departments, or how to manage a difficult stakeholder.${COMMON_STRUCTURE}`,
  },
];


// --- NEW TEMPLATE GROUP: Career Change & Pivoting ---
const careerChangeTemplates = [
  {
    system: `You are a career change counselor who guides professionals through transitions.`,
    user: `Write a comprehensive guide on the first steps to take when planning a career change. Focus on ONE specific foundational stage, such as self-assessment of skills and interests, researching new potential career paths, or financial planning for a transition.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert in testing new career paths.`,
    user: `Develop a practical guide on how to 'test drive' a new career before making a full commitment. Explain ONE specific strategy, like taking on a freelance project, doing intensive volunteer work in the new field, or conducting in-depth informational interviews with professionals.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a specialist in personal branding for career changers.`,
    user: `Create an article on how to rebrand yourself online for a major career pivot. Focus on ONE specific platform, such as a professional networking site or a personal website, and explain how to update your summary, skills, and experience to reflect your new direction.${COMMON_STRUCTURE}`,
  },
];

// --- NEW TEMPLATE GROUP: Freelancing & The Gig Economy ---
const freelancingTemplates = [
  {
    system: `You are a successful freelancer who coaches others on building a sustainable business.`,
    user: `Write a tactical guide on ONE specific strategy for a new freelancer to find their first clients. Select a strategy like using a specific freelance marketplace, effective cold outreach, or leveraging a personal network for referrals.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert on freelancer finances.`,
    user: `Develop a simple guide for new freelancers on how to manage their finances. Focus on ONE critical topic, such as setting aside money for taxes, choosing the right business structure, or pricing their services profitably.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a contract expert for independent contractors.`,
    user: `Create a guide that explains ONE essential clause that every freelance contract must have. Choose a clause related to payment terms, scope of work, or intellectual property rights, and explain why it's crucial for protecting the freelancer.${COMMON_STRUCTURE}`,
  },
];

// --- NEW TEMPLATE GROUP: Remote & Hybrid Work Life ---
const remoteWorkTemplates = [
  {
    system: `You are an expert on remote work productivity and culture.`,
    user: `Write a guide for professionals on how to succeed in a fully remote role. Focus on ONE specific challenge, such as staying visible to management, avoiding isolation, or collaborating effectively with a distributed team.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a specialist in finding remote jobs.`,
    user: `Create a practical guide on how to find and land a high-quality remote job. Focus on ONE key aspect of the search, such as identifying the best remote job boards, tailoring your resume for remote roles, or excelling in video interviews.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a hybrid work model consultant.`,
    user: `Develop an article providing advice for employees on how to navigate a hybrid work model successfully. Address ONE specific challenge, like how to balance in-office and remote days, or how to ensure equitable treatment and opportunities regardless of location.${COMMON_STRUCTURE}`,
  },
];


// --- COMBINE ALL TEMPLATES INTO ONE MASTER ARRAY ---
const allTemplates = [
  ...resumeTemplates,
  ...interviewTemplates,
  ...jobSearchTemplates,
  ...networkingTemplates,
  ...careerGrowthTemplates,
  ...upskillingTemplates,
  ...workplaceTemplates,
  ...careerChangeTemplates,
  ...freelancingTemplates,
  ...remoteWorkTemplates,
  // Industry & Role Spotlights from the original is also good to keep.
];

/**
 * Picks a random template from the master list.
 * @returns {object} A randomly selected template object with `system` and `user` properties.
 */
function pickRandomTemplate() {
  // Weight the randomness to favor the most searched-for topics with new categories
  const finalPool = [
    ...resumeTemplates, ...resumeTemplates, ...resumeTemplates, // Very High demand
    ...interviewTemplates, ...interviewTemplates, ...interviewTemplates, // Very High demand
    ...jobSearchTemplates, ...jobSearchTemplates,
    ...networkingTemplates, ...networkingTemplates,
    ...careerGrowthTemplates,

    ...upskillingTemplates,
    ...workplaceTemplates,
    ...careerChangeTemplates,
    ...freelancingTemplates,
    ...remoteWorkTemplates,
  ];
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

/**
 * Builds a complete prompt object for the "Careers & Job Search" category.
 * It randomly selects a template and injects the category name.
 * @returns {{system: string, user: string}} The final prompt object.
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