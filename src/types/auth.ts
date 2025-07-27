export interface User {
  id: string;
  email: string;
  displayName?: string;
  emailVerified: boolean;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface SignUpData {
  email: string;
  password: string;
  displayName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface ConfirmResetPasswordData {
  email: string;
  code: string;
  newPassword: string;
}

export interface ConfirmSignUpData {
  email: string;
  code: string;
}

export interface AuthError {
  message: string;
  code?: string;
}