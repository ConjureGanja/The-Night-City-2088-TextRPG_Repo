
export enum LogEntryType {
  PLAYER_INPUT = 'player_input',
  STORY = 'story',
  IMAGE_CAPTION = 'image_caption',
  IMAGE = 'image',
  ERROR = 'error',
  SYSTEM_MESSAGE = 'system_message',
  LOADING = 'loading',
}

export interface StoryLogEntry {
  id: string;
  type: LogEntryType;
  content: string;
  timestamp: string;
}

// For Gemini Chat
export interface ChatMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}
