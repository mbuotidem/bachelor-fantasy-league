'use client';

import React from 'react';
import { NotificationToast, type ToastNotification } from './NotificationToast';

interface NotificationContainerProps {
  notifications: ToastNotification[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const positionClasses = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
};

export function NotificationContainer({ 
  notifications, 
  onDismiss, 
  position = 'top-right' 
}: NotificationContainerProps) {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div
      className={`
        fixed ${positionClasses[position]} z-50 
        flex flex-col space-y-2 pointer-events-none
        max-h-screen overflow-hidden
      `}
      aria-live="polite"
      aria-label="Notifications"
    >
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}