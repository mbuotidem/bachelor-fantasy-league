'use client';

import React, { useState } from 'react';
import type { League } from '../types';

interface LeagueInviteProps {
  league: League;
  onClose?: () => void;
  baseUrl?: string; // For testing purposes
}

export default function LeagueInvite({ league, onClose, baseUrl }: LeagueInviteProps) {
  const [copied, setCopied] = useState(false);

  const inviteUrl = `${baseUrl || window.location.origin}/join/${league.leagueCode}`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed: ', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const copyCode = () => copyToClipboard(league.leagueCode);
  const copyUrl = () => copyToClipboard(inviteUrl);

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Join my Bachelor Fantasy League: ${league.name}`);
    const body = encodeURIComponent(
      `Hey! I've created a Bachelor Fantasy League and would love for you to join!\n\n` +
      `League: ${league.name}\n` +
      `Season: ${league.season}\n\n` +
      `Join here: ${inviteUrl}\n\n` +
      `Or use league code: ${league.leagueCode}\n\n` +
      `Let's see who can draft the best team! 🌹`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareViaText = () => {
    const text = encodeURIComponent(
      `Join my Bachelor Fantasy League "${league.name}" for ${league.season}! ` +
      `Use code ${league.leagueCode} or visit ${inviteUrl} 🌹`
    );
    window.open(`sms:?body=${text}`);
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-rose-100 mb-4">
          <svg className="h-6 w-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Invite Friends to Your League</h2>
        <p className="text-gray-600 text-sm">
          Share your league code or invite link to get friends to join!
        </p>
      </div>

      {/* League Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-gray-900 mb-1">{league.name}</h3>
        <p className="text-sm text-gray-600">{league.season}</p>
        <p className="text-xs text-gray-500 mt-2">
          Max {league.settings.maxTeams} teams • {league.settings.draftFormat} draft
        </p>
      </div>

      {/* League Code */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          League Code
        </label>
        <div className="flex items-center space-x-2">
          <div className="flex-1 bg-gray-50 border border-gray-300 rounded-md px-3 py-2">
            <span className="font-mono text-lg font-bold text-gray-900 tracking-wider">
              {league.leagueCode}
            </span>
          </div>
          <button
            onClick={copyCode}
            className="px-3 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 transition-colors"
          >
            {copied ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Friends can enter this code when joining
        </p>
      </div>

      {/* Invite Link */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Direct Invite Link
        </label>
        <div className="flex items-center space-x-2">
          <div className="flex-1 bg-gray-50 border border-gray-300 rounded-md px-3 py-2 overflow-hidden">
            <span className="text-sm text-gray-700 truncate block">
              {inviteUrl}
            </span>
          </div>
          <button
            onClick={copyUrl}
            className="px-3 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 transition-colors"
          >
            {copied ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Direct link that automatically fills in the league code
        </p>
      </div>

      {/* Share Options */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Share Via
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={shareViaEmail}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email
          </button>
          <button
            onClick={shareViaText}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Text
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">How to Join</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>Friends can join by:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Clicking the invite link</li>
                <li>Entering the league code on the join page</li>
                <li>Creating a team name when they join</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Close Button */}
      {onClose && (
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}