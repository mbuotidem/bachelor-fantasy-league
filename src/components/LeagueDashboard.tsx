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
    setViewingLeague(league);
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
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Leagues</h1>
          <p className="text-gray-600">Manage your Bachelor Fantasy Leagues</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={loadUserLeagues}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Refresh
          </button>
          <button
            onClick={() => setActiveModal('join')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
          >
            Join League
          </button>
          <button
            onClick={() => setActiveModal('create')}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
          >
            Create League
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

      {/* Empty State */}
      {!error && leagues.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No leagues yet</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new league or joining an existing one.</p>
          <div className="mt-6 flex justify-center space-x-3">
            <button
              onClick={() => setActiveModal('create')}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create League
            </button>
            <button
              onClick={() => setActiveModal('join')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Join League
            </button>
          </div>
        </div>
      )}

      {/* Leagues List */}
      {leagues.length > 0 && (
        <div className="space-y-4">
          {leagues.map((league) => (
            <div key={league.id} className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{league.name}</h3>
                    {getStatusBadge(league.status, league.isCommissioner)}
                    {league.isCommissioner && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Commissioner
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{league.season}</p>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Max {league.settings.maxTeams} teams
                    </div>
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      {league.settings.draftFormat} draft
                    </div>
                    <div className="flex items-center font-mono">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      {league.leagueCode}
                    </div>
                  </div>

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
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  <button
                    onClick={() => handleViewLeague(league)}
                    className="px-3 py-1 text-xs font-medium text-white bg-rose-600 border border-rose-600 rounded-md hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                  >
                    View & Manage
                  </button>
                  <button
                    onClick={() => handleInviteLeague(league)}
                    className="px-3 py-1 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-md hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                  >
                    Invite
                  </button>
                </div>
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