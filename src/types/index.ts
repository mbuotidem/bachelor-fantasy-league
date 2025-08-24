// Core data model interfaces for Bachelor Fantasy League

export interface User {
  id: string
  email: string
  displayName: string
  createdAt: string
  updatedAt: string
  preferences: UserPreferences
}

export interface UserPreferences {
  notifications: {
    email: boolean
    push: boolean
    scoring: boolean
    draft: boolean
  }
  theme: 'light' | 'dark' | 'auto'
  timezone: string
}

export interface League {
  id: string
  name: string
  season: string
  leagueCode: string
  commissionerId: string
  settings: LeagueSettings
  status: LeagueStatus
  createdAt: string
  updatedAt: string
}

export interface LeagueSettings {
  maxTeams: number
  contestantDraftLimit: number
  draftFormat: 'snake' | 'linear'
  scoringRules: ScoringRule[]
  notificationSettings: NotificationSettings
}

export interface ScoringRule {
  actionType: string
  points: number
  description: string
  category: 'positive' | 'negative'
}

export interface NotificationSettings {
  scoringUpdates: boolean
  draftNotifications: boolean
  standingsChanges: boolean
  episodeReminders: boolean
}

export type LeagueStatus = 'created' | 'draft_in_progress' | 'active' | 'completed' | 'archived'

export interface Team {
  id: string
  leagueId: string
  ownerId: string
  name: string
  draftedContestants: string[]
  totalPoints: number
  episodeScores: EpisodeScore[]
  createdAt: string
  updatedAt: string
}

export interface EpisodeScore {
  episodeId: string
  episodeNumber: number
  points: number
  events: ScoringEvent[]
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
  episodeScores: EpisodeScore[]
  createdAt: string
  updatedAt: string
}

export interface Draft {
  id: string
  leagueId: string
  status: DraftStatus
  currentPick: number
  draftOrder: string[]
  picks: DraftPick[]
  settings: DraftSettings
  createdAt: string
  updatedAt: string
}

export type DraftStatus = 'not_started' | 'in_progress' | 'completed'

export interface DraftPick {
  pickNumber: number
  teamId: string
  contestantId: string
  timestamp: string
}

export interface DraftSettings {
  pickTimeLimit: number // seconds
  draftFormat: 'snake' | 'linear'
  autoPickEnabled: boolean
}

export interface Episode {
  id: string
  leagueId: string
  episodeNumber: number
  airDate: string
  isActive: boolean
  scoringEvents: ScoringEvent[]
  totalEvents: number
  createdAt: string
  updatedAt: string
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

// Input types for creating/updating entities
export interface CreateLeagueInput {
  name: string
  season: string
  settings?: Partial<LeagueSettings>
}

export interface CreateTeamInput {
  leagueId: string
  name: string
  ownerId?: string // Optional - if not provided, will use current authenticated user
}

export interface CreateContestantInput {
  leagueId: string
  name: string
  age?: number
  hometown?: string
  occupation?: string
  bio?: string
  profileImageUrl?: string
}

export interface ScoreActionInput {
  episodeId: string
  contestantId: string
  actionType: string
  points: number
  description?: string
}

export interface UpdateUserPreferencesInput {
  notifications?: Partial<UserPreferences['notifications']>
  theme?: UserPreferences['theme']
  timezone?: string
}

// Response types for API operations
export interface AuthResult {
  user: User
  accessToken: string
  // Note: Refresh tokens are handled separately for security
  // They should be stored in httpOnly cookies or secure storage
}

export interface DraftUpdate {
  type: 'pick_made' | 'turn_changed' | 'draft_completed'
  pick?: DraftPick
  currentTeamId?: string
  timeRemaining?: number
}

export interface ScoringUpdate {
  type: 'score_added' | 'score_undone' | 'episode_ended'
  event?: ScoringEvent
  contestantId?: string
  newTotal?: number
}

// Standings and analytics types
export interface TeamStanding {
  teamId: string
  teamName: string
  ownerName: string
  totalPoints: number
  rank: number
  previousRank?: number
  episodePoints: number
  contestants: ContestantSummary[]
}

export interface ContestantStanding {
  contestantId: string
  name: string
  totalPoints: number
  rank: number
  previousRank?: number
  episodePoints: number
  isEliminated: boolean
  draftedByTeams: string[]
}

export interface ContestantSummary {
  id: string
  name: string
  points: number
  isEliminated: boolean
}

export interface TeamDetail {
  team: Team
  owner: User
  contestants: Contestant[]
  standings: TeamStanding
  episodeHistory: EpisodeScore[]
}

export interface HistoryFilters {
  startDate?: string
  endDate?: string
  episodeNumbers?: number[]
  contestantIds?: string[]
  teamIds?: string[]
}

export interface HistoricalData {
  episodes: Episode[]
  teamPerformance: TeamStanding[]
  contestantPerformance: ContestantStanding[]
  totalEvents: number
}

// Validation error types
export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}