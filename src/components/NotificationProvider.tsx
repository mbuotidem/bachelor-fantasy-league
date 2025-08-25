'use client';

import React, { useEffect } from 'react';
import { NotificationContainer } from './NotificationContainer';
import { useNotifications, useGlobalNotificationEvents } from '../hooks/useNotifications';

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { notifications, dismissNotification } = useNotifications();

  // Listen for global events that should trigger app refresh
  useGlobalNotificationEvents((event) => {
    // Handle events that should refresh the app for all users
    if (event.type === 'draft_started') {
      // Force a page refresh to ensure all users see the draft
      setTimeout(() => {
        window.location.reload();
      }, 2000); // Give time for the notification to be seen
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