import { LeagueService } from '../services/league-service';
import { TeamService } from '../services/team-service';
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

describe('League Joining Integration Tests', () => {
  let leagueService: LeagueService;
  let teamService: TeamService;
  let mockLeagueClient: any;
  let mockTeamClient: any;

  beforeEach(() => {
    leagueService = new LeagueService();
    teamService = new TeamService();
    mockLeagueClient = (leagueService as any).client.models.League;
    mockTeamClient = (leagueService as any).client.models.Team; // Use the same client instance
    jest.clearAllMocks();
  });

  describe('Complete League Joining Flow', () => {
    it('should successfully join a league and immediately show it in user leagues', async () => {
      const targetLeague = {
        ...createMockLeague({
          id: 'target-league-id',
          leagueCode: 'ABC123',
          name: 'Test League',
          status: 'created',
          commissionerId: 'other-user-id'
        }),
        settings: JSON.stringify(createMockLeague().settings)
      };

      const createdTeam = createMockTeam({
        id: 'new-team-id',
        leagueId: 'target-league-id',
        ownerId: 'test-user-id',
        name: 'My Team'
      });

      // Step 1: Mock finding league by code
      mockLeagueClient.list.mockResolvedValueOnce({
        data: [targetLeague]
      });

      // Step 2: Mock team creation
      mockTeamClient.create.mockResolvedValue({
        data: createdTeam
      });

      // Step 3: Mock getUserLeagues calls after joining
      // First call: no commissioner leagues
      mockLeagueClient.list.mockResolvedValueOnce({
        data: []
      });
      
      // Second call: user teams (including newly created team)
      mockTeamClient.list.mockResolvedValueOnce({
        data: [createdTeam]
      });

      // Third call: individual league lookup for the team
      mockLeagueClient.get.mockResolvedValueOnce({
        data: targetLeague
      });

      // Execute the joining flow
      const joinResult = await leagueService.joinLeague({
        leagueCode: 'ABC123',
        teamName: 'My Team'
      });

      // Verify join was successful
      expect(joinResult.league.id).toBe('target-league-id');
      expect(joinResult.teamId).toBe('new-team-id');

      // Verify the user can now see this league in their leagues
      const userLeagues = await leagueService.getUserLeagues();
      expect(userLeagues).toHaveLength(1);
      expect(userLeagues[0].id).toBe('target-league-id');
      expect(userLeagues[0].name).toBe('Test League');
    });

    it('should handle joining a league where user is already commissioner', async () => {
      const targetLeague = {
        ...createMockLeague({
          id: 'commissioner-league-id',
          leagueCode: 'DEF456',
          name: 'Commissioner League',
          status: 'created',
          commissionerId: 'test-user-id' // User is commissioner
        }),
        settings: JSON.stringify(createMockLeague().settings)
      };

      const createdTeam = createMockTeam({
        id: 'commissioner-team-id',
        leagueId: 'commissioner-league-id',
        ownerId: 'test-user-id',
        name: 'Commissioner Team'
      });

      // Mock finding league by code
      mockLeagueClient.list.mockResolvedValueOnce({
        data: [targetLeague]
      });

      // Mock team creation
      mockTeamClient.create.mockResolvedValue({
        data: createdTeam
      });

      // Mock getUserLeagues calls - user is both commissioner and has team
      mockLeagueClient.list.mockResolvedValueOnce({
        data: [targetLeague] // Commissioner leagues
      });
      
      mockTeamClient.list.mockResolvedValueOnce({
        data: [createdTeam] // User teams
      });

      mockLeagueClient.get.mockResolvedValueOnce({
        data: targetLeague // Individual lookup
      });

      // Execute the joining flow
      const joinResult = await leagueService.joinLeague({
        leagueCode: 'DEF456',
        teamName: 'Commissioner Team'
      });

      expect(joinResult.league.id).toBe('commissioner-league-id');

      // Verify deduplication - should only show league once
      const userLeagues = await leagueService.getUserLeagues();
      expect(userLeagues).toHaveLength(1);
      expect(userLeagues[0].id).toBe('commissioner-league-id');
    });

    it('should prevent joining a league that is not in created status', async () => {
      const inactiveLeague = {
        ...createMockLeague({
          id: 'inactive-league-id',
          leagueCode: 'GHI789',
          name: 'Inactive League',
          status: 'active' // Not 'created'
        }),
        settings: JSON.stringify(createMockLeague().settings)
      };

      // Mock finding league by code
      mockLeagueClient.list.mockResolvedValueOnce({
        data: [inactiveLeague]
      });

      // Attempt to join should fail
      await expect(leagueService.joinLeague({
        leagueCode: 'GHI789',
        teamName: 'My Team'
      })).rejects.toThrow('League is not accepting new members');

      // Verify no team was created
      expect(mockTeamClient.create).not.toHaveBeenCalled();
    });

    it('should handle multiple teams in the same league correctly', async () => {
      const sharedLeague = {
        ...createMockLeague({
          id: 'shared-league-id',
          leagueCode: 'JKL012',
          name: 'Shared League',
          status: 'created'
        }),
        settings: JSON.stringify(createMockLeague().settings)
      };

      const firstTeam = createMockTeam({
        id: 'first-team-id',
        leagueId: 'shared-league-id',
        ownerId: 'test-user-id',
        name: 'First Team'
      });

      const secondTeam = createMockTeam({
        id: 'second-team-id',
        leagueId: 'shared-league-id',
        ownerId: 'test-user-id',
        name: 'Second Team'
      });

      // Mock first join
      mockLeagueClient.list.mockResolvedValueOnce({
        data: [sharedLeague]
      });
      mockTeamClient.create.mockResolvedValueOnce({
        data: firstTeam
      });

      // Join first time
      const firstJoin = await leagueService.joinLeague({
        leagueCode: 'JKL012',
        teamName: 'First Team'
      });

      expect(firstJoin.teamId).toBe('first-team-id');

      // Mock second join (same league, different team name)
      mockLeagueClient.list.mockResolvedValueOnce({
        data: [sharedLeague]
      });
      mockTeamClient.create.mockResolvedValueOnce({
        data: secondTeam
      });

      // Join second time
      const secondJoin = await leagueService.joinLeague({
        leagueCode: 'JKL012',
        teamName: 'Second Team'
      });

      expect(secondJoin.teamId).toBe('second-team-id');

      // Mock getUserLeagues with both teams
      mockLeagueClient.list.mockResolvedValueOnce({
        data: [] // No commissioner leagues
      });
      
      mockTeamClient.list.mockResolvedValueOnce({
        data: [firstTeam, secondTeam] // Both teams
      });

      // Mock individual lookups (same league returned twice)
      mockLeagueClient.get
        .mockResolvedValueOnce({ data: sharedLeague })
        .mockResolvedValueOnce({ data: sharedLeague });

      // Verify league appears only once despite multiple teams
      const userLeagues = await leagueService.getUserLeagues();
      expect(userLeagues).toHaveLength(1);
      expect(userLeagues[0].id).toBe('shared-league-id');
    });

    it('should handle team creation failure gracefully', async () => {
      const targetLeague = {
        ...createMockLeague({
          id: 'target-league-id',
          leagueCode: 'MNO345',
          name: 'Target League',
          status: 'created'
        }),
        settings: JSON.stringify(createMockLeague().settings)
      };

      // Mock finding league by code
      mockLeagueClient.list.mockResolvedValueOnce({
        data: [targetLeague]
      });

      // Mock team creation failure - should fail before reaching the response check
      mockTeamClient.create.mockRejectedValueOnce(new Error('Team creation failed'));

      // Attempt to join should fail
      await expect(leagueService.joinLeague({
        leagueCode: 'MNO345',
        teamName: 'My Team'
      })).rejects.toThrow('Team creation failed');
    });

    it('should validate team name requirements', async () => {
      const targetLeague = {
        ...createMockLeague({
          id: 'target-league-id',
          leagueCode: 'PQR678',
          name: 'Target League',
          status: 'created'
        }),
        settings: JSON.stringify(createMockLeague().settings)
      };

      // Mock finding league by code
      mockLeagueClient.list.mockResolvedValueOnce({
        data: [targetLeague]
      });

      // Test empty team name
      await expect(leagueService.joinLeague({
        leagueCode: 'PQR678',
        teamName: ''
      })).rejects.toThrow();

      // Test whitespace-only team name
      await expect(leagueService.joinLeague({
        leagueCode: 'PQR678',
        teamName: '   '
      })).rejects.toThrow();

      // Verify no team creation attempts were made
      expect(mockTeamClient.create).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle league code that does not exist', async () => {
      // Mock empty result for non-existent code
      mockLeagueClient.list.mockResolvedValueOnce({
        data: []
      });

      await expect(leagueService.getLeagueByCode('NONEXISTENT')).rejects.toThrow('League with code');
    });

    it('should handle database connection issues during join', async () => {
      // Mock database error
      mockLeagueClient.list.mockRejectedValueOnce(new Error('Database connection failed'));

      await expect(leagueService.joinLeague({
        leagueCode: 'ABC123',
        teamName: 'My Team'
      })).rejects.toThrow('Database connection failed');
    });

    it('should handle concurrent joins to the same league', async () => {
      const targetLeague = {
        ...createMockLeague({
          id: 'concurrent-league-id',
          leagueCode: 'STU901',
          name: 'Concurrent League',
          status: 'created'
        }),
        settings: JSON.stringify(createMockLeague().settings)
      };

      const team1 = createMockTeam({
        id: 'team-1-id',
        leagueId: 'concurrent-league-id',
        ownerId: 'test-user-id',
        name: 'Team 1'
      });

      const team2 = createMockTeam({
        id: 'team-2-id',
        leagueId: 'concurrent-league-id',
        ownerId: 'test-user-id',
        name: 'Team 2'
      });

      // Mock concurrent league lookups
      mockLeagueClient.list
        .mockResolvedValueOnce({ data: [targetLeague] })
        .mockResolvedValueOnce({ data: [targetLeague] });

      // Mock concurrent team creations
      mockTeamClient.create
        .mockResolvedValueOnce({ data: team1 })
        .mockResolvedValueOnce({ data: team2 });

      // Execute concurrent joins
      const [result1, result2] = await Promise.all([
        leagueService.joinLeague({
          leagueCode: 'STU901',
          teamName: 'Team 1'
        }),
        leagueService.joinLeague({
          leagueCode: 'STU901',
          teamName: 'Team 2'
        })
      ]);

      expect(result1.teamId).toBe('team-1-id');
      expect(result2.teamId).toBe('team-2-id');
      expect(mockTeamClient.create).toHaveBeenCalledTimes(2);
    });
  });
});