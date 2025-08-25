'use client';

import React, { useState } from 'react';
import { useNotificationEvents } from '../hooks/useNotifications';
import { notificationService } from '../services/notification-service';

interface RealtimeNotificationTestProps {
  leagueId: string;
}

export function RealtimeNotificationTest({ leagueId }: RealtimeNotificationTestProps) {
  const [events, setEvents] = useState<string[]>([]);

  // Subscribe to real-time events for this league
  useNotificationEvents(leagueId, (event) => {
    setEvents(prev => [`${new Date().toLocaleTimeString()}: ${event.type} - ${JSON.stringify(event.data)}`, ...prev.slice(0, 9)]);
  });

  const testDraftStarted = () => {
    notificationService.notifyDraftStarted(leagueId, 'Test League');
  };

  const testScoringEvent = () => {
    notificationService.notifyScoringEvent(leagueId, 'Test Contestant', 5, 'Kiss on mouth');
  };

  const testDraftPick = () => {
    notificationService.notifyDraftPickMade(leagueId, 'Test Team', 'Test Contestant');
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">Real-time Notification Test</h3>
      <p className="text-sm text-gray-600 mb-4">League ID: {leagueId}</p>
      
      <div className="space-x-2 mb-4">
        <button
          onClick={testDraftStarted}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Test Draft Started
        </button>
        <button
          onClick={testScoringEvent}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Test Scoring Event
        </button>
        <button
          onClick={testDraftPick}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Test Draft Pick
        </button>
      </div>

      <div className="bg-gray-50 rounded p-4">
        <h4 className="font-medium mb-2">Recent Events:</h4>
        {events.length === 0 ? (
          <p className="text-gray-500 text-sm">No events yet. Try triggering a notification above.</p>
        ) : (
          <ul className="space-y-1 text-sm font-mono">
            {events.map((event, index) => (
              <li key={index} className="text-gray-700">{event}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
        <p className="text-sm text-yellow-800">
          <strong>Testing Instructions:</strong> Open this page in multiple browsers with different users logged in. 
          When you click a button in one browser, you should see the notification appear in ALL browsers.
        </p>
      </div>
    </div>
  );
}