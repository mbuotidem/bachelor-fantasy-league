'use client';

import { NotificationDemo } from '../../components/NotificationDemo';

export default function TestNotificationsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <NotificationDemo leagueId="test-league-123" />
      </div>
    </div>
  );
}