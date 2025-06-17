import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chat } from '@google/genai';
import { StoryLogEntry, LogEntryType } from './types';
import { 
  IMAGE_PROMPT_MARKER_START, 
  IMAGE_PROMPT_MARKER_END
} from './constants';
import { 
  initiateChatSession, 
  initiateEnhancedChatSession,
  sendMessageToChat, 
  generateImageFromPrompt,
  extractImagePromptFromStory,
  generateCharacterInfo,
  processStoryResponse,
  generateApartmentStartPrompt,
  narrativeMemoryService,
  sendMessageFreemium,
  checkFreemiumAvailability
} from './services/geminiService';
import { characterProgressionService } from './services/characterProgressionService';
import { mapService } from './services/mapService';

import CommandLineOutput from './components/CommandLineOutput';
import CommandInput from './components/CommandInput';
import ApiKeySettings from './components/ApiKeySettings';
import VisualCortexPanel from './components/VisualCortexPanel';
import AudioControls from './components/AudioControls';
import InventoryPanel from './components/InventoryPanel';
import CharacterProgressionPanel from './components/CharacterProgressionPanel';
import CharacterCreationPanel from './components/CharacterCreationPanel';
import MapPanel from './components/MapPanel';
import UsageStatusDisplay from './components/UsageStatusDisplay';
import PremiumUpgrade from './components/PremiumUpgrade';

const App: React.FC = () => {
  const [storyLog, setStoryLog] = useState<StoryLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [userApiKey, setUserApiKey] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [audioControlsVisible, setAudioControlsVisible] = useState<boolean>(false);
  const [inventoryVisible, setInventoryVisible] = useState<boolean>(false);
  const [characterProgressionVisible, setCharacterProgressionVisible] = useState<boolean>(false);
  const [mapVisible, setMapVisible] = useState<boolean>(false);
  
  // Character creation state
  const [isCreatingCharacter, setIsCreatingCharacter] = useState<boolean>(false);
  
  // Freemium state
  const [freemiumAvailable, setFreemiumAvailable] = useState<boolean>(false);
  const [showFreemiumError, setShowFreemiumError] = useState<string>('');
  const [showPremiumUpgrade, setShowPremiumUpgrade] = useState<boolean>(false);
  const [remainingMessages, setRemainingMessages] = useState<number>(5);
  
  // UI refresh state to force component updates
  const [uiRefreshKey, setUiRefreshKey] = useState<number>(0);
  
  const outputRef = useRef<HTMLDivElement>(null);

  // Check freemium availability on app load
  useEffect(() => {
    const updateFreemiumStatus = async () => {
      const available = await checkFreemiumAvailability();
      setFreemiumAvailable(available);
      
      // Also update remaining messages if in freemium mode
      if (available && !userApiKey) {
        try {
          const { freemiumApi } = await import('./services/freemiumService');
          const status = await freemiumApi.getUserStatus();
          setRemainingMessages(status.remaining);
        } catch (error) {
          console.error('Failed to get freemium status:', error);
        }
      }
    };
    
    updateFreemiumStatus();
  }, [userApiKey]);

  // Load API key from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (savedApiKey) {
      setUserApiKey(savedApiKey);
    }
  }, []);

  const handleApiKeySet = useCallback((newApiKey: string) => {
    if (newApiKey !== userApiKey) {
      // Reset game state when API key changes
      setStoryLog([]);
      setChatSession(null);
      setIsInitialized(false);
      setIsLoading(false);
    }
    setUserApiKey(newApiKey);
  }, [userApiKey]);

  const getCurrentTimestamp = (): string => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const addLogEntry = useCallback((type: LogEntryType, content: string) => {
    setStoryLog(prevLog => [...prevLog, { 
      id: `${Date.now()}-${Math.random()}`, 
      type, 
      content, 
      timestamp: getCurrentTimestamp() 
    }]);
  }, []);

  const processPlayerCommand = useCallback(async (command: string) => {
    // Handle character creation command
    const lowerCommand = command.toLowerCase().trim();
    
    if (lowerCommand === 'create character' || lowerCommand === 'new character' || lowerCommand === 'character creation') {
      addLogEntry(LogEntryType.SYSTEM_MESSAGE, "Initiating character creation mode...");
      setIsCreatingCharacter(true);
      return;
    }
    
    // Handle location/map commands
    if (lowerCommand === 'where am i' || lowerCommand === 'location' || lowerCommand === 'current location') {
      const locationContext = mapService.getCurrentLocationContext();
      addLogEntry(LogEntryType.SYSTEM_MESSAGE, locationContext);
      return;
    }
    
    if (lowerCommand === 'help' || lowerCommand === 'commands') {
      addLogEntry(LogEntryType.SYSTEM_MESSAGE, "Available commands:");
      addLogEntry(LogEntryType.SYSTEM_MESSAGE, "• 'run' - Start/continue your adventure");
      addLogEntry(LogEntryType.SYSTEM_MESSAGE, "• 'create character' - Enter character creation");
      addLogEntry(LogEntryType.SYSTEM_MESSAGE, "• 'where am i' - Check current location");
      addLogEntry(LogEntryType.SYSTEM_MESSAGE, "• 'save game' - Save your progress");
      addLogEntry(LogEntryType.SYSTEM_MESSAGE, "• 'load game' - Load saved progress");
      addLogEntry(LogEntryType.SYSTEM_MESSAGE, "• 'story summary' - View recent narrative events");
      addLogEntry(LogEntryType.SYSTEM_MESSAGE, "• Use the control panel buttons to access inventory, character sheet, and map");
      return;
    }
    
    if (lowerCommand === 'story summary' || lowerCommand === 'summary' || lowerCommand === 'recap') {
      const summary = narrativeMemoryService.generateContextSummary();
      addLogEntry(LogEntryType.SYSTEM_MESSAGE, "Story Summary:");
      addLogEntry(LogEntryType.SYSTEM_MESSAGE, summary || "No significant events recorded yet.");
      return;
    }
    
    if (lowerCommand === 'save game' || lowerCommand === 'save') {
      try {
        const characterData = characterProgressionService.saveCharacterData();
        const mapData = mapService.saveGameState();
        const narrativeData = narrativeMemoryService.saveMemory();
        const gameState = {
          character: characterData,
          map: mapData,
          narrative: narrativeData,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('night_city_save', JSON.stringify(gameState));
        addLogEntry(LogEntryType.SYSTEM_MESSAGE, "Game saved successfully.");
      } catch (error) {
        addLogEntry(LogEntryType.ERROR, "Failed to save game.");
      }
      return;
    }
    
    if (lowerCommand === 'load game' || lowerCommand === 'load') {
      try {
        const savedGame = localStorage.getItem('night_city_save');
        if (savedGame) {
          const gameState = JSON.parse(savedGame);
          characterProgressionService.loadCharacterData(gameState.character);
          mapService.loadGameState(gameState.map);
          if (gameState.narrative) {
            narrativeMemoryService.loadMemory(gameState.narrative);
          }
          addLogEntry(LogEntryType.SYSTEM_MESSAGE, `Game loaded from ${new Date(gameState.timestamp).toLocaleString()}.`);
        } else {
          addLogEntry(LogEntryType.SYSTEM_MESSAGE, "No saved game found.");
        }
      } catch (error) {
        addLogEntry(LogEntryType.ERROR, "Failed to load game.");
      }
      return;
    }
    
    if (!chatSession) {
      addLogEntry(LogEntryType.ERROR, "Chat session not initialized. Please refresh.");
      setIsLoading(false);
      return;
    }

    addLogEntry(LogEntryType.PLAYER_INPUT, command);
    setIsLoading(true);
    addLogEntry(LogEntryType.LOADING, "Accessing Night City datastreams...");

    try {
      // Handle the 'run' command specifically to start the game
      let messageToSend = command;
      if (lowerCommand === 'run') {
        messageToSend = generateApartmentStartPrompt();
      }

      // Use freemium service for messaging
      const result = await sendMessageFreemium(messageToSend, undefined, userApiKey);
      
      if (result.error) {
        if (result.isFreemium && result.error.includes('Free tier limit exceeded')) {
          addLogEntry(LogEntryType.SYSTEM_MESSAGE, `🚫 ${result.error}`);
          setShowFreemiumError(result.error);
          setRemainingMessages(0);
          setShowPremiumUpgrade(true);
          return;
        } else {
          addLogEntry(LogEntryType.SYSTEM_MESSAGE, `❌ Error: ${result.error}`);
          return;
        }
      }
      
      let storyText = result.response;
      
      // Update remaining messages count if using freemium
      if (result.isFreemium && !userApiKey) {
        setRemainingMessages(prev => Math.max(0, prev - 1));
      }
      
      // Process story and update location/stats
      const { cleanedStory, locationChanged, statsUpdated } = processStoryResponse(storyText);
      
      if (locationChanged) {
        const currentLocation = mapService.getCurrentLocation();
        addLogEntry(LogEntryType.SYSTEM_MESSAGE, `Location updated: ${currentLocation?.name || 'Unknown'}`);
        // Trigger UI refresh
        setUiRefreshKey(prev => prev + 1);
      }
      
      if (statsUpdated) {
        addLogEntry(LogEntryType.SYSTEM_MESSAGE, "Character stats updated");
        // Trigger UI refresh
        setUiRefreshKey(prev => prev + 1);
      }
      
      const imagePrompt = extractImagePromptFromStory(storyText, IMAGE_PROMPT_MARKER_START, IMAGE_PROMPT_MARKER_END);

      addLogEntry(LogEntryType.STORY, cleanedStory);

      if (imagePrompt) {
        addLogEntry(LogEntryType.IMAGE_CAPTION, `Visual cortex processing: ${imagePrompt}`);
        setIsProcessingImage(true);
        try {
          const imageUrl = await generateImageFromPrompt(imagePrompt, userApiKey);
          if (imageUrl) {
            addLogEntry(LogEntryType.IMAGE, imageUrl);
          } else {
            addLogEntry(LogEntryType.ERROR, "Failed to generate image. Visual feed corrupted.");
          }
        } catch (imgError) {
          console.error("Image generation error:", imgError);
          addLogEntry(LogEntryType.ERROR, "Image generation subsystem failure. Diagnostics required.");
        } finally {
          setIsProcessingImage(false);
        }
      }
    } catch (error) {
      console.error("Gemini API error:", error);
      const errorMsg = error instanceof Error ? error.message : "An unknown error occurred with the AI connection.";
      addLogEntry(LogEntryType.ERROR, `NETWATCH ALERT: Connection error - ${errorMsg}`);
    } finally {
      setIsLoading(false);
      // Remove loading messages
      setStoryLog(prevLog => prevLog.filter(entry => entry.type !== LogEntryType.LOADING));
    }
  }, [chatSession, addLogEntry, userApiKey]);

  // Handle character creation completion
  const handleCharacterCreationComplete = useCallback(async () => {
    setIsCreatingCharacter(false);
    
    // Reset existing chat session to create a new one with character info
    setChatSession(null);
    
    // Add feedback to the log
    addLogEntry(LogEntryType.SYSTEM_MESSAGE, "Character creation complete!");
    addLogEntry(LogEntryType.SYSTEM_MESSAGE, "Generating character avatar...");
    
    // Generate character avatar
    try {
      setIsProcessingImage(true);
      const { generateCharacterAvatar } = await import('./services/geminiService');
      const avatarUrl = await generateCharacterAvatar(userApiKey);
      if (avatarUrl) {
        addLogEntry(LogEntryType.IMAGE, avatarUrl);
        addLogEntry(LogEntryType.IMAGE_CAPTION, "Character avatar generated");
      }
    } catch (error) {
      console.error("Avatar generation error:", error);
      addLogEntry(LogEntryType.ERROR, "Avatar generation failed, but continuing...");
    } finally {
      setIsProcessingImage(false);
    }
    
    addLogEntry(LogEntryType.SYSTEM_MESSAGE, "Initializing enhanced game session with character data...");
    
    // Initialize the game with the new character
    if (userApiKey) {
      try {
        const enhancedSession = initiateEnhancedChatSession(userApiKey);
        setChatSession(enhancedSession);
        
        // Display character summary
        const characterInfo = generateCharacterInfo();
        const character = characterProgressionService.getBackground();
        
        // Update apartment location for character
        mapService.updateApartmentForCharacter(character.name);
        
        addLogEntry(LogEntryType.SYSTEM_MESSAGE, "Character loaded successfully:");
        addLogEntry(LogEntryType.SYSTEM_MESSAGE, characterInfo);
        addLogEntry(LogEntryType.SYSTEM_MESSAGE, `Welcome to Night City, ${character.name}.`);
        addLogEntry(LogEntryType.SYSTEM_MESSAGE, "Type 'run' to begin your adventure in your apartment.");
      } catch (error) {
        console.error("Error initializing enhanced session:", error);
        addLogEntry(LogEntryType.ERROR, "Failed to initialize game with character data. Please try again.");
      }
    }
  }, [userApiKey, addLogEntry]);

  // Initialize game
  useEffect(() => {
    if (!userApiKey) return; // Don't initialize without API key

    const initializeGame = async () => {
      setIsInitialized(false);
      setIsLoading(true);
      
      addLogEntry(LogEntryType.SYSTEM_MESSAGE, "Booting Night City Terminal Interface v2.7...");
      addLogEntry(LogEntryType.SYSTEM_MESSAGE, "Connecting to Gemini Mainframe...");
      addLogEntry(LogEntryType.SYSTEM_MESSAGE, "✅ User API key configured successfully.");
      
      try {
        // Use the basic session initially, before character creation
        const session = initiateChatSession(userApiKey);
        setChatSession(session);
        addLogEntry(LogEntryType.SYSTEM_MESSAGE, "Gemini connection established. Welcome to Night City Adventures.");
        addLogEntry(LogEntryType.SYSTEM_MESSAGE, "To begin, type 'create character' to build your cyberpunk persona.");
        addLogEntry(LogEntryType.SYSTEM_MESSAGE, "Or type 'run' to start with a default character.");
        setIsInitialized(true);
        setIsLoading(false);
      } catch (error) {
        console.error("Initialization error:", error);
        const errorMsg = error instanceof Error ? error.message : "Unknown initialization failure.";
        addLogEntry(LogEntryType.ERROR, `Initialization failed: ${errorMsg}`);
        setIsLoading(false);
      }
    };

    // Only initialize if not already initialized
    if (!isInitialized) {
      initializeGame();
    }
  }, [userApiKey, addLogEntry, isInitialized]); // Re-initialize when API key changes

  // Auto-scroll
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [storyLog]);

  return (
    <div className="flex h-screen bg-black text-green-400 font-mono">
      <div className="flex flex-col">
        <ApiKeySettings 
          onApiKeySet={handleApiKeySet} 
          currentApiKey={userApiKey}
        />
        {freemiumAvailable && (
          <UsageStatusDisplay 
            className="mt-2 mx-4"
            onUpgradeClick={() => {
              setShowFreemiumError('');
              setShowPremiumUpgrade(true);
            }}
          />
        )}
      </div>
      
      {/* Control Panel */}
      <div className="w-12 bg-gray-900 border-r border-green-700 flex flex-col items-center py-2 space-y-2">
        <button
          onClick={() => setInventoryVisible(!inventoryVisible)}
          className={`w-8 h-8 rounded border text-xs font-bold transition-colors ${
            inventoryVisible 
              ? 'bg-green-600 border-green-400 text-black' 
              : 'bg-gray-800 border-green-700 text-green-400 hover:bg-gray-700'
          }`}
          title="Inventory"
        >
          📦
        </button>
        <button
          onClick={() => setCharacterProgressionVisible(!characterProgressionVisible)}
          className={`w-8 h-8 rounded border text-xs font-bold transition-colors ${
            characterProgressionVisible 
              ? 'bg-green-600 border-green-400 text-black' 
              : 'bg-gray-800 border-green-700 text-green-400 hover:bg-gray-700'
          }`}
          title="Character"
        >
          👤
        </button>
        <button
          onClick={() => setMapVisible(!mapVisible)}
          className={`w-8 h-8 rounded border text-xs font-bold transition-colors ${
            mapVisible 
              ? 'bg-green-600 border-green-400 text-black' 
              : 'bg-gray-800 border-green-700 text-green-400 hover:bg-gray-700'
          }`}
          title="Map"
        >
          🗺️
        </button>
        <button
          onClick={() => setAudioControlsVisible(!audioControlsVisible)}
          className={`w-8 h-8 rounded border text-xs font-bold transition-colors ${
            audioControlsVisible 
              ? 'bg-green-600 border-green-400 text-black' 
              : 'bg-gray-800 border-green-700 text-green-400 hover:bg-gray-700'
          }`}
          title="Audio"
        >
          🔊
        </button>
      </div>
      
      {/* Main Terminal Section */}
      <div className="flex flex-col flex-1">
        <header className="p-2 border-b border-green-700 text-center">
          <h1 className="text-xl font-bold text-yellow-400">[ NIGHT CITY ADVENTURES ]</h1>
          <p className="text-xs text-gray-500">Powered by Gemini & Imagen</p>
        </header>
        <main ref={outputRef} className="flex-grow overflow-y-auto">
          <CommandLineOutput log={storyLog} />
        </main>
        <CommandInput onSubmit={processPlayerCommand} isLoading={isLoading} />
        <footer className="p-1 border-t border-green-700 text-center text-xs text-gray-600">
          SYSTEM STATUS: {isLoading ? "BUSY" : "IDLE"} | CONNECTION: SECURE | LOCATION: {mapService.getCurrentLocation()?.name || 'NIGHT CITY'}
        </footer>
      </div>

      {/* Visual Cortex Panel */}
      <div className="w-96 flex-shrink-0">
        <VisualCortexPanel 
          storyLog={storyLog} 
          isProcessing={isProcessingImage}
        />
      </div>

      {/* Audio Controls */}
      <AudioControls 
        isVisible={audioControlsVisible}
        onToggle={() => setAudioControlsVisible(!audioControlsVisible)}
      />

      {/* Inventory Panel */}
      <InventoryPanel 
        key={`inventory-${uiRefreshKey}`}
        isVisible={inventoryVisible}
        onToggle={() => setInventoryVisible(!inventoryVisible)}
      />

      {/* Character Progression Panel */}
      <CharacterProgressionPanel 
        key={`character-${uiRefreshKey}`}
        isVisible={characterProgressionVisible}
        onToggle={() => setCharacterProgressionVisible(!characterProgressionVisible)}
      />

      {/* Map Panel */}
      <MapPanel 
        key={`map-${uiRefreshKey}`}
        isVisible={mapVisible}
        onToggle={() => setMapVisible(!mapVisible)}
      />

      {/* Character Creation Panel */}
      {isCreatingCharacter && (
        <CharacterCreationPanel 
          isVisible={isCreatingCharacter}
          onComplete={handleCharacterCreationComplete}
          onCancel={() => setIsCreatingCharacter(false)}
        />
      )}

      {/* Premium Upgrade Modal */}
      <PremiumUpgrade
        isVisible={showPremiumUpgrade}
        onClose={() => setShowPremiumUpgrade(false)}
        onUpgrade={() => {
          setShowPremiumUpgrade(false);
          // Refresh freemium status after upgrade
          checkFreemiumAvailability().then(setFreemiumAvailable);
        }}
        remainingMessages={remainingMessages}
      />
    </div>
  );
};

export default App;
