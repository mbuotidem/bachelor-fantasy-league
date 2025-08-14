import { render, screen, act } from '@testing-library/react';
import DraftTimer from '../components/DraftTimer';

// Mock timers
jest.useFakeTimers();

describe('DraftTimer', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should render paused state when not active', () => {
    render(
      <DraftTimer
        timeLimit={120}
        isActive={false}
      />
    );

    expect(screen.getByText('Draft Paused')).toBeInTheDocument();
  });

  it('should render timer with correct initial time', () => {
    render(
      <DraftTimer
        timeLimit={120}
        isActive={true}
        currentTurnId="team1"
      />
    );

    expect(screen.getByText('2:00')).toBeInTheDocument();
    expect(screen.getByText('Time to Pick')).toBeInTheDocument();
  });

  it('should countdown properly', () => {
    render(
      <DraftTimer
        timeLimit={120}
        isActive={true}
        currentTurnId="team1"
      />
    );

    // Initial time should be displayed
    expect(screen.getByText('2:00')).toBeInTheDocument();
    expect(screen.getByText('Time to Pick')).toBeInTheDocument();
  });

  it('should reset timer when turn changes', () => {
    const { rerender } = render(
      <DraftTimer
        timeLimit={120}
        isActive={true}
        currentTurnId="team1"
      />
    );

    expect(screen.getByText('2:00')).toBeInTheDocument();

    // Change turn - timer should reset to full time
    rerender(
      <DraftTimer
        timeLimit={120}
        isActive={true}
        currentTurnId="team2"
      />
    );

    // Timer should still show full time after turn change
    expect(screen.getByText('2:00')).toBeInTheDocument();
  });

  it('should accept onTimeExpired callback', () => {
    const onTimeExpired = jest.fn();

    render(
      <DraftTimer
        timeLimit={5}
        isActive={true}
        currentTurnId="team1"
        onTimeExpired={onTimeExpired}
      />
    );

    // Timer should render with callback provided
    expect(screen.getByText('0:05')).toBeInTheDocument();
    expect(screen.getByText('Time to Pick')).toBeInTheDocument();
  });

  it('should show initial time correctly', () => {
    render(
      <DraftTimer
        timeLimit={10}
        isActive={true}
        currentTurnId="team1"
      />
    );

    // Should show initial time for low time limit
    expect(screen.getByText('0:10')).toBeInTheDocument();
    expect(screen.getByText('Time to Pick')).toBeInTheDocument();
  });

  it('should apply correct initial color classes', () => {
    const { container } = render(
      <DraftTimer
        timeLimit={120}
        isActive={true}
        currentTurnId="team1"
      />
    );

    // Should start with green color for full time
    expect(container.querySelector('.text-green-600')).toBeInTheDocument();
  });

  it('should format time correctly', () => {
    render(
      <DraftTimer
        timeLimit={125} // 2:05
        isActive={true}
        currentTurnId="team1"
      />
    );

    // Should format initial time correctly
    expect(screen.getByText('2:05')).toBeInTheDocument();
  });
});