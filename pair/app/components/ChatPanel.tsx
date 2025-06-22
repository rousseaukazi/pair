'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Highlighter } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ChatMessage } from '../types';
import HighlightableMessage from './HighlightableMessage';

export default function ChatPanel() {
  const { state, dispatch } = useAppContext();
  const [input, setInput] = useState('');
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.messages, streamingContent]);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const sendMessage = async () => {
    if (!input.trim() || state.isStreaming) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      content: input.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
    setInput('');
    dispatch({ type: 'SET_STREAMING', payload: true });
    setStreamingContent('');

    // Create abort controller for cancelling the stream
    abortControllerRef.current = new AbortController();

    try {
      console.log('Sending message to API...');
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...state.messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
        signal: abortControllerRef.current.signal,
      });

      console.log('Response received:', response.status, response.headers.get('content-type'));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      if (reader) {
        console.log('Starting to read stream...');
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('Stream reading complete');
            break;
          }
          
          const chunk = decoder.decode(value, { stream: true });
          console.log('Raw chunk received:', chunk);
          
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.trim() && line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              console.log('Processing data:', data);
              
              if (data === '[DONE]') {
                console.log('Stream complete signal received');
                // Stream is complete, add the final message
                const assistantMessage: ChatMessage = {
                  id: `msg-${Date.now() + 1}`,
                  content: accumulatedContent,
                  role: 'assistant',
                  timestamp: new Date(),
                };
                
                dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });
                setStreamingContent('');
                dispatch({ type: 'SET_STREAMING', payload: false });
                return;
              }
              
              try {
                const parsed = JSON.parse(data);
                console.log('Parsed chunk:', parsed);
                
                if (parsed.error) {
                  console.error('Streaming error:', parsed.error);
                  dispatch({ type: 'SET_STREAMING', payload: false });
                  setStreamingContent('');
                  return;
                }
                
                if (parsed.content) {
                  accumulatedContent += parsed.content;
                  console.log('Updated accumulated content:', accumulatedContent);
                  setStreamingContent(accumulatedContent);
                }
              } catch (e) {
                console.warn('Failed to parse JSON:', data, e);
                continue;
              }
            }
          }
        }
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Stream was aborted');
      } else {
        console.error('Error sending message:', error);
      }
      dispatch({ type: 'SET_STREAMING', payload: false });
      setStreamingContent('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Track shift key for highlight mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        dispatch({ type: 'SET_HIGHLIGHT_MODE', payload: true });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        dispatch({ type: 'SET_HIGHLIGHT_MODE', payload: false });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [dispatch]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 bg-white">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Chat</h2>
          {state.isHighlightMode && (
            <div className="flex items-center gap-1 text-sm text-amber-600 font-medium">
              <Highlighter size={16} />
              Highlight Mode
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {state.messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-900'
              }`}
            >
              <HighlightableMessage message={message} />
            </div>
          </div>
        ))}
        
        {/* Streaming message */}
        {state.isStreaming && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg px-4 py-2 bg-white border border-gray-200 text-gray-900">
              <div className="leading-relaxed">
                <pre className="whitespace-pre-wrap font-sans text-sm text-black leading-relaxed">
                  {streamingContent || 'Thinking...'}
                  <span className="animate-pulse">|</span>
                </pre>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={state.isStreaming}
            rows={1}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 placeholder-gray-500 leading-6 min-h-[40px] max-h-[200px]"
            style={{ overflowY: input.split('\n').length > 3 ? 'auto' : 'hidden' }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || state.isStreaming}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed h-[40px] flex-shrink-0"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
} 