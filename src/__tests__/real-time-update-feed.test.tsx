import React from 'react';
import { render, screen } from '@testing-library/react';
import { RealTimeUpdateFeed } from '../components/RealTimeUpdateFeed';
import { useNotificationEvents } from '../hooks/useNotifications';
import type { NotificationEvent } from '../services/notification-service';

// Mock the useNotificationEvents hook
jest.mock('../hooks/useNotifications', () => ({
  useNotificationEvents: jest.fn(),
}));

const mockUseNotificationEvents = useNotificationEvents as jest.MockedFunction<typeof useNotificationEvents>;

describe('RealTimeUpdateFeed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render empty state when no updates', () => {
    mockUseNotificationEvents.mockReturnValue(null);

    render(<RealTimeUpdateFeed leagueId="league-123" />);

    expect(screen.getByText('No recent updates')).toBeInTheDocument();
    expect(screen.getByText('Activity will appear here as it happens')).toBeInTheDocument();
  });

  it('should render live updates header when there are updates', () => {
    let eventCallback: (event: NotificationEvent) => void;
    
    mockUseNotificationEvents.mockImplementation((leagueId, callback) => {
      eventCallback = callback!;
      return null;
    });

    const { rerender } = render(<RealTimeUpdateFeed leagueId="league-123" />);

    // Simulate receiving an event
    const testEvent: NotificationEvent = {
      type: 'draft_started',
      leagueId: 'league-123',
      data: { leagueName: 'Test League' },
      timestamp: '2024-01-01T00:00:00.000Z',
    };

    eventCallback!(testEvent);
    rerender(<RealTimeUpdateFeed leagueId="league-123" />);

    expect(screen.getByText('Live Updates')).toBeInTheDocument();
  });

  it('should display draft started event', () => {
    let eventCallback: (event: NotificationEvent) => void;
    
    mockUseNotificationEvents.mockImplementation((leagueId, callback) => {
      eventCallback = callback!;
      return null;
    });

    const { rerender } = render(<RealTimeUpdateFeed leagueId="league-123" />);

    const testEvent: NotificationEvent = {
      type: 'draft_started',
      leagueId: 'league-123',
      data: { leagueName: 'Test League' },
      timestamp: '2024-01-01T00:00:00.000Z',
    };

    eventCallback!(testEvent);
    rerender(<RealTimeUpdateFeed leagueId="league-123" />);

    expect(screen.getByText('Draft Started')).toBeInTheDocument();
    expect(screen.getByText('The draft for Test League has begun!')).toBeInTheDocument();
  });

  it('should display draft pick made event', () => {
    let eventCallback: (event: NotificationEvent) => void;
    
    mockUseNotificationEvents.mockImplementation((leagueId, callback) => {
      eventCallback = callback!;
      return null;
    });

    const { rerender } = render(<RealTimeUpdateFeed leagueId="league-123" />);

    const testEvent: NotificationEvent = {
      type: 'draft_pick_made',
      leagueId: 'league-123',
      data: { teamName: 'Team Alpha', contestantName: 'Jane Doe' },
      timestamp: '2024-01-01T00:00:00.000Z',
    };

    eventCallback!(testEvent);
    rerender(<RealTimeUpdateFeed leagueId="league-123" />);

    expect(screen.getByText('Draft Pick')).toBeInTheDocument();
    expect(screen.getByText('Team Alpha selected Jane Doe')).toBeInTheDocument();
  });

  it('should display draft completed event', () => {
    let eventCallback: (event: NotificationEvent) => void;
    
    mockUseNotificationEvents.mockImplementation((leagueId, callback) => {
      eventCallback = callback!;
      return null;
    });

    const { rerender } = render(<RealTimeUpdateFeed leagueId="league-123" />);

    const testEvent: NotificationEvent = {
      type: 'draft_completed',
      leagueId: 'league-123',
      data: { leagueName: 'Test League' },
      timestamp: '2024-01-01T00:00:00.000Z',
    };

    eventCallback!(testEvent);
    rerender(<RealTimeUpdateFeed leagueId="league-123" />);

    expect(screen.getByText('Draft Complete')).toBeInTheDocument();
    expect(screen.getByText('The draft for Test League is finished!')).toBeInTheDocument();
  });

  it('should display positive scoring event', () => {
    let eventCallback: (event: NotificationEvent) => void;
    
    mockUseNotificationEvents.mockImplementation((leagueId, callback) => {
      eventCallback = callback!;
      return null;
    });

    const { rerender } = render(<RealTimeUpdateFeed leagueId="league-123" />);

    const testEvent: NotificationEvent = {
      type: 'scoring_event',
      leagueId: 'league-123',
      data: { contestantName: 'Jane Doe', points: 5, actionType: 'Kiss on mouth' },
      timestamp: '2024-01-01T00:00:00.000Z',
    };

    eventCallback!(testEvent);
    rerender(<RealTimeUpdateFeed leagueId="league-123" />);

    expect(screen.getByText('Jane Doe scored 5 points')).toBeInTheDocument();
    expect(screen.getByText('Kiss on mouth')).toBeInTheDocument();
  });

  it('should display negative scoring event', () => {
    let eventCallback: (event: NotificationEvent) => void;
    
    mockUseNotificationEvents.mockImplementation((leagueId, callback) => {
      eventCallback = callback!;
      return null;
    });

    const { rerender } = render(<RealTimeUpdateFeed leagueId="league-123" />);

    const testEvent: NotificationEvent = {
      type: 'scoring_event',
      leagueId: 'league-123',
      data: { contestantName: 'Jane Doe', points: -2, actionType: 'Crying per scene' },
      timestamp: '2024-01-01T00:00:00.000Z',
    };

    eventCallback!(testEvent);
    rerender(<RealTimeUpdateFeed leagueId="league-123" />);

    expect(screen.getByText('Jane Doe lost 2 points')).toBeInTheDocument();
    expect(screen.getByText('Crying per scene')).toBeInTheDocument();
  });

  it('should display standings update event', () => {
    let eventCallback: (event: NotificationEvent) => void;
    
    mockUseNotificationEvents.mockImplementation((leagueId, callback) => {
      eventCallback = callback!;
      return null;
    });

    const { rerender } = render(<RealTimeUpdateFeed leagueId="league-123" />);

    const testEvent: NotificationEvent = {
      type: 'standings_update',
      leagueId: 'league-123',
      data: { 
        changes: [{ teamName: 'Team Alpha', oldRank: 5, newRank: 2 }] 
      },
      timestamp: '2024-01-01T00:00:00.000Z',
    };

    eventCallback!(testEvent);
    rerender(<RealTimeUpdateFeed leagueId="league-123" />);

    expect(screen.getByText('Standings Update')).toBeInTheDocument();
    expect(screen.getByText('Team Alpha moved up to #2')).toBeInTheDocument();
  });

  it('should display episode started event', () => {
    let eventCallback: (event: NotificationEvent) => void;
    
    mockUseNotificationEvents.mockImplementation((leagueId, callback) => {
      eventCallback = callback!;
      return null;
    });

    const { rerender } = render(<RealTimeUpdateFeed leagueId="league-123" />);

    const testEvent: NotificationEvent = {
      type: 'episode_started',
      leagueId: 'league-123',
      data: { episodeNumber: 5 },
      timestamp: '2024-01-01T00:00:00.000Z',
    };

    eventCallback!(testEvent);
    rerender(<RealTimeUpdateFeed leagueId="league-123" />);

    expect(screen.getByText('Episode Scoring Active')).toBeInTheDocument();
    expect(screen.getByText('Episode 5 scoring is now live')).toBeInTheDocument();
  });

  it('should limit updates to maxItems', () => {
    let eventCallback: (event: NotificationEvent) => void;
    
    mockUseNotificationEvents.mockImplementation((leagueId, callback) => {
      eventCallback = callback!;
      return null;
    });

    const { rerender } = render(<RealTimeUpdateFeed leagueId="league-123" maxItems={2} />);

    // Add 3 events
    const events = [
      { type: 'draft_started' as const, data: { leagueName: 'League 1' } },
      { type: 'draft_started' as const, data: { leagueName: 'League 2' } },
      { type: 'draft_started' as const, data: { leagueName: 'League 3' } },
    ];

    events.forEach((eventData, index) => {
      eventCallback!({
        ...eventData,
        leagueId: 'league-123',
        timestamp: `2024-01-01T00:0${index}:00.000Z`,
      });
      rerender(<RealTimeUpdateFeed leagueId="league-123" maxItems={2} />);
    });

    // Should only show the last 2 events
    expect(screen.getByText('The draft for League 3 has begun!')).toBeInTheDocument();
    expect(screen.getByText('The draft for League 2 has begun!')).toBeInTheDocument();
    expect(screen.queryByText('The draft for League 1 has begun!')).not.toBeInTheDocument();
  });

  it('should show timestamps when showTimestamps is true', () => {
    let eventCallback: (event: NotificationEvent) => void;
    
    mockUseNotificationEvents.mockImplementation((leagueId, callback) => {
      eventCallback = callback!;
      return null;
    });

    const { rerender } = render(<RealTimeUpdateFeed leagueId="league-123" showTimestamps={true} />);

    const testEvent: NotificationEvent = {
      type: 'draft_started',
      leagueId: 'league-123',
      data: { leagueName: 'Test League' },
      timestamp: new Date().toISOString(),
    };

    eventCallback!(testEvent);
    rerender(<RealTimeUpdateFeed leagueId="league-123" showTimestamps={true} />);

    expect(screen.getByText('Just now')).toBeInTheDocument();
  });

  it('should hide timestamps when showTimestamps is false', () => {
    let eventCallback: (event: NotificationEvent) => void;
    
    mockUseNotificationEvents.mockImplementation((leagueId, callback) => {
      eventCallback = callback!;
      return null;
    });

    const { rerender } = render(<RealTimeUpdateFeed leagueId="league-123" showTimestamps={false} />);

    const testEvent: NotificationEvent = {
      type: 'draft_started',
      leagueId: 'league-123',
      data: { leagueName: 'Test League' },
      timestamp: new Date().toISOString(),
    };

    eventCallback!(testEvent);
    rerender(<RealTimeUpdateFeed leagueId="league-123" showTimestamps={false} />);

    expect(screen.queryByText('Just now')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    mockUseNotificationEvents.mockReturnValue(null);

    const { container } = render(
      <RealTimeUpdateFeed leagueId="league-123" className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});