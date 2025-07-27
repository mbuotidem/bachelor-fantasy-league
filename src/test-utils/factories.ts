/**
 * Test data factories for creating mock data objects
 */

export interface User {
  id: string
  email: string
  displayName: string
  createdAt: string
  updatedAt: string
}

export interface League {
  id: string
  name: string
  season: string
  leagueCode: string
  commissionerId: string
  status: 'draft' | 'active' | 'completed'
  maxTeams: number
  createdAt: string
  updatedAt: string
}

export interface Team {
  id: string
  leagueId: string
  ownerId: string
  name: string
  draftedContestants: string[]
  totalPoints: number
  createdAt: string
}

export interface Contestant {
  id: string
  leagueId: string
  name: string
  age?: number
  hometown?: string
  occupation?: string
  bio?: string
  profileImageUrl?: string
  isEliminated: boolean
  eliminationEpisode?: number
  totalPoints: number
}

export interface ScoringEvent {
  id: string
  episodeId: string
  contestantId: string
  actionType: string
  points: number
  timestamp: string
  scoredBy: string
  description?: string
}

// Factory functions
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: `user-${Math.random().toString(36).slice(2, 11)}`,
  email: `test${Math.random().toString(36).slice(2, 7)}@example.com`,
  displayName: `Test User ${Math.random().toString(36).slice(2, 7)}`,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})
export const createMockLeague = (overrides: Partial<League> = {}): League => ({
  id: `league-${Math.random().toString(36).slice(2, 11)}`,
  name: `Test League ${Math.random().toString(36).slice(2, 7)}`,
  season: 'Grant Ellis - Season 29',
  leagueCode: Math.random().toString(36).slice(2, 10).toUpperCase(),
  commissionerId: `user-${Math.random().toString(36).slice(2, 11)}`,
  status: 'draft',
  maxTeams: 20,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

export const createMockTeam = (overrides: Partial<Team> = {}): Team => ({
  id: `team-${Math.random().toString(36).substr(2, 9)}`,
  leagueId: `league-${Math.random().toString(36).substr(2, 9)}`,
  ownerId: `user-${Math.random().toString(36).substr(2, 9)}`,
  name: `Team ${Math.random().toString(36).substr(2, 5)}`,
  draftedContestants: [],
  totalPoints: 0,
  createdAt: new Date().toISOString(),
  ...overrides,
})

export const createMockContestant = (overrides: Partial<Contestant> = {}): Contestant => {
  const names = ['Emma', 'Olivia', 'Ava', 'Isabella', 'Sophia', 'Charlotte', 'Mia', 'Amelia']
  const hometowns = ['Los Angeles, CA', 'New York, NY', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ']
  const occupations = ['Marketing Manager', 'Teacher', 'Nurse', 'Software Engineer', 'Designer']
  
  return {
    id: `contestant-${Math.random().toString(36).substr(2, 9)}`,
    leagueId: `league-${Math.random().toString(36).substr(2, 9)}`,
    name: names[Math.floor(Math.random() * names.length)],
    age: Math.floor(Math.random() * 10) + 23, // 23-32
    hometown: hometowns[Math.floor(Math.random() * hometowns.length)],
    occupation: occupations[Math.floor(Math.random() * occupations.length)],
    bio: 'Test contestant bio for testing purposes.',
    isEliminated: false,
    totalPoints: Math.floor(Math.random() * 50),
    ...overrides,
  }
}

export const createMockScoringEvent = (overrides: Partial<ScoringEvent> = {}): ScoringEvent => {
  const actionTypes = ['kiss_mouth', 'receive_rose', 'interrupt_time', 'crying', 'right_reasons']
  const pointValues = { kiss_mouth: 2, receive_rose: 3, interrupt_time: 1, crying: -1, right_reasons: 1 }
  const actionType = actionTypes[Math.floor(Math.random() * actionTypes.length)]
  
  return {
    id: `event-${Math.random().toString(36).substr(2, 9)}`,
    episodeId: `episode-${Math.random().toString(36).substr(2, 9)}`,
    contestantId: `contestant-${Math.random().toString(36).substr(2, 9)}`,
    actionType,
    points: pointValues[actionType as keyof typeof pointValues],
    timestamp: new Date().toISOString(),
    scoredBy: `user-${Math.random().toString(36).substr(2, 9)}`,
    description: `Test scoring event: ${actionType}`,
    ...overrides,
  }
}

// Batch creation helpers
export const createMockUsers = (count: number, overrides: Partial<User> = {}): User[] =>
  Array.from({ length: count }, () => createMockUser(overrides))

export const createMockContestants = (count: number, leagueId: string, overrides: Partial<Contestant> = {}): Contestant[] =>
  Array.from({ length: count }, () => createMockContestant({ leagueId, ...overrides }))

export const createMockTeams = (count: number, leagueId: string, overrides: Partial<Team> = {}): Team[] =>
  Array.from({ length: count }, () => createMockTeam({ leagueId, ...overrides }))

export const createMockScoringEvents = (count: number, episodeId: string, contestantId: string, overrides: Partial<ScoringEvent> = {}): ScoringEvent[] =>
  Array.from({ length: count }, () => createMockScoringEvent({ episodeId, contestantId, ...overrides }))