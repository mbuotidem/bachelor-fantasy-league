'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './EpisodeScorer.module.css';
import { ScoringService } from '../services/scoring-service';
import { ContestantService } from '../services/contestant-service';
import { EpisodeService } from '../services/episode-service';
import { SCORING_CATEGORIES, POSITIVE_CATEGORIES, NEGATIVE_CATEGORIES, getScoringCategoryById } from '../lib/scoring-constants';
import type { Contestant, Episode, ScoringEvent, ScoreActionInput } from '../types';

interface EpisodeScorerProps {
  leagueId: string;
  onScoreUpdate?: (event: ScoringEvent) => void;
  onError?: (error: string) => void;
  className?: string;
  fullHeight?: boolean;
}

interface ContestantScore {
  contestantId: string;
  episodePoints: number;
  totalPoints: number;
}

interface RecentAction extends ScoringEvent {
  contestantName: string;
  categoryName: string;
  categoryEmoji: string;
}

export const EpisodeScorer: React.FC<EpisodeScorerProps> = ({
  leagueId,
  onScoreUpdate,
  onError,
  className = '',
  fullHeight = true
}) => {
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(null);
  const [contestantScores, setContestantScores] = useState<Record<string, ContestantScore>>({});
  const [recentActions, setRecentActions] = useState<RecentAction[]>([]);
  const [selectedContestant, setSelectedContestant] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScoring, setIsScoring] = useState(false);
  const [showPositive, setShowPositive] = useState(true);
  const [showNegative, setShowNegative] = useState(false);
  const [undoQueue, setUndoQueue] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scoringService = new ScoringService();
  const contestantService = new ContestantService();
  const episodeService = new EpisodeService();

  // Load initial data
  useEffect(() => {
    loadData();
  }, [leagueId]);

  // Cleanup animation timeout on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null); // Clear any previous errors
      
      // Load contestants and active episode in parallel
      const [contestantsData, activeEpisodeData] = await Promise.all([
        contestantService.getContestantsByLeague(leagueId),
        episodeService.getActiveEpisode(leagueId)
      ]);

      const filteredContestants = contestantsData.filter(c => !c.isEliminated);
      setContestants(filteredContestants);
      setActiveEpisode(activeEpisodeData);

      if (activeEpisodeData && filteredContestants.length > 0) {
        // Load episode scores
        const scores = await scoringService.calculateEpisodeTotals(activeEpisodeData.id);
        const updatedScores: Record<string, ContestantScore> = {};

        for (const contestant of filteredContestants) {
          updatedScores[contestant.id] = {
            contestantId: contestant.id,
            episodePoints: scores[contestant.id] || 0,
            totalPoints: contestant.totalPoints + (scores[contestant.id] || 0)
          };
        }

        setContestantScores(updatedScores);

        // Load recent actions
        const events = await scoringService.getRecentScoringEvents(activeEpisodeData.id, 10);
        const actionsWithDetails: RecentAction[] = [];

        for (const event of events) {
          const contestant = filteredContestants.find(c => c.id === event.contestantId);
          const category = getScoringCategoryById(event.actionType);
          
          if (contestant && category) {
            actionsWithDetails.push({
              ...event,
              contestantName: contestant.name,
              categoryName: category.name,
              categoryEmoji: category.emoji
            });
          }
        }

        setRecentActions(actionsWithDetails);
        setUndoQueue(events.map(e => e.id));
      }
    } catch (error) {
      console.error('Failed to load scoring data:', error);
      const errorMessage = 'Failed to load scoring data. Please try again.';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEpisodeScores = async (episodeId: string) => {
    try {
      const scores = await scoringService.calculateEpisodeTotals(episodeId);
      const updatedScores: Record<string, ContestantScore> = {};

      // Use current contestants state, not the stale contestants from closure
      const currentContestants = contestants.length > 0 ? contestants : 
        await contestantService.getContestantsByLeague(leagueId);

      for (const contestant of currentContestants) {
        updatedScores[contestant.id] = {
          contestantId: contestant.id,
          episodePoints: scores[contestant.id] || 0,
          totalPoints: contestant.totalPoints + (scores[contestant.id] || 0)
        };
      }

      setContestantScores(updatedScores);
    } catch (error) {
      console.error('Failed to load episode scores:', error);
    }
  };

  const loadRecentActions = async (episodeId: string) => {
    try {
      const events = await scoringService.getRecentScoringEvents(episodeId, 10);
      const actionsWithDetails: RecentAction[] = [];

      // Use current contestants state, not the stale contestants from closure
      const currentContestants = contestants.length > 0 ? contestants : 
        await contestantService.getContestantsByLeague(leagueId);

      for (const event of events) {
        const contestant = currentContestants.find(c => c.id === event.contestantId);
        const category = getScoringCategoryById(event.actionType);
        
        if (contestant && category) {
          actionsWithDetails.push({
            ...event,
            contestantName: contestant.name,
            categoryName: category.name,
            categoryEmoji: category.emoji
          });
        }
      }

      setRecentActions(actionsWithDetails);
      setUndoQueue(events.map(e => e.id));
    } catch (error) {
      console.error('Failed to load recent actions:', error);
    }
  };

  const handleScoreAction = useCallback(async (contestantId: string, categoryId: string) => {
    if (!activeEpisode || isScoring) return;

    const category = getScoringCategoryById(categoryId);
    if (!category) return;

    try {
      setIsScoring(true);
      setError(null); // Clear any previous errors

      const scoreInput: ScoreActionInput = {
        episodeId: activeEpisode.id,
        contestantId,
        actionType: categoryId,
        points: category.points,
        description: category.description
      };

      const event = await scoringService.scoreAction(scoreInput);

      // Optimistic UI update
      setContestantScores(prev => ({
        ...prev,
        [contestantId]: {
          ...prev[contestantId],
          episodePoints: (prev[contestantId]?.episodePoints || 0) + category.points,
          totalPoints: (prev[contestantId]?.totalPoints || 0) + category.points
        }
      }));

      // Add to recent actions
      const contestant = contestants.find(c => c.id === contestantId);
      if (contestant) {
        const newAction: RecentAction = {
          ...event,
          contestantName: contestant.name,
          categoryName: category.name,
          categoryEmoji: category.emoji
        };

        setRecentActions(prev => [newAction, ...prev.slice(0, 9)]);
        setUndoQueue(prev => [event.id, ...prev.slice(0, 9)]);
      }

      // Show success animation
      showScoreAnimation(contestantId, category.points);

      // Call callback after successful scoring
      onScoreUpdate?.(event);

    } catch (error) {
      console.error('Failed to score action:', error);
      const errorMessage = 'Failed to score action. Please try again.';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsScoring(false);
    }
  }, [activeEpisode, isScoring, contestants, onScoreUpdate, onError]);

  const handleUndo = useCallback(async () => {
    if (!activeEpisode || undoQueue.length === 0 || isScoring) return;

    try {
      setIsScoring(true);
      setError(null); // Clear any previous errors
      const eventId = undoQueue[0];
      const actionToUndo = recentActions.find(a => a.id === eventId);

      if (!actionToUndo) return;

      await scoringService.undoScoringEvent({
        episodeId: activeEpisode.id,
        eventId
      });

      // Update UI
      setContestantScores(prev => ({
        ...prev,
        [actionToUndo.contestantId]: {
          ...prev[actionToUndo.contestantId],
          episodePoints: (prev[actionToUndo.contestantId]?.episodePoints || 0) - actionToUndo.points,
          totalPoints: (prev[actionToUndo.contestantId]?.totalPoints || 0) - actionToUndo.points
        }
      }));

      setRecentActions(prev => prev.filter(a => a.id !== eventId));
      setUndoQueue(prev => prev.filter(id => id !== eventId));

    } catch (error) {
      console.error('Failed to undo action:', error);
      const errorMessage = 'Failed to undo action. Please try again.';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsScoring(false);
    }
  }, [activeEpisode, undoQueue, recentActions, isScoring]);

  const showScoreAnimation = (contestantId: string, points: number) => {
    // Clear any existing animation timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    // Create floating animation element
    const element = document.createElement('div');
    element.className = `fixed z-50 pointer-events-none text-6xl font-black ${
      points > 0 ? 'text-green-500' : 'text-red-500'
    }`;
    element.textContent = `${points > 0 ? '+' : ''}${points}`;
    element.style.left = '50%';
    element.style.top = '50%';
    element.style.transform = 'translate(-50%, -50%)';
    element.style.textShadow = '3px 3px 6px rgba(0, 0, 0, 0.5)';
    element.style.webkitTextStroke = '2px white';
    element.className += ` ${styles.scoreAnimation}`;

    document.body.appendChild(element);

    // Store timeout reference for cleanup
    animationTimeoutRef.current = setTimeout(() => {
      if (document.body.contains(element)) {
        document.body.removeChild(element);
      }
      animationTimeoutRef.current = null;
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${fullHeight ? 'min-h-screen' : 'min-h-96'} bg-gray-50 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading episode scorer...</p>
        </div>
      </div>
    );
  }

  if (!activeEpisode) {
    return (
      <div className={`flex items-center justify-center ${fullHeight ? 'min-h-screen' : 'min-h-96'} bg-gray-50 ${className}`}>
        <div className="text-center p-6 max-w-md mx-auto">
          <div className="text-6xl mb-4">📺</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Active Episode</h2>
          <p className="text-gray-600 mb-6">No episode is currently active for scoring.</p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <h3 className="font-medium text-blue-900 mb-2">To start scoring:</h3>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Go to the <strong>Episodes</strong> tab</li>
              <li>2. Create a new episode (if commissioner)</li>
              <li>3. Set an episode as <strong>Active</strong></li>
              <li>4. Return here to start scoring!</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${fullHeight ? 'min-h-screen' : ''} bg-gray-50 ${className}`}>
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 mx-4 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile-Optimized Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                📺 Episode {activeEpisode.episodeNumber}
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <p className="text-xs sm:text-sm text-gray-600">Live Scoring</p>
              </div>
            </div>
            {undoQueue.length > 0 && (
              <button
                onClick={handleUndo}
                disabled={isScoring}
                className="px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
              >
                <span>↩️</span>
                <span className="hidden sm:inline">Undo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile-Optimized Category Toggle */}
      <div className="bg-white border-b sticky top-16 z-30">
        <div className="px-4 py-3">
          <div className="flex rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => { setShowPositive(true); setShowNegative(false); }}
              className={`flex-1 py-3 px-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                showPositive && !showNegative
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex flex-col items-center space-y-1">
                <span>✅</span>
                <span>Positive</span>
              </div>
            </button>
            <button
              onClick={() => { setShowPositive(false); setShowNegative(true); }}
              className={`flex-1 py-3 px-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                !showPositive && showNegative
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex flex-col items-center space-y-1">
                <span>❌</span>
                <span>Negative</span>
              </div>
            </button>
            <button
              onClick={() => { setShowPositive(true); setShowNegative(true); }}
              className={`flex-1 py-3 px-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                showPositive && showNegative
                  ? 'bg-purple-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex flex-col items-center space-y-1">
                <span>📊</span>
                <span>All</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Mobile Optimized */}
      <div className="pb-20">
        {/* Contestant Selection */}
        {!selectedContestant && (
          <div className="p-4 max-w-md mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              👥 Select Contestant
            </h2>
            <div className="space-y-3">
              {contestants.map(contestant => (
                <button
                  key={contestant.id}
                  onClick={() => setSelectedContestant(contestant.id)}
                  className="w-full p-4 bg-white rounded-xl shadow-sm border-2 border-gray-100 hover:border-pink-300 hover:shadow-md transition-all text-left active:scale-98"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-lg truncate">{contestant.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Episode: <span className="font-medium">{contestantScores[contestant.id]?.episodePoints || 0} pts</span>
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-gray-900">
                        {contestantScores[contestant.id]?.totalPoints || contestant.totalPoints}
                      </div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Total</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mobile-Optimized Scoring Interface */}
        {selectedContestant && (
          <div className="p-4">
            {/* Selected Contestant Header - Mobile Optimized */}
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl shadow-sm border-2 border-pink-100 p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setSelectedContestant(null)}
                  className="flex items-center text-gray-600 hover:text-gray-900 bg-white px-3 py-2 rounded-lg shadow-sm"
                >
                  <span className="mr-1">←</span>
                  <span className="text-sm">Back</span>
                </button>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">
                    {contestantScores[selectedContestant]?.totalPoints || 
                     contestants.find(c => c.id === selectedContestant)?.totalPoints || 0}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Total Points</div>
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {contestants.find(c => c.id === selectedContestant)?.name}
                </h2>
                <p className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full inline-block">
                  Episode: <span className="font-semibold">{contestantScores[selectedContestant]?.episodePoints || 0} pts</span>
                </p>
              </div>
            </div>

            {/* Mobile-Optimized Scoring Buttons */}
            <div className="space-y-6">
              {showPositive && (
                <div>
                  <h3 className="text-lg font-bold text-green-700 mb-4 text-center">
                    ✅ Positive Actions
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {POSITIVE_CATEGORIES.map(category => (
                      <button
                        key={category.id}
                        onClick={() => handleScoreAction(selectedContestant, category.id)}
                        disabled={isScoring}
                        className={`p-4 rounded-xl text-white font-medium shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[120px] flex flex-col justify-center items-center ${category.color}`}
                      >
                        <div className="text-3xl mb-2">{category.emoji}</div>
                        <div className="text-sm font-bold text-center leading-tight">{category.name}</div>
                        <div className="text-xs opacity-90 mt-1 bg-white bg-opacity-20 px-2 py-1 rounded-full">
                          +{category.points} pts
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {showNegative && (
                <div>
                  <h3 className="text-lg font-bold text-red-700 mb-4 text-center">
                    ❌ Negative Actions
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {NEGATIVE_CATEGORIES.map(category => (
                      <button
                        key={category.id}
                        onClick={() => handleScoreAction(selectedContestant, category.id)}
                        disabled={isScoring}
                        className={`p-4 rounded-xl text-white font-medium shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[120px] flex flex-col justify-center items-center ${category.color}`}
                      >
                        <div className="text-3xl mb-2">{category.emoji}</div>
                        <div className="text-sm font-bold text-center leading-tight">{category.name}</div>
                        <div className="text-xs opacity-90 mt-1 bg-white bg-opacity-20 px-2 py-1 rounded-full">
                          {category.points} pts
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile-Optimized Recent Actions */}
        {recentActions.length > 0 && (
          <div className="mt-8 p-4 bg-gray-50 border-t-4 border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
              📋 Recent Actions
            </h3>
            <div className="space-y-3">
              {recentActions.slice(0, 5).map(action => (
                <div
                  key={action.id}
                  className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="text-2xl flex-shrink-0">{action.categoryEmoji}</div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-gray-900 truncate">{action.contestantName}</div>
                      <div className="text-sm text-gray-600 truncate">{action.categoryName}</div>
                    </div>
                  </div>
                  <div className={`font-bold text-xl flex-shrink-0 ml-3 ${
                    action.points > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {action.points > 0 ? '+' : ''}{action.points}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default EpisodeScorer;