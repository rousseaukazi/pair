'use client';

import React, { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function CommentModal() {
  const { state, dispatch } = useAppContext();
  const [commentText, setCommentText] = useState('');

  const handleClose = () => {
    dispatch({ type: 'CLOSE_COMMENT_MODAL' });
    setCommentText('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim() && state.selectedTweetIndex !== null) {
      dispatch({
        type: 'ADD_TWEET_COMMENT',
        payload: {
          tweetIndex: state.selectedTweetIndex,
          content: commentText.trim(),
        },
      });
      setCommentText('');
    }
  };

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (state.isCommentModalOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [state.isCommentModalOpen]);

  if (!state.isCommentModalOpen || state.selectedTweetIndex === null) {
    return null;
  }

  // Get the selected tweet and its comments
  const tweets = state.narrativeContent.split('\n\n').filter(tweet => tweet.trim().length > 0);
  const selectedTweet = tweets[state.selectedTweetIndex];
  const comments = state.tweetComments.filter(comment => comment.tweetIndex === state.selectedTweetIndex);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Tweet Comments</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tweet Content */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              AI
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-gray-900">AI Assistant</span>
                <span className="text-gray-500 text-sm">@ai_assistant</span>
              </div>
              <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                {selectedTweet}
              </p>
            </div>
          </div>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4">
          {comments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    U
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">You</span>
                      <span className="text-gray-500 text-sm">
                        {comment.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-gray-900 mt-1 leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comment Form */}
        <div className="border-t border-gray-200 p-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              U
            </div>
            <div className="flex-1 flex gap-2">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 placeholder-gray-500"
                rows={2}
                maxLength={280}
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed self-end"
              >
                <Send size={16} />
              </button>
            </div>
          </form>
          <div className="text-xs text-gray-500 mt-1 text-right">
            {commentText.length}/280
          </div>
        </div>
      </div>
    </div>
  );
} 