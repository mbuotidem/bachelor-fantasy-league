import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContestantCard from '../components/ContestantCard';
import { createMockContestant } from '../test-utils/factories';

describe('ContestantCard', () => {
  const mockContestant = createMockContestant({
    id: 'contestant-1',
    name: 'Sarah Johnson',
    age: 28,
    hometown: 'Los Angeles, CA',
    occupation: 'Marketing Manager',
    bio: 'Loves adventure and finding true love',
    totalPoints: 15,
    isEliminated: false,
  });

  const mockEliminatedContestant = createMockContestant({
    id: 'contestant-2',
    name: 'Emily Davis',
    age: 26,
    hometown: 'New York, NY',
    occupation: 'Software Engineer',
    bio: 'Tech enthusiast looking for love',
    totalPoints: 8,
    isEliminated: true,
    eliminationEpisode: 3,
  });

  it('should render contestant information on front of card', () => {
    render(<ContestantCard contestant={mockContestant} />);

    expect(screen.getAllByText('Sarah Johnson')[0]).toBeInTheDocument();
    expect(screen.getByText('Age: 28')).toBeInTheDocument();
    expect(screen.getByText('From: Los Angeles, CA')).toBeInTheDocument();
    expect(screen.getByText('Marketing Manager')).toBeInTheDocument();
    expect(screen.getAllByText('15 pts')[0]).toBeInTheDocument();
    expect(screen.getByText('Click to see bio →')).toBeInTheDocument();
  });

  it('should show elimination overlay for eliminated contestants', () => {
    render(<ContestantCard contestant={mockEliminatedContestant} />);

    expect(screen.getByText('ELIMINATED')).toBeInTheDocument();
    expect(screen.getByText('Episode 3')).toBeInTheDocument();
  });

  it('should flip to show bio when clicked', async () => {
    render(<ContestantCard contestant={mockContestant} />);

    // Initially should show front content
    expect(screen.getByText('Click to see bio →')).toBeInTheDocument();

    // Click to flip - use the card container instead of text
    const card = screen.getByText('Click to see bio →').closest('.cursor-pointer');
    fireEvent.click(card!);

    // Should show bio content
    await waitFor(() => {
      expect(screen.getByText('Loves adventure and finding true love')).toBeInTheDocument();
      expect(screen.getByText('← Click to go back')).toBeInTheDocument();
    });
  });

  it('should show "No bio available" when bio is empty', async () => {
    const contestantWithoutBio = createMockContestant({
      ...mockContestant,
      bio: undefined,
    });

    render(<ContestantCard contestant={contestantWithoutBio} />);

    // Click to flip to bio side
    const card = screen.getByText('Click to see bio →').closest('.cursor-pointer');
    fireEvent.click(card!);

    await waitFor(() => {
      expect(screen.getByText('No bio available yet.')).toBeInTheDocument();
    });
  });

  it('should render action buttons for commissioners', () => {
    const mockOnEdit = jest.fn();
    const mockOnEliminate = jest.fn();
    const mockOnDelete = jest.fn();

    render(
      <ContestantCard
        contestant={mockContestant}
        onEdit={mockOnEdit}
        onEliminate={mockOnEliminate}
        onDelete={mockOnDelete}
        isCommissioner={true}
        showActions={true}
      />
    );

    // Flip to bio side to see action buttons
    const card = screen.getByText('Click to see bio →').closest('.cursor-pointer');
    fireEvent.click(card!);

    // Should show action buttons
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Eliminate')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('should show restore button for eliminated contestants', () => {
    const mockOnRestore = jest.fn();

    render(
      <ContestantCard
        contestant={mockEliminatedContestant}
        onRestore={mockOnRestore}
        isCommissioner={true}
        showActions={true}
      />
    );

    // Flip to bio side to see action buttons
    const card = screen.getByText('Click to see bio →').closest('.cursor-pointer');
    fireEvent.click(card!);

    // Should show restore button instead of eliminate
    expect(screen.getByText('Restore')).toBeInTheDocument();
    expect(screen.queryByText('Eliminate')).not.toBeInTheDocument();
  });

  it('should call action handlers when buttons are clicked', () => {
    const mockOnEdit = jest.fn();
    const mockOnEliminate = jest.fn();
    const mockOnDelete = jest.fn();

    render(
      <ContestantCard
        contestant={mockContestant}
        onEdit={mockOnEdit}
        onEliminate={mockOnEliminate}
        onDelete={mockOnDelete}
        isCommissioner={true}
        showActions={true}
      />
    );

    // Flip to bio side
    const card = screen.getByText('Click to see bio →').closest('.cursor-pointer');
    fireEvent.click(card!);

    // Click action buttons
    fireEvent.click(screen.getByText('Edit'));
    expect(mockOnEdit).toHaveBeenCalledWith(mockContestant);

    fireEvent.click(screen.getByText('Eliminate'));
    expect(mockOnEliminate).toHaveBeenCalledWith(mockContestant);

    fireEvent.click(screen.getByText('Delete'));
    expect(mockOnDelete).toHaveBeenCalledWith(mockContestant);
  });

  it('should prevent card flip when action buttons are clicked', () => {
    const mockOnEdit = jest.fn();

    render(
      <ContestantCard
        contestant={mockContestant}
        onEdit={mockOnEdit}
        isCommissioner={true}
        showActions={true}
      />
    );

    // Flip to bio side first
    const card = screen.getByText('Click to see bio →').closest('.cursor-pointer');
    fireEvent.click(card!);

    // Click edit button - should not flip card back
    fireEvent.click(screen.getByText('Edit'));
    
    // Should still be on bio side
    expect(screen.getByText('← Click to go back')).toBeInTheDocument();
    expect(mockOnEdit).toHaveBeenCalledWith(mockContestant);
  });

  it('should not show action buttons when not commissioner', () => {
    render(
      <ContestantCard
        contestant={mockContestant}
        isCommissioner={false}
        showActions={false}
      />
    );

    // Flip to bio side
    const card = screen.getByText('Click to see bio →').closest('.cursor-pointer');
    fireEvent.click(card!);

    // Should not show action buttons
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Eliminate')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('should handle missing optional fields gracefully', () => {
    const minimalContestant = createMockContestant({
      id: 'contestant-minimal',
      name: 'Minimal Contestant',
      age: undefined,
      hometown: undefined,
      occupation: undefined,
      bio: undefined,
      totalPoints: 0,
      isEliminated: false,
    });

    render(<ContestantCard contestant={minimalContestant} />);

    expect(screen.getAllByText('Minimal Contestant')[0]).toBeInTheDocument();
    expect(screen.getAllByText('0 pts')[0]).toBeInTheDocument();
    
    // Should not show age, hometown, or occupation if not provided
    expect(screen.queryByText(/Age:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/From:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Marketing/)).not.toBeInTheDocument();
  });

  it('should display profile image when provided', () => {
    const contestantWithImage = createMockContestant({
      ...mockContestant,
      profileImageUrl: 'https://example.com/photo.jpg',
    });

    render(<ContestantCard contestant={contestantWithImage} />);

    const image = screen.getByAltText('Sarah Johnson');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/photo.jpg');
  });

  it('should show default avatar when no profile image', () => {
    const contestantWithoutImage = createMockContestant({
      ...mockContestant,
      profileImageUrl: undefined,
    });

    render(<ContestantCard contestant={contestantWithoutImage} />);

    // Should show default avatar SVG
    const avatarContainer = screen.getAllByText('Sarah Johnson')[0].closest('.bg-white')?.querySelector('.bg-gradient-to-br');
    expect(avatarContainer).toBeInTheDocument();
    
    // Should not have an img element
    expect(screen.queryByAltText('Sarah Johnson')).not.toBeInTheDocument();
  });

  it('should apply eliminated styling to eliminated contestants', () => {
    render(<ContestantCard contestant={mockEliminatedContestant} />);

    // Check for red border and background classes
    const cardElement = screen.getAllByText('Emily Davis')[0].closest('.border-2');
    expect(cardElement).toHaveClass('border-red-300', 'bg-red-50');
    
    // Check for red text color on name
    const nameElement = screen.getAllByText('Emily Davis')[0];
    expect(nameElement).toHaveClass('text-red-700');
  });

  it('should apply normal styling to active contestants', () => {
    render(<ContestantCard contestant={mockContestant} />);

    // Check for normal border and background classes
    const cardElement = screen.getAllByText('Sarah Johnson')[0].closest('.border-2');
    expect(cardElement).toHaveClass('border-gray-200');
    expect(cardElement).not.toHaveClass('bg-red-50');
    
    // Check for normal text color on name
    const nameElement = screen.getAllByText('Sarah Johnson')[0];
    expect(nameElement).toHaveClass('text-gray-900');
  });
});