'use client';

import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { ChatMessage } from '../types';
import { detectSentences } from '../utils/sentenceUtils';

interface HighlightableMessageProps {
  message: ChatMessage;
}

export default function HighlightableMessage({ message }: HighlightableMessageProps) {
  const { state, dispatch } = useAppContext();
  const [isDragging, setIsDragging] = useState(false);
  const [hasActuallyDragged, setHasActuallyDragged] = useState(false);

  // Handle mouse up to end drag - must be at top level
  const handleMouseUp = () => {
    setIsDragging(false);
    // Reset after a small delay to allow click handler to fire first
    setTimeout(() => setHasActuallyDragged(false), 0);
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // For user messages, always display as plain text
  if (message.role !== 'assistant') {
    return (
      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-inherit m-0">
        {message.content}
      </pre>
    );
  }

  // For assistant messages, always use smart sentence-level highlighting
  const sentences = detectSentences(message.content);

  // Custom cursor SVG for highlighting mode
  const highlighterCursor = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23000000\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><path d=\'m9 11-6 6v3h9l3-3\'/><path d=\'m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4\'/></svg>") 4 20, crosshair';

  // Generate unique sentence IDs based on message and sentence index
  const getSentenceId = (sentenceIndex: number) => 
    `${message.id}-sentence-${sentenceIndex}`;

  // Check if a sentence is highlighted
  const isSentenceHighlighted = (sentenceIndex: number) => {
    const sentenceId = getSentenceId(sentenceIndex);
    return state.highlightedSentences.has(sentenceId);
  };

  // Toggle sentence highlight
  const toggleSentenceHighlight = (sentenceIndex: number) => {
    if (!state.isHighlightMode) return;

    const sentence = sentences[sentenceIndex];
    const sentenceId = getSentenceId(sentenceIndex);
    
    // Toggle in global state
    dispatch({ 
      type: 'TOGGLE_SENTENCE_HIGHLIGHT', 
      payload: sentenceId 
    });

    // If highlighting (not unhighlighting), capture the sentence
    if (!state.highlightedSentences.has(sentenceId)) {
      dispatch({ 
        type: 'CAPTURE_SENTENCE', 
        payload: { sentence, messageId: message.id } 
      });
    }
  };

  // Handle sentence click (only for simple clicks, not drags)
  const handleSentenceClick = (sentenceIndex: number, e: React.MouseEvent) => {
    if (state.isHighlightMode && !hasActuallyDragged) {
      toggleSentenceHighlight(sentenceIndex);
      e.preventDefault();
    }
  };

  // Handle mouse down for drag start
  const handleSentenceMouseDown = (sentenceIndex: number, e: React.MouseEvent) => {
    if (state.isHighlightMode) {
      setIsDragging(true);
      setHasActuallyDragged(false);
      e.preventDefault();
    }
  };

  // Handle mouse enter during drag
  const handleSentenceMouseEnter = (sentenceIndex: number) => {
    if (state.isHighlightMode && isDragging) {
      setHasActuallyDragged(true);
      toggleSentenceHighlight(sentenceIndex);
    }
  };

  return (
    <pre 
      className={`select-none whitespace-pre-wrap font-sans text-sm text-black leading-relaxed m-0 ${
        state.isHighlightMode ? 'cursor-crosshair' : 'cursor-text'
      }`}
      style={{
        cursor: state.isHighlightMode ? highlighterCursor : 'text'
      }}
    >
      {sentences.map((sentence, sentenceIndex) => {
        // Handle standalone newlines (empty lines)
        if (sentence === '\n') {
          return <span key={`line-break-${sentenceIndex}`}>{'\n'}</span>;
        }

        const isHighlighted = isSentenceHighlighted(sentenceIndex);
        const isPublishedHighlight = state.isPublished && isHighlighted;
        
        return (
          <span key={`sentence-wrapper-${sentenceIndex}`} className="relative">
            <span
              className={`transition-colors duration-200 ${
                isHighlighted && !state.isPublished
                  ? 'bg-yellow-300 text-gray-900'
                  : isPublishedHighlight 
                  ? 'bg-gray-200 text-gray-700'
                  : 'hover:bg-gray-50'
              } ${state.isHighlightMode ? 'cursor-crosshair' : 'cursor-text'}`}
              onClick={(e) => handleSentenceClick(sentenceIndex, e)}
              onMouseDown={(e) => handleSentenceMouseDown(sentenceIndex, e)}
              onMouseEnter={() => handleSentenceMouseEnter(sentenceIndex)}
              style={{
                cursor: state.isHighlightMode ? highlighterCursor : 'text'
              }}
            >
              {sentence}
            </span>
          </span>
        );
      })}
    </pre>
  );
}