'use client';

import React, { useState, useEffect } from 'react';
import { LeagueService } from '../services/league-service';
import { validateCreateTeamInput } from '../lib/validation';
import type { League, ValidationError } from '../types';

interface LeagueJoinProps {
  initialLeagueCode?: string;
  onJoinSuccess?: (league: League, teamId: string) => void;
  onCancel?: () => void;
}

export default function LeagueJoin({ initialLeagueCode = '', onJoinSuccess, onCancel }: LeagueJoinProps) {
  const [leagueCode, setLeagueCode] = useState(initialLeagueCode);
  const [teamName, setTeamName] = useState('');
  const [league, setLeague] = useState<League | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isLoadingLeague, setIsLoadingLeague] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [leagueError, setLeagueError] = useState<string | null>(null);

  const leagueService = new LeagueService();

  // Load league when code changes
  useEffect(() => {
    if (leagueCode.length === 6) {
      loadLeague(leagueCode);
    } else {
      setLeague(null);
      setLeagueError(null);
    }
  }, [leagueCode]);

  const loadLeague = async (code: string) => {
    setIsLoadingLeague(true);
    setLeagueError(null);

    try {
      const foundLeague = await leagueService.getLeagueByCode(code);
      setLeague(foundLeague);
    } catch (error) {
      console.error('Failed to load league:', error);
      setLeagueError(error instanceof Error ? error.message : 'League not found');
      setLeague(null);
    } finally {
      setIsLoadingLeague(false);
    }
  };

  const handleLeagueCodeChange = (value: string) => {
    // Convert to uppercase and limit to 6 characters
    const formattedCode = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setLeagueCode(formattedCode);
    setLeagueError(null);
  };

  const handleTeamNameChange = (value: string) => {
    setTeamName(value);
    // Clear team name errors when user starts typing
    setErrors(prev => prev.filter(error => error.field !== 'name'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!league) {
      setLeagueError('Please enter a valid league code');
      return;
    }

    setIsJoining(true);
    setSubmitError(null);

    // Validate team name
    const validation = validateCreateTeamInput({
      name: teamName,
      leagueId: league.id,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      setIsJoining(false);
      return;
    }

    try {
      const result = await leagueService.joinLeague({
        leagueCode: league.leagueCode,
        teamName,
      });
      
      onJoinSuccess?.(result.league, result.teamId);
    } catch (error) {
      console.error('Failed to join league:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to join league');
    } finally {
      setIsJoining(false);
    }
  };

  const getFieldError = (fieldName: string) => {
    return errors.find(error => error.field === fieldName)?.message;
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-6">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-rose-100 mb-4">
          <svg className="h-6 w-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Join a League</h2>
        <p className="text-gray-600 text-sm">
          Enter your league code and create your team name to get started!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* League Code */}
        <div>
          <label htmlFor="leagueCode" className="block text-sm font-medium text-gray-700 mb-2">
            League Code *
          </label>
          <input
            type="text"
            id="leagueCode"
            value={leagueCode}
            onChange={(e) => handleLeagueCodeChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 font-mono text-lg text-center tracking-wider ${
              leagueError ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="ABC123"
            maxLength={6}
          />
          {leagueError && (
            <p className="mt-1 text-sm text-red-600">{leagueError}</p>
          )}
          {isLoadingLeague && (
            <p className="mt-1 text-sm text-gray-500">Loading league...</p>
          )}
        </div>

        {/* League Info */}
        {league && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">League Found!</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p className="font-medium">{league.name}</p>
                  <p>{league.season}</p>
                  <p className="text-xs mt-1">
                    Max {league.settings.maxTeams} teams • {league.settings.draftFormat} draft
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team Name */}
        {league && (
          <div>
            <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-2">
              Your Team Name *
            </label>
            <input
              type="text"
              id="teamName"
              value={teamName}
              onChange={(e) => handleTeamNameChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 ${
                getFieldError('name') ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Rose Hunters, Final Rose Squad"
              maxLength={50}
            />
            {getFieldError('name') && (
              <p className="mt-1 text-sm text-red-600">{getFieldError('name')}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Choose a fun name for your fantasy team!
            </p>
          </div>
        )}

        {/* Submit Error */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error joining league</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{submitError}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!league || isJoining || isLoadingLeague}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isJoining ? 'Joining League...' : 'Join League'}
          </button>
        </div>
      </form>

      {/* Help Text */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Don&apos;t have a league code? Ask your league commissioner to share the invite link or code with you.
        </p>
      </div>
    </div>
  );
}