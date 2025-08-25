import React from 'react';
import { render } from '@testing-library/react';
import { NotificationProvider } from '../components/NotificationProvider';
import { useGlobalNotificationEvents } from '../hooks/useNotifications';
import type { NotificationEvent } from '../services/notification-service';

// Mock the hooks
jest.mock('../hooks/useNotifications', () => ({
  useNotifications: () => ({
    notifications: [],
    dismissNotification: jest.fn(),
  }),
  useGlobalNotificationEvents: jest.fn(),
}));

const mockUseGlobalNotificationEvents = useGlobalNotificationEvents as jest.MockedFunction<typeof useGlobalNotificationEvents>;

describe('NotificationProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should listen for global notification events', () => {
    mockUseGlobalNotificationEvents.mockReturnValue(null);

    render(
      <NotificationProvider>
        <div>Test Content</div>
      </NotificationProvider>
    );

    // Verify that useGlobalNotificationEvents was called with a callback
    expect(mockUseGlobalNotificationEvents).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should render children correctly', () => {
    mockUseGlobalNotificationEvents.mockReturnValue(null);

    const { getByText } = render(
      <NotificationProvider>
        <div>Test Content</div>
      </NotificationProvider>
    );

    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('should handle draft_started events in callback', () => {
    let eventCallback: (event: NotificationEvent) => void;
    
    mockUseGlobalNotificationEvents.mockImplementation((callback) => {
      if (callback) {
        eventCallback = callback;
      }
      return null;
    });

    render(
      <NotificationProvider>
        <div>Test Content</div>
      </NotificationProvider>
    );

    // Simulate receiving a draft_started event
    const draftStartedEvent: NotificationEvent = {
      type: 'draft_started',
      leagueId: 'league-123',
      data: { leagueName: 'Test League' },
      timestamp: '2024-01-01T00:00:00.000Z',
    };

    // The callback should handle draft_started events without throwing
    // Note: In a real environment, this would trigger window.location.reload()
    expect(() => eventCallback!(draftStartedEvent)).not.toThrow();
  });

  it('should handle non-draft events without error', () => {
    let eventCallback: (event: NotificationEvent) => void;
    
    mockUseGlobalNotificationEvents.mockImplementation((callback) => {
      if (callback) {
        eventCallback = callback;
      }
      return null;
    });

    render(
      <NotificationProvider>
        <div>Test Content</div>
      </NotificationProvider>
    );

    // Simulate receiving a scoring event (should not cause errors)
    const scoringEvent: NotificationEvent = {
      type: 'scoring_event',
      leagueId: 'league-123',
      data: { contestantName: 'Jane Doe', points: 5, actionType: 'Kiss on mouth' },
      timestamp: '2024-01-01T00:00:00.000Z',
    };

    // The callback should handle non-draft events without error
    expect(() => eventCallback!(scoringEvent)).not.toThrow();
  });
});