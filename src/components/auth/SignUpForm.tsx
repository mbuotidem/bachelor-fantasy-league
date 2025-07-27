'use client';

import React, { useState } from 'react';
import { useAuthActions } from '../../hooks/useAuthActions';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { SignUpData } from '../../types/auth';

interface SignUpFormProps {
  onSuccess?: (email: string) => void;
  onSwitchToSignIn?: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({
  onSuccess,
  onSwitchToSignIn,
}) => {
  const [formData, setFormData] = useState<SignUpData & { confirmPassword: string }>({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<SignUpData & { confirmPassword: string }>>({});

  const { signUp, isLoading, error, clearError } = useAuthActions();

  const validateForm = (): boolean => {
    const errors: Partial<SignUpData & { confirmPassword: string }> = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
      errors.password = 'Password must contain uppercase, lowercase, number, and special character';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
      await signUp({
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName || undefined,
      });
      onSuccess?.(formData.email);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleInputChange = (field: keyof (SignUpData & { confirmPassword: string })) => (
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
            Create Account
          </h2>
          <p className="mt-2 text-sm text-gray-600 text-center">
            Join the Bachelor Fantasy League
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
            label="Display Name (Optional)"
            type="text"
            value={formData.displayName}
            onChange={handleInputChange('displayName')}
            error={fieldErrors.displayName}
            placeholder="How should we display your name?"
            autoComplete="name"
          />

          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={handleInputChange('password')}
            error={fieldErrors.password}
            placeholder="Create a password"
            autoComplete="new-password"
            helperText="Must be 8+ characters with uppercase, lowercase, number, and special character"
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange('confirmPassword')}
            error={fieldErrors.confirmPassword}
            placeholder="Confirm your password"
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
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        {onSwitchToSignIn && (
          <div className="mt-6 text-center">
            <span className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToSignIn}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Sign in
              </button>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};