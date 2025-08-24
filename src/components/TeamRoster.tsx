'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getUrl } from 'aws-amplify/storage';
import { draftService, contestantService } from '../services';
import type { Draft, Contestant, Team, DraftPick } from '../types';

interface TeamRosterProps {
  team: Team;
  draft?: Draft | null;
  showDraftOrder?: boolean;
  className?: string;
}

interface RosterSlot {
  position: number;
  contestant?: Contestant;
  pick?: DraftPick;
  isEmpty: boolean;
}

interface ProfileImageProps {
  src?: string;
  alt?: string;
  className?: string;
}

function ProfileImage({ src, alt, className = '' }: ProfileImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [refreshedUrl, setRefreshedUrl] = useState<string | null>(null);

  // Function to refresh expired URLs (same as ContestantCard)
  const refreshImageUrl = async (originalUrl: string) => {
    try {
      // Extract S3 key from the URL if it's a full URL
      let s3Key = originalUrl;
      if (originalUrl.startsWith('http')) {
        const urlObj = new URL(originalUrl);
        s3Key = urlObj.pathname.substring(1); // Remove leading slash
        s3Key = decodeURIComponent(s3Key);
      }

      // Generate a fresh URL
      const result = await getUrl({
        path: s3Key,
        options: {
          expiresIn: 3600 // 1 hour
        }
      });
      
      setRefreshedUrl(result.url.toString());
      setImageError(false);
      setImageLoading(false);
    } catch (error) {
      console.error('Failed to refresh image URL:', error);
      setImageError(true);
      setImageLoading(false);
    }
  };

  // Reset states when src changes
  useEffect(() => {
    if (src) {
      setImageError(false);
      setImageLoading(true);
      setRefreshedUrl(null);
    }
  }, [src]);

  const handleImageError = () => {
    if (!refreshedUrl && src) {
      // Try to refresh the URL once
      refreshImageUrl(src);
    } else {
      setImageError(true);
      setImageLoading(false);
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  // Show placeholder if no src or final error
  if (!src || imageError) {
    return (
      <div className={`w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center ${className}`} 
           title="No image available">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {imageLoading && (
        <div className="absolute inset-0 w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={refreshedUrl || src}
        alt={alt || 'Profile'}
        className="w-16 h-16 rounded-lg object-cover"
        onError={handleImageError}
        onLoad={handleImageLoad}
        style={{ display: imageLoading ? 'none' : 'block' }}
      />
    </div>
  );
}

export default function TeamRoster({ 
  team, 
  draft, 
  showDraftOrder = false, 
  className = '' 
}: TeamRosterProps) {
  const [rosterSlots, setRosterSlots] = useState<RosterSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRosterData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Create 5 roster slots (max contestants per team)
      const slots: RosterSlot[] = [];
      
      if (draft) {
        // Get team's picks from the draft
        const teamPicks = draftService.getTeamPicks(draft, team.id);
        
        // Sort picks by pick number to ensure correct order
        const sortedPicks = teamPicks.sort((a, b) => a.pickNumber - b.pickNumber);
        
        // Load contestant details for each pick in parallel
        const contestantPromises = sortedPicks.map(async (pick, index) => {
          try {
            const contestant = await contestantService.getContestant(pick.contestantId);
            return { contestant, pick, position: index + 1 };
          } catch (err) {
            console.warn(`Failed to load contestant ${pick.contestantId} for position ${index + 1}:`, err);
            return { contestant: null, pick, position: index + 1 };
          }
        });

        const contestantResults = await Promise.all(contestantPromises);
        
        // Create slots for all 5 positions
        for (let i = 0; i < 5; i++) {
          const result = contestantResults[i];
          
          if (result) {
            slots.push({
              position: result.position,
              contestant: result.contestant || undefined,
              pick: result.pick,
              isEmpty: false,
            });
          } else {
            slots.push({
              position: i + 1,
              isEmpty: true,
            });
          }
        }
      } else {
        // No draft, show empty slots or use team's draftedContestants
        const draftedContestantIds = team.draftedContestants || [];
        
        // Load contestant details in parallel
        const contestantPromises = draftedContestantIds.map(async (contestantId) => {
          try {
            const contestant = await contestantService.getContestant(contestantId);
            return contestant;
          } catch (err) {
            console.warn(`Failed to load contestant ${contestantId}:`, err);
            return null;
          }
        });

        const contestants = await Promise.all(contestantPromises);
        
        // Create slots for all 5 positions
        for (let i = 0; i < 5; i++) {
          const contestant = contestants[i];
          
          if (contestant) {
            slots.push({
              position: i + 1,
              contestant,
              isEmpty: false,
            });
          } else {
            slots.push({
              position: i + 1,
              isEmpty: true,
            });
          }
        }
      }

      setRosterSlots(slots);
    } catch (err) {
      console.error('Error loading roster data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load roster');
    } finally {
      setLoading(false);
    }
  }, [team, draft]);

  useEffect(() => {
    loadRosterData();
  }, [loadRosterData]);

  const getPickOrderText = (pick: DraftPick): string => {
    if (!draft) return '';
    
    const round = Math.ceil(pick.pickNumber / draft.draftOrder.length);
    const positionInRound = ((pick.pickNumber - 1) % draft.draftOrder.length) + 1;
    
    return `Round ${round}, Pick ${positionInRound} (Overall #${pick.pickNumber})`;
  };

  const formatPickTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{team.name} Roster</h3>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-600"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{team.name} Roster</h3>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  const filledSlots = rosterSlots.filter(slot => !slot.isEmpty);
  const emptySlots = rosterSlots.filter(slot => slot.isEmpty);

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{team.name} Roster</h3>
          <p className="text-sm text-gray-600">
            {filledSlots.length} of 5 contestants drafted
          </p>
        </div>
        
        {/* Roster Progress and Refresh */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-rose-600 transition-all duration-300"
                style={{ width: `${(filledSlots.length / 5) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {filledSlots.length}/5
            </span>
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={loadRosterData}
            disabled={loading}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh roster"
          >
            <svg 
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Roster Slots */}
      <div className="space-y-4">
        {/* Filled Slots */}
        {filledSlots.map((slot) => (
          <div key={slot.position} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start space-x-4">
              {/* Position Number */}
              <div className="flex-shrink-0 w-8 h-8 bg-rose-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                {slot.position}
              </div>
              
              {/* Contestant Info */}
              <div className="flex-1 min-w-0">
                {slot.contestant ? (
                  <div className="flex items-center space-x-4">
                    {/* Contestant Details */}
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {slot.contestant.name}
                      </h4>
                      <div className="flex flex-wrap gap-2 text-sm text-gray-600 mt-1">
                        {slot.contestant.age && (
                          <span>Age {slot.contestant.age}</span>
                        )}
                        {slot.contestant.hometown && (
                          <span>• {slot.contestant.hometown}</span>
                        )}
                        {slot.contestant.occupation && (
                          <span>• {slot.contestant.occupation}</span>
                        )}
                      </div>
                      
                      {/* Draft Info */}
                      {showDraftOrder && slot.pick && (
                        <div className="mt-2 text-xs text-gray-500">
                          <div>{getPickOrderText(slot.pick)}</div>
                          <div>Drafted at {formatPickTime(slot.pick.timestamp)}</div>
                        </div>
                      )}
                      

                    </div>
                    
                    {/* Profile Image with Fallback */}
                    <ProfileImage 
                      src={slot.contestant.profileImageUrl}
                      alt={slot.contestant.name}
                      className="flex-shrink-0"
                    />
                  </div>
                ) : (
                  <div className="text-gray-500">
                    <div className="font-medium">Contestant #{slot.pick?.contestantId}</div>
                    <div className="text-sm">Failed to load details</div>
                    {showDraftOrder && slot.pick && (
                      <div className="mt-1 text-xs">
                        <div>{getPickOrderText(slot.pick)}</div>
                        <div>Drafted at {formatPickTime(slot.pick.timestamp)}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Empty Slots */}
        {emptySlots.map((slot) => (
          <div key={slot.position} className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <div className="flex items-center space-x-4">
              {/* Position Number */}
              <div className="flex-shrink-0 w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold">
                {slot.position}
              </div>
              
              {/* Empty Slot Message */}
              <div className="flex-1 text-center py-4">
                <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <p className="text-gray-500 font-medium">Empty Roster Spot</p>
                <p className="text-gray-400 text-sm">Waiting for draft pick</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Roster Summary */}
      {filledSlots.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total Points</span>
            <span className="font-semibold text-gray-900">
              {filledSlots.reduce((total, slot) => 
                total + (slot.contestant?.totalPoints || 0), 0
              )} pts
            </span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filledSlots.length === 0 && (
        <div className="text-center py-8">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No Contestants Drafted</h4>
          <p className="text-gray-600">
            {draft?.status === 'not_started' 
              ? 'The draft is ready but hasn&apos;t started yet.'
              : draft?.status === 'in_progress'
                ? 'Start drafting contestants to build your team!'
                : 'This team didn\'t draft any contestants.'
            }
          </p>
        </div>
      )}
    </div>
  );
}