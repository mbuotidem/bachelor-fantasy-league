import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContestantManager from '../components/ContestantManager';
import { createMockContestant } from '../test-utils/factories';

// Mock the contestant service
const mockContestantService = {
  getContestantsByLeague: jest.fn(),
  createContestant: jest.fn(),
  updateContestant: jest.fn(),
  eliminateContestant: jest.fn(),
  restoreContestant: jest.fn(),
  deleteContestant: jest.fn(),
};

jest.mock('../services/contestant-service', () => ({
  ContestantService: jest.fn().mockImplementation(() => mockContestantService),
}));

// Mock the child components
jest.mock('../components/ContestantCard', () => {
  return function MockContestantCard({ contestant, onEdit, onEliminate, onRestore, onDelete }: any) {
    return (
      <div data-testid={`contestant-card-${contestant.id}`}>
        <h3>{contestant.name}</h3>
        <p>{contestant.totalPoints} pts</p>
        {contestant.isEliminated && <span>ELIMINATED</span>}
        {onEdit && <button onClick={() => onEdit(contestant)}>Edit</button>}
        {onEliminate && <button onClick={() => onEliminate(contestant)}>Eliminate</button>}
        {onRestore && <button onClick={() => onRestore(contestant)}>Restore</button>}
        {onDelete && <button onClick={() => onDelete(contestant)}>Delete</button>}
      </div>
    );
  };
});

jest.mock('../components/ContestantForm', () => {
  return function MockContestantForm({ contestant, onSubmit, onCancel }: any) {
    return (
      <div data-testid="contestant-form">
        <h2>{contestant ? 'Edit Contestant' : 'Add New Contestant'}</h2>
        <button onClick={() => onSubmit(contestant || { leagueId: 'test-league', name: 'New Contestant' })}>
          Submit
        </button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    );
  };
});

describe('ContestantManager', () => {
  const mockContestants = [
    createMockContestant({
      id: 'contestant-1',
      name: 'Sarah Johnson',
      totalPoints: 15,
      isEliminated: false,
      hometown: 'Los Angeles, CA',
      occupation: 'Marketing Manager',
    }),
    createMockContestant({
      id: 'contestant-2',
      name: 'Emily Davis',
      totalPoints: 8,
      isEliminated: true,
      eliminationEpisode: 3,
      hometown: 'New York, NY',
      occupation: 'Software Engineer',
    }),
    createMockContestant({
      id: 'contestant-3',
      name: 'Jessica Smith',
      totalPoints: 22,
      isEliminated: false,
      hometown: 'Chicago, IL',
      occupation: 'Teacher',
    }),
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockContestantService.getContestantsByLeague.mockResolvedValue(mockContestants);
  });

  it('should render contestants grid', async () => {
    render(<ContestantManager leagueId="test-league" isCommissioner={false} />);

    await waitFor(() => {
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
      expect(screen.getByText('Emily Davis')).toBeInTheDocument();
      expect(screen.getByText('Jessica Smith')).toBeInTheDocument();
    });

    expect(mockContestantService.getContestantsByLeague).toHaveBeenCalledWith('test-league');
  });

  it('should show loading state initially', () => {
    render(<ContestantManager leagueId="test-league" isCommissioner={false} />);

    expect(screen.getByText('Loading contestants...')).toBeInTheDocument();
  });

  it('should show contestant statistics', async () => {
    render(<ContestantManager leagueId="test-league" isCommissioner={false} />);

    await waitFor(() => {
      expect(screen.getByText('3 total • 2 active • 1 eliminated')).toBeInTheDocument();
    });
  });

  it('should show add contestant button for commissioners', async () => {
    render(<ContestantManager leagueId="test-league" isCommissioner={true} />);

    await waitFor(() => {
      expect(screen.getByText('Add Contestant')).toBeInTheDocument();
    });
  });

  it('should not show add contestant button for non-commissioners', async () => {
    render(<ContestantManager leagueId="test-league" isCommissioner={false} />);

    await waitFor(() => {
      expect(screen.queryByText('Add Contestant')).not.toBeInTheDocument();
    });
  });

  it('should filter contestants by search term', async () => {
    render(<ContestantManager leagueId="test-league" isCommissioner={false} />);

    await waitFor(() => {
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    });

    // Search by name
    const searchInput = screen.getByPlaceholderText('Search contestants...');
    fireEvent.change(searchInput, { target: { value: 'Sarah' } });

    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    expect(screen.queryByText('Emily Davis')).not.toBeInTheDocument();
    expect(screen.queryByText('Jessica Smith')).not.toBeInTheDocument();
  });

  it('should filter contestants by status', async () => {
    render(<ContestantManager leagueId="test-league" isCommissioner={false} />);

    await waitFor(() => {
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    });

    // Filter to show only eliminated contestants
    const statusFilter = screen.getByDisplayValue('All Contestants');
    fireEvent.change(statusFilter, { target: { value: 'eliminated' } });

    expect(screen.queryByText('Sarah Johnson')).not.toBeInTheDocument();
    expect(screen.getByText('Emily Davis')).toBeInTheDocument();
    expect(screen.queryByText('Jessica Smith')).not.toBeInTheDocument();
  });

  it('should sort contestants by elimination status and points', async () => {
    render(<ContestantManager leagueId="test-league" isCommissioner={false} />);

    await waitFor(() => {
      const cards = screen.getAllByTestId(/contestant-card-/);
      expect(cards).toHaveLength(3);
      
      // Active contestants should come first, sorted by points (highest first)
      expect(cards[0]).toHaveAttribute('data-testid', 'contestant-card-contestant-3'); // Jessica (22 pts, active)
      expect(cards[1]).toHaveAttribute('data-testid', 'contestant-card-contestant-1'); // Sarah (15 pts, active)
      expect(cards[2]).toHaveAttribute('data-testid', 'contestant-card-contestant-2'); // Emily (8 pts, eliminated)
    });
  });

  it('should open add contestant form when add button is clicked', async () => {
    render(<ContestantManager leagueId="test-league" isCommissioner={true} />);

    await waitFor(() => {
      expect(screen.getByText('Add Contestant')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Add Contestant'));

    expect(screen.getByTestId('contestant-form')).toBeInTheDocument();
    expect(screen.getByText('Add New Contestant')).toBeInTheDocument();
  });

  it('should create new contestant', async () => {
    const newContestant = createMockContestant({
      id: 'contestant-4',
      name: 'New Contestant',
      leagueId: 'test-league',
    });

    mockContestantService.createContestant.mockResolvedValue(newContestant);

    render(<ContestantManager leagueId="test-league" isCommissioner={true} />);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Add Contestant'));
    });

    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(mockContestantService.createContestant).toHaveBeenCalledWith({
        leagueId: 'test-league',
        name: 'New Contestant',
      });
    });
  });

  it('should open edit form when edit button is clicked', async () => {
    render(<ContestantManager leagueId="test-league" isCommissioner={true} />);

    await waitFor(() => {
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText('Edit')[0]);

    expect(screen.getByTestId('contestant-form')).toBeInTheDocument();
    expect(screen.getByText('Edit Contestant')).toBeInTheDocument();
  });

  it('should eliminate contestant with confirmation', async () => {
    const updatedContestant = { ...mockContestants[0], isEliminated: true, eliminationEpisode: 1 };
    mockContestantService.eliminateContestant.mockResolvedValue(updatedContestant);

    // Mock window.confirm
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(<ContestantManager leagueId="test-league" isCommissioner={true} />);

    await waitFor(() => {
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText('Eliminate')[0]);

    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to eliminate Jessica Smith?');
    
    await waitFor(() => {
      expect(mockContestantService.eliminateContestant).toHaveBeenCalledWith({
        contestantId: 'contestant-3',
        episodeNumber: 1,
      });
    });

    confirmSpy.mockRestore();
  });

  it('should not eliminate contestant if confirmation is cancelled', async () => {
    // Mock window.confirm to return false
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

    render(<ContestantManager leagueId="test-league" isCommissioner={true} />);

    await waitFor(() => {
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText('Eliminate')[0]);

    expect(confirmSpy).toHaveBeenCalled();
    expect(mockContestantService.eliminateContestant).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('should restore eliminated contestant', async () => {
    const restoredContestant = { ...mockContestants[1], isEliminated: false, eliminationEpisode: undefined };
    mockContestantService.restoreContestant.mockResolvedValue(restoredContestant);

    render(<ContestantManager leagueId="test-league" isCommissioner={true} />);

    await waitFor(() => {
      expect(screen.getByText('Emily Davis')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText('Restore')[0]);

    await waitFor(() => {
      expect(mockContestantService.restoreContestant).toHaveBeenCalledWith('contestant-3');
    });
  });

  it('should delete contestant with confirmation', async () => {
    // Mock window.confirm
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(<ContestantManager leagueId="test-league" isCommissioner={true} />);

    await waitFor(() => {
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText('Delete')[0]);

    expect(confirmSpy).toHaveBeenCalledWith(
      'Are you sure you want to permanently delete Jessica Smith? This action cannot be undone.'
    );
    
    await waitFor(() => {
      expect(mockContestantService.deleteContestant).toHaveBeenCalledWith('contestant-3');
    });

    confirmSpy.mockRestore();
  });

  it('should display error message when loading fails', async () => {
    mockContestantService.getContestantsByLeague.mockRejectedValue(new Error('Failed to load'));

    render(<ContestantManager leagueId="test-league" isCommissioner={false} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });
  });

  it('should display empty state when no contestants match filters', async () => {
    render(<ContestantManager leagueId="test-league" isCommissioner={false} />);

    await waitFor(() => {
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    });

    // Search for non-existent contestant
    const searchInput = screen.getByPlaceholderText('Search contestants...');
    fireEvent.change(searchInput, { target: { value: 'NonExistent' } });

    expect(screen.getByText('No contestants found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search or filter criteria.')).toBeInTheDocument();
  });

  it('should display empty state for commissioners when no contestants exist', async () => {
    mockContestantService.getContestantsByLeague.mockResolvedValue([]);

    render(<ContestantManager leagueId="test-league" isCommissioner={true} />);

    await waitFor(() => {
      expect(screen.getByText('No contestants found')).toBeInTheDocument();
      expect(screen.getByText('Get started by adding your first contestant.')).toBeInTheDocument();
    });
  });

  it('should display empty state for non-commissioners when no contestants exist', async () => {
    mockContestantService.getContestantsByLeague.mockResolvedValue([]);

    render(<ContestantManager leagueId="test-league" isCommissioner={false} />);

    await waitFor(() => {
      expect(screen.getByText('No contestants found')).toBeInTheDocument();
      expect(screen.getByText("The commissioner hasn't added any contestants yet.")).toBeInTheDocument();
    });
  });

  it('should close form when cancel is clicked', async () => {
    render(<ContestantManager leagueId="test-league" isCommissioner={true} />);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Add Contestant'));
    });

    expect(screen.getByTestId('contestant-form')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel'));

    expect(screen.queryByTestId('contestant-form')).not.toBeInTheDocument();
  });

  it('should dismiss error message when close button is clicked', async () => {
    mockContestantService.eliminateContestant.mockRejectedValue(new Error('Elimination failed'));
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(<ContestantManager leagueId="test-league" isCommissioner={true} />);

    await waitFor(() => {
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText('Eliminate')[0]);

    await waitFor(() => {
      expect(screen.getByText('Elimination failed')).toBeInTheDocument();
    });

    // Click the error dismiss button
    const dismissButton = screen.getByText('Elimination failed').closest('.bg-red-50')?.querySelector('button');
    fireEvent.click(dismissButton!);

    expect(screen.queryByText('Elimination failed')).not.toBeInTheDocument();

    confirmSpy.mockRestore();
  });
});