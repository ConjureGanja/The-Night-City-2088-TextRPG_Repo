// Inventory System for Night City Adventures
import { audioService } from './audioService';

export enum ItemType {
  WEAPON = 'weapon',
  ARMOR = 'armor',
  CYBERWARE = 'cyberware',
  CONSUMABLE = 'consumable',
  TOOL = 'tool',
  DATA = 'data',
  MISC = 'misc'
}

export enum ItemRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  value: number;
  weight: number;
  usable: boolean;
  equippable: boolean;
  stats?: {
    damage?: number;
    defense?: number;
    hackingBonus?: number;
    stealthBonus?: number;
    charismaBonus?: number;
    techBonus?: number;
  };
  requirements?: {
    level?: number;
    stats?: {
      [key: string]: number;
    };
  };
  effects?: {
    heal?: number;
    buff?: {
      stat: string;
      value: number;
      duration: number;
    };
  };
}

export interface InventorySlot {
  item: Item | null;
  quantity: number;
}

class InventoryService {
  private inventory: InventorySlot[] = [];
  private maxSlots: number = 20;
  private maxWeight: number = 100;
  private equippedItems: Map<string, Item> = new Map();

  constructor() {
    this.initializeInventory();
    this.addStartingItems();
  }

  private initializeInventory() {
    for (let i = 0; i < this.maxSlots; i++) {
      this.inventory.push({ item: null, quantity: 0 });
    }
  }

  private addStartingItems() {
    // Add some basic starting items
    this.addItem(this.createItem({
      id: 'starter_pistol',
      name: 'Militech M-10AF Lexington',
      description: 'A reliable starter pistol. Nothing fancy, but it gets the job done.',
      type: ItemType.WEAPON,
      rarity: ItemRarity.COMMON,
      value: 750,
      weight: 2.5,
      usable: false,
      equippable: true,
      stats: {
        damage: 45
      }
    }));

    this.addItem(this.createItem({
      id: 'basic_jacket',
      name: 'Reinforced Leather Jacket',
      description: 'A worn but sturdy jacket with kevlar padding.',
      type: ItemType.ARMOR,
      rarity: ItemRarity.COMMON,
      value: 300,
      weight: 3,
      usable: false,
      equippable: true,
      stats: {
        defense: 15
      }
    }));

    this.addItem(this.createItem({
      id: 'health_booster',
      name: 'MaxDoc Mk.I',
      description: 'Basic health recovery booster. Heals moderate wounds.',
      type: ItemType.CONSUMABLE,
      rarity: ItemRarity.COMMON,
      value: 50,
      weight: 0.1,
      usable: true,
      equippable: false,
      effects: {
        heal: 50
      }
    }), 3);

    this.addItem(this.createItem({
      id: 'eddies',
      name: 'Eurodollars',
      description: 'The currency of Night City. Cold, hard eddies.',
      type: ItemType.MISC,
      rarity: ItemRarity.COMMON,
      value: 1,
      weight: 0,
      usable: false,
      equippable: false
    }), 1500);
  }

  public createItem(itemData: Partial<Item> & { id: string; name: string }): Item {
    return {
      description: '',
      type: ItemType.MISC,
      rarity: ItemRarity.COMMON,
      value: 0,
      weight: 0,
      usable: false,
      equippable: false,
      ...itemData
    };
  }

  public addItem(item: Item, quantity: number = 1): boolean {
    // Check if item already exists and is stackable
    const existingSlot = this.inventory.find(slot => 
      slot.item?.id === item.id && 
      (item.type === ItemType.CONSUMABLE || item.type === ItemType.MISC || item.type === ItemType.DATA)
    );

    if (existingSlot) {
      existingSlot.quantity += quantity;
      audioService.playSuccessSound();
      return true;
    }

    // Find empty slot
    const emptySlot = this.inventory.find(slot => slot.item === null);
    if (emptySlot) {
      emptySlot.item = item;
      emptySlot.quantity = quantity;
      audioService.playSuccessSound();
      return true;
    }

    // Inventory full
    audioService.playErrorSound();
    return false;
  }

  public removeItem(itemId: string, quantity: number = 1): boolean {
    const slot = this.inventory.find(slot => slot.item?.id === itemId);
    if (!slot || !slot.item) return false;

    if (slot.quantity > quantity) {
      slot.quantity -= quantity;
    } else {
      slot.item = null;
      slot.quantity = 0;
    }

    return true;
  }

  public getItem(itemId: string): InventorySlot | null {
    return this.inventory.find(slot => slot.item?.id === itemId) || null;
  }

  public hasItem(itemId: string, quantity: number = 1): boolean {
    const slot = this.getItem(itemId);
    return slot !== null && slot.quantity >= quantity;
  }

  public useItem(itemId: string): boolean {
    const slot = this.getItem(itemId);
    if (!slot || !slot.item || !slot.item.usable) return false;

    // Apply item effects (this would integrate with character stats)
    if (slot.item.effects?.heal) {
      console.log(`Used ${slot.item.name}, restored ${slot.item.effects.heal} health`);
    }

    this.removeItem(itemId, 1);
    audioService.playUIClick();
    return true;
  }

  public equipItem(itemId: string): boolean {
    const slot = this.getItem(itemId);
    if (!slot || !slot.item || !slot.item.equippable) return false;

    // Unequip existing item of same type
    const existingEquipped = Array.from(this.equippedItems.values())
      .find(item => item.type === slot.item!.type);
    
    if (existingEquipped) {
      this.unequipItem(existingEquipped.id);
    }

    this.equippedItems.set(itemId, slot.item);
    audioService.playUIClick();
    return true;
  }

  public unequipItem(itemId: string): boolean {
    if (this.equippedItems.has(itemId)) {
      this.equippedItems.delete(itemId);
      audioService.playUIClick();
      return true;
    }
    return false;
  }

  public isEquipped(itemId: string): boolean {
    return this.equippedItems.has(itemId);
  }

  public getEquippedItems(): Item[] {
    return Array.from(this.equippedItems.values());
  }

  public getInventory(): InventorySlot[] {
    return [...this.inventory];
  }

  public getTotalWeight(): number {
    return this.inventory.reduce((total, slot) => {
      if (slot.item) {
        return total + (slot.item.weight * slot.quantity);
      }
      return total;
    }, 0);
  }

  public getCurrentCapacity(): number {
    return this.inventory.filter(slot => slot.item !== null).length;
  }

  public getMaxSlots(): number {
    return this.maxSlots;
  }

  public getMaxWeight(): number {
    return this.maxWeight;
  }

  public canAddItem(item: Item, quantity: number = 1): boolean {
    const totalWeight = this.getTotalWeight() + (item.weight * quantity);
    if (totalWeight > this.maxWeight) return false;

    // Check if item can stack
    const existingSlot = this.inventory.find(slot => 
      slot.item?.id === item.id && 
      (item.type === ItemType.CONSUMABLE || item.type === ItemType.MISC || item.type === ItemType.DATA)
    );

    if (existingSlot) return true;

    // Check for empty slots
    return this.inventory.some(slot => slot.item === null);
  }

  public getItemsByType(type: ItemType): InventorySlot[] {
    return this.inventory.filter(slot => slot.item?.type === type);
  }

  public getItemsByRarity(rarity: ItemRarity): InventorySlot[] {
    return this.inventory.filter(slot => slot.item?.rarity === rarity);
  }

  public getTotalValue(): number {
    return this.inventory.reduce((total, slot) => {
      if (slot.item) {
        return total + (slot.item.value * slot.quantity);
      }
      return total;
    }, 0);
  }

  public sortInventory(sortBy: 'name' | 'type' | 'rarity' | 'value' | 'weight' = 'name') {
    const filledSlots = this.inventory.filter(slot => slot.item !== null);
    const emptySlots = this.inventory.filter(slot => slot.item === null);

    filledSlots.sort((a, b) => {
      if (!a.item || !b.item) return 0;
      
      switch (sortBy) {
        case 'name':
          return a.item.name.localeCompare(b.item.name);
        case 'type':
          return a.item.type.localeCompare(b.item.type);
        case 'rarity':
          const rarityOrder = [ItemRarity.COMMON, ItemRarity.UNCOMMON, ItemRarity.RARE, ItemRarity.EPIC, ItemRarity.LEGENDARY];
          return rarityOrder.indexOf(a.item.rarity) - rarityOrder.indexOf(b.item.rarity);
        case 'value':
          return b.item.value - a.item.value;
        case 'weight':
          return a.item.weight - b.item.weight;
        default:
          return 0;
      }
    });

    this.inventory = [...filledSlots, ...emptySlots];
  }

  // Save/Load functionality for persistence
  public saveInventory(): string {
    return JSON.stringify({
      inventory: this.inventory,
      equippedItems: Array.from(this.equippedItems.entries())
    });
  }

  public loadInventory(data: string): void {
    try {
      const parsed = JSON.parse(data);
      this.inventory = parsed.inventory || [];
      this.equippedItems = new Map(parsed.equippedItems || []);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    }
  }
}

// Export singleton instance
export const inventoryService = new InventoryService();
