import { BaseService, ValidationError, NotFoundError } from './base-service';
import type { Schema } from '../lib/api-client';
import type { Draft, DraftPick, DraftSettings, DraftStatus, Contestant } from '../types';

// Type definitions for GraphQL operations
type DraftModel = Schema['Draft']['type'];
type CreateDraftData = Schema['Draft']['createType'];
type UpdateDraftData = Schema['Draft']['updateType'];

export interface CreateDraftInput {
  leagueId: string;
  settings?: Partial<DraftSettings>;
}

export interface MakePickInput {
  draftId: string;
  teamId: string;
  contestantId: string;
}

export class DraftService extends BaseService {

  // ========================================
  // CORE DRAFT OPERATIONS (Simple & Clean)
  // ========================================

  /**
   * Step 1: Create a draft (pre-draft lobby state)
   * This creates the draft but doesn't start it yet
   */
  async createDraft(input: CreateDraftInput): Promise<Draft> {
    this.validateRequired(input, ['leagueId']);

    // Get teams in the league
    const teamsResponse = await this.client.models.Team.list({
      filter: { leagueId: { eq: input.leagueId } }
    });

    if (!teamsResponse.data || teamsResponse.data.length === 0) {
      throw new ValidationError('League must have teams before creating a draft');
    }

    const defaultSettings: DraftSettings = {
      pickTimeLimit: 120, // 2 minutes
      draftFormat: 'snake',
      autoPickEnabled: false,
    };

    const settings = { ...defaultSettings, ...input.settings };

    const createData: CreateDraftData = {
      leagueId: input.leagueId,
      status: 'not_started', // Pre-draft lobby state
      currentPick: 0, // Not started yet
      draftOrder: [], // Will be set when draft starts
      picks: JSON.stringify([]),
      settings: JSON.stringify(settings),
    };

    return this.withRetry(async () => {
      const response = await this.client.models.Draft.create(createData);

      if (!response.data) {
        throw new Error('Failed to create draft');
      }

      return this.transformDraftModel(response.data);
    });
  }

  /**
   * Step 2: Start the draft (moves from lobby to live drafting)
   * This is the "point of no return" - locks settings and begins
   */
  async startDraft(draftId: string): Promise<Draft> {
    if (!draftId) {
      throw new ValidationError('Draft ID is required');
    }

    // Get the draft to validate it exists and is in correct state
    const draft = await this.getDraft(draftId);
    
    if (draft.status !== 'not_started') {
      throw new ValidationError('Draft must be in not_started state to start');
    }

    // Get teams to create randomized draft order
    const teamsResponse = await this.client.models.Team.list({
      filter: { leagueId: { eq: draft.leagueId } }
    });

    if (!teamsResponse.data || teamsResponse.data.length === 0) {
      throw new ValidationError('League must have teams to start draft');
    }

    // Create randomized draft order
    const teams = teamsResponse.data;
    const draftOrder = this.shuffleArray(teams.map(team => team.id));

    const updateData: UpdateDraftData = {
      id: draftId,
      status: 'in_progress',
      currentPick: 1,
      draftOrder,
    };

    return this.withRetry(async () => {
      const response = await this.client.models.Draft.update(updateData);

      if (!response.data) {
        throw new NotFoundError('Draft', draftId);
      }

      return this.transformDraftModel(response.data);
    });
  }

  /**
   * Make a draft pick
   */
  async makePick(input: MakePickInput): Promise<Draft> {
    this.validateRequired(input, ['draftId', 'teamId', 'contestantId']);

    const draft = await this.getDraft(input.draftId);

    if (draft.status !== 'in_progress') {
      throw new ValidationError('Draft must be in progress to make picks');
    }

    // Validate it's the correct team's turn
    const currentTeamId = this.getCurrentTeamId(draft);
    if (currentTeamId !== input.teamId) {
      throw new ValidationError('It is not this team\'s turn to pick');
    }

    // Validate contestant is available
    await this.validateContestantAvailable(input.contestantId, draft);

    // Validate team hasn't reached draft limit
    await this.validateTeamDraftLimit(input.teamId, draft);

    // Create the pick
    const newPick: DraftPick = {
      pickNumber: draft.currentPick,
      teamId: input.teamId,
      contestantId: input.contestantId,
      timestamp: new Date().toISOString(),
    };

    const updatedPicks = [...draft.picks, newPick];
    const nextPickNumber = draft.currentPick + 1;
    const totalPicks = draft.draftOrder.length * 5; // 5 contestants per team

    // Determine if draft is complete
    const isComplete = nextPickNumber > totalPicks;
    const newStatus: DraftStatus = isComplete ? 'completed' : 'in_progress';

    // Update the draft
    const updateData: UpdateDraftData = {
      id: input.draftId,
      status: newStatus,
      currentPick: isComplete ? draft.currentPick : nextPickNumber,
      picks: JSON.stringify(updatedPicks),
    };

    const updatedDraft = await this.withRetry(async () => {
      const response = await this.client.models.Draft.update(updateData);

      if (!response.data) {
        throw new NotFoundError('Draft', input.draftId);
      }

      return this.transformDraftModel(response.data);
    });

    // Update team's drafted contestants
    await this.updateTeamDraftedContestants(input.teamId, input.contestantId);

    return updatedDraft;
  }

  // ========================================
  // QUERY OPERATIONS
  // ========================================

  /**
   * Get draft by ID
   */
  async getDraft(draftId: string): Promise<Draft> {
    if (!draftId) {
      throw new ValidationError('Draft ID is required');
    }

    return this.withRetry(async () => {
      const response = await this.client.models.Draft.get({ id: draftId });

      if (!response.data) {
        throw new NotFoundError('Draft', draftId);
      }

      return this.transformDraftModel(response.data);
    });
  }

  /**
   * Get draft by league ID (returns the most recent one)
   */
  async getDraftByLeague(leagueId: string): Promise<Draft | null> {
    if (!leagueId) {
      throw new ValidationError('League ID is required');
    }

    return this.withRetry(async () => {
      const response = await this.client.models.Draft.list({
        filter: { leagueId: { eq: leagueId } }
      });

      if (!response.data || response.data.length === 0) {
        return null;
      }

      // Return the most recent draft
      const drafts = response.data.map(draft => this.transformDraftModel(draft));
      return drafts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    });
  }

  /**
   * Get available contestants for drafting
   */
  async getAvailableContestants(leagueId: string, draftId?: string): Promise<Contestant[]> {
    if (!leagueId) {
      throw new ValidationError('League ID is required');
    }

    // Get all contestants in the league
    const contestantsResponse = await this.client.models.Contestant.list({
      filter: { leagueId: { eq: leagueId } }
    });

    if (!contestantsResponse.data) {
      return [];
    }

    const allContestants = contestantsResponse.data.map(contestant => ({
      id: contestant.id,
      leagueId: contestant.leagueId,
      name: contestant.name,
      age: contestant.age || undefined,
      hometown: contestant.hometown || undefined,
      occupation: contestant.occupation || undefined,
      bio: contestant.bio || undefined,
      profileImageUrl: contestant.profileImageUrl || undefined,
      isEliminated: contestant.isEliminated || false,
      eliminationEpisode: contestant.eliminationEpisode || undefined,
      totalPoints: contestant.totalPoints || 0,
      episodeScores: [],
      createdAt: contestant.createdAt,
      updatedAt: contestant.updatedAt,
    }));

    if (!draftId) {
      return allContestants;
    }

    // Get draft to check which contestants are already picked
    const draft = await this.getDraft(draftId);
    const draftedContestantIds = draft.picks.map(pick => pick.contestantId);

    // Return only available contestants
    return allContestants.filter(contestant =>
      !draftedContestantIds.includes(contestant.id)
    );
  }

  // ========================================
  // UTILITY OPERATIONS
  // ========================================

  /**
   * Get current team whose turn it is to pick
   */
  getCurrentTeamId(draft: Draft): string | null {
    if (draft.status !== 'in_progress' || draft.currentPick === 0) {
      return null;
    }

    const { draftOrder, settings } = draft;
    const pickNumber = draft.currentPick;
    const round = Math.ceil(pickNumber / draftOrder.length);
    const positionInRound = ((pickNumber - 1) % draftOrder.length) + 1;

    if (settings.draftFormat === 'snake' && round % 2 === 0) {
      // Even rounds go in reverse order for snake draft
      return draftOrder[draftOrder.length - positionInRound];
    } else {
      // Odd rounds or linear draft go in normal order
      return draftOrder[positionInRound - 1];
    }
  }

  /**
   * Get draft picks for a specific team
   */
  getTeamPicks(draft: Draft, teamId: string): DraftPick[] {
    return draft.picks.filter(pick => pick.teamId === teamId);
  }

  /**
   * Get draft status summary
   */
  getDraftStatus(draft: Draft): {
    isActive: boolean;
    currentTeamId: string | null;
    currentRound: number;
    totalRounds: number;
    picksRemaining: number;
  } {
    const totalPicks = draft.draftOrder.length * 5;
    const currentRound = Math.ceil(draft.currentPick / draft.draftOrder.length);
    const totalRounds = 5; // 5 contestants per team

    return {
      isActive: draft.status === 'in_progress',
      currentTeamId: this.getCurrentTeamId(draft),
      currentRound,
      totalRounds,
      picksRemaining: Math.max(0, totalPicks - draft.picks.length),
    };
  }

  // ========================================
  // ADMIN/DEBUG OPERATIONS
  // ========================================

  /**
   * Delete a specific draft
   */
  async deleteDraft(draftId: string): Promise<void> {
    if (!draftId) {
      throw new ValidationError('Draft ID is required');
    }

    return this.withRetry(async () => {
      const response = await this.client.models.Draft.delete({ id: draftId });

      if (!response.data) {
        throw new NotFoundError('Draft', draftId);
      }
    });
  }

  /**
   * List all drafts for a league (for debugging/admin purposes)
   */
  async listDraftsByLeague(leagueId: string): Promise<Draft[]> {
    if (!leagueId) {
      throw new ValidationError('League ID is required');
    }

    return this.withRetry(async () => {
      const response = await this.client.models.Draft.list({
        filter: { leagueId: { eq: leagueId } }
      });

      if (!response.data) {
        return [];
      }

      return response.data.map(draft => this.transformDraftModel(draft));
    });
  }

  /**
   * Delete all drafts for a league
   */
  async deleteAllDraftsForLeague(leagueId: string): Promise<number> {
    if (!leagueId) {
      throw new ValidationError('League ID is required');
    }

    const drafts = await this.listDraftsByLeague(leagueId);
    let deletedCount = 0;

    for (const draft of drafts) {
      try {
        await this.deleteDraft(draft.id);
        deletedCount++;
      } catch (error) {
        console.warn(`Failed to delete draft ${draft.id}:`, error);
      }
    }

    return deletedCount;
  }

  /**
   * Clean up orphaned draft data and reset teams
   */
  async cleanupLeagueDraftData(leagueId: string): Promise<{
    draftsDeleted: number;
    teamsReset: number;
  }> {
    if (!leagueId) {
      throw new ValidationError('League ID is required');
    }

    // Delete all drafts
    const draftsDeleted = await this.deleteAllDraftsForLeague(leagueId);

    // Reset all teams' drafted contestants
    const teamsResponse = await this.client.models.Team.list({
      filter: { leagueId: { eq: leagueId } }
    });

    let teamsReset = 0;
    if (teamsResponse.data) {
      for (const team of teamsResponse.data) {
        try {
          await this.client.models.Team.update({
            id: team.id,
            draftedContestants: [],
          });
          teamsReset++;
        } catch (error) {
          console.warn(`Failed to reset team ${team.id}:`, error);
        }
      }
    }

    return { draftsDeleted, teamsReset };
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  private transformDraftModel(model: DraftModel): Draft {
    let picks: DraftPick[] = [];
    let settings: DraftSettings = {
      pickTimeLimit: 120,
      draftFormat: 'snake',
      autoPickEnabled: false,
    };

    try {
      picks = model.picks ? JSON.parse(model.picks as string) : [];
    } catch (error) {
      console.warn('Failed to parse draft picks:', error);
      picks = [];
    }

    try {
      settings = model.settings ?
        { ...settings, ...JSON.parse(model.settings as string) } :
        settings;
    } catch (error) {
      console.warn('Failed to parse draft settings:', error);
    }

    return {
      id: model.id,
      leagueId: model.leagueId,
      status: (model.status as DraftStatus) || 'not_started',
      currentPick: model.currentPick || 0,
      draftOrder: (model.draftOrder || []).filter((id): id is string => id !== null),
      picks,
      settings,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private async validateContestantAvailable(contestantId: string, draft: Draft): Promise<void> {
    const draftedContestantIds = draft.picks.map(pick => pick.contestantId);

    if (draftedContestantIds.includes(contestantId)) {
      throw new ValidationError('Contestant has already been drafted');
    }

    // Check if contestant exists and is in the same league
    const contestantResponse = await this.client.models.Contestant.get({ id: contestantId });

    if (!contestantResponse.data) {
      throw new NotFoundError('Contestant', contestantId);
    }

    if (contestantResponse.data.leagueId !== draft.leagueId) {
      throw new ValidationError('Contestant is not in this league');
    }
  }

  private async validateTeamDraftLimit(teamId: string, draft: Draft): Promise<void> {
    const teamPicks = this.getTeamPicks(draft, teamId);

    if (teamPicks.length >= 5) {
      throw new ValidationError('Team has already drafted the maximum number of contestants (5)');
    }
  }

  private async updateTeamDraftedContestants(teamId: string, contestantId: string): Promise<void> {
    // Get current team
    const teamResponse = await this.client.models.Team.get({ id: teamId });

    if (!teamResponse.data) {
      throw new NotFoundError('Team', teamId);
    }

    const currentContestants = teamResponse.data.draftedContestants || [];
    const updatedContestants = [...currentContestants, contestantId];

    // Update team
    await this.client.models.Team.update({
      id: teamId,
      draftedContestants: updatedContestants,
    });
  }
}