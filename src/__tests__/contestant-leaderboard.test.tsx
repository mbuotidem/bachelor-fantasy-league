import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ContestantLeaderboard from '../components/ContestantLeaderboard';
import { StandingsService } from '../services/standings-service';
import { ContestantStanding } from '../types';

// Mock the StandingsService
jest.mock('../services/standings-service');
const MockedStandingsService = StandingsService as jest.MockedClass<typeof StandingsService>;

describe('ContestantLeaderboard', () => {
  let mockStandingsService: jest.Mocked<StandingsService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStandingsService = new MockedStandingsService() as jest.Mocked<StandingsService>;
    MockedStandingsService.mockImplementation(() => mockStandingsService);
  });

  const mockContestantStandings: ContestantStanding[] = [
    {
      contestantId: 'contestant-1',
      name: 'Sarah',
      totalPoints: 250,
      rank: 1,
      episodePoints: 50,
      isEliminated: false,
      draftedByTeams: ['Team Alpha', 'Team Beta']
    },
    {
      contestantId: 'contestant-2',
      name: 'Emma',
      totalPoints: 200,
      rank: 2,
      episodePoints: 25,
      isEliminated: false,
      draftedByTeams: ['Team Gamma']
    },
    {
      contestantId: 'contestant-3',
      name: 'Jessica',
      totalPoints: 150,
      rank: 3,
      episodePoints: 0,
      isEliminated: true,
      draftedByTeams: ['Team Delta']
    }
  ];

  const mockEpisodePerformers: ContestantStanding[] = [
    {
      contestantId: 'contestant-1',
      name: 'Sarah',
      totalPoints: 250,
      rank: 1,
      episodePoints: 50,
      isEliminated: false,
      draftedByTeams: ['Team Alpha', 'Team Beta']
    },
    {
      contestantId: 'contestant-2',
      name: 'Emma',
      totalPoints: 200,
      rank: 2,
      episodePoints: 25,
      isEliminated: false,
      draftedByTeams: ['Team Gamma']
    }
  ];

  it('should render contestant leaderboard correctly', async () => {
    mockStandingsService.getContestantStandings.mockResolvedValue(mockContestantStandings);
    mockStandingsService.getCurrentEpisodeTopPerformers.mockResolvedValue(mockEpisodePerformers);

    render(<ContestantLeaderboard leagueId="league-123" showEpisodePerformers={true} />);

    await waitFor(() => {
      expect(screen.getByText('Contestant Leaderboard')).toBeInTheDocument();
    });

    // Check that all contestants are displayed
    expect(screen.getByText('Sarah')).toBeInTheDocument();
    expect(screen.getByText('Emma')).toBeInTheDocument();
    expect(screen.getByText('Jessica')).toBeInTheDocument();

    // Check total points
    expect(screen.getByText('250')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('should display rank icons correctly', async () => {
    mockStandingsService.getContestantStandings.mockResolvedValue(mockContestantStandings);
    mockStandingsService.getCurrentEpisodeTopPerformers.mockResolvedValue(mockEpisodePerformers);

    render(<ContestantLeaderboard leagueId="league-123" />);

    await waitFor(() => {
      expect(screen.getByText('👑')).toBeInTheDocument(); // First place
      expect(screen.getByText('🥈')).toBeInTheDocument(); // Second place
      expect(screen.getByText('🥉')).toBeInTheDocument(); // Third place
    });
  });

  it('should show eliminated contestants with proper styling', async () => {
    mockStandingsService.getContestantStandings.mockResolvedValue(mockContestantStandings);
    mockStandingsService.getCurrentEpisodeTopPerformers.mockResolvedValue(mockEpisodePerformers);

    render(<ContestantLeaderboard leagueId="league-123" />);

    await waitFor(() => {
      expect(screen.getByText('Eliminated')).toBeInTheDocument();
    });

    // Check that Jessica's name has line-through styling
    const jessicaName = screen.getByText('Jessica');
    expect(jessicaName).toHaveClass('line-through');
  });

  it('should display drafted by teams', async () => {
    mockStandingsService.getContestantStandings.mockResolvedValue(mockContestantStandings);
    mockStandingsService.getCurrentEpisodeTopPerformers.mockResolvedValue(mockEpisodePerformers);

    render(<ContestantLeaderboard leagueId="league-123" />);

    await waitFor(() => {
      expect(screen.getByText('Team Alpha')).toBeInTheDocument();
      expect(screen.getByText('Team Beta')).toBeInTheDocument();
      expect(screen.getByText('Team Gamma')).toBeInTheDocument();
      expect(screen.getByText('Team Delta')).toBeInTheDocument();
    });
  });

  it('should handle contestant click events', async () => {
    const mockOnContestantClick = jest.fn();
    mockStandingsService.getContestantStandings.mockResolvedValue(mockContestantStandings);
    mockStandingsService.getCurrentEpisodeTopPerformers.mockResolvedValue(mockEpisodePerformers);

    render(<ContestantLeaderboard leagueId="league-123" onContestantClick={mockOnContestantClick} />);

    await waitFor(() => {
      expect(screen.getByText('Sarah')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Sarah').closest('div')!);
    expect(mockOnContestantClick).toHaveBeenCalledWith('contestant-1');
  });

  it('should switch between overall and episode tabs', async () => {
    mockStandingsService.getContestantStandings.mockResolvedValue(mockContestantStandings);
    mockStandingsService.getCurrentEpisodeTopPerformers.mockResolvedValue(mockEpisodePerformers);

    render(<ContestantLeaderboard leagueId="league-123" showEpisodePerformers={true} />);

    await waitFor(() => {
      expect(screen.getByText('Overall')).toBeInTheDocument();
      expect(screen.getByText('This Episode')).toBeInTheDocument();
    });

    // Initially should show overall standings (3 contestants)
    expect(screen.getByText('Jessica')).toBeInTheDocument();

    // Click on episode tab
    fireEvent.click(screen.getByText('This Episode'));

    await waitFor(() => {
      // Should now show episode performers (2 contestants, Jessica should not be visible)
      expect(screen.queryByText('Jessica')).not.toBeInTheDocument();
      expect(screen.getByText('Sarah')).toBeInTheDocument();
      expect(screen.getByText('Emma')).toBeInTheDocument();
    });
  });

  it('should not show tabs when showEpisodePerformers is false', async () => {
    mockStandingsService.getContestantStandings.mockResolvedValue(mockContestantStandings);

    render(<ContestantLeaderboard leagueId="league-123" showEpisodePerformers={false} />);

    await waitFor(() => {
      expect(screen.getByText('Sarah')).toBeInTheDocument();
    });

    expect(screen.queryByText('Overall')).not.toBeInTheDocument();
    expect(screen.queryByText('This Episode')).not.toBeInTheDocument();
  });

  it('should show loading state', () => {
    mockStandingsService.getContestantStandings.mockImplementation(() => new Promise(() => {}));

    render(<ContestantLeaderboard leagueId="league-123" />);

    // Should show loading skeleton
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should handle error state', async () => {
    mockStandingsService.getContestantStandings.mockRejectedValue(new Error('Failed to load'));

    render(<ContestantLeaderboard leagueId="league-123" />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load contestant standings')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  it('should handle retry after error', async () => {
    mockStandingsService.getContestantStandings
      .mockRejectedValueOnce(new Error('Failed to load'))
      .mockResolvedValueOnce(mockContestantStandings);

    render(<ContestantLeaderboard leagueId="league-123" />);

    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Try Again'));

    await waitFor(() => {
      expect(screen.getByText('Sarah')).toBeInTheDocument();
    });
  });

  it('should show empty state when no contestants', async () => {
    mockStandingsService.getContestantStandings.mockResolvedValue([]);

    render(<ContestantLeaderboard leagueId="league-123" />);

    await waitFor(() => {
      expect(screen.getByText('No Contestants Yet')).toBeInTheDocument();
      expect(screen.getByText('Contestants will appear here once they\'re added to the league.')).toBeInTheDocument();
    });
  });

  it('should show empty episode state when no episode performers', async () => {
    mockStandingsService.getContestantStandings.mockResolvedValue(mockContestantStandings);
    mockStandingsService.getCurrentEpisodeTopPerformers.mockResolvedValue([]);

    render(<ContestantLeaderboard leagueId="league-123" showEpisodePerformers={true} />);

    await waitFor(() => {
      expect(screen.getByText('This Episode')).toBeInTheDocument();
    });

    // Click on episode tab
    fireEvent.click(screen.getByText('This Episode'));

    await waitFor(() => {
      expect(screen.getByText('No episode scoring yet')).toBeInTheDocument();
    });
  });

  it('should display episode points when in episode mode', async () => {
    mockStandingsService.getContestantStandings.mockResolvedValue(mockContestantStandings);
    mockStandingsService.getCurrentEpisodeTopPerformers.mockResolvedValue(mockEpisodePerformers);

    render(<ContestantLeaderboard leagueId="league-123" showEpisodePerformers={true} />);

    await waitFor(() => {
      expect(screen.getByText('This Episode')).toBeInTheDocument();
    });

    // Click on episode tab
    fireEvent.click(screen.getByText('This Episode'));

    await waitFor(() => {
      // Should show episode points instead of total points
      const episodePointsLabels = screen.getAllByText('Episode Points');
      expect(episodePointsLabels.length).toBeGreaterThan(0);
    });
  });

  it('should show current episode points in overall view', async () => {
    mockStandingsService.getContestantStandings.mockResolvedValue(mockContestantStandings);
    mockStandingsService.getCurrentEpisodeTopPerformers.mockResolvedValue(mockEpisodePerformers);

    render(<ContestantLeaderboard leagueId="league-123" />);

    await waitFor(() => {
      expect(screen.getByText('+50 this episode')).toBeInTheDocument();
      expect(screen.getByText('+25 this episode')).toBeInTheDocument();
    });
  });

  it('should handle scrollable content with many contestants', async () => {
    const manyContestants = Array.from({ length: 20 }, (_, i) => ({
      contestantId: `contestant-${i}`,
      name: `Contestant ${i}`,
      totalPoints: 100 - i,
      rank: i + 1,
      episodePoints: 10,
      isEliminated: false,
      draftedByTeams: [`Team ${i}`]
    }));

    mockStandingsService.getContestantStandings.mockResolvedValue(manyContestants);

    render(<ContestantLeaderboard leagueId="league-123" />);

    await waitFor(() => {
      expect(screen.getByText('Contestant 0')).toBeInTheDocument();
    });

    // Check that the container has overflow scroll
    const container = document.querySelector('.max-h-96.overflow-y-auto');
    expect(container).toBeInTheDocument();
  });
});