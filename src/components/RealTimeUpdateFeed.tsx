'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Trophy, Users, Star } from 'lucide-react';
import { useRealTimeNotificationEvents } from '../hooks/useRealTimeNotifications';
import type { NotificationEvent } from '../services/real-time-notification-service';

interface UpdateFeedItem {
  id: string;
  type: 'draft' | 'scoring' | 'standings';
  title: string;
  description: string;
  timestamp: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface RealTimeUpdateFeedProps {
  leagueId: string;
  maxItems?: number;
  showTimestamps?: boolean;
  className?: string;
}

export function RealTimeUpdateFeed({ 
  leagueId, 
  maxItems = 10, 
  showTimestamps = true,
  className = '' 
}: RealTimeUpdateFeedProps) {
  const [updates, setUpdates] = useState<UpdateFeedItem[]>([]);

  // Listen for real-time notification events
  useRealTimeNotificationEvents(leagueId, (event: NotificationEvent) => {
    const updateItem = createUpdateItem(event);
    if (updateItem) {
      setUpdates(prev => [updateItem, ...prev].slice(0, maxItems));
    }
  });

  const createUpdateItem = (event: NotificationEvent): UpdateFeedItem | null => {
    const baseItem = {
      id: crypto.randomUUID(),
      timestamp: event.timestamp,
    };

    switch (event.type) {
      case 'draft_started':
        return {
          ...baseItem,
          type: 'draft' as const,
          title: 'Draft Started',
          description: `The draft for ${event.data.leagueName} has begun!`,
          icon: Users,
          color: 'text-blue-600',
        };

      case 'draft_pick_made':
        return {
          ...baseItem,
          type: 'draft' as const,
          title: 'Draft Pick',
          description: `${event.data.teamName} selected ${event.data.contestantName}`,
          icon: Users,
          color: 'text-green-600',
        };

      case 'draft_completed':
        return {
          ...baseItem,
          type: 'draft' as const,
          title: 'Draft Complete',
          description: `The draft for ${event.data.leagueName} is finished!`,
          icon: Trophy,
          color: 'text-purple-600',
        };

      case 'scoring_event':
        const points = event.data.points as number;
        const isPositive = points > 0;
        return {
          ...baseItem,
          type: 'scoring' as const,
          title: `${event.data.contestantName} ${isPositive ? 'scored' : 'lost'} ${Math.abs(points)} points`,
          description: event.data.actionType as string,
          icon: Star,
          color: isPositive ? 'text-green-600' : 'text-red-600',
        };

      case 'standings_update':
        const changes = event.data.changes as Array<{ teamName: string; oldRank: number; newRank: number }>;
        if (changes.length > 0) {
          const change = changes[0];
          const direction = change.newRank < change.oldRank ? 'up' : 'down';
          return {
            ...baseItem,
            type: 'standings' as const,
            title: 'Standings Update',
            description: `${change.teamName} moved ${direction} to #${change.newRank}`,
            icon: Trophy,
            color: 'text-orange-600',
          };
        }
        return null;

      case 'episode_started':
        return {
          ...baseItem,
          type: 'scoring' as const,
          title: 'Episode Scoring Active',
          description: `Episode ${event.data.episodeNumber} scoring is now live`,
          icon: Star,
          color: 'text-blue-600',
        };

      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (updates.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-lg p-6 text-center ${className}`}>
        <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">No recent updates</p>
        <p className="text-sm text-gray-400 mt-1">Activity will appear here as it happens</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-gray-500" />
          Live Updates
        </h3>
      </div>
      
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {updates.map((update) => {
          const Icon = update.icon;
          return (
            <div key={update.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 ${update.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {update.title}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {update.description}
                  </p>
                  {showTimestamps && (
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTimestamp(update.timestamp)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}