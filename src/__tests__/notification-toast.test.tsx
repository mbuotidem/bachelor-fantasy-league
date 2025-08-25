import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { NotificationToast } from '../components/NotificationToast';
import type { ToastNotification } from '../components/NotificationToast';

describe('NotificationToast', () => {
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const createNotification = (overrides: Partial<ToastNotification> = {}): ToastNotification => ({
    id: 'test-notification',
    type: 'info',
    title: 'Test Notification',
    message: 'This is a test message',
    duration: 5000,
    ...overrides,
  });

  it('should render notification with title and message', () => {
    const notification = createNotification();
    render(<NotificationToast notification={notification} onDismiss={mockOnDismiss} />);

    expect(screen.getByText('Test Notification')).toBeInTheDocument();
    expect(screen.getByText('This is a test message')).toBeInTheDocument();
  });

  it('should render different notification types with appropriate styling', () => {
    const types: Array<ToastNotification['type']> = ['success', 'error', 'info', 'warning'];

    types.forEach((type) => {
      const { unmount } = render(
        <NotificationToast 
          notification={createNotification({ type, title: `${type} notification` })} 
          onDismiss={mockOnDismiss} 
        />
      );
      
      expect(screen.getByText(`${type} notification`)).toBeInTheDocument();
      unmount();
    });
  });

  it('should render without message when message is not provided', () => {
    const notification = createNotification({ message: undefined });
    render(<NotificationToast notification={notification} onDismiss={mockOnDismiss} />);

    expect(screen.getByText('Test Notification')).toBeInTheDocument();
    expect(screen.queryByText('This is a test message')).not.toBeInTheDocument();
  });

  it('should render action button when action is provided', () => {
    const mockAction = jest.fn();
    const notification = createNotification({
      action: {
        label: 'Take Action',
        onClick: mockAction,
      },
    });

    render(<NotificationToast notification={notification} onDismiss={mockOnDismiss} />);

    const actionButton = screen.getByText('Take Action');
    expect(actionButton).toBeInTheDocument();

    fireEvent.click(actionButton);
    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it('should call onDismiss when close button is clicked', async () => {
    const notification = createNotification();
    render(<NotificationToast notification={notification} onDismiss={mockOnDismiss} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    // Wait for exit animation
    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(mockOnDismiss).toHaveBeenCalledWith('test-notification');
    });
  });

  it('should auto-dismiss after duration expires', async () => {
    const notification = createNotification({ duration: 3000 });
    render(<NotificationToast notification={notification} onDismiss={mockOnDismiss} />);

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Wait for exit animation
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(mockOnDismiss).toHaveBeenCalledWith('test-notification');
    });
  });

  it('should not auto-dismiss when duration is 0', () => {
    const notification = createNotification({ duration: 0 });
    render(<NotificationToast notification={notification} onDismiss={mockOnDismiss} />);

    // Fast-forward time significantly
    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(mockOnDismiss).not.toHaveBeenCalled();
  });

  it('should have proper accessibility attributes', () => {
    const notification = createNotification();
    render(<NotificationToast notification={notification} onDismiss={mockOnDismiss} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toHaveAttribute('type', 'button');
  });

  it('should show entrance animation', () => {
    const notification = createNotification();
    const { container } = render(<NotificationToast notification={notification} onDismiss={mockOnDismiss} />);

    const toastElement = container.firstChild as HTMLElement;
    expect(toastElement).toHaveClass('translate-x-full', 'opacity-0');

    // Advance timers to trigger entrance animation
    act(() => {
      jest.advanceTimersByTime(10);
    });

    expect(toastElement).toHaveClass('translate-x-0', 'opacity-100');
  });

  it('should handle different icon types correctly', () => {
    const types: Array<ToastNotification['type']> = ['success', 'error', 'info', 'warning'];

    types.forEach((type) => {
      const { container, unmount } = render(
        <NotificationToast 
          notification={createNotification({ type })} 
          onDismiss={mockOnDismiss} 
        />
      );
      
      // Check that an icon is rendered (we can't easily test which specific icon without more complex setup)
      const iconElement = container.querySelector('svg');
      expect(iconElement).toBeInTheDocument();
      
      unmount();
    });
  });
});