'use client';

import React, { useState, useEffect } from 'react';
import { realTimeNotificationService, type NotificationEvent } from '../../services/real-time-notification-service';

export default function NotificationDebugPage() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [lastEvent, setLastEvent] = useState<NotificationEvent | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [testLeagueId, setTestLeagueId] = useState('test-league-123');
  const [simulatedUserId, setSimulatedUserId] = useState('test-user-123');

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 20));
    console.log(`🧪 NotificationDebug: ${message}`);
  };

  useEffect(() => {
    addLog('Component mounted, setting up global subscription...');
    
    // Subscribe to ALL events globally
    const unsubscribe = realTimeNotificationService.subscribeToEvents('*', (event) => {
      addLog(`Received event: ${event.type} for league ${event.leagueId}`);
      setLastEvent(event);
    });

    setIsSubscribed(true);
    addLog('Subscribed to global notifications');

    return () => {
      addLog('Cleaning up subscription...');
      unsubscribe();
      setIsSubscribed(false);
    };
  }, []);

  const handleTestDraftStarted = async () => {
    try {
      addLog(`Sending draft started notification for league: ${testLeagueId}...`);
      await realTimeNotificationService.notifyDraftStarted(testLeagueId, 'Test League');
      addLog('Draft started notification sent!');
    } catch (error) {
      addLog(`Error sending notification: ${error}`);
    }
  };

  const handleTestScoringEvent = async () => {
    try {
      addLog(`Sending scoring event for league: ${testLeagueId}...`);
      await realTimeNotificationService.notifyScoringEvent(testLeagueId, 'Test Contestant', 5, 'Test Action');
      addLog('Scoring event sent!');
    } catch (error) {
      addLog(`Error sending scoring event: ${error}`);
    }
  };

  const handleTestDraftPick = async () => {
    try {
      addLog(`Sending draft pick notification for league: ${testLeagueId}...`);
      await realTimeNotificationService.notifyDraftPickMade(testLeagueId, 'Test Team', 'Test Contestant');
      addLog('Draft pick notification sent!');
    } catch (error) {
      addLog(`Error sending draft pick: ${error}`);
    }
  };

  const handleTestDraftTurn = async () => {
    try {
      addLog(`Sending draft turn notification for league: ${testLeagueId}...`);
      addLog(`Target user: ${simulatedUserId}`);
      // Test with a specific user ID - in real app this would be the actual team owner
      await realTimeNotificationService.notifyDraftTurn(testLeagueId, 'Alpha Team', 120000, simulatedUserId);
      addLog('Draft turn notification sent with target user!');
    } catch (error) {
      addLog(`Error sending draft turn: ${error}`);
    }
  };

  const handleTestDraftDeleted = async () => {
    try {
      addLog(`Sending draft deleted notification for league: ${testLeagueId}...`);
      await realTimeNotificationService.notifyDraftDeleted(testLeagueId, 'Test League');
      addLog('Draft deleted notification sent! Page should refresh in 2 seconds...');
    } catch (error) {
      addLog(`Error sending draft deleted: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-8">🧪 Real-Time Notification Debug</h1>
        
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Test League ID:</label>
              <input
                type="text"
                value={testLeagueId}
                onChange={(e) => setTestLeagueId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter league ID to test with"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Simulated User ID:</label>
              <input
                type="text"
                value={simulatedUserId}
                onChange={(e) => setSimulatedUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="test-user-123"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <p><strong>Global Subscription Status:</strong> 
              <span className={isSubscribed ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>
                {isSubscribed ? '✅ Subscribed to ALL notifications' : '❌ Not Subscribed'}
              </span>
            </p>
          </div>

          <div className="space-y-2 mb-6">
            <button
              onClick={handleTestDraftStarted}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
            >
              🚀 Send Draft Started
            </button>
            
            <button
              onClick={handleTestScoringEvent}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mr-2"
            >
              ⭐ Send Scoring Event
            </button>

            <button
              onClick={handleTestDraftPick}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 mr-2"
            >
              🎯 Send Draft Pick
            </button>

            <button
              onClick={handleTestDraftTurn}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 mr-2"
            >
              ⏰ Send Draft Turn
            </button>

            <button
              onClick={handleTestDraftDeleted}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              🗑️ Send Draft Deleted
            </button>
          </div>

          {lastEvent && (
            <div className="mb-6 p-4 bg-blue-50 rounded border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">Last Event Received:</h3>
              <pre className="text-sm text-blue-700 overflow-auto whitespace-pre-wrap">
                {JSON.stringify(lastEvent, null, 2)}
              </pre>
            </div>
          )}

          <div className="bg-gray-50 rounded border p-4">
            <h3 className="font-semibold mb-3">Activity Log:</h3>
            <div className="text-sm space-y-1 max-h-60 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-500">No activity yet...</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="font-mono text-xs py-1 border-b border-gray-200 last:border-b-0">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">🧪 Testing Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-700">
            <li><strong>Open this page in 2+ browsers</strong> (different windows/tabs/browsers)</li>
            <li><strong>Click any test button</strong> in one browser</li>
            <li><strong>Watch the activity logs</strong> - you should see the event appear in ALL browsers</li>
            <li><strong>For draft started events</strong> - the page should refresh automatically after 2 seconds</li>
            <li><strong>Check browser console</strong> for detailed GraphQL subscription logs</li>
          </ol>
          
          <div className="mt-4 p-3 bg-yellow-100 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Expected Console Logs:</strong><br/>
              • 🌍 Started global GraphQL subscription<br/>
              • 🔔 Creating notification in database<br/>
              • 🌍 Received global notification via GraphQL<br/>
              • 🚨 RealTimeNotificationProvider received event
            </p>
          </div>

          <div className="mt-4 p-3 bg-blue-100 rounded">
            <p className="text-sm text-blue-800">
              <strong>🧠 Smart Notifications Testing:</strong><br/>
              • <strong>Draft Turn:</strong> Only the target user gets &quot;Your Turn to Draft!&quot;, others get &quot;Draft Update&quot;<br/>
              • <strong>Different User IDs:</strong> Change the &quot;Simulated User ID&quot; in different browsers to test targeting<br/>
              • <strong>User ID &quot;test-user-123&quot;:</strong> Will get &quot;Your Turn&quot; message<br/>
              • <strong>Any other User ID:</strong> Will get &quot;Draft Update&quot; message
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}