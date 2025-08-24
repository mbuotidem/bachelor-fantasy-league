'use client';

import React, { useState } from 'react';
import TeamStandings from './TeamStandings';
import ContestantLeaderboard from './ContestantLeaderboard';
import TeamDetailView from './TeamDetailView';

interface StandingsDashboardProps {
  leagueId: string;
  className?: string;
}

type ViewMode = 'overview' | 'teams' | 'contestants' | 'team-detail';

export default function StandingsDashboard({ leagueId, className = '' }: StandingsDashboardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTeamClick = (teamId: string) => {
    setSelectedTeamId(teamId);
    setViewMode('team-detail');
  };

  const handleBackToOverview = () => {
    setSelectedTeamId(null);
    setViewMode('overview');
    setRefreshKey(prev => prev + 1);
  };

  const handleViewModeChange = (newViewMode: ViewMode) => {
    setViewMode(newViewMode);
    setRefreshKey(prev => prev + 1);
  };

  const renderNavigation = () => (
    <div className="flex flex-wrap gap-2 mb-6">
      <button
        onClick={() => handleViewModeChange('overview')}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          viewMode === 'overview'
            ? 'bg-blue-100 text-blue-700 border border-blue-200'
            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
        }`}
      >
        📊 Overview
      </button>
      <button
        onClick={() => handleViewModeChange('teams')}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          viewMode === 'teams'
            ? 'bg-blue-100 text-blue-700 border border-blue-200'
            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
        }`}
      >
        🏆 Teams
      </button>
      <button
        onClick={() => handleViewModeChange('contestants')}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          viewMode === 'contestants'
            ? 'bg-blue-100 text-blue-700 border border-blue-200'
            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
        }`}
      >
        🏅 Contestants
      </button>
    </div>
  );

  const renderOverview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <TeamStandings 
        key={`team-standings-${refreshKey}`}
        leagueId={leagueId} 
        onTeamClick={handleTeamClick}
        className="lg:col-span-1"
      />
      <ContestantLeaderboard 
        key={`contestant-leaderboard-${refreshKey}`}
        leagueId={leagueId}
        showEpisodePerformers={true}
        className="lg:col-span-1"
      />
    </div>
  );

  const renderTeamsView = () => (
    <TeamStandings 
      key={`team-standings-${refreshKey}`}
      leagueId={leagueId} 
      onTeamClick={handleTeamClick}
    />
  );

  const renderContestantsView = () => (
    <ContestantLeaderboard 
      key={`contestant-leaderboard-${refreshKey}`}
      leagueId={leagueId}
      showEpisodePerformers={true}
    />
  );

  const renderTeamDetail = () => {
    if (!selectedTeamId) return null;
    
    return (
      <TeamDetailView 
        teamId={selectedTeamId}
        onBack={handleBackToOverview}
      />
    );
  };

  return (
    <div className={className}>
      {viewMode !== 'team-detail' && renderNavigation()}
      
      {viewMode === 'overview' && renderOverview()}
      {viewMode === 'teams' && renderTeamsView()}
      {viewMode === 'contestants' && renderContestantsView()}
      {viewMode === 'team-detail' && renderTeamDetail()}
    </div>
  );
}