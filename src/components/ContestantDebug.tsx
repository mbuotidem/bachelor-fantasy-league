'use client';

import React, { useState, useEffect } from 'react';
import { ContestantService } from '../services/contestant-service';
import { StorageService } from '../services/storage-service';
import { useImageUrl } from '../hooks/useImageUrl';
import type { Contestant } from '../types';

function ContestantImageTest({ contestant }: { contestant: Contestant }) {
  const imageUrl = useImageUrl(contestant.profileImageUrl);
  
  return (
    <div className="mt-2 space-y-2">
      <div className="text-xs">Generated URL: {imageUrl ? 'Success' : 'Failed'}</div>
      {imageUrl && (
        <>
          <div className="break-all text-xs">URL: {imageUrl}</div>
          <img 
            src={imageUrl} 
            alt={contestant.name}
            className="w-16 h-16 object-cover rounded"
            onLoad={() => console.log(`Image loaded successfully for ${contestant.name}`)}
            onError={(e) => {
              console.error(`Image failed to load for ${contestant.name}:`, e);
              console.error('Failed URL:', imageUrl);
            }}
          />
        </>
      )}
    </div>
  );
}

interface ContestantDebugProps {
  leagueId: string;
}

export default function ContestantDebug({ leagueId }: ContestantDebugProps) {
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);

  useEffect(() => {
    loadContestants();
  }, [leagueId]);

  const handleMigration = async () => {
    alert('Migration functionality has been removed.');
  };

  const loadContestants = async () => {
    try {
      const contestantService = new ContestantService();
      const data = await contestantService.getContestantsByLeague(leagueId);
      setContestants(data);
      
      // Log contestant data for debugging
      console.log('Loaded contestants:', data);
      data.forEach(contestant => {
        console.log(`Contestant ${contestant.name}:`, {
          id: contestant.id,
          profileImageUrl: contestant.profileImageUrl,
          hasUrl: !!contestant.profileImageUrl,
          urlLength: contestant.profileImageUrl?.length || 0,
          isLegacyUrl: contestant.profileImageUrl?.startsWith('http') || false
        });
      });
    } catch (error) {
      console.error('Failed to load contestants:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading debug info...</div>;
  }

  return (
    <div className="bg-gray-100 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Contestant Debug Info</h3>
        <button
          onClick={handleMigration}
          disabled={migrating}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {migrating ? 'Migrating...' : 'Migrate URLs'}
        </button>
      </div>
      <div className="space-y-2">
        {contestants.map(contestant => (
          <div key={contestant.id} className="bg-white p-3 rounded border">
            <div className="font-medium">{contestant.name}</div>
            <div className="text-sm text-gray-600">
              <div>ID: {contestant.id}</div>
              <div>Has Photo Path: {contestant.profileImageUrl ? 'Yes' : 'No'}</div>
              {contestant.profileImageUrl && (
                <>
                  <div>Path Length: {contestant.profileImageUrl.length}</div>
                  <div className="break-all">Stored Path: {contestant.profileImageUrl}</div>
                  <div>Is Legacy URL: {contestant.profileImageUrl.startsWith('http') ? 'Yes' : 'No'}</div>
                  <ContestantImageTest 
                    contestant={contestant}
                  />
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}