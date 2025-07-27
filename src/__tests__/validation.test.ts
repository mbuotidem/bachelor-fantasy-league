import {
  validateUser,
  validateUserPreferences,
  validateCreateLeagueInput,
  validateLeague,
  validateLeagueSettings,
  validateScoringRule,
  validateCreateTeamInput,
  validateTeam,
  validateCreateContestantInput,
  validateContestant,
  validateDraft,
  validateEpisode,
  validateScoreActionInput,
  validateScoringEvent,
  validateBatch
} from '../lib/validation'

import {
  User,
  UserPreferences,
  CreateLeagueInput,
  League,
  LeagueSettings,
  ScoringRule,
  CreateTeamInput,
  Team,
  CreateContestantInput,
  Contestant,
  Draft,
  Episode,
  ScoreActionInput,
  ScoringEvent
} from '../types'

describe('User Validation', () => {
  const validUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    preferences: {
      notifications: {
        email: true,
        push: true,
        scoring: true,
        draft: true
      },
      theme: 'light',
      timezone: 'America/New_York'
    }
  }

  test('validates valid user', () => {
    const result = validateUser(validUser)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('requires id field', () => {
    const user = { ...validUser, id: '' }
    const result = validateUser(user)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual({
      field: 'id',
      message: 'id is required',
      code: 'REQUIRED'
    })
  })

  test('requires valid email', () => {
    const user = { ...validUser, email: 'invalid-email' }
    const result = validateUser(user)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual({
      field: 'email',
      message: 'Invalid email format',
      code: 'INVALID_EMAIL'
    })
  })

  test('validates display name length', () => {
    const user = { ...validUser, displayName: 'a'.repeat(51) }
    const result = validateUser(user)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual({
      field: 'displayName',
      message: 'displayName must be no more than 50 characters long',
      code: 'MAX_LENGTH'
    })
  })

  test('validates date formats', () => {
    const user = { ...validUser, createdAt: 'invalid-date' }
    const result = validateUser(user)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual({
      field: 'createdAt',
      message: 'Invalid date format',
      code: 'INVALID_DATE'
    })
  })
})

describe('User Preferences Validation', () => {
  const validPreferences: UserPreferences = {
    notifications: {
      email: true,
      push: true,
      scoring: true,
      draft: true
    },
    theme: 'light',
    timezone: 'America/New_York'
  }

  test('validates valid preferences', () => {
    const result = validateUserPreferences(validPreferences)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('validates theme options', () => {
    const preferences = { ...validPreferences, theme: 'invalid' as any }
    const result = validateUserPreferences(preferences)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual({
      field: 'theme',
      message: 'Theme must be light, dark, or auto',
      code: 'INVALID_THEME'
    })
  })
})

describe('League Validation', () => {
  const validCreateLeagueInput: CreateLeagueInput = {
    name: 'Test League',
    season: 'Grant Ellis 2025',
    settings: {
      maxTeams: 10,
      contestantDraftLimit: 2,
      draftFormat: 'snake',
      scoringRules: [],
      notificationSettings: {
        scoringUpdates: true,
        draftNotifications: true,
        standingsChanges: true,
        episodeReminders: true
      }
    }
  }

  const validLeague: League = {
    id: 'league-123',
    name: 'Test League',
    season: 'Grant Ellis 2025',
    leagueCode: 'ABC123',
    commissionerId: 'user-123',
    settings: {
      maxTeams: 10,
      contestantDraftLimit: 2,
      draftFormat: 'snake',
      scoringRules: [],
      notificationSettings: {
        scoringUpdates: true,
        draftNotifications: true,
        standingsChanges: true,
        episodeReminders: true
      }
    },
    status: 'created',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }

  test('validates valid create league input', () => {
    const result = validateCreateLeagueInput(validCreateLeagueInput)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('requires league name', () => {
    const input = { ...validCreateLeagueInput, name: '' }
    const result = validateCreateLeagueInput(input)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual({
      field: 'name',
      message: 'name is required',
      code: 'REQUIRED'
    })
  })

  test('validates league name length', () => {
    const input = { ...validCreateLeagueInput, name: 'a'.repeat(101) }
    const result = validateCreateLeagueInput(input)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual({
      field: 'name',
      message: 'name must be no more than 100 characters long',
      code: 'MAX_LENGTH'
    })
  })

  test('validates valid league', () => {
    const result = validateLeague(validLeague)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('validates league code format', () => {
    const league = { ...validLeague, leagueCode: 'invalid' }
    const result = validateLeague(league)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual({
      field: 'leagueCode',
      message: 'League code must be 6 characters',
      code: 'INVALID_CODE'
    })
  })

  test('validates league status', () => {
    const league = { ...validLeague, status: 'invalid' as any }
    const result = validateLeague(league)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual({
      field: 'status',
      message: 'Invalid league status',
      code: 'INVALID_STATUS'
    })
  })
})

describe('League Settings Validation', () => {
  const validSettings: LeagueSettings = {
    maxTeams: 10,
    contestantDraftLimit: 2,
    draftFormat: 'snake',
    scoringRules: [],
    notificationSettings: {
      scoringUpdates: true,
      draftNotifications: true,
      standingsChanges: true,
      episodeReminders: true
    }
  }

  test('validates valid settings', () => {
    const result = validateLeagueSettings(validSettings)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('validates max teams range', () => {
    const settings = { ...validSettings, maxTeams: 25 }
    const result = validateLeagueSettings(settings)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual({
      field: 'maxTeams',
      message: 'maxTeams must be no more than 20',
      code: 'MAX_VALUE'
    })
  })

  test('validates draft format', () => {
    const settings = { ...validSettings, draftFormat: 'invalid' as any }
    const result = validateLeagueSettings(settings)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual({
      field: 'draftFormat',
      message: 'Draft format must be snake or linear',
      code: 'INVALID_DRAFT_FORMAT'
    })
  })
})

describe('Scoring Rule Validation', () => {
  const validScoringRule: ScoringRule = {
    actionType: 'kiss_mouth',
    points: 2,
    description: 'Kiss on mouth',
    category: 'positive'
  }

  test('validates valid scoring rule', () => {
    const result = validateScoringRule(validScoringRule)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('requires all fields', () => {
    const rule = { ...validScoringRule, actionType: '' }
    const result = validateScoringRule(rule)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual({
      field: 'scoringRule.actionType',
      message: 'scoringRule.actionType is required',
      code: 'REQUIRED'
    })
  })

  test('validates points range', () => {
    const rule = { ...validScoringRule, points: 15 }
    const result = validateScoringRule(rule)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual({
      field: 'scoringRule.points',
      message: 'scoringRule.points must be no more than 10',
      code: 'MAX_VALUE'
    })
  })

  test('validates category', () => {
    const rule = { ...validScoringRule, category: 'invalid' as any }
    const result = validateScoringRule(rule)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual({
      field: 'scoringRule.category',
      message: 'Category must be positive or negative',
      code: 'INVALID_CATEGORY'
    })
  })
})

describe('Team Validation', () => {
  const validCreateTeamInput: CreateTeamInput = {
    leagueId: 'league-123',
    name: 'Test Team'
  }

  const validTeam: Team = {
    id: 'team-123',
    leagueId: 'league-123',
    ownerId: 'user-123',
    name: 'Test Team',
    draftedContestants: ['contestant-1', 'contestant-2'],
    totalPoints: 50,
    episodeScores: [],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }

  test('validates valid create team input', () => {
    const result = validateCreateTeamInput(validCreateTeamInput)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('requires team name', () => {
    const input = { ...validCreateTeamInput, name: '' }
    const result = validateCreateTeamInput(input)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual({
      field: 'name',
      message: 'name is required',
      code: 'REQUIRED'
    })
  })

  test('validates team name characters', () => {
    const input = { ...validCreateTeamInput, name: 'Team<script>' }
    const result = validateCreateTeamInput(input)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual({
      field: 'name',
      message: 'Team name contains invalid characters',
      code: 'INVALID_CHARACTERS'
    })
  })

  test('validates valid team', () => {
    const result = validateTeam(validTeam)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('validates contestant limit', () => {
    const team = {
      ...validTeam,
      draftedContestants: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6']
    }
    const result = validateTeam(team)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual({
      field: 'draftedContestants',
      message: 'Team cannot have more than 5 contestants',
      code: 'TOO_MANY_CONTESTANTS'
    })
  })

  test('validates no duplicate contestants', () => {
    const team = {
      ...validTeam,
      draftedContestants: ['c1', 'c2', 'c1']
    }
    const result = validateTeam(team)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual({
      field: 'draftedContestants',
      message: 'Team cannot have duplicate contestants',
      code: 'DUPLICATE_CONTESTANTS'
    })
  })
})

describe('Contestant Validation', () => {
  const validCreateContestantInput: CreateContestantInput = {
    leagueId: 'league-123',
    name: 'Test Contestant',
    age: 25,
    hometown: 'New York, NY',
    occupation: 'Teacher',
    bio: 'A great contestant'
  }

  const validContestant: Contestant = {
    id: 'contestant-123',
    leagueId: 'league-123',
    name: 'Test Contestant',
    age: 25,
    hometown: 'New York, NY',
    occupation: 'Teacher',
    bio: 'A great contestant',
    profileImageUrl: 'https://example.com/image.jpg',
    isEliminated: false,
    totalPoints: 10,
    episodeScores: [],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }

  test('validates valid create contestant input', () => {
    const result = validateCreateContestantInput(validCreateContestantInput)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('requires contestant name', () => {
    const input = { ...validCreateContestantInput, name: '' }
    const result = validateCreateContestantInput(input)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual({
      field: 'name',
      message: 'name is required',
      code: 'REQUIRED'
    })
  })

  test('validates age range', () => {
    const input = { ...validCreateContestantInput, age: 15 }
    const result = validateCreateContestantInput(input)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual({
      field: 'age',
      message: 'age must be at least 18',
      code: 'MIN_VALUE'
    })
  })

  test('validates bio length', () => {
    const input = { ...validCreateContestantInput, bio: 'a'.repeat(501) }
    const result = validateCreateContestantInput(input)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual({
      field: 'bio',
      message: 'bio must be no more than 500 characters long',
      code: 'MAX_LENGTH'
    })
  })

  test('validates valid contestant', () => {
    const result = validateContestant(validContestant)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('validates profile image URL', () => {
    const contestant = { ...validContestant, profileImageUrl: 'invalid-url' }
    const result = validateContestant(contestant)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual({
      field: 'profileImageUrl',
      message: 'Invalid profile image URL',
      code: 'INVALID_URL'
    })
  })
})

describe('Draft Validation', () => {
  const validDraft: Draft = {
    id: 'draft-123',
    leagueId: 'league-123',
    status: 'not_started',
    currentPick: 0,
    draftOrder: ['team-1', 'team-2', 'team-3'],
    picks: [],
    settings: {
      pickTimeLimit: 60,
      draftFormat: 'snake',
      autoPickEnabled: false
    },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }

  test('validates valid draft', () => {
    const result = validateDraft(validDraft)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('validates draft status', () => {
    const draft = { ...validDraft, status: 'invalid' as any }
    const result = validateDraft(draft)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual({
      field: 'status',
      message: 'Invalid draft status',
      code: 'INVALID_STATUS'
    })
  })

  test('validates draft order not empty', () => {
    const draft = { ...validDraft, draftOrder: [] }
    const result = validateDraft(draft)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual({
      field: 'draftOrder',
      message: 'Draft order cannot be empty',
      code: 'EMPTY_DRAFT_ORDER'
    })
  })

  test('validates no duplicate teams in draft order', () => {
    const draft = { ...validDraft, draftOrder: ['team-1', 'team-2', 'team-1'] }
    const result = validateDraft(draft)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual({
      field: 'draftOrder',
      message: 'Draft order cannot have duplicate teams',
      code: 'DUPLICATE_TEAMS'
    })
  })
})

describe('Episode Validation', () => {
  const validEpisode: Episode = {
    id: 'episode-123',
    leagueId: 'league-123',
    episodeNumber: 1,
    airDate: '2024-01-01T00:00:00.000Z',
    isActive: false,
    scoringEvents: [],
    totalEvents: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }

  test('validates valid episode', () => {
    const result = validateEpisode(validEpisode)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('validates episode number range', () => {
    const episode = { ...validEpisode, episodeNumber: 25 }
    const result = validateEpisode(episode)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual({
      field: 'episodeNumber',
      message: 'episodeNumber must be no more than 20',
      code: 'MAX_VALUE'
    })
  })

  test('validates air date format', () => {
    const episode = { ...validEpisode, airDate: 'invalid-date' }
    const result = validateEpisode(episode)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual({
      field: 'airDate',
      message: 'Invalid air date format',
      code: 'INVALID_DATE'
    })
  })
})

describe('Scoring Validation', () => {
  const validScoreActionInput: ScoreActionInput = {
    episodeId: 'episode-123',
    contestantId: 'contestant-123',
    actionType: 'kiss_mouth',
    points: 2,
    description: 'Kiss during one-on-one'
  }

  const validScoringEvent: ScoringEvent = {
    id: 'event-123',
    episodeId: 'episode-123',
    contestantId: 'contestant-123',
    actionType: 'kiss_mouth',
    points: 2,
    timestamp: '2024-01-01T00:00:00.000Z',
    scoredBy: 'user-123',
    description: 'Kiss during one-on-one'
  }

  test('validates valid score action input', () => {
    const result = validateScoreActionInput(validScoreActionInput)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('requires all score action fields', () => {
    const input = { ...validScoreActionInput, episodeId: '' }
    const result = validateScoreActionInput(input)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual({
      field: 'episodeId',
      message: 'episodeId is required',
      code: 'REQUIRED'
    })
  })

  test('validates points range', () => {
    const input = { ...validScoreActionInput, points: 15 }
    const result = validateScoreActionInput(input)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual({
      field: 'points',
      message: 'points must be no more than 10',
      code: 'MAX_VALUE'
    })
  })

  test('validates valid scoring event', () => {
    const result = validateScoringEvent(validScoringEvent)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('validates timestamp format', () => {
    const event = { ...validScoringEvent, timestamp: 'invalid-date' }
    const result = validateScoringEvent(event)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual({
      field: 'timestamp',
      message: 'Invalid timestamp format',
      code: 'INVALID_DATE'
    })
  })
})

describe('Batch Validation', () => {
  test('validates batch of valid items', () => {
    const teams = [
      { leagueId: 'league-1', name: 'Team 1' },
      { leagueId: 'league-1', name: 'Team 2' }
    ]
    const result = validateBatch(teams, validateCreateTeamInput, 'team')
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('validates batch with errors', () => {
    const teams = [
      { leagueId: 'league-1', name: 'Team 1' },
      { leagueId: '', name: '' }
    ]
    const result = validateBatch(teams, validateCreateTeamInput, 'team')
    expect(result.isValid).toBe(false)
    expect(result.errors).toContainEqual({
      field: 'team[1].leagueId',
      message: 'leagueId is required',
      code: 'REQUIRED'
    })
    expect(result.errors).toContainEqual({
      field: 'team[1].name',
      message: 'name is required',
      code: 'REQUIRED'
    })
  })
})