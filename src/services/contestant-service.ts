import { BaseService, ValidationError, NotFoundError } from './base-service';
import { StorageService } from './storage-service';
import type { Schema } from '../lib/api-client';
import type { Contestant, CreateContestantInput, EpisodeScore } from '../types';

// Type definitions for GraphQL operations
type ContestantModel = Schema['Contestant']['type'];
type CreateContestantData = Schema['Contestant']['createType'];
type UpdateContestantData = Schema['Contestant']['updateType'];

export interface UpdateContestantInput {
  contestantId: string;
  name?: string;
  age?: number;
  hometown?: string;
  occupation?: string;
  bio?: string;
  profileImageUrl?: string;
}

export interface EliminateContestantInput {
  contestantId: string;
  episodeNumber: number;
}

export class ContestantService extends BaseService {
  private storageService = new StorageService();

  // Create a new contestant
  async createContestant(input: CreateContestantInput): Promise<Contestant> {
    this.validateRequired(input, ['leagueId', 'name']);

    const createData: CreateContestantData = {
      leagueId: input.leagueId,
      name: input.name,
      age: input.age,
      hometown: input.hometown,
      occupation: input.occupation,
      bio: input.bio,
      profileImageUrl: input.profileImageUrl,
      isEliminated: false,
      totalPoints: 0,
      episodeScores: JSON.stringify([]),
    };

    return this.withRetry(async () => {
      const response = await this.client.models.Contestant.create(createData);
      
      if (!response.data) {
        throw new Error('Failed to create contestant');
      }

      return this.transformContestantModel(response.data);
    });
  }

  // Get a contestant by ID
  async getContestant(contestantId: string): Promise<Contestant> {
    if (!contestantId) {
      throw new ValidationError('Contestant ID is required');
    }

    return this.withRetry(async () => {
      const response = await this.client.models.Contestant.get({ id: contestantId });
      
      if (!response.data) {
        throw new NotFoundError('Contestant', contestantId);
      }

      return this.transformContestantModel(response.data);
    });
  }

  // Get all contestants in a league
  async getContestantsByLeague(leagueId: string): Promise<Contestant[]> {
    if (!leagueId) {
      throw new ValidationError('League ID is required');
    }

    return this.withRetry(async () => {
      const response = await this.client.models.Contestant.list({
        filter: { leagueId: { eq: leagueId } }
      });
      
      if (!response.data) {
        return [];
      }

      return response.data.map(contestant => this.transformContestantModel(contestant));
    });
  }

  // Get active (non-eliminated) contestants in a league
  async getActiveContestants(leagueId: string): Promise<Contestant[]> {
    const allContestants = await this.getContestantsByLeague(leagueId);
    return allContestants.filter(contestant => !contestant.isEliminated);
  }

  // Get eliminated contestants in a league
  async getEliminatedContestants(leagueId: string): Promise<Contestant[]> {
    const allContestants = await this.getContestantsByLeague(leagueId);
    return allContestants.filter(contestant => contestant.isEliminated);
  }

  // Update contestant information
  async updateContestant(input: UpdateContestantInput): Promise<Contestant> {
    this.validateRequired(input, ['contestantId']);

    const updateData: UpdateContestantData = {
      id: input.contestantId,
      ...(input.name && { name: input.name }),
      ...(input.age !== undefined && { age: input.age }),
      ...(input.hometown && { hometown: input.hometown }),
      ...(input.occupation && { occupation: input.occupation }),
      ...(input.bio && { bio: input.bio }),
      ...(input.profileImageUrl && { profileImageUrl: input.profileImageUrl }),
    };

    return this.withRetry(async () => {
      const response = await this.client.models.Contestant.update(updateData);
      
      if (!response.data) {
        throw new NotFoundError('Contestant', input.contestantId);
      }

      return this.transformContestantModel(response.data);
    });
  }

  // Eliminate a contestant
  async eliminateContestant(input: EliminateContestantInput): Promise<Contestant> {
    this.validateRequired(input, ['contestantId', 'episodeNumber']);

    const updateData: UpdateContestantData = {
      id: input.contestantId,
      isEliminated: true,
      eliminationEpisode: input.episodeNumber,
    };

    return this.withRetry(async () => {
      const response = await this.client.models.Contestant.update(updateData);
      
      if (!response.data) {
        throw new NotFoundError('Contestant', input.contestantId);
      }

      return this.transformContestantModel(response.data);
    });
  }

  // Restore a contestant (undo elimination)
  async restoreContestant(contestantId: string): Promise<Contestant> {
    if (!contestantId) {
      throw new ValidationError('Contestant ID is required');
    }

    const updateData: UpdateContestantData = {
      id: contestantId,
      isEliminated: false,
      eliminationEpisode: null,
    };

    return this.withRetry(async () => {
      const response = await this.client.models.Contestant.update(updateData);
      
      if (!response.data) {
        throw new NotFoundError('Contestant', contestantId);
      }

      return this.transformContestantModel(response.data);
    });
  }

  // Update contestant's total points and episode scores
  async updateContestantScores(contestantId: string, episodeScore: EpisodeScore): Promise<Contestant> {
    if (!contestantId) {
      throw new ValidationError('Contestant ID is required');
    }

    const currentContestant = await this.getContestant(contestantId);
    
    // Update episode scores
    const updatedEpisodeScores = [...currentContestant.episodeScores];
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

    const updateData: UpdateContestantData = {
      id: contestantId,
      totalPoints: newTotalPoints,
      episodeScores: JSON.stringify(updatedEpisodeScores),
    };

    return this.withRetry(async () => {
      const response = await this.client.models.Contestant.update(updateData);
      
      if (!response.data) {
        throw new NotFoundError('Contestant', contestantId);
      }

      return this.transformContestantModel(response.data);
    });
  }

  // Delete a contestant
  async deleteContestant(contestantId: string): Promise<void> {
    if (!contestantId) {
      throw new ValidationError('Contestant ID is required');
    }

    return this.withRetry(async () => {
      const response = await this.client.models.Contestant.delete({ id: contestantId });
      
      if (!response.data) {
        throw new NotFoundError('Contestant', contestantId);
      }
    });
  }

  // Get contestant standings for a league (sorted by points)
  async getContestantStandings(leagueId: string): Promise<Contestant[]> {
    const contestants = await this.getContestantsByLeague(leagueId);
    
    // Sort contestants by total points (descending)
    return contestants.sort((a, b) => b.totalPoints - a.totalPoints);
  }

  // Get top performers for a specific episode
  async getEpisodeTopPerformers(leagueId: string, episodeId: string, limit: number = 5): Promise<Contestant[]> {
    const contestants = await this.getContestantsByLeague(leagueId);
    
    // Filter contestants who have scores for this episode and sort by episode points
    const contestantsWithEpisodeScores = contestants
      .map(contestant => {
        const episodeScore = contestant.episodeScores.find(score => score.episodeId === episodeId);
        return {
          ...contestant,
          episodePoints: episodeScore?.points || 0
        };
      })
      .filter(contestant => contestant.episodePoints > 0)
      .sort((a, b) => b.episodePoints - a.episodePoints)
      .slice(0, limit);

    return contestantsWithEpisodeScores;
  }

  // Bulk create contestants (useful for season setup)
  async bulkCreateContestants(leagueId: string, contestants: Omit<CreateContestantInput, 'leagueId'>[]): Promise<Contestant[]> {
    if (!leagueId) {
      throw new ValidationError('League ID is required');
    }

    if (!contestants || contestants.length === 0) {
      throw new ValidationError('At least one contestant is required');
    }

    const createdContestants: Contestant[] = [];

    // Create contestants one by one (could be optimized with batch operations)
    for (const contestantData of contestants) {
      try {
        const contestant = await this.createContestant({
          ...contestantData,
          leagueId
        });
        createdContestants.push(contestant);
      } catch (error) {
        console.error(`Failed to create contestant ${contestantData.name}:`, error);
        // Continue with other contestants
      }
    }

    return createdContestants;
  }

  // Search contestants by name
  async searchContestants(leagueId: string, searchTerm: string): Promise<Contestant[]> {
    const contestants = await this.getContestantsByLeague(leagueId);
    
    const lowercaseSearch = searchTerm.toLowerCase();
    return contestants.filter(contestant => 
      contestant.name.toLowerCase().includes(lowercaseSearch) ||
      contestant.hometown?.toLowerCase().includes(lowercaseSearch) ||
      contestant.occupation?.toLowerCase().includes(lowercaseSearch)
    );
  }

  // Private helper methods

  private transformContestantModel(model: ContestantModel): Contestant {
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
      name: model.name,
      age: model.age || undefined,
      hometown: model.hometown || undefined,
      occupation: model.occupation || undefined,
      bio: model.bio || undefined,
      profileImageUrl: model.profileImageUrl || undefined,
      isEliminated: model.isEliminated || false,
      eliminationEpisode: model.eliminationEpisode || undefined,
      totalPoints: model.totalPoints || 0,
      episodeScores,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}