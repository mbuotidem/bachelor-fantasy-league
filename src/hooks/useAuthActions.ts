'use client';

import { useState } from 'react';
import { 
  signUp, 
  signIn, 
  confirmSignUp, 
  resetPassword, 
  confirmResetPassword,
  resendSignUpCode
} from 'aws-amplify/auth';
import { 
  SignUpData, 
  SignInData, 
  ConfirmSignUpData, 
  ResetPasswordData, 
  ConfirmResetPasswordData,
  AuthError 
} from '../types/auth';

export const useAuthActions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const clearError = () => setError(null);

  const handleSignUp = async (data: SignUpData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await signUp({
        username: data.email,
        password: data.password,
        options: {
          userAttributes: {
            email: data.email,
            ...(data.displayName && { name: data.displayName }),
          },
        },
      });
      
      return result;
    } catch (err: any) {
      const authError: AuthError = {
        message: err.message || 'Sign up failed',
        code: err.name,
      };
      setError(authError);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (data: SignInData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await signIn({
        username: data.email,
        password: data.password,
      });
      
      return result;
    } catch (err: any) {
      const authError: AuthError = {
        message: err.message || 'Sign in failed',
        code: err.name,
      };
      setError(authError);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSignUp = async (data: ConfirmSignUpData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await confirmSignUp({
        username: data.email,
        confirmationCode: data.code,
      });
      
      return result;
    } catch (err: any) {
      const authError: AuthError = {
        message: err.message || 'Email verification failed',
        code: err.name,
      };
      setError(authError);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (data: ResetPasswordData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await resetPassword({
        username: data.email,
      });
      
      return result;
    } catch (err: any) {
      const authError: AuthError = {
        message: err.message || 'Password reset request failed',
        code: err.name,
      };
      setError(authError);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmResetPassword = async (data: ConfirmResetPasswordData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await confirmResetPassword({
        username: data.email,
        confirmationCode: data.code,
        newPassword: data.newPassword,
      });
      
      return result;
    } catch (err: any) {
      const authError: AuthError = {
        message: err.message || 'Password reset confirmation failed',
        code: err.name,
      };
      setError(authError);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async (email: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await resendSignUpCode({
        username: email,
      });
      
      return result;
    } catch (err: any) {
      const authError: AuthError = {
        message: err.message || 'Resend code failed',
        code: err.name,
      };
      setError(authError);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    clearError,
    signUp: handleSignUp,
    signIn: handleSignIn,
    confirmSignUp: handleConfirmSignUp,
    resetPassword: handleResetPassword,
    confirmResetPassword: handleConfirmResetPassword,
    resendCode: handleResendCode,
  };
};