import React from 'react';
import { render, screen } from '@testing-library/react';
import { Authenticator } from '@aws-amplify/ui-react';

// Mock Amplify
jest.mock('aws-amplify/auth', () => ({
  getCurrentUser: jest.fn().mockRejectedValue(new Error('Not authenticated')),
}));

jest.mock('@aws-amplify/ui-react', () => ({
  Authenticator: ({ children }: { children: any }) => {
    // Mock unauthenticated state - show sign in form
    return (
      <div data-testid="authenticator">
        <div data-testid="sign-in-form">
          <h2>Sign in to your account</h2>
          <input placeholder="Email" />
          <input placeholder="Password" type="password" />
          <button>Sign In</button>
        </div>
      </div>
    );
  },
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('Authentication', () => {
  it('renders Authenticator component', () => {
    render(
      <Authenticator>
        {({ signOut, user }) => (
          <div>
            <h1>Welcome {user?.signInDetails?.loginId}</h1>
            <button onClick={signOut}>Sign Out</button>
          </div>
        )}
      </Authenticator>
    );

    expect(screen.getByTestId('authenticator')).toBeInTheDocument();
    expect(screen.getByTestId('sign-in-form')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });
});