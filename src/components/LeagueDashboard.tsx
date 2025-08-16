'use client';

import React, { useState, useEffect } from 'react';
import { LeagueService } from '../services/league-service';
import { TeamService } from '../services/team-service';
import LeagueCreator from './LeagueCreator';
import LeagueInvite from './LeagueInvite';
import LeagueJoin from './LeagueJoin';
import LeagueDetail from './LeagueDetail';
import type { League, Team } from '../types';

interface LeagueWithTeam extends League {
  userTeam?: Team;
  isCommissioner: boolean;
}

export default function LeagueDashboard() {
  const [leagues, setLeagues] = useState<LeagueWithTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<'create' | 'join' | 'invite' | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [viewingLeague, setViewingLeague] = useState<LeagueWithTeam | null>(null);

  const leagueService = new LeagueService();
  const teamService = new TeamService();

  useEffect(() => {
    loadUserLeagues();
  }, []);



  const loadUserLeagues = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get current user ID first
      const { getCurrentUserDetails } = await import('../lib/auth-utils');
      const currentUser = await getCurrentUserDetails();
      const currentUserId = currentUser.userId;

      // Get user's leagues
      const userLeagues = await leagueService.getUserLeagues();
      
      // Get user's teams for each league
      const leaguesWithTeams: LeagueWithTeam[] = await Promise.all(
        userLeagues.map(async (league) => {
          try {
            const userTeams = await teamService.getUserTeams();
            const userTeam = userTeams.find(team => team.leagueId === league.id);
            
            return {
              ...league,
              userTeam,
              isCommissioner: league.commissionerId === currentUserId,
            };
          } catch (error) {
            console.error(`Failed to load team for league ${league.id}:`, error);
            return {
              ...league,
              isCommissioner: league.commissionerId === currentUserId,
            };
          }
        })
      );

      setLeagues(leaguesWithTeams);
    } catch (error) {
      console.error('Failed to load leagues:', error);
      setError(error instanceof Error ? error.message : 'Failed to load leagues');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeagueCreated = () => {
    setActiveModal(null);
    loadUserLeagues(); // Refresh the list
  };

  const handleJoinSuccess = () => {
    setActiveModal(null);
    loadUserLeagues(); // Refresh the list
  };

  const handleInviteLeague = (league: League) => {
    setSelectedLeague(league);
    setActiveModal('invite');
  };

  const handleViewLeague = (league: LeagueWithTeam) => {
    // Navigate to the league page instead of using state
    window.location.href = `/league/${league.id}`;
  };

  const handleBackToLeagues = () => {
    setViewingLeague(null);
  };



  const getStatusBadge = (status: League['status'], isCommissioner: boolean) => {
    const statusConfig = {
      created: { 
        color: 'bg-blue-100 text-blue-800', 
        text: isCommissioner ? 'Ready to Start' : 'Waiting to Start'
      },
      draft_in_progress: { color: 'bg-yellow-100 text-yellow-800', text: 'Draft in Progress' },
      active: { color: 'bg-green-100 text-green-800', text: 'Season Active' },
      completed: { color: 'bg-gray-100 text-gray-800', text: 'Season Complete' },
      archived: { color: 'bg-gray-100 text-gray-600', text: 'Archived' },
    };

    const config = statusConfig[status] || statusConfig.created;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // If viewing a specific league, show the detail view
  if (viewingLeague) {
    return (
      <LeagueDetail
        league={viewingLeague}
        isCommissioner={viewingLeague.isCommissioner}
        onBack={handleBackToLeagues}
      />
    );
  }

  return (
    <div className="px-4 sm:px-6 max-w-4xl mx-auto">
      {/* Header - Mobile First */}
      <div className="mb-6">
        <div className="text-center sm:text-left mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Leagues</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage your Bachelor Fantasy Leagues</p>
        </div>
        
        {/* Mobile-first button layout */}
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={loadUserLeagues}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => setActiveModal('join')}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
          >
            🔗 Join League
          </button>
          <button
            onClick={() => setActiveModal('create')}
            className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
          >
            ➕ Create League
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading leagues</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={loadUserLeagues}
                  className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-md hover:bg-red-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State - Mobile Optimized */}
      {!error && leagues.length === 0 && (
        <div className="text-center py-8 sm:py-12 px-4">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">No leagues yet</h3>
          <p className="text-sm sm:text-base text-gray-500 mb-6">Get started by creating a new league or joining an existing one.</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-center max-w-sm mx-auto">
            <button
              onClick={() => setActiveModal('create')}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
            >
              ➕ Create League
            </button>
            <button
              onClick={() => setActiveModal('join')}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
            >
              🔗 Join League
            </button>
          </div>
        </div>
      )}

      {/* Leagues List - Mobile Optimized */}
      {leagues.length > 0 && (
        <div className="space-y-4">
          {leagues.map((league) => (
            <div key={league.id} className="bg-white rounded-lg shadow border border-gray-200 p-4 sm:p-6">
              <div className="space-y-4">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{league.name}</h3>
                      <div className="flex flex-wrap gap-2">
                        {getStatusBadge(league.status, league.isCommissioner)}
                        {league.isCommissioner && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Commissioner
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{league.season}</p>
                    
                    {/* League Info - Mobile Stacked */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs sm:text-sm text-gray-500">
                      <div className="flex items-center">
                        <span className="mr-1">👥</span>
                        Max {league.settings.maxTeams} teams
                      </div>
                      <div className="flex items-center">
                        <span className="mr-1">🎯</span>
                        {league.settings.draftFormat} draft
                      </div>
                      <div className="flex items-center font-mono">
                        <span className="mr-1">#</span>
                        {league.leagueCode}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons - Mobile Stacked */}
                  <div className="flex flex-col sm:flex-col space-y-2 sm:ml-4 min-w-0 sm:min-w-[120px]">
                    <button
                      onClick={() => handleViewLeague(league)}
                      className="w-full px-3 py-2 text-xs font-medium text-white bg-rose-600 border border-rose-600 rounded-md hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                    >
                      📱 View & Manage
                    </button>
                    <button
                      onClick={() => handleInviteLeague(league)}
                      className="w-full px-3 py-2 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-md hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                    >
                      🔗 Invite
                    </button>
                  </div>
                </div>

                {/* User Team Info */}
                {league.userTeam && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Your Team: {league.userTeam.name}</p>
                          <p className="text-xs text-gray-500">{league.userTeam.totalPoints} points</p>
                        </div>
                        <div className="text-xs text-gray-500">
                          {league.userTeam.draftedContestants.length}/5 contestants
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Draft Status Indicator */}
                  {league.status === 'draft_in_progress' && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-yellow-600 mr-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <p className="text-sm font-medium text-yellow-800">Draft is live!</p>
                      </div>
                      <p className="text-xs text-yellow-700 mt-1">Click &quot;View &amp; Manage&quot; to join the draft</p>
                    </div>
                  )}

                {league.status === 'created' && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="text-sm font-medium text-blue-800">
                        {league.isCommissioner ? 'Ready to create draft' : 'Waiting for draft'}
                      </p>
                    </div>
                    <p className="text-xs text-blue-700 mt-1">
                      {league.isCommissioner 
                        ? 'Go to league management to set up the draft'
                        : 'The commissioner will start the draft soon'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {activeModal === 'create' && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <LeagueCreator
              onLeagueCreated={handleLeagueCreated}
              onCancel={() => setActiveModal(null)}
            />
          </div>
        </div>
      )}

      {activeModal === 'join' && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <LeagueJoin
              onJoinSuccess={handleJoinSuccess}
              onCancel={() => setActiveModal(null)}
            />
          </div>
        </div>
      )}

      {activeModal === 'invite' && selectedLeague && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <LeagueInvite
              league={selectedLeague}
              onClose={() => {
                setActiveModal(null);
                setSelectedLeague(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}