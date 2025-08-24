'use client';

import React, { useState } from 'react';
import { userMigrationService } from '../services';

interface UserMigrationButtonProps {
  leagueId: string;
  className?: string;
}

export default function UserMigrationButton({ leagueId, className = '' }: UserMigrationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleMigration = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      await userMigrationService.createMissingUserRecords(leagueId);
      setMessage('✅ User records created successfully! Refresh the page to see updated names.');
    } catch (error) {
      console.error('Migration failed:', error);
      setMessage('❌ Migration failed. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCurrentUserSetup = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      await userMigrationService.createCurrentUserRecord();
      setMessage('✅ Your user record created successfully! Refresh the page to see your name.');
    } catch (error) {
      console.error('User setup failed:', error);
      setMessage('❌ User setup failed. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={handleCurrentUserSetup}
          disabled={isLoading}
          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Setting up...' : 'Setup My Name'}
        </button>
        
        <button
          onClick={handleMigration}
          disabled={isLoading}
          className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Migrating...' : 'Fix All Names'}
        </button>
      </div>
      
      {message && (
        <div className="text-xs p-2 bg-gray-100 rounded border">
          {message}
        </div>
      )}
      
      <div className="text-xs text-gray-500">
        <p><strong>Setup My Name:</strong> Creates a user record for you</p>
        <p><strong>Fix All Names:</strong> Creates user records for all team owners in this league</p>
      </div>
    </div>
  );
}