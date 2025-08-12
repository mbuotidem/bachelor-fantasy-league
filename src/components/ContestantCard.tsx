'use client';

import React, { useState } from 'react';
import type { Contestant } from '../types';

interface ContestantCardProps {
  contestant: Contestant;
  onEdit?: (contestant: Contestant) => void;
  onEliminate?: (contestant: Contestant) => void;
  onRestore?: (contestant: Contestant) => void;
  onDelete?: (contestant: Contestant) => void;
  isCommissioner?: boolean;
  showActions?: boolean;
}

export default function ContestantCard({
  contestant,
  onEdit,
  onEliminate,
  onRestore,
  onDelete,
  isCommissioner = false,
  showActions = true,
}: ContestantCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div className="relative w-full h-80 perspective-1000">
      <div
        className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d cursor-pointer ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        onClick={handleCardClick}
      >
        {/* Front of card */}
        <div className="absolute inset-0 w-full h-full backface-hidden">
          <div className={`bg-white rounded-lg shadow-md overflow-hidden h-full border-2 ${
            contestant.isEliminated ? 'border-red-300 bg-red-50' : 'border-gray-200'
          }`}>
            {/* Profile Image */}
            <div className="relative h-48 bg-gradient-to-br from-rose-100 to-pink-100">
              {contestant.profileImageUrl ? (
                <img
                  src={contestant.profileImageUrl}
                  alt={contestant.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
              
              {/* Elimination overlay */}
              {contestant.isEliminated && (
                <div className="absolute inset-0 bg-red-500 bg-opacity-75 flex items-center justify-center">
                  <div className="text-white text-center">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm font-semibold">ELIMINATED</p>
                    {contestant.eliminationEpisode && (
                      <p className="text-xs">Episode {contestant.eliminationEpisode}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Points badge */}
              <div className="absolute top-2 right-2 bg-rose-600 text-white px-2 py-1 rounded-full text-sm font-semibold">
                {contestant.totalPoints} pts
              </div>
            </div>

            {/* Card content */}
            <div className="p-4">
              <h3 className={`text-lg font-semibold mb-1 ${
                contestant.isEliminated ? 'text-red-700' : 'text-gray-900'
              }`}>
                {contestant.name}
              </h3>
              
              <div className="text-sm text-gray-600 space-y-1">
                {contestant.age && (
                  <p>Age: {contestant.age}</p>
                )}
                {contestant.hometown && (
                  <p>From: {contestant.hometown}</p>
                )}
                {contestant.occupation && (
                  <p className="truncate">{contestant.occupation}</p>
                )}
              </div>

              {/* Click to flip hint */}
              <div className="mt-3 text-xs text-gray-400 text-center">
                Click to see bio →
              </div>
            </div>
          </div>
        </div>

        {/* Back of card */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
          <div className={`bg-white rounded-lg shadow-md overflow-hidden h-full border-2 ${
            contestant.isEliminated ? 'border-red-300 bg-red-50' : 'border-gray-200'
          }`}>
            <div className="p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${
                  contestant.isEliminated ? 'text-red-700' : 'text-gray-900'
                }`}>
                  {contestant.name}
                </h3>
                <div className="bg-rose-600 text-white px-2 py-1 rounded-full text-sm font-semibold">
                  {contestant.totalPoints} pts
                </div>
              </div>

              {/* Bio content */}
              <div className="flex-1 overflow-y-auto">
                {contestant.bio ? (
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {contestant.bio}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    No bio available yet.
                  </p>
                )}
              </div>

              {/* Action buttons for commissioners */}
              {isCommissioner && showActions && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {onEdit && (
                      <button
                        onClick={(e) => handleActionClick(e, () => onEdit(contestant))}
                        className="flex-1 min-w-0 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Edit
                      </button>
                    )}
                    
                    {contestant.isEliminated ? (
                      onRestore && (
                        <button
                          onClick={(e) => handleActionClick(e, () => onRestore(contestant))}
                          className="flex-1 min-w-0 px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                          Restore
                        </button>
                      )
                    ) : (
                      onEliminate && (
                        <button
                          onClick={(e) => handleActionClick(e, () => onEliminate(contestant))}
                          className="flex-1 min-w-0 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          Eliminate
                        </button>
                      )
                    )}
                    
                    {onDelete && (
                      <button
                        onClick={(e) => handleActionClick(e, () => onDelete(contestant))}
                        className="flex-1 min-w-0 px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Click to flip back hint */}
              <div className="mt-3 text-xs text-gray-400 text-center">
                ← Click to go back
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}