import '@testing-library/jest-dom';

// Mock environment variables for tests
process.env.API_KEY = 'test-api-key';

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
