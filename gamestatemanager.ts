// Centralized Game State Manager for Night City 2088
// Manages state synchronization between story events and UI components

import { characterProgressionService } from './services/characterProgressionService';
import { mapService } from './services/mapService';
import { inventoryService } from './services/inventoryService';
import { narrativeMemoryService } from './services/geminiService';

interface StoryUpdates {
  statsUpdated: boolean;
  locationChanged: boolean;
  inventoryChanged: boolean;
  combatOccurred: boolean;
  itemsFound: string[];
  itemsLost: string[];
  experienceGained: number;
  damageDealt: number;
  damageTaken: number;
  newLocation?: string;
}

interface StoryEvent {
  type: 'combat' | 'discovery' | 'npc_encounter' | 'location_change' | 'item_loss' | 'experience_gain';
  data: any;
  triggers: string[];
}

class GameStateManager {
  private subscribers: Set<() => void> = new Set();
  private storyEvents: StoryEvent[] = [];

  constructor() {
    this.initializeStoryEvents();
  }

  // Subscriber management
  subscribe(callback: () => void) {
    this.subscribers.add(callback);
  }

  unsubscribe(callback: () => void) {
    this.subscribers.delete(callback);
  }

  notifyStateChange() {
    this.subscribers.forEach(callback => callback());
  }

  // Main story processing function
  updateFromStory(storyText: string): StoryUpdates {
    const updates = this.processStoryResponse(storyText);
    
    // Apply all detected changes
    if (updates.experienceGained > 0) {
      characterProgressionService.addExperience(updates.experienceGained);
    }

    if (updates.damageTaken > 0) {
      characterProgressionService.takeDamage(updates.damageTaken);
    }

    if (updates.itemsFound.length > 0) {
      updates.itemsFound.forEach(itemName => {
        inventoryService.addItemFromStory(itemName);
      });
    }

    if (updates.itemsLost.length > 0) {
      updates.itemsLost.forEach(itemName => {
        inventoryService.removeItemFromStory(itemName);
      });
    }

    if (updates.newLocation) {
      mapService.updateLocationFromStory(storyText);
    }

    // Process story events
    this.processStoryEvents(storyText);

    // Notify UI components if any changes occurred
    if (updates.statsUpdated || updates.locationChanged || updates.inventoryChanged) {
      this.notifyStateChange();
    }

    return updates;
  }

  // Enhanced story response processing
  private processStoryResponse(storyText: string): StoryUpdates {
    const text = storyText.toLowerCase();
    const updates: StoryUpdates = {
      statsUpdated: false,
      locationChanged: false,
      inventoryChanged: false,
      combatOccurred: false,
      itemsFound: [],
      itemsLost: [],
      experienceGained: 0,
      damageDealt: 0,
      damageTaken: 0
    };

    // Experience detection patterns
    const expPatterns = [
      /(?:gain|earned|received)\s+(\d+)\s+(?:experience|exp|xp)/gi,
      /(?:you\s+learn|skill\s+improved|breakthrough)/gi
    ];

    for (const pattern of expPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (match[1]) {
          updates.experienceGained += parseInt(match[1]);
        } else {
          updates.experienceGained += 25; // Default experience for skill improvements
        }
        updates.statsUpdated = true;
      }
    }

    // Damage detection patterns
    const damagePatterns = [
      /(?:you\s+take|suffer|receive)\s+(\d+)\s+(?:damage|harm|injury)/gi,
      /(?:hit\s+for|dealt\s+for|damaged\s+for)\s+(\d+)/gi
    ];

    for (const pattern of damagePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (match[1]) {
          updates.damageTaken += parseInt(match[1]);
          updates.statsUpdated = true;
        }
      }
    }

    // Item discovery patterns
    const itemFoundPatterns = [
      /(?:find|discover|pick\s+up|obtain|acquire|get)\s+(?:a|an|the)?\s*([^.!?]+?)(?:\.|!|\?|$)/gi,
      /(?:loot|scavenge|take)\s+(?:a|an|the)?\s*([^.!?]+?)(?:\.|!|\?|$)/gi
    ];

    for (const pattern of itemFoundPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const itemName = match[1].trim();
        if (this.isValidItemName(itemName)) {
          updates.itemsFound.push(itemName);
          updates.inventoryChanged = true;
        }
      }
    }

    // Item loss patterns
    const itemLostPatterns = [
      /(?:lose|drop|break|destroy|stolen)\s+(?:your|the)?\s*([^.!?]+?)(?:\.|!|\?|$)/gi
    ];

    for (const pattern of itemLostPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const itemName = match[1].trim();
        if (this.isValidItemName(itemName)) {
          updates.itemsLost.push(itemName);
          updates.inventoryChanged = true;
        }
      }
    }    // Location change detection - Enhanced patterns
    const locationPatterns = [
      /(?:enter|arrive\s+at|go\s+to|travel\s+to|move\s+to|head\s+to|walk\s+to)\s+([^.!?]+?)(?:\.|!|\?|$)/gi,
      /(?:you're\s+now\s+in|you\s+are\s+now\s+in|welcome\s+to|you\s+find\s+yourself\s+in)\s+([^.!?]+?)(?:\.|!|\?|$)/gi,
      /(?:stepping\s+into|walking\s+into|entering\s+the|leaving\s+the\s+apartment|outside\s+the\s+apartment)\s*([^.!?]*?)(?:\.|!|\?|$)/gi,
      /(?:you\s+exit|you\s+leave|stepping\s+outside|heading\s+out)/gi
    ];

    for (const pattern of locationPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        let locationName = match[1] ? match[1].trim() : '';
        
        // Special handling for leaving apartment
        if (text.includes('leave') || text.includes('exit') || text.includes('outside') || 
            text.includes('step out') || text.includes('heading out')) {
          // If leaving apartment, assume going to Watson/Kabuki area
          locationName = 'watson_streets';
          updates.newLocation = locationName;
          updates.locationChanged = true;
          console.log('🚪 Detected leaving apartment, updating to Watson Streets');
          break;
        }
        
        if (locationName && locationName.length > 0) {
          updates.newLocation = locationName;
          updates.locationChanged = true;
          console.log('📍 Detected location change to:', locationName);
          break; // Only take the first location change
        }
      }
    }

    // Combat detection
    const combatPatterns = [
      /(?:attack|fight|combat|battle|engage)/gi,
      /(?:gun|weapon|sword|blade)/gi
    ];

    for (const pattern of combatPatterns) {
      if (pattern.test(text)) {
        updates.combatOccurred = true;
        break;
      }
    }

    return updates;
  }

  // Initialize story event patterns
  private initializeStoryEvents() {
    this.storyEvents = [
      {
        type: 'combat',
        data: { damageRange: [5, 15], difficultyModifier: 1.0 },
        triggers: ['you are attacked', 'combat begins', 'fight starts', 'draws a weapon', 'opens fire']
      },
      {
        type: 'discovery',
        data: { itemTypes: ['data_shard', 'credstick', 'ammo', 'consumable'] },
        triggers: ['you find a', 'discover a', 'spot a', 'notice a']
      },
      {
        type: 'npc_encounter',
        data: { reputation_impact: 1 },
        triggers: ['a person approaches', 'someone calls out', 'a figure emerges', 'you meet']
      },
      {
        type: 'location_change',
        data: { unlockNewAreas: true },
        triggers: ['you arrive at', 'entering', 'you reach', 'the doors open to']
      },
      {
        type: 'experience_gain',
        data: { baseAmount: 20 },
        triggers: ['you learn', 'breakthrough', 'understanding dawns', 'skill improves']
      }
    ];
  }

  // Process specific story events
  private processStoryEvents(storyText: string): void {
    const text = storyText.toLowerCase();

    for (const event of this.storyEvents) {
      for (const trigger of event.triggers) {
        if (text.includes(trigger)) {
          this.executeStoryEvent(event);
          break;
        }
      }
    }
  }

  // Execute story event effects
  private executeStoryEvent(event: StoryEvent): void {
    switch (event.type) {
      case 'combat':
        this.handleCombatEvent(event.data);
        break;
      case 'discovery':
        this.handleDiscoveryEvent(event.data);
        break;
      case 'npc_encounter':
        this.handleNpcEncounter(event.data);
        break;
      case 'experience_gain':
        characterProgressionService.addExperience(event.data.baseAmount);
        break;
    }
  }

  // Combat event handler
  private handleCombatEvent(data: any): void {
    const playerStats = characterProgressionService.getStats();
    const damage = Math.floor(Math.random() * (data.damageRange[1] - data.damageRange[0]) + data.damageRange[0]);
    
    // Apply damage based on character's defense
    const actualDamage = Math.max(1, damage - Math.floor(playerStats.defense / 2));
    characterProgressionService.takeDamage(actualDamage);
    
    // Award experience for surviving combat
    characterProgressionService.addExperience(15);
  }

  // Discovery event handler
  private handleDiscoveryEvent(data: any): void {
    const itemType = data.itemTypes[Math.floor(Math.random() * data.itemTypes.length)];
    inventoryService.addItemFromStory(itemType);
  }

  // NPC encounter handler
  private handleNpcEncounter(data: any): void {
    characterProgressionService.addCredRating(data.reputation_impact);
  }

  // Utility function to validate item names
  private isValidItemName(itemName: string): boolean {
    const commonItems = [
      'credstick', 'data shard', 'ammo', 'weapon', 'armor', 'cyberdeck', 
      'implant', 'chip', 'stimpack', 'food', 'drink', 'tool', 'component'
    ];
    
    const name = itemName.toLowerCase();
    return commonItems.some(item => name.includes(item)) || 
           name.length > 3 && name.length < 50; // Basic length validation
  }

  // Save/Load game state
  saveGameState(): string {
    const gameState = {
      character: characterProgressionService.saveCharacterData(),
      map: mapService.saveGameState(),
      inventory: inventoryService.saveInventoryData(),
      narrative: narrativeMemoryService.saveMemory(),
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
    
    return JSON.stringify(gameState);
  }

  loadGameState(saveData: string): boolean {
    try {
      const gameState = JSON.parse(saveData);
      
      if (gameState.character) {
        characterProgressionService.loadCharacterData(gameState.character);
      }
      
      if (gameState.map) {
        mapService.loadGameState(gameState.map);
      }
      
      if (gameState.inventory) {
        inventoryService.loadInventoryData(gameState.inventory);
      }
      
      if (gameState.narrative) {
        narrativeMemoryService.loadMemory(gameState.narrative);
      }
      
      this.notifyStateChange();
      return true;
    } catch (error) {
      console.error('Failed to load game state:', error);
      return false;
    }
  }

  // Reset game state for new game
  resetGameState(): void {
    characterProgressionService.resetCharacter();
    mapService.resetMapState();
    inventoryService.resetInventory();
    narrativeMemoryService.resetMemory();
    this.notifyStateChange();
  }
}

// Export singleton instance
export const gameStateManager = new GameStateManager();
export type { StoryUpdates, StoryEvent };