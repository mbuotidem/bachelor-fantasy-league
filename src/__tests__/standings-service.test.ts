import { StandingsService } from '../services/standings-service';
import { TeamService } from '../services/team-service';
import { ContestantService } from '../services/contestant-service';
import { LeagueService } from '../services/league-service';
import { ScoringService } from '../services/scoring-service';
import { Team, Contestant, TeamStanding, ContestantStanding } from '../types';

// Mock the services
jest.mock('../services/team-service');
jest.mock('../services/contestant-service');
jest.mock('../services/league-service');
jest.mock('../services/scoring-service');

const MockedTeamService = TeamService as jest.MockedClass<typeof TeamService>;
const MockedContestantService = ContestantService as jest.MockedClass<typeof ContestantService>;
const MockedLeagueService = LeagueService as jest.MockedClass<typeof LeagueService>;
const MockedScoringService = ScoringService as jest.MockedClass<typeof ScoringService>;

describe('StandingsService', () => {
  let standingsService: StandingsService;
  let mockTeamService: jest.Mocked<TeamService>;
  let mockContestantService: jest.Mocked<ContestantService>;
  let mockLeagueService: jest.Mocked<LeagueService>;
  let mockScoringService: jest.Mocked<ScoringService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockTeamService = new MockedTeamService() as jest.Mocked<TeamService>;
    mockContestantService = new MockedContestantService() as jest.Mocked<ContestantService>;
    mockLeagueService = new MockedLeagueService() as jest.Mocked<LeagueService>;
    mockScoringService = new MockedScoringService() as jest.Mocked<ScoringService>;
    
    standingsService = new StandingsService();
    
    // Replace the service instances
    (standingsService as any).teamService = mockTeamService;
    (standingsService as any).contestantService = mockContestantService;
    (standingsService as any).leagueService = mockLeagueService;
    (standingsService as any).scoringService = mockScoringService;
    
    // Mock scoring service to return empty arrays (no scoring events)
    mockScoringService.getContestantScores.mockResolvedValue([]);
  });

  describe('getTeamStandings', () => {
    const mockTeams: Team[] = [
      {
        id: 'team-1',
        leagueId: 'league-123',
        ownerId: 'user-1',
        name: 'Team Alpha',
        draftedContestants: ['contestant-1', 'contestant-2'],
        totalPoints: 150,
        episodeScores: [
          { episodeId: 'ep-1', episodeNumber: 1, points: 50, events: [] },
          { episodeId: 'ep-2', episodeNumber: 2, points: 100, events: [] }
        ],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      },
      {
        id: 'team-2',
        leagueId: 'league-123',
        ownerId: 'user-2',
        name: 'Team Beta',
        draftedContestants: ['contestant-3', 'contestant-4'],
        totalPoints: 200,
        episodeScores: [
          { episodeId: 'ep-1', episodeNumber: 1, points: 75, events: [] },
          { episodeId: 'ep-2', episodeNumber: 2, points: 125, events: [] }
        ],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      }
    ];

    const mockContestants: Contestant[] = [
      {
        id: 'contestant-1',
        leagueId: 'league-123',
        name: 'Alice',
        totalPoints: 75,
        isEliminated: false,
        episodeScores: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      },
      {
        id: 'contestant-2',
        leagueId: 'league-123',
        name: 'Bob',
        totalPoints: 75,
        isEliminated: false,
        episodeScores: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      },
      {
        id: 'contestant-3',
        leagueId: 'league-123',
        name: 'Charlie',
        totalPoints: 100,
        isEliminated: false,
        episodeScores: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      },
      {
        id: 'contestant-4',
        leagueId: 'league-123',
        name: 'Diana',
        totalPoints: 100,
        isEliminated: true,
        episodeScores: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      }
    ];

    beforeEach(() => {
      mockTeamService.getTeamsByLeague.mockResolvedValue(mockTeams);
      mockContestantService.getContestantsByLeague.mockResolvedValue(mockContestants);
    });

    it('should return team standings sorted by total points descending', async () => {
      const result = await standingsService.getTeamStandings('league-123');

      expect(result).toHaveLength(2);
      expect(result[0].teamName).toBe('Team Beta');
      expect(result[0].totalPoints).toBe(200);
      expect(result[0].rank).toBe(1);
      expect(result[1].teamName).toBe('Team Alpha');
      expect(result[1].totalPoints).toBe(150);
      expect(result[1].rank).toBe(2);
    });

    it('should include contestant summaries for each team', async () => {
      const result = await standingsService.getTeamStandings('league-123');

      expect(result[0].contestants).toHaveLength(2);
      expect(result[0].contestants[0].name).toBe('Charlie');
      expect(result[0].contestants[0].points).toBe(100);
      expect(result[0].contestants[0].isEliminated).toBe(false);
      expect(result[0].contestants[1].name).toBe('Diana');
      expect(result[0].contestants[1].isEliminated).toBe(true);
    });

    it('should calculate episode points from most recent episode', async () => {
      const result = await standingsService.getTeamStandings('league-123');

      expect(result[0].episodePoints).toBe(125); // Team Beta's most recent episode
      expect(result[1].episodePoints).toBe(100); // Team Alpha's most recent episode
    });

    it('should handle teams with no episode scores', async () => {
      const teamsWithoutScores = mockTeams.map(team => ({
        ...team,
        episodeScores: []
      }));
      mockTeamService.getTeamsByLeague.mockResolvedValue(teamsWithoutScores);

      const result = await standingsService.getTeamStandings('league-123');

      expect(result[0].episodePoints).toBe(0);
      expect(result[1].episodePoints).toBe(0);
    });

    it('should handle missing contestants gracefully', async () => {
      const teamsWithMissingContestants = [{
        ...mockTeams[0],
        draftedContestants: ['contestant-1', 'missing-contestant']
      }];
      mockTeamService.getTeamsByLeague.mockResolvedValue(teamsWithMissingContestants);

      const result = await standingsService.getTeamStandings('league-123');

      expect(result[0].contestants).toHaveLength(1);
      expect(result[0].contestants[0].name).toBe('Alice');
    });
  });

  describe('getContestantStandings', () => {
    const mockContestants: Contestant[] = [
      {
        id: 'contestant-1',
        leagueId: 'league-123',
        name: 'Alice',
        totalPoints: 150,
        isEliminated: false,
        episodeScores: [
          { episodeId: 'ep-1', episodeNumber: 1, points: 50, events: [] },
          { episodeId: 'ep-2', episodeNumber: 2, points: 100, events: [] }
        ],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      },
      {
        id: 'contestant-2',
        leagueId: 'league-123',
        name: 'Bob',
        totalPoints: 200,
        isEliminated: true,
        episodeScores: [
          { episodeId: 'ep-1', episodeNumber: 1, points: 75, events: [] },
          { episodeId: 'ep-2', episodeNumber: 2, points: 125, events: [] }
        ],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      }
    ];

    const mockTeams: Team[] = [
      {
        id: 'team-1',
        leagueId: 'league-123',
        ownerId: 'user-1',
        name: 'Team Alpha',
        draftedContestants: ['contestant-1'],
        totalPoints: 150,
        episodeScores: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      },
      {
        id: 'team-2',
        leagueId: 'league-123',
        ownerId: 'user-2',
        name: 'Team Beta',
        draftedContestants: ['contestant-2'],
        totalPoints: 200,
        episodeScores: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
      }
    ];

    beforeEach(() => {
      mockContestantService.getContestantsByLeague.mockResolvedValue(mockContestants);
      mockTeamService.getTeamsByLeague.mockResolvedValue(mockTeams);
    });

    it('should return contestant standings sorted by total points descending', async () => {
      const result = await standingsService.getContestantStandings('league-123');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Bob');
      expect(result[0].totalPoints).toBe(200);
      expect(result[0].rank).toBe(1);
      expect(result[1].name).toBe('Alice');
      expect(result[1].totalPoints).toBe(150);
      expect(result[1].rank).toBe(2);
    });

    it('should include elimination status', async () => {
      const result = await standingsService.getContestantStandings('league-123');

      expect(result[0].isEliminated).toBe(true);
      expect(result[1].isEliminated).toBe(false);
    });

    it('should include teams that drafted each contestant', async () => {
      const result = await standingsService.getContestantStandings('league-123');

      expect(result[0].draftedByTeams).toEqual(['Team Beta']);
      expect(result[1].draftedByTeams).toEqual(['Team Alpha']);
    });

    it('should calculate episode points from most recent episode', async () => {
      const result = await standingsService.getContestantStandings('league-123');

      expect(result[0].episodePoints).toBe(125); // Bob's most recent episode
      expect(result[1].episodePoints).toBe(100); // Alice's most recent episode
    });

    it('should handle contestants drafted by multiple teams', async () => {
      const teamsWithSharedContestant = [
        ...mockTeams,
        {
          id: 'team-3',
          leagueId: 'league-123',
          ownerId: 'user-3',
          name: 'Team Gamma',
          draftedContestants: ['contestant-1'],
          totalPoints: 100,
          episodeScores: [],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z'
        }
      ];
      mockTeamService.getTeamsByLeague.mockResolvedValue(teamsWithSharedContestant);

      const result = await standingsService.getContestantStandings('league-123');

      expect(result[1].draftedByTeams).toEqual(['Team Alpha', 'Team Gamma']);
    });
  });

  describe('getCurrentEpisodeTopPerformers', () => {
    it('should return top performers sorted by episode points', async () => {
      const mockStandings: ContestantStanding[] = [
        {
          contestantId: 'contestant-1',
          name: 'Alice',
          totalPoints: 100,
          rank: 2,
          episodePoints: 50,
          isEliminated: false,
          draftedByTeams: ['Team Alpha']
        },
        {
          contestantId: 'contestant-2',
          name: 'Bob',
          totalPoints: 150,
          rank: 1,
          episodePoints: 75,
          isEliminated: false,
          draftedByTeams: ['Team Beta']
        },
        {
          contestantId: 'contestant-3',
          name: 'Charlie',
          totalPoints: 80,
          rank: 3,
          episodePoints: 0,
          isEliminated: true,
          draftedByTeams: ['Team Gamma']
        }
      ];

      // Mock the getContestantStandings method
      jest.spyOn(standingsService, 'getContestantStandings').mockResolvedValue(mockStandings);

      const result = await standingsService.getCurrentEpisodeTopPerformers('league-123', 2);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Bob');
      expect(result[0].episodePoints).toBe(75);
      expect(result[1].name).toBe('Alice');
      expect(result[1].episodePoints).toBe(50);
    });

    it('should filter out contestants with zero episode points', async () => {
      const mockStandings: ContestantStanding[] = [
        {
          contestantId: 'contestant-1',
          name: 'Alice',
          totalPoints: 100,
          rank: 1,
          episodePoints: 0,
          isEliminated: false,
          draftedByTeams: ['Team Alpha']
        }
      ];

      jest.spyOn(standingsService, 'getContestantStandings').mockResolvedValue(mockStandings);

      const result = await standingsService.getCurrentEpisodeTopPerformers('league-123', 5);

      expect(result).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should handle team service errors', async () => {
      mockTeamService.getTeamsByLeague.mockRejectedValue(new Error('Team service error'));

      await expect(standingsService.getTeamStandings('league-123')).rejects.toThrow();
    });

    it('should handle contestant service errors', async () => {
      mockContestantService.getContestantsByLeague.mockRejectedValue(new Error('Contestant service error'));

      await expect(standingsService.getContestantStandings('league-123')).rejects.toThrow();
    });
  });
});