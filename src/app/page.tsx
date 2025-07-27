'use client';

import { Authenticator, ThemeProvider } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { authTheme } from '../lib/auth-theme';

export default function Home() {
  return (
    <ThemeProvider theme={authTheme}>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
        <div className="flex items-center justify-center min-h-screen p-8">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-rose-600 mb-2">
                🌹 Bachelor Fantasy League
              </h1>
              <p className="text-gray-600">
                Fantasy league for The Bachelor/Bachelorette
              </p>
            </div>
            
            <Authenticator
              components={{
                Header() {
                  return (
                    <div className="text-center mb-4">
                      <h2 className="text-xl font-semibold text-gray-800">
                        Welcome to the League
                      </h2>
                    </div>
                  );
                },
              }}
            >
              {({ signOut, user }) => (
                <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    Welcome back, {user?.signInDetails?.loginId}!
                  </h2>
                  <div className="space-y-3 text-left mb-6">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-500">✅</span>
                      <span>Authentication system working</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-500">✅</span>
                      <span>User logged in successfully</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-500">✅</span>
                      <span>Email: {user?.signInDetails?.loginId}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-500">✅</span>
                      <span>User ID: {user?.userId}</span>
                    </div>
                  </div>
                  <button
                    onClick={signOut}
                    className="inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500 px-4 py-2 text-sm"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </Authenticator>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}