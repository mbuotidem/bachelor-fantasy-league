'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { draftService, teamService } from '../services';
import type { Draft, Contestant, Team } from '../types';
import ContestantCard from './ContestantCard';
import DraftTimer from './DraftTimer';
import TeamRoster from './TeamRoster';

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
        className={`transition-all duration-200 ${
          isDrafted 
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
      
      {/* Selectable indicator - much more prominent */}
      {isSelectable && !isDrafted && (
        <>
          <div className="absolute top-2 left-2 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-bounce shadow-lg pointer-events-none">
            🎯 CLICK TO DRAFT
          </div>
          <div className="absolute inset-0 border-4 border-green-400 border-dashed rounded-lg animate-pulse pointer-events-none"></div>
          <div className="absolute bottom-2 right-2 bg-green-600 text-white p-2 rounded-full shadow-lg animate-pulse pointer-events-none">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
          </div>
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

  const loadDraftData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load draft
      console.log('Loading draft for league:', leagueId);
      const draftData = await draftService.getDraftByLeague(leagueId);
      console.log('Loaded draft data:', draftData);
      setDraft(draftData);

      // Load contestants
      const contestantsData = await draftService.getAvailableContestants(leagueId, draftData?.id);
      setContestants(contestantsData);

      // Load teams
      const teamsData = await teamService.getTeamsByLeague(leagueId);
      setTeams(teamsData);

    } catch (err) {
      console.error('Error loading draft data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load draft data');
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  // Load draft data
  useEffect(() => {
    loadDraftData();
  }, [loadDraftData]);

  // Set up real-time updates (simplified for now)
  useEffect(() => {
    if (!draft) return;

    // Poll for updates every 30 seconds during active draft (much less aggressive)
    if (draft.status === 'in_progress') {
      const interval = setInterval(() => {
        // Only poll if the page is visible
        if (!document.hidden) {
          loadDraftData();
        }
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [draft, loadDraftData]);

  const handleStartDraft = async () => {
    if (!draft) return;

    try {
      setError(null);
      const updatedDraft = await draftService.startDraft(draft.id);
      setDraft(updatedDraft);
    } catch (err) {
      console.error('Error starting draft:', err);
      setError(err instanceof Error ? err.message : 'Failed to start draft');
    }
  };

  const handleRestartDraft = async () => {
    if (!draft) return;

    const confirmed = window.confirm(
      'Are you sure you want to restart the draft?\n\n' +
      'This will:\n' +
      '• Reset all picks\n' +
      '• Clear all team rosters\n' +
      '• Randomize the draft order\n' +
      '• Set draft status back to "not started"\n\n' +
      'This action cannot be undone!'
    );

    if (!confirmed) return;

    try {
      setError(null);
      setLoading(true);
      
      const updatedDraft = await draftService.restartDraft(draft.id);
      setDraft(updatedDraft);
      
      // Reload contestants and teams to reflect the reset
      await loadDraftData();
      
      alert('Draft has been restarted! You can now start it again with the new team setup.');
      
    } catch (err) {
      console.error('Error restarting draft:', err);
      setError(err instanceof Error ? err.message : 'Failed to restart draft');
    } finally {
      setLoading(false);
    }
  };

  const handleContestantSelect = async (contestant: Contestant) => {
    console.log('Contestant clicked:', contestant.name);
    
    if (!draft) {
      console.log('No draft found');
      alert('No draft found. Please refresh the page.');
      return;
    }

    if (!canMakePick()) {
      console.log('Cannot make pick - not user turn or draft not active');
      alert('It\'s not your turn to pick or the draft is not active.');
      return;
    }

    console.log('Showing confirmation dialog...');
    
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to draft ${contestant.name}?\n\n` +
      `This will add them to your team and cannot be undone.`
    );
    
    if (!confirmed) {
      console.log('User cancelled pick');
      return;
    }

    console.log('User confirmed pick, proceeding...');

    try {
      setMakingPick(true);
      setError(null);

      const currentTeam = getCurrentUserTeam();
      if (!currentTeam) {
        console.error('No current user team found');
        throw new Error('Could not find your team. Please refresh the page.');
      }

      console.log('Making pick:', {
        draftId: draft.id,
        teamId: currentTeam.id,
        contestantId: contestant.id,
        contestantName: contestant.name,
        fullDraft: draft
      });

      const updatedDraft = await draftService.makePick({
        draftId: draft.id,
        teamId: currentTeam.id,
        contestantId: contestant.id,
      });

      console.log('Pick successful, updated draft:', updatedDraft);

      setDraft(updatedDraft);

      // Reload contestants to update availability
      const updatedContestants = await draftService.getAvailableContestants(leagueId, updatedDraft.id);
      setContestants(updatedContestants);

      // Show success message
      alert(`✅ Successfully drafted ${contestant.name} to your team!`);

      // Check if draft is complete
      if (updatedDraft.status === 'completed') {
        onDraftComplete?.(updatedDraft);
      }

    } catch (err) {
      console.error('Error making pick:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to make pick';
      setError(errorMessage);
      alert(`❌ Failed to draft ${contestant.name}: ${errorMessage}`);
    } finally {
      setMakingPick(false);
    }
  };

  const canMakePick = (): boolean => {
    if (!draft || draft.status !== 'in_progress' || makingPick) {
      return false;
    }

    const currentTeamId = draftService.getCurrentTeamId(draft);
    const currentUserTeam = getCurrentUserTeam();
    
    return currentUserTeam?.id === currentTeamId;
  };

  const getCurrentUserTeam = (): Team | undefined => {
    return teams.find(team => team.ownerId === currentUserId);
  };

  const getCurrentTeamName = (): string => {
    if (!draft) return '';
    
    const currentTeamId = draftService.getCurrentTeamId(draft);
    const team = teams.find(t => t.id === currentTeamId);
    return team?.name || 'Unknown Team';
  };

  const getDraftedContestants = (): Map<string, string> => {
    if (!draft) return new Map();
    
    const draftedMap = new Map<string, string>();
    
    draft.picks.forEach(pick => {
      const team = teams.find(t => t.id === pick.teamId);
      if (team) {
        draftedMap.set(pick.contestantId, team.name);
      }
    });
    
    return draftedMap;
  };

  const getDraftStatus = () => {
    if (!draft) return null;
    return draftService.getDraftStatus(draft);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading draft...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-red-800 font-semibold">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
        <button
          onClick={loadDraftData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Draft Found</h3>
        <p className="text-gray-600">A draft hasn&apos;t been created for this league yet.</p>
      </div>
    );
  }

  const draftStatus = getDraftStatus();
  const draftedContestants = getDraftedContestants();
  const isUserTurn = canMakePick();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Your Team Roster - Sidebar */}
      <div className="lg:col-span-1">
        {getCurrentUserTeam() ? (
          <div className="sticky top-4">
            <TeamRoster 
              team={getCurrentUserTeam()!} 
              draft={draft}
              showDraftOrder={true}
            />
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="text-yellow-800 font-medium">No Team Found</p>
                <p className="text-yellow-700 text-sm">You need to join a team to participate in the draft.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Draft Content */}
      <div className="lg:col-span-3 space-y-6">
        {/* Draft Header */}
        <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Draft Board</h2>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>Round {draftStatus?.currentRound || 1} of {draftStatus?.totalRounds || 5}</span>
              <span>Pick {draft.currentPick} of {teams.length * 5}</span>
              <span>{draftStatus?.picksRemaining || 0} picks remaining</span>
            </div>
          </div>

          {/* Draft Timer */}
          {draft.status === 'in_progress' && (
            <DraftTimer
              timeLimit={draft.settings.pickTimeLimit}
              isActive={true}
              currentTurnId={draftService.getCurrentTeamId(draft) || undefined}
              onTimeExpired={() => {
                // TODO: Implement auto-pick or skip logic
                console.log('Time expired for pick');
              }}
            />
          )}
        </div>

        {/* Current Turn Indicator */}
        {draft.status === 'in_progress' && (
          <div className={`mt-4 p-4 rounded-lg ${
            isUserTurn ? 'bg-blue-50 border-2 border-blue-300' : 'bg-gray-50'
          }`}>
            <div className="flex items-center">
              {isUserTurn ? (
                <>
                  <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-blue-800 font-semibold text-lg">It&apos;s your turn to pick!</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-700">
                    Waiting for <strong>{getCurrentTeamName()}</strong> to pick...
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Draft Controls - Commissioner Only */}
        {isCommissioner && draft.status === 'not_started' && (
          <div className="mt-4 flex space-x-3">
            <button
              onClick={handleStartDraft}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              Start Draft
            </button>
            <button
              onClick={handleRestartDraft}
              className="px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              Restart Draft
            </button>
          </div>
        )}

        {isCommissioner && (draft.status === 'in_progress' || draft.status === 'completed') && (
          <div className="mt-4">
            <button
              onClick={handleRestartDraft}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              Restart Draft
            </button>
          </div>
        )}

        {/* Non-Commissioner Message */}
        {!isCommissioner && draft.status === 'not_started' && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-blue-800 font-medium">Waiting for commissioner to start the draft</span>
            </div>
          </div>
        )}

        {draft.status === 'completed' && (
          <div className="mt-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-green-800 font-semibold text-lg">Draft Complete!</span>
            </div>
          </div>
        )}
      </div>

      {/* Debug Information */}
      {draft.status === 'in_progress' && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-yellow-800 mb-2">🔍 Draft Debug Info</h4>
          <div className="text-sm text-yellow-700 space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div><strong>Current User ID:</strong> <code className="bg-yellow-100 px-1 rounded">{currentUserId}</code></div>
                <div><strong>Current Pick:</strong> {draft.currentPick}</div>
                <div><strong>Draft Status:</strong> {draft.status}</div>
              </div>
              <div>
                <div><strong>Current Team Turn:</strong> <code className="bg-yellow-100 px-1 rounded">{draftService.getCurrentTeamId(draft)}</code></div>
                <div><strong>Your Team ID:</strong> <code className="bg-yellow-100 px-1 rounded">{getCurrentUserTeam()?.id || 'None'}</code></div>
                <div><strong>Can Make Pick:</strong> <span className={canMakePick() ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{canMakePick() ? 'YES' : 'NO'}</span></div>
              </div>
            </div>
            
            <div><strong>Draft Order:</strong> <code className="bg-yellow-100 px-1 rounded">[{draft.draftOrder.join(', ')}]</code></div>
            
            <div><strong>All Teams:</strong></div>
            <div className="bg-yellow-100 p-2 rounded text-xs">
              {teams.map(team => (
                <div key={team.id} className={`p-1 ${team.ownerId === currentUserId ? 'bg-green-200 font-bold' : ''}`}>
                  <strong>{team.name}</strong> | ID: <code>{team.id}</code> | Owner: <code>{team.ownerId}</code>
                  {team.ownerId === currentUserId && ' ← YOUR TEAM'}
                  {team.id === draftService.getCurrentTeamId(draft) && ' ← CURRENT TURN'}
                </div>
              ))}
            </div>
            
            <button
              onClick={() => {
                console.log('Full Debug Info:', {
                  currentUserId,
                  draft,
                  teams,
                  getCurrentTeamId: draftService.getCurrentTeamId(draft),
                  getCurrentUserTeam: getCurrentUserTeam()
                });
              }}
              className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700"
            >
              Log Full Debug to Console
            </button>
          </div>
        </div>
      )}

      {/* How to Pick Instructions */}
      {draft.status === 'in_progress' && (
        <div className={`rounded-lg p-6 border-2 ${
          isUserTurn 
            ? 'bg-green-50 border-green-300' 
            : 'bg-blue-50 border-blue-300'
        }`}>
          <div className="flex items-start space-x-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
              isUserTurn ? 'bg-green-600' : 'bg-blue-600'
            }`}>
              {isUserTurn ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-bold mb-2 ${
                isUserTurn ? 'text-green-800' : 'text-blue-800'
              }`}>
                {isUserTurn ? '🎯 Your Turn to Pick!' : '⏳ Waiting for Your Turn'}
              </h3>
              <p className={`text-sm mb-3 ${
                isUserTurn ? 'text-green-700' : 'text-blue-700'
              }`}>
                {isUserTurn 
                  ? 'Look for contestants with green borders and "CLICK TO DRAFT" labels. Click on any available contestant to draft them to your team.'
                  : `It's currently ${getCurrentTeamName()}'s turn to pick. Available contestants will be highlighted when it's your turn.`
                }
              </p>
              {isUserTurn && (
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-400 border-2 border-green-600 border-dashed rounded"></div>
                    <span className="text-green-700">Available to draft</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-400 rounded"></div>
                    <span className="text-gray-600">Already drafted</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contestants Grid */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Available Contestants ({contestants.length})
          </h3>
          <button
            onClick={loadDraftData}
            disabled={loading}
            className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <svg className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        
        {/* Debug Tools */}
        <div className="mb-4 p-4 bg-yellow-100 border border-yellow-300 rounded">
          <h4 className="font-bold text-yellow-800 mb-2">🔧 Debug Tools</h4>
          <div className="flex space-x-2">
            <button
              onClick={loadDraftData}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Refresh Draft Data
            </button>
            <button
              onClick={async () => {
                try {
                  const response = await draftService['client'].models.Draft.list({
                    filter: { leagueId: { eq: leagueId } }
                  });
                  console.log('All drafts for this league:', response.data);
                  alert(`Found ${response.data?.length || 0} drafts. Check console for details.`);
                } catch (err) {
                  console.error('Error listing drafts:', err);
                }
              }}
              className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
            >
              List All Drafts
            </button>
            {contestants.length > 0 && (
              <button
                onClick={() => handleContestantSelect(contestants[0])}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                Test Draft {contestants[0]?.name}
              </button>
            )}
          </div>
          <p className="text-xs text-yellow-700 mt-1">
            Current Draft ID: <code className="bg-yellow-200 px-1 rounded">{draft?.id}</code>
          </p>
        </div>

        {contestants.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-600">No contestants available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {contestants.map((contestant) => {
              const isDrafted = draftedContestants.has(contestant.id);
              const draftedByTeam = draftedContestants.get(contestant.id);
              
              const isSelectable = canMakePick() && !makingPick;
              
              return (
                <DraftContestantCard
                  key={contestant.id}
                  contestant={contestant}
                  onSelect={handleContestantSelect}
                  isSelectable={isSelectable}
                  isDrafted={isDrafted}
                  draftedByTeam={draftedByTeam}
                />
              );
            })}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}