import { BaseService, ValidationError, NotFoundError } from './base-service';
import { DEFAULT_EPISODE_NUMBER } from '../lib/constants';
import type { Schema } from '../lib/api-client';
import type { Episode } from '../types';

// Type definitions for GraphQL operations
type EpisodeModel = Schema['Episode']['type'];

export class EpisodeService extends BaseService {

  /**
   * Get the current active episode for a league
   * Returns the episode number that should be used for eliminations
   */
  async getCurrentEpisodeNumber(leagueId: string): Promise<number> {
    if (!leagueId) {
      throw new ValidationError('League ID is required');
    }

    try {
      // Get all episodes for the league, ordered by episode number
      const response = await this.client.models.Episode.list({
        filter: { 
          leagueId: { eq: leagueId },
          isActive: { eq: true }
        }
      });

      if (response.data && response.data.length > 0) {
        // Return the episode number of the active episode
        const activeEpisode = response.data[0];
        return activeEpisode.episodeNumber || DEFAULT_EPISODE_NUMBER;
      }

      // If no active episode, get the latest episode
      const allEpisodesResponse = await this.client.models.Episode.list({
        filter: { leagueId: { eq: leagueId } }
      });

      if (allEpisodesResponse.data && allEpisodesResponse.data.length > 0) {
        // Sort by episode number and get the latest
        const sortedEpisodes = allEpisodesResponse.data.sort((a, b) => 
          (b.episodeNumber || 0) - (a.episodeNumber || 0)
        );
        return sortedEpisodes[0].episodeNumber || DEFAULT_EPISODE_NUMBER;
      }

      // No episodes exist yet, return default
      return DEFAULT_EPISODE_NUMBER;
    } catch (error) {
      console.warn('Failed to get current episode number, using default:', error);
      return DEFAULT_EPISODE_NUMBER;
    }
  }

  /**
   * Get all episodes for a league
   */
  async getEpisodesByLeague(leagueId: string): Promise<Episode[]> {
    if (!leagueId) {
      throw new ValidationError('League ID is required');
    }

    return this.withRetry(async () => {
      const response = await this.client.models.Episode.list({
        filter: { leagueId: { eq: leagueId } }
      });
      
      if (!response.data) {
        return [];
      }

      return response.data
        .map(episode => this.transformEpisodeModel(episode))
        .sort((a, b) => a.episodeNumber - b.episodeNumber);
    });
  }

  /**
   * Get the active episode for a league
   */
  async getActiveEpisode(leagueId: string): Promise<Episode | null> {
    if (!leagueId) {
      throw new ValidationError('League ID is required');
    }

    return this.withRetry(async () => {
      const response = await this.client.models.Episode.list({
        filter: { 
          leagueId: { eq: leagueId },
          isActive: { eq: true }
        }
      });
      
      if (!response.data || response.data.length === 0) {
        return null;
      }

      return this.transformEpisodeModel(response.data[0]);
    });
  }

  private transformEpisodeModel(model: EpisodeModel): Episode {
    return {
      id: model.id,
      leagueId: model.leagueId,
      episodeNumber: model.episodeNumber || 1,
      airDate: model.airDate || new Date().toISOString(),
      isActive: model.isActive || false,
      scoringEvents: [], // Will be populated by separate service calls if needed
      totalEvents: model.totalEvents || 0,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}