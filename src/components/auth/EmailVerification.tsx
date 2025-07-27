'use client';

import React, { useState } from 'react';
import { useAuthActions } from '../../hooks/useAuthActions';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ConfirmSignUpData } from '../../types/auth';

interface EmailVerificationProps {
  email: string;
  onSuccess?: () => void;
  onBack?: () => void;
}

export const EmailVerification: React.FC<EmailVerificationProps> = ({
  email,
  onSuccess,
  onBack,
}) => {
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');

  const { 
    confirmSignUp, 
    resendCode, 
    isLoading, 
    error, 
    clearError 
  } = useAuthActions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setCodeError('');

    if (!code.trim()) {
      setCodeError('Verification code is required');
      return;
    }

    try {
      await confirmSignUp({ email, code: code.trim() });
      onSuccess?.();
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleResendCode = async () => {
    clearError();
    try {
      await resendCode(email);
      // Show success message or toast
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value);
    if (codeError) {
      setCodeError('');
    }
    if (error) {
      clearError();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white py-8 px-6 shadow rounded-lg">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center">
            Verify Your Email
          </h2>
          <p className="mt-2 text-sm text-gray-600 text-center">
            We've sent a verification code to
          </p>
          <p className="text-sm font-medium text-gray-900 text-center">
            {email}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Verification Code"
            type="text"
            value={code}
            onChange={handleCodeChange}
            error={codeError}
            placeholder="Enter 6-digit code"
            maxLength={6}
            autoComplete="one-time-code"
            required
          />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error.message}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Verify Email'}
          </Button>
        </form>

        <div className="mt-6 space-y-3">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Didn't receive the code?{' '}
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isLoading}
                className="text-blue-600 hover:text-blue-500 font-medium disabled:opacity-50"
              >
                Resend code
              </button>
            </p>
          </div>

          {onBack && (
            <div className="text-center">
              <button
                type="button"
                onClick={onBack}
                className="text-sm text-gray-600 hover:text-gray-500"
              >
                ← Back to sign up
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};