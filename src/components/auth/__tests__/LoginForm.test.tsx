import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../LoginForm';
import { useAuthActions } from '../../../hooks/useAuthActions';

// Mock the useAuthActions hook
jest.mock('../../../hooks/useAuthActions');

const mockUseAuthActions = useAuthActions as jest.MockedFunction<typeof useAuthActions>;

describe('LoginForm', () => {
  const mockSignIn = jest.fn();
  const mockClearError = jest.fn();

  beforeEach(() => {
    mockUseAuthActions.mockReturnValue({
      signIn: mockSignIn,
      signUp: jest.fn(),
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

  it('renders login form correctly', () => {
    render(<LoginForm />);

    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByText('Welcome back to Bachelor Fantasy League')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });

    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = jest.fn();
    mockSignIn.mockResolvedValue({ isSignedIn: true });

    render(<LoginForm onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it('displays loading state during submission', async () => {
    const user = userEvent.setup();
    mockUseAuthActions.mockReturnValue({
      signIn: mockSignIn,
      signUp: jest.fn(),
      confirmSignUp: jest.fn(),
      resetPassword: jest.fn(),
      confirmResetPassword: jest.fn(),
      resendCode: jest.fn(),
      isLoading: true,
      error: null,
      clearError: mockClearError,
    });

    render(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: 'Signing In...' });
    expect(submitButton).toBeDisabled();
  });

  it('displays error message', () => {
    mockUseAuthActions.mockReturnValue({
      signIn: mockSignIn,
      signUp: jest.fn(),
      confirmSignUp: jest.fn(),
      resetPassword: jest.fn(),
      confirmResetPassword: jest.fn(),
      resendCode: jest.fn(),
      isLoading: false,
      error: { message: 'Invalid credentials', code: 'NotAuthorizedException' },
      clearError: mockClearError,
    });

    render(<LoginForm />);

    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });

  it('clears field errors when user starts typing', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });

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

  it('calls switch functions when links are clicked', async () => {
    const user = userEvent.setup();
    const mockOnSwitchToSignUp = jest.fn();
    const mockOnSwitchToResetPassword = jest.fn();

    render(
      <LoginForm
        onSwitchToSignUp={mockOnSwitchToSignUp}
        onSwitchToResetPassword={mockOnSwitchToResetPassword}
      />
    );

    const signUpLink = screen.getByText('Sign up');
    const resetPasswordLink = screen.getByText('Forgot your password?');

    await user.click(signUpLink);
    expect(mockOnSwitchToSignUp).toHaveBeenCalled();

    await user.click(resetPasswordLink);
    expect(mockOnSwitchToResetPassword).toHaveBeenCalled();
  });

  it('clears general error when user starts typing', async () => {
    const user = userEvent.setup();
    mockUseAuthActions.mockReturnValue({
      signIn: mockSignIn,
      signUp: jest.fn(),
      confirmSignUp: jest.fn(),
      resetPassword: jest.fn(),
      confirmResetPassword: jest.fn(),
      resendCode: jest.fn(),
      isLoading: false,
      error: { message: 'Invalid credentials', code: 'NotAuthorizedException' },
      clearError: mockClearError,
    });

    render(<LoginForm />);

    const emailInput = screen.getByLabelText('Email');
    await user.type(emailInput, 'test');

    expect(mockClearError).toHaveBeenCalled();
  });
});