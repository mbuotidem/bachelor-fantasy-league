import { StandingsService } from '../services/standings-service';
import { UserService } from '../services/user-service';

// Mock the services to prevent actual API calls
jest.mock('../services/team-service');
jest.mock('../services/contestant-service');
jest.mock('../services/league-service');
jest.mock('../services/scoring-service');
jest.mock('../services/user-service');

describe('StandingsService Owner Names', () => {
  let standingsService: StandingsService;
  let mockUserService: jest.Mocked<UserService>;

  beforeEach(() => {
    standingsService = new StandingsService();
    mockUserService = (standingsService as any).userService;

    // Mock userService.getUser to throw error so fallback logic is used
    mockUserService.getUser.mockRejectedValue(new Error('User not found'));
  });

  describe('getOwnerDisplayName', () => {
    it('should format user IDs with numbers correctly', async () => {
      // Access the private method for testing
      const getOwnerDisplayName = (standingsService as any).getOwnerDisplayName.bind(standingsService);

      expect(await getOwnerDisplayName('user-1')).toBe('User 1');
      expect(await getOwnerDisplayName('user-123')).toBe('User 123');
      expect(await getOwnerDisplayName('user1')).toBe('User 1');
      expect(await getOwnerDisplayName('user123')).toBe('User 123');
    });

    it('should handle user IDs without numbers', async () => {
      const getOwnerDisplayName = (standingsService as any).getOwnerDisplayName.bind(standingsService);

      expect(await getOwnerDisplayName('user')).toBe('Team Owner');
      expect(await getOwnerDisplayName('user-abc')).toBe('Team Owner');
    });

    it('should handle Cognito-style IDs', async () => {
      const getOwnerDisplayName = (standingsService as any).getOwnerDisplayName.bind(standingsService);

      expect(await getOwnerDisplayName('abc123def456')).toBe('Team Owner (abc123de)');
      expect(await getOwnerDisplayName('12345678-abcd-efgh-ijkl-123456789012')).toBe('Team Owner (12345678)');
    });

    it('should handle generic IDs', async () => {
      const getOwnerDisplayName = (standingsService as any).getOwnerDisplayName.bind(standingsService);

      expect(await getOwnerDisplayName('owner-xyz')).toBe('Team Owner (owner-xy)');
    });
  });

  describe('getUserById', () => {
    it('should create user objects with correct display names', async () => {
      const getUserById = (standingsService as any).getUserById.bind(standingsService);

      const user1 = await getUserById('user-1');
      expect(user1.id).toBe('user-1');
      expect(user1.displayName).toBe('User 1');
      expect(user1.email).toBe('user.1@placeholder.local');

      const user2 = await getUserById('user-123');
      expect(user2.id).toBe('user-123');
      expect(user2.displayName).toBe('User 123');
      expect(user2.email).toBe('user.123@placeholder.local');
    });

    it('should create consistent user objects', async () => {
      const getUserById = (standingsService as any).getUserById.bind(standingsService);

      const user1a = await getUserById('user-1');
      const user1b = await getUserById('user-1');

      expect(user1a.displayName).toBe(user1b.displayName);
      expect(user1a.email).toBe(user1b.email);
      expect(user1a.id).toBe(user1b.id);
    });
  });
});