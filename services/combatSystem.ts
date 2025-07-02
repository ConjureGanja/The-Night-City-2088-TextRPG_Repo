// Combat System for Night City 2088
// Handles combat mechanics integration with story events

import { characterProgressionService } from './characterProgressionService';
import { inventoryService } from './inventoryService';

interface CombatParticipant {
  name: string;
  health: number;
  maxHealth: number;
  damage: number;
  defense: number;
  skills: {
    combat: number;
    dodge: number;
    stealth: number;
  };
}

interface CombatAction {
  type: 'attack' | 'defend' | 'flee' | 'special';
  description: string;
  effectiveness: number;
}

interface CombatOutcome {
  victory: boolean;
  fled: boolean;
  playerDamage: number;
  enemyDamage: number;
  experienceGained: number;
  lootGained: string[];
  consequences: string[];
}

interface Enemy {
  name: string;
  type: 'gang_member' | 'corpo_guard' | 'cyber_psycho' | 'security_bot' | 'boss';
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  health: number;
  damage: number;
  defense: number;
  loot: string[];
  experienceReward: number;
}

class CombatSystem {
  private enemies: Map<string, Enemy> = new Map();

  constructor() {
    this.initializeEnemies();
  }

  // Initialize enemy types
  private initializeEnemies() {
    const enemyTemplates: Enemy[] = [
      {
        name: 'Street Gang Member',
        type: 'gang_member',
        difficulty: 'easy',
        health: 40,
        damage: 12,
        defense: 2,
        loot: ['credstick', 'street_weapon'],
        experienceReward: 15
      },
      {
        name: 'Corporate Security',
        type: 'corpo_guard',
        difficulty: 'medium',
        health: 70,
        damage: 18,
        defense: 5,
        loot: ['corpo_weapon', 'security_badge', 'credstick'],
        experienceReward: 25
      },
      {
        name: 'Cyber Psycho',
        type: 'cyber_psycho',
        difficulty: 'hard',
        health: 120,
        damage: 30,
        defense: 8,
        loot: ['cyberware', 'high_value_data', 'military_grade_weapon'],
        experienceReward: 50
      },
      {
        name: 'Security Bot',
        type: 'security_bot',
        difficulty: 'medium',
        health: 60,
        damage: 20,
        defense: 10,
        loot: ['tech_components', 'data_shard'],
        experienceReward: 30
      },
      {
        name: 'Gang Boss',
        type: 'boss',
        difficulty: 'extreme',
        health: 200,
        damage: 45,
        defense: 12,
        loot: ['legendary_weapon', 'boss_data', 'massive_credstick'],
        experienceReward: 100
      }
    ];

    enemyTemplates.forEach(enemy => {
      this.enemies.set(enemy.name.toLowerCase(), enemy);
    });
  }

  // Resolve combat based on story context
  resolveCombatFromStory(storyText: string, playerAction: string): CombatOutcome {
    const enemy = this.identifyEnemyFromStory(storyText);
    const playerStats = this.getPlayerCombatStats();
    
    return this.executeCombat(playerStats, enemy, playerAction);
  }

  // Identify enemy type from story text
  private identifyEnemyFromStory(storyText: string): Enemy {
    const text = storyText.toLowerCase();
    
    // Check for specific enemy mentions
    for (const [key, enemy] of this.enemies.entries()) {
      if (text.includes(key) || text.includes(enemy.type.replace('_', ' '))) {
        return { ...enemy }; // Return copy
      }
    }
    
    // Fallback based on context clues
    if (text.includes('gang') || text.includes('street')) {
      return { ...this.enemies.get('street gang member')! };
    } else if (text.includes('corpo') || text.includes('security')) {
      return { ...this.enemies.get('corporate security')! };
    } else if (text.includes('psycho') || text.includes('cyberware malfunction')) {
      return { ...this.enemies.get('cyber psycho')! };
    } else if (text.includes('bot') || text.includes('automated')) {
      return { ...this.enemies.get('security bot')! };
    } else if (text.includes('boss') || text.includes('leader')) {
      return { ...this.enemies.get('gang boss')! };
    }
    
    // Default to gang member
    return { ...this.enemies.get('street gang member')! };
  }

  // Get player combat statistics
  private getPlayerCombatStats(): CombatParticipant {
    const stats = characterProgressionService.getStats();
    const skills = characterProgressionService.getSkills();
    const attributes = characterProgressionService.getAttributes();
    
    return {
      name: 'Player',
      health: stats.health,
      maxHealth: stats.maxHealth,
      damage: stats.damage,
      defense: stats.defense,
      skills: {
        combat: skills.handguns + skills.assault + skills.blades,
        dodge: attributes.reflexes + skills.athletics,
        stealth: skills.stealth + attributes.cool
      }
    };
  }

  // Execute combat sequence
  private executeCombat(player: CombatParticipant, enemy: Enemy, playerAction: string): CombatOutcome {
    const action = this.parsePlayerAction(playerAction);
    let playerDamage = 0;
    let enemyDamage = 0;
    let fled = false;
    
    // Handle different action types
    switch (action.type) {
      case 'flee':
        fled = this.attemptFlee(player, enemy);
        if (fled) {
          return {
            victory: false,
            fled: true,
            playerDamage: 0,
            enemyDamage: 0,
            experienceGained: 5, // Small reward for surviving
            lootGained: [],
            consequences: ['Successfully escaped from combat']
          };
        }
        // Failed to flee, take damage
        enemyDamage = this.calculateDamage(enemy.damage, player.defense);
        break;
        
      case 'defend':
        // Defensive stance reduces incoming damage
        enemyDamage = Math.floor(this.calculateDamage(enemy.damage, player.defense) * 0.6);
        playerDamage = Math.floor(player.damage * 0.7); // Reduced offensive capability
        break;
        
      case 'special':
        // Special actions based on skills
        const result = this.executeSpecialAction(action.description, player, enemy);
        playerDamage = result.damage;
        enemyDamage = result.counterDamage;
        break;
        
      default: // 'attack'
        playerDamage = this.calculatePlayerDamage(player, action.effectiveness);
        enemyDamage = this.calculateDamage(enemy.damage, player.defense);
        break;
    }
    
    // Apply damage
    const playerHealthResult = characterProgressionService.takeDamage(enemyDamage);
    const victory = playerDamage >= enemy.health;
    
    // Calculate experience and loot
    let experienceGained = 0;
    let lootGained: string[] = [];
    
    if (victory) {
      experienceGained = enemy.experienceReward;
      lootGained = this.generateLoot(enemy);
      
      // Add experience and process loot
      characterProgressionService.addExperience(experienceGained);
      lootGained.forEach(item => {
        inventoryService.addItemFromStory(item);
      });
      
      // Award eddies for victory
      const eddiesReward = this.calculateEddiesReward(enemy.difficulty);
      characterProgressionService.addEddies(eddiesReward);
    } else if (!fled) {
      // Partial experience for surviving
      experienceGained = Math.floor(enemy.experienceReward * 0.3);
      characterProgressionService.addExperience(experienceGained);
    }
    
    return {
      victory,
      fled,
      playerDamage,
      enemyDamage,
      experienceGained,
      lootGained,
      consequences: this.generateCombatConsequences(victory, fled, enemyDamage, playerHealthResult.isDead)
    };
  }

  // Parse player action from text
  private parsePlayerAction(actionText: string): CombatAction {
    const text = actionText.toLowerCase();
    
    if (text.includes('flee') || text.includes('run') || text.includes('escape')) {
      return { type: 'flee', description: 'attempt to flee', effectiveness: 0.8 };
    } else if (text.includes('defend') || text.includes('block') || text.includes('guard')) {
      return { type: 'defend', description: 'defensive stance', effectiveness: 0.7 };
    } else if (text.includes('hack') || text.includes('quickhack')) {
      return { type: 'special', description: 'quickhack', effectiveness: 1.2 };
    } else if (text.includes('stealth') || text.includes('sneak')) {
      return { type: 'special', description: 'stealth attack', effectiveness: 1.5 };
    } else if (text.includes('sword') || text.includes('blade')) {
      return { type: 'attack', description: 'melee attack', effectiveness: 1.1 };
    } else if (text.includes('gun') || text.includes('shoot')) {
      return { type: 'attack', description: 'ranged attack', effectiveness: 1.0 };
    }
    
    // Default attack
    return { type: 'attack', description: 'standard attack', effectiveness: 1.0 };
  }

  // Calculate damage with modifiers
  private calculateDamage(baseDamage: number, defense: number): number {
    const damage = Math.max(1, baseDamage - Math.floor(defense / 2));
    return Math.floor(damage * (0.8 + Math.random() * 0.4)); // Add randomness
  }

  // Calculate player damage with skill bonuses
  private calculatePlayerDamage(player: CombatParticipant, effectiveness: number): number {
    let damage = player.damage * effectiveness;
    
    // Add skill bonuses
    damage += Math.floor(player.skills.combat * 0.5);
    
    // Random variation
    damage *= (0.8 + Math.random() * 0.4);
    
    return Math.floor(damage);
  }

  // Execute special actions
  private executeSpecialAction(action: string, player: CombatParticipant, enemy: Enemy): { damage: number; counterDamage: number } {
    let damage = player.damage;
    let counterDamage = enemy.damage;
    
    switch (action) {
      case 'quickhack':
        // Hacking power affects damage
        const stats = characterProgressionService.getStats();
        damage += stats.hackingPower;
        counterDamage = Math.floor(counterDamage * 0.5); // Reduced counter-attack
        break;
        
      case 'stealth attack':
        // Stealth bonus
        damage = Math.floor(damage * 1.5);
        counterDamage = 0; // No counter-attack if successful
        break;
        
      default:
        // Standard attack
        break;
    }
    
    return {
      damage: this.calculatePlayerDamage(player, 1.0),
      counterDamage: this.calculateDamage(counterDamage, player.defense)
    };
  }

  // Attempt to flee from combat
  private attemptFlee(player: CombatParticipant, enemy: Enemy): boolean {
    const fleeChance = (player.skills.dodge + player.skills.stealth) / 20;
    const difficultyModifier = this.getDifficultyModifier(enemy.difficulty);
    
    return Math.random() < (fleeChance * difficultyModifier);
  }

  // Generate loot based on enemy
  private generateLoot(enemy: Enemy): string[] {
    const loot: string[] = [];
    
    enemy.loot.forEach(item => {
      if (Math.random() < 0.6) { // 60% chance for each item
        loot.push(item);
      }
    });
    
    return loot;
  }

  // Calculate eddies reward
  private calculateEddiesReward(difficulty: string): number {
    const rewards = {
      'easy': 50,
      'medium': 100,
      'hard': 200,
      'extreme': 400
    };
    
    return rewards[difficulty as keyof typeof rewards] || 50;
  }

  // Get difficulty modifier
  private getDifficultyModifier(difficulty: string): number {
    const modifiers = {
      'easy': 1.2,
      'medium': 1.0,
      'hard': 0.8,
      'extreme': 0.6
    };
    
    return modifiers[difficulty as keyof typeof modifiers] || 1.0;
  }

  // Generate combat consequences
  private generateCombatConsequences(victory: boolean, fled: boolean, damageTaken: number, isDead: boolean): string[] {
    const consequences: string[] = [];
    
    if (isDead) {
      consequences.push('Critical injury sustained - immediate medical attention required');
    } else if (damageTaken > 30) {
      consequences.push('Severe injuries sustained');
    } else if (damageTaken > 15) {
      consequences.push('Moderate injuries sustained');
    }
    
    if (victory) {
      consequences.push('Combat concluded successfully');
      consequences.push('Area secured');
    } else if (fled) {
      consequences.push('Tactical retreat executed');
    } else {
      consequences.push('Combat situation unresolved');
    }
    
    return consequences;
  }
}

export const combatSystem = new CombatSystem();
export type { CombatOutcome, Enemy, CombatAction };
