'use client';

import React, { useState, useEffect } from 'react';
import ContestantCard from './ContestantCard';
import ContestantForm from './ContestantForm';
import { ContestantService } from '../services/contestant-service';
import { EpisodeService } from '../services/episode-service';
import { DEFAULT_EPISODE_NUMBER } from '../lib/constants';
import type { Contestant, CreateContestantInput } from '../types';

interface ContestantManagerProps {
  leagueId: string;
  isCommissioner: boolean;
}

export default function ContestantManager({ leagueId, isCommissioner }: ContestantManagerProps) {
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingContestant, setEditingContestant] = useState<Contestant | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'eliminated'>('all');

  const contestantService = new ContestantService();
  const episodeService = new EpisodeService();

  useEffect(() => {
    loadContestants();
  }, [leagueId]);

  const loadContestants = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await contestantService.getContestantsByLeague(leagueId);
      setContestants(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contestants');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContestant = async (input: CreateContestantInput) => {
    try {
      const newContestant = await contestantService.createContestant(input);
      setContestants(prev => [...prev, newContestant]);
      setShowForm(false);
    } catch (err) {
      throw err; // Let the form handle the error
    }
  };

  const handleUpdateContestant = async (contestant: Contestant) => {
    try {
      const updated = await contestantService.updateContestant({
        contestantId: contestant.id,
        name: contestant.name,
        age: contestant.age,
        hometown: contestant.hometown,
        occupation: contestant.occupation,
        bio: contestant.bio,
        profileImageUrl: contestant.profileImageUrl,
      });
      
      setContestants(prev => 
        prev.map(c => c.id === updated.id ? updated : c)
      );
      setEditingContestant(null);
    } catch (err) {
      throw err; // Let the form handle the error
    }
  };

  const handleFormSubmit = async (data: CreateContestantInput | Contestant) => {
    if ('id' in data) {
      // It's a Contestant (update)
      await handleUpdateContestant(data);
    } else {
      // It's a CreateContestantInput (create)
      await handleCreateContestant(data);
    }
  };

  const getCurrentEpisodeNumber = async (): Promise<number> => {
    try {
      return await episodeService.getCurrentEpisodeNumber(leagueId);
    } catch (error) {
      console.warn('Failed to get current episode number, using default:', error);
      return DEFAULT_EPISODE_NUMBER;
    }
  };

  const handleEliminate = async (contestant: Contestant) => {
    if (!window.confirm(`Are you sure you want to eliminate ${contestant.name}?`)) {
      return;
    }

    try {
      const episodeNumber = await getCurrentEpisodeNumber();
      const updated = await contestantService.eliminateContestant({
        contestantId: contestant.id,
        episodeNumber,
      });
      
      setContestants(prev => 
        prev.map(c => c.id === updated.id ? updated : c)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to eliminate contestant');
    }
  };

  const handleRestore = async (contestant: Contestant) => {
    try {
      const updated = await contestantService.restoreContestant(contestant.id);
      setContestants(prev => 
        prev.map(c => c.id === updated.id ? updated : c)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore contestant');
    }
  };

  const handleDelete = async (contestant: Contestant) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${contestant.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await contestantService.deleteContestant(contestant.id);
      setContestants(prev => prev.filter(c => c.id !== contestant.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete contestant');
    }
  };

  const filteredContestants = contestants
    .filter(contestant => {
      // Filter by status
      if (filterStatus === 'active' && contestant.isEliminated) return false;
      if (filterStatus === 'eliminated' && !contestant.isEliminated) return false;
      
      // Filter by search term
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          contestant.name.toLowerCase().includes(search) ||
          contestant.hometown?.toLowerCase().includes(search) ||
          contestant.occupation?.toLowerCase().includes(search)
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort by elimination status first (active contestants first), then by points
      if (a.isEliminated !== b.isEliminated) {
        return a.isEliminated ? 1 : -1;
      }
      return b.totalPoints - a.totalPoints;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
        <span className="ml-2 text-gray-600">Loading contestants...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Contestants</h2>
          <p className="text-gray-600">
            {contestants.length} total • {contestants.filter(c => !c.isEliminated).length} active • {contestants.filter(c => c.isEliminated).length} eliminated
          </p>
        </div>
        
        {isCommissioner && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
          >
            Add Contestant
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search contestants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            />
          </div>
        </div>

        {/* Status filter */}
        <div className="sm:w-48">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
          >
            <option value="all">All Contestants</option>
            <option value="active">Active Only</option>
            <option value="eliminated">Eliminated Only</option>
          </select>
        </div>
      </div>

      {/* Contestants Grid */}
      {filteredContestants.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No contestants found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : isCommissioner 
                ? 'Get started by adding your first contestant.'
                : 'The commissioner hasn\'t added any contestants yet.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredContestants.map((contestant) => (
            <ContestantCard
              key={contestant.id}
              contestant={contestant}
              onEdit={isCommissioner ? setEditingContestant : undefined}
              onEliminate={isCommissioner ? handleEliminate : undefined}
              onRestore={isCommissioner ? handleRestore : undefined}
              onDelete={isCommissioner ? handleDelete : undefined}
              isCommissioner={isCommissioner}
              showActions={isCommissioner}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {(showForm || editingContestant) && (
        <ContestantForm
          leagueId={leagueId}
          contestant={editingContestant}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingContestant(null);
          }}
        />
      )}
    </div>
  );
}