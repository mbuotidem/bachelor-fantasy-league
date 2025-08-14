import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EpisodeScorer } from '../components/EpisodeScorer';
import { ScoringService } from '../services/scoring-service';
import { ContestantService } from '../services/contestant-service';
import { EpisodeService } from '../services/episode-service';
import { createMockContestant, createMockEpisode } from '../test-utils/factories';

// Mock the services
jest.mock('../services/scoring-service');
jest.mock('../services/contestant-service');
jest.mock('../services/episode-service');

const MockedScoringService = ScoringService as jest.MockedClass<typeof ScoringService>;
const MockedContestantService = ContestantService as jest.MockedClass<typeof ContestantService>;
const MockedEpisodeService = EpisodeService as jest.MockedClass<typeof EpisodeService>;

describe('EpisodeScorer Integration', () => {
  let mockScoringService: jest.Mocked<ScoringService>;
  let mockContestantService: jest.Mocked<ContestantService>;
  let mockEpisodeService: jest.Mocked<EpisodeService>;

  const mockContestants = [
    createMockContestant({ id: '1', name: 'Alice', isEliminated: false, totalPoints: 10 }),
    createMockContestant({ id: '2', name: 'Bob', isEliminated: false, totalPoints: 15 })
  ];

  const mockActiveEpisode = createMockEpisode({
    id: 'episode-1',
    episodeNumber: 3,
    isActive: true
  });

  beforeEach(() => {
    jest.clearAllMocks();

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

    MockedScoringService.mockImplementation(() => mockScoringService);
    MockedContestantService.mockImplementation(() => mockContestantService);
    MockedEpisodeService.mockImplementation(() => mockEpisodeService);

    mockContestantService.getContestantsByLeague.mockResolvedValue(mockContestants);
    mockEpisodeService.getActiveEpisode.mockResolvedValue(mockActiveEpisode);
    mockScoringService.calculateEpisodeTotals.mockResolvedValue({
      '1': 5, // Alice has 5 episode points
      '2': 3  // Bob has 3 episode points
    });
    mockScoringService.getRecentScoringEvents.mockResolvedValue([]);
  });

  it('renders and loads data successfully', async () => {
    render(<EpisodeScorer leagueId="league-1" />);

    // Should show loading initially
    expect(screen.getByText('Loading episode scorer...')).toBeInTheDocument();

    // Should load and display contestants
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText(/Episode 3/)).toBeInTheDocument();
    });

    // Should call the services
    expect(mockContestantService.getContestantsByLeague).toHaveBeenCalledWith('league-1');
    expect(mockEpisodeService.getActiveEpisode).toHaveBeenCalledWith('league-1');
    expect(mockScoringService.calculateEpisodeTotals).toHaveBeenCalledWith('episode-1');
  });

  it('allows contestant selection and shows scoring interface', async () => {
    render(<EpisodeScorer leagueId="league-1" />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    // Select Alice
    fireEvent.click(screen.getByText('Alice'));

    await waitFor(() => {
      expect(screen.getByText('Kiss on Mouth')).toBeInTheDocument();
      expect(screen.getByText('Rose This Week')).toBeInTheDocument();
      expect(screen.getByText('Back')).toBeInTheDocument();
    });
  });

  it('shows mobile-optimized interface', async () => {
    render(<EpisodeScorer leagueId="league-1" />);

    await waitFor(() => {
      // Check for mobile-optimized classes
      expect(document.querySelector('.max-w-md')).toBeInTheDocument();
      expect(screen.getByText('Live Scoring')).toBeInTheDocument();
    });
  });

  it('handles no active episode gracefully', async () => {
    mockEpisodeService.getActiveEpisode.mockResolvedValue(null);

    render(<EpisodeScorer leagueId="league-1" />);

    await waitFor(() => {
      expect(screen.getByText('No Active Episode')).toBeInTheDocument();
      expect(screen.getByText('No episode is currently active for scoring.')).toBeInTheDocument();
    });
  });

  it('shows category toggle buttons', async () => {
    render(<EpisodeScorer leagueId="league-1" />);

    await waitFor(() => {
      expect(screen.getByText('Positive')).toBeInTheDocument();
      expect(screen.getByText('Negative')).toBeInTheDocument();
      expect(screen.getByText('All')).toBeInTheDocument();
    });
  });

  it('displays real-time indicator', async () => {
    render(<EpisodeScorer leagueId="league-1" />);

    await waitFor(() => {
      expect(screen.getByText('Live Scoring')).toBeInTheDocument();
      // Check for animated red dot
      expect(document.querySelector('.bg-red-500.animate-pulse')).toBeInTheDocument();
    });
  });
});