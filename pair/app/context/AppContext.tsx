'use client';

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { AppState, AppAction, CapturedSentence, ChatMessage, TweetComment } from '../types';

const STORAGE_KEY = 'pair-app-state';

const initialState: AppState = {
  messages: [],
  isStreaming: false,
  capturedSentences: [],
  docMode: 'narrative',
  narrativeContent: '',
  isHighlightMode: false,
  highlightedSentences: new Set(),
  isPublished: false,
  layout: 'chat-right', // Default: chat on right, doc on left
  
  // Thread state
  tweetComments: [],
  isCommentModalOpen: false,
  selectedTweetIndex: null,
};

function saveToLocalStorage(state: AppState) {
  try {
    const stateToSave = {
      ...state,
      highlightedSentences: Array.from(state.highlightedSentences), // Convert Set to Array for JSON
      isStreaming: false, // Don't persist streaming state
      isHighlightMode: false, // Don't persist highlight mode
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
}

function loadFromLocalStorage(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return initialState;
    
    const parsed = JSON.parse(saved);
    
    // Convert timestamp strings back to Date objects in tweetComments
    const tweetComments = (parsed.tweetComments || []).map((comment: any) => ({
      ...comment,
      timestamp: new Date(comment.timestamp)
    }));
    
    return {
      ...initialState, // Start with initialState as base to ensure all properties exist
      ...parsed, // Override with saved values
      highlightedSentences: new Set(parsed.highlightedSentences || []), // Convert Array back to Set
      isStreaming: false, // Always start with streaming false
      isHighlightMode: false, // Always start with highlight mode false
      // Ensure thread properties have defaults and proper types
      tweetComments,
      isCommentModalOpen: false,
      selectedTweetIndex: null,
    };
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
    return initialState;
  }
}

function appReducer(state: AppState, action: AppAction): AppState {
  let newState: AppState;
  
  switch (action.type) {
    case 'LOAD_FROM_STORAGE':
      // Special action to load from localStorage after hydration
      newState = loadFromLocalStorage();
      break;
      
    case 'ADD_MESSAGE':
      newState = { ...state, messages: [...state.messages, action.payload] };
      break;
    
    case 'SET_STREAMING':
      newState = { ...state, isStreaming: action.payload };
      break;
    
    case 'CAPTURE_SENTENCE':
      // Find the message to get its index for ordering
      const messageIndex = state.messages.findIndex(m => m.id === action.payload.messageId);
      const newSentence: CapturedSentence = {
        id: `sentence-${Date.now()}`,
        content: action.payload.sentence,
        messageId: action.payload.messageId,
        order: messageIndex * 1000 + (action.payload.sentenceIndex || 0), // Use message order * 1000 + sentence index for proper ordering
        isHighlighted: true,
        sentenceIndex: action.payload.sentenceIndex || 0,
      };
      newState = {
        ...state,
        capturedSentences: [...state.capturedSentences, newSentence].sort((a, b) => a.order - b.order),
      };
      break;
    
    case 'TOGGLE_DOC_MODE':
      newState = {
        ...state,
        docMode: state.docMode === 'bullets' ? 'narrative' : 'bullets',
      };
      break;
    
    case 'SET_DOC_MODE':
      newState = {
        ...state,
        docMode: action.payload,
      };
      break;
    
    case 'UPDATE_NARRATIVE':
      newState = { ...state, narrativeContent: action.payload };
      break;
    
    case 'SET_HIGHLIGHT_MODE':
      newState = { ...state, isHighlightMode: action.payload };
      break;
    
    case 'TOGGLE_SENTENCE_HIGHLIGHT':
      const newHighlighted = new Set(state.highlightedSentences);
      const sentenceId = action.payload;
      
      if (newHighlighted.has(sentenceId)) {
        // Remove from highlighted sentences
        newHighlighted.delete(sentenceId);
        // Also remove from captured sentences
        const updatedCapturedSentences = state.capturedSentences.filter(
          sentence => {
            const messageSentenceId = `${sentence.messageId}-sentence-${sentence.sentenceIndex}`;
            return messageSentenceId !== sentenceId;
          }
        );
        newState = { 
          ...state, 
          highlightedSentences: newHighlighted,
          capturedSentences: updatedCapturedSentences
        };
      } else {
        // Just add to highlighted sentences (capture will be handled separately)
        newHighlighted.add(sentenceId);
        newState = { ...state, highlightedSentences: newHighlighted };
      }
      break;
    
    case 'PUBLISH_DOCUMENT':
      newState = { ...state, isPublished: true };
      break;
      
    case 'TOGGLE_LAYOUT':
      newState = {
        ...state,
        layout: state.layout === 'chat-left' ? 'chat-right' : 'chat-left',
      };
      break;
    
    case 'CLEAR_ALL':
      // Clear localStorage and reset to initial state
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.warn('Failed to clear localStorage:', error);
      }
      newState = { ...initialState };
      break;
    
    case 'ADD_TWEET_COMMENT':
      const newComment: TweetComment = {
        id: `comment-${Date.now()}`,
        content: action.payload.content,
        timestamp: new Date(),
        tweetIndex: action.payload.tweetIndex,
      };
      newState = {
        ...state,
        tweetComments: [...state.tweetComments, newComment],
        isCommentModalOpen: false,
        selectedTweetIndex: null,
      };
      break;
    
    case 'OPEN_COMMENT_MODAL':
      newState = {
        ...state,
        isCommentModalOpen: true,
        selectedTweetIndex: action.payload,
      };
      break;
    
    case 'CLOSE_COMMENT_MODAL':
      newState = {
        ...state,
        isCommentModalOpen: false,
        selectedTweetIndex: null,
      };
      break;
    
    default:
      return state;
  }
  
  // Save to localStorage after most state changes (except temporary ones and initial load)
  if (action.type !== 'SET_STREAMING' && 
      action.type !== 'SET_HIGHLIGHT_MODE' && 
      action.type !== 'LOAD_FROM_STORAGE') {
    saveToLocalStorage(newState);
  }
  
  return newState;
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  // Always start with initial state to match server rendering
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // Load from localStorage after hydration is complete
  useEffect(() => {
    dispatch({ type: 'LOAD_FROM_STORAGE' });
  }, []);
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
} 