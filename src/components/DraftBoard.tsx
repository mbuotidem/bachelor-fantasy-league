'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { draftService, teamService } from '../services';
import type { Draft, Contestant, Team } from '../types';
import ContestantCard from './ContestantCard';
import DraftTimer from './DraftTimer';
import TeamRoster from './TeamRoster';
import DraftDebug from './DraftDebug';

interface DraftBoardProps {
  leagueId: string;
  currentUserId: string;
  isCommissioner?: boolean;
  onDraftComplete?: (draft: Draft) => void;
}

interface DraftContestantCardProps {
  contestant: Contestant;
  onSelect: (contestant: Contestant) => void;
  isSelectable: boolean;
  isDrafted: boolean;
  draftedByTeam?: string;
}

function DraftContestantCard({
  contestant,
  onSelect,
  isSelectable,
  isDrafted,
  draftedByTeam
}: DraftContestantCardProps) {
  const handleClick = () => {
    if (isSelectable && !isDrafted) {
      onSelect(contestant);
    }
  };

  return (
    <div className="relative">
      <div
        className={`transition-all duration-200 ${isDrafted
          ? 'opacity-50 grayscale cursor-not-allowed'
          : isSelectable
            ? 'cursor-pointer hover:scale-105 hover:shadow-xl ring-4 ring-green-400 ring-opacity-75 shadow-lg transform hover:-translate-y-1'
            : 'opacity-60 cursor-not-allowed'
          }`}
        onClick={handleClick}
      >
        <ContestantCard
          contestant={contestant}
          showActions={false}
        />
      </div>

      {/* Draft status overlay */}
      {isDrafted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 rounded-lg">
          <div className="text-white text-center">
            <div className="text-lg font-bold">DRAFTED</div>
            {draftedByTeam && (
              <div className="text-sm">{draftedByTeam}</div>
            )}
          </div>
        </div>
      )}

      {/* Selectable indicator */}
      {isSelectable && !isDrafted && (
        <>
          <div className="absolute top-2 left-2 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-bounce shadow-lg pointer-events-none">
            🎯 CLICK TO DRAFT
          </div>
          <div className="absolute inset-0 border-4 border-green-400 border-dashed rounded-lg animate-pulse pointer-events-none"></div>
        </>
      )}

      {/* Not your turn indicator */}
      {!isSelectable && !isDrafted && (
        <div className="absolute top-2 left-2 bg-gray-500 text-white px-2 py-1 rounded-full text-xs font-medium">
          Wait Your Turn
        </div>
      )}
    </div>
  );
}

export default function DraftBoard({ leagueId, currentUserId, isCommissioner = false, onDraftComplete }: DraftBoardProps) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [makingPick, setMakingPick] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const loadDraftData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load draft
      const draftData = await draftService.getDraftByLeague(leagueId);
      setDraft(draftData);

      // Load contestants
      const contestantsData = await draftService.getAvailableContestants(leagueId, draftData?.id);
      setContestants(contestantsData);

      // Load teams
      const teamsData = await teamService.getTeamsByLeague(leagueId);
      setTeams(teamsData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load draft data');
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  // Load draft data on mount
  useEffect(() => {
    loadDraftData();
  }, [loadDraftData]);

  // Set up polling for live updates during active draft
  useEffect(() => {
    if (draft?.status === 'in_progress') {
      const interval = setInterval(() => {
        if (!document.hidden) {
          loadDraftData();
        }
      }, 10000); // Poll every 10 seconds during active draft

      return () => clearInterval(interval);
    }
  }, [draft?.status, loadDraftData]);

  // ========================================
  // BUTTON 1: CREATE DRAFT
  // ========================================
  const handleCreateDraft = async () => {
    try {
      setLoading(true);
      setError(null);

      const newDraft = await draftService.createDraft({ leagueId });
      setDraft(newDraft);

      // Reload data to ensure consistency
      await loadDraftData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create draft';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // BUTTON 2: START DRAFT
  // ========================================
  const handleStartDraft = async () => {
    if (!draft) {
      setError('No draft found to start');
      return;
    }

    if (!confirm('Start the draft now?\n\nThis will lock in all settings and begin the live draft. This cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const startedDraft = await draftService.startDraft(draft.id);
      setDraft(startedDraft);

      // Reload data to ensure consistency
      await loadDraftData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start draft';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // DRAFT PICK HANDLING
  // ========================================
  const handleContestantSelect = async (contestant: Contestant) => {
    if (!draft) {
      alert('No draft found. Please refresh the page.');
      return;
    }

    if (!canMakePick()) {
      alert('It&apos;s not your turn to pick or the draft is not active.');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to draft ${contestant.name}?\n\n` +
      `This will add them to your team and cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setMakingPick(true);
      setError(null);

      const currentTeam = getCurrentUserTeam();
      if (!currentTeam) {
        throw new Error('Could not find your team. Please refresh the page.');
      }

      const updatedDraft = await draftService.makePick({
        draftId: draft.id,
        teamId: currentTeam.id,
        contestantId: contestant.id,
      });

      setDraft(updatedDraft);

      // Reload contestants to update availability
      const updatedContestants = await draftService.getAvailableContestants(leagueId, updatedDraft.id);
      setContestants(updatedContestants);

      // Check if draft is complete
      if (updatedDraft.status === 'completed') {
        onDraftComplete?.(updatedDraft);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to make pick');
    } finally {
      setMakingPick(false);
    }
  };

  // ========================================
  // HELPER FUNCTIONS
  // ========================================
  const getCurrentUserTeam = (): Team | null => {
    return teams.find(team => team.ownerId === currentUserId) || null;
  };

  const canMakePick = (): boolean => {
    if (!draft || draft.status !== 'in_progress') return false;

    const currentTeam = getCurrentUserTeam();
    if (!currentTeam) return false;

    const currentTeamId = draftService.getCurrentTeamId(draft);
    return currentTeamId === currentTeam.id;
  };

  const getTeamNameById = (teamId: string): string => {
    const team = teams.find(t => t.id === teamId);
    return team?.name || 'Unknown Team';
  };

  // ========================================
  // RENDER STATES
  // ========================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading draft...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadDraftData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ========================================
  // STATE 1: NO DRAFT EXISTS
  // ========================================
  if (!draft) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Draft Found</h3>
        <p className="text-gray-600 mb-6">A draft hasn&apos;t been created for this league yet.</p>

        {isCommissioner ? (
          <div className="space-y-4">
            <button
              onClick={handleCreateDraft}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Draft...' : '📝 Create Draft'}
            </button>

            <p className="text-sm text-gray-500">
              This will create a draft and take you to the pre-draft lobby where you can configure settings.
            </p>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-blue-800 font-medium">Waiting for commissioner to create the draft</span>
            </div>
          </div>
        )}

        {/* Debug Section */}
        {isCommissioner && (
          <div className="mt-8">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 mb-4"
            >
              {showDebug ? '🔧 Hide Debug' : '🔧 Show Debug'}
            </button>

            {showDebug && (
              <DraftDebug leagueId={leagueId} />
            )}
          </div>
        )}
      </div>
    );
  }

  // ========================================
  // STATE 2: DRAFT CREATED (PRE-DRAFT LOBBY)
  // ========================================
  if (draft.status === 'not_started') {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 text-blue-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Draft Created - Pre-Draft Lobby</h3>
        <p className="text-gray-600 mb-6">
          The draft has been created and is ready to start. All league members can see this page and prepare.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto mb-6">
          <h4 className="font-semibold text-blue-900 mb-2">Draft Settings</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <div>Format: {draft.settings.draftFormat === 'snake' ? 'Snake Draft' : 'Linear Draft'}</div>
            <div>Pick Time Limit: {draft.settings.pickTimeLimit} seconds</div>
            <div>Teams: {teams.length}</div>
            <div>Total Picks: {teams.length * 5}</div>
          </div>
        </div>

        {isCommissioner ? (
          <div className="space-y-4">
            <button
              onClick={handleStartDraft}
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Starting Draft...' : '🚀 Start Draft'}
            </button>

            <p className="text-sm text-gray-500">
              This will randomize the draft order and begin the live draft. This cannot be undone.
            </p>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-green-800 font-medium">Ready to draft! Waiting for commissioner to start.</span>
            </div>
          </div>
        )}

        {/* Debug Section */}
        {isCommissioner && (
          <div className="mt-8">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 mb-4"
            >
              {showDebug ? '🔧 Hide Debug' : '🔧 Show Debug'}
            </button>

            {showDebug && (
              <DraftDebug leagueId={leagueId} />
            )}
          </div>
        )}
      </div>
    );
  }

  // ========================================
  // STATE 3: DRAFT IN PROGRESS (LIVE DRAFTING)
  // ========================================
  if (draft.status === 'in_progress') {
    const currentTeamId = draftService.getCurrentTeamId(draft);
    const currentTeam = teams.find(t => t.id === currentTeamId);
    const isMyTurn = canMakePick();
    const draftStatus = draftService.getDraftStatus(draft);

    return (
      <div className="space-y-6">
        {/* Draft Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Live Draft</h2>
            <div className="text-sm text-gray-600">
              Pick {draft.currentPick} of {teams.length * 5}
            </div>
          </div>

          {/* Current Turn Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`px-4 py-2 rounded-lg ${isMyTurn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {isMyTurn ? '🎯 Your Turn!' : `${currentTeam?.name || 'Unknown Team'}'s Turn`}
              </div>
              <div className="text-sm text-gray-600">
                Round {draftStatus.currentRound} of {draftStatus.totalRounds}
              </div>
            </div>

            {/* Draft Timer */}
            <DraftTimer
              timeLimit={draft.settings.pickTimeLimit}
              isActive={draft.status === 'in_progress'}
              currentTurnId={currentTeamId || undefined}
              onTimeExpired={() => {
                // Handle auto-pick or time expiration
                console.log('Time expired for pick');
              }}
            />
          </div>
        </div>

        {/* Team Rosters */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {teams.map((team) => (
            <TeamRoster
              key={team.id}
              team={team}
              draft={draft}
              showDraftOrder={true}
            />
          ))}
        </div>

        {/* Available Contestants */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Available Contestants ({contestants.length})
          </h3>

          {contestants.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No contestants available</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {contestants.map((contestant) => {
                const isDrafted = draft.picks.some(pick => pick.contestantId === contestant.id);
                const draftedByTeam = isDrafted
                  ? getTeamNameById(draft.picks.find(pick => pick.contestantId === contestant.id)?.teamId || '')
                  : undefined;

                return (
                  <DraftContestantCard
                    key={contestant.id}
                    contestant={contestant}
                    onSelect={handleContestantSelect}
                    isSelectable={isMyTurn && !makingPick}
                    isDrafted={isDrafted}
                    draftedByTeam={draftedByTeam}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Debug Section */}
        {isCommissioner && (
          <div className="mt-8">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 mb-4"
            >
              {showDebug ? '🔧 Hide Debug' : '🔧 Show Debug'}
            </button>

            {showDebug && (
              <DraftDebug leagueId={leagueId} />
            )}
          </div>
        )}
      </div>
    );
  }

  // ========================================
  // STATE 4: DRAFT COMPLETED
  // ========================================
  if (draft.status === 'completed') {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Draft Complete!</h3>
        <p className="text-gray-600 mb-6">
          The draft has finished. All teams have selected their contestants.
        </p>

        {/* Team Rosters */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {teams.map((team) => (
            <TeamRoster
              key={team.id}
              team={team}
              draft={draft}
              showDraftOrder={false}
            />
          ))}
        </div>

        {/* Debug Section */}
        {isCommissioner && (
          <div className="mt-8">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 mb-4"
            >
              {showDebug ? '🔧 Hide Debug' : '🔧 Show Debug'}
            </button>

            {showDebug && (
              <DraftDebug leagueId={leagueId} />
            )}
          </div>
        )}
      </div>
    );
  }

  // Fallback
  return (
    <div className="text-center py-12">
      <p className="text-gray-500">Unknown draft state: {draft.status}</p>
    </div>
  );
}