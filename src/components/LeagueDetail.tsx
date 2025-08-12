'use client';

import React, { useState } from 'react';
import ContestantManager from './ContestantManager';
import type { League } from '../types';

interface LeagueDetailProps {
  league: League;
  isCommissioner: boolean;
  onBack: () => void;
}

type TabType = 'contestants' | 'teams' | 'standings' | 'settings';

export default function LeagueDetail({ league, isCommissioner, onBack }: LeagueDetailProps) {
  const [activeTab, setActiveTab] = useState<TabType>('contestants');

  const tabs = [
    { id: 'contestants' as TabType, name: 'Contestants', icon: '👥' },
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
          
          <div className="mt-4 sm:mt-0">
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
          </div>
        </div>
      </div>

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
        
        {activeTab === 'teams' && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Teams Management</h3>
            <p className="text-gray-600">Team management will be implemented in a future task.</p>
          </div>
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