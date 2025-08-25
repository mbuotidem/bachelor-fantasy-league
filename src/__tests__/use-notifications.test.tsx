import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useNotifications, useNotificationEvents, useGlobalNotificationEvents } from '../hooks/useNotifications';
import { notificationService } from '../services/notification-service';
import type { NotificationEvent } from '../services/notification-service';

// Mock the notification service
jest.mock('../services/notification-service', () => ({
  notificationService: {
    subscribeToNotifications: jest.fn(),
    subscribeToEvents: jest.fn(),
    showNotification: jest.fn(),
  },
}));

const mockNotificationService = notificationService as jest.Mocked<typeof notificationService>;

describe('useNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with empty notifications array', () => {
    mockNotificationService.subscribeToNotifications.mockReturnValue(() => {});

    const { result } = renderHook(() => useNotifications());

    expect(result.current.notifications).toEqual([]);
    expect(typeof result.current.dismissNotification).toBe('function');
    expect(typeof result.current.clearAllNotifications).toBe('function');
    expect(typeof result.current.showNotification).toBe('function');
  });

  it('should subscribe to notifications on mount', () => {
    const mockUnsubscribe = jest.fn();
    mockNotificationService.subscribeToNotifications.mockReturnValue(mockUnsubscribe);

    const { unmount } = renderHook(() => useNotifications());

    expect(mockNotificationService.subscribeToNotifications).toHaveBeenCalledTimes(1);
    expect(mockNotificationService.subscribeToNotifications).toHaveBeenCalledWith(expect.any(Function));

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('should add notifications when callback is triggered', () => {
    let notificationCallback: (notification: any) => void;
    
    mockNotificationService.subscribeToNotifications.mockImplementation((callback) => {
      notificationCallback = callback;
      return () => {};
    });

    const { result } = renderHook(() => useNotifications());

    const testNotification = {
      id: 'test-1',
      type: 'info' as const,
      title: 'Test Notification',
      message: 'Test message',
      duration: 5000,
    };

    act(() => {
      notificationCallback(testNotification);
    });

    expect(result.current.notifications).toEqual([testNotification]);
  });

  it('should dismiss notification by id', () => {
    let notificationCallback: (notification: any) => void;
    
    mockNotificationService.subscribeToNotifications.mockImplementation((callback) => {
      notificationCallback = callback;
      return () => {};
    });

    const { result } = renderHook(() => useNotifications());

    const notification1 = { id: 'test-1', type: 'info' as const, title: 'Test 1', duration: 5000 };
    const notification2 = { id: 'test-2', type: 'info' as const, title: 'Test 2', duration: 5000 };

    act(() => {
      notificationCallback(notification1);
      notificationCallback(notification2);
    });

    expect(result.current.notifications).toHaveLength(2);

    act(() => {
      result.current.dismissNotification('test-1');
    });

    expect(result.current.notifications).toEqual([notification2]);
  });

  it('should clear all notifications', () => {
    let notificationCallback: (notification: any) => void;
    
    mockNotificationService.subscribeToNotifications.mockImplementation((callback) => {
      notificationCallback = callback;
      return () => {};
    });

    const { result } = renderHook(() => useNotifications());

    act(() => {
      notificationCallback({ id: 'test-1', type: 'info' as const, title: 'Test 1', duration: 5000 });
      notificationCallback({ id: 'test-2', type: 'info' as const, title: 'Test 2', duration: 5000 });
    });

    expect(result.current.notifications).toHaveLength(2);

    act(() => {
      result.current.clearAllNotifications();
    });

    expect(result.current.notifications).toEqual([]);
  });

  it('should call notification service when showing notification', () => {
    mockNotificationService.subscribeToNotifications.mockReturnValue(() => {});

    const { result } = renderHook(() => useNotifications());

    const notification = {
      type: 'success' as const,
      title: 'Success!',
      message: 'Operation completed',
    };

    act(() => {
      result.current.showNotification(notification);
    });

    expect(mockNotificationService.showNotification).toHaveBeenCalledWith(notification);
  });
});

describe('useNotificationEvents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should subscribe to events for specific league', () => {
    const mockUnsubscribe = jest.fn();
    mockNotificationService.subscribeToEvents.mockReturnValue(mockUnsubscribe);

    const { unmount } = renderHook(() => useNotificationEvents('league-123'));

    expect(mockNotificationService.subscribeToEvents).toHaveBeenCalledWith('league-123', expect.any(Function));

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('should call onEvent callback when event is received', () => {
    let eventCallback: (event: NotificationEvent) => void;
    const mockOnEvent = jest.fn();
    
    mockNotificationService.subscribeToEvents.mockImplementation((leagueId, callback) => {
      eventCallback = callback;
      return () => {};
    });

    renderHook(() => useNotificationEvents('league-123', mockOnEvent));

    const testEvent: NotificationEvent = {
      type: 'draft_started',
      leagueId: 'league-123',
      data: { leagueName: 'Test League' },
      timestamp: '2024-01-01T00:00:00.000Z',
    };

    act(() => {
      eventCallback(testEvent);
    });

    expect(mockOnEvent).toHaveBeenCalledWith(testEvent);
  });

  it('should update lastEvent state when event is received', () => {
    let eventCallback: (event: NotificationEvent) => void;
    
    mockNotificationService.subscribeToEvents.mockImplementation((leagueId, callback) => {
      eventCallback = callback;
      return () => {};
    });

    const { result } = renderHook(() => useNotificationEvents('league-123'));

    expect(result.current).toBeNull();

    const testEvent: NotificationEvent = {
      type: 'draft_started',
      leagueId: 'league-123',
      data: { leagueName: 'Test League' },
      timestamp: '2024-01-01T00:00:00.000Z',
    };

    act(() => {
      eventCallback(testEvent);
    });

    expect(result.current).toEqual(testEvent);
  });

  it('should resubscribe when leagueId changes', () => {
    const mockUnsubscribe1 = jest.fn();
    const mockUnsubscribe2 = jest.fn();
    
    mockNotificationService.subscribeToEvents
      .mockReturnValueOnce(mockUnsubscribe1)
      .mockReturnValueOnce(mockUnsubscribe2);

    const { rerender } = renderHook(
      ({ leagueId }) => useNotificationEvents(leagueId),
      { initialProps: { leagueId: 'league-123' } }
    );

    expect(mockNotificationService.subscribeToEvents).toHaveBeenCalledWith('league-123', expect.any(Function));

    rerender({ leagueId: 'league-456' });

    expect(mockUnsubscribe1).toHaveBeenCalledTimes(1);
    expect(mockNotificationService.subscribeToEvents).toHaveBeenCalledWith('league-456', expect.any(Function));
  });
});

describe('useGlobalNotificationEvents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should subscribe to global events', () => {
    const mockUnsubscribe = jest.fn();
    mockNotificationService.subscribeToEvents.mockReturnValue(mockUnsubscribe);

    const { unmount } = renderHook(() => useGlobalNotificationEvents());

    expect(mockNotificationService.subscribeToEvents).toHaveBeenCalledWith('*', expect.any(Function));

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('should call onEvent callback for global events', () => {
    let eventCallback: (event: NotificationEvent) => void;
    const mockOnEvent = jest.fn();
    
    mockNotificationService.subscribeToEvents.mockImplementation((leagueId, callback) => {
      eventCallback = callback;
      return () => {};
    });

    renderHook(() => useGlobalNotificationEvents(mockOnEvent));

    const testEvent: NotificationEvent = {
      type: 'draft_started',
      leagueId: 'league-123',
      data: { leagueName: 'Test League' },
      timestamp: '2024-01-01T00:00:00.000Z',
    };

    act(() => {
      eventCallback(testEvent);
    });

    expect(mockOnEvent).toHaveBeenCalledWith(testEvent);
  });
});