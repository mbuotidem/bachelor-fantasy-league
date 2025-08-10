'use client';

import { Authenticator, ThemeProvider } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { authTheme } from '../lib/auth-theme';
import DataModelDemo from '../components/DataModelDemo';

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
              {/* Header */}
              <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h1 className="text-2xl font-bold text-rose-600">🌹 Bachelor Fantasy League</h1>
                      <p className="text-gray-600">Welcome back, {user?.signInDetails?.loginId}!</p>
                    </div>
                    <button
                      onClick={signOut}
                      className="inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500 px-4 py-2 text-sm"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>

              {/* Status indicators */}
              <div className="bg-green-50 border-b border-green-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-500">✅</span>
                      <span>Authentication system working</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-500">✅</span>
                      <span>Data models implemented</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-500">✅</span>
                      <span>Validation working</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-500">✅</span>
                      <span>TypeScript interfaces active</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Data Model Demo */}
              <div className="py-8">
                <DataModelDemo />
              </div>
            </div>
          )}
        </Authenticator>
      </div>
    </ThemeProvider>
  );
}