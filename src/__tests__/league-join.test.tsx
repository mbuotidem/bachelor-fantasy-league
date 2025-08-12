import React from 'react';
import { screen, waitFor, act } from '@testing-library/react';
import { render, setupUserEvent } from '../test-utils/test-helpers';
import LeagueJoin from '../components/LeagueJoin';
import { LeagueService } from '../services/league-service';
import { createMockLeague } from '../test-utils/factories';

// Mock the LeagueService
jest.mock('../services/league-service');
const MockedLeagueService = LeagueService as jest.MockedClass<typeof LeagueService>;

describe('LeagueJoin', () => {
  let mockLeagueService: jest.Mocked<LeagueService>;
  let user: ReturnType<typeof setupUserEvent>;

  beforeEach(() => {
    user = setupUserEvent();
    mockLeagueService = {
      getLeagueByCode: jest.fn(),
      joinLeague: jest.fn(),
    } as any;
    MockedLeagueService.mockImplementation(() => mockLeagueService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the league join form', () => {
    render(<LeagueJoin />);

    expect(screen.getByText('Join a League')).toBeInTheDocument();
    expect(screen.getByLabelText(/league code/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /join league/i })).toBeInTheDocument();
  });

  it('formats league code input correctly', async () => {
    render(<LeagueJoin />);

    const codeInput = screen.getByLabelText(/league code/i);

    // Test lowercase conversion and character filtering
    await user.type(codeInput, 'abc123xyz');

    expect(codeInput).toHaveValue('ABC123');
  });

  it('limits league code to 6 characters', async () => {
    render(<LeagueJoin />);

    const codeInput = screen.getByLabelText(/league code/i);

    await user.type(codeInput, 'ABCDEFGHIJ');

    expect(codeInput).toHaveValue('ABCDEF');
  });

  it('loads league when valid code is entered', async () => {
    const mockLeague = createMockLeague({
      leagueCode: 'ABC123',
      name: 'Test League',
      season: 'Grant Ellis 2025',
    });

    mockLeagueService.getLeagueByCode.mockResolvedValue(mockLeague);

    render(<LeagueJoin />);

    const codeInput = screen.getByLabelText(/league code/i);
    
    await act(async () => {
      await user.type(codeInput, 'ABC123');
    });

    await waitFor(() => {
      expect(mockLeagueService.getLeagueByCode).toHaveBeenCalledWith('ABC123');
      expect(screen.getByText('League Found!')).toBeInTheDocument();
      expect(screen.getByText('Test League')).toBeInTheDocument();
      expect(screen.getByText('Grant Ellis 2025')).toBeInTheDocument();
    });
  });

  it('shows team name input when league is found', async () => {
    const mockLeague = createMockLeague({ leagueCode: 'ABC123' });
    mockLeagueService.getLeagueByCode.mockResolvedValue(mockLeague);

    render(<LeagueJoin />);

    const codeInput = screen.getByLabelText(/league code/i);
    
    await act(async () => {
      await user.type(codeInput, 'ABC123');
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/your team name/i)).toBeInTheDocument();
    });
  });

  it('shows error when league code is not found', async () => {
    mockLeagueService.getLeagueByCode.mockRejectedValue(new Error('League not found'));

    render(<LeagueJoin />);

    const codeInput = screen.getByLabelText(/league code/i);
    
    await act(async () => {
      await user.type(codeInput, 'INVALID');
    });

    await waitFor(() => {
      expect(screen.getByText('League not found')).toBeInTheDocument();
    });
  });

  it('shows loading state when searching for league', async () => {
    mockLeagueService.getLeagueByCode.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(createMockLeague()), 100))
    );

    render(<LeagueJoin />);

    const codeInput = screen.getByLabelText(/league code/i);
    await user.type(codeInput, 'ABC123');

    expect(screen.getByText('Loading league...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Loading league...')).not.toBeInTheDocument();
    });
  });

  it('validates team name is required', async () => {
    const mockLeague = createMockLeague({ leagueCode: 'ABC123' });
    mockLeagueService.getLeagueByCode.mockResolvedValue(mockLeague);

    render(<LeagueJoin />);

    const codeInput = screen.getByLabelText(/league code/i);
    await user.type(codeInput, 'ABC123');

    await waitFor(() => {
      expect(screen.getByLabelText(/your team name/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /join league/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('name is required')).toBeInTheDocument();
    });
  });

  it('joins league successfully with valid data', async () => {
    const mockLeague = createMockLeague({
      leagueCode: 'ABC123',
      name: 'Test League',
    });
    const mockTeamId = 'team-123';
    const onJoinSuccess = jest.fn();

    mockLeagueService.getLeagueByCode.mockResolvedValue(mockLeague);
    mockLeagueService.joinLeague.mockResolvedValue({
      league: mockLeague,
      teamId: mockTeamId,
    });

    render(<LeagueJoin onJoinSuccess={onJoinSuccess} />);

    const codeInput = screen.getByLabelText(/league code/i);
    await user.type(codeInput, 'ABC123');

    await waitFor(() => {
      expect(screen.getByLabelText(/your team name/i)).toBeInTheDocument();
    });

    const teamNameInput = screen.getByLabelText(/your team name/i);
    const submitButton = screen.getByRole('button', { name: /join league/i });

    await user.type(teamNameInput, 'My Team');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLeagueService.joinLeague).toHaveBeenCalledWith({
        leagueCode: 'ABC123',
        teamName: 'My Team',
      });
    });

    expect(onJoinSuccess).toHaveBeenCalledWith(mockLeague, mockTeamId);
  });

  it('shows loading state during join', async () => {
    const mockLeague = createMockLeague({ leagueCode: 'ABC123' });
    mockLeagueService.getLeagueByCode.mockResolvedValue(mockLeague);
    mockLeagueService.joinLeague.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ league: mockLeague, teamId: 'team-123' }), 100))
    );

    render(<LeagueJoin />);

    const codeInput = screen.getByLabelText(/league code/i);
    await user.type(codeInput, 'ABC123');

    await waitFor(() => {
      expect(screen.getByLabelText(/your team name/i)).toBeInTheDocument();
    });

    const teamNameInput = screen.getByLabelText(/your team name/i);
    const submitButton = screen.getByRole('button', { name: /join league/i });

    await user.type(teamNameInput, 'My Team');
    await user.click(submitButton);

    expect(screen.getByText(/joining league/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText(/join league/i)).toBeInTheDocument();
    });
  });

  it('handles join errors', async () => {
    const mockLeague = createMockLeague({ leagueCode: 'ABC123' });
    const errorMessage = 'Failed to join league';

    mockLeagueService.getLeagueByCode.mockResolvedValue(mockLeague);
    mockLeagueService.joinLeague.mockRejectedValue(new Error(errorMessage));

    render(<LeagueJoin />);

    const codeInput = screen.getByLabelText(/league code/i);
    
    await act(async () => {
      await user.type(codeInput, 'ABC123');
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/your team name/i)).toBeInTheDocument();
    });

    const teamNameInput = screen.getByLabelText(/your team name/i);
    const submitButton = screen.getByRole('button', { name: /join league/i });

    await act(async () => {
      await user.type(teamNameInput, 'My Team');
      await user.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/error joining league/i)).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const onCancel = jest.fn();

    render(<LeagueJoin onCancel={onCancel} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it('pre-fills league code when provided', () => {
    render(<LeagueJoin initialLeagueCode="ABC123" />);

    const codeInput = screen.getByLabelText(/league code/i);
    expect(codeInput).toHaveValue('ABC123');
  });

  it('disables join button when no league is loaded', () => {
    render(<LeagueJoin />);

    const submitButton = screen.getByRole('button', { name: /join league/i });
    expect(submitButton).toBeDisabled();
  });

  it('clears team name errors when user starts typing', async () => {
    const mockLeague = createMockLeague({ leagueCode: 'ABC123' });
    mockLeagueService.getLeagueByCode.mockResolvedValue(mockLeague);

    render(<LeagueJoin />);

    const codeInput = screen.getByLabelText(/league code/i);
    await user.type(codeInput, 'ABC123');

    await waitFor(() => {
      expect(screen.getByLabelText(/your team name/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /join league/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('name is required')).toBeInTheDocument();
    });

    const teamNameInput = screen.getByLabelText(/your team name/i);
    await user.type(teamNameInput, 'T');

    await waitFor(() => {
      expect(screen.queryByText('name is required')).not.toBeInTheDocument();
    });
  });

  it('shows league details when found', async () => {
    const mockLeague = createMockLeague({
      leagueCode: 'ABC123',
      name: 'Test League',
      season: 'Grant Ellis 2025',
      settings: {
        maxTeams: 12,
        draftFormat: 'linear',
        contestantDraftLimit: 2,
        scoringRules: [],
        notificationSettings: {
          scoringUpdates: true,
          draftNotifications: true,
          standingsChanges: true,
          episodeReminders: true,
        },
      },
    });

    mockLeagueService.getLeagueByCode.mockResolvedValue(mockLeague);

    render(<LeagueJoin />);

    const codeInput = screen.getByLabelText(/league code/i);
    await user.type(codeInput, 'ABC123');

    await waitFor(() => {
      expect(screen.getByText('Test League')).toBeInTheDocument();
      expect(screen.getByText('Grant Ellis 2025')).toBeInTheDocument();
      expect(screen.getByText(/max 12 teams/i)).toBeInTheDocument();
      expect(screen.getByText(/linear draft/i)).toBeInTheDocument();
    });
  });
});