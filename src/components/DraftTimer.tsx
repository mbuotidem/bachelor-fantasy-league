'use client';

import React, { useState, useEffect } from 'react';

interface DraftTimerProps {
  timeLimit: number; // in seconds
  isActive: boolean;
  currentTurnId?: string; // ID of team whose turn it is
  currentTurnStartedAt?: string; // ISO timestamp when current turn started
  onTimeExpired?: () => void;
  className?: string;
  isMyTurn?: boolean; // Whether it's the current user's turn
  currentTeamName?: string; // Name of the team whose turn it is
}

export default function DraftTimer({
  timeLimit,
  isActive,
  currentTurnId,
  currentTurnStartedAt,
  onTimeExpired,
  className = '',
  isMyTurn = false,
  currentTeamName,
}: DraftTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [lastTurnId, setLastTurnId] = useState<string | undefined>(currentTurnId);

  // Calculate initial time remaining based on server timestamp
  const calculateTimeRemaining = (): number => {
    if (!currentTurnStartedAt) {
      return timeLimit;
    }
    
    const startTime = new Date(currentTurnStartedAt).getTime();
    const currentTime = Date.now();
    const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
    const remaining = Math.max(0, timeLimit - elapsedSeconds);
    
    return remaining;
  };

  // Initialize timer with server-synchronized time
  useEffect(() => {
    if (isActive && currentTurnStartedAt) {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);
    } else if (isActive && currentTurnId && currentTurnId !== lastTurnId) {
      // Fallback to old behavior if no timestamp available
      setTimeRemaining(timeLimit);
      setLastTurnId(currentTurnId);
    }
  }, [isActive, currentTurnId, currentTurnStartedAt, lastTurnId, timeLimit]);

  useEffect(() => {
    if (!isActive || timeRemaining <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        
        if (newTime <= 0) {
          onTimeExpired?.();
          return 0;
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, timeRemaining, onTimeExpired]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = (): string => {
    const percentage = timeRemaining / timeLimit;
    
    if (percentage > 0.5) {
      return 'text-green-600 bg-green-100';
    } else if (percentage > 0.25) {
      return 'text-yellow-600 bg-yellow-100';
    } else {
      return 'text-red-600 bg-red-100';
    }
  };

  const getProgressPercentage = (): number => {
    return ((timeLimit - timeRemaining) / timeLimit) * 100;
  };

  if (!isActive) {
    return (
      <div className={`text-center ${className}`}>
        <div className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-100 text-gray-600">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">Draft Paused</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`text-center ${className}`}>
      <div className={`inline-flex flex-col items-center px-6 py-4 rounded-lg ${getTimerColor()}`}>
        {/* Timer display */}
        <div className="flex items-center mb-2">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-2xl font-bold font-mono">
            {formatTime(timeRemaining)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-32 h-2 bg-white bg-opacity-50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-current transition-all duration-1000 ease-linear"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>

        {/* Status text */}
        <div className="mt-2 text-sm font-medium">
          {timeRemaining > 0 ? (
            isMyTurn ? 'Your Turn - Pick Now!' : `${currentTeamName || 'Team'} is Picking`
          ) : (
            isMyTurn ? 'Your Time Expired!' : `${currentTeamName || 'Team'}'s Time Expired`
          )}
        </div>
      </div>

      {/* Warning animations for low time */}
      {timeRemaining <= 10 && timeRemaining > 0 && (
        <div className="mt-2 animate-pulse">
          <span className="text-red-600 font-semibold text-sm">
            {isMyTurn ? (
              `⚠️ Hurry up! Only ${timeRemaining} seconds left!`
            ) : (
              `⏰ ${currentTeamName || 'Team'} has ${timeRemaining} seconds left`
            )}
          </span>
        </div>
      )}
    </div>
  );
}