import { LeagueService } from '../services/league-service';
import { createMockLeague, createMockTeam } from '../test-utils/factories';

// Mock the base service and API client
jest.mock('../services/base-service', () => ({
  BaseService: class MockBaseService {
    protected client = {
      models: {
        League: {
          list: jest.fn(),
          get: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
        },
        Team: {
          list: jest.fn(),
          get: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
        },
      },
    };
    
    protected async getCurrentUserId() {
      return 'test-user-id';
    }
    
    protected validateRequired() {}
    
    protected async withRetry(fn: () => Promise<any>) {
      return fn();
    }
  },
  ValidationError: class ValidationError extends Error {},
  NotFoundError: class NotFoundError extends Error {},
}));

describe('LeagueService', () => {
  let leagueService: LeagueService;
  let mockClient: any;

  beforeEach(() => {
    leagueService = new LeagueService();
    mockClient = (leagueService as any).client;
    jest.clearAllMocks();
  });

  describe('getUserLeagues', () => {
    it('should return leagues where user is commissioner', async () => {
      const commissionerLeague = {
        ...createMockLeague({ 
          commissionerId: 'test-user-id',
          name: 'Commissioner League'
        }),
        settings: JSON.stringify(createMockLeague().settings)
      };

      // Mock commissioner leagues
      mockClient.models.League.list.mockResolvedValueOnce({
        data: [commissionerLeague]
      });

      // Mock no teams
      mockClient.models.Team.list.mockResolvedValueOnce({
        data: []
      });

      const result = await leagueService.getUserLeagues();

      expect(mockClient.models.League.list).toHaveBeenCalledWith({
        filter: { commissionerId: { eq: 'test-user-id' } }
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Commissioner League');
    });

    it('should return leagues where user has teams', async () => {
      const teamLeague = {
        ...createMockLeague({ 
          id: 'league-with-team-id',
          name: 'Team League'
        }),
        settings: JSON.stringify(createMockLeague().settings)
      };

      const userTeam = createMockTeam({
        ownerId: 'test-user-id',
        leagueId: 'league-with-team-id',
        name: 'User Team'
      });

      // Mock no commissioner leagues
      mockClient.models.League.list.mockResolvedValueOnce({
        data: []
      });

      // Mock user teams
      mockClient.models.Team.list.mockResolvedValueOnce({
        data: [userTeam]
      });

      // Mock individual league lookup
      mockClient.models.League.get.mockResolvedValueOnce({
        data: teamLeague
      });

      const result = await leagueService.getUserLeagues();

      expect(mockClient.models.Team.list).toHaveBeenCalledWith({
        filter: { ownerId: { eq: 'test-user-id' } }
      });

      expect(mockClient.models.League.get).toHaveBeenCalledWith({
        id: 'league-with-team-id'
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Team League');
    });

    it('should return both commissioner and team leagues without duplicates', async () => {
      const sharedLeague = {
        ...createMockLeague({ 
          id: 'shared-league-id',
          commissionerId: 'test-user-id',
          name: 'Shared League'
        }),
        settings: JSON.stringify(createMockLeague().settings)
      };

      const teamOnlyLeague = {
        ...createMockLeague({ 
          id: 'team-only-league-id',
          name: 'Team Only League'
        }),
        settings: JSON.stringify(createMockLeague().settings)
      };

      const userTeam = createMockTeam({
        ownerId: 'test-user-id',
        leagueId: 'shared-league-id', // Same league as commissioner
        name: 'User Team'
      });

      const userTeam2 = createMockTeam({
        ownerId: 'test-user-id',
        leagueId: 'team-only-league-id',
        name: 'User Team 2'
      });

      // Mock commissioner leagues (includes shared league)
      mockClient.models.League.list.mockResolvedValueOnce({
        data: [sharedLeague]
      });

      // Mock user teams (includes teams in both shared and team-only leagues)
      mockClient.models.Team.list.mockResolvedValueOnce({
        data: [userTeam, userTeam2]
      });

      // Mock individual league lookups
      mockClient.models.League.get
        .mockResolvedValueOnce({ data: sharedLeague }) // First lookup returns shared league
        .mockResolvedValueOnce({ data: teamOnlyLeague }); // Second lookup returns team-only league

      const result = await leagueService.getUserLeagues();

      expect(result).toHaveLength(2); // Should deduplicate shared league
      expect(result.map(l => l.name).sort()).toEqual(['Shared League', 'Team Only League']);
    });

    it('should handle multiple teams in the same league', async () => {
      const league = {
        ...createMockLeague({ 
          id: 'multi-team-league-id',
          name: 'Multi Team League'
        }),
        settings: JSON.stringify(createMockLeague().settings)
      };

      const userTeam1 = createMockTeam({
        ownerId: 'test-user-id',
        leagueId: 'multi-team-league-id',
        name: 'User Team 1'
      });

      const userTeam2 = createMockTeam({
        ownerId: 'test-user-id',
        leagueId: 'multi-team-league-id',
        name: 'User Team 2'
      });

      // Mock no commissioner leagues
      mockClient.models.League.list.mockResolvedValueOnce({
        data: []
      });

      // Mock multiple teams in same league
      mockClient.models.Team.list.mockResolvedValueOnce({
        data: [userTeam1, userTeam2]
      });

      // Mock individual league lookups (same league ID appears twice)
      mockClient.models.League.get
        .mockResolvedValueOnce({ data: league })
        .mockResolvedValueOnce({ data: league });

      const result = await leagueService.getUserLeagues();

      expect(mockClient.models.League.get).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(1); // Should deduplicate the same league
      expect(result[0].name).toBe('Multi Team League');
    });

    it('should handle leagues that no longer exist', async () => {
      const existingLeague = {
        ...createMockLeague({ 
          id: 'existing-league-id',
          name: 'Existing League'
        }),
        settings: JSON.stringify(createMockLeague().settings)
      };

      const userTeam1 = createMockTeam({
        ownerId: 'test-user-id',
        leagueId: 'existing-league-id',
        name: 'Team in Existing League'
      });

      const userTeam2 = createMockTeam({
        ownerId: 'test-user-id',
        leagueId: 'deleted-league-id',
        name: 'Team in Deleted League'
      });

      // Mock no commissioner leagues
      mockClient.models.League.list.mockResolvedValueOnce({
        data: []
      });

      // Mock teams pointing to both existing and deleted leagues
      mockClient.models.Team.list.mockResolvedValueOnce({
        data: [userTeam1, userTeam2]
      });

      // Mock individual league lookups - one succeeds, one fails
      mockClient.models.League.get
        .mockResolvedValueOnce({ data: existingLeague }) // First lookup succeeds
        .mockResolvedValueOnce({ data: null }); // Second lookup returns null (deleted league)

      const result = await leagueService.getUserLeagues();

      expect(result).toHaveLength(1); // Should only return existing league
      expect(result[0].name).toBe('Existing League');
    });

    it('should handle errors when looking up individual leagues', async () => {
      const userTeam = createMockTeam({
        ownerId: 'test-user-id',
        leagueId: 'error-league-id',
        name: 'Team with Error League'
      });

      // Mock no commissioner leagues
      mockClient.models.League.list.mockResolvedValueOnce({
        data: []
      });

      // Mock user teams
      mockClient.models.Team.list.mockResolvedValueOnce({
        data: [userTeam]
      });

      // Mock league lookup throwing an error
      mockClient.models.League.get.mockRejectedValueOnce(new Error('League lookup failed'));

      const result = await leagueService.getUserLeagues();

      expect(result).toHaveLength(0); // Should handle error gracefully
    });

    it('should return empty array when user has no leagues or teams', async () => {
      // Mock no commissioner leagues
      mockClient.models.League.list.mockResolvedValueOnce({
        data: []
      });

      // Mock no teams
      mockClient.models.Team.list.mockResolvedValueOnce({
        data: []
      });

      const result = await leagueService.getUserLeagues();

      expect(result).toHaveLength(0);
    });

    it('should handle null data responses gracefully', async () => {
      // Mock null responses
      mockClient.models.League.list.mockResolvedValueOnce({
        data: null
      });

      mockClient.models.Team.list.mockResolvedValueOnce({
        data: null
      });

      const result = await leagueService.getUserLeagues();

      expect(result).toHaveLength(0);
    });
  });

  describe('joinLeague', () => {
    it('should create team with correct league ID', async () => {
      const league = {
        ...createMockLeague({
          id: 'target-league-id',
          leagueCode: 'ABC123',
          status: 'created'
        }),
        settings: JSON.stringify(createMockLeague().settings)
      };

      const createdTeam = createMockTeam({
        id: 'new-team-id',
        leagueId: 'target-league-id',
        ownerId: 'test-user-id',
        name: 'New Team'
      });

      // Mock getLeagueByCode
      mockClient.models.League.list.mockResolvedValueOnce({
        data: [league]
      });

      // Mock team creation
      mockClient.models.Team.create.mockResolvedValueOnce({
        data: createdTeam
      });

      const result = await leagueService.joinLeague({
        leagueCode: 'ABC123',
        teamName: 'New Team'
      });

      expect(mockClient.models.Team.create).toHaveBeenCalledWith({
        leagueId: 'target-league-id',
        ownerId: 'test-user-id',
        name: 'New Team',
        draftedContestants: [],
        totalPoints: 0,
        episodeScores: JSON.stringify([]),
      });

      expect(result.league.id).toBe('target-league-id');
      expect(result.teamId).toBe('new-team-id');
    });
  });
});