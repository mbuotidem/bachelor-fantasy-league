import {
  createMockUser,
  createMockLeague,
  createMockTeam,
  createMockContestant,
  createMockDraft,
  createMockEpisode,
  createMockScoringEvent,
  createMockUsers,
  createMockTeams,
  createMockContestants,
  createMockCompleteLeague,
  resetIdCounter
} from '../test-utils/factories'

import {
  validateUser,
  validateLeague,
  validateTeam,
  validateContestant,
  validateDraft,
  validateEpisode,
  validateScoringEvent
} from '../lib/validation'

describe('Test Factories', () => {
  beforeEach(() => {
    resetIdCounter()
  })

  test('creates valid mock user', () => {
    const user = createMockUser()
    const validation = validateUser(user)
    
    expect(validation.isValid).toBe(true)
    expect(user.id).toMatch(/^user-\d+$/)
    expect(user.email).toMatch(/^test\d+@example\.com$/)
    expect(user.displayName).toMatch(/^Test User \d+$/)
  })

  test('creates valid mock league', () => {
    const league = createMockLeague()
    const validation = validateLeague(league)
    
    expect(validation.isValid).toBe(true)
    expect(league.id).toMatch(/^league-\d+$/)
    expect(league.leagueCode).toMatch(/^ABC\d{3}$/)
    expect(league.status).toBe('created')
  })

  test('creates valid mock team', () => {
    const team = createMockTeam()
    const validation = validateTeam(team)
    
    expect(validation.isValid).toBe(true)
    expect(team.id).toMatch(/^team-\d+$/)
    expect(team.name).toMatch(/^Test Team \d+$/)
    expect(team.draftedContestants).toEqual([])
    expect(team.totalPoints).toBe(0)
  })

  test('creates valid mock contestant', () => {
    const contestant = createMockContestant()
    const validation = validateContestant(contestant)
    
    expect(validation.isValid).toBe(true)
    expect(contestant.id).toMatch(/^contestant-\d+$/)
    expect(contestant.name).toMatch(/^Test Contestant \d+$/)
    expect(contestant.age).toBe(25)
    expect(contestant.isEliminated).toBe(false)
  })

  test('creates valid mock draft', () => {
    const draft = createMockDraft()
    const validation = validateDraft(draft)
    
    expect(validation.isValid).toBe(true)
    expect(draft.id).toMatch(/^draft-\d+$/)
    expect(draft.status).toBe('not_started')
    expect(draft.draftOrder).toHaveLength(3)
    expect(draft.picks).toEqual([])
  })

  test('creates valid mock episode', () => {
    const episode = createMockEpisode()
    const validation = validateEpisode(episode)
    
    expect(validation.isValid).toBe(true)
    expect(episode.id).toMatch(/^episode-\d+$/)
    expect(episode.episodeNumber).toBe(1)
    expect(episode.isActive).toBe(false)
    expect(episode.scoringEvents).toEqual([])
  })

  test('creates valid mock scoring event', () => {
    const event = createMockScoringEvent()
    const validation = validateScoringEvent(event)
    
    expect(validation.isValid).toBe(true)
    expect(event.id).toMatch(/^event-\d+$/)
    expect(event.actionType).toBe('kiss_mouth')
    expect(event.points).toBe(2)
  })

  test('creates multiple users', () => {
    const users = createMockUsers(3)
    
    expect(users).toHaveLength(3)
    users.forEach(user => {
      const validation = validateUser(user)
      expect(validation.isValid).toBe(true)
    })
    
    // Check that IDs are unique
    const ids = users.map(u => u.id)
    expect(new Set(ids).size).toBe(3)
  })

  test('creates multiple teams for a league', () => {
    const leagueId = 'test-league-123'
    const teams = createMockTeams(5, leagueId)
    
    expect(teams).toHaveLength(5)
    teams.forEach((team, index) => {
      const validation = validateTeam(team)
      expect(validation.isValid).toBe(true)
      expect(team.leagueId).toBe(leagueId)
      expect(team.name).toBe(`Team ${index + 1}`)
    })
  })

  test('creates multiple contestants for a league', () => {
    const leagueId = 'test-league-123'
    const contestants = createMockContestants(10, leagueId)
    
    expect(contestants).toHaveLength(10)
    contestants.forEach(contestant => {
      const validation = validateContestant(contestant)
      expect(validation.isValid).toBe(true)
      expect(contestant.leagueId).toBe(leagueId)
    })
    
    // Check that names are varied
    const names = contestants.map(c => c.name)
    expect(new Set(names).size).toBeGreaterThan(1)
  })

  test('creates complete league setup', () => {
    const setup = createMockCompleteLeague(4, 15)
    
    expect(setup.teams).toHaveLength(4)
    expect(setup.contestants).toHaveLength(15)
    
    // Validate all entities
    const leagueValidation = validateLeague(setup.league)
    expect(leagueValidation.isValid).toBe(true)
    
    setup.teams.forEach(team => {
      const validation = validateTeam(team)
      expect(validation.isValid).toBe(true)
      expect(team.leagueId).toBe(setup.league.id)
    })
    
    setup.contestants.forEach(contestant => {
      const validation = validateContestant(contestant)
      expect(validation.isValid).toBe(true)
      expect(contestant.leagueId).toBe(setup.league.id)
    })
    
    const draftValidation = validateDraft(setup.draft)
    expect(draftValidation.isValid).toBe(true)
    expect(setup.draft.leagueId).toBe(setup.league.id)
    expect(setup.draft.draftOrder).toEqual(setup.teams.map(t => t.id))
    
    const episodeValidation = validateEpisode(setup.episode)
    expect(episodeValidation.isValid).toBe(true)
    expect(setup.episode.leagueId).toBe(setup.league.id)
  })

  test('supports overrides in factories', () => {
    const customUser = createMockUser({
      displayName: 'Custom User',
      email: 'custom@example.com'
    })
    
    expect(customUser.displayName).toBe('Custom User')
    expect(customUser.email).toBe('custom@example.com')
    
    const customLeague = createMockLeague({
      name: 'Custom League',
      status: 'active'
    })
    
    expect(customLeague.name).toBe('Custom League')
    expect(customLeague.status).toBe('active')
  })

  test('resets ID counter', () => {
    const user1 = createMockUser()
    expect(user1.id).toBe('user-1')
    
    const user2 = createMockUser()
    expect(user2.id).toBe('user-2')
    
    resetIdCounter()
    
    const user3 = createMockUser()
    expect(user3.id).toBe('user-1')
  })
})