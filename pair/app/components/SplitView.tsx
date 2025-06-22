'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowLeftRight, Trash2, Bug } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import ChatPanel from './ChatPanel';
import DocPanel from './DocPanel';

export default function SplitView() {
  const { state, dispatch } = useAppContext();
  const [leftWidth, setLeftWidth] = useState(50); // Percentage
  const [showDebugModal, setShowDebugModal] = useState(false);
  const dividerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get the latest assistant message for debugging
  const latestAssistantMessage = state.messages
    .filter(msg => msg.role === 'assistant')
    .slice(-1)[0];

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      
      // Constrain between 20% and 80%
      const constrainedWidth = Math.min(80, Math.max(20, newLeftWidth));
      setLeftWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC key handling
      if (e.key === 'Escape') {
        if (showDebugModal) {
          // Close debug modal
          setShowDebugModal(false);
          e.preventDefault();
        } else {
          // Blur active text field
          const activeElement = document.activeElement as HTMLElement;
          if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            activeElement.blur();
            e.preventDefault();
          }
        }
      }
      
      // 'd' key to open debug modal (only when not in text field)
      if (e.key === 'd' && !showDebugModal) {
        const activeElement = document.activeElement as HTMLElement;
        const isInTextField = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');
        
        if (!isInTextField && latestAssistantMessage) {
          setShowDebugModal(true);
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showDebugModal]);

  const toggleLayout = () => {
    dispatch({ type: 'TOGGLE_LAYOUT' });
  };

  const clearAll = () => {
    if (confirm('Clear all chat history and documents? This cannot be undone.')) {
      dispatch({ type: 'CLEAR_ALL' });
    }
  };

  const showDebug = () => {
    setShowDebugModal(true);
  };

  // Format JSON with syntax highlighting
  const formatJson = (obj: any) => {
    const jsonString = JSON.stringify(obj, null, 2);
    return jsonString.split('\n').map((line, index) => {
      let className = 'text-gray-900';
      
      // Color different parts of JSON
      if (line.includes('"type":') || line.includes('"role":') || line.includes('"content":')) {
        className = 'text-blue-600 font-medium';
      } else if (line.includes(': "') || line.includes('": ')) {
        className = 'text-green-600';
      } else if (line.includes(': {') || line.includes(': [')) {
        className = 'text-purple-600';
      } else if (line.trim().startsWith('"') && line.includes(':')) {
        className = 'text-red-600';
      }
      
      return (
        <div key={index} className={className}>
          {line}
        </div>
      );
    });
  };

  // Determine which component goes where based on layout
  const LeftComponent = state.layout === 'chat-left' ? ChatPanel : DocPanel;
  const RightComponent = state.layout === 'chat-left' ? DocPanel : ChatPanel;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header with layout toggle, debug, and clear button */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Pair</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLayout}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Swap panel positions"
            >
              <ArrowLeftRight size={16} />
              <span className="hidden sm:inline">
                {state.layout === 'chat-left' ? 'Chat | Doc' : 'Doc | Chat'}
              </span>
            </button>
            <button
              onClick={showDebug}
              disabled={!latestAssistantMessage}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Show latest message debug info (or press 'd')"
            >
              <Bug size={16} />
              <span className="hidden sm:inline">Debug</span>
            </button>
            <button
              onClick={clearAll}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
              title="Clear all data"
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Split view content */}
      <div ref={containerRef} className="flex flex-1 min-h-0">
        {/* Left Panel */}
        <div 
          className="flex-shrink-0 min-h-0"
          style={{ width: `${leftWidth}%` }}
        >
          <LeftComponent />
        </div>

        {/* Divider */}
        <div
          ref={dividerRef}
          className="w-2 bg-gray-300 cursor-col-resize hover:bg-gray-400 transition-colors flex items-center justify-center group"
          onMouseDown={handleMouseDown}
        >
          <div className="w-1 h-8 bg-gray-500 rounded-full group-hover:bg-gray-600 transition-colors" />
        </div>

        {/* Right Panel */}
        <div className="flex-1 min-h-0">
          <RightComponent />
        </div>
      </div>

      {/* Debug Modal */}
      {showDebugModal && latestAssistantMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowDebugModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Latest Message Debug Info</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Press ESC to close</span>
                <button
                  onClick={() => setShowDebugModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Message Content:</h4>
                <pre className="text-sm bg-gray-50 p-4 rounded border overflow-auto whitespace-pre-wrap max-h-32 text-black">
                  {latestAssistantMessage.content}
                </pre>
              </div>
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Full Message Object:</h4>
                <pre className="text-xs bg-gray-50 p-4 rounded border overflow-auto font-mono leading-relaxed">
                  {formatJson(latestAssistantMessage)}
                </pre>
              </div>
              {latestAssistantMessage.rawResponse && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Raw Claude Response:</h4>
                  <pre className="text-xs bg-blue-50 p-4 rounded border overflow-auto font-mono leading-relaxed">
                    {formatJson(latestAssistantMessage.rawResponse)}
                  </pre>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-between items-center">
              <div className="text-xs text-gray-500">
                <span className="font-mono bg-gray-100 px-2 py-1 rounded mr-2">d</span>
                <span>Open debug</span>
                <span className="font-mono bg-gray-100 px-2 py-1 rounded ml-4 mr-2">ESC</span>
                <span>Close / Exit text fields</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(latestAssistantMessage, null, 2));
                    alert('Copied to clipboard!');
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Copy JSON
                </button>
                <button
                  onClick={() => setShowDebugModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 