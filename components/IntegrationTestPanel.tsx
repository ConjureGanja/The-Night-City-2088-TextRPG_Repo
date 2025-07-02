// Integration Test Component for Night City 2088
// Tests all major game systems integration

import React, { useState } from 'react';
import { gameStateManager } from '../gamestatemanager';
import { saveGameService } from '../services/saveGameService';
import { characterProgressionService } from '../services/characterProgressionService';
import { inventoryService } from '../services/inventoryService';
import { mapService } from '../services/mapService';
import { combatSystem } from '../services/combatSystem';
import { storyEventProcessor } from '../services/storyEventProcessor';

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
}

const IntegrationTestPanel: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    const results: TestResult[] = [];

    // Test 1: GameStateManager story processing
    try {
      const storyText = "You find a data shard and gain 25 experience. You take 10 damage from the explosion.";
      const updates = gameStateManager.updateFromStory(storyText);
      
      results.push({
        test: "GameStateManager Story Processing",
        passed: updates.experienceGained > 0 && updates.damageTaken > 0,
        message: `Detected: ${updates.experienceGained} exp, ${updates.damageTaken} damage`
      });
    } catch (error) {
      results.push({
        test: "GameStateManager Story Processing",
        passed: false,
        message: `Error: ${error}`
      });
    }

    // Test 2: Character progression integration
    try {
      const initialExp = characterProgressionService.getStats().experience;
      characterProgressionService.addExperience(50);
      const newExp = characterProgressionService.getStats().experience;
      
      results.push({
        test: "Character Progression",
        passed: newExp > initialExp,
        message: `Experience: ${initialExp} → ${newExp}`
      });
    } catch (error) {
      results.push({
        test: "Character Progression",
        passed: false,
        message: `Error: ${error}`
      });
    }

    // Test 3: Inventory item addition from story
    try {
      const initialCount = inventoryService.getInventory().filter(slot => slot.item).length;
      const added = inventoryService.addItemFromStory("data shard");
      const newCount = inventoryService.getInventory().filter(slot => slot.item).length;
      
      results.push({
        test: "Inventory Story Integration",
        passed: added && newCount > initialCount,
        message: `Items: ${initialCount} → ${newCount}`
      });
    } catch (error) {
      results.push({
        test: "Inventory Story Integration",
        passed: false,
        message: `Error: ${error}`
      });
    }

    // Test 4: Map location tracking
    try {
      const initialLocation = mapService.getCurrentLocation()?.name;
      const updated = mapService.updateLocationFromStory("You arrive at Kabuki Market");
      const newLocation = mapService.getCurrentLocation()?.name;
      
      results.push({
        test: "Map Location Tracking",
        passed: updated,
        message: `Location: ${initialLocation} → ${newLocation}`
      });
    } catch (error) {
      results.push({
        test: "Map Location Tracking",
        passed: false,
        message: `Error: ${error}`
      });
    }

    // Test 5: Combat system integration
    try {
      const combatResult = combatSystem.resolveCombatFromStory(
        "A gang member attacks you with a weapon",
        "I shoot back with my gun"
      );
      
      results.push({
        test: "Combat System",
        passed: combatResult.playerDamage > 0 || combatResult.enemyDamage > 0,
        message: `Combat resolved: ${combatResult.victory ? 'Victory' : combatResult.fled ? 'Fled' : 'Ongoing'}`
      });
    } catch (error) {
      results.push({
        test: "Combat System",
        passed: false,
        message: `Error: ${error}`
      });
    }

    // Test 6: Story event processor
    try {
      const skillResult = storyEventProcessor.processSkillChallenge(
        "You need to hack the terminal",
        "hacking"
      );
      
      results.push({
        test: "Story Event Processor",
        passed: skillResult.experienceGained > 0,
        message: `Skill challenge: ${skillResult.success ? 'Success' : 'Failed'}, +${skillResult.experienceGained} exp`
      });
    } catch (error) {
      results.push({
        test: "Story Event Processor",
        passed: false,
        message: `Error: ${error}`
      });
    }

    // Test 7: Save/Load system
    try {
      const saveResult = saveGameService.save(5); // Use test slot
      const loadResult = saveGameService.load(5);
      
      results.push({
        test: "Save/Load System",
        passed: saveResult.success && loadResult.success,
        message: `Save: ${saveResult.success}, Load: ${loadResult.success}`
      });
    } catch (error) {
      results.push({
        test: "Save/Load System",
        passed: false,
        message: `Error: ${error}`
      });
    }

    // Test 8: State change notification
    try {
      let notificationReceived = false;
      
      const testCallback = () => {
        notificationReceived = true;
      };
      
      gameStateManager.subscribe(testCallback);
      gameStateManager.notifyStateChange();
      gameStateManager.unsubscribe(testCallback);
      
      results.push({
        test: "State Change Notifications",
        passed: notificationReceived,
        message: `Notification system: ${notificationReceived ? 'Working' : 'Failed'}`
      });
    } catch (error) {
      results.push({
        test: "State Change Notifications",
        passed: false,
        message: `Error: ${error}`
      });
    }

    setTestResults(results);
    setIsRunning(false);
  };

  const runStoryIntegrationTest = () => {
    const testStory = `
      You successfully hack into the terminal and gain 30 experience. 
      You find a valuable data shard and a credstick worth 500 eddies.
      A corporate security guard spots you and attacks!
      You take 15 damage but manage to defeat him.
      You arrive at the Corporate Plaza.
    `;

    const updates = gameStateManager.updateFromStory(testStory);
    
    setTestResults([{
      test: "Complete Story Integration",
      passed: updates.experienceGained > 0 && updates.itemsFound.length > 0,
      message: `Story processed: ${updates.experienceGained} exp, ${updates.itemsFound.length} items, ${updates.damageTaken} damage`
    }]);
  };

  const getOverallStatus = () => {
    if (testResults.length === 0) return "No tests run";
    const passed = testResults.filter(r => r.passed).length;
    const total = testResults.length;
    return `${passed}/${total} tests passed`;
  };

  const getStatusColor = () => {
    if (testResults.length === 0) return "text-gray-400";
    const passed = testResults.filter(r => r.passed).length;
    const total = testResults.length;
    const ratio = passed / total;
    
    if (ratio === 1) return "text-green-400";
    if (ratio >= 0.8) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-gray-900 border-2 border-cyan-400 rounded-lg w-full max-w-4xl h-full max-h-screen m-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 border-b border-cyan-400 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
            <h2 className="text-cyan-400 font-bold text-xl">SYSTEM INTEGRATION DIAGNOSTICS</h2>
            <div className={`text-sm ${getStatusColor()}`}>
              {getOverallStatus()}
            </div>
          </div>
        </div>

        <div className="p-6 h-full overflow-y-auto">
          {/* Control Panel */}
          <div className="mb-6 flex space-x-4">
            <button
              onClick={runTests}
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
            >
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </button>
            <button
              onClick={runStoryIntegrationTest}
              className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded transition-colors"
            >
              Test Story Integration
            </button>
          </div>

          {/* Test Results */}
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`border rounded p-4 ${
                  result.passed
                    ? 'border-green-500 bg-green-900 bg-opacity-20'
                    : 'border-red-500 bg-red-900 bg-opacity-20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">
                    {result.passed ? '✅' : '❌'} {result.test}
                  </h3>
                  <span className={`text-sm ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
                    {result.passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
                <p className="mt-2 text-gray-300 text-sm">{result.message}</p>
              </div>
            ))}
            
            {testResults.length === 0 && !isRunning && (
              <div className="text-center text-gray-400 py-8">
                <p>No tests have been run yet.</p>
                <p className="text-sm mt-2">Click "Run All Tests" to validate system integration.</p>
              </div>
            )}
            
            {isRunning && (
              <div className="text-center text-cyan-400 py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                <p className="mt-2">Running system diagnostics...</p>
              </div>
            )}
          </div>

          {/* System Status */}
          {testResults.length > 0 && (
            <div className="mt-8 border-t border-gray-600 pt-6">
              <h3 className="text-cyan-400 font-bold mb-4">SYSTEM STATUS</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-800 p-4 rounded">
                  <h4 className="text-green-400 font-bold">Core Systems</h4>
                  <p className="text-sm text-gray-300">Game state management, story processing</p>
                </div>
                <div className="bg-gray-800 p-4 rounded">
                  <h4 className="text-blue-400 font-bold">Game Features</h4>
                  <p className="text-sm text-gray-300">Character progression, inventory, combat</p>
                </div>
                <div className="bg-gray-800 p-4 rounded">
                  <h4 className="text-purple-400 font-bold">Persistence</h4>
                  <p className="text-sm text-gray-300">Save/load system, data integrity</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntegrationTestPanel;
