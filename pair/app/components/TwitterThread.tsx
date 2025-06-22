'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface TwitterThreadProps {
  narrative: string;
}

export default function TwitterThread({ narrative }: TwitterThreadProps) {
  const { state, dispatch } = useAppContext();

  // Split narrative into individual tweets (paragraphs)
  const tweets = narrative.split('\n\n').filter(tweet => tweet.trim().length > 0);

  const handleComment = (tweetIndex: number) => {
    dispatch({ type: 'OPEN_COMMENT_MODAL', payload: tweetIndex });
  };

  const getCommentsForTweet = (tweetIndex: number) => {
    return state.tweetComments.filter(comment => comment.tweetIndex === tweetIndex);
  };

  if (tweets.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>No thread content available</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Connecting Line */}
      {tweets.length > 1 && (
        <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-gradient-to-b from-blue-200 via-blue-300 to-blue-200 z-0" />
      )}
      
      <div className="space-y-6 relative z-10">
        {tweets.map((tweet, index) => {
          const comments = getCommentsForTweet(index);
          const hasComments = comments.length > 0;
          
          return (
            <div key={index} className="relative group">
              {/* Thread connector dot */}
              <div className="absolute left-4 top-4 w-2 h-2 bg-blue-500 rounded-full z-10 transform -translate-x-1/2" />
              
              <div className="bg-white border border-gray-200 rounded-lg p-6 ml-8 hover:bg-gray-50 transition-colors shadow-sm relative">
                {/* Tweet Content */}
                <div className="pr-4">
                  <p className="text-gray-900 leading-relaxed whitespace-pre-wrap text-base">
                    {tweet.trim()}
                  </p>
                </div>

                {/* Floating Comment Button - Only show if no comments */}
                {!hasComments && (
                  <button
                    onClick={() => handleComment(index)}
                    className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                    title="Add comment"
                  >
                    <MessageCircle size={16} />
                  </button>
                )}

                {/* Comments Footer - Only show if there are comments */}
                {hasComments && (
                  <button
                    onClick={() => handleComment(index)}
                    className="w-full mt-3 pt-2 border-t border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors group/footer"
                  >
                    <div className="flex items-center gap-1.5 text-gray-500 group-hover/footer:text-blue-500 transition-colors text-sm py-2">
                      <MessageCircle size={12} />
                      <span className="font-medium">
                        {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
                      </span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 