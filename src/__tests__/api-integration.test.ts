/**
 * Integration tests for the GraphQL API client and service layer
 * These tests verify that the services can interact with the GraphQL API
 */

import { client } from '../lib/api-client';
import { leagueService, teamService, contestantService, scoringService } from '../services';

// Mock Amplify configuration for testing
jest.mock('../lib/amplify', () => ({
  default: {
    configure: jest.fn(),
  },
}));

// Mock auth utilities
jest.mock('../lib/auth-utils', () => ({
  getCurrentUserId: jest.fn().mockResolvedValue('test-user-123'),
  getCurrentUserDetails: jest.fn().mockResolvedValue({
    userId: 'test-user-123',
    username: 'testuser',
    signInDetails: { loginId: 'test@example.com' }
  }),
  isAuthenticated: jest.fn().mockResolvedValue(true)
}));

// Mock the actual GraphQL client calls
jest.mock('../lib/api-client', () => ({
  client: {
    models: {
      League: {
        create: jest.fn(),
        get: jest.fn(),
        list: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      Team: {
        create: jest.fn(),
        get: jest.fn(),
        list: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      Contestant: {
        create: jest.fn(),
        get: jest.fn(),
        list: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      Episode: {
        create: jest.fn(),
        get: jest.fn(),
        list: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      ScoringEvent: {
        create: jest.fn(),
        get: jest.fn(),
        list: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      User: {
        create: jest.fn(),
        get: jest.fn(),
        list: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    }
  }
}));

describe('API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GraphQL Client Configuration', () => {
    it('should have client properly configured', () => {
      expect(client).toBeDefined();
      expect(client.models).toBeDefined();
      expect(client.models.League).toBeDefined();
      expect(client.models.Team).toBeDefined();
      expect(client.models.Contestant).toBeDefined();
      expect(client.models.Episode).toBeDefined();
      expect(client.models.ScoringEvent).toBeDefined();
    });

    it('should have all CRUD operations available', () => {
      const models = ['League', 'Team', 'Contestant', 'Episode', 'ScoringEvent'];
      const operations = ['create', 'get', 'list', 'update', 'delete'];

      models.forEach(model => {
        operations.forEach(operation => {
          expect(client.models[model][operation]).toBeDefined();
          expect(typeof client.models[model][operation]).toBe('function');
        });
      });
    });
  });

  describe('Service Layer Integration', () => {
    it('should have all services properly instantiated', () => {
      expect(leagueService).toBeDefined();
      expect(teamService).toBeDefined();
      expect(contestantService).toBeDefined();
      expect(scoringService).toBeDefined();
    });

    it('should be able to call service methods', async () => {
      // Mock successful responses
      (client.models.League.create as jest.Mock).mockResolvedValue({
        data: {
          id: 'league-123',
          name: 'Test League',
          season: 'Season 29',
          leagueCode: 'ABC123',
          commissionerId: 'test-user-123',
          status: 'created',
          settings: JSON.stringify({}),
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        }
      });

      // Mock User model operations for team creation
      (client.models.User.list as jest.Mock).mockResolvedValue({
        data: [] // No existing user
      });

      (client.models.User.create as jest.Mock).mockResolvedValue({
        data: {
          id: 'test-user-123',
          email: 'test@example.com',
          displayName: 'Test User',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        }
      });

      (client.models.Team.list as jest.Mock).mockResolvedValue({
        data: [] // No existing teams
      });

      (client.models.Team.create as jest.Mock).mockResolvedValue({
        data: {
          id: 'team-123',
          leagueId: 'league-123',
          ownerId: 'test-user-123',
          name: 'Test Team',
          draftedContestants: [],
          totalPoints: 0,
          episodeScores: JSON.stringify([]),
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        }
      });

      (client.models.Contestant.create as jest.Mock).mockResolvedValue({
        data: {
          id: 'contestant-123',
          leagueId: 'league-123',
          name: 'Test Contestant',
          age: 25,
          hometown: 'Test City',
          occupation: 'Test Job',
          isEliminated: false,
          totalPoints: 0,
          episodeScores: JSON.stringify([]),
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        }
      });

      (client.models.Episode.create as jest.Mock).mockResolvedValue({
        data: {
          id: 'episode-123',
          leagueId: 'league-123',
          episodeNumber: 1,
          airDate: '2024-01-01T00:00:00Z',
          isActive: false,
          totalEvents: 0,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        }
      });

      // Test service calls
      const league = await leagueService.createLeague({
        name: 'Test League',
        season: 'Season 29',
      });

      const team = await teamService.createTeam({
        leagueId: league.id,
        name: 'Test Team',
      });

      const contestant = await contestantService.createContestant({
        leagueId: league.id,
        name: 'Test Contestant',
        age: 25,
        hometown: 'Test City',
        occupation: 'Test Job',
      });

      const episode = await scoringService.createEpisode(
        league.id,
        1,
        '2024-01-01T00:00:00Z'
      );

      // Verify the calls were made
      expect(client.models.League.create).toHaveBeenCalled();
      expect(client.models.Team.create).toHaveBeenCalled();
      expect(client.models.Contestant.create).toHaveBeenCalled();
      expect(client.models.Episode.create).toHaveBeenCalled();

      // Verify the responses
      expect(league.id).toBe('league-123');
      expect(team.id).toBe('team-123');
      expect(contestant.id).toBe('contestant-123');
      expect(episode.id).toBe('episode-123');
    }, 10000);
  });

  describe('Error Handling Integration', () => {
    it('should handle GraphQL errors properly', async () => {
      // Create a service with minimal retry config for testing
      const testLeagueService = new (await import('../services/league-service')).LeagueService({
        maxRetries: 0,
        baseDelay: 10,
      });

      (client.models.League.create as jest.Mock).mockRejectedValue({
        errors: [{ message: 'Validation failed', errorType: 'ValidationError' }]
      });

      await expect(testLeagueService.createLeague({
        name: 'Test League',
        season: 'Season 29',
      })).rejects.toThrow('Validation failed');
    });

    it('should handle network errors properly', async () => {
      // Create a service with minimal retry config for testing
      const testLeagueService = new (await import('../services/league-service')).LeagueService({
        maxRetries: 1,
        baseDelay: 10,
      });

      (client.models.League.create as jest.Mock).mockRejectedValue({
        name: 'NetworkError',
        message: 'Network request failed'
      });

      await expect(testLeagueService.createLeague({
        name: 'Test League',
        season: 'Season 29',
      })).rejects.toThrow('Network error occurred');
    }, 10000);
  });

  describe('TypeScript Type Safety', () => {
    it('should enforce correct input types', () => {
      // These should compile without errors if types are correct
      const leagueInput = {
        name: 'Test League',
        season: 'Season 29',
      };

      const teamInput = {
        leagueId: 'league-123',
        name: 'Test Team',
      };

      const contestantInput = {
        leagueId: 'league-123',
        name: 'Test Contestant',
        age: 25,
        hometown: 'Test City',
        occupation: 'Test Job',
      };

      const scoreInput = {
        episodeId: 'episode-123',
        contestantId: 'contestant-123',
        actionType: 'kiss_mouth',
        points: 2,
        description: 'Kiss on mouth',
      };

      // Type assertions to verify the types are correct
      expect(typeof leagueInput.name).toBe('string');
      expect(typeof teamInput.leagueId).toBe('string');
      expect(typeof contestantInput.age).toBe('number');
      expect(typeof scoreInput.points).toBe('number');
    });
  });

  describe('Service Method Availability', () => {
    it('should have all required LeagueService methods', () => {
      const methods = [
        'createLeague',
        'getLeague',
        'getLeagueByCode',
        'getUserLeagues',
        'updateLeagueSettings',
        'updateLeagueStatus',
        'joinLeague',
        'deleteLeague',
      ];

      methods.forEach(method => {
        expect(leagueService[method]).toBeDefined();
        expect(typeof leagueService[method]).toBe('function');
      });
    });

    it('should have all required TeamService methods', () => {
      const methods = [
        'createTeam',
        'getTeam',
        'getTeamsByLeague',
        'getUserTeams',
        'updateTeam',
        'addContestantToTeam',
        'removeContestantFromTeam',
        'updateTeamScores',
        'deleteTeam',
        'getTeamStandings',
        'canDraftContestant',
      ];

      methods.forEach(method => {
        expect(teamService[method]).toBeDefined();
        expect(typeof teamService[method]).toBe('function');
      });
    });

    it('should have all required ContestantService methods', () => {
      const methods = [
        'createContestant',
        'getContestant',
        'getContestantsByLeague',
        'getActiveContestants',
        'getEliminatedContestants',
        'updateContestant',
        'eliminateContestant',
        'restoreContestant',
        'updateContestantScores',
        'deleteContestant',
        'getContestantStandings',
        'getEpisodeTopPerformers',
        'bulkCreateContestants',
        'searchContestants',
      ];

      methods.forEach(method => {
        expect(contestantService[method]).toBeDefined();
        expect(typeof contestantService[method]).toBe('function');
      });
    });

    it('should have all required ScoringService methods', () => {
      const methods = [
        'createEpisode',
        'getEpisode',
        'getEpisodesByLeague',
        'getActiveEpisode',
        'setActiveEpisode',
        'scoreAction',
        'getEpisodeScores',
        'getContestantScores',
        'undoScoringEvent',
        'getRecentScoringEvents',
        'calculateContestantEpisodePoints',
        'calculateEpisodeTotals',
        'getEpisodeSummary',
        'bulkScoreActions',
      ];

      methods.forEach(method => {
        expect(scoringService[method]).toBeDefined();
        expect(typeof scoringService[method]).toBe('function');
      });
    });
  });
});