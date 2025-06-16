import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

// Mock the geminiService module
jest.mock('./services/geminiService', () => ({
  initiateChatSession: jest.fn().mockReturnValue({}),
  sendMessageToChat: jest.fn().mockResolvedValue({
    text: 'Welcome to Night City, choom. The neon lights flicker as you enter the terminal.'
  }),
  generateImageFromPrompt: jest.fn().mockResolvedValue('mock-image-url'),
  extractImagePromptFromStory: jest.fn().mockReturnValue(null),
  cleanStoryText: jest.fn().mockImplementation((text) => text)
}));

// Mock the VisualCortexPanel component
jest.mock('./components/VisualCortexPanel', () => {
  return function MockVisualCortexPanel() {
    return <div data-testid="visual-cortex-panel">Visual Cortex Panel</div>;
  };
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('App Component', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  test('renders app header', () => {
    render(<App />);
    
    expect(screen.getByText('[ NIGHT CITY ADVENTURES ]')).toBeInTheDocument();
    expect(screen.getByText('Powered by Gemini & Imagen')).toBeInTheDocument();
  });

  test('shows API key modal when no API key is stored', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText(/Google Gemini API Key Required/)).toBeInTheDocument();
    });
    
    expect(screen.getByPlaceholderText('Enter your Gemini API key...')).toBeInTheDocument();
    expect(screen.getByText('Save & Connect')).toBeInTheDocument();
  });

  test('renders footer with system status', () => {
    render(<App />);
    
    expect(screen.getByText(/SYSTEM STATUS:/)).toBeInTheDocument();
    expect(screen.getByText(/CONNECTION: SECURE/)).toBeInTheDocument();
    expect(screen.getByText(/LOCATION:/)).toBeInTheDocument();
  });

  test('shows system messages when API key is available', async () => {
    // Mock localStorage to return an API key
    localStorageMock.getItem.mockReturnValue('mock-api-key');
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText(/Booting Night City Terminal Interface/)).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Connecting to Gemini Mainframe/)).toBeInTheDocument();
    });
  });
});