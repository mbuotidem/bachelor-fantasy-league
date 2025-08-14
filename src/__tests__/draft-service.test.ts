import { DraftService } from '../services/draft-service';
import type { Draft, DraftPick, Team } from '../types';

// Mock the API client
const mockClient = {
  models: {
    Draft: {
      create: jest.fn(),
      get: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
    },
    Team: {
      list: jest.fn(),
      get: jest.fn(),
      update: jest.fn(),
    },
    Contestant: {
      get: jest.fn(),
      list: jest.fn(),
    },
  },
};

// Mock teams data
const mockTeams = [
  { id: 'team1', name: 'Team Alpha', ownerId: 'user1', leagueId: 'league1', draftedContestants: [] },
  { id: 'team2', name: 'Team Beta', ownerId: 'user2', leagueId: 'league1', draftedContestants: [] },
  { id: 'team3', name: 'Team Gamma', ownerId: 'user3', leagueId: 'league1', draftedContestants: [] },
];

// Mock contestants data
const mockContestants = [
  { id: 'contestant1', name: 'Alice', leagueId: 'league1', age: 25, hometown: 'NYC' },
  { id: 'contestant2', name: 'Bob', leagueId: 'league1', age: 27, hometown: 'LA' },
  { id: 'contestant3', name: 'Charlie', leagueId: 'league1', age: 24, hometown: 'Chicago' },
];

describe('DraftService', () => {
  let draftService: DraftService;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create service instance with mocked client
    draftService = new DraftService();
    (draftService as any).client = mockClient;
  });

  describe('createDraft', () => {
    it('should create a draft with randomized team order', async () => {
      // Setup mocks
      mockClient.models.Team.list.mockResolvedValue({
        data: mockTeams,
      });

      mockClient.models.Draft.create.mockResolvedValue({
        data: {
          id: 'draft1',
          leagueId: 'league1',
          status: 'not_started',
          currentPick: 0,
          draftOrder: ['team1', 'team2', 'team3'],
          picks: '[]',
          settings: JSON.stringify({
            pickTimeLimit: 120,
            draftFormat: 'snake',
            autoPickEnabled: false,
          }),
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      });

      const result = await draftService.createDraft({
        leagueId: 'league1',
      });

      expect(result).toMatchObject({
        id: 'draft1',
        leagueId: 'league1',
        status: 'not_started',
        currentPick: 0,
        picks: [],
        settings: {
          pickTimeLimit: 120,
          draftFormat: 'snake',
          autoPickEnabled: false,
        },
      });

      expect(result.draftOrder).toHaveLength(3);
      expect(result.draftOrder).toContain('team1');
      expect(result.draftOrder).toContain('team2');
      expect(result.draftOrder).toContain('team3');
    });

    it('should throw error if no teams exist', async () => {
      mockClient.models.Team.list.mockResolvedValue({
        data: [],
      });

      await expect(draftService.createDraft({
        leagueId: 'league1',
      })).rejects.toThrow('League must have teams before starting a draft');
    });
  });

  describe('getCurrentTeamId', () => {
    it('should return correct team for linear draft', () => {
      const draft: Draft = {
        id: 'draft1',
        leagueId: 'league1',
        status: 'in_progress',
        currentPick: 2,
        draftOrder: ['team1', 'team2', 'team3'],
        picks: [],
        settings: {
          pickTimeLimit: 120,
          draftFormat: 'linear',
          autoPickEnabled: false,
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const currentTeamId = draftService.getCurrentTeamId(draft);
      expect(currentTeamId).toBe('team2'); // Pick 2 = position 2 in round 1
    });

    it('should return correct team for snake draft - odd round', () => {
      const draft: Draft = {
        id: 'draft1',
        leagueId: 'league1',
        status: 'in_progress',
        currentPick: 2,
        draftOrder: ['team1', 'team2', 'team3'],
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
      expect(currentTeamId).toBe('team2'); // Pick 2 = position 2 in round 1 (odd round, normal order)
    });

    it('should return correct team for snake draft - even round', () => {
      const draft: Draft = {
        id: 'draft1',
        leagueId: 'league1',
        status: 'in_progress',
        currentPick: 5, // Round 2, position 2
        draftOrder: ['team1', 'team2', 'team3'],
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
      expect(currentTeamId).toBe('team2'); // Pick 5 = round 2, position 2, but reversed = team2
    });

    it('should return null for inactive draft', () => {
      const draft: Draft = {
        id: 'draft1',
        leagueId: 'league1',
        status: 'not_started',
        currentPick: 0,
        draftOrder: ['team1', 'team2', 'team3'],
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

  describe('getTeamPicks', () => {
    it('should return picks for specific team', () => {
      const picks: DraftPick[] = [
        {
          pickNumber: 1,
          teamId: 'team1',
          contestantId: 'contestant1',
          timestamp: '2024-01-01T00:00:00Z',
        },
        {
          pickNumber: 2,
          teamId: 'team2',
          contestantId: 'contestant2',
          timestamp: '2024-01-01T00:01:00Z',
        },
        {
          pickNumber: 3,
          teamId: 'team1',
          contestantId: 'contestant3',
          timestamp: '2024-01-01T00:02:00Z',
        },
      ];

      const draft: Draft = {
        id: 'draft1',
        leagueId: 'league1',
        status: 'in_progress',
        currentPick: 4,
        draftOrder: ['team1', 'team2', 'team3'],
        picks,
        settings: {
          pickTimeLimit: 120,
          draftFormat: 'snake',
          autoPickEnabled: false,
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const team1Picks = draftService.getTeamPicks(draft, 'team1');
      expect(team1Picks).toHaveLength(2);
      expect(team1Picks[0].contestantId).toBe('contestant1');
      expect(team1Picks[1].contestantId).toBe('contestant3');

      const team2Picks = draftService.getTeamPicks(draft, 'team2');
      expect(team2Picks).toHaveLength(1);
      expect(team2Picks[0].contestantId).toBe('contestant2');
    });
  });

  describe('getDraftStatus', () => {
    it('should return correct draft status', () => {
      const draft: Draft = {
        id: 'draft1',
        leagueId: 'league1',
        status: 'in_progress',
        currentPick: 7, // Round 3, pick 1
        draftOrder: ['team1', 'team2', 'team3'],
        picks: new Array(6).fill(null).map((_, i) => ({
          pickNumber: i + 1,
          teamId: `team${(i % 3) + 1}`,
          contestantId: `contestant${i + 1}`,
          timestamp: '2024-01-01T00:00:00Z',
        })),
        settings: {
          pickTimeLimit: 120,
          draftFormat: 'snake',
          autoPickEnabled: false,
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const status = draftService.getDraftStatus(draft);

      expect(status).toMatchObject({
        isActive: true,
        currentTeamId: 'team1', // Round 3 (odd), position 1
        currentRound: 3,
        totalRounds: 5,
        picksRemaining: 9, // 15 total picks - 6 made = 9 remaining
      });
    });
  });
});