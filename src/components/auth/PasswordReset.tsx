'use client';

import React, { useState } from 'react';
import { useAuthActions } from '../../hooks/useAuthActions';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ResetPasswordData, ConfirmResetPasswordData } from '../../types/auth';

interface PasswordResetProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

export const PasswordReset: React.FC<PasswordResetProps> = ({
  onSuccess,
  onBack,
}) => {
  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [confirmData, setConfirmData] = useState({
    code: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [confirmErrors, setConfirmErrors] = useState<{
    code?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const { 
    resetPassword, 
    confirmResetPassword, 
    isLoading, 
    error, 
    clearError 
  } = useAuthActions();

  const validateEmail = (): boolean => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validateConfirmForm = (): boolean => {
    const errors: typeof confirmErrors = {};

    if (!confirmData.code.trim()) {
      errors.code = 'Verification code is required';
    }

    if (!confirmData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (confirmData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(confirmData.newPassword)) {
      errors.newPassword = 'Password must contain uppercase, lowercase, number, and special character';
    }

    if (!confirmData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (confirmData.newPassword !== confirmData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setConfirmErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateEmail()) {
      return;
    }

    try {
      await resetPassword({ email });
      setStep('confirm');
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateConfirmForm()) {
      return;
    }

    try {
      await confirmResetPassword({
        email,
        code: confirmData.code.trim(),
        newPassword: confirmData.newPassword,
      });
      onSuccess?.();
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) {
      setEmailError('');
    }
    if (error) {
      clearError();
    }
  };

  const handleConfirmDataChange = (field: keyof typeof confirmData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setConfirmData(prev => ({ ...prev, [field]: e.target.value }));
    if (confirmErrors[field]) {
      setConfirmErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if (error) {
      clearError();
    }
  };

  if (step === 'request') {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 text-center">
              Reset Password
            </h2>
            <p className="mt-2 text-sm text-gray-600 text-center">
              Enter your email address and we'll send you a code to reset your password
            </p>
          </div>

          <form onSubmit={handleRequestReset} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              error={emailError}
              placeholder="Enter your email"
              autoComplete="email"
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
              {isLoading ? 'Sending Code...' : 'Send Reset Code'}
            </Button>
          </form>

          {onBack && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={onBack}
                className="text-sm text-gray-600 hover:text-gray-500"
              >
                ← Back to sign in
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white py-8 px-6 shadow rounded-lg">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center">
            Enter New Password
          </h2>
          <p className="mt-2 text-sm text-gray-600 text-center">
            We've sent a code to {email}
          </p>
        </div>

        <form onSubmit={handleConfirmReset} className="space-y-4">
          <Input
            label="Verification Code"
            type="text"
            value={confirmData.code}
            onChange={handleConfirmDataChange('code')}
            error={confirmErrors.code}
            placeholder="Enter 6-digit code"
            maxLength={6}
            autoComplete="one-time-code"
            required
          />

          <Input
            label="New Password"
            type="password"
            value={confirmData.newPassword}
            onChange={handleConfirmDataChange('newPassword')}
            error={confirmErrors.newPassword}
            placeholder="Enter new password"
            autoComplete="new-password"
            helperText="Must be 8+ characters with uppercase, lowercase, number, and special character"
            required
          />

          <Input
            label="Confirm New Password"
            type="password"
            value={confirmData.confirmPassword}
            onChange={handleConfirmDataChange('confirmPassword')}
            error={confirmErrors.confirmPassword}
            placeholder="Confirm new password"
            autoComplete="new-password"
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
            {isLoading ? 'Resetting Password...' : 'Reset Password'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setStep('request')}
            className="text-sm text-gray-600 hover:text-gray-500"
          >
            ← Back to email entry
          </button>
        </div>
      </div>
    </div>
  );
};