import { BaseService } from './base-service';
import { TeamService } from './team-service';
import { ContestantService } from './contestant-service';
import { LeagueService } from './league-service';
import { ScoringService } from './scoring-service';
import { UserService } from './user-service';
import {
  TeamStanding,
  ContestantStanding,
  TeamDetail,
  Team,
  Contestant,
  User,
  ContestantSummary
} from '../types';

export class StandingsService extends BaseService {
  private teamService: TeamService;
  private contestantService: ContestantService;
  private leagueService: LeagueService;
  private scoringService: ScoringService;
  private userService: UserService;

  constructor() {
    super();
    this.teamService = new TeamService();
    this.contestantService = new ContestantService();
    this.leagueService = new LeagueService();
    this.scoringService = new ScoringService();
    this.userService = new UserService();
  }

  /**
   * Get team standings for a league with ranking and previous rank tracking
   */
  async getTeamStandings(leagueId: string): Promise<TeamStanding[]> {
    try {
      const teams = await this.teamService.getTeamsByLeague(leagueId);
      const contestants = await this.contestantService.getContestantsByLeague(leagueId);

      // Get all scoring events for contestants in this league to calculate actual points
      const contestantScores = await this.getContestantScoresMap(contestants);

      // Create a map of contestant data for quick lookup
      const contestantMap = new Map(contestants.map(c => [c.id, c]));

      // Calculate standings for each team
      const standings: TeamStanding[] = await Promise.all(
        teams.map(async (team) => {
          // Get owner information - for now use ownerId as display name
          // In a real app, this would fetch user details from a User service
          const ownerName = await this.getOwnerDisplayName(team.ownerId);

          // Calculate team's total points from actual scoring events
          let teamTotalPoints = 0;
          let teamEpisodePoints = 0;

          // Get contestant summaries for this team with actual points
          const teamContestants: ContestantSummary[] = team.draftedContestants
            .map(contestantId => {
              const contestant = contestantMap.get(contestantId);
              if (!contestant) return null;

              const contestantPoints = contestantScores.get(contestantId) || { total: 0, episode: 0 };
              teamTotalPoints += contestantPoints.total;

              return {
                id: contestant.id,
                name: contestant.name,
                points: contestantPoints.total,
                isEliminated: contestant.isEliminated
              };
            })
            .filter((c): c is ContestantSummary => c !== null);

          // Calculate team episode points from team's episode scores (fallback approach)
          // This maintains compatibility with existing data structure
          teamEpisodePoints = this.calculateTeamCurrentEpisodePoints(team);

          return {
            teamId: team.id,
            teamName: team.name,
            ownerName,
            totalPoints: teamTotalPoints,
            rank: 0, // Will be set after sorting
            episodePoints: teamEpisodePoints,
            contestants: teamContestants
          };
        })
      );

      // Sort by total points (descending) and assign ranks
      standings.sort((a, b) => b.totalPoints - a.totalPoints);
      standings.forEach((standing, index) => {
        standing.rank = index + 1;
      });

      return standings;
    } catch (error) {
      console.error('Error getting team standings:', error);
      throw this.transformError(error);
    }
  }

  /**
   * Get contestant standings for a league with ranking information
   */
  async getContestantStandings(leagueId: string): Promise<ContestantStanding[]> {
    try {
      const contestants = await this.contestantService.getContestantsByLeague(leagueId);
      const teams = await this.teamService.getTeamsByLeague(leagueId);

      // Get all scoring events for contestants to calculate actual points
      const contestantScores = await this.getContestantScoresMap(contestants);

      // Create a map to find which teams drafted each contestant
      const contestantTeamMap = new Map<string, string[]>();
      teams.forEach(team => {
        team.draftedContestants.forEach(contestantId => {
          let teamsArr = contestantTeamMap.get(contestantId);
          if (!teamsArr) {
            teamsArr = [];
            contestantTeamMap.set(contestantId, teamsArr);
          }
          teamsArr.push(team.name);
        });
      });

      // Calculate standings for each contestant
      const standings: ContestantStanding[] = contestants.map(contestant => {
        const contestantPoints = contestantScores.get(contestant.id) || { total: 0, episode: 0 };
        const draftedByTeams = contestantTeamMap.get(contestant.id) || [];

        return {
          contestantId: contestant.id,
          name: contestant.name,
          totalPoints: contestantPoints.total,
          rank: 0, // Will be set after sorting
          episodePoints: contestantPoints.episode,
          isEliminated: contestant.isEliminated,
          draftedByTeams
        };
      });

      // Sort by total points (descending) and assign ranks
      standings.sort((a, b) => b.totalPoints - a.totalPoints);
      standings.forEach((standing, index) => {
        standing.rank = index + 1;
      });

      return standings;
    } catch (error) {
      console.error('Error getting contestant standings:', error);
      throw this.transformError(error);
    }
  }

  /**
   * Get detailed information for a specific team
   */
  async getTeamDetail(teamId: string): Promise<TeamDetail> {
    try {
      const team = await this.teamService.getTeam(teamId);
      const owner = await this.getUserById(team.ownerId);

      // Get full contestant data for drafted contestants
      const contestants: Contestant[] = [];
      for (const contestantId of team.draftedContestants) {
        try {
          const contestant = await this.contestantService.getContestant(contestantId);
          contestants.push(contestant);
        } catch (error) {
          console.warn(`Could not fetch contestant ${contestantId}:`, error);
        }
      }

      // Get team standings to include ranking information
      const allStandings = await this.getTeamStandings(team.leagueId);
      const teamStanding = allStandings.find(s => s.teamId === teamId);

      if (!teamStanding) {
        throw new Error('Team standing not found');
      }

      return {
        team,
        owner,
        contestants,
        standings: teamStanding,
        episodeHistory: team.episodeScores
      };
    } catch (error) {
      console.error('Error getting team detail:', error);
      throw this.transformError(error);
    }
  }

  /**
   * Get top performers for the current/most recent episode
   */
  async getCurrentEpisodeTopPerformers(leagueId: string, limit: number = 5): Promise<ContestantStanding[]> {
    try {
      const standings = await this.getContestantStandings(leagueId);

      // Filter to only contestants with episode points and sort by episode points
      return standings
        .filter(standing => standing.episodePoints > 0)
        .sort((a, b) => b.episodePoints - a.episodePoints)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting episode top performers:', error);
      throw this.transformError(error);
    }
  }

  /**
   * Get contestant scores from actual scoring events, with fallback to totalPoints
   */
  private async getContestantScoresMap(contestants: Contestant[]): Promise<Map<string, { total: number; episode: number }>> {
    const scoresMap = new Map<string, { total: number; episode: number }>();

    // Get the most recent episode to calculate current episode points
    const currentEpisodeId = await this.getCurrentEpisodeId();

    // Calculate points for each contestant from their scoring events
    await Promise.all(
      contestants.map(async (contestant) => {
        try {
          const scoringEvents = await this.scoringService.getContestantScores(contestant.id);

          // If we have scoring events, use them
          if (scoringEvents.length > 0) {
            // Calculate total points from all scoring events
            const totalPoints = scoringEvents.reduce((sum, event) => sum + event.points, 0);

            // Calculate current episode points
            const episodePoints = currentEpisodeId
              ? scoringEvents
                .filter(event => event.episodeId === currentEpisodeId)
                .reduce((sum, event) => sum + event.points, 0)
              : 0;

            scoresMap.set(contestant.id, {
              total: totalPoints,
              episode: episodePoints
            });
          } else {
            // Fallback to using the contestant's totalPoints field and episode scores
            const episodePoints = this.calculateContestantCurrentEpisodePoints(contestant);
            scoresMap.set(contestant.id, {
              total: contestant.totalPoints,
              episode: episodePoints
            });
          }
        } catch (error) {
          console.warn(`Could not fetch scores for contestant ${contestant.id}:`, error);
          // Fallback to using the contestant's totalPoints field
          const episodePoints = this.calculateContestantCurrentEpisodePoints(contestant);
          scoresMap.set(contestant.id, {
            total: contestant.totalPoints,
            episode: episodePoints
          });
        }
      })
    );

    return scoresMap;
  }

  /**
   * Get the current/most recent episode ID for calculating episode points
   */
  private async getCurrentEpisodeId(): Promise<string | null> {
    try {
      // This is a simplified approach - in a real app you might want to get the active episode
      // For now, we'll return null and just calculate total points
      return null;
    } catch (error) {
      console.warn('Could not determine current episode:', error);
      return null;
    }
  }

  /**
   * Calculate current episode points for a contestant (fallback method)
   */
  private calculateContestantCurrentEpisodePoints(contestant: Contestant): number {
    if (contestant.episodeScores.length === 0) return 0;

    // Get the most recent episode score
    const latestEpisode = contestant.episodeScores[contestant.episodeScores.length - 1];
    return latestEpisode?.points || 0;
  }

  /**
   * Calculate current episode points for a team (fallback method)
   */
  private calculateTeamCurrentEpisodePoints(team: Team): number {
    if (team.episodeScores.length === 0) return 0;

    // Get the most recent episode score
    const latestEpisode = team.episodeScores[team.episodeScores.length - 1];
    return latestEpisode?.points || 0;
  }

  /**
   * Get owner display name by user ID
   * In a real app, this would fetch from a User service or database
   */
  private async getOwnerDisplayName(ownerId: string): Promise<string> {
    try {
      // First try to get user from our database
      const user = await this.userService.getUser(ownerId);
      return user.displayName;
    } catch (error) {
      // If user not found in database, create a better display name
      // Check if this looks like a Cognito user ID (typically alphanumeric)
      if (/^[a-f0-9-]{8,}$/i.test(ownerId)) {
        // For Cognito-style IDs, create a more friendly name
        const shortId = ownerId.substring(0, 8);
        return `Team Owner (${shortId})`;
      }
      
      // For test/mock user IDs
      if (ownerId.includes('user')) {
        const userNumber = ownerId.replace(/[^0-9]/g, '');
        return userNumber ? `User ${userNumber}` : 'Team Owner';
      }

      // Generic fallback
      const shortId = ownerId.substring(0, 8);
      return `Team Owner (${shortId})`;
    }
  }

  /**
   * Get user by ID using the user service
   */
  private async getUserById(userId: string): Promise<User> {
    try {
      return await this.userService.getUser(userId);
    } catch (error) {
      // Fallback to display name if user not found in database
      const displayName = await this.getOwnerDisplayName(userId);
      
      // Return a minimal user object for backwards compatibility
      // In production, you might want to create the user or handle this differently
      return {
        id: userId,
        email: `${displayName.toLowerCase().replace(/\s+/g, '.')}@placeholder.local`,
        displayName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        preferences: {
          notifications: {
            email: true,
            push: true,
            scoring: true,
            draft: true
          },
          theme: 'light',
          timezone: 'America/New_York'
        }
      };
    }
  }
}