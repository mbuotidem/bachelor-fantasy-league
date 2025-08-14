import { BaseService, ValidationError, NotFoundError } from './base-service';
import type { Schema } from '../lib/api-client';
import type { Team, CreateTeamInput, EpisodeScore } from '../types';

// Type definitions for GraphQL operations
type TeamModel = Schema['Team']['type'];
type CreateTeamData = Schema['Team']['createType'];
type UpdateTeamData = Schema['Team']['updateType'];

export interface UpdateTeamInput {
  teamId: string;
  name?: string;
  draftedContestants?: string[];
}

export interface AddContestantToTeamInput {
  teamId: string;
  contestantId: string;
}

export class TeamService extends BaseService {

  // Create a new team
  async createTeam(input: CreateTeamInput): Promise<Team> {
    this.validateRequired(input, ['leagueId', 'name']);

    // Use provided ownerId or get current authenticated user
    const ownerId = input.ownerId || await this.getCurrentUserId();

    // Check if user already has a team in this league
    const existingTeams = await this.getTeamsByLeague(input.leagueId);
    const userExistingTeam = existingTeams.find(team => team.ownerId === ownerId);
    
    if (userExistingTeam) {
      throw new ValidationError(`You already have a team in this league: "${userExistingTeam.name}". Each user can only have one team per league.`);
    }

    const createData: CreateTeamData = {
      leagueId: input.leagueId,
      ownerId,
      name: input.name,
      draftedContestants: [],
      totalPoints: 0,
      episodeScores: JSON.stringify([]),
    };

    return this.withRetry(async () => {
      const response = await this.client.models.Team.create(createData);

      if (!response.data) {
        throw new Error('Failed to create team');
      }

      return this.transformTeamModel(response.data);
    });
  }

  // Get a team by ID
  async getTeam(teamId: string): Promise<Team> {
    if (!teamId) {
      throw new ValidationError('Team ID is required');
    }

    return this.withRetry(async () => {
      const response = await this.client.models.Team.get({ id: teamId });

      if (!response.data) {
        throw new NotFoundError('Team', teamId);
      }

      return this.transformTeamModel(response.data);
    });
  }

  // Get all teams in a league
  async getTeamsByLeague(leagueId: string): Promise<Team[]> {
    if (!leagueId) {
      throw new ValidationError('League ID is required');
    }

    return this.withRetry(async () => {
      const response = await this.client.models.Team.list({
        filter: { leagueId: { eq: leagueId } }
      });

      if (!response.data) {
        return [];
      }

      return response.data.map(team => this.transformTeamModel(team));
    });
  }

  // Get teams owned by the current user
  async getUserTeams(): Promise<Team[]> {
    return this.withRetry(async () => {
      const currentUserId = await this.getCurrentUserId();
      
      const response = await this.client.models.Team.list({
        filter: { ownerId: { eq: currentUserId } }
      });

      if (!response.data) {
        return [];
      }

      return response.data.map(team => this.transformTeamModel(team));
    });
  }

  // Update team information
  async updateTeam(input: UpdateTeamInput): Promise<Team> {
    this.validateRequired(input, ['teamId']);

    const updateData: UpdateTeamData = {
      id: input.teamId,
      ...(input.name && { name: input.name }),
      ...(input.draftedContestants && { draftedContestants: input.draftedContestants }),
    };

    return this.withRetry(async () => {
      const response = await this.client.models.Team.update(updateData);

      if (!response.data) {
        throw new NotFoundError('Team', input.teamId);
      }

      return this.transformTeamModel(response.data);
    });
  }

  // Add a contestant to a team (during draft)
  async addContestantToTeam(input: AddContestantToTeamInput): Promise<Team> {
    this.validateRequired(input, ['teamId', 'contestantId']);

    // First get the current team to update the drafted contestants
    const currentTeam = await this.getTeam(input.teamId);

    // Check if contestant is already drafted
    if (currentTeam.draftedContestants.includes(input.contestantId)) {
      throw new ValidationError('Contestant is already drafted by this team');
    }

    // Check if team has reached the draft limit (5 contestants)
    if (currentTeam.draftedContestants.length >= 5) {
      throw new ValidationError('Team has already drafted the maximum number of contestants');
    }

    const updatedContestants = [...currentTeam.draftedContestants, input.contestantId];

    return this.updateTeam({
      teamId: input.teamId,
      draftedContestants: updatedContestants,
    });
  }

  // Remove a contestant from a team (before draft is finalized)
  async removeContestantFromTeam(teamId: string, contestantId: string): Promise<Team> {
    this.validateRequired({ teamId, contestantId }, ['teamId', 'contestantId']);

    const currentTeam = await this.getTeam(teamId);

    const updatedContestants = currentTeam.draftedContestants.filter(
      id => id !== contestantId
    );

    return this.updateTeam({
      teamId,
      draftedContestants: updatedContestants,
    });
  }

  // Update team's total points and episode scores
  async updateTeamScores(teamId: string, episodeScore: EpisodeScore): Promise<Team> {
    if (!teamId) {
      throw new ValidationError('Team ID is required');
    }

    const currentTeam = await this.getTeam(teamId);

    // Update episode scores
    const updatedEpisodeScores = [...currentTeam.episodeScores];
    const existingScoreIndex = updatedEpisodeScores.findIndex(
      score => score.episodeId === episodeScore.episodeId
    );

    if (existingScoreIndex >= 0) {
      updatedEpisodeScores[existingScoreIndex] = episodeScore;
    } else {
      updatedEpisodeScores.push(episodeScore);
    }

    // Calculate new total points
    const newTotalPoints = updatedEpisodeScores.reduce(
      (total, score) => total + score.points,
      0
    );

    const updateData: UpdateTeamData = {
      id: teamId,
      totalPoints: newTotalPoints,
      episodeScores: JSON.stringify(updatedEpisodeScores),
    };

    return this.withRetry(async () => {
      const response = await this.client.models.Team.update(updateData);

      if (!response.data) {
        throw new NotFoundError('Team', teamId);
      }

      return this.transformTeamModel(response.data);
    });
  }

  // Delete a team
  async deleteTeam(teamId: string): Promise<void> {
    if (!teamId) {
      throw new ValidationError('Team ID is required');
    }

    console.log(`Attempting to delete team with ID: ${teamId}`);

    // First check if the team exists
    let teamExists = true;
    try {
      const team = await this.getTeam(teamId);
      console.log(`Team found:`, team);
    } catch (error) {
      if (error instanceof NotFoundError) {
        console.log(`Team ${teamId} already doesn't exist, considering it deleted`);
        return;
      }
      console.error(`Error checking if team exists:`, error);
      throw error;
    }

    return this.withRetry(async () => {
      console.log(`Making delete request for team: ${teamId}`);
      
      try {
        const response = await this.client.models.Team.delete({ id: teamId });
        
        console.log(`Delete response:`, response);

        // Check for GraphQL errors
        if (response.errors && response.errors.length > 0) {
          console.error(`GraphQL errors:`, response.errors);
          throw new Error(`GraphQL error: ${JSON.stringify(response.errors)}`);
        }

        console.log(`Team ${teamId} deleted successfully`);
        
      } catch (error) {
        console.error(`Delete operation failed:`, error);
        throw error;
      }
    });
  }

  // Get team standings for a league
  async getTeamStandings(leagueId: string): Promise<Team[]> {
    const teams = await this.getTeamsByLeague(leagueId);

    // Sort teams by total points (descending)
    return teams.sort((a, b) => b.totalPoints - a.totalPoints);
  }

  // Check if a team can draft a contestant
  async canDraftContestant(teamId: string, contestantId: string): Promise<boolean> {
    try {
      const team = await this.getTeam(teamId);

      // Check if team has space
      if (team.draftedContestants.length >= 5) {
        return false;
      }

      // Check if contestant is already drafted
      if (team.draftedContestants.includes(contestantId)) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  // Private helper methods

  private transformTeamModel(model: TeamModel): Team {
    let episodeScores: EpisodeScore[] = [];

    try {
      episodeScores = model.episodeScores ?
        JSON.parse(model.episodeScores as string) : [];
    } catch (error) {
      console.warn('Failed to parse episode scores:', error);
      episodeScores = [];
    }

    return {
      id: model.id,
      leagueId: model.leagueId,
      ownerId: model.ownerId || '',
      name: model.name,
      draftedContestants: (model.draftedContestants || []).filter((id): id is string => id !== null),
      totalPoints: model.totalPoints || 0,
      episodeScores,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}