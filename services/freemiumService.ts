// Freemium API service for Night City 2088
// This handles API calls through your backend to implement usage limits

interface UserStatus {
  isPremium: boolean;
  usageToday: number;
  limit: number;
  remaining: number;
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

class FreemiumApiService {
  private baseUrl: string;
  private fingerprint: string;
  constructor() {
    this.baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';
    this.fingerprint = this.generateFingerprint();
  }

  private generateFingerprint(): string {
    // Generate a browser fingerprint for user identification
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
}

export const freemiumApi = new FreemiumApiService();
export type { UserStatus, ApiResponse, FreemiumError };
