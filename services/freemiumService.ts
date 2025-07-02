// Freemium API service for Night City 2088
// This handles API calls through your backend to implement usage limits

interface FreemiumLimits {
  messagesPerDay: number;
  imageGeneration: boolean;
  saveStates: number;
  characterCreations: number;
}

interface UserStatus {
  isPremium: boolean;
  usageToday: number;
  limit: number;
  remaining: number;
  features: FreemiumLimits;
}

interface ApiResponse<T> {
  response: T;
  usage?: {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
  };
}

interface FreemiumError {
  error: string;
  message?: string;
  upgradeUrl?: string;
}

// Feature limits for different tiers
const FREE_TIER_LIMITS: FreemiumLimits = {
  messagesPerDay: 10,
  imageGeneration: false, // Disabled for free users
  saveStates: 1,
  characterCreations: 2
};

const PREMIUM_TIER_LIMITS: FreemiumLimits = {
  messagesPerDay: -1, // Unlimited
  imageGeneration: true,
  saveStates: -1, // Unlimited
  characterCreations: -1 // Unlimited
};

class FreemiumApiService {
  private baseUrl: string;
  private fingerprint: string;constructor() {
    // Handle both browser and Node.js environments
    let apiUrl = 'http://localhost:3001';
    try {
      // Only access import.meta in browser environment
      if (typeof window !== 'undefined' && (import.meta as any).env?.VITE_API_URL) {
        apiUrl = (import.meta as any).env.VITE_API_URL;
      }
    } catch (e) {
      // Fallback for Node.js environment
      apiUrl = process.env.VITE_API_URL || 'http://localhost:3001';
    }
    this.baseUrl = apiUrl;
    this.fingerprint = this.generateFingerprint();
  }
  private generateFingerprint(): string {
    // Handle both browser and Node.js environments
    if (typeof document === 'undefined' || typeof navigator === 'undefined') {
      // Node.js environment (testing)
      return btoa(JSON.stringify({
        platform: 'test',
        userAgent: 'test-environment',
        timezone: 'UTC'
      }));
    }

    // Browser environment
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx?.fillText('fingerprint', 10, 10);
    const canvasFingerprint = canvas.toDataURL();
    
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      canvas: canvasFingerprint
    };
    
    return btoa(JSON.stringify(fingerprint));
  }

  private async makeRequest<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}/api${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        fingerprint: this.fingerprint
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw result as FreemiumError;
    }
    
    return result;
  }

  async getUserStatus(): Promise<UserStatus> {
    return this.makeRequest<UserStatus>('/user/status', {});
  }

  async sendChatMessage(
    messages: Array<{ role: string; content: string }>,
    systemInstruction?: string,
    temperature?: number
  ): Promise<ApiResponse<string>> {
    return this.makeRequest<ApiResponse<string>>('/gemini/chat', {
      messages,
      systemInstruction,
      temperature
    });
  }

  async generateImage(prompt: string): Promise<ApiResponse<string>> {
    return this.makeRequest<ApiResponse<string>>('/gemini/generate-image', {
      prompt
    });
  }

  async createCheckoutSession(): Promise<{ url?: string; message?: string; pricing?: any }> {
    return this.makeRequest('/create-checkout-session', {});
  }

  // Check if service is available
  async healthCheck(): Promise<{ status: string; service: string }> {
    const response = await fetch(`${this.baseUrl}/api/health`);
    return response.json();
  }

  // Check if feature is available for current user
  async canUseFeature(feature: keyof FreemiumLimits): Promise<{ allowed: boolean; message?: string }> {
    try {
      const status = await this.getUserStatus();
      const limits = status.isPremium ? PREMIUM_TIER_LIMITS : FREE_TIER_LIMITS;
      
      switch (feature) {
        case 'imageGeneration':
          if (!limits.imageGeneration) {
            return { 
              allowed: false, 
              message: 'Image generation is only available for premium users. Upgrade to unlock visual storytelling!' 
            };
          }
          break;
        case 'messagesPerDay':
          if (limits.messagesPerDay !== -1 && status.usageToday >= limits.messagesPerDay) {
            return { 
              allowed: false, 
              message: `Daily message limit of ${limits.messagesPerDay} reached. Upgrade for unlimited messages!` 
            };
          }
          break;
        case 'saveStates':
          if (limits.saveStates !== -1) {
            // This would need to check actual save count
            return { 
              allowed: true, 
              message: `You can save ${limits.saveStates} game state(s). Premium users get unlimited saves.` 
            };
          }
          break;
      }
      
      return { allowed: true };
    } catch (error) {
      return { allowed: false, message: 'Unable to check feature availability' };
    }
  }

  // Get user's feature limits
  async getUserLimits(): Promise<FreemiumLimits> {
    try {
      const status = await this.getUserStatus();
      return status.isPremium ? PREMIUM_TIER_LIMITS : FREE_TIER_LIMITS;
    } catch (error) {
      return FREE_TIER_LIMITS; // Default to free tier on error
    }
  }

  // Check if image generation is allowed
  async canGenerateImages(): Promise<boolean> {
    const result = await this.canUseFeature('imageGeneration');
    return result.allowed;
  }
}

export const freemiumApi = new FreemiumApiService();
export type { UserStatus, ApiResponse, FreemiumError, FreemiumLimits };
export { FREE_TIER_LIMITS, PREMIUM_TIER_LIMITS };
