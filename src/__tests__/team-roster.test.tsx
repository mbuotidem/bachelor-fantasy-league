import { render, screen, waitFor } from '@testing-library/react';
import TeamRoster from '../components/TeamRoster';
import type { Team, Draft, Contestant } from '../types';

// Mock AWS Amplify storage
jest.mock('aws-amplify/storage', () => ({
  getUrl: jest.fn(),
}));

// Mock services
jest.mock('../services', () => ({
  draftService: {
    getTeamPicks: jest.fn(),
  },
  contestantService: {
    getContestant: jest.fn(),
  },
}));

// Get the mocked services for use in tests
const { draftService: mockDraftService, contestantService: mockContestantService } = jest.mocked(
  require('../services')
);

// Mock data
const mockTeam: Team = {
  id: 'team1',
  name: 'Team Alpha',
  ownerId: 'user1',
  leagueId: 'league1',
  draftedContestants: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockContestants: Contestant[] = [
  {
    id: 'contestant1',
    name: 'Alice Johnson',
    leagueId: 'league1',
    age: 25,
    hometown: 'New York, NY',
    occupation: 'Marketing Manager',
    bio: 'Loves adventure and travel',
    profileImageUrl: 'https://example.com/alice.jpg',
    isEliminated: false,
    totalPoints: 150,
    episodeScores: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'contestant2',
    name: 'Bob Smith',
    leagueId: 'league1',
    age: 28,
    hometown: 'Los Angeles, CA',
    occupation: 'Software Engineer',
    totalPoints: 120,
    episodeScores: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockDraft: Draft = {
  id: 'draft1',
  leagueId: 'league1',
  status: 'in_progress',
  currentPick: 3,
  draftOrder: ['team1', 'team2', 'team3'],
  picks: [
    {
      pickNumber: 1,
      teamId: 'team1',
      contestantId: 'contestant1',
      timestamp: '2024-01-01T10:00:00Z',
    },
    {
      pickNumber: 2,
      teamId: 'team2',
      contestantId: 'contestant3',
      timestamp: '2024-01-01T10:01:00Z',
    },
  ],
  settings: {
    pickTimeLimit: 120,
    draftFormat: 'snake',
    autoPickEnabled: false,
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('TeamRoster', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render empty roster when no picks made', async () => {
    mockDraftService.getTeamPicks.mockReturnValue([]);

    render(<TeamRoster team={mockTeam} draft={mockDraft} />);

    await waitFor(() => {
      expect(screen.getByText('0 of 5 contestants drafted')).toBeInTheDocument();
    });

    expect(screen.getByText('No Contestants Drafted')).toBeInTheDocument();
    expect(screen.getByText('Start drafting contestants to build your team!')).toBeInTheDocument();

    // Should show 5 empty slots
    const emptySlots = screen.getAllByText('Empty Roster Spot');
    expect(emptySlots).toHaveLength(5);
  });

  it('should render roster with drafted contestants', async () => {
    const teamPicks = [
      {
        pickNumber: 1,
        teamId: 'team1',
        contestantId: 'contestant1',
        timestamp: '2024-01-01T10:00:00Z',
      },
      {
        pickNumber: 4,
        teamId: 'team1',
        contestantId: 'contestant2',
        timestamp: '2024-01-01T10:03:00Z',
      },
    ];

    mockDraftService.getTeamPicks.mockReturnValue(teamPicks);
    mockContestantService.getContestant
      .mockResolvedValueOnce(mockContestants[0])
      .mockResolvedValueOnce(mockContestants[1]);

    render(<TeamRoster team={mockTeam} draft={mockDraft} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('2 of 5 contestants drafted')).toBeInTheDocument();
    });

    // Should show drafted contestants
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();

    // Should show contestant details
    expect(screen.getByText(/Age 25/)).toBeInTheDocument();
    expect(screen.getByText(/New York, NY/)).toBeInTheDocument();
    expect(screen.getByText(/Marketing Manager/)).toBeInTheDocument();

    // Should show 3 empty slots
    const emptySlots = screen.getAllByText('Empty Roster Spot');
    expect(emptySlots).toHaveLength(3);

    // Should show total points
    expect(screen.getByText('270 pts')).toBeInTheDocument(); // 150 + 120
  });

  it('should show draft order information when enabled', async () => {
    const teamPicks = [
      {
        pickNumber: 1,
        teamId: 'team1',
        contestantId: 'contestant1',
        timestamp: '2024-01-01T10:00:00Z',
      },
    ];

    mockDraftService.getTeamPicks.mockReturnValue(teamPicks);
    mockContestantService.getContestant.mockResolvedValue(mockContestants[0]);

    render(
      <TeamRoster 
        team={mockTeam} 
        draft={mockDraft} 
        showDraftOrder={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    // Should show draft order info
    expect(screen.getByText('Round 1, Pick 1 (Overall #1)')).toBeInTheDocument();
  });

  it('should handle contestant loading errors gracefully', async () => {
    const teamPicks = [
      {
        pickNumber: 1,
        teamId: 'team1',
        contestantId: 'contestant1',
        timestamp: '2024-01-01T10:00:00Z',
      },
    ];

    mockDraftService.getTeamPicks.mockReturnValue(teamPicks);
    mockContestantService.getContestant.mockRejectedValue(new Error('Contestant not found'));

    render(<TeamRoster team={mockTeam} draft={mockDraft} />);

    await waitFor(() => {
      expect(screen.getByText('1 of 5 contestants drafted')).toBeInTheDocument();
    });

    expect(screen.getByText('Contestant #contestant1')).toBeInTheDocument();
    expect(screen.getByText('Failed to load details')).toBeInTheDocument();
  });
});