'use client';

import React, { useEffect } from 'react';
import { NotificationContainer } from './NotificationContainer';
import { useRealTimeNotifications, useGlobalRealTimeNotificationEvents } from '../hooks/useRealTimeNotifications';
import { useDataRefresh } from '../contexts/DataRefreshContext';

interface RealTimeNotificationProviderProps {
  children: React.ReactNode;
}

export function RealTimeNotificationProvider({ children }: RealTimeNotificationProviderProps) {
  const { notifications, dismissNotification } = useRealTimeNotifications();
  const { triggerDraftDataRefresh } = useDataRefresh();

  // Listen for global events that should trigger data refresh (not page refresh!)
  useGlobalRealTimeNotificationEvents((event) => {
    console.log('🚨 RealTimeNotificationProvider received event:', event);
    
    // Handle events that should refresh data for all users (without page reload)
    if (event.type === 'draft_started') {
      console.log('🚨 Draft started - refreshing draft data in 2 seconds...');
      // Trigger data refresh to ensure all users see the draft (preserves timer!)
      setTimeout(async () => {
        console.log('🚨 Refreshing draft data now!');
        await triggerDraftDataRefresh();
      }, 2000); // Give time for the notification to be seen
    } else if (event.type === 'draft_deleted') {
      console.log('🚨 Draft deleted - refreshing draft data in 2 seconds...');
      // Trigger data refresh to prevent users from interacting with deleted draft
      setTimeout(async () => {
        console.log('🚨 Refreshing draft data after deletion!');
        await triggerDraftDataRefresh();
      }, 2000); // Give time for the notification to be seen
    } else if (event.type === 'draft_pick_made') {
      console.log('🚨 Draft pick made - refreshing draft data immediately...');
      // Refresh immediately for draft picks to update timer and available contestants
      triggerDraftDataRefresh().catch(console.error);
    } else if (event.type === 'draft_turn') {
      console.log('🚨 Draft turn changed - refreshing draft data immediately...');
      // Refresh immediately for turn changes to update timer
      triggerDraftDataRefresh().catch(console.error);
    }
  });

  return (
    <>
      {children}
      <NotificationContainer
        notifications={notifications}
        onDismiss={dismissNotification}
        position="top-right"
      />
    </>
  );
}