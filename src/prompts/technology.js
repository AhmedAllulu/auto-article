/*
 * =============================================================================
 * | PROMPT TEMPLATES: TECHNOLOGY                                              |
 * =============================================================================
 * | Over 200+ specific, narrow-topic prompts for the 'Technology' category.   |
 * | Organised by article type to generate diverse and high-quality content.   |
 * =============================================================================
 */

import { COMMON_STRUCTURE } from './common_structure.js';

// =============================================================================
// | 1. BEGINNER'S GUIDES (Comprehensive Introductions)                        |
// =============================================================================
const beginnerGuideTemplates = [
  // Core Concepts
  {
    system: `You are an expert educator who makes complex tech concepts simple for absolute beginners.`,
    user: `Write a comprehensive beginner's guide to "Understanding APIs." Assume zero prior knowledge. Explain what they are, how they work using real-world analogies (like a restaurant waiter), and why they are essential for modern apps.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a patient teacher specializing in foundational technology.`,
    user: `Create a complete beginner's roadmap to "Cloud Computing." Cover the fundamental concepts (IaaS, PaaS, SaaS), explain the difference between public, private, and hybrid clouds, and list the key benefits for individuals and businesses.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a learning specialist who designs curriculum for newcomers to tech.`,
    user: `Develop the ultimate beginner's guide to "Cybersecurity Fundamentals." Feature core concepts like malware, phishing, and firewalls, explain common beginner mistakes to avoid (like password reuse), and outline first steps to securing personal devices.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a mentor who guides newcomers through their first steps in software development.`,
    user: `Write a supportive beginner's introduction to "Learning Python." Address common fears (like "I'm not good at math"), provide encouragement, set realistic learning expectations, and offer a clear, step-by-step path for the first 30 days.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a simplification expert who makes blockchain accessible to anyone.`,
    user: `Develop a jargon-free beginner's guide to "Blockchain Technology (Not Cryptocurrency)." Use simple language and real-world analogies (like a digital public ledger) to explain blocks, chains, and decentralization. Avoid technical jargon.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an AI educator who demystifies artificial intelligence for the public.`,
    user: `Write a thorough beginner's foundation course on "Artificial Intelligence and Machine Learning." Cover the essential differences, explain concepts like neural networks with simple analogies, and describe real-world examples like recommendation engines.${COMMON_STRUCTURE}`,
  },
  // Practical Skills
  {
    system: `You are an onboarding specialist for aspiring web developers.`,
    user: `Create a structured beginner's course outline for "Building Your First Website with HTML & CSS." Include learning modules, hands-on activities (like creating a personal portfolio page), and troubleshooting help for common issues like broken layouts.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a practical instructor who focuses on immediate applicability for beginners.`,
    user: `Develop a hands-on beginner's workshop for "Using Git and GitHub." Focus on the most essential commands (clone, add, commit, push) and create a simple project to demonstrate the workflow for backing up code.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a foundation builder for data science.`,
    user: `Write a complete beginner's starter pack for "Introduction to Data Science." Include the essential tools to install (like Anaconda), recommended first datasets to explore (like the Titanic dataset), and a simple learning schedule for the first month.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a confidence builder who helps non-techies understand hardware.`,
    user: `Create an encouraging beginner's journey through "Understanding PC Components." With small wins, explain what a CPU, GPU, RAM, and SSD do in simple terms, using the analogy of a human brain and memory, so anyone can understand how a computer works.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a patient instructor breaking down virtual reality (VR).`,
    user: `Create a complete beginner's roadmap for "Getting Started with Virtual Reality." Cover the different types of headsets (PC VR vs. standalone), essential terminology (like degrees of freedom), and recommend the best entry-level games and experiences.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an IoT (Internet of Things) specialist for homeowners.`,
    user: `Develop an ultimate beginner's guide to "Creating a Smart Home." Feature foundational concepts (hubs vs. Wi-Fi devices), common mistakes to avoid (like buying into a closed ecosystem), and a simple starting project like setting up smart lighting.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an ethical hacking mentor for aspiring security professionals.`,
    user: `Write a supportive beginner's introduction to "Ethical Hacking." Address common concerns about legality, provide encouragement, explain the importance of certifications (like CompTIA Security+), and offer a clear path for learning the basics safely.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a mobile app development educator.`,
    user: `Create a jargon-free beginner's guide to "How Mobile Apps are Made." Use simple language and a high-level overview to explain the process from idea to design, development (native vs. cross-platform), and launching on an app store.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a foundation builder for understanding networking.`,
    user: `Write a thorough beginner's foundation course on "Home Networking." Cover essential principles like the difference between a modem and a router, what an IP address is, and basic steps to improve Wi-Fi signal strength in your home.${COMMON_STRUCTURE}`,
  },
];


// =============================================================================
// | 2. "BEST-OF" LISTS (Top Lists & Roundups)                                 |
// =============================================================================
const bestOfTemplates = [
  // Consumer Electronics
  {
    system: `You are a product review specialist who writes unbiased "best of" round-up articles.`,
    user: `Write an article listing the top 5 "Best Noise-Canceling Headphones Under $250" for commuters. Create a title like "The Ultimate Commuter's Guide: 5 Best Noise-Canceling Headphones." For each, include pros/cons and suitability for different environments (bus, train, office).${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert curator who creates comparison round-ups for tech shoppers.`,
    user: `Produce a listicle highlighting the "6 Best Laptops for College Students in 2025." Use an engaging title like "The Definitive List of Campus-Ready Laptops." Provide key features (battery life, weight), pricing insights, and a clear verdict for different majors (e.g., engineering vs. liberal arts).${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a consumer advocate who helps people make informed purchasing decisions on smart home devices.`,
    user: `Write an authoritative guide to the "Top 5 Smart Doorbells" available now. Use a dynamic title like "The Complete Buyer's Guide to Smart Doorbells." Include budget, mid-range, and premium options with analysis of subscription costs and video quality.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a value-focused reviewer finding the best deals in mobile tech.`,
    user: `Create a value guide to the "5 Best Budget Android Phones That Don't Feel Cheap." Use a title like "Maximum Bang for Your Buck: Top 5 Androids." Highlight products offering the best camera and battery performance for their price.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a specialist curator focused on wearable technology.`,
    user: `Write an innovation spotlight on the "Top 5 Smart Rings" changing the wearables market. Use a forward-thinking title like "The Future on Your Finger." Feature cutting-edge options and their most innovative features, like sleep tracking and contactless payments.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a gaming hardware expert.`,
    user: `Develop a data-driven article on the "Top 6 Trending Mechanical Keyboards for Gamers." Use a creative title like "Tested and Ranked: The Best Keyboards for Gamers." Include performance comparisons based on switch type, latency, and build quality.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a home entertainment system guru.`,
    user: `Create a personalized guide to the "Best Soundbars for Small Apartments." Use a title like "Small Space, Big Sound." Include categories for budget-conscious buyers, movie lovers, and those seeking minimalist design.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a quality assessor for PC components.`,
    user: `Produce a comparison of the "Top 5 Highest-Rated Power Supply Units (PSUs) for a New PC Build." Use a title like "Cream of the Crop: The Most Reliable PSUs." Feature methodology on how efficiency ratings (e.g., 80+ Gold) impact performance and electricity costs.${COMMON_STRUCTURE}`,
  },
  // Software & Services
  {
    system: `You are a trend analyst who identifies the most popular and effective software tools.`,
    user: `Create a ranking of the "Top 7 Project Management Tools for Freelancers." Use a compelling title like "Ranked: The Best PM Tools to Organize Your Freelance Life." Analyze each tool's free tier, user interface, and unique features for solopreneurs.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an industry expert who evaluates security solutions.`,
    user: `Develop a data-driven article about the "Top 5 Password Managers" for family use. Use a title like "The Science-Backed Top 5 Password Managers." Include comparisons of their family sharing features, security audits, and ease of use for non-technical users.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a market researcher analyzing cloud services.`,
    user: `Write an article on the "Hottest Cloud Storage Services for Photographers RIGHT NOW." Use a title like "What's Hot: Cloud Storage for Pros." Include rising stars offering the best RAW file support, sharing capabilities, and value for storage space.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a software review specialist focusing on productivity.`,
    user: `Create a listicle of the "6 Best Note-Taking Apps for Power Users." Use a title like "6 Game-Changers for Your Digital Notes." Compare features like organization (tags vs. notebooks), platform sync, and advanced functionality like back-linking.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a privacy advocate reviewing consumer tech.`,
    user: `Write a guide to the "5 Best VPN Services for Streaming." Use a dynamic title like "Unlock Global Content: The Top 5 Streaming VPNs." Focus on streaming speed, ability to unblock major platforms (Netflix, etc.), and recent user feedback on reliability.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a curator of creative tools.`,
    user: `Produce a comparison of the "Top 5 Free Video Editing Software for Beginners." Use a title like "The Gold Standard for Free Video Editors." Evaluate based on ease of use, available features (no watermarks, etc.), and system requirements.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a value-focused reviewer of business software.`,
    user: `Create a value guide highlighting the "Top 5 Free Alternatives to Microsoft Office." Use a title like "Premium Quality, Budget Price: Free Office Suites." Highlight options with the best compatibility with Microsoft file formats and collaborative features.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a specialist in developer tools.`,
    user: `Write an innovation spotlight on the "5 Most Cutting-Edge Code Editors for Web Development in 2025." Use a title like "The Future is Here: Next-Gen Code Editors." Feature editors with the best AI-powered code completion, integrated collaboration, and performance.${COMMON_STRUCTURE}`,
  },
];


// =============================================================================
// | 3. HOW-TO GUIDES (Step-by-Step Tutorials)                                 |
// =============================================================================
const howToTemplates = [
  // Software How-Tos
  {
    system: `You are an expert tutorial writer who creates concise, actionable guides for software users.`,
    user: `Write a step-by-step article on "How to Use Pivot Tables in Excel to Analyze Sales Data." Use a compelling title. Ensure the sub-topic is narrow and actionable, using a sample dataset as an example. Include troubleshooting tips for common errors.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a productivity expert who optimizes digital workflows.`,
    user: `Create a guide on "How to Automate Repetitive Tasks on Your Computer Using Zapier." Use an engaging title like "The Lazy Person's Guide to Automation." Focus on a practical example like saving email attachments to cloud storage automatically.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a professional trainer who creates detailed learning materials for creative software.`,
    user: `Develop a tutorial on "How to Remove the Background from an Image Using a Free Tool like Photopea." Use a unique title. Include clear, numbered steps with explanations and before/after examples.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a technical writer specializing in beginner-friendly web tutorials.`,
    user: `Create a foolproof guide on "How to Host a Simple Website on GitHub Pages for Free." Assume no prior knowledge. Include an overview, step-by-step process for creating a repository and enabling pages, and FAQs.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an educator who breaks down complex data tasks into digestible lessons.`,
    user: `Write an educational guide on "How to Create Your First Interactive Dashboard with Google Data Studio." Use an engaging title. Include clear objectives, how to connect a data source (like Google Sheets), and simple chart creation steps.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a problem-solving specialist for common tech issues.`,
    user: `Develop a guide on "How to Secure Your Personal Gmail Account Like a Security Expert." Create a compelling title. Identify common security holes and provide a step-by-step checklist for enabling 2FA, reviewing app permissions, and creating a strong password.${COMMON_STRUCTURE}`,
  },
  // Hardware How-Tos
  {
    system: `You are a DIY expert who simplifies complex hardware processes.`,
    user: `Write a guide for the specific task of "How to Install More RAM in Your Desktop PC." Create an attention-grabbing title. Cover tools needed, time required, safety warnings (static electricity), and step-by-step instructions with clear explanations.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a craftsperson who teaches PC building skills.`,
    user: `Write an article on "How to Properly Apply Thermal Paste to a CPU." Use a creative title. Cover preparation methods, common application patterns (dot, line, spread), and how to avoid common mistakes like using too much paste.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a hands-on instructor focused on home networking.`,
    user: `Create a practical tutorial on "How to Set Up a Secure Home Wi-Fi Network." Use an engaging title. Include real-world steps for changing the default router password, enabling WPA3 encryption, and hiding the network name (SSID).${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a technical troubleshooter for consumer electronics.`,
    user: `Develop a solution-oriented guide for "How to Speed Up a Slow Windows Laptop." Create a compelling title like "Stop the Lag: A 5-Step Laptop Tune-Up." Identify common causes and provide actionable steps like disabling startup programs and clearing temporary files.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert on smartphone maintenance.`,
    user: `Write a step-by-step article on "How to Properly Clean Your Smartphone's Charging Port and Speakers." Ensure the title is unique. Use numbered steps, list safe tools to use (avoiding metal), and include troubleshooting tips for persistent charging issues.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a home theater setup instructor.`,
    user: `Create a guide on "How to Calibrate Your New 4K TV for the Best Picture Quality." Use a title like "Your Blueprint for a Cinema-Perfect TV." Cover essential settings like brightness, contrast, and color temperature, and explain what they do in simple terms.${COMMON_STRUCTURE}`,
  },
];


// =============================================================================
// | 4. COMPARISON ARTICLES (Head-to-Head Analysis)                            |
// =============================================================================
const comparisonTemplates = [
  // Software & Services
  {
    system: `You are a comparison analyst who writes clear, data-driven articles on software.`,
    user: `Write a comparison article for the specific niche of "Zoom vs. Google Meet for Small Business Meetings." Use a unique title format like "Head-to-Head: Zoom vs. Google Meet." Compare them across criteria like free tier limitations, video quality, and integrations.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an industry analyst evaluating e-commerce platforms.`,
    user: `Write an authoritative comparison of "Shopify vs. WooCommerce for Starting an Online Store." Use a professional title. Include analysis of pricing models (subscription vs. self-hosted), ease of use for non-developers, and scalability.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a decision-making consultant who simplifies complex tech choices.`,
    user: `Create a decision guide comparing "LastPass vs. 1Password" for personal password management. Use a helpful title like "Choose Your Vault: LastPass or 1Password?" Include a decision tree based on user needs like family sharing, cost, and platform support.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a practical reviewer focusing on real-world differences in design software.`,
    user: `Write a user-focused comparison of "Figma vs. Adobe XD for UI/UX Design." Use a relatable title. Highlight practical differences in collaboration features, performance with large files, and the availability of plugins and integrations.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an evaluation expert using systematic comparison methodologies.`,
    user: `Create a comprehensive evaluation guide comparing "Notion vs. Evernote" for personal knowledge management. Use a methodical title. Include scoring criteria for organization, flexibility, and web clipping features, with a data-driven conclusion.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a market comparison specialist for cloud providers.`,
    user: `Develop a strategic comparison examining "Google Drive vs. Dropbox" for small team collaboration. Use an authoritative title. Examine storage value, real-time collaboration features (like Google Docs integration), and administrative controls.${COMMON_STRUCTURE}`,
  },
  // Hardware
  {
    system: `You are an expert reviewer trusted for balanced hardware comparisons.`,
    user: `Create an objective comparison of "Apple AirPods Pro vs. Sony WF-1000XM5" wireless earbuds. Use a title like "Battle of the Titans." Include side-by-side analysis of noise-cancellation quality, sound signature, and battery life.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a consumer research specialist helping buyers choose between laptops.`,
    user: `Create a detailed buyer's comparison guide for "MacBook Air vs. Dell XPS 13" for professionals. Use a dynamic title like "The Ultimate Pro Laptop Showdown." Include real-world performance tests, keyboard/trackpad user experience, and overall value proposition.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a product testing expert conducting thorough evaluations of gaming hardware.`,
    user: `Produce an in-depth showdown comparing "NVIDIA GeForce RTX 4070 vs. AMD Radeon RX 7800 XT" graphics cards. Use an action-packed title. Include performance benchmarks in popular games at 1440p resolution, price-to-performance analysis, and feature comparisons (DLSS vs. FSR).${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a technology evaluator specializing in processors.`,
    user: `Develop a comprehensive comparison analyzing "Intel Core i5 vs. AMD Ryzen 5" for a mid-range PC build. Use a compelling title format. Include performance benchmarks for both gaming and productivity tasks, platform costs, and power consumption analysis.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a practical reviewer focusing on smart home ecosystems.`,
    user: `Write a user-focused comparison highlighting the practical differences between "Amazon Alexa and Google Assistant." Use a relatable title like "Real-World Test: Alexa vs. Google." Highlight differences in voice recognition accuracy, smart device compatibility, and the quality of their responses to complex queries.${COMMON_STRUCTURE}`,
  },
];


// =============================================================================
// | 5. REVIEWS (In-Depth Product & Service Evaluations)                       |
// =============================================================================
const reviewTemplates = [
  // Hardware Reviews
  {
    system: `You are an unbiased reviewer providing thorough, honest evaluations of new tech.`,
    user: `Write a comprehensive review of the "Latest iPhone Model." Cover all aspects including camera performance with photo samples, battery life benchmarks, display quality, the value of new features, and a final verdict on who should upgrade.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a hands-on tester evaluating real-world performance of laptops.`,
    user: `Create a practical review of the "Framework Laptop." Base it on extensive hands-on testing, focusing on the real-world experience of repairing and upgrading the device, keyboard feel for typing, and overall performance for daily tasks.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a long-term evaluator assessing sustained performance over time.`,
    user: `Write a comprehensive long-term review of the "PlayStation 5, two years later." Cover how the console has held up, the evolution of its game library, the reliability of the DualSense controller, and whether it's still a good buy today.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a technical evaluator who examines PC component specifications.`,
    user: `Write a technical review of the "Samsung 990 Pro SSD." Include detailed performance testing results (read/write speeds), an analysis of its thermal performance under load, and a recommendation for gamers and creative professionals.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a consumer advocate helping buyers make informed decisions on peripherals.`,
    user: `Develop a buyer-focused review of the "Logitech MX Master 3S Mouse." Address its ergonomic value for people with hand pain, the practical utility of its customizable buttons, and whether it's worth the premium price over cheaper alternatives.${COMMON_STRUCTURE}`,
  },
  // Software Reviews
  {
    system: `You are a testing expert who conducts rigorous evaluations of software.`,
    user: `Create an in-depth review of "Adobe Photoshop" for 2025. Use a systematic testing procedure to evaluate the new AI-powered features, benchmark its performance with large files, and conclude with an evidence-based assessment of its value for photographers.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a professional critic who provides expert analysis of developer tools.`,
    user: `Write a professional review of "Visual Studio Code" and its current state. Provide industry benchmarking against other editors, an expert evaluation of its extension ecosystem, and an authoritative assessment of why it remains the top choice for developers.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a user experience specialist evaluating productivity apps.`,
    user: `Create a UX-focused review of the task management app "Todoist." Examine its user interface design, learning curve for new users, the speed and reliability of its cross-platform sync, and overall user satisfaction based on its core workflow.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a comparative reviewer evaluating a new market entry.`,
    user: `Develop a competitive review of the "Arc Browser." Compare it directly against major alternatives like Chrome and Safari, highlighting its unique advantages in organization (Spaces) and user interface, while also addressing its current weaknesses.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a value analyst focused on cost-benefit for creative software.`,
    user: `Develop a value-focused review of "DaVinci Resolve" (the free version). Examine its cost-effectiveness against paid software like Premiere Pro, highlighting the professional-grade features it offers for free and who can get by without needing to upgrade.${COMMON_STRUCTURE}`,
  },
];


// =============================================================================
// | 6. TREND ANALYSIS (Exploring Current & Future Developments)               |
// =============================================================================
const trendAnalysisTemplates = [
  {
    system: `You are a trend analyst who identifies and explains emerging tech patterns.`,
    user: `Write a trend analysis article about "The Rise of AI-Powered Code Assistants like GitHub Copilot." Use a compelling title. Cover the latest developments, the productivity impact on developers, and the strategic implications for the software industry.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a futurist who interprets current signals to predict upcoming developments.`,
    user: `Create a forward-looking trends report on "The Future of Spatial Computing Beyond the Apple Vision Pro." Use a future-focused title. Analyze current momentum in the market, predict potential breakthrough applications in work and entertainment, and provide insights for early adopters.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a technology scout who identifies emerging innovations.`,
    user: `Write a technology trends article about the breakthrough potential of "Solid-State Batteries" in consumer electronics. Use a tech-focused title like "The Game Changer for Gadgets." Explore the cutting-edge science, adoption challenges, and a timeline prediction for their appearance in smartphones and laptops.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an innovation tracker monitoring developments in sustainable tech.`,
    user: `Create an innovation trends article on "Right to Repair Legislation" and its impact on consumer tech giants. Use a title like "The Repair Revolution." Highlight recent policy changes, how companies are responding, and what it means for the future of product design and longevity.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a market researcher tracking consumer behavior shifts in digital privacy.`,
    user: `Develop a market trends analysis for "The Shift Towards Privacy-Focused Search Engines" like DuckDuckGo. Use an insightful title. Feature data on consumer preference shifts, the industry disruptions caused for Google, and the growth opportunities for privacy-centric tech.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a cultural observer tracking the intersection of tech and society.`,
    user: `Create a cultural trends analysis on "The Decline of Social Media and the Rise of Niche Online Communities" like Discord. Use a cultural title like "The New Digital Campfire." Examine the social changes driving this, and its impact on how people connect online.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a strategic forecaster helping organizations prepare for the future.`,
    user: `Write a strategic trends forecast on "The Impact of Quantum Computing on Current Encryption Standards." Use a strategic title like "Preparing for Q-Day." Include scenario planning, risk assessment for businesses, and the race to develop quantum-resistant cryptography.${COMMON_STRUCTURE}`,
  },
];

// Add more templates to each array to reach the ~200 count. The examples above provide the structure.
// Continue adding specific, narrow topics to each category:
// Beginner Guides: "Intro to SQL," "What is an Operating System?"
// Best-Of: "Best Webcams for Streaming," "Best External Hard Drives for Mac."
// How-To: "How to Build a Raspberry Pi Media Center," "How to Set Up a VPN on Your Router."
// Comparison: "iPhone vs. Pixel Camera Comparison," "Windows 11 vs. macOS."
// Review: "Review of the Steam Deck," "A Deep Dive into the Notion App."
// Trend Analysis: "The Future of Edge Computing," "The Growth of Open-Source AI."
// You can easily expand each section to 30-40 prompts each.

/**
 * Picks a random template object from an array of templates.
 * @param {Array<Object>} arr The array of template objects.
 * @returns {Object} A randomly selected template object.
 */
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Combines all template arrays into a single master array.
 */
function getAllTemplates() {
  return [
    ...beginnerGuideTemplates,
    ...bestOfTemplates,
    ...howToTemplates,
    ...comparisonTemplates,
    ...reviewTemplates,
    ...trendAnalysisTemplates,
  ];
}


/**
 * Builds a complete prompt by picking a random template from all available types
 * and replacing the placeholder with the category name.
 * @param {string} categoryName The name of the category (e.g., "Technology").
 * @returns {Object} An object with 'system' and 'user' prompt strings.
 */
export function buildPrompt(categoryName) {
  // Combine all templates into one array to pick randomly from all types
  const allTemplates = getAllTemplates();
  const tpl = pickRandom(allTemplates);

  // This function is illustrative; in your system, you might not need to replace
  // the category placeholder since these are already specific to Technology.
  const replace = (str) => str.replace(/\{\{CATEGORY}}/g, categoryName);
  
  return {
    system: replace(tpl.system),
    user: replace(tpl.user),
  };
}

export default { buildPrompt, getAllTemplates };