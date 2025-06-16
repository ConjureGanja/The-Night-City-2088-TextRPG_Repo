import { extractImagePromptFromStory, cleanStoryText } from './geminiService';

// Mock the GoogleGenAI module
jest.mock('@google/genai');

describe('geminiService', () => {
  describe('extractImagePromptFromStory', () => {
    const startMarker = '[IMAGE_PROMPT:';
    const endMarker = ']';

    test('extracts image prompt from story text', () => {
      const storyText = 'You enter the room. [IMAGE_PROMPT:A dark cyberpunk alley with neon signs] The atmosphere is tense.';
      const result = extractImagePromptFromStory(storyText, startMarker, endMarker);
      
      expect(result).toBe('A dark cyberpunk alley with neon signs');
    });

    test('returns null when start marker is not found', () => {
      const storyText = 'You enter the room. The atmosphere is tense.';
      const result = extractImagePromptFromStory(storyText, startMarker, endMarker);
      
      expect(result).toBeNull();
    });

    test('returns null when end marker is not found', () => {
      const storyText = 'You enter the room. [IMAGE_PROMPT:A dark cyberpunk alley with neon signs';
      const result = extractImagePromptFromStory(storyText, startMarker, endMarker);
      
      expect(result).toBeNull();
    });

    test('extracts first occurrence when multiple markers exist', () => {
      const storyText = 'Text [IMAGE_PROMPT:first prompt] more text [IMAGE_PROMPT:second prompt] end';
      const result = extractImagePromptFromStory(storyText, startMarker, endMarker);
      
      expect(result).toBe('first prompt');
    });
  });

  describe('cleanStoryText', () => {
    const startMarker = '[IMAGE_PROMPT:';
    const endMarker = ']';

    test('removes image markers and content from story text', () => {
      const storyText = 'You enter the room. [IMAGE_PROMPT:A dark cyberpunk alley with neon signs] The atmosphere is tense.';
      const result = cleanStoryText(storyText, startMarker, endMarker);
      
      expect(result).toBe('You enter the room.  The atmosphere is tense.');
    });

    test('returns original text when no markers are found', () => {
      const storyText = 'You enter the room. The atmosphere is tense.';
      const result = cleanStoryText(storyText, startMarker, endMarker);
      
      expect(result).toBe(storyText);
    });

    test('returns original text when end marker is missing', () => {
      const storyText = 'You enter the room. [IMAGE_PROMPT:A dark cyberpunk alley with neon signs';
      const result = cleanStoryText(storyText, startMarker, endMarker);
      
      expect(result).toBe(storyText);
    });

    test('removes only first occurrence of markers', () => {
      const storyText = 'Text [IMAGE_PROMPT:first] middle [IMAGE_PROMPT:second] end';
      const result = cleanStoryText(storyText, startMarker, endMarker);
      
      expect(result).toBe('Text  middle [IMAGE_PROMPT:second] end');
    });

    test('handles empty image prompt', () => {
      const storyText = 'You enter the room. [IMAGE_PROMPT:] The atmosphere is tense.';
      const result = cleanStoryText(storyText, startMarker, endMarker);
      
      expect(result).toBe('You enter the room.  The atmosphere is tense.');
    });
  });
});