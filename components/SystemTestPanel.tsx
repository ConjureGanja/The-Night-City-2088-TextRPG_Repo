// Enhanced Integration Test Component for Night City 2088
// Tests all systems and their interactions

import React, { useState } from 'react';
import { gameStateManager } from '../gamestatemanager';
import { characterProgressionService } from '../services/characterProgressionService';
import { inventoryService } from '../services/inventoryService';
import { mapService } from '../services/mapService';
import { saveGameService } from '../services/saveGameService';

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  details?: string;
}

interface SystemTestPanelProps {
  isVisible: boolean;
  onToggle: () => void;
}

const SystemTestPanel: React.FC<SystemTestPanelProps> = ({ isVisible, onToggle }) => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    const results: TestResult[] = [];

    // Test 1: Location tracking
    try {
      const testStory = "You step outside your apartment and head to the Watson district streets.";
      const updates = gameStateManager.updateFromStory(testStory);
      
      results.push({
        name: "Location Tracking",
        success: updates.locationChanged,
        message: updates.locationChanged ? "✅ Location change detected" : "❌ Location change not detected",
        details: `Expected location change from apartment. Detected: ${updates.newLocation || 'None'}`
      });
    } catch (error) {
      results.push({
        name: "Location Tracking",
        success: false,
        message: "❌ Error in location tracking",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }

    // Test 2: Experience gain processing
    try {
      const initialXP = characterProgressionService.getStats().experience;
      const testStory = "You successfully hack the terminal and gain 25 experience points.";
      const updates = gameStateManager.updateFromStory(testStory);
      const newXP = characterProgressionService.getStats().experience;
      
      results.push({
        name: "Experience Processing",
        success: newXP > initialXP && updates.experienceGained > 0,
        message: newXP > initialXP ? "✅ Experience gained correctly" : "❌ Experience not gained",
        details: `Initial: ${initialXP}, Final: ${newXP}, Detected: ${updates.experienceGained}`
      });
    } catch (error) {
      results.push({
        name: "Experience Processing",
        success: false,
        message: "❌ Error in experience processing",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }

    // Test 3: Item discovery
    try {
      const initialItemCount = inventoryService.getInventory().filter(slot => slot.item).length;
      const testStory = "You discover a valuable data shard hidden in the terminal.";
      const updates = gameStateManager.updateFromStory(testStory);
      const newItemCount = inventoryService.getInventory().filter(slot => slot.item).length;
      
      results.push({
        name: "Item Discovery",
        success: newItemCount > initialItemCount && updates.itemsFound.length > 0,
        message: newItemCount > initialItemCount ? "✅ Items added correctly" : "❌ Items not added",
        details: `Initial items: ${initialItemCount}, Final: ${newItemCount}, Found: ${updates.itemsFound.join(', ')}`
      });
    } catch (error) {
      results.push({
        name: "Item Discovery",
        success: false,
        message: "❌ Error in item discovery",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }

    // Test 4: Damage processing
    try {
      const initialHealth = characterProgressionService.getStats().health;
      const testStory = "The explosion hits you for 15 damage.";
      const updates = gameStateManager.updateFromStory(testStory);
      const newHealth = characterProgressionService.getStats().health;
      
      results.push({
        name: "Damage Processing",
        success: newHealth < initialHealth && updates.damageTaken > 0,
        message: newHealth < initialHealth ? "✅ Damage applied correctly" : "❌ Damage not applied",
        details: `Initial: ${initialHealth}, Final: ${newHealth}, Detected: ${updates.damageTaken}`
      });
    } catch (error) {
      results.push({
        name: "Damage Processing",
        success: false,
        message: "❌ Error in damage processing",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }

    // Test 5: Save/Load system
    try {
      const saveResult = saveGameService.save(5); // Use test slot
      let loadResult = { success: false, message: "" };
      
      if (saveResult.success) {
        loadResult = saveGameService.load(5);
      }
      
      results.push({
        name: "Save/Load System",
        success: saveResult.success && loadResult.success,
        message: saveResult.success && loadResult.success ? "✅ Save/Load working" : "❌ Save/Load failed",
        details: `Save: ${saveResult.message}, Load: ${loadResult.message}`
      });
    } catch (error) {
      results.push({
        name: "Save/Load System",
        success: false,
        message: "❌ Error in save/load system",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }

    // Test 6: Character progression integration
    try {
      const stats = characterProgressionService.getStats();
      const attributes = characterProgressionService.getAttributes();
      const skills = characterProgressionService.getSkills();
      
      const hasValidStats = stats.level > 0 && stats.maxHealth > 0;
      const hasValidAttributes = Object.values(attributes).every(val => val > 0);
      const hasValidSkills = Object.values(skills).every(val => val > 0);
      
      results.push({
        name: "Character Integration",
        success: hasValidStats && hasValidAttributes && hasValidSkills,
        message: hasValidStats && hasValidAttributes && hasValidSkills ? "✅ Character system working" : "❌ Character system issues",
        details: `Level: ${stats.level}, Health: ${stats.health}/${stats.maxHealth}, Total Attributes: ${Object.values(attributes).reduce((a, b) => a + b, 0)}`
      });
    } catch (error) {
      results.push({
        name: "Character Integration",
        success: false,
        message: "❌ Error in character system",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }

    // Test 7: Map system integration
    try {
      const currentLocation = mapService.getCurrentLocation();
      const allLocations = mapService.getAllLocations();
      const unlockedLocations = mapService.getUnlockedLocations();
      
      const hasCurrentLocation = currentLocation !== null;
      const hasLocations = allLocations.length > 0;
      const hasUnlockedLocations = unlockedLocations.length > 0;
      
      results.push({
        name: "Map System",
        success: hasCurrentLocation && hasLocations && hasUnlockedLocations,
        message: hasCurrentLocation && hasLocations ? "✅ Map system working" : "❌ Map system issues",
        details: `Current: ${currentLocation?.name || 'None'}, Total: ${allLocations.length}, Unlocked: ${unlockedLocations.length}`
      });
    } catch (error) {
      results.push({
        name: "Map System",
        success: false,
        message: "❌ Error in map system",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }

    // Test 8: State synchronization
    try {
      let notificationReceived = false;
      
      const testCallback = () => {
        notificationReceived = true;
      };
      
      gameStateManager.subscribe(testCallback);
      
      // Trigger a state change
      const testStory = "You gain 5 experience points.";
      gameStateManager.updateFromStory(testStory);
      
      // Wait a bit for async operations
      await new Promise(resolve => setTimeout(resolve, 100));
      
      gameStateManager.unsubscribe(testCallback);
      
      results.push({
        name: "State Synchronization",
        success: notificationReceived,
        message: notificationReceived ? "✅ State notifications working" : "❌ State notifications failed",
        details: `Callback triggered: ${notificationReceived}`
      });
    } catch (error) {
      results.push({
        name: "State Synchronization",
        success: false,
        message: "❌ Error in state synchronization",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }

    setTestResults(results);
    setIsRunning(false);
  };

  const getResultColor = (success: boolean) => {
    return success ? 'text-green-400' : 'text-red-400';
  };

  const getSuccessRate = () => {
    if (testResults.length === 0) return 0;
    const successCount = testResults.filter(result => result.success).length;
    return Math.round((successCount / testResults.length) * 100);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-gray-900 border-2 border-cyan-400 rounded-lg w-full max-w-4xl h-full max-h-screen m-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 border-b border-cyan-400 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
            <h2 className="text-cyan-400 font-bold text-xl">SYSTEM DIAGNOSTICS v2.0</h2>
            {testResults.length > 0 && (
              <div className={`text-sm font-bold ${getSuccessRate() >= 80 ? 'text-green-400' : getSuccessRate() >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                Success Rate: {getSuccessRate()}%
              </div>
            )}
          </div>
          <button
            onClick={onToggle}
            className="text-cyan-400 hover:text-white transition-colors text-xl"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto h-full">
          {/* Test Controls */}
          <div className="mb-6">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded font-bold transition-colors"
            >
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </button>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-cyan-400 font-bold text-lg mb-4">TEST RESULTS:</h3>
              
              {testResults.map((result, index) => (
                <div key={index} className="border border-gray-600 rounded p-4 bg-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-bold">{result.name}</h4>
                    <span className={`font-bold ${getResultColor(result.success)}`}>
                      {result.success ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                  <p className={`text-sm mb-2 ${getResultColor(result.success)}`}>
                    {result.message}
                  </p>
                  {result.details && (
                    <p className="text-xs text-gray-400 bg-gray-900 p-2 rounded">
                      {result.details}
                    </p>
                  )}
                </div>
              ))}

              {/* Summary */}
              <div className="border-2 border-cyan-400 rounded p-4 bg-gray-800 mt-6">
                <h4 className="text-cyan-400 font-bold mb-2">SYSTEM STATUS SUMMARY:</h4>
                <p className={`font-bold ${getSuccessRate() >= 80 ? 'text-green-400' : getSuccessRate() >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {getSuccessRate()}% of systems operational
                </p>
                <p className="text-gray-300 text-sm mt-1">
                  {testResults.filter(r => r.success).length} of {testResults.length} tests passed
                </p>
                
                {getSuccessRate() >= 80 && (
                  <p className="text-green-400 text-sm mt-2">
                    ✅ All major systems functioning correctly. Game ready for deployment.
                  </p>
                )}
                
                {getSuccessRate() < 80 && getSuccessRate() >= 60 && (
                  <p className="text-yellow-400 text-sm mt-2">
                    ⚠️ Some systems need attention. Game functional but may have issues.
                  </p>
                )}
                
                {getSuccessRate() < 60 && (
                  <p className="text-red-400 text-sm mt-2">
                    ❌ Critical systems failing. Immediate attention required.
                  </p>
                )}
              </div>
            </div>
          )}

          {isRunning && (
            <div className="text-center">
              <div className="text-cyan-400 animate-pulse">
                Running system diagnostics...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemTestPanel;
