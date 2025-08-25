import { notificationService } from '../services/notification-service';
import type { ToastNotification } from '../components/NotificationToast';
import type { NotificationEvent } from '../services/notification-service';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)),
  },
});

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  describe('Notification Subscriptions', () => {
    it('should allow subscribing to notifications', () => {
      const callback = jest.fn();
      const unsubscribe = notificationService.subscribeToNotifications(callback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should call notification callback when notification is shown', () => {
      const callback = jest.fn();
      notificationService.subscribeToNotifications(callback);

      const notification = {
        type: 'success' as const,
        title: 'Test Notification',
        message: 'This is a test',
      };

      notificationService.showNotification(notification);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          ...notification,
          id: expect.any(String),
          duration: 5000,
        })
      );
    });

    it('should unsubscribe properly', () => {
      const callback = jest.fn();
      const unsubscribe = notificationService.subscribeToNotifications(callback);

      unsubscribe();

      notificationService.showNotification({
        type: 'info',
        title: 'Test',
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Event Subscriptions', () => {
    it('should allow subscribing to events for a specific league', () => {
      const callback = jest.fn();
      const unsubscribe = notificationService.subscribeToEvents('league-123', callback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should call event callback when event is emitted', () => {
      const callback = jest.fn();
      notificationService.subscribeToEvents('league-123', callback);

      const event = {
        type: 'draft_started' as const,
        leagueId: 'league-123',
        data: { leagueName: 'Test League' },
      };

      notificationService.emitEvent(event);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          ...event,
          timestamp: expect.any(String),
        })
      );
    });

    it('should not call callback for different league events', () => {
      const callback = jest.fn();
      notificationService.subscribeToEvents('league-123', callback);

      notificationService.emitEvent({
        type: 'draft_started',
        leagueId: 'league-456',
        data: { leagueName: 'Other League' },
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it('should call global event listeners for any league', () => {
      const callback = jest.fn();
      notificationService.subscribeToEvents('*', callback);

      notificationService.emitEvent({
        type: 'draft_started',
        leagueId: 'league-123',
        data: { leagueName: 'Test League' },
      });

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('Convenience Notification Methods', () => {
    let notificationCallback: jest.Mock;

    beforeEach(() => {
      notificationCallback = jest.fn();
      notificationService.subscribeToNotifications(notificationCallback);
    });

    it('should notify draft started', () => {
      notificationService.notifyDraftStarted('league-123', 'Test League');

      expect(notificationCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'info',
          title: 'Draft Started!',
          message: 'The draft for Test League has begun. Get ready to pick your contestants!',
          duration: 8000,
        })
      );
    });

    it('should notify draft turn', () => {
      notificationService.notifyDraftTurn('league-123', 'Team Alpha', 120000);

      expect(notificationCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warning',
          title: 'Your Turn to Draft!',
          message: "It's Team Alpha's turn to pick. You have 120 seconds remaining.",
          duration: 0, // Persistent
        })
      );
    });

    it('should notify draft pick made', () => {
      notificationService.notifyDraftPickMade('league-123', 'Team Alpha', 'Contestant Jane');

      expect(notificationCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          title: 'Draft Pick Made',
          message: 'Team Alpha selected Contestant Jane',
          duration: 4000,
        })
      );
    });

    it('should notify draft completed', () => {
      notificationService.notifyDraftCompleted('league-123', 'Test League');

      expect(notificationCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          title: 'Draft Complete!',
          message: 'The draft for Test League is finished. Good luck this season!',
          duration: 8000,
        })
      );
    });

    it('should notify scoring event with positive points', () => {
      notificationService.notifyScoringEvent('league-123', 'Contestant Jane', 5, 'Kiss on mouth');

      expect(notificationCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          title: 'Contestant Jane scored 5 points',
          message: 'Kiss on mouth',
          duration: 3000,
        })
      );
    });

    it('should notify scoring event with negative points', () => {
      notificationService.notifyScoringEvent('league-123', 'Contestant Jane', -2, 'Crying per scene');

      expect(notificationCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warning',
          title: 'Contestant Jane lost 2 points',
          message: 'Crying per scene',
          duration: 3000,
        })
      );
    });

    it('should notify standings update', () => {
      const changes = [
        { teamName: 'Team Alpha', oldRank: 5, newRank: 2 }
      ];

      notificationService.notifyStandingsUpdate('league-123', changes);

      expect(notificationCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'info',
          title: 'Standings Update',
          message: 'Team Alpha moved up to #2!',
          duration: 5000,
        })
      );
    });

    it('should not notify standings update for minor changes', () => {
      const changes = [
        { teamName: 'Team Alpha', oldRank: 3, newRank: 4 } // Only 1 position change
      ];

      notificationService.notifyStandingsUpdate('league-123', changes);

      expect(notificationCallback).not.toHaveBeenCalled();
    });

    it('should notify episode started', () => {
      notificationService.notifyEpisodeStarted('league-123', 5);

      expect(notificationCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'info',
          title: 'Episode Scoring Active',
          message: 'Episode 5 scoring is now active. Start tracking points!',
          duration: 6000,
        })
      );
    });
  });

  describe('Cross-tab Communication', () => {
    it('should store notifications in localStorage for cross-tab communication', () => {
      notificationService.showNotification({
        type: 'info',
        title: 'Test Notification',
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        expect.stringMatching(/^notification-/),
        expect.stringContaining('"type":"notification"')
      );
    });

    it('should store events in localStorage for cross-tab communication', () => {
      notificationService.emitEvent({
        type: 'draft_started',
        leagueId: 'league-123',
        data: { leagueName: 'Test League' },
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        expect.stringMatching(/^notification-/),
        expect.stringContaining('"type":"event"')
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw
      expect(() => {
        notificationService.showNotification({
          type: 'info',
          title: 'Test',
        });
      }).not.toThrow();
    });

    it('should handle callback errors gracefully', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Callback error');
      });
      
      notificationService.subscribeToNotifications(errorCallback);

      // Should not throw
      expect(() => {
        notificationService.showNotification({
          type: 'info',
          title: 'Test',
        });
      }).not.toThrow();

      expect(errorCallback).toHaveBeenCalled();
    });
  });
});