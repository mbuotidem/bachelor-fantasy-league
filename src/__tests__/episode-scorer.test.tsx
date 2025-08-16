import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EpisodeScorer } from '../components/EpisodeScorer';
import { ScoringService } from '../services/scoring-service';
import { ContestantService } from '../services/contestant-service';
import { EpisodeService } from '../services/episode-service';
import { createMockContestant, createMockEpisode, createMockScoringEvent } from '../test-utils/factories';

// Mock the services
jest.mock('../services/scoring-service');
jest.mock('../services/contestant-service');
jest.mock('../services/episode-service');

const MockedScoringService = ScoringService as jest.MockedClass<typeof ScoringService>;
const MockedContestantService = ContestantService as jest.MockedClass<typeof ContestantService>;
const MockedEpisodeService = EpisodeService as jest.MockedClass<typeof EpisodeService>;

describe('EpisodeScorer', () => {
  let mockScoringService: jest.Mocked<ScoringService>;
  let mockContestantService: jest.Mocked<ContestantService>;
  let mockEpisodeService: jest.Mocked<EpisodeService>;

  const mockContestants = [
    createMockContestant({ id: '1', name: 'Alice', isEliminated: false, totalPoints: 10 }),
    createMockContestant({ id: '2', name: 'Bob', isEliminated: false, totalPoints: 15 }),
    createMockContestant({ id: '3', name: 'Charlie', isEliminated: true, totalPoints: 5 }) // Eliminated
  ];

  const mockActiveEpisode = createMockEpisode({
    id: 'episode-1',
    episodeNumber: 3,
    isActive: true
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock instances
    mockScoringService = {
      scoreAction: jest.fn(),
      calculateEpisodeTotals: jest.fn(),
      getRecentScoringEvents: jest.fn(),
      undoScoringEvent: jest.fn(),
    } as any;

    mockContestantService = {
      getContestantsByLeague: jest.fn(),
    } as any;

    mockEpisodeService = {
      getActiveEpisode: jest.fn(),
    } as any;

    // Mock constructor returns
    MockedScoringService.mockImplementation(() => mockScoringService);
    MockedContestantService.mockImplementation(() => mockContestantService);
    MockedEpisodeService.mockImplementation(() => mockEpisodeService);

    // Setup default mock returns
    mockContestantService.getContestantsByLeague.mockResolvedValue(mockContestants);
    mockEpisodeService.getActiveEpisode.mockResolvedValue(mockActiveEpisode);
    mockScoringService.calculateEpisodeTotals.mockResolvedValue({
      '1': 5, // Alice has 5 episode points
      '2': 3  // Bob has 3 episode points
    });
    mockScoringService.getRecentScoringEvents.mockResolvedValue([]);
  });

  describe('Initial Loading', () => {
    it('shows loading state initially', () => {
      render(<EpisodeScorer leagueId="league-1" />);
      expect(screen.getByText('Loading episode scorer...')).toBeInTheDocument();
    });

    it('loads contestants and active episode on mount', async () => {
      render(<EpisodeScorer leagueId="league-1" />);

      await waitFor(() => {
        expect(mockContestantService.getContestantsByLeague).toHaveBeenCalledWith('league-1');
        expect(mockEpisodeService.getActiveEpisode).toHaveBeenCalledWith('league-1');
      });
    });

    it('filters out eliminated contestants', async () => {
      render(<EpisodeScorer leagueId="league-1" />);

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
        expect(screen.queryByText('Charlie')).not.toBeInTheDocument(); // Eliminated
      });
    });

    it('shows no active episode message when no episode is active', async () => {
      mockEpisodeService.getActiveEpisode.mockResolvedValue(null);

      render(<EpisodeScorer leagueId="league-1" />);

      await waitFor(() => {
        expect(screen.getByText('No Active Episode')).toBeInTheDocument();
        expect(screen.getByText('No episode is currently active for scoring.')).toBeInTheDocument();
      });
    });
  });

  describe('Contestant Selection', () => {
    it('displays contestant list with scores', async () => {
      render(<EpisodeScorer leagueId="league-1" />);

      await waitFor(() => {
        // Check contestant names
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();

        // Check episode points (text may be split across elements)
        expect(screen.getAllByText((content, element) => {
          return element?.textContent?.includes('Episode: 5 pts') || false;
        })[0]).toBeInTheDocument(); // Alice
        expect(screen.getAllByText((content, element) => {
          return element?.textContent?.includes('Episode: 3 pts') || false;
        })[0]).toBeInTheDocument(); // Bob

        // Check total points (original + episode)
        expect(screen.getByText('15')).toBeInTheDocument(); // Alice: 10 + 5
        expect(screen.getByText('18')).toBeInTheDocument(); // Bob: 15 + 3
      });
    });

    it('allows selecting a contestant for scoring', async () => {
      render(<EpisodeScorer leagueId="league-1" />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Alice'));
      });

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getAllByText((content, element) => {
          return element?.textContent?.includes('Episode: 5 pts') || false;
        })[0]).toBeInTheDocument();
        expect(screen.getByText('15')).toBeInTheDocument(); // Total points
      });
    });

    it('allows going back to contestant selection', async () => {
      render(<EpisodeScorer leagueId="league-1" />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Alice'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('Back'));
      });

      await waitFor(() => {
        expect(screen.getByText('👥 Select Contestant')).toBeInTheDocument();
      });
    });
  });

  describe('Scoring Interface', () => {
    beforeEach(async () => {
      render(<EpisodeScorer leagueId="league-1" />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Alice'));
      });
    });

    it('displays category toggle buttons', async () => {
      await waitFor(() => {
        expect(screen.getByText('Positive')).toBeInTheDocument();
        expect(screen.getByText('Negative')).toBeInTheDocument();
        expect(screen.getByText('All')).toBeInTheDocument();
      });
    });

    it('shows positive actions by default', async () => {
      await waitFor(() => {
        expect(screen.getByText('✅ Positive Actions')).toBeInTheDocument();
        expect(screen.getByText('Kiss on Mouth')).toBeInTheDocument();
        expect(screen.getByText('Rose This Week')).toBeInTheDocument();
        expect(screen.queryByText('❌ Negative Actions')).not.toBeInTheDocument();
      });
    });

    it('can switch to negative actions', async () => {
      await waitFor(() => {
        fireEvent.click(screen.getByText('Negative'));
      });

      await waitFor(() => {
        expect(screen.getByText('❌ Negative Actions')).toBeInTheDocument();
        expect(screen.getByText('Crying')).toBeInTheDocument();
        expect(screen.getByText('Vomiting')).toBeInTheDocument();
        expect(screen.queryByText('✅ Positive Actions')).not.toBeInTheDocument();
      });
    });

    it('can show all actions', async () => {
      await waitFor(() => {
        fireEvent.click(screen.getByText('All'));
      });

      await waitFor(() => {
        expect(screen.getByText('✅ Positive Actions')).toBeInTheDocument();
        expect(screen.getByText('❌ Negative Actions')).toBeInTheDocument();
        expect(screen.getByText('Kiss on Mouth')).toBeInTheDocument();
        expect(screen.getByText('Crying')).toBeInTheDocument();
      });
    });

    it('displays scoring buttons with correct point values', async () => {
      await waitFor(() => {
        expect(screen.getAllByText((content, element) => {
          return element?.textContent?.includes('+2 pts') || false;
        }).length).toBeGreaterThan(0); // Kiss on Mouth and others
        expect(screen.getAllByText((content, element) => {
          return element?.textContent?.includes('+3 pts') || false;
        }).length).toBeGreaterThan(0); // Rose This Week
        expect(screen.getAllByText((content, element) => {
          return element?.textContent?.includes('+1 pt') || false;
        }).length).toBeGreaterThan(0); // Various 1-point actions
      });
    });
  });

  describe('Scoring Actions', () => {
    const mockScoringEvent = createMockScoringEvent({
      id: 'event-1',
      contestantId: '1',
      actionType: 'kiss_mouth',
      points: 2
    });

    beforeEach(async () => {
      mockScoringService.scoreAction.mockResolvedValue(mockScoringEvent);

      render(<EpisodeScorer leagueId="league-1" />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Alice'));
      });
    });

    it('scores an action when button is clicked', async () => {
      await waitFor(() => {
        fireEvent.click(screen.getByText('Kiss on Mouth'));
      });

      await waitFor(() => {
        expect(mockScoringService.scoreAction).toHaveBeenCalledWith({
          episodeId: 'episode-1',
          contestantId: '1',
          actionType: 'kiss_mouth',
          points: 2,
          description: 'Kiss on mouth'
        });
      });
    });

    it('updates contestant score optimistically', async () => {
      await waitFor(() => {
        fireEvent.click(screen.getByText('Kiss on Mouth'));
      });

      await waitFor(() => {
        // Total should be updated: 15 (original total) + 2 (new points) = 17
        expect(screen.getByText('17')).toBeInTheDocument();
        // Episode points should be updated: 5 (original episode) + 2 (new points) = 7
        expect(screen.getAllByText((content, element) => {
          return element?.textContent?.includes('Episode: 7 pts') || false;
        })[0]).toBeInTheDocument();
      });
    });

    it.skip('calls onScoreUpdate callback when provided', async () => {
      const onScoreUpdate = jest.fn();

      render(<EpisodeScorer leagueId="league-1" onScoreUpdate={onScoreUpdate} />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
      });

      // Select Alice
      fireEvent.click(screen.getByText('Alice'));

      // Wait for scoring interface to load
      await waitFor(() => {
        expect(screen.getByText('Kiss on Mouth')).toBeInTheDocument();
      });

      // Click the scoring button
      fireEvent.click(screen.getByText('Kiss on Mouth'));

      // Wait for the callback to be called
      await waitFor(() => {
        expect(onScoreUpdate).toHaveBeenCalledWith(mockScoringEvent);
      }, { timeout: 3000 });
    });

    it.skip('handles scoring errors gracefully', async () => {
      const onError = jest.fn();
      mockScoringService.scoreAction.mockRejectedValue(new Error('Network error'));

      render(<EpisodeScorer leagueId="league-1" onError={onError} />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
      });

      // Select Alice
      fireEvent.click(screen.getByText('Alice'));

      // Wait for scoring interface to load
      await waitFor(() => {
        expect(screen.getByText('Kiss on Mouth')).toBeInTheDocument();
      });

      // Click the scoring button (this should trigger the error)
      fireEvent.click(screen.getByText('Kiss on Mouth'));

      // Wait for the error callback to be called
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Failed to score action. Please try again.');
      }, { timeout: 3000 });
    });
  });

  describe('Mobile Responsiveness', () => {
    it('uses mobile-optimized layout classes', async () => {
      render(<EpisodeScorer leagueId="league-1" />);

      await waitFor(() => {
        // Check for mobile-first responsive classes
        expect(document.querySelector('.max-w-md')).toBeInTheDocument();
      });
    });

    it('has touch-friendly button sizes', async () => {
      render(<EpisodeScorer leagueId="league-1" />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Alice'));
      });

      await waitFor(() => {
        const scoringButtons = screen.getAllByText(/\+\d+ pts?/);
        scoringButtons.forEach(button => {
          const buttonElement = button.closest('button');
          expect(buttonElement).toHaveClass('p-4'); // Large padding for touch
        });
      });
    });

    it('shows grid layout for scoring buttons', async () => {
      render(<EpisodeScorer leagueId="league-1" />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Alice'));
      });

      await waitFor(() => {
        expect(document.querySelector('.grid-cols-2')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('shows live indicator in header', async () => {
      render(<EpisodeScorer leagueId="league-1" />);

      await waitFor(() => {
        expect(screen.getByText('Live Scoring')).toBeInTheDocument();
        // Check for animated red dot
        expect(document.querySelector('.bg-red-500.animate-pulse')).toBeInTheDocument();
      });
    });

    it('displays current episode number in header', async () => {
      render(<EpisodeScorer leagueId="league-1" />);

      await waitFor(() => {
        expect(screen.getByText(/Episode 3/)).toBeInTheDocument();
      });
    });
  });
});