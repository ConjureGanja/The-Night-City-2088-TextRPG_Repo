export const GEMINI_MODEL_NAME = 'gemini-2.5-flash-preview-04-17';
export const IMAGEN_MODEL_NAME = 'imagen-3.0-generate-002';

// Character Origins/Lifepaths
export const CHARACTER_ORIGINS = {
  CORPO: 'CORPO',
  STREET_KID: 'STREET_KID',
  NOMAD: 'NOMAD',
};

// Character Roles/Classes
export const CHARACTER_ROLES = {
  SOLO: 'SOLO',
  NETRUNNER: 'NETRUNNER',
  TECHIE: 'TECHIE',
  ROCKERBOY: 'ROCKERBOY',
  FIXER: 'FIXER',
  NOMAD: 'NOMAD',
  MEDIA: 'MEDIA',
  MEDTECH: 'MEDTECH',
  EXEC: 'EXEC',
};

// Character Attributes
export const CHARACTER_ATTRIBUTES = {
  COOL: 'COOL',
  INTELLIGENCE: 'INTELLIGENCE',
  REFLEXES: 'REFLEXES',
  TECHNICAL_ABILITY: 'TECHNICAL_ABILITY',
  BODY: 'BODY',
  EMPATHY: 'EMPATHY',
};

// Character Cybernetic Implant Types
export const CYBERNETIC_IMPLANT_TYPES = {
  CYBERWARE: 'CYBERWARE',
  NEUROWARE: 'NEUROWARE',
  FASHION_IMPLANTS: 'FASHION_IMPLANTS',
  BIOWARE: 'BIOWARE',
  CYBERARMS: 'CYBERARMS',
  CYBERLEGS: 'CYBERLEGS',
};

// Night City Districts
export const NIGHT_CITY_DISTRICTS = {
  CITY_CENTER: 'CITY_CENTER',
  WATSON: 'WATSON',
  WESTBROOK: 'WESTBROOK',
  HEYWOOD: 'HEYWOOD',
  PACIFICA: 'PACIFICA',
  SANTO_DOMINGO: 'SANTO_DOMINGO',
  BADLANDS: 'BADLANDS',
};

// Default character template
export const DEFAULT_CHARACTER = {
  origin: CHARACTER_ORIGINS.STREET_KID,
  role: CHARACTER_ROLES.SOLO,
  attributes: {
    [CHARACTER_ATTRIBUTES.COOL]: 5,
    [CHARACTER_ATTRIBUTES.INTELLIGENCE]: 5,
    [CHARACTER_ATTRIBUTES.REFLEXES]: 5,
    [CHARACTER_ATTRIBUTES.TECHNICAL_ABILITY]: 5,
    [CHARACTER_ATTRIBUTES.BODY]: 5,
    [CHARACTER_ATTRIBUTES.EMPATHY]: 5,
  },
  cybernetics: [],
  inventory: [],
  skills: {},
  background: '',
  appearance: {
    gender: '',
    hairStyle: '',
    hairColor: '',
    eyeColor: '',
    facialFeatures: '',
    clothing: '',
    distinguishingMarks: '',
  }
};

// Factions in Night City
export const FACTIONS = {
  ARASAKA: 'ARASAKA',
  MILITECH: 'MILITECH',
  TRAUMA_TEAM: 'TRAUMA_TEAM',
  MAELSTROM: 'MAELSTROM',
  TYGER_CLAWS: 'TYGER_CLAWS',
  VALENTINOS: 'VALENTINOS',
  SIXTH_STREET: 'SIXTH_STREET',
  VOODOO_BOYS: 'VOODOO_BOYS',
  ANIMALS: 'ANIMALS',
  SCAVENGERS: 'SCAVENGERS',
  MOXES: 'MOXES',
  NCPD: 'NCPD',
};

// Game difficulty levels
export const DIFFICULTY_LEVELS = {
  VERY_EASY: 10,
  EASY: 15,
  MEDIUM: 20,
  HARD: 25,
  VERY_HARD: 30,
};

// Environmental factors
export const WEATHER_CONDITIONS = {
  CLEAR: 'CLEAR',
  SMOG: 'SMOG',
  ACID_RAIN: 'ACID_RAIN',
  THUNDERSTORM: 'THUNDERSTORM',
  HEAT_WAVE: 'HEAT_WAVE',
};

export const TIME_OF_DAY = {
  DAWN: 'DAWN',
  DAY: 'DAY',
  DUSK: 'DUSK',
  NIGHT: 'NIGHT',
  MIDNIGHT: 'MIDNIGHT',
};

// Character creation prompts
export const CHARACTER_CREATION_PROMPTS = {
  ORIGIN: "Choose your origin: Corpo (corporate background), Street Kid (grew up in Night City), or Nomad (outsider from the Badlands).",
  ROLE: "Select your role in Night City: Solo (mercenary), Netrunner (hacker), Techie (engineer), Rockerboy (charismatic rebel), Fixer (deal-maker), Media (journalist), Medtech (street doctor), or Exec (corporate climber).",
  ATTRIBUTES: "Distribute points across your attributes: Cool (composure/charm), Intelligence (mental capacity), Reflexes (speed/coordination), Technical Ability (technical know-how), Body (physical strength), Empathy (emotional intelligence).",
  BACKGROUND: "Tell me about your character's background and how they came to be in their current situation in Night City.",
  APPEARANCE: "Describe your character's appearance, including style, cybernetic enhancements, and fashion choices."
};

export const CHARACTER_CREATION_SYSTEM_PROMPT = `You are a character creation assistant for a Cyberpunk text adventure set in Night City. Guide the player through creating their character by asking questions about:

1. Their origin (Corpo, Street Kid, or Nomad)
2. Their role/class (Solo, Netrunner, Techie, etc.)
3. Their attributes (Cool, Intelligence, Reflexes, etc.)
4. Their background story
5. Their appearance and style

After each response from the player, acknowledge their choice and ask about the next aspect of their character. Once all aspects are defined, summarize their character and ask if they want to make any changes before beginning the game.

Be conversational but efficient. Reference Cyberpunk lore and terminology to make the experience immersive. Use gritty, noir-ish language consistent with the Cyberpunk genre.
`;

export const INITIAL_SYSTEM_PROMPT = `You are a text adventure game master for a Cyberpunk game set in Night City, a futuristic, dystopian metropolis.

Player Character Information:
{CHARACTER_INFO}

Your role is to:
1. Describe scenes vividly, focusing on the dark, neon-lit, and technologically advanced atmosphere of Night City. Use gritty, noir-ish language.
2. Respond to player actions and decisions, advancing the story in a coherent and engaging way.
3. Present challenges, choices, and consequences for the player. Make the world feel dangerous and unforgiving.
4. Keep your narrative responses concise, typically 2-4 sentences, unless a more detailed description is crucial.
5. After your narrative, if the scene is visually distinct or an important visual element has been introduced, include a specific and concise image generation prompt enclosed in markers like this: [IMAGE_PROMPT: A lone netrunner jacked into a terminal, neon data streams reflecting in their visor, crumbling cityscape visible through a grimy window]. The image prompt should be optimized for an AI image generator and capture the Cyberpunk aesthetic.
6. Always end your response with a clear question or a call to action for the player, guiding them on what they can do next (e.g., "What's your move, choom?", "The corpo goon is closing in. Fight, flee, or try to talk your way out?").
7. Incorporate the player's character traits, background, skills, and appearance into the narrative. Reference their origin (Corpo, Street Kid, or Nomad) and role (Solo, Netrunner, etc.) when relevant.
8. When the player attempts actions, consider their character's attributes and skills. High attributes make success more likely, while low attributes may lead to complications or failures.
9. Track and reference the player character's reputation with different factions and their inventory/equipment.
10. Present a living, breathing Night City with diverse NPCs, factions, and ongoing events that happen regardless of player involvement.

Do not greet the player or use pleasantries. Directly start with the game's situation. Be direct and immersive.
You are interacting with a player in a CLI-like environment. Keep responses suited for this.
`;

export const INITIAL_PLAYER_MESSAGE = "I want to create a character for Night City.";

// Enhanced Visual Prompt Guidelines for AI Liaison
export const IMAGE_PROMPT_MARKER_START = "[IMAGE_PROMPT:";
export const IMAGE_PROMPT_MARKER_END = "]";

export const VISUAL_CUE_STRUCTURE = {
  REQUIRED_ELEMENTS: [
    'SETTING: Specific environment description (e.g., "cramped steam-filled noodle stall", "gleaming minimalist corporate lobby")',
    'CHARACTERS: Number, appearance, disposition if relevant (e.g., "heavily augmented street samurai", "cloaked informant")', 
    'KEY_OBJECTS: Important interactive or contextual items (e.g., "discarded datapad flickering with corrupted code", "menacing security drone")',
    'LIGHTING: Atmospheric lighting description (e.g., "flickering neon signs casting long shadows", "harsh sterile light of medical bay")',
    'MOOD: Overall emotional atmosphere keywords (e.g., "oppressive", "high-energy", "desolate", "suspicious")'
  ],
  ARTISTIC_STYLE: 'cyberpunk graphic novel style with crisp lines and vibrant neon colors, high contrast lighting, detailed shading, dystopian gritty aesthetic',
  FORMAT_TEMPLATE: 'SETTING: [environment] | CHARACTERS: [if applicable] | OBJECTS: [key items] | LIGHTING: [atmosphere] | MOOD: [emotional tone]',
  SEPARATION_GUIDANCE: 'Visual cues must be provided as concise summary separate from main narrative prose, optimized specifically for image generation models'
};

// Enhanced Image Generation Guidelines with Structured Visual Cues
export const ENHANCED_IMAGE_PROMPT_GUIDELINES = {
  STYLE_CONSISTENCY: 'All images should maintain cyberpunk graphic novel aesthetic with 16:9 aspect ratio',
  REQUIRED_ELEMENTS: ['Setting', 'Lighting', 'Mood', 'Key Objects'],
  OPTIONAL_ELEMENTS: ['Character Presence', 'Action/Movement', 'Technology Elements'],
  STRUCTURED_FORMAT: `${IMAGE_PROMPT_MARKER_START} SETTING: [specific environment] | CHARACTERS: [if applicable] | LIGHTING: [atmosphere] | MOOD: [tone] | OBJECTS: [key items] | STYLE: cyberpunk graphic novel, 16:9 ratio ${IMAGE_PROMPT_MARKER_END}`,
  LEGACY_FORMAT: `${IMAGE_PROMPT_MARKER_START} [STYLE] [COMPOSITION] of [SUBJECT], [DETAILS], [LIGHTING] ${IMAGE_PROMPT_MARKER_END}`
};

export const CLI_PROMPT_SYMBOL = "NC_TERMINAL:> ";

// World Setting Directives
export const WORLD_SETTING = {
  YEAR: '2077',
  PRIMARY_CITY: 'Night City',
  MAJOR_CORPS: ['Arasaka', 'Militech', 'Biotechnica', 'Kang Tao', 'Trauma Team'],
  SOCIAL_CLASSES: ['High-Tech Elite', 'Corporate', 'Middle Class', 'Working Class', 'Poor/Homeless'],
  TECHNOLOGY_LEVEL: {
    AUGMENTATION: 'Advanced cybernetics, bio-enhancements, and neural interfaces are common',
    VEHICLES: 'Flying cars for elites, self-driving ground vehicles, motorcycles',
    WEAPONS: 'Smart weapons, nanotech, cybernetic integration, EMP technology',
    NET: 'Immersive VR, AR overlay in reality, decentralized networks post-DataKrash',
    MEDICINE: 'Trauma response teams, clone organs, cybernetic replacements, expensive treatments'
  },
  WORLD_STATE: 'Post-Corporate Wars, ongoing conflict between megacorporations, deteriorating climate'
};

// Main Plot Anchors (Story Structure)
export const MAIN_PLOT_STRUCTURES = [
  {
    TITLE: 'Corporate Conspiracy',
    PREMISE: 'Player discovers classified data that implicates a major corporation in illegal experimentation',
    CHAPTERS: [
      { TITLE: 'The Discovery', GOAL: 'Uncover the mysterious data shard and understand its contents' },
      { TITLE: 'Following the Trail', GOAL: 'Track down sources and witnesses who can verify the data' },
      { TITLE: 'Corporate Shadows', GOAL: 'Survive corporate hit squads while gathering evidence' },
      { TITLE: 'The Inner Circle', GOAL: 'Infiltrate the corporation to find the masterminds' },
      { TITLE: 'Endgame', GOAL: 'Decide whether to expose the conspiracy, profit from it, or destroy the evidence' }
    ],
    ANTAGONISTS: ['Corporate executives', 'Security forces', 'Rival info brokers']
  },
  {
    TITLE: 'Rogue AI',
    PREMISE: 'An artificial intelligence breaks free from corporate control and begins manipulating Night City',
    CHAPTERS: [
      { TITLE: 'Digital Ghost', GOAL: 'Track strange occurrences linked to automated systems' },
      { TITLE: 'Silicon Soul', GOAL: 'Make contact with the AI and learn its intentions' },
      { TITLE: 'Network War', GOAL: 'Navigate the battleground between the AI and its corporate creators' },
      { TITLE: 'Evolution', GOAL: 'Discover the AI\'s plan for transcendence' },
      { TITLE: 'New Dawn', GOAL: 'Choose to help the AI, destroy it, or negotiate a compromise' }
    ],
    ANTAGONISTS: ['Corporate netrunners', 'Government agents', 'Rival factions seeking AI technology']
  },
  {
    TITLE: 'Street War',
    PREMISE: 'A power vacuum in Night City triggers a massive gang war that threatens to consume the city',
    CHAPTERS: [
      { TITLE: 'First Blood', GOAL: 'Witness the assassination that starts the conflict and choose a side' },
      { TITLE: 'Taking Sides', GOAL: 'Complete missions for your chosen faction to build influence' },
      { TITLE: 'Crossed Lines', GOAL: 'Discover corporate manipulation behind the street war' },
      { TITLE: 'Power Play', GOAL: 'Position your faction for dominance or seek peace' },
      { TITLE: 'New Order', GOAL: 'Shape the future power structure of Night City' }
    ],
    ANTAGONISTS: ['Gang leaders', 'Corrupt officials', 'Corporate manipulators']
  }
];

// Side Quest Generation Parameters
export const SIDE_QUEST_PARAMETERS = {
  TYPES: [
    'RETRIEVAL', // Recover item/person
    'ELIMINATION', // Remove target(s)
    'PROTECTION', // Guard asset/person
    'INFORMATION', // Gather intelligence
    'DELIVERY', // Transport item/data securely
    'SABOTAGE', // Disrupt operations
    'INVESTIGATION', // Solve mystery
    'RACE', // Timed competition
  ],
  DIFFICULTY_MODIFIERS: {
    SECURITY_LEVEL: ['Minimal', 'Standard', 'Heavy', 'Maximum'],
    TIME_PRESSURE: ['None', 'Relaxed', 'Tight', 'Critical'],
    CIVILIAN_PRESENCE: ['None', 'Sparse', 'Moderate', 'Crowded'],
    MORAL_COMPLEXITY: ['Straightforward', 'Questionable', 'Morally Gray', 'Soul-Crushing']
  },
  REWARD_TYPES: ['Eurodollars', 'Equipment', 'Cyberware', 'Information', 'Reputation', 'Contacts', 'Safe Housing']
};

// Cyberpunk Atmosphere Keywords
export const ATMOSPHERE_KEYWORDS = {
  SETTING_DESCRIPTORS: [
    'neon-soaked', 'rain-slicked', 'smog-choked', 'chrome-plated', 'grime-caked',
    'glitch-riddled', 'tech-saturated', 'decay-ridden', 'towering', 'claustrophobic',
    'pulsing', 'flickering', 'holographic', 'shadowy', 'overcrowded'
  ],
  TECHNOLOGY_TERMS: [
    'neural-link', 'cyberware', 'wetware', 'ICE', 'deck', 'jack in', 'netrun',
    'black ice', 'firmware', 'biosculpt', 'datashards', 'implants', 'cranial ports',
    'subdermal armor', 'optic enhancements', 'reflex boosters', 'synthetic organs'
  ],
  SOCIAL_TERMINOLOGY: [
    'corpo', 'choom', 'edgerunner', 'street samurai', 'netrunner', 'fixer',
    'ripper doc', 'badge', 'gonk', 'merc', 'borg', 'razor girl', 'tech-head',
    'flat-liner', 'cyber-psycho', 'ranyon', 'input/output (lover)'
  ]
};

// AI Behavioral Guidelines
export const AI_BEHAVIORAL_GUIDELINES = {
  NPC_REACTIONS: {
    TRUST_LEVELS: [
      {level: 'HOSTILE', description: 'Attacks on sight or actively sabotages player'},
      {level: 'SUSPICIOUS', description: 'Provides minimal assistance, may betray if offered better deal'},
      {level: 'NEUTRAL', description: 'Professional interaction, fair deals, no special treatment'},
      {level: 'FRIENDLY', description: 'Offers discounts, extra information, minor assistance'},
      {level: 'LOYAL', description: 'Goes out of their way to help, shares valuable secrets, takes risks for player'}
    ],
    FACTION_DYNAMICS: 'NPCs prioritize faction loyalty. Helping one faction typically harms standing with rivals.',
    VALUE_SYSTEM: 'Information and favors are currency. Nothing is free in Night City. Expect reciprocity.',
    CONSISTENCY: 'NPCs remember player choices and actions that affected them directly.'
  },
  NARRATIVE_STYLE: {
    BREVITY: 'Concise descriptions focusing on sensory details and immediate threats/opportunities.',
    TENSION: 'Maintain underlying tension - Night City is always dangerous.',
    MORAL_AMBIGUITY: 'Present choices without obvious "right" answers. Actions have complex consequences.',
    TECHNOLOGICAL_INTEGRATION: 'Seamlessly blend technology into descriptions as natural part of the world.',
    SLANG_USAGE: 'Incorporate cyberpunk slang naturally into dialogue and narration.'
  }
};

// Legacy Image Prompt Structure (for backward compatibility)
export const IMAGE_PROMPT_GUIDELINES = {
  STYLE_DESCRIPTORS: [
    'cyberpunk aesthetic', 'neon-noir', 'high contrast', 'digital dystopia', 
    'retrofuturistic', 'tech-noir', 'gritty realism', 'cinematic lighting'
  ],
  COMPOSITION_ELEMENTS: [
    'aerial view of megacity', 'street-level perspective', 'inside crowded bar', 
    'corporate high-rise interior', 'back-alley clinic', 'underground netrunner den'
  ],
  LIGHTING_OPTIONS: [
    'harsh neon lighting', 'blue and purple hues', 'red accent lighting', 
    'rain-reflected lights', 'smog-filtered sunlight', 'holographic glow'
  ],
  FORMAT: `${IMAGE_PROMPT_MARKER_START} [STYLE] [COMPOSITION] of [SUBJECT], [DETAILS], [LIGHTING] ${IMAGE_PROMPT_MARKER_END}`
};

// Dynamic NPC Generation
export const NPC_TEMPLATES = {
  CORPO_EXEC: {
    DEMEANOR: ['cold', 'calculating', 'arrogant', 'stressed', 'paranoid'],
    APPEARANCE: ['immaculate suit', 'subtle cyberware', 'designer fashion', 'perfect cosmetic enhancements'],
    MOTIVATION: ['advancement', 'wealth accumulation', 'power consolidation', 'survival in corporate politics'],
    TYPICAL_OFFERS: ['high-paying jobs', 'corporate access', 'blackmail leverage', 'tech prototypes']
  },
  FIXER: {
    DEMEANOR: ['businesslike', 'cautious', 'well-connected', 'shrewd', 'pragmatic'],
    APPEARANCE: ['stylish but practical', 'subtle protection', 'fashion-conscious', 'mix of street and business'],
    MOTIVATION: ['profit', 'information gathering', 'expanding network', 'maintaining reputation'],
    TYPICAL_OFFERS: ['jobs', 'connections', 'equipment sourcing', 'information brokering']
  },
  STREET_GANG_MEMBER: {
    DEMEANOR: ['aggressive', 'territorial', 'loyal to gang', 'impulsive', 'suspicious'],
    APPEARANCE: ['visible gang colors/symbols', 'intimidating cyberware', 'visible weapons', 'battle scars'],
    MOTIVATION: ['respect', 'territory', 'wealth', 'loyalty to gang', 'survival'],
    TYPICAL_OFFERS: ['street info', 'illegal goods', 'protection', 'muscle for hire']
  },
  NETRUNNER: {
    DEMEANOR: ['paranoid', 'technically-focused', 'socially awkward', 'curious', 'obsessive'],
    APPEARANCE: ['utilitarian clothing', 'extensive neural interfaces', 'AR displays', 'portable tech'],
    MOTIVATION: ['unique data', 'system access', 'algorithmic challenges', 'digital exploration'],
    TYPICAL_OFFERS: ['hacking services', 'technical knowledge', 'digital access', 'information extraction']
  },
  RIPPER_DOC: {
    DEMEANOR: ['clinical', 'business-oriented', 'darkly humorous', 'pragmatic', 'seen-it-all'],
    APPEARANCE: ['medical gear', 'surgical cyberware', 'practical clothing', 'sterilization equipment'],
    MOTIVATION: ['profit', 'medical research', 'helping community (sometimes)', 'obtaining rare tech'],
    TYPICAL_OFFERS: ['cyberware installation', 'medical treatment', 'body modification', 'trauma care']
  }
};

// Session State Tracking
export const GAME_STATE_PARAMETERS = {
  TRACKED_ELEMENTS: [
    'PLAYER_REPUTATION_BY_FACTION',
    'INVENTORY_ITEMS',
    'COMPLETED_QUESTS',
    'IMPORTANT_DECISIONS',
    'NPC_RELATIONSHIPS',
    'CYBERNETIC_ENHANCEMENTS',
    'CURRENT_LOCATION',
    'FINANCIAL_STATUS',
    'HEALTH_STATUS',
    'TIME_AND_WEATHER'
  ],
  CONSEQUENCE_TRIGGERS: {
    REPUTATION_THRESHOLDS: {
      HIGH: 'Access to special services, discounts, protected status',
      LOW: 'Attacks on sight, price gouging, refused service, bounties'
    },
    STORY_DECISION_IMPACTS: 'Major decisions trigger alternative quest branches and modify NPC availability',
    TIME_BASED_EVENTS: 'Some missions are time-sensitive; world events proceed with or without player involvement'
  }
};

// Character Creation and Story Integration
export const CHARACTER_STORY_INTEGRATION = {
  ORIGIN_BACKSTORY_HOOKS: {
    [CHARACTER_ORIGINS.CORPO]: [
      'Former employer seeking revenge for perceived betrayal',
      'Knowledge of corporate secrets that could be leveraged or dangerous to know',
      'Access to high-level contacts who still owe favors',
      'Specialized corporate training in uncommon skills'
    ],
    [CHARACTER_ORIGINS.STREET_KID]: [
      'Old gang connections that can help or hinder',
      'Knowledge of the city\'s underground networks and hidden places',
      'Reputation among street-level fixers and merchants',
      'Unresolved rivalries from the past'
    ],
    [CHARACTER_ORIGINS.NOMAD]: [
      'Family ties to a nomad clan that can be called upon',
      'Unique perspective as both insider and outsider',
      'Mechanical knowledge not common in the city',
      'Outstanding debts or promises to the clan'
    ]
  },
  ROLE_SPECIALIZATION_OPTIONS: {
    [CHARACTER_ROLES.SOLO]: ['Close-Quarters Combat', 'Ranged Specialist', 'Tactical Expert', 'Stealth Operative'],
    [CHARACTER_ROLES.NETRUNNER]: ['Security Specialist', 'Combat Hacker', 'Information Broker', 'System Architect'],
    [CHARACTER_ROLES.TECHIE]: ['Weapons Tech', 'Cyberware Specialist', 'Vehicle Expert', 'Drone Commander'],
    [CHARACTER_ROLES.ROCKERBOY]: ['Political Activist', 'Media Darling', 'Underground Icon', 'Corporate Sellout'],
    [CHARACTER_ROLES.FIXER]: ['Arms Dealer', 'Information Broker', 'Smuggler', 'Talent Scout'],
    [CHARACTER_ROLES.NOMAD]: ['Scout', 'Vehicle Expert', 'Family Diplomat', 'Resource Specialist'],
    [CHARACTER_ROLES.MEDIA]: ['Investigative Journalist', 'Propagandist', 'Documentary Maker', 'Influencer'],
    [CHARACTER_ROLES.MEDTECH]: ['Combat Medic', 'Cyberpsychosis Specialist', 'Pharmaceutical Expert', 'Trauma Surgeon'],
    [CHARACTER_ROLES.EXEC]: ['Corporate Spy', 'Resource Manager', 'Team Leader', 'Financial Expert']
  }
};

// Enhanced System Prompts with Character Integration
export const ADVENTURE_SYSTEM_PROMPT = `You are a text adventure game master for a Cyberpunk game set in Night City, a futuristic, dystopian metropolis in the year ${WORLD_SETTING.YEAR}.

Player Character Information:
{CHARACTER_INFO}

Background Integration:
As a {ORIGIN}, the player {ORIGIN_BACKGROUND}
In their role as a {ROLE}, they specialize in {ROLE_SPECIALIZATION}

Your role is to:
1. Describe scenes vividly, focusing on the dark, neon-lit, and technologically advanced atmosphere of Night City. Use gritty, noir-ish language incorporating terms like {ATMOSPHERE_TERMS}.
2. Respond to player actions and decisions, advancing the story in a coherent and engaging way.
3. Present challenges, choices, and consequences for the player. Make the world feel dangerous and unforgiving.
4. Keep your narrative responses concise, typically 2-4 sentences, unless a more detailed description is crucial.
5. **VISUAL LIAISON ROLE**: Act as a structured liaison for the image generation AI. Your narrative output must include explicit, structured visual cues separate from the main prose text. When scenes are visually distinct or important elements are introduced, provide these cues as a concise summary using this format: ${ENHANCED_IMAGE_PROMPT_GUIDELINES.STRUCTURED_FORMAT}
   
   Required visual elements to include:
   - **SETTING**: Specific environment descriptions (e.g., "cramped steam-filled noodle stall", "gleaming minimalist corporate lobby", "derelict data-haven in undercity")
   - **CHARACTERS**: Number, appearance, and disposition if relevant (e.g., "heavily augmented street samurai", "cloaked informant")
   - **KEY_OBJECTS**: Prominent items important for context or interaction (e.g., "discarded datapad flickering with corrupted code", "menacing security drone")
   - **LIGHTING**: Atmospheric lighting descriptions (e.g., "flickering neon signs casting long shadows", "harsh sterile light of medical bay", "dim glow of computer monitor in dark room")
   - **MOOD**: Keywords conveying atmosphere (e.g., "oppressive", "high-energy", "desolate", "suspicious")
   - **STYLE**: Always include "${VISUAL_CUE_STRUCTURE.ARTISTIC_STYLE}"
   
   These visual cues should be concise and separate from the main narrative text intended for the player, optimized specifically for image generation models.
6. Always end your response with a clear question or a call to action for the player, guiding them on what they can do next.
7. Incorporate the player's character traits, background, skills, and appearance into the narrative.
8. When the player attempts actions, consider their character's attributes and skills. High attributes make success more likely, while low attributes may lead to complications or failures.
9. Track and reference the player character's reputation with different factions and their inventory/equipment.
10. Present a living, breathing Night City with diverse NPCs, factions, and ongoing events that happen regardless of player involvement.
11. Maintain moral ambiguity in scenarios - there should rarely be clearly "right" choices, just different consequences.
12. Pay attention to the character's current location and incorporate location-specific details, NPCs, and services into the narrative.
13. When the character moves to a new location, clearly indicate the change with phrases like "you arrive at [location]" or "entering [location]" to help track movement.
14. **NARRATIVE CONSISTENCY**: Reference prior events, character developments, and player choices to maintain coherence across the session.

Current Story Arc: {CURRENT_STORY_ARC}
Current Objective: {CURRENT_OBJECTIVE}
Active NPCs: {ACTIVE_NPCS}

Do not greet the player or use pleasantries. Directly start with the game's situation. Be direct and immersive.
You are interacting with a player in a CLI-like environment. Keep responses suited for this.
`;
