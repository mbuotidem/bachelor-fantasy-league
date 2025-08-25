import { BaseService } from './base-service';
import type { ToastNotification } from '../components/NotificationToast';
import type { Schema } from '../lib/api-client';

export type NotificationEventType =
  | 'draft_started'
  | 'draft_turn'
  | 'draft_pick_made'
  | 'draft_completed'
  | 'draft_deleted'
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

// GraphQL subscription types
type NotificationModel = Schema['Notification']['type'];
type CreateNotificationData = Schema['Notification']['createType'];

class RealTimeNotificationService extends BaseService {
  private listeners: Map<string, Set<(notification: ToastNotification) => void>> = new Map();
  private eventListeners: Map<string, Set<(event: NotificationEvent) => void>> = new Map();
  private subscriptions: Map<string, { unsubscribe: () => void }> = new Map(); // Store active GraphQL subscriptions

  // Subscribe to toast notifications (local UI)
  subscribeToNotifications(callback: (notification: ToastNotification) => void): () => void {
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

  // Subscribe to notification events for a specific league (real-time GraphQL)
  subscribeToEvents(leagueId: string, callback: (event: NotificationEvent) => void): () => void {
    let listeners = this.eventListeners.get(leagueId);
    if (!listeners) {
      listeners = new Set();
      this.eventListeners.set(leagueId, listeners);

      // For global subscriptions (*), subscribe to ALL notifications
      if (leagueId === '*') {
        // Delay global subscription to ensure Amplify is fully configured
        setTimeout(() => {
          this.startGlobalGraphQLSubscription();
        }, 1000);
      } else {
        // Start GraphQL subscription for this specific league
        this.startGraphQLSubscription(leagueId);
      }
    }
    listeners.add(callback);

    return () => {
      const listeners = this.eventListeners.get(leagueId);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.eventListeners.delete(leagueId);
          // Stop GraphQL subscription if no more listeners
          if (leagueId === '*') {
            this.stopGlobalGraphQLSubscription();
          } else {
            this.stopGraphQLSubscription(leagueId);
          }
        }
      }
    };
  }

  // Start GraphQL subscription for a league
  private async startGraphQLSubscription(leagueId: string): Promise<void> {
    if (this.subscriptions.has(leagueId)) {
      return; // Already subscribed
    }

    try {
      // Subscribe to new notifications being created for this league
      const subscription = this.client.models.Notification.onCreate({
        filter: { leagueId: { eq: leagueId } }
      }).subscribe({
        next: (notification) => {
          console.log('🔔 Received new notification via GraphQL:', notification);
          // Process the new notification
          this.handleGraphQLNotification(notification);
        },
        error: (error) => {
          console.error('GraphQL subscription error:', error);
          // Retry subscription after delay
          setTimeout(() => {
            this.startGraphQLSubscription(leagueId);
          }, 5000);
        }
      });

      this.subscriptions.set(leagueId, subscription);
      console.log(`🔔 Started GraphQL subscription for league: ${leagueId}`);
    } catch (error) {
      console.error('Failed to start GraphQL subscription:', error);
    }
  }

  // Stop GraphQL subscription for a league
  private stopGraphQLSubscription(leagueId: string): void {
    const subscription = this.subscriptions.get(leagueId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(leagueId);
      console.log(`🔔 Stopped GraphQL subscription for league: ${leagueId}`);
    }
  }

  // Start global GraphQL subscription (listens to ALL notifications)
  private async startGlobalGraphQLSubscription(): Promise<void> {
    if (this.subscriptions.has('*')) {
      return; // Already subscribed
    }

    try {
      // Check if Amplify is configured before starting subscription
      if (!this.client) {
        console.warn('Amplify client not ready, retrying global subscription in 2 seconds...');
        setTimeout(() => {
          this.startGlobalGraphQLSubscription();
        }, 2000);
        return;
      }

      // Subscribe to ALL new notifications (no filter)
      const subscription = this.client.models.Notification.onCreate().subscribe({
        next: (notification) => {
          console.log('🌍 Received global notification via GraphQL:', notification);
          // Process the new notification
          this.handleGraphQLNotification(notification);
        },
        error: (error) => {
          console.error('Global GraphQL subscription error:', error);
          // Retry subscription after delay
          setTimeout(() => {
            this.startGlobalGraphQLSubscription();
          }, 5000);
        }
      });

      this.subscriptions.set('*', subscription);
      console.log('🌍 Started global GraphQL subscription');
    } catch (error) {
      console.error('Failed to start global GraphQL subscription:', error);
      
      // Retry after delay if there's an error
      setTimeout(() => {
        this.startGlobalGraphQLSubscription();
      }, 5000);
    }
  }

  // Stop global GraphQL subscription
  private stopGlobalGraphQLSubscription(): void {
    const subscription = this.subscriptions.get('*');
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete('*');
      console.log('🌍 Stopped global GraphQL subscription');
    }
  }

  // Handle incoming GraphQL notification
  private handleGraphQLNotification(notification: NotificationModel): void {
    try {
      const event: NotificationEvent = {
        type: notification.type as NotificationEventType,
        leagueId: notification.leagueId,
        data: notification.data ? JSON.parse(notification.data as string) : {},
        targetUserId: notification.targetUserId || undefined,
        timestamp: notification.createdAt,
      };

      // Check if this notification should be shown to the current user
      if (this.shouldShowNotificationToCurrentUser(event)) {
        // Customize the notification for the current user
        const customizedNotification = this.customizeNotificationForCurrentUser(event, notification);

        // Show toast notification
        this.showNotification({
          type: this.getToastType(event.type),
          title: customizedNotification.title,
          message: customizedNotification.message,
          duration: this.getNotificationDuration(event.type),
        });
      }

      // Always emit to event listeners (for app refresh logic, etc.)
      this.emitEventToListeners(event);

      // Clean up old notification from database
      this.cleanupNotification(notification.id);
    } catch (error) {
      console.error('Error handling GraphQL notification:', error);
    }
  }

  // Emit event to local listeners
  private emitEventToListeners(event: NotificationEvent): void {
    const listeners = this.eventListeners.get(event.leagueId);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in notification event listener:', error);
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
          console.error('Error in global notification event listener:', error);
        }
      });
    }
  }

  // Show a toast notification (local UI)
  showNotification(notification: Omit<ToastNotification, 'id'>): void {
    const fullNotification: ToastNotification = {
      ...notification,
      id: crypto.randomUUID(),
      duration: notification.duration ?? 5000,
    };

    const listeners = this.listeners.get('global');
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(fullNotification);
        } catch (error) {
          console.error('Error in notification listener:', error);
        }
      });
    }
  }

  // Create a notification in the database (triggers GraphQL subscription)
  async createNotification(
    leagueId: string,
    type: NotificationEventType,
    title: string,
    message?: string,
    data?: Record<string, unknown>,
    targetUserId?: string
  ): Promise<void> {
    try {
      const createData: CreateNotificationData = {
        leagueId,
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : undefined,
        targetUserId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      };

      console.log('🔔 Creating notification in database:', createData);
      const result = await this.client.models.Notification.create(createData);
      console.log('🔔 Notification created successfully:', result);
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  }

  // Clean up old notification from database
  private async cleanupNotification(notificationId: string): Promise<void> {
    try {
      await this.client.models.Notification.delete({ id: notificationId });
    } catch (error) {
      console.warn('Failed to cleanup notification:', error);
    }
  }

  // Convenience methods for common notifications
  async notifyDraftStarted(leagueId: string, leagueName: string): Promise<void> {
    await this.createNotification(
      leagueId,
      'draft_started',
      'Draft Started!',
      `The draft for ${leagueName} has begun. Get ready to pick your contestants!`,
      { leagueName }
    );
  }

  async notifyDraftTurn(leagueId: string, teamName: string, timeRemaining: number, targetUserId?: string): Promise<void> {
    await this.createNotification(
      leagueId,
      'draft_turn',
      'Draft Turn Update',
      `It's ${teamName}'s turn to pick. ${Math.ceil(timeRemaining / 1000)} seconds remaining.`,
      { teamName, timeRemaining, targetUserId },
      targetUserId
    );
  }

  async notifyDraftTurnSkipped(leagueId: string, teamName: string): Promise<void> {
    await this.createNotification(
      leagueId,
      'draft_turn',
      'Turn Skipped',
      `${teamName}'s time expired. Moving to next team.`,
      { teamName, skipped: true }
    );
  }

  async notifyDraftPickMade(leagueId: string, teamName: string, contestantName: string): Promise<void> {
    await this.createNotification(
      leagueId,
      'draft_pick_made',
      'Draft Pick Made',
      `${teamName} selected ${contestantName}`,
      { teamName, contestantName }
    );
  }

  async notifyDraftCompleted(leagueId: string, leagueName: string): Promise<void> {
    await this.createNotification(
      leagueId,
      'draft_completed',
      'Draft Complete!',
      `The draft for ${leagueName} is finished. Good luck this season!`,
      { leagueName }
    );
  }

  async notifyDraftDeleted(leagueId: string, leagueName: string): Promise<void> {
    await this.createNotification(
      leagueId,
      'draft_deleted',
      'Draft Deleted',
      `The draft for ${leagueName} has been deleted by the commissioner.`,
      { leagueName }
    );
  }

  async notifyScoringEvent(leagueId: string, contestantName: string, points: number, actionType: string): Promise<void> {
    const isPositive = points > 0;
    await this.createNotification(
      leagueId,
      'scoring_event',
      `${contestantName} ${isPositive ? 'scored' : 'lost'} ${Math.abs(points)} points`,
      actionType,
      { contestantName, points, actionType }
    );
  }

  async notifyStandingsUpdate(leagueId: string, changes: Array<{ teamName: string; oldRank: number; newRank: number }>): Promise<void> {
    if (changes.length === 0) return;

    const majorChanges = changes.filter(change => Math.abs(change.newRank - change.oldRank) >= 2);

    if (majorChanges.length > 0) {
      const change = majorChanges[0];
      const direction = change.newRank < change.oldRank ? 'up' : 'down';

      await this.createNotification(
        leagueId,
        'standings_update',
        'Standings Update',
        `${change.teamName} moved ${direction} to #${change.newRank}!`,
        { changes }
      );
    }
  }

  async notifyEpisodeStarted(leagueId: string, episodeNumber: number): Promise<void> {
    await this.createNotification(
      leagueId,
      'episode_started',
      'Episode Scoring Active',
      `Episode ${episodeNumber} scoring is now active. Start tracking points!`,
      { episodeNumber }
    );
  }

  // Helper methods
  private getToastType(eventType: NotificationEventType): ToastNotification['type'] {
    switch (eventType) {
      case 'draft_started':
      case 'episode_started':
        return 'info';
      case 'draft_pick_made':
      case 'draft_completed':
        return 'success';
      case 'draft_deleted':
        return 'warning';
      case 'draft_turn':
        return 'warning';
      case 'scoring_event':
        return 'success';
      case 'standings_update':
        return 'info';
      default:
        return 'info';
    }
  }

  private getNotificationDuration(eventType: NotificationEventType): number {
    switch (eventType) {
      case 'draft_started':
      case 'draft_completed':
      case 'draft_deleted':
        return 8000;
      case 'draft_turn':
        return 5000; // 5 seconds - same as draft picks for consistency
      case 'draft_pick_made':
        return 5000; // Standardized to 5 seconds
      case 'scoring_event':
        return 3000;
      case 'standings_update':
        return 5000;
      case 'episode_started':
        return 6000;
      default:
        return 5000;
    }
  }

  // Customize notification content for the current user
  private customizeNotificationForCurrentUser(event: NotificationEvent, notification: NotificationModel): { title: string; message: string } {
    const currentUserId = this.getCurrentUserIdForNotifications();
    const isTargetUser = event.targetUserId === currentUserId;

    switch (event.type) {
      case 'draft_turn':
        if (event.data.skipped) {
          return {
            title: '⏭️ Turn Skipped',
            message: `${event.data.teamName}'s time expired. Moving to next team.`
          };
        } else if (isTargetUser) {
          return {
            title: '🎯 Your Turn to Draft!',
            message: `It's your turn to pick! You have ${Math.ceil((event.data.timeRemaining as number || 120000) / 1000)} seconds remaining.`
          };
        } else {
          return {
            title: '⏳ Draft Update',
            message: `It's ${event.data.teamName}'s turn to pick.`
          };
        }

      case 'draft_pick_made':
        return {
          title: '✅ Draft Pick Made',
          message: `${event.data.teamName} selected ${event.data.contestantName}`
        };

      case 'draft_started':
        return {
          title: '🚀 Draft Started!',
          message: `The draft has begun. Get ready to pick your contestants!`
        };

      case 'draft_completed':
        return {
          title: '🎉 Draft Complete!',
          message: `The draft is finished. Good luck this season!`
        };

      case 'draft_deleted':
        return {
          title: '🗑️ Draft Deleted',
          message: `The draft has been deleted by the commissioner.`
        };

      default:
        return {
          title: notification.title,
          message: notification.message || ''
        };
    }
  }

  // Check if notification should be shown to current user
  private shouldShowNotificationToCurrentUser(event: NotificationEvent): boolean {
    // For targeted notifications, only show to the target user
    if (event.targetUserId) {
      const currentUserId = this.getCurrentUserIdForNotifications();
      if (currentUserId && event.targetUserId !== currentUserId) {
        console.log(`🎯 Skipping targeted notification for user ${event.targetUserId}, current user is ${currentUserId}`);
        return false;
      }
    }

    // Smart filtering based on notification type
    switch (event.type) {
      case 'draft_turn':
        // Show draft turn notifications to everyone, but customize the message
        return true;

      case 'draft_started':
      case 'draft_completed':
      case 'episode_started':
        // Everyone should see these
        return true;

      case 'draft_pick_made':
        // Show to everyone
        return true;

      case 'scoring_event':
        // Show to everyone who has the contestant
        return this.currentUserHasContestant(event);

      case 'standings_update':
        // Show to everyone
        return true;

      default:
        return true;
    }
  }

  // Get current user ID (you'll need to implement this based on your auth system)
  private getCurrentUserIdForNotifications(): string | null {
    try {
      // This is a placeholder - you'll need to implement based on your auth system
      // For now, we'll try to get it from the client or localStorage
      const authStatus = (this.client as Record<string, unknown>).authStatus as Record<string, unknown> | undefined;
      const user = authStatus?.user as Record<string, unknown> | undefined;
      return (user?.userId as string) || (user?.sub as string) || null;
    } catch (error) {
      console.warn('Could not get current user ID:', error);
      return null;
    }
  }

  // Check if it's the current user's turn to draft
  private isCurrentUsersTurn(event: NotificationEvent): boolean {
    // If there's a targetUserId, use that for targeting
    if (event.targetUserId) {
      const currentUserId = this.getCurrentUserIdForNotifications();
      return currentUserId === event.targetUserId;
    }

    // Fallback: check if the team name matches current user's team
    // This would require additional logic to map users to teams
    return true; // For now, show to everyone if no specific targeting
  }

  // Check if the current user performed this action
  private isCurrentUsersAction(_event: NotificationEvent): boolean {
    // This would require tracking who made the pick
    // For now, we'll show pick notifications to everyone
    return false;
  }

  // Check if current user has the contestant that scored
  private currentUserHasContestant(_event: NotificationEvent): boolean {
    // This would require checking if current user's team has the contestant
    // For now, show scoring events to everyone
    return true;
  }

  // Cleanup method to call on app shutdown
  cleanup(): void {
    // Unsubscribe from all GraphQL subscriptions
    this.subscriptions.forEach((subscription, leagueId) => {
      subscription.unsubscribe();
      console.log(`Cleaned up subscription for league: ${leagueId}`);
    });
    this.subscriptions.clear();

    // Clear all listeners
    this.listeners.clear();
    this.eventListeners.clear();
  }
}

export const realTimeNotificationService = new RealTimeNotificationService();