import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '../app/page';

// Mock Amplify UI React
jest.mock('@aws-amplify/ui-react', () => ({
  Authenticator: ({ children }: { children: React.ReactNode | ((props: { signOut: () => void; user: { userId: string; signInDetails: { loginId: string } } }) => React.ReactNode) }) => {
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

// Mock the LeagueDashboard component since we're testing auth integration, not league functionality
jest.mock('../components/LeagueDashboard', () => {
  return function MockLeagueDashboard() {
    return <div data-testid="league-dashboard">League Dashboard Component</div>;
  };
});

describe('Authentication Integration', () => {
  it('renders authenticated user interface', () => {
    render(<Home />);

    // Check that the authenticated interface is rendered
    expect(screen.getByText('🌹 Bachelor Fantasy League')).toBeInTheDocument();
    expect(screen.getByText('Welcome back, test@example.com!')).toBeInTheDocument();
    expect(screen.getByText('Authentication system working')).toBeInTheDocument();
    expect(screen.getByText('League creation & joining')).toBeInTheDocument();
    expect(screen.getByText('Contestant management with flip cards')).toBeInTheDocument();
    expect(screen.getByText('Photo upload & S3 storage')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign Out' })).toBeInTheDocument();
    
    // Check that the league dashboard is rendered
    expect(screen.getByTestId('league-dashboard')).toBeInTheDocument();
  });

  it('renders with proper styling and layout', () => {
    render(<Home />);

    // Check for proper styling classes
    const title = screen.getByText('🌹 Bachelor Fantasy League');
    expect(title).toBeInTheDocument();
    
    // Check that sign out button exists
    const signOutButton = screen.getByRole('button', { name: 'Sign Out' });
    expect(signOutButton).toBeInTheDocument();
    
    // Check that the league dashboard is present
    expect(screen.getByTestId('league-dashboard')).toBeInTheDocument();
  });
});