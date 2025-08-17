/*
 * Prompt templates for the "Automotive & Vehicles" category.
 *
 * This file contains over 200 unique and creative prompt templates designed to generate
 * a wide variety of specific, high-quality articles about car buying, maintenance, driving
 * skills, car culture, EVs, motorcycles, off-roading, and more. Each template instructs the
 * AI to choose a narrow sub-topic, ensuring that repeated use of this file still results
 * in unique and valuable content.
 */

import { COMMON_STRUCTURE } from './common_structure.js';

// --- TEMPLATE GROUP: The Driver's Seat (Driving Skills & Car Care) ---
const drivingTemplates = [
  {
    system: `You are a friendly and experienced mechanic who writes clear, confidence-building maintenance guides for absolute beginners.`,
    user: `Write a complete, step-by-step "How-To" guide on ONE specific, basic car maintenance task that any car owner can do at home with simple tools. Choose a task such as checking a fluid, replacing a filter, or changing a bulb. Include a "Tools You'll Need" list and explain why the task is important.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a professional driving instructor who helps people become safer, more confident drivers.`,
    user: `Create a practical guide on how to master ONE specific, challenging driving skill, such as parallel parking, merging onto a highway, or navigating a roundabout. Break down the technique into simple, repeatable steps.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a "car hacks" expert who loves finding clever ways to improve the driving experience.`,
    user: `Write a listicle of 7-10 surprising car hacks for ONE specific purpose. Select a theme such as keeping your car organized, improving fuel efficiency, or making road trips more comfortable.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a car detailing professional.`,
    user: `Develop a definitive guide on how to properly clean ONE specific part of a car for a professional result. Choose a specific area like the wheels, leather seats, or headlights, and outline the steps and products needed.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a specialist in automotive safety and defensive driving.`,
    user: `Write a guide on ONE specific, crucial aspect of defensive driving. Choose a concept like the 'three-second rule', hazard perception techniques, or emergency braking procedures, and explain it clearly for all drivers.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert on driving in extreme weather conditions.`,
    user: `Create a detailed guide on how to drive safely in ONE specific type of hazardous weather, such as heavy snow, dense fog, or torrential rain. Provide practical tips for visibility, speed, and vehicle control.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an automotive detailer specializing in interiors.`,
    user: `Write a detailed how-to guide on tackling ONE specific, difficult interior car cleaning task. Select a problem like removing salt stains, cleaning the headliner, or eliminating stubborn odors, and provide a step-by-step solution.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an eco-driving instructor.`,
    user: `Write a guide explaining 5-7 techniques for "hypermiling" or maximizing the fuel economy of a standard gasoline-powered car through specific driving habits. Focus on actionable tips for daily commuting that can save drivers money on gas.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Buyer's Showroom (Car Buying & Selling) ---
const buyingTemplates = [
  {
    system: `You are a trustworthy and savvy car buying consultant who helps people get the best deal and avoid common pitfalls.`,
    user: `Write a detailed, step-by-step guide to ONE specific, crucial stage of the car-buying process. Choose a single stage like test driving, negotiating the price, or handling the financing and paperwork. Provide practical advice and checklists.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a car financing expert who simplifies the complex world of auto loans.`,
    user: `Create a detailed explainer on ONE specific, often misunderstood car financing topic. Choose a topic like leasing vs. buying, the importance of GAP insurance, or how to get a car loan with a low credit score.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a used car specialist who knows how to spot a great deal and a lemon.`,
    user: `Write a complete guide on how to thoroughly inspect a used car before buying it. Focus on ONE specific area of inspection, such as how to spot signs of a previous accident, check for engine problems, or identify interior wear and tear.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a car selling coach who helps people get the most money for their old vehicle.`,
    user: `Develop a guide to ONE specific aspect of selling a used car to maximize its value. Choose a topic like how to prepare and detail the car for sale, how to write an effective online listing, or how to safely handle a transaction with a private buyer.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an automotive industry insider who understands different purchasing options.`,
    user: `Write an article explaining the pros and cons of ONE specific method for buying a car. Choose from options like buying a Certified Pre-Owned (CPO) vehicle, using a car-buying service, or buying from a private seller.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a financial advisor specializing in auto purchases.`,
    user: `Create a guide on how to calculate the true total cost of ownership (TCO) for a vehicle. Choose a specific class of car, like a pickup truck or a compact SUV, and explain how to factor in depreciation, insurance, fuel, and maintenance costs.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a specialist in vehicle history reports.`,
    user: `Write a guide on how to read and interpret a vehicle history report from a popular service. Explain what specific red flags to look for, such as salvage titles, flood damage, major accidents, or odometer rollbacks, and what they mean for a potential buyer.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert on car insurance.`,
    user: `Write a simple explainer on ONE specific, important aspect of car insurance. Select a single topic like the difference between liability and comprehensive coverage, or how factors like your credit score and driving history affect your premium.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Under the Hood (Technology & Mechanics Explained) ---
const mechanicsTemplates = [
  {
    system: `You are a master mechanic and automotive engineer who can explain complex car systems in a simple, accessible way.`,
    user: `Write a clear "How It Works" explainer on ONE specific, fundamental system in a modern car. Choose a system like the transmission, brakes, or a turbocharger. Use simple analogies and describe the core function without overly technical jargon.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a car diagnostic expert who helps drivers understand what their car is telling them.`,
    user: `Create a helpful guide to understanding ONE specific, common car problem or warning light. Choose a problem such as an overheating engine, a "Check Engine" light, or strange noises from the brakes. Emphasize safety and advise when to see a mechanic.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a tire specialist.`,
    user: `Write a practical guide to understanding and choosing tires. Focus on ONE specific aspect of tire knowledge, such as how to read the codes on a tire's sidewall, the difference between winter and all-season tires, or how to check for proper tread depth.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an engine expert.`,
    user: `Write an article that explains the fundamental differences between two different engine technologies or drivetrain layouts. Select a comparison like AWD vs. 4WD, or diesel vs. gasoline engines, and explain the pros and cons of each.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a maintenance advisor who helps car owners save money.`,
    user: `Create a guide explaining ONE specific, crucial car fluid. Choose a fluid like transmission fluid, brake fluid, or coolant, and explain its purpose, why it's important to check it, and the steps to do so safely.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a master technician specializing in a particular car system.`,
    user: `Write a detailed "How it Works" on ONE complex car system that is not the engine, such as the suspension system, the air conditioning system, or the exhaust system. Explain its components and function in an easy-to-understand way.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an auto diagnostics expert who interprets symptoms.`,
    user: `Write a diagnostic guide for drivers based on ONE specific, non-obvious symptom. Choose a symptom such as a persistent strange smell, a particular color of exhaust smoke, or a specific type of vibration, and explain the common potential causes.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: The Critic's Garage (Reviews & Comparisons) ---
const reviewTemplates = [
  {
    system: `You are a respected car critic, like those from major automotive magazines, who provides unbiased, in-depth reviews.`,
    user: `Write a "Best Of" list for ONE specific, narrow category of vehicles. Choose a clear category like "best third-row SUVs" or "most fuel-efficient commuter cars". For each vehicle on the list, include pros, cons, and who it's best for.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a comparison specialist who helps buyers choose between two direct competitors.`,
    user: `Write a detailed, head-to-head comparison of two specific, popular, directly competing vehicle models. Compare them on key areas like performance, interior comfort, technology, safety, and overall value.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a long-term tester who evaluates cars over thousands of miles.`,
    user: `Write a "1-Year Ownership Review" of ONE specific, popular car model. Go beyond a first-drive review to cover long-term reliability, real-world fuel economy, actual maintenance costs, and what it's like to live with the car day-to-day.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert on a specific niche vehicle category.`,
    user: `Write a buying guide for a niche vehicle segment to help potential buyers understand the market. Choose a category like classic cars, convertibles, or high-performance "sleeper" cars, and explain what to look for.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an automotive product reviewer.`,
    user: `Create a "Best Of" list for ONE specific type of automotive product or accessory. Select a product category like car phone mounts, all-weather floor mats, or car waxes, and review the top options on the market.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a retrospective car critic who looks back at older models.`,
    user: `Write an article titled "The Lasting Appeal Of..." about ONE specific, older car model that is now considered a cult classic. Explain why this particular model has stood the test of time and remains beloved by enthusiasts.${COMMON_STRUCTURE}`,
  },
];


// --- TEMPLATE GROUP: Car Culture & History ---
const cultureTemplates = [
  {
    system: `You are a car enthusiast and historian who tells the stories behind iconic vehicles.`,
    user: `Write a fascinating article on the history and cultural impact of ONE specific, legendary car model. Tell the story of its creation, its significance in its time, and its lasting legacy in the automotive world.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a motorsport journalist.`,
    user: `Create a beginner's guide to understanding ONE specific type of motorsport. Choose a discipline like Formula 1, rally racing, or endurance racing, and explain the basic rules, objectives, and what makes it exciting to watch.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a biographer of automotive legends.`,
    user: `Write a short profile of ONE iconic figure from the automotive world, be it a designer, engineer, or racing driver. Explain their key achievements and their impact on the industry or sport.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a historian of car brands.`,
    user: `Write a brief history of ONE specific, iconic car brand. Detail its origins, the philosophy that drives it, its most important models, and its current place in the automotive landscape.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert on specific automotive subcultures.`,
    user: `Write a simple guide to ONE specific automotive subculture. Choose a scene like the JDM scene, American muscle car culture, or the hot rod scene, and explain its history, values, and key vehicle types.${COMMON_STRUCTURE}`,
  },
];

// --- NEW TEMPLATE GROUP: Electric Vehicles (EVs) & Hybrids ---
const evTemplates = [
    {
        system: `You are an EV evangelist and technology expert who makes electric vehicles easy for anyone to understand.`,
        user: `Write a clear and simple explainer on the basics of owning an EV, aimed at a first-time buyer. Focus on ONE key topic, such as understanding charging levels, coping with range anxiety, or the difference between an EV and a hybrid.${COMMON_STRUCTURE}`
    },
    {
        system: `You are an expert on EV maintenance and ownership costs.`,
        user: `Write an article comparing the maintenance requirements and running costs of an electric vehicle versus a comparable gasoline car. Detail the savings on items like fuel and oil changes, while also explaining battery health and long-term cost considerations.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a specialist in different types of electrified vehicles.`,
        user: `Write an article clearly explaining the differences between the main types of electrified vehicles. Choose to compare Hybrids vs. Plug-in Hybrids (PHEVs), or EVs vs. Hydrogen Fuel Cell vehicles, explaining how each works.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a financial advisor who helps people navigate EV incentives.`,
        user: `Create a guide on how car buyers can find and utilize federal, state, and local financial incentives for purchasing a new or used electric vehicle. Stress the need for buyers to research their specific region for the latest information.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a myth-buster who addresses common EV concerns.`,
        user: `Write an article that debunks 3-5 common myths about electric vehicles. Choose from popular concerns like battery degradation, environmental impact of manufacturing, or the strain on the electric grid.${COMMON_STRUCTURE}`
    },
];

// --- NEW TEMPLATE GROUP: Motorcycles & Powersports ---
const motorcycleTemplates = [
    {
        system: `You are an experienced motorcycle rider and instructor.`,
        user: `Write a comprehensive "Beginner's Guide" for someone interested in getting into motorcycling. Focus on ONE crucial first step, such as how to choose a first motorcycle, the process of getting licensed, or what essential safety gear is needed.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a motorcycle mechanic who provides DIY maintenance tips.`,
        user: `Create a simple, step-by-step guide on how to perform ONE basic motorcycle maintenance task. Choose a common task like cleaning the chain, checking the oil, or preparing the bike for winter storage.${COMMON_STRUCTURE}`
    },
    {
        system: `You are an expert on different types of motorcycles.`,
        user: `Write an explainer on ONE specific category of motorcycle. Choose a type like cruiser, adventure bike, or sport bike, and detail its characteristics, pros, cons, and the type of rider it's best suited for.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a safety expert for powersports vehicles.`,
        user: `Write a guide on the essential safety practices for operating ONE specific type of powersports vehicle, such as an ATV, a jet ski, or a side-by-side. Focus on the most critical rules and pre-ride checks.${COMMON_STRUCTURE}`
    },
];

// --- NEW TEMPLATE GROUP: Off-Roading & Overlanding ---
const offRoadTemplates = [
    {
        system: `You are a seasoned off-roading guide and recovery expert.`,
        user: `Write a beginner's guide to ONE fundamental aspect of off-road driving. Select a topic like airing down tires for traction, the correct use of 4-High and 4-Low, or how to safely navigate a steep hill.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a specialist in 4x4 vehicle modifications.`,
        user: `Create a guide explaining ONE specific, popular off-road modification. Choose an upgrade like a suspension lift kit, off-road tires, or a winch, and describe what it does, its pros and cons, and who needs it.${COMMON_STRUCTURE}`
    },
    {
        system: `You are an overlanding enthusiast and trip planner.`,
        user: `Write a guide on the essential gear needed for vehicle-based overlanding. Focus on ONE specific category of equipment, such as recovery gear, car camping shelters, or a portable kitchen setup.${COMMON_STRUCTURE}`
    },
    {
        system: `You are an off-road driving instructor.`,
        user: `Write a how-to guide on safely traversing ONE specific type of off-road obstacle. Choose a challenging terrain like water crossings, deep sand, or a rocky trail, and explain the proper driving technique.${COMMON_STRUCTURE}`
    },
];

// --- NEW TEMPLATE GROUP: DIY Modifications & Tuning ---
const modsTemplates = [
    {
        system: `You are an experienced DIY mechanic and performance enthusiast.`,
        user: `Write a beginner-friendly, step-by-step guide on how to install ONE common, simple performance modification. Choose an entry-level upgrade like a cold air intake, a cat-back exhaust, or aftermarket wheels. Emphasize safety and the tools needed.${COMMON_STRUCTURE}`
    },
    {
        system: `You are an automotive tuner who explains performance concepts.`,
        user: `Write an explainer on ONE fundamental aspect of car tuning and performance. Choose a topic like what an ECU tune is, the difference between a turbocharger and a supercharger, or how suspension upgrades improve handling.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a cosmetic modification specialist.`,
        user: `Create a how-to guide on ONE popular aesthetic car modification. Select a common project like applying a vinyl wrap to a car part, blacking out chrome trim, or installing a simple aerodynamic piece like a front lip.${COMMON_STRUCTURE}`
    },
];

// --- NEW TEMPLATE GROUP: Road Trips & Automotive Lifestyle ---
const travelTemplates = [
    {
        system: `You are a road trip veteran and travel blogger.`,
        user: `Write a definitive guide on how to prepare a vehicle for a long-distance road trip. Create a comprehensive pre-trip inspection checklist covering mechanical checks, fluid levels, tire condition, and essential emergency supplies.${COMMON_STRUCTURE}`
    },
    {
        system: `You are an automotive historian and travel guide.`,
        user: `Write an article describing ONE of the world's most iconic driving roads. Choose a famous route, describe the scenery and the driving experience, and provide tips for anyone wanting to make the trip.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a car camping and adventure expert.`,
        user: `Create a "how-to" guide for turning a standard SUV, van, or wagon into a comfortable camper for a weekend trip. Cover ideas for a sleeping platform, smart storage solutions, and essential gear for a simple setup.${COMMON_STRUCTURE}`
    },
];


// --- COMBINE ALL TEMPLATES INTO ONE MASTER ARRAY ---
const allTemplates = [
  ...drivingTemplates,
  ...buyingTemplates,
  ...mechanicsTemplates,
  ...reviewTemplates,
  ...cultureTemplates,
  ...evTemplates,
  ...motorcycleTemplates,
  ...offRoadTemplates,
  ...modsTemplates,
  ...travelTemplates,
];

/**
 * Picks a random template from the master list with balanced distribution.
 * @returns {object} A randomly selected template object with `system` and `user` properties.
 */
function pickRandomTemplate() {
  // Weight the randomness to favor the most practical, high-search-volume topics
  const finalPool = [
    ...drivingTemplates, ...drivingTemplates,       // Very high search volume
    ...buyingTemplates, ...buyingTemplates, ...buyingTemplates, // Highest search volume
    ...mechanicsTemplates, ...mechanicsTemplates,   // Very high search volume
    ...reviewTemplates, ...reviewTemplates,
    ...cultureTemplates,
    ...evTemplates, ...evTemplates, ...evTemplates, // Extremely high and growing interest
    ...motorcycleTemplates,
    ...offRoadTemplates,
    ...modsTemplates,
    ...travelTemplates,
  ];
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

/**
 * Builds a complete prompt object for the "Automotive & Vehicles" category.
 * It randomly selects a template and injects the category name.
 * @returns {{system: string, user: string}} The final prompt object.
 */
export function buildPrompt() {
  const categoryName = 'Automotive & Vehicles'; // Hardcoded for this specific file
  const template = pickRandomTemplate();

  const finalSystem = template.system.replace(/\{\{CATEGORY}}/g, categoryName);
  const finalUser = template.user.replace(/\{\{CATEGORY}}/g, categoryName);

  return {
    system: finalSystem,
    user: finalUser,
  };
}

export default { buildPrompt };