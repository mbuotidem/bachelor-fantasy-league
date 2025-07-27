// Test data factories for authentication testing

export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
  ...overrides,
});

export const createMockAuthState = (overrides = {}) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  ...overrides,
});

export const createMockSignUpData = (overrides = {}) => ({
  email: 'test@example.com',
  password: 'Password123!',
  displayName: 'Test User',
  ...overrides,
});

export const createMockSignInData = (overrides = {}) => ({
  email: 'test@example.com',
  password: 'Password123!',
  ...overrides,
});