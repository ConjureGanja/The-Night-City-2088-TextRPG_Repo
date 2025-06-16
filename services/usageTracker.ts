export interface UsageData {
  date: string;
  messagesUsed: number;
  lastResetDate: string;
  isPremium: boolean;
  premiumExpiryDate?: string;
}

export interface PremiumFeatures {
  unlimitedMessages: boolean;
  imageGeneration: boolean;
  saveGameStates: boolean;
  premiumThemes: boolean;
}

export class UsageTracker {
  private static readonly STORAGE_KEY = 'night_city_usage';
  private static readonly FREE_DAILY_LIMIT = 10;
  private static readonly GUEST_LIMIT = 3;

  static getUsageData(): UsageData {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    const today = new Date().toDateString();
    
    if (!stored) {
      const newData: UsageData = {
        date: today,
        messagesUsed: 0,
        lastResetDate: today,
        isPremium: false
      };
      this.saveUsageData(newData);
      return newData;
    }

    const data: UsageData = JSON.parse(stored);
    
    // Reset daily usage if it's a new day
    if (data.lastResetDate !== today) {
      data.messagesUsed = 0;
      data.lastResetDate = today;
      data.date = today;
      this.saveUsageData(data);
    }

    // Check if premium has expired
    if (data.isPremium && data.premiumExpiryDate) {
      const expiryDate = new Date(data.premiumExpiryDate);
      if (expiryDate < new Date()) {
        data.isPremium = false;
        data.premiumExpiryDate = undefined;
        this.saveUsageData(data);
      }
    }

    return data;
  }

  static saveUsageData(data: UsageData): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  static canSendMessage(isGuest: boolean = false): boolean {
    const usage = this.getUsageData();
    
    if (usage.isPremium) {
      return true;
    }

    if (isGuest) {
      return usage.messagesUsed < this.GUEST_LIMIT;
    }

    return usage.messagesUsed < this.FREE_DAILY_LIMIT;
  }

  static incrementUsage(): boolean {
    const usage = this.getUsageData();
    
    if (usage.isPremium) {
      return true; // Premium users can always send messages
    }

    if (usage.messagesUsed < this.FREE_DAILY_LIMIT) {
      usage.messagesUsed++;
      this.saveUsageData(usage);
      return true;
    }

    return false; // Limit reached
  }

  static getRemainingMessages(isGuest: boolean = false): number {
    const usage = this.getUsageData();
    
    if (usage.isPremium) {
      return Infinity;
    }

    const limit = isGuest ? this.GUEST_LIMIT : this.FREE_DAILY_LIMIT;
    return Math.max(0, limit - usage.messagesUsed);
  }

  static setPremium(expiryDate: Date): void {
    const usage = this.getUsageData();
    usage.isPremium = true;
    usage.premiumExpiryDate = expiryDate.toISOString();
    this.saveUsageData(usage);
  }

  static getPremiumFeatures(): PremiumFeatures {
    const usage = this.getUsageData();
    
    return {
      unlimitedMessages: usage.isPremium,
      imageGeneration: usage.isPremium,
      saveGameStates: usage.isPremium,
      premiumThemes: usage.isPremium
    };
  }

  static getUsageStatus(): {
    messagesUsed: number;
    messagesRemaining: number;
    isPremium: boolean;
    dailyLimit: number;
  } {
    const usage = this.getUsageData();
    const remaining = this.getRemainingMessages();
    
    return {
      messagesUsed: usage.messagesUsed,
      messagesRemaining: remaining === Infinity ? Infinity : remaining,
      isPremium: usage.isPremium,
      dailyLimit: this.FREE_DAILY_LIMIT
    };
  }

  // Demo function to simulate premium purchase
  static activatePremiumDemo(): void {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // 30 days from now
    this.setPremium(expiryDate);
  }

  static resetUsage(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
