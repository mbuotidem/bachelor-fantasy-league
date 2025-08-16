import { StandingsService } from '../services/standings-service';

describe('StandingsService Owner Names', () => {
  let standingsService: StandingsService;

  beforeEach(() => {
    standingsService = new StandingsService();
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

    it('should handle non-user IDs', async () => {
      const getOwnerDisplayName = (standingsService as any).getOwnerDisplayName.bind(standingsService);
      
      expect(await getOwnerDisplayName('abc123def456')).toBe('Owner abc123de');
      expect(await getOwnerDisplayName('owner-xyz')).toBe('Owner owner-xy');
    });
  });

  describe('getUserById', () => {
    it('should create user objects with correct display names', async () => {
      const getUserById = (standingsService as any).getUserById.bind(standingsService);
      
      const user1 = await getUserById('user-1');
      expect(user1.id).toBe('user-1');
      expect(user1.displayName).toBe('User 1');
      expect(user1.email).toBe('user-1@example.com');

      const user2 = await getUserById('user-123');
      expect(user2.id).toBe('user-123');
      expect(user2.displayName).toBe('User 123');
      expect(user2.email).toBe('user-123@example.com');
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