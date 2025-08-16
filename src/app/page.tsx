'use client';

import { Authenticator, ThemeProvider } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { authTheme } from '../lib/auth-theme';
import LeagueDashboard from '../components/LeagueDashboard';

export default function Home() {
  return (
    <ThemeProvider theme={authTheme}>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
        <Authenticator
          components={{
            Header() {
              return (
                <div className="text-center mb-4">
                  <h1 className="text-2xl font-bold text-rose-600 mb-2">
                    🌹 Bachelor Fantasy League
                  </h1>
                  <p className="text-gray-600">
                    Fantasy league for The Bachelor/Bachelorette
                  </p>
                </div>
              );
            },
          }}
        >
          {({ signOut, user }) => (
            <div className="min-h-screen bg-gray-50">
              {/* Header - Mobile First */}
              <div className="bg-white shadow-sm border-b">
                <div className="px-4 py-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                    <div className="text-center sm:text-left">
                      <h1 className="text-xl sm:text-2xl font-bold text-rose-600">🌹 Bachelor Fantasy League</h1>
                      <p className="text-sm sm:text-base text-gray-600 truncate">Welcome back, {user?.signInDetails?.loginId}!</p>
                    </div>
                    <button
                      onClick={signOut}
                      className="w-full sm:w-auto inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500 px-4 py-2 text-sm"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>

              {/* Status indicators - Mobile Optimized */}
              <div className="bg-green-50 border-b border-green-200">
                <div className="px-4 py-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs sm:text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-500">✅</span>
                      <span>Authentication working</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-500">✅</span>
                      <span>League creation & joining</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-500">✅</span>
                      <span>Contestant management</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-500">✅</span>
                      <span>Photo upload & storage</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-500">✅</span>
                      <span>Interactive draft system</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-500">✅</span>
                      <span>Mobile episode scoring</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* League Dashboard - Mobile Optimized */}
              <div className="py-4 sm:py-8">
                <LeagueDashboard />
              </div>
            </div>
          )}
        </Authenticator>
      </div>
    </ThemeProvider>
  );
}