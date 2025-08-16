'use client';

import React, { useState, useEffect } from 'react';
import { TeamDetail } from '../types';
import { StandingsService } from '../services/standings-service';

interface TeamDetailViewProps {
  teamId: string;
  onBack?: () => void;
  className?: string;
}

export default function TeamDetailView({ teamId, onBack, className = '' }: TeamDetailViewProps) {
  const [teamDetail, setTeamDetail] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const standingsService = new StandingsService();

  useEffect(() => {
    loadTeamDetail();
  }, [teamId]);

  const loadTeamDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await standingsService.getTeamDetail(teamId);
      setTeamDetail(data);
    } catch (err) {
      console.error('Error loading team detail:', err);
      setError('Failed to load team details');
    } finally {
      setLoading(false);
    }
  };

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
      case 1: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 2: return 'text-gray-600 bg-gray-50 border-gray-200';
      case 3: return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="space-y-6">
          <div className="bg-gray-200 rounded-lg h-32"></div>
          <div className="bg-gray-200 rounded-lg h-64"></div>
          <div className="bg-gray-200 rounded-lg h-48"></div>
        </div>
      </div>
    );
  }

  if (error || !teamDetail) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-red-500 mb-2">⚠️</div>
        <p className="text-red-600 mb-4">{error || 'Team not found'}</p>
        <div className="space-x-2">
          <button
            onClick={loadTeamDetail}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            Try Again
          </button>
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  const { team, owner, contestants, standings, episodeHistory } = teamDetail;

  return (
    <div className={className}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
                <p className="text-gray-600">Owned by {owner.displayName}</p>
              </div>
            </div>
            
            <div className={`flex items-center justify-center w-16 h-16 rounded-full text-lg font-bold border-2 ${getRankColor(standings.rank)}`}>
              {getRankIcon(standings.rank)}
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{standings.totalPoints}</div>
              <div className="text-sm text-blue-800">Total Points</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{standings.episodePoints}</div>
              <div className="text-sm text-green-800">Episode Points</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{contestants.length}</div>
              <div className="text-sm text-purple-800">Contestants</div>
            </div>
          </div>
        </div>
      </div>

      {/* Contestants */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="mr-2">👥</span>
            Team Roster
          </h2>
        </div>
        
        <div className="p-6">
          {contestants.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🎯</div>
              <p className="text-gray-600">No contestants drafted yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contestants.map((contestant) => (
                <div
                  key={contestant.id}
                  className={`border rounded-lg p-4 ${
                    contestant.isEliminated 
                      ? 'border-red-200 bg-red-50 opacity-75' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`font-semibold ${
                      contestant.isEliminated ? 'text-red-700 line-through' : 'text-gray-900'
                    }`}>
                      {contestant.name}
                    </h3>
                    {contestant.isEliminated && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Eliminated
                      </span>
                    )}
                  </div>
                  
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {contestant.totalPoints} pts
                  </div>
                  
                  {contestant.age && (
                    <p className="text-sm text-gray-600">Age: {contestant.age}</p>
                  )}
                  {contestant.hometown && (
                    <p className="text-sm text-gray-600">From: {contestant.hometown}</p>
                  )}
                  {contestant.occupation && (
                    <p className="text-sm text-gray-600">{contestant.occupation}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Episode History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="mr-2">📈</span>
            Episode Performance
          </h2>
        </div>
        
        <div className="p-6">
          {episodeHistory.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📺</div>
              <p className="text-gray-600">No episode scores yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {episodeHistory.map((episode) => (
                <div
                  key={episode.episodeId}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Episode {episode.episodeNumber}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {episode.events.length} scoring events
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-xl font-bold ${
                      episode.points > 0 ? 'text-green-600' : 
                      episode.points < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {episode.points > 0 ? '+' : ''}{episode.points}
                    </div>
                    <div className="text-sm text-gray-600">points</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}