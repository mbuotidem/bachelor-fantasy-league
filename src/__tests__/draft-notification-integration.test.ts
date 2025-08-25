import type { Draft } from '../types';

// Mock the API client first
jest.mock('../lib/api-client', () => ({
  client: {
    models: {
      Draft: {
        get: jest.fn(),
        update: jest.fn(),
      },
      Team: {
        list: jest.fn(),
        get: jest.fn(),
      },
      League: {
        get: jest.fn(),
      },
    },
  },
}));

// Mock the real-time notification service
jest.mock('../services/real-time-notification-service', () => ({
  realTimeNotificationService: {
    notifyDraftStarted: jest.fn(),
    notifyDraftPickMade: jest.fn(),
    notifyDraftTurn: jest.fn(),
    notifyDraftTurnSkipped: jest.fn(),
    notifyDraftCompleted: jest.fn(),
  },
}));

// Import after mocking
import { DraftService } from '../services/draft-service';
import { realTimeNotificationService } from '../services/real-time-notification-service';

const mockNotificationService = realTimeNotificationService as jest.Mocked<typeof realTimeNotificationService>;

describe('Draft Notification Integration', () => {
  let draftService: DraftService;

  beforeEach(() => {
    jest.clearAllMocks();
    draftService = new DraftService();
    
    // Mock the API client methods
    (draftService as any).client = {
      models: {
        Draft: {
          get: jest.fn(),
          update: jest.fn(),
        },
        Team: {
          list: jest.fn(),
          get: jest.fn(),
        },
        League: {
          get: jest.fn(),
        },
      },
    };
  });

  describe('startDraft', () => {
    it('should send notification to all users when draft is started', async () => {
      const mockDraft: Draft = {
        id: 'draft-123',
        leagueId: 'league-456',
        status: 'not_started',
        currentPick: 0,
        draftOrder: [],
        picks: [],
        settings: {
          pickTimeLimit: 120,
          draftFormat: 'snake',
          autoPickEnabled: false,
        },
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      const updatedDraft: Draft = {
        ...mockDraft,
        status: 'in_progress',
        currentPick: 1,
        draftOrder: ['team-1', 'team-2'],
      };

      // Mock the getDraft call
      jest.spyOn(draftService, 'getDraft').mockResolvedValue(mockDraft);

      // Mock the API responses
      (draftService as any).client.models.Team.list.mockResolvedValue({
        data: [
          { id: 'team-1', name: 'Team Alpha' },
          { id: 'team-2', name: 'Team Beta' },
        ],
      });

      (draftService as any).client.models.Draft.update.mockResolvedValue({
        data: {
          id: 'draft-123',
          leagueId: 'league-456',
          status: 'in_progress',
          currentPick: 1,
          draftOrder: ['team-1', 'team-2'],
          picks: '[]',
          settings: JSON.stringify(mockDraft.settings),
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      });

      (draftService as any).client.models.League.get.mockResolvedValue({
        data: {
          id: 'league-456',
          name: 'Test League',
        },
      });

      // Start the draft
      await draftService.startDraft('draft-123');

      // Verify that the notification service was called
      expect(mockNotificationService.notifyDraftStarted).toHaveBeenCalledWith(
        'league-456',
        'Test League'
      );
    });

    it('should handle notification errors gracefully', async () => {
      const mockDraft: Draft = {
        id: 'draft-123',
        leagueId: 'league-456',
        status: 'not_started',
        currentPick: 0,
        draftOrder: [],
        picks: [],
        settings: {
          pickTimeLimit: 120,
          draftFormat: 'snake',
          autoPickEnabled: false,
        },
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      // Mock the getDraft call
      jest.spyOn(draftService, 'getDraft').mockResolvedValue(mockDraft);

      // Mock the API responses
      (draftService as any).client.models.Team.list.mockResolvedValue({
        data: [{ id: 'team-1', name: 'Team Alpha' }],
      });

      (draftService as any).client.models.Draft.update.mockResolvedValue({
        data: {
          id: 'draft-123',
          leagueId: 'league-456',
          status: 'in_progress',
          currentPick: 1,
          draftOrder: ['team-1'],
          picks: '[]',
          settings: JSON.stringify(mockDraft.settings),
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      });

      // Mock League.get to fail
      (draftService as any).client.models.League.get.mockRejectedValue(
        new Error('League not found')
      );

      // Mock console.warn to verify error handling
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Start the draft - should not throw despite notification error
      const result = await draftService.startDraft('draft-123');

      // Verify the draft was still updated successfully
      expect(result.status).toBe('in_progress');
      expect(result.currentPick).toBe(1);

      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to send draft started notification:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should use fallback league name when league fetch fails', async () => {
      const mockDraft: Draft = {
        id: 'draft-123',
        leagueId: 'league-456',
        status: 'not_started',
        currentPick: 0,
        draftOrder: [],
        picks: [],
        settings: {
          pickTimeLimit: 120,
          draftFormat: 'snake',
          autoPickEnabled: false,
        },
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      // Mock the getDraft call
      jest.spyOn(draftService, 'getDraft').mockResolvedValue(mockDraft);

      // Mock the API responses
      (draftService as any).client.models.Team.list.mockResolvedValue({
        data: [{ id: 'team-1', name: 'Team Alpha' }],
      });

      (draftService as any).client.models.Draft.update.mockResolvedValue({
        data: {
          id: 'draft-123',
          leagueId: 'league-456',
          status: 'in_progress',
          currentPick: 1,
          draftOrder: ['team-1'],
          picks: '[]',
          settings: JSON.stringify(mockDraft.settings),
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      });

      // Mock League.get to return null data
      (draftService as any).client.models.League.get.mockResolvedValue({
        data: null,
      });

      // Mock console.warn
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Start the draft
      await draftService.startDraft('draft-123');

      // Verify that the notification service was called with fallback name
      expect(mockNotificationService.notifyDraftStarted).toHaveBeenCalledWith(
        'league-456',
        'Unknown League'
      );

      consoleSpy.mockRestore();
    });
  });
});