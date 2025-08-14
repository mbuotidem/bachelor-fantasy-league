'use client';

import React, { useState, useEffect } from 'react';
import { teamService } from '../services';
import type { Team } from '../types';

interface TeamManagerProps {
  leagueId: string;
  isCommissioner: boolean;
}

export default function TeamManager({ leagueId, isCommissioner }: TeamManagerProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadTeams();
  }, [leagueId]);

  const loadTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      const teamsData = await teamService.getTeamsByLeague(leagueId);
      setTeams(teamsData);
    } catch (err) {
      console.error('Error loading teams:', err);
      setError(err instanceof Error ? err.message : 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupTeams = async () => {
    if (!isCommissioner) {
      alert('Only commissioners can clean up teams');
      return;
    }

    // Group teams by owner
    const teamsByOwner = teams.reduce((acc, team) => {
      if (!acc[team.ownerId]) {
        acc[team.ownerId] = [];
      }
      acc[team.ownerId].push(team);
      return acc;
    }, {} as Record<string, Team[]>);

    // Find owners with multiple teams
    const ownersWithMultipleTeams = Object.entries(teamsByOwner).filter(([_, teams]) => teams.length > 1);
    
    if (ownersWithMultipleTeams.length === 0) {
      alert('No cleanup needed - each user has only one team.');
      return;
    }

    const teamsToDelete: Team[] = [];
    ownersWithMultipleTeams.forEach(([, ownerTeams]) => {
      // Keep the first team, delete the rest
      teamsToDelete.push(...ownerTeams.slice(1));
    });

    const confirmed = window.confirm(
      `This will delete ${teamsToDelete.length} duplicate teams:\n\n` +
      teamsToDelete.map(t => `• ${t.name} (${t.id})`).join('\n') +
      `\n\nThis will leave each user with only their first team. Continue?`
    );

    if (!confirmed) return;

    try {
      setDeleting('cleanup');
      
      for (const team of teamsToDelete) {
        console.log(`Deleting duplicate team: ${team.name} (${team.id})`);
        try {
          await teamService.deleteTeam(team.id);
        } catch (err) {
          console.error(`Failed to delete team ${team.name}:`, err);
        }
      }

      // Wait and refresh
      setTimeout(async () => {
        await loadTeams();
        alert(`Cleanup complete! Deleted ${teamsToDelete.length} duplicate teams.`);
      }, 2000);

    } catch (err) {
      console.error('Error during cleanup:', err);
      alert(`Cleanup failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!isCommissioner) {
      alert('Only commissioners can delete teams');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${teamName}"?\n\n` +
      `Team ID: ${teamId}\n\n` +
      `This action cannot be undone and will remove all drafted contestants.`
    );

    if (!confirmed) return;

    try {
      setDeleting(teamId);
      console.log(`Attempting to delete team: ${teamId} (${teamName})`);
      
      await teamService.deleteTeam(teamId);
      console.log(`Successfully deleted team: ${teamId}`);
      
      // Wait a moment before refreshing to ensure deletion is processed
      setTimeout(async () => {
        await loadTeams();
        alert(`Successfully deleted team "${teamName}"`);
      }, 1000);
      
    } catch (err) {
      console.error('Error deleting team:', err);
      
      // More detailed error message
      let errorMessage = 'Unknown error';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      alert(
        `Failed to delete team "${teamName}":\n\n` +
        `Error: ${errorMessage}\n\n` +
        `Team ID: ${teamId}\n\n` +
        `Please check the console for more details.`
      );
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
        <span className="ml-2 text-gray-600">Loading teams...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-800 font-medium">Error loading teams</span>
        </div>
        <p className="text-red-700 mt-1">{error}</p>
        <button
          onClick={loadTeams}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Teams ({teams.length})</h3>
          <p className="text-gray-600 text-sm">Manage teams in this league</p>
        </div>
        <button
          onClick={loadTeams}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {/* Teams List */}
      {teams.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Teams Found</h3>
          <p className="text-gray-600">No teams have been created for this league yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-4">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{team.name}</h4>
                        <div className="text-sm text-gray-500 space-y-1">
                          <div><strong>Team ID:</strong> <code className="bg-gray-100 px-1 rounded text-xs">{team.id}</code></div>
                          <div><strong>Owner ID:</strong> <code className="bg-gray-100 px-1 rounded text-xs">{team.ownerId}</code></div>
                          <div><strong>Drafted Contestants:</strong> {team.draftedContestants.length}/5</div>
                          <div><strong>Total Points:</strong> {team.totalPoints}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isCommissioner ? (
                      <button
                        onClick={() => handleDeleteTeam(team.id, team.name)}
                        disabled={deleting === team.id}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deleting === team.id ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Deleting...
                          </>
                        ) : (
                          'Delete Team'
                        )}
                      </button>
                    ) : (
                      <span className="text-sm text-gray-500">Commissioner only</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Warning for too many teams */}
      {teams.length > 2 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className="text-yellow-800 font-medium">Too Many Teams</h4>
                <p className="text-yellow-700 text-sm mt-1">
                  You have {teams.length} teams, but most drafts work best with 2-4 teams. 
                  Consider deleting extra teams before starting the draft.
                </p>
              </div>
            </div>
            
            {isCommissioner && (
              <button
                onClick={handleCleanupTeams}
                disabled={deleting !== null}
                className="ml-4 px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Clean Up Teams
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}