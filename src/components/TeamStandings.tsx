'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TeamStanding } from '../types';
import { StandingsService } from '../services/standings-service';
import { useStandingsEvents } from '../lib/standings-events';
import UserMigrationButton from './UserMigrationButton';

interface TeamStandingsProps {
  leagueId: string;
  onTeamClick?: (teamId: string) => void;
  className?: string;
}

export default function TeamStandings({ leagueId, onTeamClick, className = '' }: TeamStandingsProps) {
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const standingsService = new StandingsService();

  useEffect(() => {
    loadStandings();
  }, [leagueId]);

  // Auto-refresh when component becomes visible (e.g., when switching tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !loading) {
        loadStandings();
      }
    };

    const handleFocus = () => {
      if (!loading) {
        loadStandings();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loading]);

  // Smart polling that increases frequency during active scoring periods
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout;
    let activityCheckInterval: NodeJS.Timeout;
    
    // Check if there's been recent scoring activity
    const checkRecentActivity = () => {
      const lastActivity = localStorage.getItem('last-scoring-activity');
      if (lastActivity) {
        const timeSinceActivity = Date.now() - parseInt(lastActivity);
        return timeSinceActivity < 300000; // 5 minutes
      }
      return false;
    };

    // Single polling function with dynamic timing
    const poll = () => {
      if (!document.hidden && !loading) {
        loadStandings();
      }
    };

    // Setup polling with dynamic intervals
    const setupPolling = () => {
      // Clear existing intervals
      if (pollingInterval) clearInterval(pollingInterval);
      if (activityCheckInterval) clearInterval(activityCheckInterval);

      const isActive = checkRecentActivity();
      const pollInterval = isActive ? 5000 : 30000; // 5s when active, 30s when inactive
      
      // Start polling
      pollingInterval = setInterval(poll, pollInterval);
      
      // Check activity status periodically and restart polling if needed
      const checkInterval = isActive ? 300000 : 60000; // 5min when active, 1min when inactive
      activityCheckInterval = setInterval(() => {
        const currentlyActive = checkRecentActivity();
        const currentInterval = currentlyActive ? 5000 : 30000;
        
        // Only restart if the interval needs to change
        if (currentInterval !== pollInterval) {
          setupPolling();
        }
      }, checkInterval);
    };

    setupPolling();

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
      if (activityCheckInterval) clearInterval(activityCheckInterval);
    };
  }, [loading]);

  const loadStandings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await standingsService.getTeamStandings(leagueId);
      setStandings(data);
    } catch (err) {
      console.error('Error loading team standings:', err);
      setError('Failed to load team standings');
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  // Subscribe to real-time standings updates
  useStandingsEvents(leagueId, loadStandings);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-600 bg-yellow-50';
      case 2: return 'text-gray-600 bg-gray-50';
      case 3: return 'text-amber-600 bg-amber-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-16"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-red-500 mb-2">⚠️</div>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadStandings}
          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (standings.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Teams Yet</h3>
        <p className="text-gray-600">Teams will appear here once they join the league.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="mr-2">🏆</span>
              Team Standings
            </h3>
            <button
              onClick={loadStandings}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh standings"
            >
              <svg 
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          
          {/* Show migration button if we detect owner names that look like IDs */}
          {standings.some(s => s.ownerName.includes('Team Owner (') || s.ownerName.includes('Owner ')) && (
            <UserMigrationButton leagueId={leagueId} />
          )}
        </div>
        
        <div className="divide-y divide-gray-200">
          {standings.map((standing) => (
            <div
              key={standing.teamId}
              className={`p-4 hover:bg-gray-50 transition-colors ${
                onTeamClick ? 'cursor-pointer' : ''
              }`}
              onClick={() => onTeamClick?.(standing.teamId)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  {/* Rank */}
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${getRankColor(standing.rank)}`}>
                    {getRankIcon(standing.rank)}
                  </div>
                  
                  {/* Team Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-semibold text-gray-900 truncate">
                      {standing.teamName}
                    </h4>
                    <p className="text-sm text-gray-600 truncate">
                      Owner: {standing.ownerName}
                    </p>
                  </div>
                  
                  {/* Points */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {standing.totalPoints}
                    </div>
                    <div className="text-sm text-gray-600">
                      {standing.episodePoints > 0 && (
                        <span className="text-green-600">
                          +{standing.episodePoints} this episode
                        </span>
                      )}
                      {standing.episodePoints === 0 && (
                        <span className="text-gray-500">No recent points</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {onTeamClick && (
                  <div className="ml-4 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
              
              {/* Contestant Summary */}
              <div className="mt-3 flex flex-wrap gap-2">
                {standing.contestants.slice(0, 3).map((contestant) => (
                  <div
                    key={contestant.id}
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      contestant.isEliminated
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {contestant.name} ({contestant.points}pts)
                  </div>
                ))}
                {standing.contestants.length > 3 && (
                  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    +{standing.contestants.length - 3} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}