import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { render, setupUserEvent } from '../test-utils/test-helpers';
import LeagueInvite from '../components/LeagueInvite';
import { createMockLeague } from '../test-utils/factories';

// Mock clipboard API
const mockWriteText = jest.fn();
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

// Mock window.open
const mockOpen = jest.fn();
Object.defineProperty(window, 'open', {
  value: mockOpen,
});

// Mock document.execCommand for fallback
const mockExecCommand = jest.fn();
Object.defineProperty(document, 'execCommand', {
  value: mockExecCommand,
});

describe('LeagueInvite', () => {
  let user: ReturnType<typeof setupUserEvent>;
  const mockLeague = createMockLeague({
    leagueCode: 'ABC123',
    name: 'Test League',
    season: 'Grant Ellis 2025',
    settings: {
      maxTeams: 12,
      draftFormat: 'snake',
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

  beforeEach(() => {
    user = setupUserEvent();
    mockWriteText.mockClear();
    mockOpen.mockClear();
    mockExecCommand.mockClear();
  });

  it('renders league invite information', () => {
    render(<LeagueInvite league={mockLeague} baseUrl="http://localhost:3000" />);

    expect(screen.getByText('Invite Friends to Your League')).toBeInTheDocument();
    expect(screen.getByText('Test League')).toBeInTheDocument();
    expect(screen.getByText('Grant Ellis 2025')).toBeInTheDocument();
    expect(screen.getByText(/max 12 teams/i)).toBeInTheDocument();
    expect(screen.getByText(/snake draft/i)).toBeInTheDocument();
  });

  it('displays league code correctly', () => {
    render(<LeagueInvite league={mockLeague} baseUrl="http://localhost:3000" />);

    expect(screen.getByText('ABC123')).toBeInTheDocument();
    expect(screen.getByText(/friends can enter this code/i)).toBeInTheDocument();
  });

  it('displays invite link correctly', () => {
    render(<LeagueInvite league={mockLeague} baseUrl="http://localhost:3000" />);

    const expectedUrl = 'http://localhost:3000/join/ABC123';
    expect(screen.getByText(expectedUrl)).toBeInTheDocument();
  });

  it('renders copy buttons for league code and invite URL', () => {
    render(<LeagueInvite league={mockLeague} baseUrl="http://localhost:3000" />);

    // Find the copy button in the League Code section
    const leagueCodeSection = screen.getByText('League Code').closest('div');
    const copyCodeButton = leagueCodeSection?.querySelector('button');
    expect(copyCodeButton).toBeInTheDocument();

    // Find the copy button in the Direct Invite Link section
    const inviteLinkSection = screen.getByText('Direct Invite Link').closest('div');
    const copyUrlButton = inviteLinkSection?.querySelector('button');
    expect(copyUrlButton).toBeInTheDocument();
  });

  it('renders share buttons', () => {
    render(<LeagueInvite league={mockLeague} baseUrl="http://localhost:3000" />);

    expect(screen.getByRole('button', { name: /email/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /text/i })).toBeInTheDocument();
  });

  it('calls onClose when done button is clicked', async () => {
    const onClose = jest.fn();

    render(<LeagueInvite league={mockLeague} onClose={onClose} baseUrl="http://localhost:3000" />);

    const doneButton = screen.getByRole('button', { name: /done/i });
    await user.click(doneButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('does not render done button when onClose is not provided', () => {
    render(<LeagueInvite league={mockLeague} baseUrl="http://localhost:3000" />);

    expect(screen.queryByRole('button', { name: /done/i })).not.toBeInTheDocument();
  });

  it('displays how to join instructions', () => {
    render(<LeagueInvite league={mockLeague} baseUrl="http://localhost:3000" />);

    expect(screen.getByText('How to Join')).toBeInTheDocument();
    expect(screen.getByText(/clicking the invite link/i)).toBeInTheDocument();
    expect(screen.getByText(/entering the league code/i)).toBeInTheDocument();
    expect(screen.getByText(/creating a team name/i)).toBeInTheDocument();
  });

  it('handles different league settings correctly', () => {
    const customLeague = createMockLeague({
      leagueCode: 'XYZ789',
      name: 'Custom League',
      season: 'Joey Graziadei 2024',
      settings: {
        maxTeams: 8,
        draftFormat: 'linear',
        contestantDraftLimit: 1,
        scoringRules: [],
        notificationSettings: {
          scoringUpdates: true,
          draftNotifications: true,
          standingsChanges: true,
          episodeReminders: true,
        },
      },
    });

    render(<LeagueInvite league={customLeague} baseUrl="http://localhost:3000" />);

    expect(screen.getByText('Custom League')).toBeInTheDocument();
    expect(screen.getByText('Joey Graziadei 2024')).toBeInTheDocument();
    expect(screen.getByText('XYZ789')).toBeInTheDocument();
    expect(screen.getByText(/max 8 teams/i)).toBeInTheDocument();
    expect(screen.getByText(/linear draft/i)).toBeInTheDocument();
  });
});