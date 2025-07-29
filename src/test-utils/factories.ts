// Test data factories for Bachelor Fantasy League

import {
  User,
  UserPreferences,
  League,
  LeagueSettings,
  Team,
  Contestant,
  Draft,
  DraftPick,
  Episode,
  ScoringEvent,
  ScoringRule,
  CreateLeagueInput,
  CreateTeamInput,
  CreateContestantInput,
  ScoreActionInput
} from '../types'
import { DEFAULT_SCORING_RULES } from '../lib/database-schemas'

// Counter for generating unique IDs
let idCounter = 1
const generateId = (prefix: string) => `${prefix}-${idCounter++}`

// User factories
export const createMockUserPreferences = (overrides: Partial<UserPreferences> = {}): UserPreferences => ({
  notifications: {
    email: true,
    push: true,
    scoring: true,
    draft: true,
    ...overrides.notifications
  },
  theme: 'light',
  timezone: 'America/New_York',
  ...overrides
})

export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: generateId('user'),
  email: `test${idCounter}@example.com`,
  displayName: `Test User ${idCounter}`,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  preferences: createMockUserPreferences(),
  ...overrides
})

// League factories
export const createMockLeagueSettings = (overrides: Partial<LeagueSettings> = {}): LeagueSettings => ({
  maxTeams: 10,
  contestantDraftLimit: 2,
  draftFormat: 'snake',
  scoringRules: DEFAULT_SCORING_RULES,
  notificationSettings: {
    scoringUpdates: true,
    draftNotifications: true,
    standingsChanges: true,
    episodeReminders: true
  },
  ...overrides
})

export const createMockCreateLeagueInput = (overrides: Partial<CreateLeagueInput> = {}): CreateLeagueInput => ({
  name: `Test League ${idCounter}`,
  season: 'Grant Ellis 2025',
  settings: createMockLeagueSettings(),
  ...overrides
})

export const createMockLeague = (overrides: Partial<League> = {}): League => ({
  id: generateId('league'),
  name: `Test League ${idCounter}`,
  season: 'Grant Ellis 2025',
  leagueCode: `ABC${idCounter.toString().padStart(3, '0')}`,
  commissionerId: generateId('user'),
  settings: createMockLeagueSettings(),
  status: 'created',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
})

// Team factories
export const createMockCreateTeamInput = (overrides: Partial<CreateTeamInput> = {}): CreateTeamInput => ({
  leagueId: generateId('league'),
  name: `Test Team ${idCounter}`,
  ...overrides
})

export const createMockTeam = (overrides: Partial<Team> = {}): Team => ({
  id: generateId('team'),
  leagueId: generateId('league'),
  ownerId: generateId('user'),
  name: `Test Team ${idCounter}`,
  draftedContestants: [],
  totalPoints: 0,
  episodeScores: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
})

// Contestant factories
export const createMockCreateContestantInput = (overrides: Partial<CreateContestantInput> = {}): CreateContestantInput => ({
  leagueId: generateId('league'),
  name: `Test Contestant ${idCounter}`,
  age: 25,
  hometown: 'New York, NY',
  occupation: 'Teacher',
  bio: 'A wonderful contestant looking for love.',
  ...overrides
})

export const createMockContestant = (overrides: Partial<Contestant> = {}): Contestant => ({
  id: generateId('contestant'),
  leagueId: generateId('league'),
  name: `Test Contestant ${idCounter}`,
  age: 25,
  hometown: 'New York, NY',
  occupation: 'Teacher',
  bio: 'A wonderful contestant looking for love.',
  profileImageUrl: `https://example.com/contestant-${idCounter}.jpg`,
  isEliminated: false,
  totalPoints: 0,
  episodeScores: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
})

// Draft factories
export const createMockDraftPick = (overrides: Partial<DraftPick> = {}): DraftPick => ({
  pickNumber: 1,
  teamId: generateId('team'),
  contestantId: generateId('contestant'),
  timestamp: new Date().toISOString(),
  ...overrides
})

export const createMockDraft = (overrides: Partial<Draft> = {}): Draft => ({
  id: generateId('draft'),
  leagueId: generateId('league'),
  status: 'not_started',
  currentPick: 0,
  draftOrder: [generateId('team'), generateId('team'), generateId('team')],
  picks: [],
  settings: {
    pickTimeLimit: 60,
    draftFormat: 'snake',
    autoPickEnabled: false
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
})

// Episode factories
export const createMockEpisode = (overrides: Partial<Episode> = {}): Episode => ({
  id: generateId('episode'),
  leagueId: generateId('league'),
  episodeNumber: 1,
  airDate: new Date().toISOString(),
  isActive: false,
  scoringEvents: [],
  totalEvents: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
})

// Scoring factories
export const createMockScoreActionInput = (overrides: Partial<ScoreActionInput> = {}): ScoreActionInput => ({
  episodeId: generateId('episode'),
  contestantId: generateId('contestant'),
  actionType: 'kiss_mouth',
  points: 2,
  description: 'Kiss during one-on-one date',
  ...overrides
})

export const createMockScoringEvent = (overrides: Partial<ScoringEvent> = {}): ScoringEvent => ({
  id: generateId('event'),
  episodeId: generateId('episode'),
  contestantId: generateId('contestant'),
  actionType: 'kiss_mouth',
  points: 2,
  timestamp: new Date().toISOString(),
  scoredBy: generateId('user'),
  description: 'Kiss during one-on-one date',
  ...overrides
})

export const createMockScoringRule = (overrides: Partial<ScoringRule> = {}): ScoringRule => ({
  actionType: 'kiss_mouth',
  points: 2,
  description: 'Kiss on mouth',
  category: 'positive',
  ...overrides
})

// Batch factories for creating multiple items
export const createMockUsers = (count: number, overrides: Partial<User> = {}): User[] => {
  return Array.from({ length: count }, () => createMockUser(overrides))
}

export const createMockTeams = (count: number, leagueId: string, overrides: Partial<Team> = {}): Team[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockTeam({ 
      leagueId, 
      name: `Team ${index + 1}`,
      ...overrides 
    })
  )
}

export const createMockContestants = (count: number, leagueId: string, overrides: Partial<Contestant> = {}): Contestant[] => {
  const names = [
    'Emma', 'Olivia', 'Ava', 'Isabella', 'Sophia', 'Charlotte', 'Mia', 'Amelia',
    'Harper', 'Evelyn', 'Abigail', 'Emily', 'Elizabeth', 'Mila', 'Ella', 'Avery',
    'Sofia', 'Camila', 'Aria', 'Scarlett', 'Victoria', 'Madison', 'Luna', 'Grace'
  ]
  
  const hometowns = [
    'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ',
    'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA', 'Dallas, TX', 'San Jose, CA',
    'Austin, TX', 'Jacksonville, FL', 'Fort Worth, TX', 'Columbus, OH', 'Charlotte, NC'
  ]
  
  const occupations = [
    'Teacher', 'Nurse', 'Marketing Manager', 'Software Engineer', 'Doctor',
    'Lawyer', 'Designer', 'Consultant', 'Sales Representative', 'Accountant',
    'Physical Therapist', 'Social Worker', 'Real Estate Agent', 'Chef', 'Artist'
  ]

  return Array.from({ length: count }, (_, index) => 
    createMockContestant({ 
      leagueId,
      name: names[index % names.length],
      hometown: hometowns[index % hometowns.length],
      occupation: occupations[index % occupations.length],
      age: 22 + (index % 10),
      ...overrides 
    })
  )
}

export const createMockScoringEvents = (count: number, episodeId: string, contestantIds: string[]): ScoringEvent[] => {
  const actionTypes = [
    'kiss_mouth', 'receive_rose_weekly', 'receive_rose_one_on_one', 'interrupt_one_on_one',
    'phrase_journey', 'phrase_connection', 'crying', 'wavelength_moment'
  ]
  
  const descriptions = [
    'Kiss during one-on-one', 'Rose ceremony rose', 'Date rose', 'Interrupted conversation',
    'Mentioned journey', 'Talked about connection', 'Emotional moment', 'Perfect timing'
  ]

  return Array.from({ length: count }, (_, index) => {
    const actionType = actionTypes[index % actionTypes.length]
    const rule = DEFAULT_SCORING_RULES.find(r => r.actionType === actionType)
    
    return createMockScoringEvent({
      episodeId,
      contestantId: contestantIds[index % contestantIds.length],
      actionType,
      points: rule?.points || 1,
      description: descriptions[index % descriptions.length]
    })
  })
}

// Complete league setup factory
export const createMockCompleteLeague = (teamCount: number = 6, contestantCount: number = 20) => {
  const league = createMockLeague()
  const teams = createMockTeams(teamCount, league.id)
  const contestants = createMockContestants(contestantCount, league.id)
  const draft = createMockDraft({ 
    leagueId: league.id, 
    draftOrder: teams.map(t => t.id) 
  })
  const episode = createMockEpisode({ leagueId: league.id })
  
  return {
    league,
    teams,
    contestants,
    draft,
    episode
  }
}

// Reset counter for tests
export const resetIdCounter = () => {
  idCounter = 1
}