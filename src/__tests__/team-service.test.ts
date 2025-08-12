import { TeamService } from '../services/team-service';
import { createMockTeam } from '../test-utils/factories';

// Mock the base service and API client
jest.mock('../services/base-service', () => ({
  BaseService: class MockBaseService {
    protected client = {
      models: {
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

describe('TeamService', () => {
  let teamService: TeamService;
  let mockClient: any;

  beforeEach(() => {
    teamService = new TeamService();
    mockClient = (teamService as any).client;
    jest.clearAllMocks();
  });

  describe('getUserTeams', () => {
    it('should filter teams by current user ID', async () => {
      const mockTeams = [
        createMockTeam({ ownerId: 'test-user-id', name: 'User Team 1' }),
        createMockTeam({ ownerId: 'test-user-id', name: 'User Team 2' }),
      ];

      mockClient.models.Team.list.mockResolvedValue({
        data: mockTeams.map(team => ({
          ...team,
          episodeScores: JSON.stringify(team.episodeScores),
        })),
      });

      const result = await teamService.getUserTeams();

      expect(mockClient.models.Team.list).toHaveBeenCalledWith({
        filter: { ownerId: { eq: 'test-user-id' } }
      });
      
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('User Team 1');
      expect(result[1].name).toBe('User Team 2');
    });

    it('should return empty array when user has no teams', async () => {
      mockClient.models.Team.list.mockResolvedValue({
        data: [],
      });

      const result = await teamService.getUserTeams();

      expect(mockClient.models.Team.list).toHaveBeenCalledWith({
        filter: { ownerId: { eq: 'test-user-id' } }
      });
      
      expect(result).toHaveLength(0);
    });

    it('should handle null data response', async () => {
      mockClient.models.Team.list.mockResolvedValue({
        data: null,
      });

      const result = await teamService.getUserTeams();

      expect(result).toHaveLength(0);
    });
  });
});