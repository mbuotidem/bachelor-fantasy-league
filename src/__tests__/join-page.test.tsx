import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import JoinPage from '../app/join/[code]/page';

const mockUse = React.use as jest.MockedFunction<typeof React.use>;

// Mock the LeagueJoin component since we've already tested it
jest.mock('../components/LeagueJoin', () => {
  return function MockLeagueJoin({ initialLeagueCode }: { initialLeagueCode: string }) {
    return <div data-testid="league-join">League Join with code: {initialLeagueCode}</div>;
  };
});

// Mock the Authenticator component
jest.mock('@aws-amplify/ui-react', () => ({
  Authenticator: ({ children }: { children: any }) => {
    // Simulate authenticated state
    const mockUser = { signInDetails: { loginId: 'test@example.com' } };
    const mockSignOut = jest.fn();
    return children({ signOut: mockSignOut, user: mockUser });
  },
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock the auth theme
jest.mock('../lib/auth-theme', () => ({
  authTheme: {},
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock React's use hook
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  use: jest.fn(),
}));

describe('JoinPage', () => {
  it('renders the join page with league code', () => {
    const mockParams = Promise.resolve({ code: 'ABC123' });
    mockUse.mockReturnValue({ code: 'ABC123' });
    
    render(<JoinPage params={mockParams} />);

    expect(screen.getByText('🌹 Bachelor Fantasy League')).toBeInTheDocument();
    expect(screen.getByTestId('league-join')).toBeInTheDocument();
    expect(screen.getByText('League Join with code: ABC123')).toBeInTheDocument();
  });

  it('passes the correct league code to LeagueJoin component', () => {
    const mockParams = Promise.resolve({ code: 'XYZ789' });
    mockUse.mockReturnValue({ code: 'XYZ789' });
    
    render(<JoinPage params={mockParams} />);

    expect(screen.getByText('League Join with code: XYZ789')).toBeInTheDocument();
  });
});