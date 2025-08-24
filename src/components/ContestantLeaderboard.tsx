'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ContestantStanding } from '../types';
import { StandingsService } from '../services/standings-service';
import { useStandingsEvents } from '../lib/standings-events';

interface ContestantLeaderboardProps {
  leagueId: string;
  onContestantClick?: (contestantId: string) => void;
  showEpisodePerformers?: boolean;
  className?: string;
}

export default function ContestantLeaderboard({ 
  leagueId, 
  onContestantClick, 
  showEpisodePerformers = false,
  className = '' 
}: ContestantLeaderboardProps) {
  const [standings, setStandings] = useState<ContestantStanding[]>([]);
  const [episodePerformers, setEpisodePerformers] = useState<ContestantStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overall' | 'episode'>('overall');

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
      
      const [overallData, episodeData] = await Promise.all([
        standingsService.getContestantStandings(leagueId),
        showEpisodePerformers 
          ? standingsService.getCurrentEpisodeTopPerformers(leagueId, 10)
          : Promise.resolve([])
      ]);
      
      setStandings(overallData);
      setEpisodePerformers(episodeData);
    } catch (err) {
      console.error('Error loading contestant standings:', err);
      setError('Failed to load contestant standings');
    } finally {
      setLoading(false);
    }
  }, [leagueId, showEpisodePerformers]);

  // Subscribe to real-time standings updates
  useStandingsEvents(leagueId, loadStandings);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '👑';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 2: return 'text-gray-600 bg-gray-50 border-gray-200';
      case 3: return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const renderContestantRow = (standing: ContestantStanding, showEpisodePoints = false) => (
    <div
      key={standing.contestantId}
      className={`p-4 hover:bg-gray-50 transition-colors ${
        onContestantClick ? 'cursor-pointer' : ''
      } ${standing.isEliminated ? 'opacity-75' : ''}`}
      onClick={() => onContestantClick?.(standing.contestantId)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          {/* Rank */}
          <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold border ${getRankColor(standing.rank)}`}>
            {getRankIcon(standing.rank)}
          </div>
          
          {/* Contestant Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className={`text-lg font-semibold truncate ${
                standing.isEliminated ? 'text-gray-500 line-through' : 'text-gray-900'
              }`}>
                {standing.name}
              </h4>
              {standing.isEliminated && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Eliminated
                </span>
              )}
            </div>
            
            {/* Drafted by teams */}
            {standing.draftedByTeams.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {standing.draftedByTeams.map((teamName, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {teamName}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {/* Points */}
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {showEpisodePoints ? standing.episodePoints : standing.totalPoints}
            </div>
            <div className="text-sm text-gray-600">
              {showEpisodePoints ? 'Episode Points' : 'Total Points'}
            </div>
            {!showEpisodePoints && standing.episodePoints > 0 && (
              <div className="text-sm text-green-600">
                +{standing.episodePoints} this episode
              </div>
            )}
          </div>
        </div>
        
        {onContestantClick && (
          <div className="ml-4 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-20"></div>
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
        <div className="text-6xl mb-4">🏅</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Contestants Yet</h3>
        <p className="text-gray-600">Contestants will appear here once they&apos;re added to the league.</p>
      </div>
    );
  }

  const currentStandings = activeTab === 'overall' ? standings : episodePerformers;

  return (
    <div className={className}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="mr-2">🏅</span>
              Contestant Leaderboard
            </h3>
            
            <div className="flex items-center space-x-2">
              {showEpisodePerformers && (
                <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                  <button
                    onClick={() => setActiveTab('overall')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'overall'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Overall
                  </button>
                  <button
                    onClick={() => setActiveTab('episode')}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'episode'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    This Episode
                  </button>
                </div>
              )}
              
              <button
                onClick={loadStandings}
                disabled={loading}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh leaderboard"
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
          </div>
        </div>
        
        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {currentStandings.map((standing) => 
            renderContestantRow(standing, activeTab === 'episode')
          )}
        </div>
        
        {currentStandings.length === 0 && activeTab === 'episode' && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📺</div>
            <p className="text-gray-600">No episode scoring yet</p>
          </div>
        )}
      </div>
    </div>
  );
}