import React from 'react';
import { render, screen } from '@testing-library/react';
import { NotificationContainer } from '../components/NotificationContainer';
import type { ToastNotification } from '../components/NotificationToast';

// Mock the NotificationToast component
jest.mock('../components/NotificationToast', () => ({
  NotificationToast: ({ notification, onDismiss }: { notification: ToastNotification; onDismiss: (id: string) => void }) => (
    <div data-testid={`toast-${notification.id}`}>
      <span>{notification.title}</span>
      <button onClick={() => onDismiss(notification.id)}>Dismiss</button>
    </div>
  ),
}));

describe('NotificationContainer', () => {
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createNotification = (id: string, title: string): ToastNotification => ({
    id,
    type: 'info',
    title,
    message: 'Test message',
    duration: 5000,
  });

  it('should render nothing when no notifications are provided', () => {
    const { container } = render(
      <NotificationContainer notifications={[]} onDismiss={mockOnDismiss} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render all provided notifications', () => {
    const notifications = [
      createNotification('1', 'First Notification'),
      createNotification('2', 'Second Notification'),
      createNotification('3', 'Third Notification'),
    ];

    render(
      <NotificationContainer notifications={notifications} onDismiss={mockOnDismiss} />
    );

    expect(screen.getByTestId('toast-1')).toBeInTheDocument();
    expect(screen.getByTestId('toast-2')).toBeInTheDocument();
    expect(screen.getByTestId('toast-3')).toBeInTheDocument();

    expect(screen.getByText('First Notification')).toBeInTheDocument();
    expect(screen.getByText('Second Notification')).toBeInTheDocument();
    expect(screen.getByText('Third Notification')).toBeInTheDocument();
  });

  it('should apply correct positioning classes', () => {
    const notifications = [createNotification('1', 'Test')];

    const positions = [
      { position: 'top-right' as const, expectedClass: 'top-4 right-4' },
      { position: 'top-left' as const, expectedClass: 'top-4 left-4' },
      { position: 'bottom-right' as const, expectedClass: 'bottom-4 right-4' },
      { position: 'bottom-left' as const, expectedClass: 'bottom-4 left-4' },
    ];

    positions.forEach(({ position, expectedClass }) => {
      const { container, unmount } = render(
        <NotificationContainer 
          notifications={notifications} 
          onDismiss={mockOnDismiss} 
          position={position}
        />
      );

      const containerElement = container.firstChild as HTMLElement;
      expect(containerElement).toHaveClass(expectedClass);
      
      unmount();
    });
  });

  it('should use top-right as default position', () => {
    const notifications = [createNotification('1', 'Test')];

    const { container } = render(
      <NotificationContainer notifications={notifications} onDismiss={mockOnDismiss} />
    );

    const containerElement = container.firstChild as HTMLElement;
    expect(containerElement).toHaveClass('top-4', 'right-4');
  });

  it('should have proper accessibility attributes', () => {
    const notifications = [createNotification('1', 'Test')];

    const { container } = render(
      <NotificationContainer notifications={notifications} onDismiss={mockOnDismiss} />
    );

    const containerElement = container.firstChild as HTMLElement;
    expect(containerElement).toHaveAttribute('aria-live', 'polite');
    expect(containerElement).toHaveAttribute('aria-label', 'Notifications');
  });

  it('should apply correct styling classes', () => {
    const notifications = [createNotification('1', 'Test')];

    const { container } = render(
      <NotificationContainer notifications={notifications} onDismiss={mockOnDismiss} />
    );

    const containerElement = container.firstChild as HTMLElement;
    expect(containerElement).toHaveClass(
      'fixed',
      'z-50',
      'flex',
      'flex-col',
      'space-y-2',
      'pointer-events-none',
      'max-h-screen',
      'overflow-hidden'
    );
  });

  it('should maintain notification order', () => {
    const notifications = [
      createNotification('1', 'First'),
      createNotification('2', 'Second'),
      createNotification('3', 'Third'),
    ];

    const { container } = render(
      <NotificationContainer notifications={notifications} onDismiss={mockOnDismiss} />
    );

    const toastElements = container.querySelectorAll('[data-testid^="toast-"]');
    expect(toastElements).toHaveLength(3);
    
    // Check order by data-testid
    expect(toastElements[0]).toHaveAttribute('data-testid', 'toast-1');
    expect(toastElements[1]).toHaveAttribute('data-testid', 'toast-2');
    expect(toastElements[2]).toHaveAttribute('data-testid', 'toast-3');
  });

  it('should handle empty notifications array gracefully', () => {
    const { container } = render(
      <NotificationContainer notifications={[]} onDismiss={mockOnDismiss} />
    );

    expect(container.firstChild).toBeNull();
  });
});