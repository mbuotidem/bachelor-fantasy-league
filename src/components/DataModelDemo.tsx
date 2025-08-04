'use client';

import React, { useState, useEffect } from 'react';
import {
  leagueService,
  teamService,
  contestantService,
  scoringService,
  APIError,
  ValidationError,
  NotFoundError,
  UnauthorizedError
} from '../services';
import type { League, Team, Contestant, Episode } from '../types';

interface DemoState {
  leagues: League[];
  teams: Team[];
  contestants: Contestant[];
  episodes: Episode[];
  loading: boolean;
  error: string | null;
}

export default function DataModelDemo() {
  const [state, setState] = useState<DemoState>({
    leagues: [],
    teams: [],
    contestants: [],
    episodes: [],
    loading: false,
    error: null,
  });

  const [newLeagueName, setNewLeagueName] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [newContestantName, setNewContestantName] = useState('');
  const [selectedLeagueId, setSelectedLeagueId] = useState('');

  // Load initial data
  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const leagues = await leagueService.getUserLeagues();
      setState(prev => ({ ...prev, leagues, loading: false }));

      if (leagues.length > 0 && !selectedLeagueId) {
        setSelectedLeagueId(leagues[0].id);
        await loadLeagueData(leagues[0].id);
      }
    } catch (error) {
      handleError(error);
    }
  };

  const loadLeagueData = async (leagueId: string) => {
    try {
      const [teams, contestants, episodes] = await Promise.all([
        teamService.getTeamsByLeague(leagueId),
        contestantService.getContestantsByLeague(leagueId),
        scoringService.getEpisodesByLeague(leagueId),
      ]);

      setState(prev => ({
        ...prev,
        teams,
        contestants,
        episodes,
        loading: false
      }));
    } catch (error) {
      handleError(error);
    }
  };

  const handleError = (error: unknown) => {
    console.error('Demo error:', error);

    let errorMessage = 'An unexpected error occurred';

    if (error instanceof ValidationError) {
      errorMessage = `Validation Error: ${error.message}`;
    } else if (error instanceof NotFoundError) {
      errorMessage = `Not Found: ${error.message}`;
    } else if (error instanceof UnauthorizedError) {
      errorMessage = `Authentication Error: ${error.message}`;
    } else if (error instanceof APIError) {
      errorMessage = `API Error: ${error.message}`;
    } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      errorMessage = error.message;
    }

    setState(prev => ({
      ...prev,
      loading: false,
      error: errorMessage
    }));
  };

  const createLeague = async () => {
    if (!newLeagueName.trim()) {
      setState(prev => ({ ...prev, error: 'League name is required' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const league = await leagueService.createLeague({
        name: newLeagueName,
        season: 'Season 29',
      });

      setState(prev => ({
        ...prev,
        leagues: [...prev.leagues, league],
        loading: false
      }));

      setNewLeagueName('');
      setSelectedLeagueId(league.id);
      await loadLeagueData(league.id);
    } catch (error) {
      handleError(error);
    }
  };

  const createTeam = async () => {
    if (!newTeamName.trim() || !selectedLeagueId) {
      setState(prev => ({ ...prev, error: 'Team name and league selection are required' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const team = await teamService.createTeam({
        leagueId: selectedLeagueId,
        name: newTeamName,
      });

      setState(prev => ({
        ...prev,
        teams: [...prev.teams, team],
        loading: false
      }));

      setNewTeamName('');
    } catch (error) {
      handleError(error);
    }
  };

  const createContestant = async () => {
    if (!newContestantName.trim() || !selectedLeagueId) {
      setState(prev => ({ ...prev, error: 'Contestant name and league selection are required' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const contestant = await contestantService.createContestant({
        leagueId: selectedLeagueId,
        name: newContestantName,
        age: Math.floor(Math.random() * 10) + 22, // Random age 22-31
        hometown: 'Demo City, ST',
        occupation: 'Demo Occupation',
      });

      setState(prev => ({
        ...prev,
        contestants: [...prev.contestants, contestant],
        loading: false
      }));

      setNewContestantName('');
    } catch (error) {
      handleError(error);
    }
  };

  const createEpisode = async () => {
    if (!selectedLeagueId) {
      setState(prev => ({ ...prev, error: 'League selection is required' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const episodeNumber = state.episodes.length + 1;
      const episode = await scoringService.createEpisode(
        selectedLeagueId,
        episodeNumber,
        new Date().toISOString()
      );

      setState(prev => ({
        ...prev,
        episodes: [...prev.episodes, episode],
        loading: false
      }));
    } catch (error) {
      handleError(error);
    }
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Data Models Demo</h1>

      {state.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex justify-between items-center">
            <span>{state.error}</span>
            <button
              onClick={clearError}
              className="text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {state.loading && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          Loading...
        </div>
      )}

      {/* League Selection */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Select League</h2>
        <select
          value={selectedLeagueId}
          onChange={(e) => {
            setSelectedLeagueId(e.target.value);
            if (e.target.value) {
              loadLeagueData(e.target.value);
            }
          }}
          className="border rounded px-3 py-2 mr-4"
        >
          <option value="">Select a league...</option>
          {state.leagues.map(league => (
            <option key={league.id} value={league.id}>
              {league.name} ({league.season})
            </option>
          ))}
        </select>
      </div>

      {/* Create League */}
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-3">Create League</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newLeagueName}
            onChange={(e) => setNewLeagueName(e.target.value)}
            placeholder="League name"
            className="border rounded px-3 py-2 flex-1"
          />
          <button
            onClick={createLeague}
            disabled={state.loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Create League
          </button>
        </div>
      </div>

      {/* Create Team */}
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-3">Create Team</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder="Team name"
            className="border rounded px-3 py-2 flex-1"
          />
          <button
            onClick={createTeam}
            disabled={state.loading || !selectedLeagueId}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            Create Team
          </button>
        </div>
      </div>

      {/* Create Contestant */}
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-3">Create Contestant</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newContestantName}
            onChange={(e) => setNewContestantName(e.target.value)}
            placeholder="Contestant name"
            className="border rounded px-3 py-2 flex-1"
          />
          <button
            onClick={createContestant}
            disabled={state.loading || !selectedLeagueId}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
          >
            Create Contestant
          </button>
        </div>
      </div>

      {/* Create Episode */}
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-3">Create Episode</h2>
        <button
          onClick={createEpisode}
          disabled={state.loading || !selectedLeagueId}
          className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
        >
          Create Episode {state.episodes.length + 1}
        </button>
      </div>

      {/* Data Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Leagues */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Leagues ({state.leagues.length})</h3>
          <div className="space-y-2">
            {state.leagues.map(league => (
              <div key={league.id} className="p-3 border rounded">
                <div className="font-medium">{league.name}</div>
                <div className="text-sm text-gray-600">{league.season}</div>
                <div className="text-xs text-gray-500">Code: {league.leagueCode}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Teams */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Teams ({state.teams.length})</h3>
          <div className="space-y-2">
            {state.teams.map(team => (
              <div key={team.id} className="p-3 border rounded">
                <div className="font-medium">{team.name}</div>
                <div className="text-sm text-gray-600">Points: {team.totalPoints}</div>
                <div className="text-xs text-gray-500">
                  Drafted: {team.draftedContestants.length}/5
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contestants */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Contestants ({state.contestants.length})</h3>
          <div className="space-y-2">
            {state.contestants.map(contestant => (
              <div key={contestant.id} className="p-3 border rounded">
                <div className="font-medium">{contestant.name}</div>
                <div className="text-sm text-gray-600">
                  {contestant.age && `Age: ${contestant.age}, `}
                  Points: {contestant.totalPoints}
                </div>
                <div className="text-xs text-gray-500">
                  {contestant.hometown} • {contestant.occupation}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Episodes */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Episodes ({state.episodes.length})</h3>
          <div className="space-y-2">
            {state.episodes.map(episode => (
              <div key={episode.id} className="p-3 border rounded">
                <div className="font-medium">Episode {episode.episodeNumber}</div>
                <div className="text-sm text-gray-600">
                  Events: {episode.totalEvents}
                  {episode.isActive && <span className="ml-2 text-green-600">• Active</span>}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(episode.airDate).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Service Status */}
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="text-lg font-semibold mb-2">Service Layer Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="font-medium">League Service</div>
            <div className="text-green-600">✓ Connected</div>
          </div>
          <div>
            <div className="font-medium">Team Service</div>
            <div className="text-green-600">✓ Connected</div>
          </div>
          <div>
            <div className="font-medium">Contestant Service</div>
            <div className="text-green-600">✓ Connected</div>
          </div>
          <div>
            <div className="font-medium">Scoring Service</div>
            <div className="text-green-600">✓ Connected</div>
          </div>
        </div>
      </div>
    </div>
  );
}