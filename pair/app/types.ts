export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  rawResponse?: any; // Store raw Claude response for debugging
}

export interface CapturedSentence {
  id: string;
  content: string;
  messageId: string;
  order: number;
  isHighlighted: boolean;
}

export type DocMode = 'bullets' | 'narrative';

export interface AppState {
  // Chat state
  messages: ChatMessage[];
  isStreaming: boolean;
  
  // Document state
  capturedSentences: CapturedSentence[];
  docMode: DocMode;
  narrativeContent: string;
  isPublished: boolean;
  
  // UI state
  isHighlightMode: boolean;
  highlightedSentences: Set<string>;
  layout: 'chat-left' | 'chat-right';
}

export type AppAction = 
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_STREAMING'; payload: boolean }
  | { type: 'CAPTURE_SENTENCE'; payload: { sentence: string; messageId: string } }
  | { type: 'TOGGLE_DOC_MODE' }
  | { type: 'UPDATE_NARRATIVE'; payload: string }
  | { type: 'PUBLISH_DOCUMENT' }
  | { type: 'SET_HIGHLIGHT_MODE'; payload: boolean }
  | { type: 'TOGGLE_SENTENCE_HIGHLIGHT'; payload: string }
  | { type: 'TOGGLE_LAYOUT' }
  | { type: 'CLEAR_ALL' }
  | { type: 'LOAD_FROM_STORAGE' }; 