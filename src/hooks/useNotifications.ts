'use client';

import { useState, useEffect, useCallback } from 'react';
import { notificationService, type NotificationEvent } from '../services/notification-service';
import type { ToastNotification } from '../components/NotificationToast';

export function useNotifications() {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  useEffect(() => {
    const unsubscribe = notificationService.subscribeToNotifications((notification) => {
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
    notificationService.showNotification(notification);
  }, []);

  return {
    notifications,
    dismissNotification,
    clearAllNotifications,
    showNotification,
  };
}

export function useNotificationEvents(leagueId: string, onEvent?: (event: NotificationEvent) => void) {
  const [lastEvent, setLastEvent] = useState<NotificationEvent | null>(null);

  useEffect(() => {
    if (!leagueId) return;
    
    console.log('🔔 Setting up notification events for league:', leagueId);
    const unsubscribe = notificationService.subscribeToEvents(leagueId, (event) => {
      console.log('📨 Received event in hook:', event.type, event);
      setLastEvent(event);
      onEvent?.(event);
    });

    return unsubscribe;
  }, [leagueId, onEvent]);

  return lastEvent;
}

// Hook for global events (like draft started - should refresh all users)
export function useGlobalNotificationEvents(onEvent?: (event: NotificationEvent) => void) {
  const [lastEvent, setLastEvent] = useState<NotificationEvent | null>(null);

  useEffect(() => {
    console.log('🌍 Setting up global notification events');
    const unsubscribe = notificationService.subscribeToEvents('*', (event) => {
      console.log('🌍 Received global event:', event.type, event);
      setLastEvent(event);
      onEvent?.(event);
    });

    return unsubscribe;
  }, [onEvent]);

  return lastEvent;
}

// Hook that automatically subscribes to notifications for all user's leagues
export function useUserLeagueNotifications(onEvent?: (event: NotificationEvent) => void) {
  const [userLeagues, setUserLeagues] = useState<string[]>([]);
  const [lastEvent, setLastEvent] = useState<NotificationEvent | null>(null);

  // Get user's leagues
  useEffect(() => {
    const fetchUserLeagues = async () => {
      try {
        // This would need to be implemented to get current user's leagues
        // For now, we'll use a placeholder
        console.log('🔍 Fetching user leagues...');
        // const leagues = await getCurrentUserLeagues();
        // setUserLeagues(leagues.map(l => l.id));
      } catch (error) {
        console.error('Failed to fetch user leagues:', error);
      }
    };

    fetchUserLeagues();
  }, []);

  // Subscribe to each league
  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    userLeagues.forEach(leagueId => {
      console.log('🔔 Subscribing to league notifications:', leagueId);
      const unsubscribe = notificationService.subscribeToEvents(leagueId, (event) => {
        console.log('📨 Received league event:', event.type, 'for league:', leagueId);
        setLastEvent(event);
        onEvent?.(event);
      });
      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [userLeagues, onEvent]);

  return { lastEvent, userLeagues };
}