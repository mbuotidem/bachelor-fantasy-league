'use client';

import { useState, useEffect, useCallback } from 'react';
import { realTimeNotificationService, type NotificationEvent } from '../services/real-time-notification-service';
import type { ToastNotification } from '../components/NotificationToast';

export function useRealTimeNotifications() {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  useEffect(() => {
    const unsubscribe = realTimeNotificationService.subscribeToNotifications((notification) => {
      setNotifications(prev => [...prev, notification]);
    });

    return unsubscribe;
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const showNotification = useCallback((notification: Omit<ToastNotification, 'id'>) => {
    realTimeNotificationService.showNotification(notification);
  }, []);

  return {
    notifications,
    dismissNotification,
    clearAllNotifications,
    showNotification,
  };
}

export function useRealTimeNotificationEvents(leagueId: string, onEvent?: (event: NotificationEvent) => void) {
  const [lastEvent, setLastEvent] = useState<NotificationEvent | null>(null);

  useEffect(() => {
    const unsubscribe = realTimeNotificationService.subscribeToEvents(leagueId, (event) => {
      setLastEvent(event);
      onEvent?.(event);
    });

    return unsubscribe;
  }, [leagueId, onEvent]);

  return lastEvent;
}

// Hook for global events (like draft started - should refresh all users)
export function useGlobalRealTimeNotificationEvents(onEvent?: (event: NotificationEvent) => void) {
  const [lastEvent, setLastEvent] = useState<NotificationEvent | null>(null);

  useEffect(() => {
    const unsubscribe = realTimeNotificationService.subscribeToEvents('*', (event) => {
      setLastEvent(event);
      onEvent?.(event);
    });

    return unsubscribe;
  }, [onEvent]);

  return lastEvent;
}