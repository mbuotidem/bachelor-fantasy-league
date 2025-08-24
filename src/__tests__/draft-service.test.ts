import type { Draft, DraftStatus } from '../types';

// Mock the API client before importing anything else
jest.mock('../lib/api-client', () => ({
  client: {
    models: {
      Draft: {
        create: jest.fn(),
        get: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        list: jest.fn(),
      },
      Team: {
        list: jest.fn(),
        get: jest.fn(),
        update: jest.fn(),
      },
      Contestant: {
        list: jest.fn(),
        get: jest.fn(),
      },
    },
  },
}));

// Mock the base service
jest.mock('../services/base-service', () => ({
  BaseService: class MockBaseService {
    protected client: any;
    constructor() {
      this.client = require('../lib/api-client').client;
    }
    protected async withRetry<T>(operation: () => Promise<T>): Promise<T> {
      return operation();
    }
    protected validateRequired(input: any, fields: string[]): void {
      for (const field of fields) {
        if (!input[field]) {
          throw new Error(`${field} is required`);
        }
      }
    }
  },
  ValidationError: class ValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ValidationError';
    }
  },
  NotFoundError: class NotFoundError extends Error {
    constructor(resource: string, id?: string) {
      super(`${resource}${id ? ` with id ${id}` : ''} not found`);
      this.name = 'NotFoundError';
    }
  },
}));

// Now import the service after mocking
import { DraftService } from '../services/draft-service';

describe('DraftService', () => {
  let draftService: DraftService;
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      models: {
        Draft: {
          create: jest.fn(),
          get: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
          list: jest.fn(),
        },
        Team: {
          list: jest.fn(),
          get: jest.fn(),
          update: jest.fn(),
        },
        Contestant: {
          list: jest.fn(),
          get: jest.fn(),
        },
      },
    };

    draftService = new DraftService();
    (draftService as any).client = mockClient;
    (draftService as any).withRetry = jest.fn((fn) => fn());
  });

  describe('Two-Button Draft Flow', () => {
    const mockLeagueId = 'league-123';
    const mockTeams = [
      { id: 'team-1', name: 'Team 1', ownerId: 'user-1' },
      { id: 'team-2', name: 'Team 2', ownerId: 'user-2' },
    ];

    beforeEach(() => {
      mockClient.models.Team.list.mockResolvedValue({
        data: mockTeams,
      });
    });

    describe('Step 1: Create Draft', () => {
      it('should create a draft in "not_started" state', async () => {
        const mockDraftData = {
          id: 'draft-123',
          leagueId: mockLeagueId,
          status: 'not_started',
          currentPick: 0,
          draftOrder: [],
          picks: '[]',
          settings: JSON.stringify({
            pickTimeLimit: 120,
            draftFormat: 'snake',
            autoPickEnabled: false,
          }),
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        };

        mockClient.models.Draft.create.mockResolvedValue({
          data: mockDraftData,
        });

        const result = await draftService.createDraft({ leagueId: mockLeagueId });

        expect(result.status).toBe('not_started');
        expect(result.currentPick).toBe(0);
        expect(result.draftOrder).toEqual([]);
        expect(mockClient.models.Draft.create).toHaveBeenCalledWith({
          leagueId: mockLeagueId,
          status: 'not_started',
          currentPick: 0,
          draftOrder: [],
          picks: '[]',
          settings: JSON.stringify({
            pickTimeLimit: 120,
            draftFormat: 'snake',
            autoPickEnabled: false,
          }),
        });
      });

      it('should fail if league has no teams', async () => {
        mockClient.models.Team.list.mockResolvedValue({
          data: [],
        });

        await expect(
          draftService.createDraft({ leagueId: mockLeagueId })
        ).rejects.toThrow('League must have teams before creating a draft');
      });
    });

    describe('Step 2: Start Draft', () => {
      const mockDraft: Draft = {
        id: 'draft-123',
        leagueId: mockLeagueId,
        status: 'not_started',
        currentPick: 0,
        draftOrder: [],
        picks: [],
        settings: {
          pickTimeLimit: 120,
          draftFormat: 'snake',
          autoPickEnabled: false,
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      beforeEach(() => {
        // Mock getDraft to return the created draft
        mockClient.models.Draft.get.mockResolvedValue({
          data: {
            ...mockDraft,
            picks: '[]',
            settings: JSON.stringify(mockDraft.settings),
          },
        });
      });

      it('should start a draft and set it to "in_progress"', async () => {
        const mockUpdatedDraft = {
          ...mockDraft,
          status: 'in_progress',
          currentPick: 1,
          draftOrder: ['team-1', 'team-2'],
        };

        mockClient.models.Draft.update.mockResolvedValue({
          data: {
            ...mockUpdatedDraft,
            picks: '[]',
            settings: JSON.stringify(mockUpdatedDraft.settings),
          },
        });

        const result = await draftService.startDraft('draft-123');

        expect(result.status).toBe('in_progress');
        expect(result.currentPick).toBe(1);
        expect(result.draftOrder).toHaveLength(2);

        expect(mockClient.models.Draft.update).toHaveBeenCalledWith({
          id: 'draft-123',
          status: 'in_progress',
          currentPick: 1,
          draftOrder: expect.any(Array),
        });
      });

      it('should fail if draft is not in "not_started" state', async () => {
        mockClient.models.Draft.get.mockResolvedValue({
          data: {
            ...mockDraft,
            status: 'in_progress',
            picks: '[]',
            settings: JSON.stringify(mockDraft.settings),
          },
        });

        await expect(
          draftService.startDraft('draft-123')
        ).rejects.toThrow('Draft must be in not_started state to start');
      });

      it('should randomize draft order', async () => {
        const mockUpdatedDraft = {
          ...mockDraft,
          status: 'in_progress',
          currentPick: 1,
          draftOrder: ['team-2', 'team-1'], // Different order
        };

        mockClient.models.Draft.update.mockResolvedValue({
          data: {
            ...mockUpdatedDraft,
            picks: '[]',
            settings: JSON.stringify(mockUpdatedDraft.settings),
          },
        });

        const result = await draftService.startDraft('draft-123');

        expect(result.draftOrder).toContain('team-1');
        expect(result.draftOrder).toContain('team-2');
        expect(result.draftOrder).toHaveLength(2);
      });
    });
  });

  describe('Draft State Validation', () => {
    it('should only allow picks during "in_progress" state', async () => {
      const mockDraft: Draft = {
        id: 'draft-123',
        leagueId: 'league-123',
        status: 'not_started', // Not in progress
        currentPick: 0,
        draftOrder: ['team-1'],
        picks: [],
        settings: {
          pickTimeLimit: 120,
          draftFormat: 'snake',
          autoPickEnabled: false,
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      mockClient.models.Draft.get.mockResolvedValue({
        data: {
          ...mockDraft,
          picks: '[]',
          settings: JSON.stringify(mockDraft.settings),
        },
      });

      await expect(
        draftService.makePick({
          draftId: 'draft-123',
          teamId: 'team-1',
          contestantId: 'contestant-1',
        })
      ).rejects.toThrow('Draft must be in progress to make picks');
    });
  });

  describe('getCurrentTeamId', () => {
    it('should return correct team for snake draft', () => {
      const draft: Draft = {
        id: 'draft-123',
        leagueId: 'league-123',
        status: 'in_progress',
        currentPick: 3, // Round 2, Pick 1 in snake draft
        draftOrder: ['team-1', 'team-2'],
        picks: [],
        settings: {
          pickTimeLimit: 120,
          draftFormat: 'snake',
          autoPickEnabled: false,
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const currentTeamId = draftService.getCurrentTeamId(draft);
      
      // In snake draft, round 2 reverses order, so pick 3 should be team-2
      expect(currentTeamId).toBe('team-2');
    });

    it('should return null for non-active draft', () => {
      const draft: Draft = {
        id: 'draft-123',
        leagueId: 'league-123',
        status: 'not_started',
        currentPick: 0,
        draftOrder: ['team-1', 'team-2'],
        picks: [],
        settings: {
          pickTimeLimit: 120,
          draftFormat: 'snake',
          autoPickEnabled: false,
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const currentTeamId = draftService.getCurrentTeamId(draft);
      expect(currentTeamId).toBeNull();
    });
  });

  describe('Draft Status Summary', () => {
    it('should provide correct draft status information', () => {
      const draft: Draft = {
        id: 'draft-123',
        leagueId: 'league-123',
        status: 'in_progress',
        currentPick: 3,
        draftOrder: ['team-1', 'team-2'],
        picks: [
          { pickNumber: 1, teamId: 'team-1', contestantId: 'c1', timestamp: '2024-01-01T00:00:00Z' },
          { pickNumber: 2, teamId: 'team-2', contestantId: 'c2', timestamp: '2024-01-01T00:01:00Z' },
        ],
        settings: {
          pickTimeLimit: 120,
          draftFormat: 'snake',
          autoPickEnabled: false,
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const status = draftService.getDraftStatus(draft);

      expect(status.isActive).toBe(true);
      expect(status.currentRound).toBe(2); // Pick 3 is in round 2
      expect(status.totalRounds).toBe(5);
      expect(status.picksRemaining).toBe(8); // 10 total - 2 made = 8 remaining
    });
  });
});