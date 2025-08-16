import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import TeamStandings from '../components/TeamStandings';
import { StandingsService } from '../services/standings-service';
import { TeamStanding } from '../types';

// Mock the StandingsService
jest.mock('../services/standings-service');
const MockedStandingsService = StandingsService as jest.MockedClass<typeof StandingsService>;

describe('TeamStandings', () => {
  let mockStandingsService: jest.Mocked<StandingsService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStandingsService = new MockedStandingsService() as jest.Mocked<StandingsService>;
    MockedStandingsService.mockImplementation(() => mockStandingsService);
  });

  const mockTeamStandings: TeamStanding[] = [
    {
      teamId: 'team-1',
      teamName: 'Team Alpha',
      ownerName: 'User 1',
      totalPoints: 250,
      rank: 1,
      episodePoints: 50,
      contestants: [
        { id: 'contestant-1', name: 'Sarah', points: 125, isEliminated: false },
        { id: 'contestant-2', name: 'Emma', points: 125, isEliminated: false }
      ]
    },
    {
      teamId: 'team-2',
      teamName: 'Team Beta',
      ownerName: 'User 2',
      totalPoints: 200,
      rank: 2,
      episodePoints: 25,
      contestants: [
        { id: 'contestant-3', name: 'Jessica', points: 100, isEliminated: false },
        { id: 'contestant-4', name: 'Rachel', points: 100, isEliminated: true }
      ]
    },
    {
      teamId: 'team-3',
      teamName: 'Team Gamma',
      ownerName: 'User 3',
      totalPoints: 150,
      rank: 3,
      episodePoints: 0,
      contestants: [
        { id: 'contestant-5', name: 'Ashley', points: 75, isEliminated: false },
        { id: 'contestant-6', name: 'Madison', points: 75, isEliminated: true }
      ]
    }
  ];

  it('should render team standings correctly', async () => {
    mockStandingsService.getTeamStandings.mockResolvedValue(mockTeamStandings);

    render(<TeamStandings leagueId="league-123" />);

    await waitFor(() => {
      expect(screen.getByText('Team Standings')).toBeInTheDocument();
    });

    // Check that all teams are displayed
    expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    expect(screen.getByText('Team Beta')).toBeInTheDocument();
    expect(screen.getByText('Team Gamma')).toBeInTheDocument();

    // Check owner names
    expect(screen.getByText('Owner: User 1')).toBeInTheDocument();
    expect(screen.getByText('Owner: User 2')).toBeInTheDocument();
    expect(screen.getByText('Owner: User 3')).toBeInTheDocument();

    // Check total points
    expect(screen.getByText('250')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('should display rank icons correctly', async () => {
    mockStandingsService.getTeamStandings.mockResolvedValue(mockTeamStandings);

    render(<TeamStandings leagueId="league-123" />);

    await waitFor(() => {
      expect(screen.getByText('🥇')).toBeInTheDocument(); // First place
      expect(screen.getByText('🥈')).toBeInTheDocument(); // Second place
      expect(screen.getByText('🥉')).toBeInTheDocument(); // Third place
    });
  });

  it('should display episode points correctly', async () => {
    mockStandingsService.getTeamStandings.mockResolvedValue(mockTeamStandings);

    render(<TeamStandings leagueId="league-123" />);

    await waitFor(() => {
      expect(screen.getByText('+50 this episode')).toBeInTheDocument();
      expect(screen.getByText('+25 this episode')).toBeInTheDocument();
      expect(screen.getByText('No recent points')).toBeInTheDocument();
    });
  });

  it('should display contestant summaries', async () => {
    mockStandingsService.getTeamStandings.mockResolvedValue(mockTeamStandings);

    render(<TeamStandings leagueId="league-123" />);

    await waitFor(() => {
      expect(screen.getByText('Sarah (125pts)')).toBeInTheDocument();
      expect(screen.getByText('Emma (125pts)')).toBeInTheDocument();
      expect(screen.getByText('Jessica (100pts)')).toBeInTheDocument();
    });
  });

  it('should handle team click events', async () => {
    const mockOnTeamClick = jest.fn();
    mockStandingsService.getTeamStandings.mockResolvedValue(mockTeamStandings);

    render(<TeamStandings leagueId="league-123" onTeamClick={mockOnTeamClick} />);

    await waitFor(() => {
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Team Alpha').closest('div')!);
    expect(mockOnTeamClick).toHaveBeenCalledWith('team-1');
  });

  it('should show loading state', () => {
    mockStandingsService.getTeamStandings.mockImplementation(() => new Promise(() => {}));

    render(<TeamStandings leagueId="league-123" />);

    // Should show loading skeleton
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should handle error state', async () => {
    mockStandingsService.getTeamStandings.mockRejectedValue(new Error('Failed to load'));

    render(<TeamStandings leagueId="league-123" />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load team standings')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  it('should handle retry after error', async () => {
    mockStandingsService.getTeamStandings
      .mockRejectedValueOnce(new Error('Failed to load'))
      .mockResolvedValueOnce(mockTeamStandings);

    render(<TeamStandings leagueId="league-123" />);

    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Try Again'));

    await waitFor(() => {
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
    });
  });

  it('should show empty state when no teams', async () => {
    mockStandingsService.getTeamStandings.mockResolvedValue([]);

    render(<TeamStandings leagueId="league-123" />);

    await waitFor(() => {
      expect(screen.getByText('No Teams Yet')).toBeInTheDocument();
      expect(screen.getByText('Teams will appear here once they join the league.')).toBeInTheDocument();
    });
  });

  it('should display eliminated contestants differently', async () => {
    mockStandingsService.getTeamStandings.mockResolvedValue(mockTeamStandings);

    render(<TeamStandings leagueId="league-123" />);

    await waitFor(() => {
      // Find the eliminated contestant badge
      const eliminatedBadges = screen.getAllByText(/Rachel \(100pts\)/);
      expect(eliminatedBadges.length).toBeGreaterThan(0);
    });
  });

  it('should truncate long team names', async () => {
    const longNameTeam: TeamStanding[] = [{
      teamId: 'team-long',
      teamName: 'This is a very long team name that should be truncated',
      ownerName: 'User 999',
      totalPoints: 100,
      rank: 1,
      episodePoints: 10,
      contestants: []
    }];

    mockStandingsService.getTeamStandings.mockResolvedValue(longNameTeam);

    render(<TeamStandings leagueId="league-123" />);

    await waitFor(() => {
      expect(screen.getByText('This is a very long team name that should be truncated')).toBeInTheDocument();
    });

    // Check that the element has truncate class
    const teamNameElement = screen.getByText('This is a very long team name that should be truncated');
    expect(teamNameElement).toHaveClass('truncate');
  });

  it('should show "more" indicator when team has many contestants', async () => {
    const teamWithManyContestants: TeamStanding[] = [{
      teamId: 'team-many',
      teamName: 'Team Many',
      ownerName: 'User 5',
      totalPoints: 100,
      rank: 1,
      episodePoints: 10,
      contestants: [
        { id: '1', name: 'C1', points: 20, isEliminated: false },
        { id: '2', name: 'C2', points: 20, isEliminated: false },
        { id: '3', name: 'C3', points: 20, isEliminated: false },
        { id: '4', name: 'C4', points: 20, isEliminated: false },
        { id: '5', name: 'C5', points: 20, isEliminated: false }
      ]
    }];

    mockStandingsService.getTeamStandings.mockResolvedValue(teamWithManyContestants);

    render(<TeamStandings leagueId="league-123" />);

    await waitFor(() => {
      expect(screen.getByText('+2 more')).toBeInTheDocument();
    });
  });
});