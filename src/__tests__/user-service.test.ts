import { UserService } from '../services/user-service';
import { createMockUser } from '../test-utils/factories';

// Mock the API client
jest.mock('../lib/api-client', () => ({
  client: {
    models: {
      User: {
        create: jest.fn(),
        get: jest.fn(),
        list: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      }
    }
  }
}));

// Mock auth utilities
jest.mock('../lib/auth-utils', () => ({
  getCurrentUser: jest.fn().mockResolvedValue({
    userId: 'test-user-123',
    username: 'testuser',
    signInDetails: { loginId: 'test@placeholder.local' }
  }),
  isAuthenticated: jest.fn().mockResolvedValue(true)
}));

describe('UserService', () => {
  let userService: UserService;
  let mockClient: any;

  beforeEach(() => {
    userService = new UserService();
    mockClient = require('../lib/api-client').client;
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a user with default preferences', async () => {
      const mockUser = createMockUser({
        email: 'test@example.com',
        displayName: 'Test User'
      });

      mockClient.models.User.create.mockResolvedValue({
        data: {
          id: mockUser.id,
          email: mockUser.email,
          displayName: mockUser.displayName,
          preferences: JSON.stringify(mockUser.preferences),
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt
        }
      });

      const result = await userService.createUser({
        email: 'test@example.com',
        displayName: 'Test User'
      });

      expect(result.email).toBe('test@example.com');
      expect(result.displayName).toBe('Test User');
      expect(result.preferences.theme).toBe('light');
      expect(mockClient.models.User.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        displayName: 'Test User',
        preferences: expect.stringContaining('light')
      });
    });
  });

  describe('getUser', () => {
    it('should get a user by ID', async () => {
      const mockUser = createMockUser();

      mockClient.models.User.get.mockResolvedValue({
        data: {
          id: mockUser.id,
          email: mockUser.email,
          displayName: mockUser.displayName,
          preferences: JSON.stringify(mockUser.preferences),
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt
        }
      });

      const result = await userService.getUser(mockUser.id);

      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
      expect(mockClient.models.User.get).toHaveBeenCalledWith({ id: mockUser.id });
    });
  });

  describe('getUserByEmail', () => {
    it('should get a user by email', async () => {
      const mockUser = createMockUser();

      mockClient.models.User.list.mockResolvedValue({
        data: [{
          id: mockUser.id,
          email: mockUser.email,
          displayName: mockUser.displayName,
          preferences: JSON.stringify(mockUser.preferences),
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt
        }]
      });

      const result = await userService.getUserByEmail(mockUser.email);

      expect(result.email).toBe(mockUser.email);
      expect(mockClient.models.User.list).toHaveBeenCalledWith({
        filter: { email: { eq: mockUser.email } }
      });
    });
  });
});