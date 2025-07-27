'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getCurrentUser, signOut as amplifySignOut } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { AuthState, User } from '../types/auth';

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const refreshUser = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      const currentUser = await getCurrentUser();
      
      const user: User = {
        id: currentUser.userId,
        email: currentUser.signInDetails?.loginId || '',
        displayName: currentUser.signInDetails?.loginId || '',
        emailVerified: true, // Amplify handles email verification
      };

      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  const signOut = async () => {
    try {
      await amplifySignOut();
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    // Check initial auth state
    refreshUser();

    // Listen for auth events
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
          refreshUser();
          break;
        case 'signedOut':
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
          });
          break;
        case 'tokenRefresh':
          refreshUser();
          break;
        default:
          break;
      }
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    ...authState,
    signOut,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};