/**
 * Simple event emitter for standings updates
 * This will be replaced with GraphQL subscriptions in Task 11
 */

// Import React for the hook
import React from 'react';

type StandingsEventType = 'standings-updated' | 'scoring-event';

interface StandingsEvent {
  type: StandingsEventType;
  leagueId: string;
  data?: Record<string, unknown>;
}

class StandingsEventEmitter {
  private listeners: Map<string, Set<(event: StandingsEvent) => void>> = new Map();
  private isListeningToStorage = false;

  constructor() {
    this.setupStorageListener();
  }

  subscribe(leagueId: string, callback: (event: StandingsEvent) => void) {
    let leagueListeners = this.listeners.get(leagueId);
    if (!leagueListeners) {
      leagueListeners = new Set();
      this.listeners.set(leagueId, leagueListeners);
    }
    leagueListeners.add(callback);

    // Return unsubscribe function
    return () => {
      const leagueListeners = this.listeners.get(leagueId);
      if (leagueListeners) {
        leagueListeners.delete(callback);
        if (leagueListeners.size === 0) {
          this.listeners.delete(leagueId);
        }
      }
    };
  }

  emit(event: StandingsEvent) {
    // Emit to local listeners first
    this.emitToLocalListeners(event);
    
    // Also emit to other browser tabs/windows via localStorage
    this.emitToOtherTabs(event);
  }

  private emitToLocalListeners(event: StandingsEvent) {
    // If leagueId is '*', notify all leagues
    if (event.leagueId === '*') {
      this.listeners.forEach((leagueListeners) => {
        leagueListeners.forEach(callback => {
          try {
            callback(event);
          } catch (error) {
            console.error('Error in standings event listener:', error);
          }
        });
      });
    } else {
      const leagueListeners = this.listeners.get(event.leagueId);
      if (leagueListeners) {
        leagueListeners.forEach(callback => {
          try {
            callback(event);
          } catch (error) {
            console.error('Error in standings event listener:', error);
          }
        });
      }
    }
  }

  private emitToOtherTabs(event: StandingsEvent) {
    try {
      // Use localStorage to communicate with other tabs
      const eventData = {
        ...event,
        timestamp: Date.now(),
        source: 'standings-events',
        id: crypto.randomUUID()
      };
      
      // Set the event data with a unique key
      localStorage.setItem(`standings-event-${eventData.id}`, JSON.stringify(eventData));
      
      // Clean up old events (keep only last 10)
      this.cleanupOldEvents();
    } catch (error) {
      console.warn('Failed to emit event to other tabs:', error);
    }
  }

  private cleanupOldEvents() {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('standings-event-'));
      if (keys.length > 10) {
        // Remove oldest events
        keys.sort().slice(0, keys.length - 10).forEach(key => {
          localStorage.removeItem(key);
        });
      }
    } catch (error) {
      console.warn('Failed to cleanup old events:', error);
    }
  }

  // Method to trigger standings update (to be called after scoring)
  notifyStandingsUpdate(leagueId: string, data?: Record<string, unknown>) {
    this.emit({
      type: 'standings-updated',
      leagueId,
      data
    });
  }

  // Method to trigger scoring event (to be called after scoring)
  notifyScoringEvent(leagueId: string, data?: Record<string, unknown>) {
    this.emit({
      type: 'scoring-event',
      leagueId,
      data
    });
  }

  private setupStorageListener() {
    if (this.isListeningToStorage || typeof window === 'undefined') {
      return;
    }

    this.isListeningToStorage = true;
    let lastProcessedTimestamp = Date.now();

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('standings-event-') && e.newValue) {
        try {
          const eventData = JSON.parse(e.newValue);
          if (eventData.source === 'standings-events' && eventData.timestamp > lastProcessedTimestamp) {
            lastProcessedTimestamp = eventData.timestamp;
            // Only emit to local listeners, don't re-emit to storage
            this.emitToLocalListeners({
              type: eventData.type,
              leagueId: eventData.leagueId,
              data: eventData.data
            });
          }
        } catch (error) {
          console.warn('Failed to parse storage event:', error);
        }
      }
    };

    // Also poll for new events every 2 seconds as a fallback
    const pollForEvents = () => {
      try {
        const keys = Object.keys(localStorage).filter(key => key.startsWith('standings-event-'));
        keys.forEach(key => {
          const eventData = JSON.parse(localStorage.getItem(key) || '{}');
          if (eventData.source === 'standings-events' && eventData.timestamp > lastProcessedTimestamp) {
            lastProcessedTimestamp = eventData.timestamp;
            this.emitToLocalListeners({
              type: eventData.type,
              leagueId: eventData.leagueId,
              data: eventData.data
            });
          }
        });
      } catch (error) {
        console.warn('Failed to poll for events:', error);
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    
    // Fallback polling every 2 seconds
    setInterval(pollForEvents, 10000);
  }
}

// Global instance
export const standingsEvents = new StandingsEventEmitter();

// Hook for using standings events in React components
export function useStandingsEvents(leagueId: string, onUpdate: () => void) {
  const [isSubscribed, setIsSubscribed] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = standingsEvents.subscribe(leagueId, (event) => {
      if (event.type === 'standings-updated' || event.type === 'scoring-event') {
        onUpdate();
      }
    });

    setIsSubscribed(true);

    return () => {
      unsubscribe();
      setIsSubscribed(false);
    };
  }, [leagueId, onUpdate]);

  return isSubscribed;
}
