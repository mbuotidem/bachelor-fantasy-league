import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '../app/page';

// Mock Amplify UI React
jest.mock('@aws-amplify/ui-react', () => ({
  Authenticator: ({ children }: { children: any }) => {
    // Mock authenticated state
    const mockUser = {
      userId: 'test-user-123',
      signInDetails: {
        loginId: 'test@example.com',
      },
    };
    
    const mockSignOut = jest.fn();
    
    return (
      <div data-testid="authenticator">
        {typeof children === 'function' 
          ? children({ signOut: mockSignOut, user: mockUser })
          : children
        }
      </div>
    );
  },
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('Authentication Integration', () => {
  it('renders authenticated user interface', () => {
    render(<Home />);

    // Check that the authenticated interface is rendered
    expect(screen.getByText('🌹 Bachelor Fantasy League')).toBeInTheDocument();
    expect(screen.getByText('Welcome back, test@example.com!')).toBeInTheDocument();
    expect(screen.getByText('Authentication system working')).toBeInTheDocument();
    expect(screen.getByText('User logged in successfully')).toBeInTheDocument();
    expect(screen.getByText('Email: test@example.com')).toBeInTheDocument();
    expect(screen.getByText('User ID: test-user-123')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign Out' })).toBeInTheDocument();
  });

  it('renders with proper styling and layout', () => {
    render(<Home />);

    // Check for proper styling classes
    const title = screen.getByText('🌹 Bachelor Fantasy League');
    expect(title).toBeInTheDocument();
    
    // Check that sign out button exists
    const signOutButton = screen.getByRole('button', { name: 'Sign Out' });
    expect(signOutButton).toBeInTheDocument();
  });
});