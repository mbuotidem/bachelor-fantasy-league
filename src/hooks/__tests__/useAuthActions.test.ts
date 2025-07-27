import { renderHook, act } from '@testing-library/react';
import { useAuthActions } from '../useAuthActions';
import { signUp, signIn, confirmSignUp, resetPassword, confirmResetPassword, resendSignUpCode } from 'aws-amplify/auth';

// Mock AWS Amplify auth functions
jest.mock('aws-amplify/auth', () => ({
  signUp: jest.fn(),
  signIn: jest.fn(),
  confirmSignUp: jest.fn(),
  resetPassword: jest.fn(),
  confirmResetPassword: jest.fn(),
  resendSignUpCode: jest.fn(),
}));

const mockSignUp = signUp as jest.MockedFunction<typeof signUp>;
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;
const mockConfirmSignUp = confirmSignUp as jest.MockedFunction<typeof confirmSignUp>;
const mockResetPassword = resetPassword as jest.MockedFunction<typeof resetPassword>;
const mockConfirmResetPassword = confirmResetPassword as jest.MockedFunction<typeof confirmResetPassword>;
const mockResendSignUpCode = resendSignUpCode as jest.MockedFunction<typeof resendSignUpCode>;

describe('useAuthActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('should successfully sign up a user', async () => {
      const mockResult = { isSignUpComplete: false, nextStep: { signUpStep: 'CONFIRM_SIGN_UP' } };
      mockSignUp.mockResolvedValue(mockResult as any);

      const { result } = renderHook(() => useAuthActions());

      await act(async () => {
        const response = await result.current.signUp({
          email: 'test@example.com',
          password: 'Password123!',
          displayName: 'Test User',
        });
        expect(response).toEqual(mockResult);
      });

      expect(mockSignUp).toHaveBeenCalledWith({
        username: 'test@example.com',
        password: 'Password123!',
        options: {
          userAttributes: {
            email: 'test@example.com',
            name: 'Test User',
          },
        },
      });
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle sign up errors', async () => {
      const mockError = new Error('User already exists');
      mockError.name = 'UsernameExistsException';
      mockSignUp.mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuthActions());

      await act(async () => {
        try {
          await result.current.signUp({
            email: 'test@example.com',
            password: 'Password123!',
          });
        } catch (error) {
          expect(error).toEqual({
            message: 'User already exists',
            code: 'UsernameExistsException',
          });
        }
      });

      expect(result.current.error).toEqual({
        message: 'User already exists',
        code: 'UsernameExistsException',
      });
    });
  });

  describe('signIn', () => {
    it('should successfully sign in a user', async () => {
      const mockResult = { isSignedIn: true, nextStep: { signInStep: 'DONE' } };
      mockSignIn.mockResolvedValue(mockResult as any);

      const { result } = renderHook(() => useAuthActions());

      await act(async () => {
        const response = await result.current.signIn({
          email: 'test@example.com',
          password: 'Password123!',
        });
        expect(response).toEqual(mockResult);
      });

      expect(mockSignIn).toHaveBeenCalledWith({
        username: 'test@example.com',
        password: 'Password123!',
      });
    });

    it('should handle sign in errors', async () => {
      const mockError = new Error('Incorrect username or password');
      mockError.name = 'NotAuthorizedException';
      mockSignIn.mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuthActions());

      await act(async () => {
        try {
          await result.current.signIn({
            email: 'test@example.com',
            password: 'wrongpassword',
          });
        } catch (error) {
          expect(error).toEqual({
            message: 'Incorrect username or password',
            code: 'NotAuthorizedException',
          });
        }
      });
    });
  });

  describe('confirmSignUp', () => {
    it('should successfully confirm sign up', async () => {
      const mockResult = { isSignUpComplete: true, nextStep: { signUpStep: 'DONE' } };
      mockConfirmSignUp.mockResolvedValue(mockResult as any);

      const { result } = renderHook(() => useAuthActions());

      await act(async () => {
        const response = await result.current.confirmSignUp({
          email: 'test@example.com',
          code: '123456',
        });
        expect(response).toEqual(mockResult);
      });

      expect(mockConfirmSignUp).toHaveBeenCalledWith({
        username: 'test@example.com',
        confirmationCode: '123456',
      });
    });
  });

  describe('resetPassword', () => {
    it('should successfully request password reset', async () => {
      const mockResult = { isPasswordReset: false, nextStep: { resetPasswordStep: 'CONFIRM_RESET_PASSWORD_WITH_CODE' } };
      mockResetPassword.mockResolvedValue(mockResult as any);

      const { result } = renderHook(() => useAuthActions());

      await act(async () => {
        const response = await result.current.resetPassword({
          email: 'test@example.com',
        });
        expect(response).toEqual(mockResult);
      });

      expect(mockResetPassword).toHaveBeenCalledWith({
        username: 'test@example.com',
      });
    });
  });

  describe('confirmResetPassword', () => {
    it('should successfully confirm password reset', async () => {
      const mockResult = { isPasswordReset: true };
      mockConfirmResetPassword.mockResolvedValue(mockResult as any);

      const { result } = renderHook(() => useAuthActions());

      await act(async () => {
        const response = await result.current.confirmResetPassword({
          email: 'test@example.com',
          code: '123456',
          newPassword: 'NewPassword123!',
        });
        expect(response).toEqual(mockResult);
      });

      expect(mockConfirmResetPassword).toHaveBeenCalledWith({
        username: 'test@example.com',
        confirmationCode: '123456',
        newPassword: 'NewPassword123!',
      });
    });
  });

  describe('resendCode', () => {
    it('should successfully resend verification code', async () => {
      const mockResult = { destination: 'test@example.com' };
      mockResendSignUpCode.mockResolvedValue(mockResult as any);

      const { result } = renderHook(() => useAuthActions());

      await act(async () => {
        const response = await result.current.resendCode('test@example.com');
        expect(response).toEqual(mockResult);
      });

      expect(mockResendSignUpCode).toHaveBeenCalledWith({
        username: 'test@example.com',
      });
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      const mockError = new Error('Test error');
      mockSignIn.mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuthActions());

      // First, create an error
      await act(async () => {
        try {
          await result.current.signIn({
            email: 'test@example.com',
            password: 'wrongpassword',
          });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBeTruthy();

      // Then clear it
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});