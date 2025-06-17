import '@testing-library/jest-dom';

// Mock environment variables for tests
process.env.API_KEY = 'test-api-key';

// Mock the freemium service to avoid import.meta issues
jest.mock('./services/freemiumService', () => ({
  freemiumApi: {
    getUserStatus: jest.fn().mockResolvedValue({
      isPremium: false,
      usageToday: 0,
      limit: 5,
      remaining: 5
    }),
    sendChatMessage: jest.fn().mockResolvedValue({
      response: 'Mock AI response',
      usage: { totalTokens: 100, promptTokens: 50, completionTokens: 50 }
    }),
    generateImage: jest.fn().mockResolvedValue({
      response: 'mock-image-url',
      usage: { totalTokens: 50, promptTokens: 25, completionTokens: 25 }
    }),
    createCheckoutSession: jest.fn().mockResolvedValue({ 
      url: 'mock-checkout-url',
      message: 'Success' 
    }),
    healthCheck: jest.fn().mockResolvedValue({ 
      status: 'ok',
      service: 'freemium-api' 
    })
  },
  UserStatus: {}
}));

// Mock Google GenAI
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      startChat: jest.fn().mockReturnValue({
        sendMessage: jest.fn().mockResolvedValue({
          response: {
            text: () => 'Mock response from AI'
          }
        })
      })
    })
  }))
}));

// Mock image generation API
global.fetch = jest.fn();

// Mock HTMLMediaElement for audio tests
Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
  writable: true,
  value: jest.fn().mockImplementation(() => Promise.resolve()),
});

Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', {
  writable: true,
  value: jest.fn(),
});

Object.defineProperty(window.HTMLMediaElement.prototype, 'load', {
  writable: true,
  value: jest.fn(),
});

// Mock HTMLMediaElement properties
Object.defineProperty(window.HTMLMediaElement.prototype, 'currentTime', {
  writable: true,
  value: 0,
});

Object.defineProperty(window.HTMLMediaElement.prototype, 'volume', {
  writable: true,
  value: 1,
});

// Mock btoa for Node.js environment
if (typeof global.btoa === 'undefined') {
  global.btoa = function (str) {
    return Buffer.from(str, 'binary').toString('base64');
  };
}

if (typeof global.atob === 'undefined') {
  global.atob = function (str) {
    return Buffer.from(str, 'base64').toString('binary');
  };
}
