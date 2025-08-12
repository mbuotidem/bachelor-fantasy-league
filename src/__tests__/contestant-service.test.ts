import { ContestantService } from '../services/contestant-service';
import { createMockContestant } from '../test-utils/factories';

// Mock the base service and API client
jest.mock('../services/base-service', () => ({
  BaseService: class MockBaseService {
    protected client = {
      models: {
        Contestant: {
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

// Mock the storage service
jest.mock('../services/storage-service', () => ({
  StorageService: class MockStorageService {
    async uploadContestantPhoto() {
      return { key: 'test-key', url: 'https://test-url.com/photo.jpg' };
    }
    
    validateImageFile() {
      return { isValid: true };
    }
    
    generatePreviewUrl() {
      return 'blob:test-preview-url';
    }
    
    revokePreviewUrl() {}
  },
}));

describe('ContestantService', () => {
  let contestantService: ContestantService;
  let mockClient: any;

  beforeEach(() => {
    contestantService = new ContestantService();
    mockClient = (contestantService as any).client;
    jest.clearAllMocks();
  });

  describe('createContestant', () => {
    it('should create a contestant with required fields', async () => {
      const input = {
        leagueId: 'league-123',
        name: 'Sarah Johnson',
      };

      const mockResponse = {
        ...createMockContestant(input),
        episodeScores: JSON.stringify([])
      };

      mockClient.models.Contestant.create.mockResolvedValueOnce({
        data: mockResponse
      });

      const result = await contestantService.createContestant(input);

      expect(mockClient.models.Contestant.create).toHaveBeenCalledWith({
        leagueId: 'league-123',
        name: 'Sarah Johnson',
        age: undefined,
        hometown: undefined,
        occupation: undefined,
        bio: undefined,
        isEliminated: false,
        totalPoints: 0,
        episodeScores: JSON.stringify([]),
      });

      expect(result.name).toBe('Sarah Johnson');
      expect(result.leagueId).toBe('league-123');
      expect(result.isEliminated).toBe(false);
      expect(result.totalPoints).toBe(0);
    });

    it('should create a contestant with all optional fields', async () => {
      const input = {
        leagueId: 'league-123',
        name: 'Sarah Johnson',
        age: 28,
        hometown: 'Los Angeles, CA',
        occupation: 'Marketing Manager',
        bio: 'Loves adventure and finding true love',
      };

      const mockResponse = {
        ...createMockContestant(input),
        episodeScores: JSON.stringify([])
      };

      mockClient.models.Contestant.create.mockResolvedValueOnce({
        data: mockResponse
      });

      const result = await contestantService.createContestant(input);

      expect(mockClient.models.Contestant.create).toHaveBeenCalledWith({
        leagueId: 'league-123',
        name: 'Sarah Johnson',
        age: 28,
        hometown: 'Los Angeles, CA',
        occupation: 'Marketing Manager',
        bio: 'Loves adventure and finding true love',
        isEliminated: false,
        totalPoints: 0,
        episodeScores: JSON.stringify([]),
      });

      expect(result.age).toBe(28);
      expect(result.hometown).toBe('Los Angeles, CA');
      expect(result.occupation).toBe('Marketing Manager');
      expect(result.bio).toBe('Loves adventure and finding true love');
    });

    it('should throw error when creation fails', async () => {
      const input = {
        leagueId: 'league-123',
        name: 'Sarah Johnson',
      };

      mockClient.models.Contestant.create.mockResolvedValueOnce({
        data: null
      });

      await expect(contestantService.createContestant(input)).rejects.toThrow('Failed to create contestant');
    });
  });

  describe('getContestant', () => {
    it('should return contestant by ID', async () => {
      const mockContestant = {
        ...createMockContestant({ id: 'contestant-123' }),
        episodeScores: JSON.stringify([])
      };

      mockClient.models.Contestant.get.mockResolvedValueOnce({
        data: mockContestant
      });

      const result = await contestantService.getContestant('contestant-123');

      expect(mockClient.models.Contestant.get).toHaveBeenCalledWith({
        id: 'contestant-123'
      });

      expect(result.id).toBe('contestant-123');
    });

    it('should throw NotFoundError when contestant does not exist', async () => {
      mockClient.models.Contestant.get.mockResolvedValueOnce({
        data: null
      });

      await expect(contestantService.getContestant('nonexistent-id')).rejects.toThrow();
    });
  });

  describe('getContestantsByLeague', () => {
    it('should return all contestants in a league', async () => {
      const mockContestants = [
        { ...createMockContestant({ id: 'contestant-1', leagueId: 'league-123' }), episodeScores: JSON.stringify([]) },
        { ...createMockContestant({ id: 'contestant-2', leagueId: 'league-123' }), episodeScores: JSON.stringify([]) },
      ];

      mockClient.models.Contestant.list.mockResolvedValueOnce({
        data: mockContestants
      });

      const result = await contestantService.getContestantsByLeague('league-123');

      expect(mockClient.models.Contestant.list).toHaveBeenCalledWith({
        filter: { leagueId: { eq: 'league-123' } }
      });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('contestant-1');
      expect(result[1].id).toBe('contestant-2');
    });

    it('should return empty array when no contestants exist', async () => {
      mockClient.models.Contestant.list.mockResolvedValueOnce({
        data: []
      });

      const result = await contestantService.getContestantsByLeague('league-123');

      expect(result).toHaveLength(0);
    });
  });

  describe('getActiveContestants', () => {
    it('should return only non-eliminated contestants', async () => {
      const mockContestants = [
        { ...createMockContestant({ id: 'contestant-1', isEliminated: false }), episodeScores: JSON.stringify([]) },
        { ...createMockContestant({ id: 'contestant-2', isEliminated: true }), episodeScores: JSON.stringify([]) },
        { ...createMockContestant({ id: 'contestant-3', isEliminated: false }), episodeScores: JSON.stringify([]) },
      ];

      mockClient.models.Contestant.list.mockResolvedValueOnce({
        data: mockContestants
      });

      const result = await contestantService.getActiveContestants('league-123');

      expect(result).toHaveLength(2);
      expect(result.every(c => !c.isEliminated)).toBe(true);
    });
  });

  describe('getEliminatedContestants', () => {
    it('should return only eliminated contestants', async () => {
      const mockContestants = [
        { ...createMockContestant({ id: 'contestant-1', isEliminated: false }), episodeScores: JSON.stringify([]) },
        { ...createMockContestant({ id: 'contestant-2', isEliminated: true }), episodeScores: JSON.stringify([]) },
        { ...createMockContestant({ id: 'contestant-3', isEliminated: true }), episodeScores: JSON.stringify([]) },
      ];

      mockClient.models.Contestant.list.mockResolvedValueOnce({
        data: mockContestants
      });

      const result = await contestantService.getEliminatedContestants('league-123');

      expect(result).toHaveLength(2);
      expect(result.every(c => c.isEliminated)).toBe(true);
    });
  });

  describe('updateContestant', () => {
    it('should update contestant information', async () => {
      const input = {
        contestantId: 'contestant-123',
        name: 'Sarah Johnson Updated',
        age: 29,
        hometown: 'San Francisco, CA',
        occupation: 'Senior Marketing Manager',
        bio: 'Updated bio',
      };

      const mockResponse = {
        ...createMockContestant({ id: 'contestant-123', ...input }),
        episodeScores: JSON.stringify([])
      };

      mockClient.models.Contestant.update.mockResolvedValueOnce({
        data: mockResponse
      });

      const result = await contestantService.updateContestant(input);

      expect(mockClient.models.Contestant.update).toHaveBeenCalledWith({
        id: 'contestant-123',
        name: 'Sarah Johnson Updated',
        age: 29,
        hometown: 'San Francisco, CA',
        occupation: 'Senior Marketing Manager',
        bio: 'Updated bio',
      });

      expect(result.name).toBe('Sarah Johnson Updated');
      expect(result.age).toBe(29);
    });

    it('should update only provided fields', async () => {
      const input = {
        contestantId: 'contestant-123',
        name: 'Sarah Johnson Updated',
      };

      const mockResponse = {
        ...createMockContestant({ id: 'contestant-123', name: 'Sarah Johnson Updated' }),
        episodeScores: JSON.stringify([])
      };

      mockClient.models.Contestant.update.mockResolvedValueOnce({
        data: mockResponse
      });

      const result = await contestantService.updateContestant(input);

      expect(mockClient.models.Contestant.update).toHaveBeenCalledWith({
        id: 'contestant-123',
        name: 'Sarah Johnson Updated',
      });

      expect(result.name).toBe('Sarah Johnson Updated');
    });
  });

  describe('eliminateContestant', () => {
    it('should eliminate a contestant', async () => {
      const input = {
        contestantId: 'contestant-123',
        episodeNumber: 5,
      };

      const mockResponse = {
        ...createMockContestant({ 
          id: 'contestant-123', 
          isEliminated: true, 
          eliminationEpisode: 5 
        }),
        episodeScores: JSON.stringify([])
      };

      mockClient.models.Contestant.update.mockResolvedValueOnce({
        data: mockResponse
      });

      const result = await contestantService.eliminateContestant(input);

      expect(mockClient.models.Contestant.update).toHaveBeenCalledWith({
        id: 'contestant-123',
        isEliminated: true,
        eliminationEpisode: 5,
      });

      expect(result.isEliminated).toBe(true);
      expect(result.eliminationEpisode).toBe(5);
    });
  });

  describe('restoreContestant', () => {
    it('should restore an eliminated contestant', async () => {
      const mockResponse = {
        ...createMockContestant({ 
          id: 'contestant-123', 
          isEliminated: false, 
          eliminationEpisode: undefined 
        }),
        episodeScores: JSON.stringify([])
      };

      mockClient.models.Contestant.update.mockResolvedValueOnce({
        data: mockResponse
      });

      const result = await contestantService.restoreContestant('contestant-123');

      expect(mockClient.models.Contestant.update).toHaveBeenCalledWith({
        id: 'contestant-123',
        isEliminated: false,
        eliminationEpisode: null,
      });

      expect(result.isEliminated).toBe(false);
      expect(result.eliminationEpisode).toBeUndefined();
    });
  });

  describe('deleteContestant', () => {
    it('should delete a contestant', async () => {
      mockClient.models.Contestant.delete.mockResolvedValueOnce({
        data: { id: 'contestant-123' }
      });

      await contestantService.deleteContestant('contestant-123');

      expect(mockClient.models.Contestant.delete).toHaveBeenCalledWith({
        id: 'contestant-123'
      });
    });

    it('should throw error when deletion fails', async () => {
      mockClient.models.Contestant.delete.mockResolvedValueOnce({
        data: null
      });

      await expect(contestantService.deleteContestant('contestant-123')).rejects.toThrow();
    });
  });

  describe('getContestantStandings', () => {
    it('should return contestants sorted by points descending', async () => {
      const mockContestants = [
        { ...createMockContestant({ id: 'contestant-1', totalPoints: 10 }), episodeScores: JSON.stringify([]) },
        { ...createMockContestant({ id: 'contestant-2', totalPoints: 25 }), episodeScores: JSON.stringify([]) },
        { ...createMockContestant({ id: 'contestant-3', totalPoints: 15 }), episodeScores: JSON.stringify([]) },
      ];

      mockClient.models.Contestant.list.mockResolvedValueOnce({
        data: mockContestants
      });

      const result = await contestantService.getContestantStandings('league-123');

      expect(result).toHaveLength(3);
      expect(result[0].totalPoints).toBe(25); // Highest points first
      expect(result[1].totalPoints).toBe(15);
      expect(result[2].totalPoints).toBe(10); // Lowest points last
    });
  });

  describe('bulkCreateContestants', () => {
    it('should create multiple contestants', async () => {
      const contestants = [
        { name: 'Sarah Johnson', age: 28 },
        { name: 'Emily Davis', age: 26 },
      ];

      const mockResponses = contestants.map((c, index) => ({
        ...createMockContestant({ id: `contestant-${index + 1}`, leagueId: 'league-123', ...c }),
        episodeScores: JSON.stringify([])
      }));

      mockClient.models.Contestant.create
        .mockResolvedValueOnce({ data: mockResponses[0] })
        .mockResolvedValueOnce({ data: mockResponses[1] });

      const result = await contestantService.bulkCreateContestants('league-123', contestants);

      expect(mockClient.models.Contestant.create).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Sarah Johnson');
      expect(result[1].name).toBe('Emily Davis');
    });

    it('should continue creating contestants even if one fails', async () => {
      const contestants = [
        { name: 'Sarah Johnson', age: 28 },
        { name: 'Emily Davis', age: 26 },
      ];

      const mockResponse = {
        ...createMockContestant({ id: 'contestant-2', leagueId: 'league-123', name: 'Emily Davis', age: 26 }),
        episodeScores: JSON.stringify([])
      };

      mockClient.models.Contestant.create
        .mockRejectedValueOnce(new Error('Failed to create'))
        .mockResolvedValueOnce({ data: mockResponse });

      const result = await contestantService.bulkCreateContestants('league-123', contestants);

      expect(mockClient.models.Contestant.create).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(1); // Only successful creation
      expect(result[0].name).toBe('Emily Davis');
    });
  });

  describe('searchContestants', () => {
    it('should search contestants by name', async () => {
      const mockContestants = [
        { ...createMockContestant({ id: 'contestant-1', name: 'Sarah Johnson' }), episodeScores: JSON.stringify([]) },
        { ...createMockContestant({ id: 'contestant-2', name: 'Emily Davis' }), episodeScores: JSON.stringify([]) },
        { ...createMockContestant({ id: 'contestant-3', name: 'Sarah Smith' }), episodeScores: JSON.stringify([]) },
      ];

      mockClient.models.Contestant.list.mockResolvedValueOnce({
        data: mockContestants
      });

      const result = await contestantService.searchContestants('league-123', 'Sarah');

      expect(result).toHaveLength(2);
      expect(result.every(c => c.name.includes('Sarah'))).toBe(true);
    });

    it('should search contestants by hometown', async () => {
      const mockContestants = [
        { ...createMockContestant({ id: 'contestant-1', hometown: 'Los Angeles, CA' }), episodeScores: JSON.stringify([]) },
        { ...createMockContestant({ id: 'contestant-2', hometown: 'New York, NY' }), episodeScores: JSON.stringify([]) },
        { ...createMockContestant({ id: 'contestant-3', hometown: 'Los Angeles, CA' }), episodeScores: JSON.stringify([]) },
      ];

      mockClient.models.Contestant.list.mockResolvedValueOnce({
        data: mockContestants
      });

      const result = await contestantService.searchContestants('league-123', 'Los Angeles');

      expect(result).toHaveLength(2);
      expect(result.every(c => c.hometown?.includes('Los Angeles'))).toBe(true);
    });

    it('should search contestants by occupation', async () => {
      const mockContestants = [
        { ...createMockContestant({ id: 'contestant-1', occupation: 'Marketing Manager' }), episodeScores: JSON.stringify([]) },
        { ...createMockContestant({ id: 'contestant-2', occupation: 'Software Engineer' }), episodeScores: JSON.stringify([]) },
        { ...createMockContestant({ id: 'contestant-3', occupation: 'Marketing Director' }), episodeScores: JSON.stringify([]) },
      ];

      mockClient.models.Contestant.list.mockResolvedValueOnce({
        data: mockContestants
      });

      const result = await contestantService.searchContestants('league-123', 'Marketing');

      expect(result).toHaveLength(2);
      expect(result.every(c => c.occupation?.includes('Marketing'))).toBe(true);
    });
  });
});