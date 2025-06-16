import { UsageTracker } from './usageTracker';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('UsageTracker', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    mockLocalStorage.clear();
  });

  describe('getUsageData', () => {
    test('creates new usage data for first time user', () => {
      const usage = UsageTracker.getUsageData();
      
      expect(usage.messagesUsed).toBe(0);
      expect(usage.isPremium).toBe(false);
      expect(usage.date).toBe(new Date().toDateString());
    });

    test('loads existing usage data', () => {
      const existingData = {
        date: new Date().toDateString(),
        messagesUsed: 5,
        lastResetDate: new Date().toDateString(),
        isPremium: false
      };
      
      mockLocalStorage.setItem('night_city_usage', JSON.stringify(existingData));
      
      const usage = UsageTracker.getUsageData();
      expect(usage.messagesUsed).toBe(5);
      expect(usage.isPremium).toBe(false);
    });

    test('resets usage for new day', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const oldData = {
        date: yesterday.toDateString(),
        messagesUsed: 10,
        lastResetDate: yesterday.toDateString(),
        isPremium: false
      };
      
      mockLocalStorage.setItem('night_city_usage', JSON.stringify(oldData));
      
      const usage = UsageTracker.getUsageData();
      expect(usage.messagesUsed).toBe(0);
      expect(usage.lastResetDate).toBe(new Date().toDateString());
    });
  });

  describe('canSendMessage', () => {
    test('allows messages for premium users', () => {
      UsageTracker.setPremium(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // 30 days from now
      
      expect(UsageTracker.canSendMessage()).toBe(true);
    });

    test('enforces daily limit for free users', () => {
      // Use 10 messages (the limit)
      for (let i = 0; i < 10; i++) {
        UsageTracker.incrementUsage();
      }
      
      expect(UsageTracker.canSendMessage()).toBe(false);
    });

    test('enforces guest limit', () => {
      // Use 3 messages (guest limit)
      for (let i = 0; i < 3; i++) {
        UsageTracker.incrementUsage();
      }
      
      expect(UsageTracker.canSendMessage(true)).toBe(false);
    });
  });

  describe('incrementUsage', () => {
    test('increments usage for free users within limit', () => {
      const success = UsageTracker.incrementUsage();
      
      expect(success).toBe(true);
      expect(UsageTracker.getUsageData().messagesUsed).toBe(1);
    });

    test('always succeeds for premium users', () => {
      UsageTracker.setPremium(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
      
      // Try to exceed free limit
      for (let i = 0; i < 20; i++) {
        const success = UsageTracker.incrementUsage();
        expect(success).toBe(true);
      }
    });

    test('fails when free limit exceeded', () => {
      // Use up all free messages
      for (let i = 0; i < 10; i++) {
        UsageTracker.incrementUsage();
      }
      
      const success = UsageTracker.incrementUsage();
      expect(success).toBe(false);
    });
  });

  describe('setPremium', () => {
    test('activates premium with expiry date', () => {
      const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      UsageTracker.setPremium(expiryDate);
      
      const usage = UsageTracker.getUsageData();
      expect(usage.isPremium).toBe(true);
      expect(usage.premiumExpiryDate).toBe(expiryDate.toISOString());
    });
  });

  describe('getRemainingMessages', () => {
    test('returns infinity for premium users', () => {
      UsageTracker.setPremium(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
      
      expect(UsageTracker.getRemainingMessages()).toBe(Infinity);
    });

    test('calculates remaining messages for free users', () => {
      UsageTracker.incrementUsage();
      UsageTracker.incrementUsage();
      
      expect(UsageTracker.getRemainingMessages()).toBe(8);
    });

    test('returns 0 when limit reached', () => {
      for (let i = 0; i < 10; i++) {
        UsageTracker.incrementUsage();
      }
      
      expect(UsageTracker.getRemainingMessages()).toBe(0);
    });
  });
});
