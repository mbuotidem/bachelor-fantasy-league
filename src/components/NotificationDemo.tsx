'use client';

import React from 'react';
import { useRealTimeNotifications } from '../hooks/useRealTimeNotifications';
import { RealTimeUpdateFeed } from './RealTimeUpdateFeed';
import { realTimeNotificationService } from '../services/real-time-notification-service';

interface NotificationDemoProps {
  leagueId?: string;
}

export function NotificationDemo({ leagueId = 'demo-league' }: NotificationDemoProps) {
  const { showNotification } = useRealTimeNotifications();

  const handleShowSuccess = () => {
    showNotification({
      type: 'success',
      title: 'Success!',
      message: 'This is a success notification',
      duration: 5000,
    });
  };

  const handleShowError = () => {
    showNotification({
      type: 'error',
      title: 'Error!',
      message: 'Something went wrong',
      duration: 5000,
    });
  };

  const handleShowInfo = () => {
    showNotification({
      type: 'info',
      title: 'Information',
      message: 'This is an informational message',
      duration: 5000,
    });
  };

  const handleShowWarning = () => {
    showNotification({
      type: 'warning',
      title: 'Warning!',
      message: 'This is a warning message',
      duration: 0, // Persistent
    });
  };

  const handleShowWithAction = () => {
    showNotification({
      type: 'info',
      title: 'Action Required',
      message: 'Click the action button to continue',
      duration: 0,
      action: {
        label: 'Take Action',
        onClick: () => {
          alert('Action taken!');
        },
      },
    });
  };

  const handleDraftStarted = async () => {
    await realTimeNotificationService.notifyDraftStarted(leagueId, 'Demo League');
  };

  const handleDraftPick = async () => {
    await realTimeNotificationService.notifyDraftPickMade(leagueId, 'Team Alpha', 'Jane Doe');
  };

  const handleScoringEvent = async () => {
    await realTimeNotificationService.notifyScoringEvent(leagueId, 'Jane Doe', 5, 'Kiss on mouth');
  };

  const handleNegativeScoringEvent = async () => {
    await realTimeNotificationService.notifyScoringEvent(leagueId, 'John Smith', -2, 'Crying per scene');
  };

  const handleStandingsUpdate = async () => {
    await realTimeNotificationService.notifyStandingsUpdate(leagueId, [
      { teamName: 'Team Alpha', oldRank: 5, newRank: 2 }
    ]);
  };

  const handleEpisodeStarted = async () => {
    await realTimeNotificationService.notifyEpisodeStarted(leagueId, 3);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Notification System Demo</h1>
      
      <div className="space-y-6">
        {/* <RealtimeNotificationTest leagueId={leagueId} /> */}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Toast Notifications</h2>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleShowSuccess}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Success Toast
            </button>
            
            <button
              onClick={handleShowError}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Error Toast
            </button>
            
            <button
              onClick={handleShowInfo}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Info Toast
            </button>
            
            <button
              onClick={handleShowWarning}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              Warning Toast
            </button>
          </div>
          
          <button
            onClick={handleShowWithAction}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Toast with Action
          </button>

          <h2 className="text-lg font-semibold mt-6">Real-time Events</h2>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDraftStarted}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Draft Started
            </button>
            
            <button
              onClick={handleDraftPick}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Draft Pick
            </button>
            
            <button
              onClick={handleScoringEvent}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Positive Score
            </button>
            
            <button
              onClick={handleNegativeScoringEvent}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Negative Score
            </button>
            
            <button
              onClick={handleStandingsUpdate}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              Standings Update
            </button>
            
            <button
              onClick={handleEpisodeStarted}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Episode Started
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Live Update Feed</h2>
          <RealTimeUpdateFeed 
            leagueId={leagueId} 
            maxItems={5}
            showTimestamps={true}
            className="h-96"
          />
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">How it works:</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Toast notifications appear in the top-right corner</li>
          <li>• Real-time events are shown in both toasts and the update feed</li>
          <li>• Events are synchronized across browser tabs using localStorage</li>
          <li>• The system handles errors gracefully and provides fallback mechanisms</li>
          <li>• All notifications are accessible and mobile-friendly</li>
        </ul>
      </div>
    </div>
  );
}