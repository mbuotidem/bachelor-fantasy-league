import { BaseService } from './base-service';
import type { ToastNotification } from '../components/NotificationToast';
import type { Schema } from '../lib/api-client';

export type NotificationEventType = 
  | 'draft_started'
  | 'draft_turn'
  | 'draft_pick_made'
  | 'draft_completed'
  | 'scoring_event'
  | 'standings_update'
  | 'league_update'
  | 'episode_started'
  | 'episode_ended';

export interface NotificationEvent {
  type: NotificationEventType;
  leagueId: string;
  data: Record<string, unknown>;
  targetUserId?: string; // If specified, only notify this user
  timestamp: string;
}

export interface NotificationPreferences {
  draftNotifications: boolean;
  scoringUpdates: boolean;
  standingsChanges: boolean;
  episodeReminders: boolean;
}

class NotificationService extends BaseService {
  private listeners: Map<string, Set<(notification: ToastNotification) => void>> = new Map();
  private eventListeners: Map<string, Set<(event: NotificationEvent) => void>> = new Map();
  private subscriptions: Map<string, { unsubscribe: () => void }> = new Map(); // GraphQL subscriptions

  // Subscribe to toast notifications
  subscribeToNotifications(callback: (notification: ToastNotification) => void): () => void {
    const listenerId = crypto.randomUUID();
    let listeners = this.listeners.get('global');
    if (!listeners) {
      listeners = new Set();
      this.listeners.set('global', listeners);
    }
    listeners.add(callback);

    return () => {
      const listeners = this.listeners.get('global');
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete('global');
        }
      }
    };
  }

  // Subscribe to notification events (for app refresh, etc.)
  subscribeToEvents(leagueId: string, callback: (event: NotificationEvent) => void): () => void {
    let listeners = this.eventListeners.get(leagueId);
    if (!listeners) {
      listeners = new Set();
      this.eventListeners.set(leagueId, listeners);
    }
    listeners.add(callback);

    // Set up real-time GraphQL subscription for this league
    this.setupRealtimeSubscription(leagueId);

    return () => {
      const listeners = this.eventListeners.get(leagueId);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.eventListeners.delete(leagueId);
          // Clean up subscription when no more listeners
          this.cleanupRealtimeSubscription(leagueId);
        }
      }
    };
  }

  // Set up GraphQL subscription for real-time notifications
  private setupRealtimeSubscription(leagueId: string): void {
    // Don't create duplicate subscriptions
    if (this.subscriptions.has(leagueId)) {
      return;
    }

    try {
      console.log('🔔 Setting up real-time subscription for league:', leagueId);
      
      const subscription = this.client.models.Notification.observeQuery({
        filter: { leagueId: { eq: leagueId } }
      }).subscribe({
        next: ({ items }) => {
          // Process new notifications
          items.forEach(notification => {
            if (this.isRecentNotification(notification.createdAt)) {
              this.processRealtimeNotification(notification);
            }
          });
        },
        error: (error) => {
          console.error('Real-time subscription error:', error);
        }
      });

      this.subscriptions.set(leagueId, subscription);
      console.log('✅ Real-time subscription active for league:', leagueId);
    } catch (error) {
      console.error('Failed to set up real-time subscription:', error);
    }
  }

  private isRecentNotification(createdAt: string): boolean {
    const notificationTime = new Date(createdAt).getTime();
    const now = Date.now();
    // Consider notifications from the last 30 seconds as "new"
    return (now - notificationTime) < 30000;
  }

  private processRealtimeNotification(notification: Record<string, unknown>): void {
    try {
      console.log('📨 Processing real-time notification:', notification);
      
      const data = notification.data ? JSON.parse(notification.data as string) : {};
      const event: NotificationEvent = {
        type: notification.type as NotificationEventType,
        leagueId: notification.leagueId as string,
        data,
        timestamp: notification.createdAt as string,
        targetUserId: notification.targetUserId as string | undefined,
      };

      // Show toast notification
      this.showNotification({
        type: this.getToastType(event.type),
        title: notification.title as string,
        message: (notification.message as string) || '',
        duration: this.getNotificationDuration(event.type),
      });

      // Emit to event listeners
      this.emitToEventListeners(event);
      
    } catch (error) {
      console.error('Error processing real-time notification:', error);
    }
  }

  private getToastType(eventType: string): ToastNotification['type'] {
    switch (eventType) {
      case 'draft_started':
      case 'episode_started':
        return 'info';
      case 'draft_completed':
      case 'draft_pick_made':
        return 'success';
      case 'draft_turn':
        return 'warning';
      case 'scoring_event':
        return 'success';
      default:
        return 'info';
    }
  }

  private getNotificationDuration(eventType: string): number {
    switch (eventType) {
      case 'draft_turn':
        return 0; // Persistent
      case 'draft_started':
      case 'draft_completed':
        return 8000;
      default:
        return 5000;
    }
  }

  private emitToEventListeners(event: NotificationEvent): void {
    // Emit to specific league listeners
    const listeners = this.eventListeners.get(event.leagueId);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }

    // Also emit to global listeners
    const globalListeners = this.eventListeners.get('*');
    if (globalListeners) {
      globalListeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in global event listener:', error);
        }
      });
    }
  }

  private cleanupRealtimeSubscription(leagueId: string): void {
    const subscription = this.subscriptions.get(leagueId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(leagueId);
      console.log('🔕 Cleaned up real-time subscription for league:', leagueId);
    }
  }

  // Show a toast notification
  showNotification(notification: Omit<ToastNotification, 'id'>): void {
    const fullNotification: ToastNotification = {
      ...notification,
      id: crypto.randomUUID(),
      duration: notification.duration ?? 5000, // Default 5 seconds
    };

    this.emitNotification(fullNotification);
  }

  // Emit a notification event
  emitEvent(event: Omit<NotificationEvent, 'timestamp'>): void {
    const fullEvent: NotificationEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    this.emitNotificationEvent(fullEvent);
    
    // Also create a real-time notification in the database
    this.createRealtimeNotification(fullEvent);
  }

  // Create a real-time notification that all users can subscribe to
  private async createRealtimeNotification(event: NotificationEvent): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Expire after 1 hour

      await this.client.models.Notification.create({
        leagueId: event.leagueId,
        type: event.type,
        title: this.getNotificationTitle(event),
        message: this.getNotificationMessage(event),
        data: JSON.stringify(event.data),
        targetUserId: event.targetUserId,
        expiresAt: expiresAt.toISOString(),
      });

      console.log('✅ Created real-time notification:', event.type);
    } catch (error) {
      console.warn('Failed to create real-time notification:', error);
    }
  }

  private getNotificationTitle(event: NotificationEvent): string {
    switch (event.type) {
      case 'draft_started':
        return 'Draft Started!';
      case 'draft_pick_made':
        return 'Draft Pick Made';
      case 'draft_completed':
        return 'Draft Complete!';
      case 'draft_turn':
        return 'Your Turn to Draft!';
      case 'scoring_event':
        const points = event.data.points as number;
        const contestantName = event.data.contestantName as string;
        return `${contestantName} ${points > 0 ? 'scored' : 'lost'} ${Math.abs(points)} points`;
      case 'standings_update':
        return 'Standings Update';
      case 'episode_started':
        return 'Episode Scoring Active';
      default:
        return 'Notification';
    }
  }

  private getNotificationMessage(event: NotificationEvent): string {
    switch (event.type) {
      case 'draft_started':
        return `The draft for ${event.data.leagueName} has begun. Get ready to pick your contestants!`;
      case 'draft_pick_made':
        return `${event.data.teamName} selected ${event.data.contestantName}`;
      case 'draft_completed':
        return `The draft for ${event.data.leagueName} is finished. Good luck this season!`;
      case 'draft_turn':
        const timeRemaining = Math.ceil((event.data.timeRemaining as number) / 1000);
        return `It's ${event.data.teamName}'s turn to pick. You have ${timeRemaining} seconds remaining.`;
      case 'scoring_event':
        return event.data.actionType as string;
      case 'standings_update':
        const changes = event.data.changes as Array<{ teamName: string; oldRank: number; newRank: number }>;
        if (changes.length > 0) {
          const change = changes[0];
          const direction = change.newRank < change.oldRank ? 'up' : 'down';
          return `${change.teamName} moved ${direction} to #${change.newRank}!`;
        }
        return 'Rankings have been updated';
      case 'episode_started':
        return `Episode ${event.data.episodeNumber} scoring is now active. Start tracking points!`;
      default:
        return '';
    }
  }

  // Convenience methods for common notifications
  notifyDraftStarted(leagueId: string, leagueName: string): void {
    this.showNotification({
      type: 'info',
      title: 'Draft Started!',
      message: `The draft for ${leagueName} has begun. Get ready to pick your contestants!`,
      duration: 8000,
    });

    this.emitEvent({
      type: 'draft_started',
      leagueId,
      data: { leagueName },
    });
  }

  notifyDraftTurn(leagueId: string, teamName: string, timeRemaining: number): void {
    this.showNotification({
      type: 'warning',
      title: 'Your Turn to Draft!',
      message: `It's ${teamName}'s turn to pick. You have ${Math.ceil(timeRemaining / 1000)} seconds remaining.`,
      duration: 0, // Persistent until dismissed
    });

    this.emitEvent({
      type: 'draft_turn',
      leagueId,
      data: { teamName, timeRemaining },
    });
  }

  notifyDraftPickMade(leagueId: string, teamName: string, contestantName: string): void {
    this.showNotification({
      type: 'success',
      title: 'Draft Pick Made',
      message: `${teamName} selected ${contestantName}`,
      duration: 4000,
    });

    this.emitEvent({
      type: 'draft_pick_made',
      leagueId,
      data: { teamName, contestantName },
    });
  }

  notifyDraftCompleted(leagueId: string, leagueName: string): void {
    this.showNotification({
      type: 'success',
      title: 'Draft Complete!',
      message: `The draft for ${leagueName} is finished. Good luck this season!`,
      duration: 8000,
    });

    this.emitEvent({
      type: 'draft_completed',
      leagueId,
      data: { leagueName },
    });
  }

  notifyScoringEvent(leagueId: string, contestantName: string, points: number, actionType: string): void {
    const isPositive = points > 0;
    this.showNotification({
      type: isPositive ? 'success' : 'warning',
      title: `${contestantName} ${isPositive ? 'scored' : 'lost'} ${Math.abs(points)} points`,
      message: actionType,
      duration: 3000,
    });

    this.emitEvent({
      type: 'scoring_event',
      leagueId,
      data: { contestantName, points, actionType },
    });
  }

  notifyStandingsUpdate(leagueId: string, changes: Array<{ teamName: string; oldRank: number; newRank: number }>): void {
    if (changes.length === 0) return;

    const majorChanges = changes.filter(change => Math.abs(change.newRank - change.oldRank) >= 2);
    
    if (majorChanges.length > 0) {
      const change = majorChanges[0];
      const direction = change.newRank < change.oldRank ? 'up' : 'down';
      
      this.showNotification({
        type: 'info',
        title: 'Standings Update',
        message: `${change.teamName} moved ${direction} to #${change.newRank}!`,
        duration: 5000,
      });
    }

    this.emitEvent({
      type: 'standings_update',
      leagueId,
      data: { changes },
    });
  }

  notifyEpisodeStarted(leagueId: string, episodeNumber: number): void {
    this.showNotification({
      type: 'info',
      title: 'Episode Scoring Active',
      message: `Episode ${episodeNumber} scoring is now active. Start tracking points!`,
      duration: 6000,
    });

    this.emitEvent({
      type: 'episode_started',
      leagueId,
      data: { episodeNumber },
    });
  }

  // Private methods
  private emitNotification(notification: ToastNotification): void {
    // Emit to local listeners
    const listeners = this.listeners.get('global');
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(notification);
        } catch (error) {
          console.error('Error in notification listener:', error);
        }
      });
    }
  }

  private emitNotificationEvent(event: NotificationEvent): void {
    // Emit to local listeners (for the user who triggered the action)
    this.emitToEventListeners(event);
  }


}

export const notificationService = new NotificationService();