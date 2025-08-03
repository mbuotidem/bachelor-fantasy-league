import { LeagueService } from '../services/league-service';
import { ValidationError, NotFoundError } from '../services/base-service';
import type { CreateLeagueInput, League } from '../types';

// Mock the API client
jest.mock('../lib/api-client', () => ({
  client: {
    models: {
      League: {
        create: jest.fn(),
        get: jest.fn(),
        list: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      }
    }
  }
}));

import { client } from '../lib/api-client';

const mockCreate = client.models.League.create as jest.MockedFunction<typeof client.models.League.create>;
const mockGet = client.models.League.get as jest.MockedFunction<typeof client.models.League.get>;
const mockList = client.models.League.list as jest.MockedFunction<typeof client.models.League.list>;
const mockUpdate = client.models.League.update as jest.MockedFunction<typeof client.models.League.update>;
const mockDelete = client.models.League.delete as jest.MockedFunction<typeof client.models.League.delete>;

describe('LeagueService', () => {
  let leagueService: LeagueService;

  beforeEach(() => {
    leagueService = new LeagueService();
    jest.clearAllMocks();
  });

  const mockLeagueData = {
    id: 'league-123',
    name: 'Test League',
    season: 'Season 29',
    leagueCode: 'ABC123',
    commissionerId: 'user-123',
    status: 'created',
    settings: JSON.stringify({
      maxTeams: 20,
      contestantDraftLimit: 2,
      draftFormat: 'snake',
      scoringRules: [],
      notificationSettings: {
        scoringUpdates: true,
        draftNotifications: true,
        standingsChanges: true,
        episodeReminders: true,
      }
    }),
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  describe('createLeague', () => {
    it('should create a league successfully', async () => {
      const input: CreateLeagueInput = {
        name: 'Test League',
        season: 'Season 29',
      };

      mockCreate.mockResolvedValue({ data: mockLeagueData });

      const result = await leagueService.createLeague(input);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: input.name,
          season: input.season,
          status: 'created',
          leagueCode: expect.any(String),
          settings: expect.any(String),
        })
      );

      expect(result).toEqual(
        expect.objectContaining({
          id: 'league-123',
          name: 'Test League',
          season: 'Season 29',
          status: 'created',
        })
      );
    });

    it('should throw ValidationError when name is missing', async () => {
      const input = { season: 'Season 29' } as CreateLeagueInput;

      await expect(leagueService.createLeague(input))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when season is missing', async () => {
      const input = { name: 'Test League' } as CreateLeagueInput;

      await expect(leagueService.createLeague(input))
        .rejects.toThrow(ValidationError);
    });

    it('should generate a unique league code', async () => {
      const input: CreateLeagueInput = {
        name: 'Test League',
        season: 'Season 29',
      };

      mockCreate.mockResolvedValue({ data: mockLeagueData });

      await leagueService.createLeague(input);

      const createCall = mockCreate.mock.calls[0][0];
      expect(createCall.leagueCode).toMatch(/^[A-Z0-9]{6}$/);
    });
  });

  describe('getLeague', () => {
    it('should get a league by ID successfully', async () => {
      mockGet.mockResolvedValue({ data: mockLeagueData });

      const result = await leagueService.getLeague('league-123');

      expect(mockGet).toHaveBeenCalledWith({ id: 'league-123' });
      expect(result.id).toBe('league-123');
      expect(result.name).toBe('Test League');
    });

    it('should throw ValidationError when ID is missing', async () => {
      await expect(leagueService.getLeague(''))
        .rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError when league does not exist', async () => {
      mockGet.mockResolvedValue({ data: null });

      await expect(leagueService.getLeague('nonexistent'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('getLeagueByCode', () => {
    it('should get a league by code successfully', async () => {
      mockList.mockResolvedValue({ data: [mockLeagueData] });

      const result = await leagueService.getLeagueByCode('ABC123');

      expect(mockList).toHaveBeenCalledWith({
        filter: { leagueCode: { eq: 'ABC123' } }
      });
      expect(result.leagueCode).toBe('ABC123');
    });

    it('should throw ValidationError when code is missing', async () => {
      await expect(leagueService.getLeagueByCode(''))
        .rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError when league with code does not exist', async () => {
      mockList.mockResolvedValue({ data: [] });

      await expect(leagueService.getLeagueByCode('INVALID'))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('getUserLeagues', () => {
    it('should get user leagues successfully', async () => {
      mockList.mockResolvedValue({ data: [mockLeagueData] });

      const result = await leagueService.getUserLeagues();

      expect(mockList).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('league-123');
    });

    it('should return empty array when no leagues found', async () => {
      mockList.mockResolvedValue({ data: [] });

      const result = await leagueService.getUserLeagues();

      expect(result).toEqual([]);
    });

    it('should return empty array when data is null', async () => {
      mockList.mockResolvedValue({ data: null });

      const result = await leagueService.getUserLeagues();

      expect(result).toEqual([]);
    });
  });

  describe('updateLeagueSettings', () => {
    it('should update league settings successfully', async () => {
      const input = {
        leagueId: 'league-123',
        settings: { maxTeams: 16 }
      };

      const updatedData = {
        ...mockLeagueData,
        settings: JSON.stringify({ ...JSON.parse(mockLeagueData.settings), maxTeams: 16 })
      };

      mockUpdate.mockResolvedValue({ data: updatedData });

      const result = await leagueService.updateLeagueSettings(input);

      expect(mockUpdate).toHaveBeenCalledWith({
        id: 'league-123',
        settings: JSON.stringify(input.settings),
      });

      expect(result.settings.maxTeams).toBe(16);
    });

    it('should throw ValidationError when leagueId is missing', async () => {
      const input = { settings: { maxTeams: 16 } } as any;

      await expect(leagueService.updateLeagueSettings(input))
        .rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError when league does not exist', async () => {
      const input = {
        leagueId: 'nonexistent',
        settings: { maxTeams: 16 }
      };

      mockUpdate.mockResolvedValue({ data: null });

      await expect(leagueService.updateLeagueSettings(input))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('updateLeagueStatus', () => {
    it('should update league status successfully', async () => {
      const updatedData = { ...mockLeagueData, status: 'active' };
      mockUpdate.mockResolvedValue({ data: updatedData });

      const result = await leagueService.updateLeagueStatus('league-123', 'active');

      expect(mockUpdate).toHaveBeenCalledWith({
        id: 'league-123',
        status: 'active',
      });

      expect(result.status).toBe('active');
    });

    it('should throw ValidationError when leagueId is missing', async () => {
      await expect(leagueService.updateLeagueStatus('', 'active'))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('joinLeague', () => {
    it('should join a league successfully', async () => {
      mockList.mockResolvedValue({ data: [mockLeagueData] });

      const input = {
        leagueCode: 'ABC123',
        teamName: 'My Team'
      };

      const result = await leagueService.joinLeague(input);

      expect(result.league.leagueCode).toBe('ABC123');
      expect(result.teamId).toBeDefined();
    });

    it('should throw ValidationError when leagueCode is missing', async () => {
      const input = { teamName: 'My Team' } as any;

      await expect(leagueService.joinLeague(input))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when teamName is missing', async () => {
      const input = { leagueCode: 'ABC123' } as any;

      await expect(leagueService.joinLeague(input))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when league is not accepting members', async () => {
      const activeLeagueData = { ...mockLeagueData, status: 'active' };
      mockList.mockResolvedValue({ data: [activeLeagueData] });

      const input = {
        leagueCode: 'ABC123',
        teamName: 'My Team'
      };

      await expect(leagueService.joinLeague(input))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('deleteLeague', () => {
    it('should delete a league successfully', async () => {
      mockDelete.mockResolvedValue({ data: mockLeagueData });

      await leagueService.deleteLeague('league-123');

      expect(mockDelete).toHaveBeenCalledWith({ id: 'league-123' });
    });

    it('should throw ValidationError when leagueId is missing', async () => {
      await expect(leagueService.deleteLeague(''))
        .rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError when league does not exist', async () => {
      mockDelete.mockResolvedValue({ data: null });

      await expect(leagueService.deleteLeague('nonexistent'))
        .rejects.toThrow(NotFoundError);
    });
  });
});