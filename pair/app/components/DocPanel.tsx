'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FileText, List, BookOpen, Upload, RefreshCw } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function DocPanel() {
  const { state, dispatch } = useAppContext();
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false);

  // Debounced narrative generation
  const generateNarrative = useCallback(async (sentences: string[]) => {
    if (sentences.length === 0) {
      dispatch({ type: 'UPDATE_NARRATIVE', payload: '' });
      return;
    }

    setIsGeneratingNarrative(true);
    try {
      const response = await fetch('/api/narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentences }),
      });

      const data = await response.json();
      if (data.narrative) {
        dispatch({ type: 'UPDATE_NARRATIVE', payload: data.narrative });
      }
    } catch (error) {
      console.error('Error generating narrative:', error);
    } finally {
      setIsGeneratingNarrative(false);
    }
  }, [dispatch]);

  // Auto-generate narrative when sentences change
  useEffect(() => {
    const sentences = state.capturedSentences.map(s => s.content);
    const timeoutId = setTimeout(() => {
      generateNarrative(sentences);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [state.capturedSentences, generateNarrative]);

  const handleRegenerateNarrative = () => {
    const sentences = state.capturedSentences.map(s => s.content);
    generateNarrative(sentences);
  };

  const handlePublish = () => {
    dispatch({ type: 'PUBLISH_DOCUMENT' });
  };

  const toggleDocMode = () => {
    dispatch({ type: 'TOGGLE_DOC_MODE' });
  };

  const isEmpty = state.capturedSentences.length === 0;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Document</h2>
          </div>
          
          {!isEmpty && (
            <div className="flex items-center gap-2">
              {/* Mode Toggle */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={toggleDocMode}
                  className={`px-3 py-1.5 text-sm flex items-center gap-1 ${
                    state.docMode === 'bullets'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <List size={14} />
                  Bullets
                </button>
                <button
                  onClick={toggleDocMode}
                  className={`px-3 py-1.5 text-sm flex items-center gap-1 ${
                    state.docMode === 'narrative'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <BookOpen size={14} />
                  Narrative
                </button>
              </div>

              {/* Regenerate Narrative Button */}
              {state.docMode === 'narrative' && (
                <button
                  onClick={handleRegenerateNarrative}
                  disabled={isGeneratingNarrative}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
                  title="Regenerate narrative"
                >
                  <RefreshCw size={14} className={isGeneratingNarrative ? 'animate-spin' : ''} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <FileText size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No content yet</p>
            <p className="text-sm text-center max-w-md">
              Hold <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Shift</kbd> and 
              click on sentences in the chat to capture them here.
            </p>
          </div>
        ) : (
          <div className={`${state.isPublished ? 'opacity-75' : ''}`}>
            {state.docMode === 'bullets' ? (
              <div className="space-y-3">
                {state.capturedSentences.map((sentence) => (
                  <div key={sentence.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2.5 flex-shrink-0" />
                    <div className="text-gray-900 leading-relaxed flex-1 whitespace-pre-wrap">
                      {sentence.content}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="prose prose-gray max-w-none">
                {isGeneratingNarrative && state.narrativeContent === '' ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <RefreshCw size={16} className="animate-spin" />
                    Generating narrative...
                  </div>
                ) : (
                  <div className="leading-relaxed text-gray-900 whitespace-pre-wrap">
                    {state.narrativeContent}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Publish Button */}
      {!isEmpty && !state.isPublished && (
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={handlePublish}
            className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center gap-2 font-medium"
          >
            <Upload size={20} />
            Publish Document
          </button>
        </div>
      )}

      {/* Published State */}
      {state.isPublished && (
        <div className="border-t border-gray-200 p-4 bg-green-50">
          <div className="flex items-center justify-center gap-2 text-green-700">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Document Published
          </div>
          <p className="text-xs text-green-600 text-center mt-1">
            Refresh the page to start a new document
          </p>
        </div>
      )}
    </div>
  );
} 