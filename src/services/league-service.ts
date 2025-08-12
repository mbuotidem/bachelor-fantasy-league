import { BaseService, ValidationError, NotFoundError } from './base-service';
import type { Schema } from '../lib/api-client';
import type { 
  League, 
  CreateLeagueInput, 
  LeagueSettings,
  LeagueStatus 
} from '../types';

// Type definitions for GraphQL operations
type LeagueModel = Schema['League']['type'];
type CreateLeagueData = Schema['League']['createType'];
type UpdateLeagueData = Schema['League']['updateType'];

export interface JoinLeagueInput {
  leagueCode: string;
  teamName: string;
}

export interface UpdateLeagueSettingsInput {
  leagueId: string;
  settings: Partial<LeagueSettings>;
}

export class LeagueService extends BaseService {
  
  // Create a new league
  async createLeague(input: CreateLeagueInput): Promise<League> {
    this.validateRequired(input, ['name', 'season']);

    const leagueCode = this.generateLeagueCode();
    const commissionerId = await this.getCurrentUserId();
    
    const createData: CreateLeagueData = {
      name: input.name,
      season: input.season,
      leagueCode,
      commissionerId,
      status: 'created' as LeagueStatus,
      settings: JSON.stringify(input.settings || this.getDefaultLeagueSettings()),
    };

    return this.withRetry(async () => {
      const response = await this.client.models.League.create(createData);
      
      if (!response.data) {
        throw new Error('Failed to create league');
      }

      return this.transformLeagueModel(response.data);
    });
  }

  // Get a league by ID
  async getLeague(leagueId: string): Promise<League> {
    if (!leagueId) {
      throw new ValidationError('League ID is required');
    }

    return this.withRetry(async () => {
      const response = await this.client.models.League.get({ id: leagueId });
      
      if (!response.data) {
        throw new NotFoundError('League', leagueId);
      }

      return this.transformLeagueModel(response.data);
    });
  }

  // Get a league by league code
  async getLeagueByCode(leagueCode: string): Promise<League> {
    if (!leagueCode) {
      throw new ValidationError('League code is required');
    }

    return this.withRetry(async () => {
      const response = await this.client.models.League.list({
        filter: { leagueCode: { eq: leagueCode } }
      });
      
      if (!response.data || response.data.length === 0) {
        throw new NotFoundError('League with code', leagueCode);
      }

      const rawLeague = response.data[0];
      return this.transformLeagueModel(rawLeague);
    });
  }

  // List leagues for the current user
  async getUserLeagues(): Promise<League[]> {
    return this.withRetry(async () => {
      const currentUserId = await this.getCurrentUserId();
      
      // Get leagues where user is commissioner
      const commissionerLeagues = await this.client.models.League.list({
        filter: { commissionerId: { eq: currentUserId } }
      });
      // Get leagues where user has a team
      const userTeams = await this.client.models.Team.list({
        filter: { ownerId: { eq: currentUserId } }
      });

      const teamLeagueIds = userTeams.data?.map(team => team.leagueId) || [];
      
      // Get leagues by team membership - try individual lookups instead of 'in' filter
      const teamLeagues: League[] = [];
      for (const leagueId of teamLeagueIds) {
        try {
          const leagueResponse = await this.client.models.League.get({ id: leagueId });
          if (leagueResponse.data) {
            teamLeagues.push(this.transformLeagueModel(leagueResponse.data));
          }
        } catch (error) {
          // Silently handle errors (league might be deleted)
        }
      }
      
      // Transform commissioner leagues first
      const transformedCommissionerLeagues = (commissionerLeagues.data || []).map(league => 
        this.transformLeagueModel(league)
      );

      // Combine and deduplicate leagues (both are now transformed)
      const allLeagues = [
        ...transformedCommissionerLeagues,
        ...teamLeagues
      ];

      // Remove duplicates by ID
      const uniqueLeagues = allLeagues.filter((league, index, self) => 
        index === self.findIndex(l => l.id === league.id)
      );

      return uniqueLeagues;
    });
  }

  // Update league settings
  async updateLeagueSettings(input: UpdateLeagueSettingsInput): Promise<League> {
    this.validateRequired(input, ['leagueId']);

    const updateData: UpdateLeagueData = {
      id: input.leagueId,
      settings: JSON.stringify(input.settings),
    };

    return this.withRetry(async () => {
      const response = await this.client.models.League.update(updateData);
      
      if (!response.data) {
        throw new NotFoundError('League', input.leagueId);
      }

      return this.transformLeagueModel(response.data);
    });
  }

  // Update league status
  async updateLeagueStatus(leagueId: string, status: LeagueStatus): Promise<League> {
    if (!leagueId) {
      throw new ValidationError('League ID is required');
    }

    const updateData: UpdateLeagueData = {
      id: leagueId,
      status,
    };

    return this.withRetry(async () => {
      const response = await this.client.models.League.update(updateData);
      
      if (!response.data) {
        throw new NotFoundError('League', leagueId);
      }

      return this.transformLeagueModel(response.data);
    });
  }

  // Join a league with a team
  async joinLeague(input: JoinLeagueInput): Promise<{ league: League; teamId: string }> {
    this.validateRequired(input, ['leagueCode', 'teamName']);
    
    // Additional validation for team name
    if (!input.teamName || input.teamName.trim().length === 0) {
      throw new ValidationError('Team name is required');
    }

    // First, get the league by code
    const league = await this.getLeagueByCode(input.leagueCode);

    // Check if league is in a joinable state
    if (league.status !== 'created') {
      throw new ValidationError('League is not accepting new members');
    }

    // Create the team using the GraphQL client directly
    const ownerId = await this.getCurrentUserId();
    
    const teamCreateData = {
      leagueId: league.id,
      ownerId,
      name: input.teamName,
      draftedContestants: [],
      totalPoints: 0,
      episodeScores: JSON.stringify([]),
    };
    return this.withRetry(async () => {
      const teamResponse = await this.client.models.Team.create(teamCreateData);
      
      if (!teamResponse.data) {
        throw new Error('Failed to create team');
      }



      return {
        league,
        teamId: teamResponse.data.id
      };
    });
  }

  // Delete a league (commissioner only)
  async deleteLeague(leagueId: string): Promise<void> {
    if (!leagueId) {
      throw new ValidationError('League ID is required');
    }

    return this.withRetry(async () => {
      const response = await this.client.models.League.delete({ id: leagueId });
      
      if (!response.data) {
        throw new NotFoundError('League', leagueId);
      }
    });
  }

  // Private helper methods

  private generateLeagueCode(): string {
    // Generate a 6-character alphanumeric code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private getDefaultLeagueSettings(): LeagueSettings {
    return {
      maxTeams: 20,
      contestantDraftLimit: 2,
      draftFormat: 'snake',
      scoringRules: [
        { actionType: 'kiss_mouth', points: 2, description: 'Kiss on mouth', category: 'positive' },
        { actionType: 'receive_rose_week', points: 3, description: 'Receive rose this week', category: 'positive' },
        { actionType: 'receive_rose_date', points: 2, description: 'Receive rose on 1-on-1 date', category: 'positive' },
        { actionType: 'group_date_rose', points: 2, description: 'Receive group date rose', category: 'positive' },
        { actionType: 'interrupt_time', points: 1, description: 'Interrupt 1-on-1 time', category: 'positive' },
        { actionType: 'win_challenge', points: 2, description: 'Winning group date challenge', category: 'positive' },
        { actionType: 'wavelength_moment', points: 1, description: 'Wavelength moment', category: 'positive' },
        { actionType: 'right_reasons', points: 1, description: 'Say "right reasons"', category: 'positive' },
        { actionType: 'journey', points: 1, description: 'Say "journey"', category: 'positive' },
        { actionType: 'connection', points: 1, description: 'Say "connection"', category: 'positive' },
        { actionType: 'girls_girl', points: 1, description: 'Say "girls girl"', category: 'positive' },
        { actionType: 'nudity', points: 2, description: 'Nudity/black box per outfit', category: 'positive' },
        { actionType: 'fantasy_suite', points: 4, description: 'Sex in fantasy suite or before', category: 'positive' },
        { actionType: 'falling_for_you', points: 2, description: 'Say "falling for you"', category: 'positive' },
        { actionType: 'i_love_you', points: 4, description: 'Say "I love you"', category: 'positive' },
        { actionType: 'sparkles', points: 1, description: 'Sparkles in any form', category: 'positive' },
        { actionType: 'crying', points: -1, description: 'Crying per scene', category: 'negative' },
        { actionType: 'medical_attention', points: -1, description: 'Requiring medical attention', category: 'negative' },
        { actionType: 'vomiting', points: -2, description: 'Vomiting', category: 'negative' },
        { actionType: 'physical_altercation', points: -3, description: 'Initiating physical altercation', category: 'negative' },
        { actionType: 'significant_other', points: -5, description: 'Having significant other while on show', category: 'negative' },
      ],
      notificationSettings: {
        scoringUpdates: true,
        draftNotifications: true,
        standingsChanges: true,
        episodeReminders: true,
      },
    };
  }

  private transformLeagueModel(model: LeagueModel): League {
    return {
      id: model.id,
      name: model.name,
      season: model.season,
      leagueCode: model.leagueCode,
      commissionerId: model.commissionerId,
      status: model.status as LeagueStatus,
      settings: model.settings ? JSON.parse(model.settings as string) : this.getDefaultLeagueSettings(),
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}