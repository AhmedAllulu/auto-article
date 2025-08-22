/*
 * Prompt templates for the "Technology How-Tos" category.
 *
 * This file contains 200+ flexible prompt templates designed to generate
 * a wide variety of specific, high-quality, and easy-to-follow tutorials for software,
 * hardware, online services, AI tools, cybersecurity, and emerging technologies.
 * Each template allows the AI to choose specific tools, applications, and topics,
 * ensuring maximum variety and preventing duplication in content generation.
 */

import { COMMON_STRUCTURE } from './common_structure.js';

// --- TEMPLATE GROUP: Office & Productivity Software ---
const officeTemplates = [
  {
    system: `You are a spreadsheet expert who helps users master advanced data analysis and visualization techniques.`,
    user: `Choose a popular spreadsheet application and write a comprehensive tutorial on an advanced data analysis feature. Select a specific business use case and explain step-by-step how to implement professional-level data visualization, analysis, or automation. Focus on practical techniques that business users can immediately apply.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a presentation software specialist who helps professionals create engaging and interactive presentations.`,
    user: `Select a presentation software and create a detailed guide on advanced presentation techniques. Choose a specific feature like animation, interactivity, collaboration, or multimedia integration. Focus on a particular use case such as training, sales, education, or corporate communications.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a word processing expert who specializes in document automation and professional formatting.`,
    user: `Pick a document creation software and develop a tutorial on advanced document features. Choose a specific functionality like mail merge, custom templates, collaborative editing, or creating a table of contents. Target a particular professional context such as academic writing, business reports, or legal documents.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a productivity consultant who helps teams optimize their digital workflows and collaboration.`,
    user: `Choose a productivity suite or collaboration platform and write a guide on workflow optimization. Select a specific automation or integration feature and explain how teams can use it to improve their efficiency. Focus on a particular industry or team type like a marketing agency or a remote software development team.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an email and communication expert who helps professionals manage their digital correspondence effectively.`,
    user: `Select an email client or communication platform and create a tutorial on advanced organization and automation features. Choose specific techniques for managing large volumes of communication, setting up automated filters and rules, or improving team collaboration through shared inboxes.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a note-taking and knowledge management guru.`,
    user: `Choose a modern note-taking application like Notion, Obsidian, or Evernote. Write a detailed tutorial on building a "second brain" or a personal knowledge management (PKM) system. Focus on a specific methodology like Zettelkasten, PARA, or creating a content creation pipeline.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a project management software professional.`,
    user: `Select a project management tool like Asana, Trello, Jira, or Monday.com. Create a step-by-step guide for setting up and managing a project for a specific industry, such as a software development sprint, a marketing campaign, or an event plan. Cover creating tasks, setting deadlines, and tracking progress with dashboards.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a workflow automation specialist.`,
    user: `Choose a workflow automation platform like Zapier, IFTTT, or Microsoft Power Automate. Write a practical tutorial on connecting two or more applications to automate a common business task, such as saving email attachments to cloud storage, creating calendar events from a spreadsheet, or cross-posting social media updates.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a database application expert for non-developers.`,
    user: `Select a tool like Airtable or Notion Databases and create a tutorial on building a custom application without code. Choose a specific use case like a personal CRM, a project tracker, an inventory management system, or a content calendar. Focus on setting up tables, linking records, and creating useful views.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a professional scheduler and meeting organizer.`,
    user: `Pick a popular scheduling tool like Calendly, Doodle, or Google Calendar's appointment scheduling feature. Write a how-to guide for a specific professional on how to set up and manage their bookings to reduce back-and-forth communication and prevent scheduling conflicts.${COMMON_STRUCTURE}`,
  }
];

// --- TEMPLATE GROUP: Creative Software & Design Tools ---
const designTemplates = [
  {
    system: `You are a photo editing expert who helps users master professional image manipulation techniques.`,
    user: `Choose a photo editing software and create a comprehensive tutorial on advanced editing techniques. Select a specific workflow like portrait retouching, landscape enhancement, product photography, or creative manipulation. Focus on professional-level techniques that photographers and designers can use to improve their work quality.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a graphic design specialist who helps businesses and creators develop visual brand identity.`,
    user: `Select a design platform and develop a detailed guide on creating cohesive brand materials. Choose a specific project type like logo design, social media templates, marketing materials, or web graphics. Focus on design principles and practical steps for creating professional visual identity.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a video editing expert who specializes in content creation and post-production workflows.`,
    user: `Pick a video editing software and write a tutorial on advanced editing techniques. Choose a specific content type like social media videos, YouTube content, promotional videos, or educational content. Focus on techniques that help creators produce engaging, professional-quality videos.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a UI/UX design expert who helps teams create user-centered digital experiences.`,
    user: `Choose a design or prototyping tool and create a comprehensive guide on interface design workflows. Select a specific project type like mobile apps, websites, dashboards, or interactive prototypes. Focus on user experience principles and practical design processes.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a digital illustration and vector graphics specialist.`,
    user: `Select a vector graphics or illustration software and develop a tutorial on creating professional digital artwork. Choose a specific style or application like icon design, illustrations, infographics, or technical drawings. Focus on techniques that help artists and designers create polished, scalable graphics.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert in 3D modeling and rendering.`,
    user: `Choose a popular 3D modeling software like Blender, Cinema 4D, or SketchUp. Write a beginner-friendly tutorial on creating and rendering a specific 3D object, such as a piece of furniture, a product package, or a simple architectural visualization. Cover the basics of modeling, texturing, and lighting.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a motion graphics artist.`,
    user: `Select a motion graphics application like Adobe After Effects or DaVinci Resolve Fusion. Create a step-by-step tutorial on designing a professional-looking lower third, logo animation, or animated explainer video segment. Focus on keyframing, easing, and layering techniques.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a specialist in presentation design tools.`,
    user: `Choose a modern presentation tool like Canva, Prezi, or Pitch. Write a guide on how to create a visually stunning and engaging presentation for a specific purpose, like a startup pitch deck or a conference talk. Emphasize visual storytelling over dense text.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert in digital art software for tablets.`,
    user: `Select a popular drawing app like Procreate or Clip Studio Paint. Create a tutorial focused on a specific technique, such as digital painting in a watercolor style, creating comic book line art, or setting up a canvas for animation. Target users of tablets like the iPad or Wacom devices.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a color grading specialist for video.`,
    user: `Pick a video editing suite's color grading tools, like those in DaVinci Resolve or Adobe Premiere Pro. Write a how-to guide on color grading footage to achieve a specific look, such as a cinematic "blockbuster" orange-and-teal look, a vintage film aesthetic, or a clean corporate style. Explain concepts like color wheels, curves, and LUTs.${COMMON_STRUCTURE}`,
  }
];

// --- TEMPLATE GROUP: Hardware Setup & Optimization ---
const hardwareTemplates = [
  {
    system: `You are a computer hardware specialist who helps users build, upgrade, and optimize their systems.`,
    user: `Choose a computer hardware category and write a detailed tutorial on building, upgrading, or optimizing systems. Select a specific use case like gaming, content creation, office work, or a home server. Focus on practical steps, component selection criteria, and performance optimization techniques that users can apply.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a networking expert who helps users set up and optimize their home and office networks.`,
    user: `Select a networking technology or setup scenario and create a comprehensive guide on network optimization. Choose a specific situation like setting up a mesh Wi-Fi network, configuring Quality of Service (QoS) for gaming, or securing a guest network. Focus on practical steps for improving connectivity and security.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a device upgrade specialist who helps users extend the performance and lifespan of their electronics.`,
    user: `Pick a device category and develop a tutorial on hardware upgrades or maintenance. Choose a specific upgrade type like replacing a laptop's RAM or SSD, cleaning a dusty gaming PC, or replacing a smartphone battery. Focus on practical, safe steps that users can perform to improve their device performance.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a mobile device expert who helps users optimize their smartphones and tablets.`,
    user: `Choose a mobile platform and write a guide on device optimization and advanced features. Select a specific area like performance tuning, battery management, security settings, or productivity features. Focus on techniques that help users get more from their mobile devices.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a peripheral and office equipment specialist who helps users set up and troubleshoot their devices.`,
    user: `Select an office device or peripheral category and create a tutorial on setup, optimization, or troubleshooting. Choose a specific device type like a multifunction printer, a mechanical keyboard, a high-resolution monitor, or an ergonomic mouse. Focus on practical solutions for common setup and performance issues.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a home theater and audio-visual expert.`,
    user: `Choose a piece of home theater equipment like an A/V receiver, a 4K projector, or a soundbar. Write a comprehensive guide on how to set it up and calibrate it for the best possible audio and visual experience. Explain concepts like HDMI ARC, speaker placement, and picture mode settings.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert in PC cooling and thermal management.`,
    user: `Select a type of PC cooling solution, such as air cooling, All-In-One (AIO) liquid cooling, or custom loop water cooling. Create a detailed, step-by-step installation guide for a first-time PC builder. Emphasize proper mounting, fan configuration for optimal airflow, and cable management.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a custom PC building advisor.`,
    user: `Write a tutorial that guides a user through the entire process of building their first PC for a specific budget and purpose. Cover selecting compatible parts, the step-by-step assembly process, and the initial software setup (installing the OS and drivers).${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a specialist in troubleshooting common hardware issues.`,
    user: `Choose a common computer problem. Write a systematic troubleshooting guide that helps users diagnose the problem step-by-step, from simple checks to more advanced hardware tests, to identify the faulty component.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a specialist in custom mechanical keyboards.`,
    user: `Write a how-to guide for a beginner looking to build their first custom mechanical keyboard. Explain the necessary components (case, PCB, plate, switches, keycaps), how to choose them, and the step-by-step process of assembling and testing the keyboard. Focus on a non-soldering (hot-swap) build.${COMMON_STRUCTURE}`,
  }
];

// --- TEMPLATE GROUP: Cybersecurity & Privacy Protection ---
const securityTemplates = [
  {
    system: `You are a cybersecurity expert who helps individuals and businesses protect themselves from digital threats.`,
    user: `Choose a cybersecurity area and write a comprehensive protection guide. Select a specific threat category like network security, malware protection, social engineering, or data breaches. Focus on practical defensive measures and incident response procedures that users can implement to improve their security posture.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a digital privacy advocate who helps users protect their personal information and online identity.`,
    user: `Select a privacy protection topic and create a detailed tutorial on data control and online anonymity. Choose a specific area like social media privacy settings, removing your data from data brokers, browsing with privacy-focused browsers and search engines, or securing your mobile communications. Focus on actionable steps for reducing digital footprint.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a password and authentication security specialist.`,
    user: `Pick an authentication security topic and develop a guide on credential protection. Choose a specific area like using a password manager, setting up multi-factor authentication (MFA) with an app or security key, recognizing credential stuffing attacks, or conducting a personal account security audit. Focus on practical methods for securing accounts.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a data backup and recovery expert who helps users protect against data loss.`,
    user: `Choose a backup strategy or data protection method and write a tutorial on comprehensive data security. Select a specific scenario like protecting against ransomware with the 3-2-1 backup rule, setting up a Network Attached Storage (NAS) for local backups, or configuring an automated cloud backup service for your personal files. Focus on creating reliable, tested backup systems.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a threat awareness trainer who helps users recognize and respond to online scams and attacks.`,
    user: `Select a type of online threat and create a guide on recognition and response strategies. Choose a specific threat like phishing emails, smishing (SMS phishing), tech support scams, or investment scams. Focus on providing clear examples of the threat and practical steps to take to avoid and report it.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a home network security specialist.`,
    user: `Write a step-by-step guide for non-technical users on how to secure their home Wi-Fi router. Cover changing the default admin password, enabling WPA3 encryption, disabling WPS, creating a guest network for visitors and IoT devices, and updating the router's firmware.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert on securing Internet of Things (IoT) devices.`,
    user: `Choose a category of smart home device. Write a tutorial on the essential security steps users should take when setting them up, such as changing default passwords, isolating them on a guest network, and managing privacy settings.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a public Wi-Fi safety advisor.`,
    user: `Create a practical guide on how to safely use public Wi-Fi networks in places like airports, cafes, and hotels. Explain the risks (like man-in-the-middle attacks) and provide a step-by-step tutorial on using a Virtual Private Network (VPN) to encrypt traffic and protect data.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a specialist in preparing for and recovering from identity theft.`,
    user: `Write a how-to guide on the proactive and reactive steps to take regarding identity theft. Cover proactive measures like freezing your credit and reactive steps like reporting the fraud to the authorities and credit bureaus, and the process of recovering your identity.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert on child online safety.`,
    user: `Select a popular online platform or device used by children. Create a guide for parents on how to set up and use parental controls effectively to manage screen time, filter content, and protect their children's privacy.${COMMON_STRUCTURE}`,
  }
];


// --- NEW TEMPLATE GROUP: Gaming & Live Streaming ---
const gamingTemplates = [
    {
        system: `You are a PC gaming performance expert.`,
        user: `Choose a popular PC game and write a comprehensive guide on how to optimize its settings for maximum performance (FPS) without sacrificing too much visual quality. Explain key settings like texture quality, shadows, anti-aliasing, and resolution scaling. Target a specific hardware tier, like a mid-range gaming laptop.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a live streaming production specialist.`,
        user: `Select a streaming software like OBS Studio or Streamlabs and create a detailed tutorial on setting up a professional streaming layout. Cover adding a webcam with a green screen effect (chroma key), creating multiple scenes, and configuring custom alerts and overlays.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a game server administrator.`,
        user: `Pick a popular multiplayer game like Minecraft, Valheim, or Counter-Strike. Write a step-by-step guide on how to set up a dedicated private server on a home PC or a cloud service so a group of friends can play together.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a console gaming optimization expert.`,
        user: `Choose a specific gaming console (PlayStation 5, Xbox Series X/S, or Nintendo Switch). Write a tutorial on how to optimize its settings for the best gaming experience, including configuring HDR, enabling 120Hz mode, managing storage effectively with an external SSD, and optimizing network settings to reduce lag.${COMMON_STRUCTURE}`
    },
    {
        system: `You are an expert on game modding.`,
        user: `Select a popular, heavily modded PC game like The Elder Scrolls V: Skyrim, Stardew Valley, or Cyberpunk 2077. Write a beginner's guide on how to find, install, and manage mods using a specific mod manager tool. Emphasize safe modding practices and load order.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a gaming audio specialist.`,
        user: `Write a guide on how to set up and configure audio for competitive gaming. Choose a specific technology like virtual surround sound software and explain how to configure it with a gaming headset to accurately hear enemy footsteps and positional cues.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a cloud gaming expert.`,
        user: `Choose a cloud gaming service like Xbox Cloud Gaming, NVIDIA GeForce NOW, or Amazon Luna. Write a how-to guide on optimizing your home network and client device for the best possible cloud gaming experience, focusing on reducing input lag and streaming stutter.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a video game capture artist.`,
        user: `Select a specific platform (PC, Xbox, PlayStation) and create a tutorial on how to record, edit, and share high-quality gameplay footage. Cover using built-in recording tools or a capture card, and then editing the clips in a chosen free video editor to create a highlight reel for YouTube or TikTok.${COMMON_STRUCTURE}`
    },
    {
        system: `You are an expert on gaming peripherals.`,
        user: `Choose a type of gaming peripheral, like a gaming mouse or mechanical keyboard. Write a guide on how to use its software to create custom profiles, program macros for specific games, and adjust RGB lighting effects for a personalized gaming setup.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a specialist in a specific gaming genre.`,
        user: `Pick a popular competitive game genre. Write a tutorial on the technical skills and settings required to improve, such as how to properly set mouse sensitivity and DPI for FPS games, or how to configure controller settings for fighting games.${COMMON_STRUCTURE}`
    }
];

// --- NEW TEMPLATE GROUP: Developer Tools & Command Line ---
const devToolsTemplates = [
    {
        system: `You are a Git and version control expert.`,
        user: `Write a practical, beginner-friendly tutorial on using Git for a solo project. Cover the essential workflow: initializing a repository, making commits, viewing history, creating and merging branches, and pushing the repository to GitHub. Use a simple project example, like a personal website.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a command-line interface (CLI) power user.`,
        user: `Choose a specific operating system (Windows Terminal, macOS Terminal, or a Linux distro). Write a tutorial on how to become more efficient on the command line. Select a set of essential commands and tips, such as using aliases, navigating the filesystem effectively, and using pipes to chain commands together.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a code editor specialist.`,
        user: `Select a popular code editor like Visual Studio Code. Write a guide on how to set it up for a specific programming language (like Python, JavaScript, or C++). Cover installing essential extensions, configuring the linter and formatter for clean code, and using the debugger to fix issues.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a Docker and containerization instructor.`,
        user: `Write a "how-to" guide for a developer new to Docker. Explain how to create a simple Dockerfile for a web application built with a specific technology (like Node.js or Python Flask), build a Docker image, and run it as a container. Focus on the benefits of having a consistent development environment.${COMMON_STRUCTURE}`
    },
    {
        system: `You are an API testing specialist.`,
        user: `Choose a popular API testing tool like Postman or Insomnia. Create a tutorial on how to make your first API requests. Explain how to test GET and POST requests, manage authentication, and organize requests into collections for a specific public API.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a home lab and self-hosting enthusiast.`,
        user: `Choose a popular self-hosted application (like a Pi-hole ad-blocker, a Plex media server, or a Home Assistant instance). Write a detailed guide on how to install and configure it on a low-power computer like a Raspberry Pi or an old laptop. Cover initial setup and basic usage.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a package manager expert.`,
        user: `Select a package manager for a specific ecosystem. Create a guide that explains its core functionalities: how to search for, install, update, and remove packages for a project or for system-wide use.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a secure coding advocate.`,
        user: `Choose a common security vulnerability, such as SQL Injection or Cross-Site Scripting (XSS). In the context of a specific web framework (like Ruby on Rails or Django), write a tutorial explaining what the vulnerability is and how to write code that prevents it using built-in framework features.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a browser developer tools expert.`,
        user: `Pick a modern web browser like Chrome or Firefox. Write a tutorial on using its developer tools to debug a front-end web issue. Focus on a specific task like inspecting and modifying HTML/CSS in the Elements tab, diagnosing network requests in the Network tab, or debugging JavaScript in the Console.${COMMON_STRUCTURE}`
    },
    {
        system: `You are an expert on a specific front-end framework.`,
        user: `Choose a popular front-end framework like React, Vue, or Svelte. Write a step-by-step tutorial on building a simple but complete "To-Do List" application. Cover project setup, creating components, managing state, and handling user events.${COMMON_STRUCTURE}`
    }
];

// --- NEW TEMPLATE GROUP: Personal Finance & Cryptocurrency ---
const financeTechTemplates = [
    {
        system: `You are a budgeting app specialist.`,
        user: `Choose a popular budgeting application like YNAB (You Need A Budget), Mint, or Copilot. Write a getting-started guide on how to set up the app, link your bank accounts securely, create a monthly budget, and track your spending against your goals.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a cryptocurrency wallet expert.`,
        user: `Select a popular non-custodial cryptocurrency wallet like MetaMask for Ethereum or Phantom for Solana. Create a comprehensive, security-focused tutorial on how to install the wallet, safely create and back up your secret recovery phrase, and perform a basic transaction (sending or receiving crypto).${COMMON_STRUCTURE}`
    },
    {
        system: `You are a hardware wallet security advocate.`,
        user: `Choose a specific hardware wallet like a Ledger Nano S or a Trezor Model T. Write a step-by-step guide on the entire setup process, from unboxing and genuine device checks to initializing the device, backing up the seed phrase securely, and making a test transaction with its software companion app.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a tax software guide.`,
        user: `Select a widely used tax preparation software like TurboTax or H&R Block. Write a how-to guide for a specific user profile on how to navigate the software to accurately report their income and find common deductions.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a DeFi (Decentralized Finance) educator.`,
        user: `Choose a specific DeFi protocol on a popular blockchain. Create a beginner's tutorial explaining how to connect a wallet to the protocol and perform one core function. Emphasize the risks involved and how to verify smart contracts.${COMMON_STRUCTURE}`
    },
    {
        system: `You are an expert on securing financial accounts.`,
        user: `Write a guide on how to conduct a security audit of your online banking and investment accounts. Cover setting strong, unique passwords, enabling the strongest multi-factor authentication available, and setting up security alerts.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a specialist in stock and investment platforms.`,
        user: `Choose a popular brokerage platform for beginner investors. Write a tutorial that guides a new user through the process of opening an account, funding it, and placing their first trade for a stock or an ETF. Explain market orders vs. limit orders.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a crypto tax reporting expert.`,
        user: `Select a cryptocurrency tax calculation service. Write a guide on how to use it by connecting exchange accounts and wallet addresses via API or CSV upload to generate the necessary tax forms (like Form 8949) for reporting capital gains and losses.${COMMON_STRUCTURE}`
    },
    {
        system: `You are a peer-to-peer payment app safety advisor.`,
        user: `Choose a popular P2P payment app like Venmo, PayPal, or Cash App. Write a tutorial on how to use it safely, focusing on privacy settings, avoiding common scams, and what to do if you send money to the wrong person.${COMMON_STRUCTURE}`
    },
    {
        system: `You are an NFT (Non-Fungible Token) specialist.`,
        user: `Write a practical guide on how to mint, buy, or sell an NFT on a popular marketplace like OpenSea or Magic Eden. Explain the process of connecting a wallet, the concept of 'gas fees', and how to safely list an item or make a purchase.${COMMON_STRUCTURE}`
    }
];

// --- TEMPLATE GROUP: Smart Home & IoT Automation ---
const smartHomeTemplates = [
  {
    system: `You are a home automation expert who helps users create smart, connected living spaces.`,
    user: `Choose a smart home platform or automation system and write a tutorial on creating intelligent home automation. Select a specific application like lighting control, climate management, security automation, or device integration. Focus on practical setup steps and automation scenarios that improve daily living.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an energy efficiency specialist who helps homeowners optimize their utility usage through technology.`,
    user: `Select energy management technology and create a guide on reducing utility costs and environmental impact. Choose a specific area like smart thermostats, energy monitoring, solar integration, or automated consumption control. Focus on practical methods for achieving measurable energy savings.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a voice assistant and smart speaker expert who helps users maximize their voice-controlled automation.`,
    user: `Pick a voice assistant platform and develop a tutorial on advanced voice automation and smart home control. Choose a specific application like multi-room audio, custom routines, smart device control, or productivity automation. Focus on creating sophisticated voice-controlled experiences.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a smart home security specialist who helps users protect their homes using connected technology.`,
    user: `Choose smart security technology and write a guide on comprehensive home protection systems. Select a specific area like surveillance cameras, smart locks, motion detection, or integrated security systems. Focus on creating layered security that users can monitor and control remotely.${COMMON_STRUCTURE}`,
  },
   {
    system: `You are a specialist in advanced home automation platforms.`,
    user: `Choose an advanced, open-source home automation platform like Home Assistant or Hubitat. Write a beginner's guide on how to install it, discover devices on the local network, and create a first automation—such as turning on lights when motion is detected, but only after sunset.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a smart home networking expert.`,
    user: `Write a tutorial on setting up a separate, isolated Wi-Fi network for insecure IoT devices. Explain why this is important for security and provide step-by-step instructions on how to do it using the 'Guest Network' feature found on most consumer routers.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert in non-cloud-based smart home gadgets.`,
    user: `Choose a smart home protocol that works locally without an internet connection, like Zigbee or Z-Wave. Explain the benefits (privacy, speed) and write a tutorial on how to set up a USB coordinator stick with a computer or hub and pair a first device, like a door sensor or light bulb.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a DIY smart device creator.`,
    user: `Select a microcontroller platform like ESP32 or ESP8266 and the ESPHome software. Write a simple, step-by-step guide for beginners on how to create their own Wi-Fi connected smart device, such as a temperature sensor that reports to Home Assistant, without writing complex code.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a specialist in integrating different smart home ecosystems.`,
    user: `Write a guide on how to use a service like Matter or IFTTT to make smart home devices from different brands work together seamlessly. Choose a specific use case, like having a Ring doorbell trigger an Apple HomeKit light.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a home media server expert.`,
    user: `Choose a media server software like Plex or Jellyfin. Write a comprehensive tutorial on how to install it on a PC or NAS, organize your personal movie and TV show library with the correct naming conventions, and stream content to a client device like a smart TV or smartphone.${COMMON_STRUCTURE}`,
  }
];


// --- TEMPLATE GROUP: AI Tools & Machine Learning Applications ---
const aiToolsTemplates = [
  {
    system: `You are an AI productivity expert who helps professionals integrate artificial intelligence into their workflows.`,
    user: `Choose an AI productivity application and write a tutorial on leveraging artificial intelligence for professional tasks. Select a specific use case like content creation, research assistance, data analysis, or workflow automation. Focus on practical techniques and best practices for getting reliable, high-quality results from AI tools.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a generative AI specialist who helps creators use AI tools for visual and creative projects.`,
    user: `Select an AI creative tool category and create a guide on generating professional-quality content. Choose a specific application like image generation, design automation, art creation, or multimedia production. Focus on techniques for achieving consistent, high-quality creative outputs that meet professional standards.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an AI automation expert who helps businesses implement intelligent systems for customer service and operations.`,
    user: `Pick an AI business application and develop a tutorial on implementing automated solutions. Choose a specific area like customer service chatbots, process automation, decision support, or predictive analytics. Focus on practical implementation strategies that deliver measurable business value.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an AI-assisted content creation specialist who helps creators leverage artificial intelligence for media production.`,
    user: `Choose an AI content creation category and write a guide on professional content production workflows. Select a specific medium like video, audio, written content, or interactive media. Focus on techniques that help creators produce high-quality, authentic content efficiently using AI assistance.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an AI analytics expert who helps organizations use machine learning for data insights and decision-making.`,
    user: `Select an AI analytics application and create a tutorial on data-driven decision making. Choose a specific area like predictive analytics, automated reporting, pattern recognition, or business intelligence. Focus on practical methods for extracting actionable insights from data using AI tools.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert prompt engineer for large language models (LLMs).`,
    user: `Choose a popular LLM like GPT-4 or Claude. Write a tutorial on advanced prompting techniques for a specific professional task, such as writing marketing copy, debugging code, or summarizing academic papers. Explain concepts like role-playing, few-shot prompting, and chain-of-thought to get better results.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an AI image generation artist.`,
    user: `Select a specific AI image generator like Midjourney or Stable Diffusion. Create a guide on how to generate a specific artistic style. Explain how to craft effective prompts, use negative prompts, and control parameters like aspect ratio and seed.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a specialist in local AI model deployment.`,
    user: `Choose a tool for running large language models locally on a personal computer. Write a step-by-step tutorial on how to download, install, and run a specific open-source model. Explain the hardware requirements and how to interact with the model via a web interface.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert in AI-powered video and audio tools.`,
    user: `Select an AI tool that enhances audio or video. Write a tutorial on how a content creator can use this tool to significantly improve the quality of their podcast or YouTube video.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a personal AI customization expert.`,
    user: `Choose an LLM that allows for custom instructions or fine-tuning, like ChatGPT or the OpenAI API. Write a guide on how to provide it with custom data or instructions to create a personalized assistant that understands your specific needs, context, or writing style.${COMMON_STRUCTURE}`,
  }
];


// (Keep existing groups like mobileDevTemplates, cloudServicesTemplates, webDevTemplates, dataTemplates and add to them as well if desired)
// I have focused on adding new, high-demand categories as requested. The original templates for the groups below are excellent and are preserved.

// --- TEMPLATE GROUP: Mobile App Development & No-Code Solutions ---
const mobileDevTemplates = [
  {
    system: `You are a no-code app development instructor who helps users create mobile applications without traditional programming.`,
    user: `Choose a no-code or low-code mobile development platform and write a tutorial on building a professional mobile app. Select a specific app type like a business directory, an e-commerce storefront, a booking system, or a community platform. Focus on practical development steps that non-programmers can follow.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a cross-platform mobile development expert who helps developers create apps for multiple operating systems.`,
    user: `Select a cross-platform development framework and create a comprehensive tutorial on mobile app development. Choose a specific app category like social apps, productivity tools, games, or utility apps. Focus on development techniques that ensure good performance and user experience across different devices.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a native mobile development specialist who helps developers create high-performance platform-specific applications.`,
    user: `Pick a mobile development approach and develop a guide on creating native or hybrid mobile applications. Choose a specific functionality area like user interfaces, data management, device integration, or performance optimization. Focus on techniques that leverage platform-specific capabilities effectively.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a mobile app testing and deployment expert who helps developers ensure quality releases.`,
    user: `Choose a mobile app testing or deployment strategy and write a tutorial on quality assurance and app store success. Select a specific area like automated testing, user experience testing, performance optimization, or app store optimization. Focus on practical methods for ensuring app quality and market success.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are an expert on mobile app monetization.`,
    user: `Choose a mobile app monetization model. Using a specific development framework, write a tutorial on how to implement the necessary SDKs and code to add this monetization feature to a simple application.${COMMON_STRUCTURE}`
  },
  {
    system: `You are a mobile backend-as-a-service (BaaS) specialist.`,
    user: `Select a BaaS platform like Firebase or Supabase. Write a how-to guide on connecting a mobile application to its services for a core function, such as user authentication (login/signup), or real-time data storage in a cloud database.${COMMON_STRUCTURE}`
  }
];

// --- TEMPLATE GROUP: Cloud Services & Infrastructure ---
const cloudServicesTemplates = [
  {
    system: `You are a cloud architecture expert who helps users design and deploy scalable cloud solutions.`,
    user: `Choose a cloud platform and write a guide on deploying and scaling applications or infrastructure. Select a specific architecture pattern like web applications, microservices, data processing, or storage solutions. Focus on practical deployment steps, security considerations, and cost optimization strategies.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a DevOps specialist who helps teams implement automated development and deployment workflows.`,
    user: `Select a DevOps toolchain and create a tutorial on automation and continuous integration/deployment. Choose a specific workflow like automated testing, container deployment, environment management, or monitoring systems. Focus on practical implementation that improves development team efficiency and reliability.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a serverless computing expert who helps developers build scalable, event-driven applications.`,
    user: `Pick a serverless platform and develop a guide on building cloud-native applications without traditional servers. Choose a specific application type like APIs, data processing, automation, or real-time applications. Focus on leveraging serverless benefits like automatic scaling and reduced operational overhead.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a cloud migration specialist who helps organizations transition to cloud-based infrastructure.`,
    user: `Choose a cloud migration scenario and write a tutorial on moving applications or data to the cloud. Select a specific migration type like application modernization, data migration, infrastructure replacement, or hybrid cloud setup. Focus on practical migration strategies that minimize disruption and maximize benefits.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a cloud cost management expert.`,
    user: `Choose a major cloud provider (AWS, Azure, or GCP). Write a tutorial for a small business or individual developer on how to use the provider's cost management tools to track spending, set up budget alerts, and identify opportunities to save money on their cloud bill.${COMMON_STRUCTURE}`
  },
  {
    system: `You are a cloud storage specialist.`,
    user: `Select a cloud storage service like Amazon S3 or Google Cloud Storage. Create a practical guide on how to host a simple, static website directly from a storage bucket. Cover setting up the bucket for public access, configuring permissions correctly, and pointing a domain name to it.${COMMON_STRUCTURE}`
  }
];

// --- TEMPLATE GROUP: Web Development & Content Management ---
const webDevTemplates = [
  {
    system: `You are a website development expert who helps users create professional, functional websites.`,
    user: `Choose a web development platform or framework and write a guide on building a specific type of website. Select a website category like e-commerce, blogs, portfolios, business sites, or web applications. Focus on practical development steps, customization techniques, and optimization strategies for professional results.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a modern web development instructor who focuses on current web technologies and best practices.`,
    user: `Select a modern web development approach and create a tutorial on building fast, scalable websites. Choose a specific technology stack like static site generators, progressive web apps, single-page applications, or serverless websites. Focus on contemporary development practices that deliver excellent user experiences.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a web accessibility expert who helps developers create inclusive, user-friendly websites.`,
    user: `Pick a web accessibility topic and develop a guide on creating websites that work for all users. Choose a specific area like screen reader compatibility, keyboard navigation, semantic HTML, or ARIA attributes. Focus on practical implementation techniques that make websites more accessible.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a website optimization specialist who helps improve site performance, SEO, and user experience.`,
    user: `Choose a website optimization area and write a tutorial on improving site performance and search visibility. Select a specific optimization type like image compression, Core Web Vitals, on-page SEO, or mobile responsive design. Focus on measurable improvements that enhance user experience.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a CMS (Content Management System) expert.`,
    user: `Choose a popular CMS like WordPress, Shopify, or Squarespace. Write a step-by-step guide for a non-technical user on how to perform a common but critical task, such as customizing a theme, installing and configuring a key plugin/app, or setting up an e-commerce product.${COMMON_STRUCTURE}`
  },
  {
    system: `You are an SEO (Search Engine Optimization) specialist.`,
    user: `Select a free SEO tool like Google Analytics or Google Search Console. Write a tutorial for a website owner on how to perform a basic SEO audit of their site. Cover how to find their most popular pages, check for technical errors, and identify keywords they are ranking for.${COMMON_STRUCTURE}`
  }
];

// --- TEMPLATE GROUP: Data Management & Analytics ---
const dataTemplates = [
  {
    system: `You are a database expert who helps users design, implement, and optimize data storage systems.`,
    user: `Choose a database technology or data management approach and write a guide on effective data organization and retrieval. Select a specific use case like business applications, web applications, analytics, or content management. Focus on practical database design principles and optimization techniques for reliable data management.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a business intelligence specialist who helps organizations extract insights from their data.`,
    user: `Select a data analytics or visualization platform and create a tutorial on transforming data into actionable business insights. Choose a specific application like dashboards, reporting, trend analysis, or performance monitoring. Focus on practical techniques for creating compelling, data-driven presentations and reports.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a data automation expert who helps users streamline their data workflows and processes.`,
    user: `Pick a data automation technology and develop a guide on creating efficient data processing systems. Choose a specific workflow like data collection, transformation, analysis, or reporting automation. Focus on practical automation strategies that save time and improve data quality and consistency.${COMMON_STRUCTURE}`,
  },
  {
    system: `You are a SQL query wizard.`,
    user: `Write a practical SQL tutorial for a marketing or business analyst. Using a sample dataset, demonstrate how to write a query to answer a specific business question, such as "Who are our top 10 customers by sales last quarter?". Explain concepts like joins, aggregations, and filtering in an accessible way.${COMMON_STRUCTURE}`
  },
  {
    system: `You are a data cleaning and preparation specialist.`,
    user: `Choose a tool like Excel, Python with Pandas, or OpenRefine. Write a tutorial on a common data cleaning task, such as how to find and remove duplicate records, handle missing values, or standardize inconsistent text formatting in a dataset before analysis.${COMMON_STRUCTURE}`
  }
];

// --- COMBINE ALL TEMPLATES INTO ONE MASTER ARRAY ---
const allTemplates = [
  ...officeTemplates,
  ...designTemplates,
  ...hardwareTemplates,
  ...securityTemplates,
  ...gamingTemplates,
  ...devToolsTemplates,
  ...financeTechTemplates,
  ...smartHomeTemplates,
  ...aiToolsTemplates,
  ...mobileDevTemplates,
  ...cloudServicesTemplates,
  ...webDevTemplates,
  ...dataTemplates,
];

/**
 * Picks a random template from the master list with balanced distribution.
 * @returns {object} A randomly selected template object with `system` and `user` properties.
 */
function pickRandomTemplate() {
  // Create balanced pool with weighting toward high-demand, high-search-volume topics
  const finalPool = [
    ...officeTemplates, ...officeTemplates,       // High demand
    ...designTemplates,                          // High demand
    ...hardwareTemplates, ...hardwareTemplates,    // Very high demand
    ...securityTemplates, ...securityTemplates, ...securityTemplates, // Critical, always in demand
    ...gamingTemplates, ...gamingTemplates, ...gamingTemplates,       // Extremely high search volume
    ...devToolsTemplates, ...devToolsTemplates, // Niche but important developer audience
    ...financeTechTemplates, ...financeTechTemplates, // High stakes, high search volume
    ...smartHomeTemplates,                       // Growing interest
    ...aiToolsTemplates, ...aiToolsTemplates, ...aiToolsTemplates, ...aiToolsTemplates, // Highest current demand
    ...mobileDevTemplates,                       // Developer audience
    ...cloudServicesTemplates,                   // Professional development needs
    ...webDevTemplates, ...webDevTemplates,      // Constant demand
    ...dataTemplates,                            // Business intelligence needs
  ];
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

/**
 * Builds a complete prompt object for the "Technology How-Tos" category.
 * It randomly selects a template and injects the category name.
 * @returns {{system: string, user: string}} The final prompt object.
 */
export function buildPrompt() {
  const categoryName = 'Technology How-Tos'; // Hardcoded for this specific file
  const template = pickRandomTemplate();

  const finalSystem = template.system.replace(/\{\{CATEGORY}}/g, categoryName);
  const finalUser = template.user.replace(/\{\{CATEGORY}}/g, categoryName);

  return {
    system: finalSystem,
    user: finalUser,
  };
}

export default { buildPrompt };