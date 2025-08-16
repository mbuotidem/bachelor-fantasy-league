import React from 'react';
import { render, screen } from '@testing-library/react';
import StandingsDashboard from '../components/StandingsDashboard';

// Mock the child components to focus on layout testing
jest.mock('../components/TeamStandings', () => {
  return function MockTeamStandings() {
    return <div data-testid="team-standings">Team Standings</div>;
  };
});

jest.mock('../components/ContestantLeaderboard', () => {
  return function MockContestantLeaderboard() {
    return <div data-testid="contestant-leaderboard">Contestant Leaderboard</div>;
  };
});

jest.mock('../components/TeamDetailView', () => {
  return function MockTeamDetailView() {
    return <div data-testid="team-detail">Team Detail</div>;
  };
});

describe('Standings Responsive Layout', () => {
  it('should have responsive grid layout in overview mode', () => {
    render(<StandingsDashboard leagueId="league-123" />);

    // Check that the grid container has responsive classes
    const gridContainer = document.querySelector('.grid.grid-cols-1.lg\\:grid-cols-2');
    expect(gridContainer).toBeInTheDocument();
  });

  it('should have responsive navigation buttons', () => {
    render(<StandingsDashboard leagueId="league-123" />);

    // Check that navigation has flex-wrap for mobile
    const navigation = document.querySelector('.flex.flex-wrap.gap-2');
    expect(navigation).toBeInTheDocument();
  });

  it('should render both components in overview mode', () => {
    render(<StandingsDashboard leagueId="league-123" />);

    expect(screen.getByTestId('team-standings')).toBeInTheDocument();
    expect(screen.getByTestId('contestant-leaderboard')).toBeInTheDocument();
  });

  it('should apply custom className for styling flexibility', () => {
    const { container } = render(
      <StandingsDashboard leagueId="league-123" className="custom-responsive-class" />
    );

    expect(container.firstChild).toHaveClass('custom-responsive-class');
  });
});