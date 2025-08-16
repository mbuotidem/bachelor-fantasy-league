'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LeagueService } from '../../../services/league-service';
import { TeamService } from '../../../services/team-service';
import LeagueDetail from '../../../components/LeagueDetail';
import type { League, Team } from '../../../types';

interface LeagueWithTeam extends League {
  userTeam?: Team;
  isCommissioner: boolean;
}

export default function LeaguePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const leagueId = params.leagueId as string;
  const tab = searchParams.get('tab') || 'contestants';

  const [league, setLeague] = useState<LeagueWithTeam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const leagueService = new LeagueService();
  const teamService = new TeamService();

  useEffect(() => {
    loadLeague();
  }, [leagueId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadLeague = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user ID
      const { getCurrentUserDetails } = await import('../../../lib/auth-utils');
      const currentUser = await getCurrentUserDetails();
      const currentUserId = currentUser.userId;

      // Get league details
      const leagueData = await leagueService.getLeague(leagueId);
      
      // Get user's team for this league
      const userTeams = await teamService.getUserTeams();
      const userTeam = userTeams.find(team => team.leagueId === leagueId);

      setLeague({
        ...leagueData,
        userTeam,
        isCommissioner: leagueData.commissionerId === currentUserId,
      });
    } catch (error) {
      console.error('Failed to load league:', error);
      setError('Failed to load league. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading league...</p>
        </div>
      </div>
    );
  }

  if (error || !league) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-6 max-w-md mx-auto">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">League Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The league you\'re looking for doesn\'t exist.'}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-rose-600 hover:bg-rose-700"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <LeagueDetail
      league={league}
      isCommissioner={league.isCommissioner}
      initialTab={tab as 'contestants' | 'draft' | 'teams' | 'episodes' | 'scoring' | 'standings' | 'settings'}
      onBack={() => window.location.href = '/'}
    />
  );
}