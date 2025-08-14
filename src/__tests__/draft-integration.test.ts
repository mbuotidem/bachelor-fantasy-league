import { DraftService } from '../services/draft-service';
import type { Draft, Team, Contestant } from '../types';

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

// Mock data
const mockTeams: Team[] = [
  { id: 'team1', name: 'Team Alpha', ownerId: 'user1', leagueId: 'league1', draftedContestants: [], createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'team2', name: 'Team Beta', ownerId: 'user2', leagueId: 'league1', draftedContestants: [], createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'team3', name: 'Team Gamma', ownerId: 'user3', leagueId: 'league1', draftedContestants: [], createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
];

const mockContestants: Contestant[] = [
  { id: 'contestant1', name: 'Alice', leagueId: 'league1', age: 25, hometown: 'NYC', totalPoints: 0, episodeScores: [], createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'contestant2', name: 'Bob', leagueId: 'league1', age: 27, hometown: 'LA', totalPoints: 0, episodeScores: [], createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'contestant3', name: 'Charlie', leagueId: 'league1', age: 24, hometown: 'Chicago', totalPoints: 0, episodeScores: [], createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
];

describe('Draft Integration Tests', () => {
  let draftService: DraftService;

  beforeEach(() => {
    jest.clearAllMocks();
    draftService = new DraftService();
    (draftService as any).client = mockClient;
  });

  it('should handle snake draft order correctly', async () => {
    const draft: Draft = {
      id: 'draft1',
      leagueId: 'league1',
      status: 'in_progress',
      currentPick: 1,
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

    // Test first round (normal order)
    expect(draftService.getCurrentTeamId({ ...draft, currentPick: 1 })).toBe('team1');
    expect(draftService.getCurrentTeamId({ ...draft, currentPick: 2 })).toBe('team2');
    expect(draftService.getCurrentTeamId({ ...draft, currentPick: 3 })).toBe('team3');

    // Test second round (reverse order)
    expect(draftService.getCurrentTeamId({ ...draft, currentPick: 4 })).toBe('team3');
    expect(draftService.getCurrentTeamId({ ...draft, currentPick: 5 })).toBe('team2');
    expect(draftService.getCurrentTeamId({ ...draft, currentPick: 6 })).toBe('team1');

    // Test third round (normal order again)
    expect(draftService.getCurrentTeamId({ ...draft, currentPick: 7 })).toBe('team1');
    expect(draftService.getCurrentTeamId({ ...draft, currentPick: 8 })).toBe('team2');
    expect(draftService.getCurrentTeamId({ ...draft, currentPick: 9 })).toBe('team3');
  });

  it('should get available contestants correctly', async () => {
    const draft: Draft = {
      id: 'draft1',
      leagueId: 'league1',
      status: 'in_progress',
      currentPick: 2,
      draftOrder: ['team1', 'team2', 'team3'],
      picks: [{
        pickNumber: 1,
        teamId: 'team1',
        contestantId: 'contestant1',
        timestamp: '2024-01-01T10:00:00Z',
      }],
      settings: {
        pickTimeLimit: 120,
        draftFormat: 'snake',
        autoPickEnabled: false,
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    jest.spyOn(draftService, 'getDraft').mockResolvedValue(draft);

    mockClient.models.Contestant.list.mockResolvedValue({
      data: mockContestants.map(c => ({
        ...c,
        isEliminated: false,
        eliminationEpisode: null,
        bio: null,
        profileImageUrl: null,
        occupation: null,
      })),
    });

    const availableContestants = await draftService.getAvailableContestants('league1', 'draft1');

    // Should return all contestants except the drafted one
    expect(availableContestants).toHaveLength(2);
    expect(availableContestants.find(c => c.id === 'contestant1')).toBeUndefined();
    expect(availableContestants.find(c => c.id === 'contestant2')).toBeDefined();
    expect(availableContestants.find(c => c.id === 'contestant3')).toBeDefined();
  });

  it('should calculate draft status correctly', () => {
    const draft: Draft = {
      id: 'draft1',
      leagueId: 'league1',
      status: 'in_progress',
      currentPick: 8, // Round 3, pick 2
      draftOrder: ['team1', 'team2', 'team3'],
      picks: new Array(7).fill(null).map((_, i) => ({
        pickNumber: i + 1,
        teamId: `team${(i % 3) + 1}`,
        contestantId: `contestant${i + 1}`,
        timestamp: '2024-01-01T10:00:00Z',
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
      currentTeamId: 'team2', // Round 3 (odd), position 2
      currentRound: 3,
      totalRounds: 5,
      picksRemaining: 8, // 15 total - 7 made = 8 remaining
    });
  });
});