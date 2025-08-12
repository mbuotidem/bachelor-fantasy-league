'use client';

import React, { useState } from 'react';
import { LeagueService } from '../services/league-service';
import { validateCreateLeagueInput } from '../lib/validation';
import type { CreateLeagueInput, League, ValidationError } from '../types';

interface LeagueCreatorProps {
  onLeagueCreated?: (league: League) => void;
  onCancel?: () => void;
}

export default function LeagueCreator({ onLeagueCreated, onCancel }: LeagueCreatorProps) {
  const [formData, setFormData] = useState<CreateLeagueInput>({
    name: '',
    season: '',
    settings: {
      maxTeams: 20,
      contestantDraftLimit: 2,
      draftFormat: 'snake',
      scoringRules: [],
      notificationSettings: {
        scoringUpdates: true,
        draftNotifications: true,
        standingsChanges: true,
        episodeReminders: true,
      },
    },
  });

  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const leagueService = new LeagueService();

  const handleInputChange = (field: keyof CreateLeagueInput, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear field-specific errors when user starts typing
    setErrors(prev => prev.filter(error => error.field !== field));
  };

  const handleSettingsChange = (field: string, value: string | number | boolean | object) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings!,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    // Validate form data
    const validation = validateCreateLeagueInput(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setIsSubmitting(false);
      return;
    }

    try {
      const league = await leagueService.createLeague(formData);
      onLeagueCreated?.(league);
    } catch (error) {
      console.error('Failed to create league:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to create league');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldError = (fieldName: string) => {
    return errors.find(error => error.field === fieldName)?.message;
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New League</h2>
        <p className="text-gray-600">
          Set up your Bachelor Fantasy League and invite friends to join the fun!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* League Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            League Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 ${
              getFieldError('name') ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., MAM FAM Bachelor Fantasy League"
            maxLength={100}
          />
          {getFieldError('name') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('name')}</p>
          )}
        </div>

        {/* Season */}
        <div>
          <label htmlFor="season" className="block text-sm font-medium text-gray-700 mb-2">
            Season *
          </label>
          <input
            type="text"
            id="season"
            value={formData.season}
            onChange={(e) => handleInputChange('season', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 ${
              getFieldError('season') ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., Grant Ellis - Season 29"
            maxLength={50}
          />
          {getFieldError('season') && (
            <p className="mt-1 text-sm text-red-600">{getFieldError('season')}</p>
          )}
        </div>

        {/* League Settings */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">League Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Max Teams */}
            <div>
              <label htmlFor="maxTeams" className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Teams
              </label>
              <select
                id="maxTeams"
                value={formData.settings?.maxTeams?.toString() || '20'}
                onChange={(e) => handleSettingsChange('maxTeams', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              >
                {[4, 6, 8, 10, 12, 14, 16, 18, 20].map(num => (
                  <option key={num} value={num.toString()}>{num} teams</option>
                ))}
              </select>
            </div>

            {/* Draft Limit */}
            <div>
              <label htmlFor="draftLimit" className="block text-sm font-medium text-gray-700 mb-2">
                Contestant Draft Limit
              </label>
              <select
                id="draftLimit"
                value={formData.settings?.contestantDraftLimit?.toString() || '2'}
                onChange={(e) => handleSettingsChange('contestantDraftLimit', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              >
                {[1, 2, 3, 4, 5].map(num => (
                  <option key={num} value={num.toString()}>{num} team{num > 1 ? 's' : ''} per contestant</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                How many teams can draft the same contestant
              </p>
            </div>

            {/* Draft Format */}
            <div>
              <label htmlFor="draftFormat" className="block text-sm font-medium text-gray-700 mb-2">
                Draft Format
              </label>
              <select
                id="draftFormat"
                value={formData.settings?.draftFormat || 'snake'}
                onChange={(e) => handleSettingsChange('draftFormat', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              >
                <option value="snake">Snake Draft</option>
                <option value="linear">Linear Draft</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Snake: 1-2-3-3-2-1, Linear: 1-2-3-1-2-3
              </p>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h3>
          
          <div className="space-y-3">
            {[
              { key: 'scoringUpdates', label: 'Scoring Updates', description: 'Notify when points are scored' },
              { key: 'draftNotifications', label: 'Draft Notifications', description: 'Notify during draft picks' },
              { key: 'standingsChanges', label: 'Standings Changes', description: 'Notify when rankings change' },
              { key: 'episodeReminders', label: 'Episode Reminders', description: 'Remind about upcoming episodes' },
            ].map(({ key, label, description }) => (
              <div key={key} className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id={key}
                    type="checkbox"
                    checked={formData.settings?.notificationSettings?.[key as keyof typeof formData.settings.notificationSettings] ?? true}
                    onChange={(e) => handleSettingsChange('notificationSettings', {
                      ...formData.settings?.notificationSettings,
                      [key]: e.target.checked,
                    })}
                    className="focus:ring-rose-500 h-4 w-4 text-rose-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor={key} className="font-medium text-gray-700">
                    {label}
                  </label>
                  <p className="text-gray-500">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Error */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error creating league</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{submitError}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating League...' : 'Create League'}
          </button>
        </div>
      </form>
    </div>
  );
}