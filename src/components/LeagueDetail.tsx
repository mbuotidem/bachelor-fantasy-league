'use client';

import React, { useState, useEffect } from 'react';
import ContestantManager from './ContestantManager';
import DraftBoard from './DraftBoard';
import TeamManager from './TeamManager';
import { draftService, teamService } from '../services';
import type { League, Draft, Team } from '../types';

interface LeagueDetailProps {
  league: League;
  isCommissioner: boolean;
  onBack: () => void;
}

type TabType = 'contestants' | 'draft' | 'teams' | 'standings' | 'settings';

export default function LeagueDetail({ league, isCommissioner, onBack }: LeagueDetailProps) {
  const [activeTab, setActiveTab] = useState<TabType>('contestants');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    loadDraftData();
    loadCurrentUser();
    loadTeams();
  }, [league.id]);

  // Poll for draft updates when draft is active
  useEffect(() => {
    if (!draft || draft.status !== 'in_progress') return;

    const interval = setInterval(() => {
      loadDraftData();
      loadTeams();
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [draft?.status]);

  const loadDraftData = async () => {
    try {
      const draftData = await draftService.getDraftByLeague(league.id);
      setDraft(draftData);
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  };

  const loadCurrentUser = async () => {
    try {
      const { getCurrentUserDetails } = await import('../lib/auth-utils');
      const currentUser = await getCurrentUserDetails();
      setCurrentUserId(currentUser.userId);
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadTeams = async () => {
    try {
      const teamsData = await teamService.getTeamsByLeague(league.id);
      setTeams(teamsData);
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  };

  const isUserTurn = (): boolean => {
    if (!draft || !currentUserId || draft.status !== 'in_progress') {
      return false;
    }

    const currentTeamId = draftService.getCurrentTeamId(draft);
    const userTeam = teams.find(team => team.ownerId === currentUserId);
    
    return userTeam?.id === currentTeamId;
  };

  const handleCreateDraft = async () => {
    if (!isCommissioner) return;
    
    try {
      const newDraft = await draftService.createDraft({ leagueId: league.id });
      setDraft(newDraft);
      setActiveTab('draft');
    } catch (error) {
      console.error('Error creating draft:', error);
      alert('Failed to create draft. Please try again.');
    }
  };

  const handleDraftComplete = (completedDraft: Draft) => {
    setDraft(completedDraft);
    // Could show a success message or redirect
    alert('Draft completed successfully!');
  };

  const tabs = [
    { id: 'contestants' as TabType, name: 'Contestants', icon: '👥' },
    { id: 'draft' as TabType, name: 'Draft', icon: '🎯' },
    { id: 'teams' as TabType, name: 'Teams', icon: '🏆' },
    { id: 'standings' as TabType, name: 'Standings', icon: '📊' },
    ...(isCommissioner ? [{ id: 'settings' as TabType, name: 'Settings', icon: '⚙️' }] : []),
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Leagues
          </button>
          {isCommissioner && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Commissioner
            </span>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{league.name}</h1>
            <p className="text-gray-600 mt-1">{league.season}</p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span>League Code: <span className="font-mono font-medium">{league.leagueCode}</span></span>
              <span>•</span>
              <span>Max {league.settings.maxTeams} teams</span>
              <span>•</span>
              <span className="capitalize">{league.settings.draftFormat} draft</span>
            </div>
          </div>
          
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              league.status === 'created' ? 'bg-blue-100 text-blue-800' :
              league.status === 'draft_in_progress' ? 'bg-yellow-100 text-yellow-800' :
              league.status === 'active' ? 'bg-green-100 text-green-800' :
              league.status === 'completed' ? 'bg-gray-100 text-gray-800' :
              'bg-gray-100 text-gray-600'
            }`}>
              {league.status === 'created' ? 'Ready to Start' :
               league.status === 'draft_in_progress' ? 'Draft in Progress' :
               league.status === 'active' ? 'Season Active' :
               league.status === 'completed' ? 'Season Complete' :
               'Archived'}
            </span>
            
            {/* Draft Action Button */}
            {isCommissioner && league.status === 'created' && !draft && (
              <button
                onClick={handleCreateDraft}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
              >
                Create Draft
              </button>
            )}
            
            {draft && draft.status === 'not_started' && (
              <button
                onClick={() => setActiveTab('draft')}
                className="inline-flex items-center px-3 py-1 border border-rose-300 text-sm font-medium rounded-md text-rose-700 bg-rose-50 hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
              >
                Go to Draft
              </button>
            )}
            
            {draft && draft.status === 'in_progress' && (
              <button
                onClick={() => setActiveTab('draft')}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 animate-pulse"
              >
                Draft Live!
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Global Draft Turn Banner */}
      {isUserTurn() && (
        <div className="mb-6 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg p-4 shadow-lg animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 rounded-full p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold">🎯 It's Your Turn to Pick!</h3>
                <p className="text-green-100">Go to the Draft tab to make your selection</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('draft')}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Go to Draft →
            </button>
          </div>
        </div>
      )}

      {/* Draft Status Banner for Non-Turn */}
      {draft && draft.status === 'in_progress' && !isUserTurn() && (
        <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium">Draft in Progress</p>
              <p className="text-sm text-blue-600">Waiting for other teams to pick...</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-rose-500 text-rose-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'contestants' && (
          <ContestantManager 
            leagueId={league.id} 
            isCommissioner={isCommissioner}
          />
        )}
        
        {activeTab === 'draft' && (
          <div>
            {!draft ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Draft Not Created</h3>
                <p className="text-gray-600 mb-6">
                  {isCommissioner 
                    ? 'Create a draft to start the contestant selection process.'
                    : 'The commissioner needs to create a draft first.'
                  }
                </p>
                {isCommissioner && (
                  <button
                    onClick={handleCreateDraft}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Draft
                  </button>
                )}
              </div>
            ) : (
              <DraftBoard
                leagueId={league.id}
                currentUserId={currentUserId}
                isCommissioner={isCommissioner}
                onDraftComplete={handleDraftComplete}
              />
            )}
          </div>
        )}
        
        {activeTab === 'teams' && (
          <TeamManager 
            leagueId={league.id} 
            isCommissioner={isCommissioner}
          />
        )}
        
        {activeTab === 'standings' && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">League Standings</h3>
            <p className="text-gray-600">Standings and leaderboards will be implemented in Task 10.</p>
          </div>
        )}
        
        {activeTab === 'settings' && isCommissioner && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚙️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">League Settings</h3>
            <p className="text-gray-600">League settings management will be implemented in Task 13.</p>
          </div>
        )}
      </div>
    </div>
  );
}