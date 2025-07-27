'use client';

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LoginForm } from '../components/auth/LoginForm';
import { SignUpForm } from '../components/auth/SignUpForm';
import { EmailVerification } from '../components/auth/EmailVerification';
import { PasswordReset } from '../components/auth/PasswordReset';
import { Button } from '../components/ui/Button';

type AuthView = 'login' | 'signup' | 'verify' | 'reset';

export default function Home() {
  const { user, isLoading, isAuthenticated, signOut } = useAuth();
  const [authView, setAuthView] = useState<AuthView>('login');
  const [verificationEmail, setVerificationEmail] = useState('');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center p-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-rose-600 mb-4">
            🌹 Bachelor Fantasy League
          </h1>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Welcome back, {user.displayName || user.email}!
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
                <span>Email: {user.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✅</span>
                <span>User ID: {user.id}</span>
              </div>
            </div>
            <Button onClick={signOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const renderAuthComponent = () => {
    switch (authView) {
      case 'login':
        return (
          <LoginForm
            onSuccess={() => {
              // User will be automatically redirected by auth context
            }}
            onSwitchToSignUp={() => setAuthView('signup')}
            onSwitchToResetPassword={() => setAuthView('reset')}
          />
        );
      case 'signup':
        return (
          <SignUpForm
            onSuccess={(email) => {
              setVerificationEmail(email);
              setAuthView('verify');
            }}
            onSwitchToSignIn={() => setAuthView('login')}
          />
        );
      case 'verify':
        return (
          <EmailVerification
            email={verificationEmail}
            onSuccess={() => setAuthView('login')}
            onBack={() => setAuthView('signup')}
          />
        );
      case 'reset':
        return (
          <PasswordReset
            onSuccess={() => setAuthView('login')}
            onBack={() => setAuthView('login')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-rose-600 mb-2">
            🌹 Bachelor Fantasy League
          </h1>
          <p className="text-gray-600">
            Fantasy league for The Bachelor/Bachelorette
          </p>
        </div>
        {renderAuthComponent()}
      </div>
    </div>
  );
}