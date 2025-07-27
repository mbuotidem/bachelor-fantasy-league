import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../LoginForm';
import { SignUpForm } from '../SignUpForm';
import { useAuthActions } from '../../../hooks/useAuthActions';

// Mock the useAuthActions hook
jest.mock('../../../hooks/useAuthActions');

const mockUseAuthActions = useAuthActions as jest.MockedFunction<typeof useAuthActions>;

describe('Authentication Integration', () => {
  const mockSignIn = jest.fn();
  const mockSignUp = jest.fn();
  const mockClearError = jest.fn();

  beforeEach(() => {
    mockUseAuthActions.mockReturnValue({
      signIn: mockSignIn,
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

  describe('LoginForm', () => {
    it('renders and allows user interaction', () => {
      render(<LoginForm />);
      
      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    });

    it('calls signIn when form is submitted with valid data', async () => {
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

    it('displays loading state', () => {
      mockUseAuthActions.mockReturnValue({
        signIn: mockSignIn,
        signUp: mockSignUp,
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
        signUp: mockSignUp,
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
  });

  describe('SignUpForm', () => {
    it('renders and allows user interaction', () => {
      render(<SignUpForm />);
      
      expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Display Name (Optional)')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
    });

    it('calls signUp when form is submitted with valid data', async () => {
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

    it('displays loading state', () => {
      mockUseAuthActions.mockReturnValue({
        signIn: mockSignIn,
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
        signIn: mockSignIn,
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
  });
});