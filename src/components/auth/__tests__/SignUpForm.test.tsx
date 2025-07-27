import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignUpForm } from '../SignUpForm';
import { useAuthActions } from '../../../hooks/useAuthActions';

// Mock the useAuthActions hook
jest.mock('../../../hooks/useAuthActions');

const mockUseAuthActions = useAuthActions as jest.MockedFunction<typeof useAuthActions>;

describe('SignUpForm', () => {
  const mockSignUp = jest.fn();
  const mockClearError = jest.fn();

  beforeEach(() => {
    mockUseAuthActions.mockReturnValue({
      signIn: jest.fn(),
      signUp: mockSignUp,
      confirmSignUp: jest.fn(),
      resetPassword: jest.fn(),
      confirmResetPassword: jest.fn(),
      resendCode: jest.fn(),
      isLoading: false,
      error: null,
      clearError: mockClearError,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders sign up form correctly', () => {
    render(<SignUpForm />);

    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByText('Join the Bachelor Fantasy League')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Display Name (Optional)')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);

    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
      expect(screen.getByText('Please confirm your password')).toBeInTheDocument();
    });
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);

    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('validates password requirements', async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);

    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    // Test short password
    await user.type(passwordInput, '123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });

    // Clear and test weak password
    await user.clear(passwordInput);
    await user.type(passwordInput, 'password');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password must contain uppercase, lowercase, number, and special character')).toBeInTheDocument();
    });
  });

  it('validates password confirmation', async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);

    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    await user.type(passwordInput, 'Password123!');
    await user.type(confirmPasswordInput, 'DifferentPassword123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = jest.fn();
    mockSignUp.mockResolvedValue({ isSignUpComplete: false });

    render(<SignUpForm onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByLabelText('Email');
    const displayNameInput = screen.getByLabelText('Display Name (Optional)');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    await user.type(emailInput, 'test@example.com');
    await user.type(displayNameInput, 'Test User');
    await user.type(passwordInput, 'Password123!');
    await user.type(confirmPasswordInput, 'Password123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123!',
        displayName: 'Test User',
      });
    });

    expect(mockOnSuccess).toHaveBeenCalledWith('test@example.com');
  });

  it('submits form without display name', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = jest.fn();
    mockSignUp.mockResolvedValue({ isSignUpComplete: false });

    render(<SignUpForm onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123!');
    await user.type(confirmPasswordInput, 'Password123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123!',
        displayName: undefined,
      });
    });
  });

  it('displays loading state during submission', async () => {
    mockUseAuthActions.mockReturnValue({
      signIn: jest.fn(),
      signUp: mockSignUp,
      confirmSignUp: jest.fn(),
      resetPassword: jest.fn(),
      confirmResetPassword: jest.fn(),
      resendCode: jest.fn(),
      isLoading: true,
      error: null,
      clearError: mockClearError,
    });

    render(<SignUpForm />);

    const submitButton = screen.getByRole('button', { name: 'Creating Account...' });
    expect(submitButton).toBeDisabled();
  });

  it('displays error message', () => {
    mockUseAuthActions.mockReturnValue({
      signIn: jest.fn(),
      signUp: mockSignUp,
      confirmSignUp: jest.fn(),
      resetPassword: jest.fn(),
      confirmResetPassword: jest.fn(),
      resendCode: jest.fn(),
      isLoading: false,
      error: { message: 'User already exists', code: 'UsernameExistsException' },
      clearError: mockClearError,
    });

    render(<SignUpForm />);

    expect(screen.getByText('User already exists')).toBeInTheDocument();
  });

  it('calls switch to sign in when link is clicked', async () => {
    const user = userEvent.setup();
    const mockOnSwitchToSignIn = jest.fn();

    render(<SignUpForm onSwitchToSignIn={mockOnSwitchToSignIn} />);

    const signInLink = screen.getByText('Sign in');
    await user.click(signInLink);

    expect(mockOnSwitchToSignIn).toHaveBeenCalled();
  });

  it('clears field errors when user starts typing', async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);

    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    // First, trigger validation error
    await user.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    // Then start typing to clear error
    await user.type(emailInput, 'test@example.com');
    await waitFor(() => {
      expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
    });
  });
});