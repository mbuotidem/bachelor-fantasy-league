import { BaseService, ValidationError, NotFoundError } from './base-service';
import type { Schema } from '../lib/api-client';
import type { ScoringEvent, ScoreActionInput, Episode } from '../types';
import { standingsEvents } from '../lib/standings-events';

// Type definitions for GraphQL operations
type ScoringEventModel = Schema['ScoringEvent']['type'];
type CreateScoringEventData = Schema['ScoringEvent']['createType'];
type EpisodeModel = Schema['Episode']['type'];
type CreateEpisodeData = Schema['Episode']['createType'];
type UpdateEpisodeData = Schema['Episode']['updateType'];

export interface UndoScoringInput {
  episodeId: string;
  eventId: string;
}

export interface GetEpisodeScoresInput {
  episodeId: string;
  contestantId?: string;
}

export class ScoringService extends BaseService {

  // Create a new episode
  async createEpisode(leagueId: string, episodeNumber: number, airDate?: string): Promise<Episode> {
    this.validateRequired({ leagueId, episodeNumber }, ['leagueId', 'episodeNumber']);

    const createData: CreateEpisodeData = {
      leagueId,
      episodeNumber,
      airDate: airDate || new Date().toISOString(),
      isActive: false,
      totalEvents: 0,
    };

    console.log('ScoringService.createEpisode - Creating episode with data:', createData);

    return this.withRetry(async () => {
      try {
        const response = await this.client.models.Episode.create(createData);
        
        console.log('ScoringService.createEpisode - Response:', response);
        
        if (!response.data) {
          throw new Error('Failed to create episode - no data returned');
        }

        return this.transformEpisodeModel(response.data);
      } catch (error) {
        console.error('ScoringService.createEpisode - Error in create call:', error);
        throw error;
      }
    });
  }

  // Get an episode by ID
  async getEpisode(episodeId: string): Promise<Episode> {
    if (!episodeId) {
      throw new ValidationError('Episode ID is required');
    }

    return this.withRetry(async () => {
      const response = await this.client.models.Episode.get({ id: episodeId });
      
      if (!response.data) {
        throw new NotFoundError('Episode', episodeId);
      }

      return this.transformEpisodeModel(response.data);
    });
  }

  // Get all episodes for a league
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

      return response.data.map(episode => this.transformEpisodeModel(episode));
    });
  }

  // Get the active episode for a league
  async getActiveEpisode(leagueId: string): Promise<Episode | null> {
    const episodes = await this.getEpisodesByLeague(leagueId);
    return episodes.find(episode => episode.isActive) || null;
  }

  // Set an episode as active (for scoring)
  async setActiveEpisode(episodeId: string): Promise<Episode> {
    if (!episodeId) {
      throw new ValidationError('Episode ID is required');
    }

    // First, get the episode to find its league
    const episode = await this.getEpisode(episodeId);
    
    // Deactivate all other episodes in the league
    const allEpisodes = await this.getEpisodesByLeague(episode.leagueId);
    
    for (const ep of allEpisodes) {
      if (ep.id !== episodeId && ep.isActive) {
        await this.withRetry(async () => {
          await this.client.models.Episode.update({
            id: ep.id,
            isActive: false,
          });
        });
      }
    }

    // Activate the target episode
    const updateData: UpdateEpisodeData = {
      id: episodeId,
      isActive: true,
    };

    return this.withRetry(async () => {
      const response = await this.client.models.Episode.update(updateData);
      
      if (!response.data) {
        throw new NotFoundError('Episode', episodeId);
      }

      return this.transformEpisodeModel(response.data);
    });
  }

  // Score an action for a contestant
  async scoreAction(input: ScoreActionInput): Promise<ScoringEvent> {
    this.validateRequired(input, ['episodeId', 'contestantId', 'actionType', 'points']);

    const scoredBy = await this.getCurrentUserId();

    const createData: CreateScoringEventData = {
      episodeId: input.episodeId,
      contestantId: input.contestantId,
      actionType: input.actionType,
      points: input.points,
      description: input.description,
      scoredBy,
    };

    return this.withRetry(async () => {
      const response = await this.client.models.ScoringEvent.create(createData);
      
      if (!response.data) {
        throw new Error('Failed to create scoring event');
      }

      // Update episode total events count
      await this.incrementEpisodeTotalEvents(input.episodeId);

      const scoringEvent = this.transformScoringEventModel(response.data);

      // Mark scoring activity for smart polling
      try {
        localStorage.setItem('last-scoring-activity', Date.now().toString());
      } catch (error) {
        console.warn('Failed to mark scoring activity:', error);
      }

      // Notify all connected clients about the scoring event
      try {
        standingsEvents.notifyScoringEvent('*', {
          contestantId: input.contestantId,
          episodeId: input.episodeId,
          points: input.points,
          actionType: input.actionType
        });
      } catch (error) {
        console.warn('Failed to emit scoring event notification:', error);
      }

      return scoringEvent;
    });
  }

  // Get all scoring events for an episode
  async getEpisodeScores(input: GetEpisodeScoresInput): Promise<ScoringEvent[]> {
    this.validateRequired(input, ['episodeId']);

    return this.withRetry(async () => {
      const filter: Record<string, unknown> = { episodeId: { eq: input.episodeId } };
      
      if (input.contestantId) {
        filter.contestantId = { eq: input.contestantId };
      }

      const response = await this.client.models.ScoringEvent.list({ filter });
      
      if (!response.data) {
        return [];
      }

      return response.data.map(event => this.transformScoringEventModel(event));
    });
  }

  // Get scoring events for a specific contestant
  async getContestantScores(contestantId: string): Promise<ScoringEvent[]> {
    if (!contestantId) {
      throw new ValidationError('Contestant ID is required');
    }

    return this.withRetry(async () => {
      const response = await this.client.models.ScoringEvent.list({
        filter: { contestantId: { eq: contestantId } }
      });
      
      if (!response.data) {
        return [];
      }

      return response.data.map(event => this.transformScoringEventModel(event));
    });
  }

  // Undo a scoring event
  async undoScoringEvent(input: UndoScoringInput): Promise<void> {
    this.validateRequired(input, ['episodeId', 'eventId']);

    return this.withRetry(async () => {
      const response = await this.client.models.ScoringEvent.delete({ id: input.eventId });
      
      if (!response.data) {
        throw new NotFoundError('Scoring event', input.eventId);
      }

      // Decrement episode total events count
      await this.decrementEpisodeTotalEvents(input.episodeId);

      // Mark scoring activity for smart polling
      try {
        localStorage.setItem('last-scoring-activity', Date.now().toString());
      } catch (error) {
        console.warn('Failed to mark scoring activity:', error);
      }

      // Notify all connected clients about the undo event
      try {
        standingsEvents.notifyStandingsUpdate('*', {
          type: 'undo',
          episodeId: input.episodeId,
          eventId: input.eventId
        });
      } catch (error) {
        console.warn('Failed to emit undo event notification:', error);
      }
    });
  }

  // Get the last N scoring events for an episode (for undo functionality)
  async getRecentScoringEvents(episodeId: string, limit: number = 10): Promise<ScoringEvent[]> {
    const allEvents = await this.getEpisodeScores({ episodeId });
    
    // Sort by timestamp (most recent first) and limit
    return allEvents
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  // Calculate total points for a contestant in an episode
  async calculateContestantEpisodePoints(contestantId: string, episodeId: string): Promise<number> {
    const events = await this.getEpisodeScores({ episodeId, contestantId });
    return events.reduce((total, event) => total + event.points, 0);
  }

  // Calculate total points for all contestants in an episode
  async calculateEpisodeTotals(episodeId: string): Promise<Record<string, number>> {
    const events = await this.getEpisodeScores({ episodeId });
    const totals: Record<string, number> = {};

    events.forEach(event => {
      if (!totals[event.contestantId]) {
        totals[event.contestantId] = 0;
      }
      totals[event.contestantId] += event.points;
    });

    return totals;
  }

  // Get scoring summary for an episode
  async getEpisodeSummary(episodeId: string): Promise<{
    episode: Episode;
    totalEvents: number;
    totalPoints: number;
    contestantTotals: Record<string, number>;
    topScorers: Array<{ contestantId: string; points: number }>;
  }> {
    const episode = await this.getEpisode(episodeId);
    const events = await this.getEpisodeScores({ episodeId });
    const contestantTotals = await this.calculateEpisodeTotals(episodeId);

    const totalPoints = events.reduce((sum, event) => sum + event.points, 0);
    
    const topScorers = Object.entries(contestantTotals)
      .map(([contestantId, points]) => ({ contestantId, points }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);

    return {
      episode,
      totalEvents: events.length,
      totalPoints,
      contestantTotals,
      topScorers,
    };
  }

  // Bulk score multiple actions (useful for rapid scoring)
  async bulkScoreActions(actions: ScoreActionInput[]): Promise<ScoringEvent[]> {
    if (!actions || actions.length === 0) {
      throw new ValidationError('At least one action is required');
    }

    const scoredEvents: ScoringEvent[] = [];

    // Score actions one by one (could be optimized with batch operations)
    for (const action of actions) {
      try {
        const event = await this.scoreAction(action);
        scoredEvents.push(event);
      } catch (error) {
        console.error(`Failed to score action for contestant ${action.contestantId}:`, error);
        // Continue with other actions
      }
    }

    return scoredEvents;
  }

  // Private helper methods

  private async incrementEpisodeTotalEvents(episodeId: string): Promise<void> {
    const episode = await this.getEpisode(episodeId);
    
    await this.withRetry(async () => {
      await this.client.models.Episode.update({
        id: episodeId,
        totalEvents: episode.totalEvents + 1,
      });
    });
  }

  private async decrementEpisodeTotalEvents(episodeId: string): Promise<void> {
    const episode = await this.getEpisode(episodeId);
    
    await this.withRetry(async () => {
      await this.client.models.Episode.update({
        id: episodeId,
        totalEvents: Math.max(0, episode.totalEvents - 1),
      });
    });
  }

  private transformEpisodeModel(model: EpisodeModel): Episode {
    return {
      id: model.id,
      leagueId: model.leagueId,
      episodeNumber: model.episodeNumber,
      airDate: model.airDate || new Date().toISOString(),
      isActive: model.isActive || false,
      scoringEvents: [], // These would be loaded separately if needed
      totalEvents: model.totalEvents || 0,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }

  private transformScoringEventModel(model: ScoringEventModel): ScoringEvent {
    return {
      id: model.id,
      episodeId: model.episodeId,
      contestantId: model.contestantId,
      actionType: model.actionType,
      points: model.points,
      timestamp: model.createdAt, // Use createdAt as timestamp
      scoredBy: model.scoredBy || '',
      description: model.description || undefined,
    };
  }
}