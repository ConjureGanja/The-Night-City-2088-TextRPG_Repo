// Story Event Processor for Night City 2088
// Handles complex story events and their game system impacts

import { characterProgressionService } from './characterProgressionService';
import { inventoryService } from './inventoryService';

interface CombatResult {
  playerDamage: number;
  enemyDamage: number;
  playerHealth: number;
  victory: boolean;
  fled: boolean;
  experienceGained: number;
}

interface StoryEventData {
  type: 'combat' | 'discovery' | 'social' | 'hacking' | 'stealth';
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  rewards?: {
    experience?: number;
    eddies?: number;
    items?: string[];
    reputation?: number;
  };
}

class StoryEventProcessor {
  private combatEvents: Array<{
    pattern: RegExp;
    difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  }> = [
    { pattern: /small\s+gang|petty\s+thief|street\s+punk/gi, difficulty: 'easy' },
    { pattern: /armed\s+guard|security\s+team|corpo\s+soldier/gi, difficulty: 'medium' },
    { pattern: /cyber\s+psycho|gang\s+boss|elite\s+unit/gi, difficulty: 'hard' },
    { pattern: /arasaka\s+assassin|maxtac|legendary/gi, difficulty: 'extreme' }
  ];

  // Process combat encounters
  processCombat(storyText: string, playerAction: string): CombatResult {
    const difficulty = this.determineCombatDifficulty(storyText);
    const playerStats = characterProgressionService.getStats();
    const playerSkills = characterProgressionService.getSkills();
    
    // Calculate player's combat effectiveness
    const combatEffectiveness = this.calculateCombatEffectiveness(playerStats, playerSkills, playerAction);
    
    // Calculate enemy strength based on difficulty
    const enemyStrength = this.getEnemyStrength(difficulty);
    
    // Resolve combat
    const playerDamage = Math.floor(combatEffectiveness * (0.8 + Math.random() * 0.4));
    const enemyDamage = Math.floor(enemyStrength * (0.6 + Math.random() * 0.4));
    
    // Apply damage reduction based on player's defense
    const actualEnemyDamage = Math.max(1, enemyDamage - Math.floor(playerStats.defense / 3));
    
    // Determine victory conditions
    const victory = playerDamage > enemyStrength * 0.7;
    const fled = playerAction.toLowerCase().includes('flee') || playerAction.toLowerCase().includes('run');
    
    // Apply damage to player
    const damageResult = characterProgressionService.takeDamage(actualEnemyDamage);
    
    // Calculate experience reward
    const baseExp = this.getExperienceForDifficulty(difficulty);
    const experienceGained = victory ? baseExp : Math.floor(baseExp * 0.3);
    
    characterProgressionService.addExperience(experienceGained);
    
    // Add eddies for victory
    if (victory) {
      const eddiesReward = this.getEddiesForDifficulty(difficulty);
      characterProgressionService.addEddies(eddiesReward);
    }

    return {
      playerDamage,
      enemyDamage: actualEnemyDamage,
      playerHealth: damageResult.currentHealth,
      victory,
      fled,
      experienceGained
    };
  }

  // Process skill-based challenges
  processSkillChallenge(storyText: string, skillType: string): {
    success: boolean;
    experienceGained: number;
    consequences: string[];
  } {
    const playerSkills = characterProgressionService.getSkills();
    const playerAttributes = characterProgressionService.getAttributes();
    
    let skillValue = 0;
    let attributeBonus = 0;
    
    // Map story context to actual skills
    switch (skillType.toLowerCase()) {
      case 'hacking':
      case 'netrunning':
        skillValue = playerSkills.breach + playerSkills.quickhacking;
        attributeBonus = playerAttributes.intelligence;
        break;
      case 'stealth':
      case 'sneaking':
        skillValue = playerSkills.stealth;
        attributeBonus = playerAttributes.cool;
        break;
      case 'technical':
      case 'engineering':
        skillValue = playerSkills.engineering + playerSkills.crafting;
        attributeBonus = playerAttributes.technical;
        break;
      case 'social':
      case 'persuasion':
        attributeBonus = playerAttributes.cool + playerAttributes.intelligence;
        break;
      case 'combat':
        skillValue = playerSkills.handguns + playerSkills.assault;
        attributeBonus = playerAttributes.reflexes;
        break;
      default:
        skillValue = 5; // Default moderate skill
        attributeBonus = 5;
    }
    
    // Calculate success chance
    const totalSkill = skillValue + Math.floor(attributeBonus / 2);
    const difficulty = this.extractDifficultyFromStory(storyText);
    const difficultyNumber = this.getDifficultyValue(difficulty);
    
    const successChance = Math.min(0.95, Math.max(0.05, (totalSkill * 5) / difficultyNumber));
    const success = Math.random() < successChance;
    
    // Award experience based on difficulty and outcome
    const baseExp = 15 + (difficultyNumber / 5);
    const experienceGained = success ? baseExp : Math.floor(baseExp * 0.6);
    characterProgressionService.addExperience(experienceGained);
    
    // Generate consequences
    const consequences: string[] = [];
    if (success) {
      consequences.push(`Successfully used ${skillType} skills`);
      if (Math.random() < 0.3) {
        characterProgressionService.addCredRating(1);
        consequences.push('Gained street cred');
      }
    } else {
      consequences.push(`Failed ${skillType} attempt`);
      if (Math.random() < 0.4) {
        characterProgressionService.takeDamage(5);
        consequences.push('Suffered minor consequences');
      }
    }
    
    return {
      success,
      experienceGained,
      consequences
    };
  }

  // Process item discoveries with context
  processItemDiscovery(itemDescription: string, storyContext: string): boolean {
    // Enhanced item creation based on story context
    const contextualItem = this.createContextualItem(itemDescription, storyContext);
    
    if (contextualItem) {
      const added = inventoryService.addItem(contextualItem, 1);
      if (added) {
        // Award small experience for discovery
        characterProgressionService.addExperience(5);
        return true;
      }
    }
    
    return false;
  }

  // Helper methods
  private determineCombatDifficulty(storyText: string): 'easy' | 'medium' | 'hard' | 'extreme' {
    for (const event of this.combatEvents) {
      if (event.pattern.test(storyText)) {
        return event.difficulty;
      }
    }
    return 'medium'; // Default difficulty
  }

  private calculateCombatEffectiveness(stats: any, skills: any, action: string): number {
    let effectiveness = stats.damage;
    
    // Bonus based on action type
    if (action.toLowerCase().includes('sneak') || action.toLowerCase().includes('stealth')) {
      effectiveness += skills.stealth * 2;
    } else if (action.toLowerCase().includes('hack')) {
      effectiveness += skills.breach * 3;
    } else if (action.toLowerCase().includes('shoot') || action.toLowerCase().includes('gun')) {
      effectiveness += skills.handguns * 2;
    } else if (action.toLowerCase().includes('sword') || action.toLowerCase().includes('blade')) {
      effectiveness += skills.blades * 2;
    }
    
    return effectiveness;
  }

  private getEnemyStrength(difficulty: string): number {
    const strengthMap = {
      'easy': 15,
      'medium': 25,
      'hard': 40,
      'extreme': 60
    };
    return strengthMap[difficulty as keyof typeof strengthMap] || 25;
  }

  private getExperienceForDifficulty(difficulty: string): number {
    const expMap = {
      'easy': 10,
      'medium': 20,
      'hard': 35,
      'extreme': 50
    };
    return expMap[difficulty as keyof typeof expMap] || 20;
  }

  private getEddiesForDifficulty(difficulty: string): number {
    const eddiesMap = {
      'easy': 50,
      'medium': 100,
      'hard': 200,
      'extreme': 400
    };
    return eddiesMap[difficulty as keyof typeof eddiesMap] || 100;
  }

  private extractDifficultyFromStory(storyText: string): string {
    const text = storyText.toLowerCase();
    
    if (text.includes('extremely') || text.includes('nearly impossible') || text.includes('legendary')) {
      return 'extreme';
    } else if (text.includes('difficult') || text.includes('challenging') || text.includes('tough')) {
      return 'hard';
    } else if (text.includes('moderate') || text.includes('standard') || text.includes('normal')) {
      return 'medium';
    } else if (text.includes('easy') || text.includes('simple') || text.includes('basic')) {
      return 'easy';
    }
    
    return 'medium';
  }

  private getDifficultyValue(difficulty: string): number {
    const difficultyMap = {
      'easy': 50,
      'medium': 75,
      'hard': 100,
      'extreme': 130
    };
    return difficultyMap[difficulty as keyof typeof difficultyMap] || 75;
  }

  private createContextualItem(description: string, context: string): any | null {
    const desc = description.toLowerCase();
    const ctx = context.toLowerCase();
    
    // Enhanced item creation based on context
    if (ctx.includes('corpo') || ctx.includes('arasaka')) {
      if (desc.includes('data') || desc.includes('chip')) {
        return inventoryService.createItem({
          id: `corpo_data_${Date.now()}`,
          name: 'Corporate Data Shard',
          description: 'Encrypted corporate data - potentially valuable',
          type: 'DATA' as any,
          rarity: 'RARE' as any,
          weight: 0.1,
          value: 500
        });
      }
    } else if (ctx.includes('gang') || ctx.includes('street')) {
      if (desc.includes('weapon') || desc.includes('gun')) {
        return inventoryService.createItem({
          id: `street_weapon_${Date.now()}`,
          name: 'Street Weapon',
          description: 'A well-used but reliable street weapon',
          type: 'WEAPON' as any,
          rarity: 'COMMON' as any,
          weight: 2.0,
          value: 300
        });
      }
    }
    
    // Default item creation
    return inventoryService.createItem({
      id: `found_${Date.now()}`,
      name: description,
      description: `Found: ${description}`,
      type: 'MISC' as any,
      rarity: 'COMMON' as any,
      weight: 1.0,
      value: 100
    });
  }
}

export const storyEventProcessor = new StoryEventProcessor();
export type { CombatResult, StoryEventData };
