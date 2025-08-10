// Mock implementation of auth utilities for testing

export const getCurrentUserId = jest.fn().mockResolvedValue('test-user-123');

export const getCurrentUserDetails = jest.fn().mockResolvedValue({
  userId: 'test-user-123',
  username: 'testuser',
  signInDetails: {
    loginId: 'test@example.com'
  }
});

export const isAuthenticated = jest.fn().mockResolvedValue(true);