import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StandingsDashboard from '../components/StandingsDashboard';

// Mock the child components
jest.mock('../components/TeamStandings', () => {
  return function MockTeamStandings({ leagueId, onTeamClick }: any) {
    return (
      <div data-testid="team-standings">
        Team Standings for {leagueId}
        <button onClick={() => onTeamClick?.('team-1')}>Click Team 1</button>
      </div>
    );
  };
});

jest.mock('../components/ContestantLeaderboard', () => {
  return function MockContestantLeaderboard({ leagueId, showEpisodePerformers }: any) {
    return (
      <div data-testid="contestant-leaderboard">
        Contestant Leaderboard for {leagueId}
        {showEpisodePerformers && <span>With Episode Performers</span>}
      </div>
    );
  };
});

jest.mock('../components/TeamDetailView', () => {
  return function MockTeamDetailView({ teamId, onBack }: any) {
    return (
      <div data-testid="team-detail">
        Team Detail for {teamId}
        <button onClick={onBack}>Back</button>
      </div>
    );
  };
});

describe('StandingsDashboard', () => {
  it('should render overview mode by default', () => {
    render(<StandingsDashboard leagueId="league-123" />);

    expect(screen.getByText('📊 Overview')).toBeInTheDocument();
    expect(screen.getByTestId('team-standings')).toBeInTheDocument();
    expect(screen.getByTestId('contestant-leaderboard')).toBeInTheDocument();
    expect(screen.getByText('With Episode Performers')).toBeInTheDocument();
  });

  it('should render navigation buttons', () => {
    render(<StandingsDashboard leagueId="league-123" />);

    expect(screen.getByText('📊 Overview')).toBeInTheDocument();
    expect(screen.getByText('🏆 Teams')).toBeInTheDocument();
    expect(screen.getByText('🏅 Contestants')).toBeInTheDocument();
  });

  it('should switch to teams view when teams button is clicked', () => {
    render(<StandingsDashboard leagueId="league-123" />);

    fireEvent.click(screen.getByText('🏆 Teams'));

    // Should show only team standings
    expect(screen.getByTestId('team-standings')).toBeInTheDocument();
    expect(screen.queryByTestId('contestant-leaderboard')).not.toBeInTheDocument();
    
    // Teams button should be active
    const teamsButton = screen.getByText('🏆 Teams');
    expect(teamsButton).toHaveClass('bg-blue-100', 'text-blue-700');
  });

  it('should switch to contestants view when contestants button is clicked', () => {
    render(<StandingsDashboard leagueId="league-123" />);

    fireEvent.click(screen.getByText('🏅 Contestants'));

    // Should show only contestant leaderboard
    expect(screen.getByTestId('contestant-leaderboard')).toBeInTheDocument();
    expect(screen.queryByTestId('team-standings')).not.toBeInTheDocument();
    
    // Contestants button should be active
    const contestantsButton = screen.getByText('🏅 Contestants');
    expect(contestantsButton).toHaveClass('bg-blue-100', 'text-blue-700');
  });

  it('should switch back to overview when overview button is clicked', () => {
    render(<StandingsDashboard leagueId="league-123" />);

    // Switch to teams view first
    fireEvent.click(screen.getByText('🏆 Teams'));
    expect(screen.queryByTestId('contestant-leaderboard')).not.toBeInTheDocument();

    // Switch back to overview
    fireEvent.click(screen.getByText('📊 Overview'));
    
    // Should show both components again
    expect(screen.getByTestId('team-standings')).toBeInTheDocument();
    expect(screen.getByTestId('contestant-leaderboard')).toBeInTheDocument();
  });

  it('should navigate to team detail when team is clicked', () => {
    render(<StandingsDashboard leagueId="league-123" />);

    // Click on a team in the team standings
    fireEvent.click(screen.getByText('Click Team 1'));

    // Should show team detail view
    expect(screen.getByTestId('team-detail')).toBeInTheDocument();
    expect(screen.getByText('Team Detail for team-1')).toBeInTheDocument();
    
    // Navigation should be hidden in team detail view
    expect(screen.queryByText('📊 Overview')).not.toBeInTheDocument();
  });

  it('should navigate back from team detail to overview', () => {
    render(<StandingsDashboard leagueId="league-123" />);

    // Navigate to team detail
    fireEvent.click(screen.getByText('Click Team 1'));
    expect(screen.getByTestId('team-detail')).toBeInTheDocument();

    // Click back button
    fireEvent.click(screen.getByText('Back'));

    // Should return to overview
    expect(screen.getByTestId('team-standings')).toBeInTheDocument();
    expect(screen.getByTestId('contestant-leaderboard')).toBeInTheDocument();
    expect(screen.getByText('📊 Overview')).toBeInTheDocument();
  });

  it('should pass correct props to child components', () => {
    render(<StandingsDashboard leagueId="league-123" />);

    expect(screen.getByText('Team Standings for league-123')).toBeInTheDocument();
    expect(screen.getByText('Contestant Leaderboard for league-123')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<StandingsDashboard leagueId="league-123" className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should show active state for current view button', () => {
    render(<StandingsDashboard leagueId="league-123" />);

    // Overview should be active by default
    const overviewButton = screen.getByText('📊 Overview');
    expect(overviewButton).toHaveClass('bg-blue-100', 'text-blue-700', 'border-blue-200');

    // Other buttons should not be active
    const teamsButton = screen.getByText('🏆 Teams');
    const contestantsButton = screen.getByText('🏅 Contestants');
    
    expect(teamsButton).toHaveClass('bg-white', 'text-gray-600', 'border-gray-200');
    expect(contestantsButton).toHaveClass('bg-white', 'text-gray-600', 'border-gray-200');
  });

  it('should handle team click from teams view', () => {
    render(<StandingsDashboard leagueId="league-123" />);

    // Switch to teams view
    fireEvent.click(screen.getByText('🏆 Teams'));
    
    // Click on a team
    fireEvent.click(screen.getByText('Click Team 1'));

    // Should show team detail
    expect(screen.getByTestId('team-detail')).toBeInTheDocument();
  });

  it('should maintain responsive grid layout in overview', () => {
    render(<StandingsDashboard leagueId="league-123" />);

    // Check that the grid container exists
    const gridContainer = document.querySelector('.grid.grid-cols-1.lg\\:grid-cols-2');
    expect(gridContainer).toBeInTheDocument();
  });
});