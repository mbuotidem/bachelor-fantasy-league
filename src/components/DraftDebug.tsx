'use client';

import React, { useState, useEffect } from 'react';
import { draftService } from '../services';
import type { Draft } from '../types';

interface DraftDebugProps {
  leagueId: string;
}

export default function DraftDebug({ leagueId }: DraftDebugProps) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAllDrafts = async () => {
    try {
      setLoading(true);
      setError(null);
      const allDrafts = await draftService.listDraftsByLeague(leagueId);
      setDrafts(allDrafts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load drafts');
    } finally {
      setLoading(false);
    }
  };

  const deleteDraft = async (draftId: string) => {
    if (!confirm(`Delete draft ${draftId}?`)) return;
    
    try {
      setLoading(true);
      await draftService.deleteDraft(draftId);
      await loadAllDrafts(); // Reload the list
      alert('Draft deleted successfully');
    } catch (err) {
      alert('Failed to delete draft: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const deleteAllDrafts = async () => {
    if (!confirm('Delete ALL drafts for this league? This cannot be undone!')) return;
    
    try {
      setLoading(true);
      const deletedCount = await draftService.deleteAllDraftsForLeague(leagueId);
      await loadAllDrafts(); // Reload the list
      alert(`Deleted ${deletedCount} drafts successfully`);
    } catch (err) {
      alert('Failed to delete drafts: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const cleanupLeague = async () => {
    if (!confirm('Clean up ALL draft data for this league? This will delete all drafts and reset all teams!')) return;
    
    try {
      setLoading(true);
      const result = await draftService.cleanupLeagueDraftData(leagueId);
      await loadAllDrafts(); // Reload the list
      alert(`Cleanup complete: ${result.draftsDeleted} drafts deleted, ${result.teamsReset} teams reset`);
    } catch (err) {
      alert('Failed to cleanup: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllDrafts();
  }, [leagueId]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">Draft Management</h2>
        <button
          onClick={loadAllDrafts}
          disabled={loading}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-4 mb-6">
        <button
          onClick={deleteAllDrafts}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          🗑️ Delete All Drafts
        </button>
        
        <button
          onClick={cleanupLeague}
          disabled={loading}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 ml-2"
        >
          🧹 Full Cleanup (Drafts + Teams)
        </button>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900">
          All Drafts ({drafts.length})
        </h3>
        
        {drafts.length === 0 ? (
          <p className="text-gray-500 italic">No drafts found</p>
        ) : (
          drafts.map((draft) => (
            <div key={draft.id} className="border rounded p-3 bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-mono text-sm text-gray-600 mb-1">
                    ID: {draft.id}
                  </div>
                  <div className="flex space-x-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      draft.status === 'completed' ? 'bg-green-100 text-green-800' :
                      draft.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {draft.status}
                    </span>
                    <span className="text-gray-600">
                      Pick: {draft.currentPick}
                    </span>
                    <span className="text-gray-600">
                      Teams: {draft.draftOrder.length}
                    </span>
                    <span className="text-gray-600">
                      Picks Made: {draft.picks.length}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Created: {new Date(draft.createdAt).toLocaleString()}
                  </div>

                </div>
                
                <button
                  onClick={() => deleteDraft(draft.id)}
                  disabled={loading}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}