// Save Game Service for Night City 2088
// Handles comprehensive game state persistence

import { gameStateManager } from '../gamestatemanager';

interface SaveGameData {
  version: string;
  timestamp: string;
  gameState: string;
  metadata: {
    characterName: string;
    characterLevel: number;
    currentLocation: string;
    playtime: number;
    saveSlot: number;
  };
}

interface SaveSlotInfo {
  slot: number;
  exists: boolean;
  timestamp?: string;
  characterName?: string;
  characterLevel?: number;
  currentLocation?: string;
  playtime?: number;
}

class SaveGameService {
  private readonly MAX_SAVE_SLOTS = 5;
  private readonly SAVE_KEY_PREFIX = 'night_city_save_';
  private readonly VERSION = '1.0.0';
  
  private startTime: number = Date.now();

  // Save game to specific slot
  save(slot: number = 1, customName?: string): { success: boolean; message: string } {
    if (slot < 1 || slot > this.MAX_SAVE_SLOTS) {
      return { success: false, message: `Save slot must be between 1 and ${this.MAX_SAVE_SLOTS}` };
    }

    try {
      // Get comprehensive game state
      const gameState = gameStateManager.saveGameState();
      
      // Parse the game state to extract metadata
      const parsedState = JSON.parse(gameState);
      const characterData = parsedState.character ? JSON.parse(parsedState.character) : null;
      const mapData = parsedState.map ? JSON.parse(parsedState.map) : null;
      
      const saveData: SaveGameData = {
        version: this.VERSION,
        timestamp: new Date().toISOString(),
        gameState: gameState,
        metadata: {
          characterName: characterData?.background?.name || 'V',
          characterLevel: characterData?.stats?.level || 1,
          currentLocation: mapData?.currentLocation || 'apartment_v',
          playtime: this.getPlaytime(),
          saveSlot: slot
        }
      };

      const saveKey = `${this.SAVE_KEY_PREFIX}${slot}`;
      localStorage.setItem(saveKey, JSON.stringify(saveData));
      
      // Update save slot index
      this.updateSaveSlotIndex();
      
      return { 
        success: true, 
        message: `Game saved to slot ${slot}${customName ? ` as "${customName}"` : ''}` 
      };
    } catch (error) {
      console.error('Save failed:', error);
      return { 
        success: false, 
        message: 'Failed to save game. Please try again.' 
      };
    }
  }

  // Load game from specific slot
  load(slot: number): { success: boolean; message: string; saveData?: SaveGameData } {
    if (slot < 1 || slot > this.MAX_SAVE_SLOTS) {
      return { success: false, message: `Save slot must be between 1 and ${this.MAX_SAVE_SLOTS}` };
    }

    try {
      const saveKey = `${this.SAVE_KEY_PREFIX}${slot}`;
      const saveDataStr = localStorage.getItem(saveKey);
      
      if (!saveDataStr) {
        return { success: false, message: `No saved game found in slot ${slot}` };
      }

      const saveData: SaveGameData = JSON.parse(saveDataStr);
      
      // Validate save version compatibility
      if (!this.isVersionCompatible(saveData.version)) {
        return { 
          success: false, 
          message: `Save file version ${saveData.version} is not compatible with current version ${this.VERSION}` 
        };
      }

      // Load the game state
      const loadSuccess = gameStateManager.loadGameState(saveData.gameState);
      
      if (!loadSuccess) {
        return { 
          success: false, 
          message: 'Failed to load game state. Save file may be corrupted.' 
        };
      }

      // Reset playtime tracking
      this.startTime = Date.now() - (saveData.metadata.playtime || 0);

      return { 
        success: true, 
        message: `Game loaded from slot ${slot} (${saveData.metadata.characterName}, Level ${saveData.metadata.characterLevel})`,
        saveData 
      };
    } catch (error) {
      console.error('Load failed:', error);
      return { 
        success: false, 
        message: 'Failed to load game. Save file may be corrupted.' 
      };
    }
  }

  // Delete save from specific slot
  deleteSave(slot: number): { success: boolean; message: string } {
    if (slot < 1 || slot > this.MAX_SAVE_SLOTS) {
      return { success: false, message: `Save slot must be between 1 and ${this.MAX_SAVE_SLOTS}` };
    }

    try {
      const saveKey = `${this.SAVE_KEY_PREFIX}${slot}`;
      const exists = localStorage.getItem(saveKey) !== null;
      
      if (!exists) {
        return { success: false, message: `No saved game found in slot ${slot}` };
      }

      localStorage.removeItem(saveKey);
      this.updateSaveSlotIndex();
      
      return { success: true, message: `Save deleted from slot ${slot}` };
    } catch (error) {
      console.error('Delete save failed:', error);
      return { success: false, message: 'Failed to delete save' };
    }
  }

  // Get information about all save slots
  getSaveSlots(): SaveSlotInfo[] {
    const slots: SaveSlotInfo[] = [];
    
    for (let i = 1; i <= this.MAX_SAVE_SLOTS; i++) {
      const saveKey = `${this.SAVE_KEY_PREFIX}${i}`;
      const saveDataStr = localStorage.getItem(saveKey);
      
      if (saveDataStr) {
        try {
          const saveData: SaveGameData = JSON.parse(saveDataStr);
          slots.push({
            slot: i,
            exists: true,
            timestamp: saveData.timestamp,
            characterName: saveData.metadata.characterName,
            characterLevel: saveData.metadata.characterLevel,
            currentLocation: saveData.metadata.currentLocation,
            playtime: saveData.metadata.playtime
          });
        } catch (error) {
          // Corrupted save
          slots.push({
            slot: i,
            exists: true,
            timestamp: 'Unknown (Corrupted)',
            characterName: 'Unknown',
            characterLevel: 0,
            currentLocation: 'Unknown',
            playtime: 0
          });
        }
      } else {
        slots.push({
          slot: i,
          exists: false
        });
      }
    }
    
    return slots;
  }

  // Quick save (uses slot 1)
  quickSave(): { success: boolean; message: string } {
    return this.save(1, 'Quick Save');
  }

  // Quick load (uses slot 1)
  quickLoad(): { success: boolean; message: string; saveData?: SaveGameData } {
    return this.load(1);
  }

  // Auto save (uses a special auto-save slot)
  autoSave(): { success: boolean; message: string } {
    try {
      const gameState = gameStateManager.saveGameState();
      const parsedState = JSON.parse(gameState);
      const characterData = parsedState.character ? JSON.parse(parsedState.character) : null;
      
      const saveData: SaveGameData = {
        version: this.VERSION,
        timestamp: new Date().toISOString(),
        gameState: gameState,
        metadata: {
          characterName: characterData?.background?.name || 'V',
          characterLevel: characterData?.stats?.level || 1,
          currentLocation: 'Unknown',
          playtime: this.getPlaytime(),
          saveSlot: 0 // Auto-save slot
        }
      };

      localStorage.setItem('night_city_autosave', JSON.stringify(saveData));
      
      return { success: true, message: 'Auto-saved' };
    } catch (error) {
      console.error('Auto-save failed:', error);
      return { success: false, message: 'Auto-save failed' };
    }
  }

  // Load auto-save
  loadAutoSave(): { success: boolean; message: string; saveData?: SaveGameData } {
    try {
      const saveDataStr = localStorage.getItem('night_city_autosave');
      
      if (!saveDataStr) {
        return { success: false, message: 'No auto-save found' };
      }

      const saveData: SaveGameData = JSON.parse(saveDataStr);
      const loadSuccess = gameStateManager.loadGameState(saveData.gameState);
      
      if (!loadSuccess) {
        return { success: false, message: 'Failed to load auto-save' };
      }

      return { 
        success: true, 
        message: 'Auto-save loaded',
        saveData 
      };
    } catch (error) {
      console.error('Load auto-save failed:', error);
      return { success: false, message: 'Failed to load auto-save' };
    }
  }

  // Export save to file
  exportSave(slot: number): { success: boolean; message: string; data?: string } {
    const saveInfo = this.load(slot);
    if (!saveInfo.success || !saveInfo.saveData) {
      return { success: false, message: saveInfo.message };
    }

    try {
      const exportData = JSON.stringify(saveInfo.saveData, null, 2);
      return { 
        success: true, 
        message: 'Save exported successfully',
        data: exportData 
      };
    } catch (error) {
      return { success: false, message: 'Failed to export save' };
    }
  }

  // Import save from file data
  importSave(saveDataStr: string, slot: number): { success: boolean; message: string } {
    try {
      const saveData: SaveGameData = JSON.parse(saveDataStr);
      
      // Validate the imported data
      if (!saveData.version || !saveData.gameState || !saveData.metadata) {
        return { success: false, message: 'Invalid save file format' };
      }

      // Update slot information
      saveData.metadata.saveSlot = slot;
      
      const saveKey = `${this.SAVE_KEY_PREFIX}${slot}`;
      localStorage.setItem(saveKey, JSON.stringify(saveData));
      
      this.updateSaveSlotIndex();
      
      return { success: true, message: `Save imported to slot ${slot}` };
    } catch (error) {
      return { success: false, message: 'Failed to import save - invalid format' };
    }
  }

  // Helper methods
  private isVersionCompatible(version: string): boolean {
    // For now, only exact version matches are supported
    // In the future, this could implement more sophisticated compatibility checking
    return version === this.VERSION;
  }

  private updateSaveSlotIndex(): void {
    const slots = this.getSaveSlots();
    localStorage.setItem('night_city_save_index', JSON.stringify(slots));
  }

  private getPlaytime(): number {
    return Date.now() - this.startTime;
  }

  // Format playtime for display
  formatPlaytime(playtime: number): string {
    const hours = Math.floor(playtime / (1000 * 60 * 60));
    const minutes = Math.floor((playtime % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  // Check if auto-save is available
  hasAutoSave(): boolean {
    return localStorage.getItem('night_city_autosave') !== null;
  }

  // Get total used storage
  getStorageUsage(): { used: number; available: number; percentage: number } {
    let used = 0;
    const available = 5 * 1024 * 1024; // Approximate 5MB localStorage limit
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith(this.SAVE_KEY_PREFIX) || key === 'night_city_autosave')) {
          const value = localStorage.getItem(key);
          if (value) {
            used += key.length + value.length;
          }
        }
      }
    } catch (error) {
      console.error('Failed to calculate storage usage:', error);
    }
    
    return {
      used,
      available,
      percentage: (used / available) * 100
    };
  }
}

export const saveGameService = new SaveGameService();
export type { SaveGameData, SaveSlotInfo };
