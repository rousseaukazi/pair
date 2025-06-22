'use client';

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { AppState, AppAction, CapturedSentence, ChatMessage } from '../types';

const STORAGE_KEY = 'pair-app-state';

const initialState: AppState = {
  messages: [],
  isStreaming: false,
  capturedSentences: [],
  docMode: 'bullets',
  narrativeContent: '',
  isHighlightMode: false,
  highlightedSentences: new Set(),
  isPublished: false,
  layout: 'chat-right', // Default: chat on right, doc on left
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
    return {
      ...parsed,
      highlightedSentences: new Set(parsed.highlightedSentences || []), // Convert Array back to Set
      isStreaming: false, // Always start with streaming false
      isHighlightMode: false, // Always start with highlight mode false
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
      const newSentence: CapturedSentence = {
        id: `sentence-${Date.now()}`,
        content: action.payload.sentence,
        messageId: action.payload.messageId,
        order: state.capturedSentences.length,
        isHighlighted: true,
      };
      newState = {
        ...state,
        capturedSentences: [...state.capturedSentences, newSentence],
      };
      break;
    
    case 'TOGGLE_DOC_MODE':
      newState = {
        ...state,
        docMode: state.docMode === 'bullets' ? 'narrative' : 'bullets',
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
      if (newHighlighted.has(action.payload)) {
        newHighlighted.delete(action.payload);
      } else {
        newHighlighted.add(action.payload);
      }
      newState = { ...state, highlightedSentences: newHighlighted };
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