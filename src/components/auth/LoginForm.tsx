'use client';

import React, { useState } from 'react';
import { useAuthActions } from '../../hooks/useAuthActions';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { SignInData } from '../../types/auth';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToSignUp?: () => void;
  onSwitchToResetPassword?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onSwitchToSignUp,
  onSwitchToResetPassword,
}) => {
  const [formData, setFormData] = useState<SignInData>({
    email: '',
    password: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<SignInData>>({});

  const { signIn, isLoading, error, clearError } = useAuthActions();

  const validateForm = (): boolean => {
    const errors: Partial<SignInData> = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    try {
      await signIn(formData);
      onSuccess?.();
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleInputChange = (field: keyof SignInData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined }));
    }
    // Clear general error
    if (error) {
      clearError();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white py-8 px-6 shadow rounded-lg">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center">
            Sign In
          </h2>
          <p className="mt-2 text-sm text-gray-600 text-center">
            Welcome back to Bachelor Fantasy League
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleInputChange('email')}
            error={fieldErrors.email}
            placeholder="Enter your email"
            autoComplete="email"
            required
          />

          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={handleInputChange('password')}
            error={fieldErrors.password}
            placeholder="Enter your password"
            autoComplete="current-password"
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
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 space-y-3">
          <div className="text-center">
            <button
              type="button"
              onClick={onSwitchToResetPassword}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Forgot your password?
            </button>
          </div>

          {onSwitchToSignUp && (
            <div className="text-center">
              <span className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToSignUp}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  Sign up
                </button>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};