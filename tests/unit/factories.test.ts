import {
  createMockUser,
  createMockLeague,
  createMockTeam,
  createMockContestant,
  createMockScoringEvent,
  createMockUsers,
  createMockContestants,
} from '@/test-utils/factories'

describe('Test Data Factories', () => {
  describe('createMockUser', () => {
    it('creates a user with default values', () => {
      const user = createMockUser()
      
      expect(user).toHaveProperty('id')
      expect(user).toHaveProperty('email')
      expect(user).toHaveProperty('displayName')
      expect(user).toHaveProperty('createdAt')
      expect(user).toHaveProperty('updatedAt')
      expect(user.email).toContain('@example.com')
    })

    it('allows overriding default values', () => {
      const customEmail = 'custom@test.com'
      const user = createMockUser({ email: customEmail })
      
      expect(user.email).toBe(customEmail)
    })
  })

  describe('createMockLeague', () => {
    it('creates a league with default values', () => {
      const league = createMockLeague()
      
      expect(league).toHaveProperty('id')
      expect(league).toHaveProperty('name')
      expect(league).toHaveProperty('season')
      expect(league).toHaveProperty('leagueCode')
      expect(league).toHaveProperty('commissionerId')
      expect(league.status).toBe('draft')
      expect(league.maxTeams).toBe(20)
    })

    it('allows overriding default values', () => {
      const customName = 'My Custom League'
      const league = createMockLeague({ name: customName })
      
      expect(league.name).toBe(customName)
    })
  })

  describe('createMockContestant', () => {
    it('creates a contestant with default values', () => {
      const contestant = createMockContestant()
      
      expect(contestant).toHaveProperty('id')
      expect(contestant).toHaveProperty('name')
      expect(contestant).toHaveProperty('age')
      expect(contestant).toHaveProperty('hometown')
      expect(contestant).toHaveProperty('occupation')
      expect(contestant.isEliminated).toBe(false)
      expect(typeof contestant.totalPoints).toBe('number')
    })
  })

  describe('createMockScoringEvent', () => {
    it('creates a scoring event with valid action type and points', () => {
      const event = createMockScoringEvent()
      
      expect(event).toHaveProperty('id')
      expect(event).toHaveProperty('actionType')
      expect(event).toHaveProperty('points')
      expect(event).toHaveProperty('timestamp')
      expect(typeof event.points).toBe('number')
    })
  })

  describe('batch creation helpers', () => {
    it('creates multiple users', () => {
      const users = createMockUsers(3)
      
      expect(users).toHaveLength(3)
      expect(users[0]).toHaveProperty('id')
      expect(users[1]).toHaveProperty('id')
      expect(users[2]).toHaveProperty('id')
      
      // Ensure IDs are unique
      const ids = users.map(u => u.id)
      expect(new Set(ids).size).toBe(3)
    })

    it('creates multiple contestants for a league', () => {
      const leagueId = 'test-league-123'
      const contestants = createMockContestants(5, leagueId)
      
      expect(contestants).toHaveLength(5)
      contestants.forEach(contestant => {
        expect(contestant.leagueId).toBe(leagueId)
      })
    })
  })
})