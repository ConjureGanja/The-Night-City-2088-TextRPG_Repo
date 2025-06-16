// Character Progression Service for Night City Adventures
// Handles player stats, skills, attributes, and character development

import { audioService } from './audioService';
import { 
  CHARACTER_ORIGINS, 
  CHARACTER_ROLES, 
  CHARACTER_ATTRIBUTES,
  DEFAULT_CHARACTER,
  CHARACTER_STORY_INTEGRATION 
} from '../constants';

// Character Origin and Role types
export type CharacterOrigin = keyof typeof CHARACTER_ORIGINS;
export type CharacterRole = keyof typeof CHARACTER_ROLES;
export type CharacterBackgroundHook = string;
export type CharacterSpecialization = string;

export interface CharacterAttributes {
  body: number;          // Physical strength and health
  intelligence: number;  // Problem-solving and technical knowledge
  reflexes: number;      // Speed and dexterity
  technical: number;     // Engineering and crafting
  cool: number;         // Mental resilience and stealth
}

export interface CharacterSkills {
  // Body skills
  athletics: number;
  annihilation: number;
  streetBrawler: number;
  
  // Intelligence skills
  breach: number;
  quickhacking: number;
  
  // Reflexes skills
  assault: number;
  handguns: number;
  blades: number;
  
  // Technical skills
  crafting: number;
  engineering: number;
  
  // Cool skills
  stealth: number;
  coldBlood: number;
}

export interface CharacterStats {
  level: number;
  experience: number;
  experienceToNext: number;
  attributePoints: number;
  skillPoints: number;
  
  // Health and status
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  
  // Resources
  eddies: number;          // Currency
  credRating: number;      // Street credibility
  
  // Cybernetics
  humanityLoss: number;    // Cyberpsychosis tracker
  maxHumanity: number;
  
  // Combat stats (derived from attributes and skills)
  damage: number;
  defense: number;
  hackingPower: number;
  stealthRating: number;
  carryCapacity: number;
}

// Add character background data interface
export interface CharacterBackground {
  name: string;
  origin: CharacterOrigin;
  role: CharacterRole;
  specialization: CharacterSpecialization | null;
  backgroundStory: string;
  appearance: {
    gender: string;
    hairStyle: string;
    hairColor: string;
    eyeColor: string;
    facialFeatures: string;
    clothing: string;
    distinguishingMarks: string;
  };
  backgroundHooks: CharacterBackgroundHook[];
}

export interface Perk {
  id: string;
  name: string;
  description: string;
  attribute: keyof CharacterAttributes;
  skillRequirement?: { skill: keyof CharacterSkills; level: number };
  attributeRequirement?: { attribute: keyof CharacterAttributes; level: number };
  cost: number;
  unlocked: boolean;
  learned: boolean;
  effects: PerkEffect[];
}

export interface PerkEffect {
  type: 'stat_bonus' | 'skill_bonus' | 'special_ability' | 'passive_bonus';
  target: string;
  value: number;
  description: string;
}

export enum ProgressionEventType {
  LEVEL_UP = 'level_up',
  SKILL_INCREASE = 'skill_increase',
  ATTRIBUTE_INCREASE = 'attribute_increase',
  PERK_UNLOCKED = 'perk_unlocked',
  ACHIEVEMENT = 'achievement'
}

export interface ProgressionEvent {
  type: ProgressionEventType;
  title: string;
  description: string;
  timestamp: string;
  rewards?: {
    experience?: number;
    eddies?: number;
    items?: string[];
    perks?: string[];
  };
}

class CharacterProgressionService {
  private attributes: CharacterAttributes = {
    body: 3,
    intelligence: 3,
    reflexes: 3,
    technical: 3,
    cool: 3
  };

  private skills: CharacterSkills = {
    athletics: 1,
    annihilation: 1,
    streetBrawler: 1,
    breach: 1,
    quickhacking: 1,
    assault: 1,
    handguns: 1,
    blades: 1,
    crafting: 1,
    engineering: 1,
    stealth: 1,
    coldBlood: 1
  };

  private stats: CharacterStats = {
    level: 1,
    experience: 0,
    experienceToNext: 1000,
    attributePoints: 5,
    skillPoints: 0,
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    eddies: 500,
    credRating: 1,
    humanityLoss: 0,
    maxHumanity: 100,
    damage: 10,
    defense: 5,
    hackingPower: 5,
    stealthRating: 3,
    carryCapacity: 50
  };
  // Add character background data
  private background: CharacterBackground = {
    name: 'V',
    origin: 'STREET_KID',
    role: 'SOLO',
    specialization: null,
    backgroundStory: '',
    appearance: {
      gender: '',
      hairStyle: '',
      hairColor: '',
      eyeColor: '',
      facialFeatures: '',
      clothing: '',
      distinguishingMarks: ''
    },
    backgroundHooks: []
  };

  private perks: Map<string, Perk> = new Map();
  private progressionHistory: ProgressionEvent[] = [];

  constructor() {
    this.initializePerks();
    this.calculateDerivedStats();
    this.initializeBackgroundHooks();
  }

  // Initialize background hooks based on origin
  private initializeBackgroundHooks() {
    const originHooks = CHARACTER_STORY_INTEGRATION.ORIGIN_BACKSTORY_HOOKS[this.background.origin];
    if (originHooks) {
      // Pick 2 random hooks for the character
      this.background.backgroundHooks = originHooks
        .sort(() => Math.random() - 0.5)
        .slice(0, 2);
    }
  }

  // Set character origin and apply any origin-specific bonuses
  setOrigin(origin: CharacterOrigin): void {
    this.background.origin = origin;
    this.initializeBackgroundHooks();
    
    // Apply origin-specific attribute bonuses
    switch (origin) {
      case 'CORPO':
        this.attributes.intelligence += 1;
        this.attributes.cool += 1;
        break;
      case 'STREET_KID':
        this.attributes.reflexes += 1;
        this.attributes.cool += 1;
        break;
      case 'NOMAD':
        this.attributes.technical += 1;
        this.attributes.body += 1;
        break;
    }
    
    this.calculateDerivedStats();
    this.updatePerkAvailability();
    
    audioService.playSuccessSound();
  }

  // Set character role and apply role-specific bonuses
  setRole(role: CharacterRole): void {
    this.background.role = role;
    
    // Reset any specialization when role changes
    this.background.specialization = null;
    
    // Apply role-specific skill bonuses
    switch (role) {
      case 'SOLO':
        this.skills.handguns += 1;
        this.skills.athletics += 1;
        break;
      case 'NETRUNNER':
        this.skills.breach += 1;
        this.skills.quickhacking += 1;
        break;
      case 'TECHIE':
        this.skills.engineering += 1;
        this.skills.crafting += 1;
        break;
      case 'ROCKERBOY':
        // Would need a Charisma skill, use Cool attribute instead
        this.attributes.cool += 1;
        break;
      case 'FIXER':
        // Would need a Streetwise skill, improve Cool instead
        this.attributes.cool += 1;
        break;
      case 'NOMAD':
        this.skills.athletics += 1;
        break;
      case 'MEDIA':
        this.attributes.intelligence += 1;
        break;
      case 'MEDTECH':
        // Would need a Medicine skill, improve Technical instead
        this.attributes.technical += 1;
        break;
      case 'EXEC':
        this.attributes.intelligence += 1;
        break;
    }
    
    this.calculateDerivedStats();
    this.updatePerkAvailability();
    
    audioService.playSuccessSound();
  }

  // Set character specialization
  setSpecialization(specialization: CharacterSpecialization): void {
    const availableSpecializations = CHARACTER_STORY_INTEGRATION.ROLE_SPECIALIZATION_OPTIONS[this.background.role];
    
    if (availableSpecializations?.includes(specialization)) {
      this.background.specialization = specialization;
      audioService.playSuccessSound();
    }
  }

  // Set character appearance
  setAppearance(appearance: CharacterBackground['appearance']): void {
    this.background.appearance = appearance;
  }
  // Set character background story
  setBackgroundStory(story: string): void {
    this.background.backgroundStory = story;
  }

  // Set character name
  setCharacterName(name: string): void {
    this.background.name = name.trim() || 'V';
  }

  // Get character background
  getBackground(): CharacterBackground {
    return { ...this.background };
  }

  // Get available specializations for current role
  getAvailableSpecializations(): CharacterSpecialization[] {
    return CHARACTER_STORY_INTEGRATION.ROLE_SPECIALIZATION_OPTIONS[this.background.role] || [];
  }

  private initializePerks() {
    const defaultPerks: Perk[] = [
      {
        id: 'regeneration',
        name: 'Regeneration',
        description: 'Slowly recover health outside of combat',
        attribute: 'body',
        attributeRequirement: { attribute: 'body', level: 5 },
        cost: 1,
        unlocked: false,
        learned: false,
        effects: [{
          type: 'passive_bonus',
          target: 'health_regen',
          value: 0.5,
          description: 'Regenerate 0.5 health per second out of combat'
        }]
      },
      {
        id: 'enhanced_memory',
        name: 'Enhanced Memory',
        description: 'Better retention of learned information',
        attribute: 'intelligence',
        attributeRequirement: { attribute: 'intelligence', level: 5 },
        cost: 1,
        unlocked: false,
        learned: false,
        effects: [{
          type: 'stat_bonus',
          target: 'experience_gain',
          value: 10,
          description: '+10% experience gained'
        }]
      },
      {
        id: 'lightning_reflexes',
        name: 'Lightning Reflexes',
        description: 'Increased movement and attack speed',
        attribute: 'reflexes',
        attributeRequirement: { attribute: 'reflexes', level: 6 },
        cost: 1,
        unlocked: false,
        learned: false,
        effects: [{
          type: 'stat_bonus',
          target: 'attack_speed',
          value: 15,
          description: '+15% attack speed'
        }]
      },
      {
        id: 'tech_specialist',
        name: 'Tech Specialist',
        description: 'Advanced technical knowledge and crafting',
        attribute: 'technical',
        skillRequirement: { skill: 'crafting', level: 3 },
        cost: 1,
        unlocked: false,
        learned: false,
        effects: [{
          type: 'skill_bonus',
          target: 'crafting',
          value: 2,
          description: '+2 levels to crafting skill'
        }]
      },
      {
        id: 'ice_cold',
        name: 'Ice Cold',
        description: 'Immunity to fear and enhanced stealth',
        attribute: 'cool',
        attributeRequirement: { attribute: 'cool', level: 7 },
        cost: 1,
        unlocked: false,
        learned: false,
        effects: [{
          type: 'stat_bonus',
          target: 'stealth_rating',
          value: 3,
          description: '+3 stealth rating'
        }]
      }
    ];

    defaultPerks.forEach(perk => {
      this.perks.set(perk.id, perk);
    });
  }

  private calculateDerivedStats() {
    // Calculate health and stamina based on body
    this.stats.maxHealth = 100 + (this.attributes.body - 3) * 20;
    this.stats.maxStamina = 100 + (this.attributes.body - 3) * 15;

    // Calculate damage based on relevant attributes and skills
    this.stats.damage = 10 + this.attributes.body + this.skills.assault + this.skills.handguns;

    // Calculate defense based on body and athletics
    this.stats.defense = 5 + this.attributes.body + this.skills.athletics;

    // Calculate hacking power based on intelligence and breach skills
    this.stats.hackingPower = this.attributes.intelligence + this.skills.breach + this.skills.quickhacking;

    // Calculate stealth rating based on cool and stealth skill
    this.stats.stealthRating = this.attributes.cool + this.skills.stealth;

    // Calculate carry capacity based on body
    this.stats.carryCapacity = 50 + (this.attributes.body * 10);

    // Apply perk effects
    this.applyPerkEffects();
  }

  private applyPerkEffects() {
    for (const perk of this.perks.values()) {
      if (perk.learned) {
        for (const effect of perk.effects) {
          // Apply perk bonuses to stats
          switch (effect.target) {
            case 'health_regen':
              // This would be handled in game loop
              break;
            case 'experience_gain':
              // This would be applied when gaining experience
              break;
            case 'stealth_rating':
              this.stats.stealthRating += effect.value;
              break;
            // Add more effect applications as needed
          }
        }
      }
    }
  }

  private updatePerkAvailability() {
    for (const perk of this.perks.values()) {
      let canUnlock = true;

      // Check attribute requirements
      if (perk.attributeRequirement) {
        const { attribute, level } = perk.attributeRequirement;
        if (this.attributes[attribute] < level) {
          canUnlock = false;
        }
      }

      // Check skill requirements
      if (perk.skillRequirement) {
        const { skill, level } = perk.skillRequirement;
        if (this.skills[skill] < level) {
          canUnlock = false;
        }
      }

      perk.unlocked = canUnlock;
    }
  }

  // Experience and leveling
  addExperience(amount: number): ProgressionEvent[] {
    const events: ProgressionEvent[] = [];
    
    // Apply experience bonuses from perks
    const bonusMultiplier = this.getExperienceBonus();
    const actualAmount = Math.floor(amount * bonusMultiplier);
    
    this.stats.experience += actualAmount;

    // Check for level ups
    while (this.stats.experience >= this.stats.experienceToNext) {
      this.stats.experience -= this.stats.experienceToNext;
      this.stats.level++;
      this.stats.attributePoints += 1;
      this.stats.skillPoints += 2;
      this.stats.experienceToNext = this.calculateExperienceForNextLevel();

      events.push({
        type: ProgressionEventType.LEVEL_UP,
        title: 'Level Up!',
        description: `You've reached level ${this.stats.level}!`,
        timestamp: new Date().toLocaleTimeString(),
        rewards: {
          experience: 0,
          eddies: this.stats.level * 50
        }
      });

      // Award level-up bonus eddies
      this.stats.eddies += this.stats.level * 50;

      // Restore health and stamina on level up
      this.stats.health = this.stats.maxHealth;
      this.stats.stamina = this.stats.maxStamina;

      audioService.playSuccessSound();
    }

    this.calculateDerivedStats();
    this.updatePerkAvailability();

    return events;
  }

  private calculateExperienceForNextLevel(): number {
    return Math.floor(1000 * Math.pow(1.15, this.stats.level - 1));
  }

  private getExperienceBonus(): number {
    let bonus = 1.0;
    
    // Check for experience bonus perks
    for (const perk of this.perks.values()) {
      if (perk.learned) {
        for (const effect of perk.effects) {
          if (effect.target === 'experience_gain') {
            bonus += effect.value / 100;
          }
        }
      }
    }
    
    return bonus;
  }

  // Attribute management
  increaseAttribute(attribute: keyof CharacterAttributes): { success: boolean; message: string } {
    if (this.stats.attributePoints <= 0) {
      return { success: false, message: 'No attribute points available' };
    }

    if (this.attributes[attribute] >= 20) {
      return { success: false, message: 'Attribute already at maximum level' };
    }

    this.attributes[attribute]++;
    this.stats.attributePoints--;
    
    this.calculateDerivedStats();
    this.updatePerkAvailability();

    audioService.playUIClick();

    const event: ProgressionEvent = {
      type: ProgressionEventType.ATTRIBUTE_INCREASE,
      title: 'Attribute Increased',
      description: `${attribute.charAt(0).toUpperCase() + attribute.slice(1)} increased to ${this.attributes[attribute]}`,
      timestamp: new Date().toLocaleTimeString()
    };

    this.progressionHistory.push(event);

    return { success: true, message: `${attribute} increased to ${this.attributes[attribute]}` };
  }

  // Skill management
  increaseSkill(skill: keyof CharacterSkills): { success: boolean; message: string } {
    if (this.stats.skillPoints <= 0) {
      return { success: false, message: 'No skill points available' };
    }

    if (this.skills[skill] >= 20) {
      return { success: false, message: 'Skill already at maximum level' };
    }

    this.skills[skill]++;
    this.stats.skillPoints--;
    
    this.calculateDerivedStats();
    this.updatePerkAvailability();

    audioService.playUIClick();

    const event: ProgressionEvent = {
      type: ProgressionEventType.SKILL_INCREASE,
      title: 'Skill Improved',
      description: `${skill} increased to ${this.skills[skill]}`,
      timestamp: new Date().toLocaleTimeString()
    };

    this.progressionHistory.push(event);

    return { success: true, message: `${skill} increased to ${this.skills[skill]}` };
  }

  // Perk management
  learnPerk(perkId: string): { success: boolean; message: string } {
    const perk = this.perks.get(perkId);
    
    if (!perk) {
      return { success: false, message: 'Perk not found' };
    }

    if (!perk.unlocked) {
      return { success: false, message: 'Perk requirements not met' };
    }

    if (perk.learned) {
      return { success: false, message: 'Perk already learned' };
    }

    if (this.stats.skillPoints < perk.cost) {
      return { success: false, message: 'Insufficient skill points' };
    }

    perk.learned = true;
    this.stats.skillPoints -= perk.cost;
    
    this.calculateDerivedStats();

    audioService.playSuccessSound();

    const event: ProgressionEvent = {
      type: ProgressionEventType.PERK_UNLOCKED,
      title: 'Perk Learned',
      description: `Learned ${perk.name}: ${perk.description}`,
      timestamp: new Date().toLocaleTimeString()
    };

    this.progressionHistory.push(event);

    return { success: true, message: `Learned perk: ${perk.name}` };
  }

  // Health and status management
  takeDamage(amount: number): { currentHealth: number; isDead: boolean } {
    this.stats.health = Math.max(0, this.stats.health - amount);
    return {
      currentHealth: this.stats.health,
      isDead: this.stats.health <= 0
    };
  }

  heal(amount: number): number {
    const oldHealth = this.stats.health;
    this.stats.health = Math.min(this.stats.maxHealth, this.stats.health + amount);
    return this.stats.health - oldHealth;
  }

  useStamina(amount: number): boolean {
    if (this.stats.stamina >= amount) {
      this.stats.stamina -= amount;
      return true;
    }
    return false;
  }

  restoreStamina(amount: number): number {
    const oldStamina = this.stats.stamina;
    this.stats.stamina = Math.min(this.stats.maxStamina, this.stats.stamina + amount);
    return this.stats.stamina - oldStamina;
  }

  // Currency and cred management
  addEddies(amount: number): void {
    this.stats.eddies += amount;
  }

  spendEddies(amount: number): boolean {
    if (this.stats.eddies >= amount) {
      this.stats.eddies -= amount;
      return true;
    }
    return false;
  }

  addCredRating(amount: number): void {
    this.stats.credRating = Math.min(100, this.stats.credRating + amount);
  }

  // Cybernetics and humanity
  addHumanityLoss(amount: number): void {
    this.stats.humanityLoss = Math.min(this.stats.maxHumanity, this.stats.humanityLoss + amount);
  }

  // Getters
  getAttributes(): CharacterAttributes {
    return { ...this.attributes };
  }

  getSkills(): CharacterSkills {
    return { ...this.skills };
  }

  getStats(): CharacterStats {
    return { ...this.stats };
  }

  getPerks(): Perk[] {
    return Array.from(this.perks.values());
  }

  getAvailablePerks(): Perk[] {
    return Array.from(this.perks.values()).filter(perk => perk.unlocked && !perk.learned);
  }

  getLearnedPerks(): Perk[] {
    return Array.from(this.perks.values()).filter(perk => perk.learned);
  }

  getProgressionHistory(): ProgressionEvent[] {
    return [...this.progressionHistory];
  }

  // Character summary for display
  getCharacterSummary(): {
    level: number;
    attributes: CharacterAttributes;
    primaryStats: {
      health: string;
      stamina: string;
      eddies: number;
      credRating: number;
    };
    combatRating: {
      damage: number;
      defense: number;
      hacking: number;
      stealth: number;
    };
  } {
    return {
      level: this.stats.level,
      attributes: this.getAttributes(),
      primaryStats: {
        health: `${this.stats.health}/${this.stats.maxHealth}`,
        stamina: `${this.stats.stamina}/${this.stats.maxStamina}`,
        eddies: this.stats.eddies,
        credRating: this.stats.credRating
      },
      combatRating: {
        damage: this.stats.damage,
        defense: this.stats.defense,
        hacking: this.stats.hackingPower,
        stealth: this.stats.stealthRating
      }
    };
  }

  // Save/Load functionality
  saveCharacterData(): string {
    const saveData = {
      attributes: this.attributes,
      skills: this.skills,
      stats: this.stats,
      perks: Array.from(this.perks.entries()),
      progressionHistory: this.progressionHistory
    };
    return JSON.stringify(saveData);
  }

  loadCharacterData(saveData: string): boolean {
    try {
      const data = JSON.parse(saveData);
      this.attributes = data.attributes;
      this.skills = data.skills;
      this.stats = data.stats;
      this.perks = new Map(data.perks);
      this.progressionHistory = data.progressionHistory;
      
      this.calculateDerivedStats();
      this.updatePerkAvailability();
      
      return true;
    } catch (error) {
      console.error('Failed to load character data:', error);
      return false;
    }
  }

  // Reset character (new game)
  resetCharacter(): void {
    // Reset attributes using default values
    this.attributes = {
      body: 3,
      intelligence: 3,
      reflexes: 3,
      technical: 3,
      cool: 3
    };

    this.skills = {
      athletics: 1,
      annihilation: 1,
      streetBrawler: 1,
      breach: 1,
      quickhacking: 1,
      assault: 1,
      handguns: 1,
      blades: 1,
      crafting: 1,
      engineering: 1,
      stealth: 1,
      coldBlood: 1
    };

    this.stats = {
      level: 1,
      experience: 0,
      experienceToNext: 1000,
      attributePoints: 5,
      skillPoints: 0,
      health: 100,
      maxHealth: 100,
      stamina: 100,
      maxStamina: 100,
      eddies: 500,
      credRating: 1,
      humanityLoss: 0,
      maxHumanity: 100,
      damage: 10,
      defense: 5,
      hackingPower: 5,
      stealthRating: 3,
      carryCapacity: 50
    };
      // Reset character background using DEFAULT_CHARACTER
    this.background = {
      name: 'V',
      origin: DEFAULT_CHARACTER.origin as CharacterOrigin,
      role: DEFAULT_CHARACTER.role as CharacterRole,
      specialization: null,
      backgroundStory: DEFAULT_CHARACTER.background,
      appearance: { ...DEFAULT_CHARACTER.appearance },
      backgroundHooks: []
    };

    // Reset perks
    for (const perk of this.perks.values()) {
      perk.learned = false;
      perk.unlocked = false;
    }

    this.progressionHistory = [];
    this.calculateDerivedStats();
    this.updatePerkAvailability();
  }
}

// Export singleton instance
export const characterProgressionService = new CharacterProgressionService();
