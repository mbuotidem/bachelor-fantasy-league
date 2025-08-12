'use client';

import { Authenticator, ThemeProvider } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { authTheme } from '../../../lib/auth-theme';
import LeagueJoin from '../../../components/LeagueJoin';
import { useRouter } from 'next/navigation';
import { use } from 'react';

interface JoinPageProps {
  params: Promise<{
    code: string;
  }>;
}

export default function JoinPage({ params }: JoinPageProps) {
  const router = useRouter();
  const { code } = use(params);

  const handleJoinSuccess = async () => {
    
    // Add a small delay to ensure database operations are committed
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Redirect to dashboard after successful join
    router.push('/');
  };

  const handleCancel = () => {
    // Redirect to home page if user cancels
    router.push('/');
  };

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
                    Join the league and start your fantasy journey!
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
                      <p className="text-gray-600">Welcome, {user?.signInDetails?.loginId}!</p>
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

              {/* Join League Form */}
              <div className="py-8">
                <div className="max-w-md mx-auto">
                  <LeagueJoin
                    initialLeagueCode={code}
                    onJoinSuccess={handleJoinSuccess}
                    onCancel={handleCancel}
                  />
                </div>
              </div>
            </div>
          )}
        </Authenticator>
      </div>
    </ThemeProvider>
  );
}