'use client';

import React, { useState, useEffect } from 'react';
import { ScoringService } from '../services/scoring-service';
import { EpisodeService } from '../services/episode-service';
import type { Episode } from '../types';

interface EpisodeManagerProps {
  leagueId: string;
  isCommissioner: boolean;
}

export const EpisodeManager: React.FC<EpisodeManagerProps> = ({
  leagueId,
  isCommissioner
}) => {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newEpisodeNumber, setNewEpisodeNumber] = useState<number>(1);
  const [newEpisodeDate, setNewEpisodeDate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const scoringService = new ScoringService();
  const episodeService = new EpisodeService();

  useEffect(() => {
    loadEpisodes();
  }, [leagueId]);

  const loadEpisodes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const episodesData = await scoringService.getEpisodesByLeague(leagueId);
      setEpisodes(episodesData.sort((a, b) => a.episodeNumber - b.episodeNumber));
      
      // Set next episode number
      if (episodesData.length > 0) {
        const maxEpisode = Math.max(...episodesData.map(e => e.episodeNumber));
        setNewEpisodeNumber(maxEpisode + 1);
      }
    } catch (error) {
      console.error('Failed to load episodes:', error);
      setError('Failed to load episodes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEpisode = async () => {
    if (!isCommissioner) return;

    try {
      setIsCreating(true);
      setError(null);

      // Convert date string to proper datetime format
      const dateStr = newEpisodeDate || new Date().toISOString().split('T')[0];
      const airDate = new Date(dateStr + 'T00:00:00.000Z').toISOString();
      
      console.log('Creating episode with:', { leagueId, episodeNumber: newEpisodeNumber, airDate });
      
      await scoringService.createEpisode(leagueId, newEpisodeNumber, airDate);
      
      // Reload episodes
      await loadEpisodes();
      
      // Reset form
      setNewEpisodeDate('');
      
    } catch (error) {
      console.error('Failed to create episode:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // More specific error message
      let errorMessage = 'Failed to create episode. Please try again.';
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = `Failed to create episode: ${error.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSetActiveEpisode = async (episodeId: string) => {
    if (!isCommissioner) return;

    try {
      setError(null);
      await scoringService.setActiveEpisode(episodeId);
      await loadEpisodes();
    } catch (error) {
      console.error('Failed to set active episode:', error);
      setError('Failed to set active episode. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading episodes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Episode Management</h2>
          <p className="text-gray-600">Create and manage episodes for scoring</p>
        </div>
        {isCommissioner && (
          <button
            onClick={() => setNewEpisodeDate(new Date().toISOString().split('T')[0])}
            className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
          >
            📺 Create Episode
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Create Episode Form */}
      {isCommissioner && newEpisodeDate && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Episode</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="episodeNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Episode Number
              </label>
              <input
                type="number"
                id="episodeNumber"
                value={newEpisodeNumber}
                onChange={(e) => setNewEpisodeNumber(parseInt(e.target.value) || 1)}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-rose-500 focus:border-rose-500"
              />
            </div>
            
            <div>
              <label htmlFor="airDate" className="block text-sm font-medium text-gray-700 mb-2">
                Air Date
              </label>
              <input
                type="date"
                id="airDate"
                value={newEpisodeDate}
                onChange={(e) => setNewEpisodeDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-rose-500 focus:border-rose-500"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setNewEpisodeDate('')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateEpisode}
              disabled={isCreating}
              className="px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creating...' : 'Create Episode'}
            </button>
          </div>
        </div>
      )}

      {/* Episodes List */}
      {episodes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📺</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Episodes Yet</h3>
          <p className="text-gray-600 mb-6">
            {isCommissioner 
              ? 'Create your first episode to start scoring.'
              : 'The commissioner needs to create episodes first.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {episodes.map((episode) => (
            <div
              key={episode.id}
              className={`bg-white border rounded-lg p-6 ${
                episode.isActive ? 'border-green-500 bg-green-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      Episode {episode.episodeNumber}
                    </h3>
                    {episode.isActive && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        🔴 Active for Scoring
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(episode.airDate)}
                    </div>
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      {episode.totalEvents} scoring events
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {isCommissioner && !episode.isActive && (
                    <button
                      onClick={() => handleSetActiveEpisode(episode.id)}
                      className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                      Set Active
                    </button>
                  )}
                  
                  {episode.isActive && (
                    <div className="flex items-center text-sm text-green-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                      Ready for Scoring
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Instructions */}
      {episodes.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">How Episode Scoring Works</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Only one episode can be active for scoring at a time</li>
                  <li>Set an episode as &quot;Active&quot; to enable scoring for that episode</li>
                  <li>Go to the &quot;Episode Scoring&quot; tab to score contestants during the episode</li>
                  <li>All league members can score, but commissioners can manage episodes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EpisodeManager;