'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import ContestantManager from './ContestantManager';
import DraftBoard from './DraftBoard';
import TeamManager from './TeamManager';
import EpisodeScorer from './EpisodeScorer';
import EpisodeManager from './EpisodeManager';
import StandingsDashboard from './StandingsDashboard';
import CommissionerTeamCreator from './CommissionerTeamCreator';
import { draftService, teamService } from '../services';
import type { League, Draft, Team } from '../types';
import { useDataRefresh } from '../contexts/DataRefreshContext';

interface LeagueDetailProps {
  league: League;
  isCommissioner: boolean;
  initialTab?: TabType;
  onBack: () => void;
}

type TabType = 'contestants' | 'draft' | 'teams' | 'episodes' | 'scoring' | 'standings' | 'settings';

export default function LeagueDetail({ league, isCommissioner, initialTab = 'contestants', onBack }: LeagueDetailProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [showTeamCreator, setShowTeamCreator] = useState(false);
  const { registerDraftDataRefresh, unregisterDraftDataRefresh } = useDataRefresh();

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
    }, 30000); // Check every 30 seconds as backup (real-time updates handle most cases)

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

  // Register this component's refresh function with the global context
  useEffect(() => {
    registerDraftDataRefresh(loadDraftData);
    return () => {
      unregisterDraftDataRefresh(loadDraftData);
    };
  }, [registerDraftDataRefresh, unregisterDraftDataRefresh]);

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

  const commissionerHasTeam = (): boolean => {
    if (!isCommissioner || !currentUserId) return false;
    return teams.some(team => team.ownerId === currentUserId);
  };

  const handleTeamCreated = (team: Team) => {
    setTeams(prev => [...prev, team]);
    setShowTeamCreator(false);
  };

  const handleCreateDraft = async () => {
    if (!isCommissioner) return;
    
    try {
      const newDraft = await draftService.createDraft({ leagueId: league.id });
      setDraft(newDraft);
      handleTabChange('draft');
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

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    // Update URL with new tab
    const params = new URLSearchParams(searchParams);
    params.set('tab', tab);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const tabs = [
    { id: 'contestants' as TabType, name: 'Contestants', icon: '👥' },
    { id: 'draft' as TabType, name: 'Draft', icon: '🎯' },
    { id: 'teams' as TabType, name: 'Teams', icon: '🏆' },
    { id: 'episodes' as TabType, name: 'Episodes', icon: '📺' },
    { id: 'scoring' as TabType, name: 'Episode Scoring', icon: '📱' },
    { id: 'standings' as TabType, name: 'Standings', icon: '📊' },
    ...(isCommissioner ? [{ id: 'settings' as TabType, name: 'Settings', icon: '⚙️' }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex items-center space-x-3 mb-3">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">Back</span>
            </button>
            {isCommissioner && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Commissioner
              </span>
            )}
          </div>
          
          {/* League Info - Mobile Optimized */}
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{league.name}</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">{league.season}</p>
            
            {/* League Details - Mobile Stacked */}
            <div className="mt-3 space-y-1 sm:space-y-0">
              <div className="text-xs sm:text-sm text-gray-500">
                <span className="font-mono font-medium bg-gray-100 px-2 py-1 rounded">#{league.leagueCode}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs sm:text-sm text-gray-500 space-y-1 sm:space-y-0">
                <span>👥 Max {league.settings.maxTeams} teams</span>
                <span className="hidden sm:inline">•</span>
                <span>🎯 {league.settings.draftFormat} draft</span>
              </div>
            </div>
          </div>
          
          {/* Status and Actions - Mobile Optimized */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
            <span className={`inline-flex items-center justify-center px-3 py-2 rounded-full text-xs sm:text-sm font-medium ${
              league.status === 'created' ? 'bg-blue-100 text-blue-800' :
              league.status === 'draft_in_progress' ? 'bg-yellow-100 text-yellow-800' :
              league.status === 'active' ? 'bg-green-100 text-green-800' :
              league.status === 'completed' ? 'bg-gray-100 text-gray-800' :
              'bg-gray-100 text-gray-600'
            }`}>
              {league.status === 'created' ? '🔵 Ready to Start' :
               league.status === 'draft_in_progress' ? '🟡 Draft in Progress' :
               league.status === 'active' ? '🟢 Season Active' :
               league.status === 'completed' ? '⚫ Season Complete' :
               '⚪ Archived'}
            </span>
            
            {/* Action Buttons */}
            {isCommissioner && !commissionerHasTeam() && (
              <button
                onClick={() => setShowTeamCreator(true)}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                ➕ Create My Team
              </button>
            )}
            
            {isCommissioner && league.status === 'created' && !draft && (
              <button
                onClick={handleCreateDraft}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
              >
                Create Draft
              </button>
            )}
            
            {/* Episode Scoring Button - Available when league is active */}
            {league.status === 'active' && (
              <button
                onClick={() => handleTabChange('scoring')}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                📱 Score Episode
              </button>
            )}
            
            {draft && draft.status === 'not_started' && (
              <button
                onClick={() => handleTabChange('draft')}
                className="inline-flex items-center px-3 py-1 border border-rose-300 text-sm font-medium rounded-md text-rose-700 bg-rose-50 hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
              >
                Go to Draft
              </button>
            )}
            
            {draft && draft.status === 'in_progress' && (
              <button
                onClick={() => handleTabChange('draft')}
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
              <div className="bg-yellow-400 rounded-full p-2">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold">🎯 It&apos;s Your Turn to Pick!</h3>
                <p className="text-green-100">Go to the Draft tab to make your selection</p>
              </div>
            </div>
            <button
              onClick={() => handleTabChange('draft')}
              className="bg-yellow-400 hover:bg-yellow-300 text-green-700 px-4 py-2 rounded-lg font-semibold transition-colors shadow-md"
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

      {/* Mobile-Optimized Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4">
          {/* Mobile: Horizontal scrollable tabs */}
          <div className="flex overflow-x-auto scrollbar-hide -mb-px">
            <div className="flex space-x-1 sm:space-x-4 min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex-shrink-0 py-3 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-rose-500 text-rose-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-1 sm:mr-2 text-sm sm:text-base">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.name}</span>
                  <span className="sm:hidden">
                    {tab.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 py-4 sm:py-6 min-h-96">
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
          <div>
            {isCommissioner && !commissionerHasTeam() && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Create Your Team
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        As the commissioner, you can create your own team to participate in the league.
                      </p>
                    </div>
                    <div className="mt-4">
                      <button
                        onClick={() => setShowTeamCreator(true)}
                        className="bg-blue-100 px-3 py-1 rounded-md text-sm font-medium text-blue-800 hover:bg-blue-200"
                      >
                        Create My Team
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <TeamManager 
              leagueId={league.id} 
              isCommissioner={isCommissioner}
            />
          </div>
        )}
        
        {activeTab === 'episodes' && (
          <EpisodeManager 
            leagueId={league.id} 
            isCommissioner={isCommissioner}
          />
        )}
        
        {activeTab === 'scoring' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">📱 Episode Scoring</h2>
                  <p className="text-gray-600 mt-1">Score contestants during live episodes</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleTabChange('episodes')}
                    className="text-sm px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                  >
                    📺 Manage Episodes
                  </button>
                  <div className="text-sm text-gray-500">
                    Mobile-optimized for live viewing
                  </div>
                </div>
              </div>
            </div>
            <div className="p-0">
              <EpisodeScorer 
                leagueId={league.id}
                onScoreUpdate={(event) => {
                  console.log('Score updated:', event);
                  // Could add real-time notifications here
                }}
                onError={(error) => {
                  console.error('Scoring error:', error);
                  // Could show toast notifications here
                }}
              />
            </div>
          </div>
        )}
        
        {activeTab === 'standings' && (
          <StandingsDashboard leagueId={league.id} />
        )}
        
        {activeTab === 'settings' && isCommissioner && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚙️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">League Settings</h3>
            <p className="text-gray-600">League settings management will be implemented in Task 13.</p>
          </div>
        )}
      </div>
      
      {/* Commissioner Team Creation Modal */}
      {showTeamCreator && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <CommissionerTeamCreator
              leagueId={league.id}
              onTeamCreated={handleTeamCreated}
              onCancel={() => setShowTeamCreator(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}