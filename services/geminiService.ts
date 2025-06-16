import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { 
  GEMINI_MODEL_NAME, 
  IMAGEN_MODEL_NAME, 
  INITIAL_SYSTEM_PROMPT, 
  ADVENTURE_SYSTEM_PROMPT,
  CHARACTER_CREATION_SYSTEM_PROMPT
} from '../constants';
import { characterProgressionService } from './characterProgressionService';
import { mapService } from './mapService';
import { freemiumApi } from './freemiumService';

// Freemium mode configuration
let useFreemiumMode = false;
let hasCheckedFreemiumAvailability = false;

// Check if freemium API is available
export const checkFreemiumAvailability = async (): Promise<boolean> => {
  if (hasCheckedFreemiumAvailability) {
    return useFreemiumMode;
  }
  
  try {
    await freemiumApi.healthCheck();
    useFreemiumMode = true;
    hasCheckedFreemiumAvailability = true;
    console.log('✅ Freemium API available - using shared key for free tier');
    return true;
  } catch (error) {
    useFreemiumMode = false;
    hasCheckedFreemiumAvailability = true;
    console.log('❌ Freemium API unavailable - using user-provided keys only');
    return false;
  }
}

// Narrative Memory and Context Retention System
export interface NarrativeMemory {
  keyEvents: string[];
  characterDevelopments: string[];
  npcRelationships: Map<string, string>;
  importantChoices: string[];
  locationHistory: string[];
  plotPoints: string[];
  lastSummary: string;
  sessionLength: number;
}

class NarrativeMemoryService {
  private memory: NarrativeMemory = {
    keyEvents: [],
    characterDevelopments: [],
    npcRelationships: new Map(),
    importantChoices: [],
    locationHistory: [],
    plotPoints: [],
    lastSummary: '',
    sessionLength: 0
  };

  // Add significant story events to memory
  addKeyEvent(event: string): void {
    this.memory.keyEvents.push(event);
    if (this.memory.keyEvents.length > 20) {
      this.memory.keyEvents = this.memory.keyEvents.slice(-15); // Keep last 15 events
    }
  }

  // Track character development moments
  addCharacterDevelopment(development: string): void {
    this.memory.characterDevelopments.push(development);
    if (this.memory.characterDevelopments.length > 10) {
      this.memory.characterDevelopments = this.memory.characterDevelopments.slice(-8);
    }
  }

  // Update NPC relationship status
  updateNPCRelationship(npcName: string, relationship: string): void {
    this.memory.npcRelationships.set(npcName, relationship);
  }

  // Add important player choices
  addImportantChoice(choice: string): void {
    this.memory.importantChoices.push(choice);
    if (this.memory.importantChoices.length > 15) {
      this.memory.importantChoices = this.memory.importantChoices.slice(-10);
    }
  }

  // Track location visits
  addLocationVisit(location: string): void {
    this.memory.locationHistory.push(location);
    if (this.memory.locationHistory.length > 25) {
      this.memory.locationHistory = this.memory.locationHistory.slice(-20);
    }
  }

  // Add plot developments
  addPlotPoint(plotPoint: string): void {
    this.memory.plotPoints.push(plotPoint);
    if (this.memory.plotPoints.length > 10) {
      this.memory.plotPoints = this.memory.plotPoints.slice(-8);
    }
  }

  // Generate contextual summary for AI prompts
  generateContextSummary(): string {
    if (this.memory.keyEvents.length === 0) {
      return '';
    }

    let summary = '\n=== NARRATIVE CONTEXT ===\n';
    
    if (this.memory.keyEvents.length > 0) {
      summary += `Recent Events: ${this.memory.keyEvents.slice(-5).join(', ')}\n`;
    }
    
    if (this.memory.importantChoices.length > 0) {
      summary += `Key Decisions: ${this.memory.importantChoices.slice(-3).join(', ')}\n`;
    }
    
    if (this.memory.npcRelationships.size > 0) {
      const npcList = Array.from(this.memory.npcRelationships.entries())
        .slice(-5)
        .map(([name, rel]) => `${name} (${rel})`)
        .join(', ');
      summary += `Known NPCs: ${npcList}\n`;
    }
    
    if (this.memory.plotPoints.length > 0) {
      summary += `Plot Developments: ${this.memory.plotPoints.slice(-3).join(', ')}\n`;
    }
    
    return summary;
  }

  // Get player story recap
  getStoryRecap(): string {
    if (this.memory.keyEvents.length === 0) {
      return 'Your adventure in Night City has just begun...';
    }

    let recap = '=== YOUR NIGHT CITY STORY SO FAR ===\n\n';
    
    if (this.memory.keyEvents.length > 0) {
      recap += 'SIGNIFICANT EVENTS:\n';
      this.memory.keyEvents.forEach((event) => {
        recap += `• ${event}\n`;
      });
      recap += '\n';
    }
    
    if (this.memory.importantChoices.length > 0) {
      recap += 'MAJOR DECISIONS:\n';
      this.memory.importantChoices.forEach((choice) => {
        recap += `• ${choice}\n`;
      });
      recap += '\n';
    }
    
    if (this.memory.npcRelationships.size > 0) {
      recap += 'PEOPLE YOU\'VE MET:\n';
      Array.from(this.memory.npcRelationships.entries()).forEach(([name, relationship]) => {
        recap += `• ${name} - ${relationship}\n`;
      });
      recap += '\n';
    }
    
    if (this.memory.plotPoints.length > 0) {
      recap += 'STORY DEVELOPMENTS:\n';
      this.memory.plotPoints.forEach((point) => {
        recap += `• ${point}\n`;
      });
    }
    
    return recap;
  }

  // Save/load narrative memory
  saveMemory(): string {
    const memoryData = {
      keyEvents: this.memory.keyEvents,
      characterDevelopments: this.memory.characterDevelopments,
      npcRelationships: Array.from(this.memory.npcRelationships.entries()),
      importantChoices: this.memory.importantChoices,
      locationHistory: this.memory.locationHistory,
      plotPoints: this.memory.plotPoints,
      lastSummary: this.memory.lastSummary,
      sessionLength: this.memory.sessionLength
    };
    return JSON.stringify(memoryData);
  }

  loadMemory(saveData: string): boolean {
    try {
      const memoryData = JSON.parse(saveData);
      this.memory = {
        keyEvents: memoryData.keyEvents || [],
        characterDevelopments: memoryData.characterDevelopments || [],
        npcRelationships: new Map(memoryData.npcRelationships || []),
        importantChoices: memoryData.importantChoices || [],
        locationHistory: memoryData.locationHistory || [],
        plotPoints: memoryData.plotPoints || [],
        lastSummary: memoryData.lastSummary || '',
        sessionLength: memoryData.sessionLength || 0
      };
      return true;
    } catch (error) {
      console.error('Failed to load narrative memory:', error);
      return false;
    }
  }

  // Reset memory for new game
  resetMemory(): void {
    this.memory = {
      keyEvents: [],
      characterDevelopments: [],
      npcRelationships: new Map(),
      importantChoices: [],
      locationHistory: [],
      plotPoints: [],
      lastSummary: '',
      sessionLength: 0
    };
  }
}

// Export singleton instance
export const narrativeMemoryService = new NarrativeMemoryService();

// Generate character info for system prompts with narrative context
export const generateCharacterInfo = (): string => {
  const character = characterProgressionService.getBackground();
  const attributes = characterProgressionService.getAttributes();
  const stats = characterProgressionService.getStats();
  const skills = characterProgressionService.getSkills();
  const locationContext = mapService.getCurrentLocationContext();
  const narrativeContext = narrativeMemoryService.generateContextSummary();
  
  return `
Name: ${character.name}
Level: ${stats.level}
Origin: ${character.origin}
Role: ${character.role}${character.specialization ? ` (${character.specialization})` : ''}
${locationContext}

Health: ${stats.health}/${stats.maxHealth}
Eddies: ${stats.eddies} €$
Street Cred: ${stats.credRating}/100

Attributes:
- Body: ${attributes.body}
- Intelligence: ${attributes.intelligence}
- Reflexes: ${attributes.reflexes}
- Technical: ${attributes.technical}
- Cool: ${attributes.cool}

Key Skills:
- Athletics: ${skills.athletics}
- Breach Protocol: ${skills.breach}
- Quickhacking: ${skills.quickhacking}
- Handguns: ${skills.handguns}
- Stealth: ${skills.stealth}
- Engineering: ${skills.engineering}

Background Story:
${character.backgroundStory || "A solo making their way in Night City, looking for the next big score."}

Appearance:
${character.appearance.gender ? `Gender: ${character.appearance.gender}` : ''}
${character.appearance.hairStyle || character.appearance.hairColor ? `Hair: ${character.appearance.hairStyle} ${character.appearance.hairColor}` : ''}
${character.appearance.eyeColor ? `Eyes: ${character.appearance.eyeColor}` : ''}
${character.appearance.facialFeatures ? `Face: ${character.appearance.facialFeatures}` : ''}
${character.appearance.clothing ? `Clothing: ${character.appearance.clothing}` : ''}
${character.appearance.distinguishingMarks ? `Distinguishing Marks: ${character.appearance.distinguishingMarks}` : ''}

Origin Hooks:
${character.backgroundHooks.join('\n')}

${narrativeContext}
`;
};

// Basic chat session for initial interactions or character creation
export const initiateChatSession = (apiKey?: string): Chat => {
  const apiKeyToUse = apiKey || process.env.API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKeyToUse) {
    throw new Error("API key is required");
  }

  const ai = new GoogleGenAI({ apiKey: apiKeyToUse });
  const chat: Chat = ai.chats.create({
    model: GEMINI_MODEL_NAME,
    config: {
      systemInstruction: INITIAL_SYSTEM_PROMPT,
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
    },
  });
  return chat;
};

// Character creation chat session
export const initiateCharacterCreationChat = (apiKey?: string): Chat => {
  const apiKeyToUse = apiKey || process.env.API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKeyToUse) {
    throw new Error("API key is required");
  }
  
  const ai = new GoogleGenAI({ apiKey: apiKeyToUse });
  const chat: Chat = ai.chats.create({
    model: GEMINI_MODEL_NAME,
    config: {
      systemInstruction: CHARACTER_CREATION_SYSTEM_PROMPT,
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
    },
  });
  return chat;
};

// Enhanced version of initiateChatSession using full character info
export const initiateEnhancedChatSession = (apiKey?: string): Chat => {
  const apiKeyToUse = apiKey || process.env.API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKeyToUse) {
    throw new Error("API key is required");
  }
  
  const characterInfo = generateCharacterInfo();
  
  // Replace placeholder with actual character info
  const systemPrompt = ADVENTURE_SYSTEM_PROMPT.replace('{CHARACTER_INFO}', characterInfo);
  
  const ai = new GoogleGenAI({ apiKey: apiKeyToUse });
  const chat: Chat = ai.chats.create({
    model: GEMINI_MODEL_NAME,
    config: {
      systemInstruction: systemPrompt,
      // For a text adventure, we might want slightly more creative responses
      temperature: 0.8, 
      topP: 0.9,
      topK: 40,
    },
  });
  return chat;
};

// Freemium-aware message sending
export const sendMessageFreemium = async (
  message: string, 
  systemInstruction?: string,
  apiKey?: string
): Promise<{ response: string; isFreemium: boolean; error?: string }> => {
  
  // First try freemium API if available and no user API key provided
  if (useFreemiumMode && !apiKey) {
    try {
      const result = await freemiumApi.sendChatMessage(
        [{ role: 'user', content: message }],
        systemInstruction || ADVENTURE_SYSTEM_PROMPT,
        0.7
      );
      return {
        response: result.response,
        isFreemium: true
      };
    } catch (error: any) {
      // If it's a freemium limit error, return it for the UI to handle
      if (error.error === 'Free tier limit exceeded') {
        return {
          response: '',
          isFreemium: true,
          error: error.message || 'Free tier limit exceeded'
        };
      }
      // For other errors, fall back to user's API key
      console.warn('Freemium API failed, falling back to user API key:', error);
    }
  }
  
  // Fall back to user's API key
  const apiKeyToUse = apiKey || process.env.API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKeyToUse) {
    return {
      response: '',
      isFreemium: false,
      error: 'No API key available. Please provide your own Gemini API key or upgrade to premium.'
    };
  }

  try {
    const chat = initiateChatSession(apiKeyToUse);
    const response = await sendMessageToChat(chat, message);
    return {
      response: response.text || '',
      isFreemium: false
    };
  } catch (error: any) {
    return {
      response: '',
      isFreemium: false,
      error: error.message || 'Failed to send message'
    };
  }
};

export const sendMessageToChat = async (chat: Chat, message: string): Promise<GenerateContentResponse> => {
  const response: GenerateContentResponse = await chat.sendMessage({ message });
  return response;
};

export const generateImageFromPrompt = async (prompt: string, apiKey?: string): Promise<string | null> => {
  const apiKeyToUse = apiKey || process.env.API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKeyToUse) {
    throw new Error("API key is required for image generation");
  }

  // Parse and enhance prompt using structured visual cues
  const styledPrompt = parseStructuredImagePrompt(prompt);

  try {
    const ai = new GoogleGenAI({ apiKey: apiKeyToUse });
    const response = await ai.models.generateImages({
      model: IMAGEN_MODEL_NAME,
      prompt: styledPrompt,
      config: { 
        numberOfImages: 1, 
        outputMimeType: 'image/jpeg'
      },
    });
    
    if (response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0]?.image?.imageBytes) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    return null;
  } catch (error) {
    console.error("Error generating image with Imagen:", error);
    throw error; // Re-throw to be caught by the calling function
  }
};

// Generate character avatar after character creation
export const generateCharacterAvatar = async (apiKey?: string): Promise<string | null> => {
  const character = characterProgressionService.getBackground();
  
  const avatarPrompt = `Portrait of ${character.name}, a ${character.appearance.gender || 'person'} ${character.origin.toLowerCase().replace('_', ' ')} ${character.role.toLowerCase()} in Night City. ${character.appearance.hairStyle || ''} ${character.appearance.hairColor || ''} hair, ${character.appearance.eyeColor || ''} eyes. ${character.appearance.facialFeatures || ''}. ${character.appearance.clothing || 'Cyberpunk attire'}. ${character.appearance.distinguishingMarks || ''}. Head and shoulders portrait, facing forward, intense expression`;
  
  return generateImageFromPrompt(avatarPrompt, apiKey);
};

export const extractImagePromptFromStory = (storyText: string, startMarker: string, endMarker: string): string | null => {
  const startIndex = storyText.indexOf(startMarker);
  if (startIndex === -1) return null;
  
  const endIndex = storyText.indexOf(endMarker, startIndex + startMarker.length);
  if (endIndex === -1) return null;
  
  return storyText.substring(startIndex + startMarker.length, endIndex).trim();
};

export const cleanStoryText = (storyText: string, startMarker: string, endMarker: string): string => {
  const startIndex = storyText.indexOf(startMarker);
  if (startIndex === -1) return storyText;
  
  const endIndex = storyText.indexOf(endMarker, startIndex + startMarker.length);
  if (endIndex === -1) return storyText;

  return (storyText.substring(0, startIndex) + storyText.substring(endIndex + endMarker.length)).trim();
};

// Process story response and update game state with narrative memory and stats
export const processStoryResponse = (storyText: string): { cleanedStory: string; locationChanged: boolean; statsUpdated: boolean } => {
  // Update location based on story content
  const locationChanged = mapService.updateLocationFromStory(storyText);
  
  // Capture narrative events for memory system
  captureNarrativeEvents(storyText);
  
  // Update character stats from story events
  const statsUpdated = updateCharacterStatsFromStory(storyText);
  
  // Clean the story text (remove image prompts)
  const cleanedStory = cleanStoryText(storyText, "[IMAGE_PROMPT:", "]");
  
  return { cleanedStory, locationChanged, statsUpdated };
};

// Update character stats based on story events
const updateCharacterStatsFromStory = (storyText: string): boolean => {
  const text = storyText.toLowerCase();
  let updated = false;
  
  // Pattern matching for eddies/money transactions
  const eddiesPatterns = [
    /(?:receive|get|gain|earn|find|discover|collect|obtain)(?:s|ed)?\s+(\d+)\s*(?:eddies?|eurodollars?|€\$)/gi,
    /(\d+)\s*(?:eddies?|eurodollars?|€\$)\s+(?:is|are|were)?\s*(?:added|deposited|transferred|given|paid)/gi,
    /(?:pay|pays?|payment|transaction)\s+of\s+(\d+)\s*(?:eddies?|eurodollars?|€\$)/gi
  ];
  
  for (const pattern of eddiesPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const amount = parseInt(match[1]);
      if (amount > 0) {
        characterProgressionService.addEddies(amount);
        updated = true;
        console.log(`Added ${amount} eddies from story event`);
      }
    }
  }
  
  // Pattern matching for losing eddies
  const lossPatterns = [
    /(?:lose|lost|spend|spent|cost|costs|price)\s+(\d+)\s*(?:eddies?|eurodollars?|€\$)/gi,
    /(\d+)\s*(?:eddies?|eurodollars?|€\$)\s+(?:lost|deducted|taken|stolen)/gi
  ];
  
  for (const pattern of lossPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const amount = parseInt(match[1]);
      if (amount > 0) {
        characterProgressionService.spendEddies(amount);
        updated = true;
        console.log(`Spent ${amount} eddies from story event`);
      }
    }
  }
  
  // Pattern matching for health changes
  const healthPatterns = [
    /(?:heal|restore|recover|regain)(?:s|ed)?\s+(\d+)\s*(?:health|hp|hit points?)/gi,
    /(?:take|takes?|suffer|suffers?)\s+(\d+)\s*(?:damage|harm|injury)/gi
  ];
  
  for (const pattern of healthPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const amount = parseInt(match[1]);
      if (amount > 0) {
        if (pattern.source.includes('heal|restore|recover|regain')) {
          characterProgressionService.heal(amount);
          updated = true;
          console.log(`Healed ${amount} health from story event`);
        } else {
          characterProgressionService.takeDamage(amount);
          updated = true;
          console.log(`Took ${amount} damage from story event`);
        }
      }
    }
  }
  
  // Pattern matching for experience gain
  const xpPatterns = [
    /(?:gain|earn|receive)(?:s|ed)?\s+(\d+)\s*(?:experience|xp|exp)/gi,
    /(\d+)\s*(?:experience|xp|exp)\s+(?:points?|gained|earned)/gi
  ];
  
  for (const pattern of xpPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const amount = parseInt(match[1]);
      if (amount > 0) {
        characterProgressionService.addExperience(amount);
        updated = true;
        console.log(`Added ${amount} experience from story event`);
      }
    }
  }
  
  // Pattern matching for street cred changes
  const credPatterns = [
    /(?:gain|earn|increase)(?:s|ed)?\s+(\d+)\s*(?:street cred|cred rating|reputation)/gi,
    /(?:lose|lost|decrease)(?:s|ed)?\s+(\d+)\s*(?:street cred|cred rating|reputation)/gi
  ];
  
  for (const pattern of credPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const amount = parseInt(match[1]);
      if (amount > 0) {
        if (pattern.source.includes('gain|earn|increase')) {
          characterProgressionService.addCredRating(amount);
          updated = true;
          console.log(`Gained ${amount} street cred from story event`);
        } else {
          characterProgressionService.addCredRating(-amount);
          updated = true;
          console.log(`Lost ${amount} street cred from story event`);
        }
      }
    }
  }
  
  return updated;
};

// Capture important narrative events from story text
const captureNarrativeEvents = (storyText: string): void => {
  const text = storyText.toLowerCase();
  
  // Detect key event patterns
  const eventPatterns = [
    /you (meet|encounter) ([a-zA-Z\s]+)/,
    /you (agree|decide|choose) to ([^.]+)/,
    /(combat|fight|battle) (begins|starts|erupts)/,
    /you (discover|find|learn) ([^.]+)/,
    /([a-zA-Z\s]+) (dies|is killed|attacks you)/,
    /you (gain|lose) ([^.]+)/
  ];
  
  for (const pattern of eventPatterns) {
    const match = text.match(pattern);
    if (match) {
      narrativeMemoryService.addKeyEvent(match[0]);
    }
  }
  
  // Detect NPC interactions
  const npcPattern = /you (talk to|speak with|meet) ([A-Z][a-zA-Z\s]+)/;
  const npcMatch = text.match(npcPattern);
  if (npcMatch) {
    const npcName = npcMatch[2].trim();
    narrativeMemoryService.updateNPCRelationship(npcName, 'met');
  }
  
  // Detect important choices
  const choicePatterns = [
    /you (decide|choose|agree|refuse) to ([^.]+)/,
    /you (accept|decline|take) ([^.]+)/
  ];
  
  for (const pattern of choicePatterns) {
    const match = text.match(pattern);
    if (match) {
      narrativeMemoryService.addImportantChoice(match[0]);
    }
  }
};

// Enhanced apartment starting prompt
export const generateApartmentStartPrompt = (): string => {
  const character = characterProgressionService.getBackground();
  const currentStats = characterProgressionService.getStats();
  const currentLocation = mapService.getCurrentLocation();
  
  return `I am ${character.name}, and I wake up in my apartment in Night City. ${currentLocation?.description || 'This is my modest place in Watson district.'} 

Character details: ${character.origin} background, working as a ${character.role}${character.specialization ? ` specializing in ${character.specialization}` : ''}. Current health: ${currentStats.health}/${currentStats.maxHealth}, ${currentStats.eddies} eddies in account.

Set the opening scene showing me waking up in my apartment. Describe what I see around me, the current time of day, and any immediate options or notifications I might have (messages, news, etc.). What are my first options for the day?`;
};

// Enhanced image prompt parsing for structured visual cues
export const parseStructuredImagePrompt = (prompt: string): string => {
  // Check if this is a structured prompt with SETTING|LIGHTING|MOOD format
  if (prompt.includes('SETTING:') && prompt.includes('LIGHTING:') && prompt.includes('MOOD:')) {
    // Parse structured format
    const settingMatch = prompt.match(/SETTING:\s*([^|]+)/);
    const charactersMatch = prompt.match(/CHARACTERS:\s*([^|]+)/);
    const lightingMatch = prompt.match(/LIGHTING:\s*([^|]+)/);
    const moodMatch = prompt.match(/MOOD:\s*([^|]+)/);
    const objectsMatch = prompt.match(/OBJECTS:\s*([^|]+)/);
    
    const setting = settingMatch ? settingMatch[1].trim() : '';
    const characters = charactersMatch ? charactersMatch[1].trim() : '';
    const lighting = lightingMatch ? lightingMatch[1].trim() : '';
    const mood = moodMatch ? moodMatch[1].trim() : '';
    const objects = objectsMatch ? objectsMatch[1].trim() : '';
    
    // Reconstruct as natural language prompt optimized for image generation
    let optimizedPrompt = setting;
    
    if (characters && !characters.toLowerCase().includes('not applicable') && !characters.toLowerCase().includes('n/a')) {
      optimizedPrompt += `, featuring ${characters}`;
    }
    
    if (objects) {
      optimizedPrompt += `, with ${objects}`;
    }
    
    optimizedPrompt += `, ${lighting}, ${mood} atmosphere, cyberpunk graphic novel style with crisp lines and vibrant neon colors, 16:9 aspect ratio, high contrast lighting, detailed shading, Night City, dystopian aesthetic`;
    
    return optimizedPrompt;
  }
  
  // For non-structured prompts, use legacy enhancement
  return `${prompt}, cyberpunk graphic novel style with crisp lines and vibrant neon colors, digital art, comic book illustration, high contrast lighting, detailed shading, cyberpunk aesthetic with neon highlights, Night City, dystopian, gritty, high-tech low-life`;
};
