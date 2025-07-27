// Data validation functions for Bachelor Fantasy League

import { 
  User, League, Team, Contestant, Draft, Episode, ScoringEvent,
  CreateLeagueInput, CreateTeamInput, CreateContestantInput, ScoreActionInput,
  ValidationResult, ValidationError, UserPreferences, LeagueSettings,
  ScoringRule, DraftSettings
} from '../types'

// Validation utility functions
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString)
  return !isNaN(date.getTime()) && dateString === date.toISOString()
}

const createValidationError = (field: string, message: string, code: string): ValidationError => ({
  field,
  message,
  code
})

const validateRequired = (value: any, fieldName: string): ValidationError | null => {
  if (value === undefined || value === null || value === '') {
    return createValidationError(fieldName, `${fieldName} is required`, 'REQUIRED')
  }
  return null
}

const validateStringLength = (
  value: string, 
  fieldName: string, 
  min: number = 0, 
  max: number = Infinity
): ValidationError | null => {
  if (value.length < min) {
    return createValidationError(
      fieldName, 
      `${fieldName} must be at least ${min} characters long`, 
      'MIN_LENGTH'
    )
  }
  if (value.length > max) {
    return createValidationError(
      fieldName, 
      `${fieldName} must be no more than ${max} characters long`, 
      'MAX_LENGTH'
    )
  }
  return null
}

const validateNumber = (
  value: number, 
  fieldName: string, 
  min: number = -Infinity, 
  max: number = Infinity
): ValidationError | null => {
  if (typeof value !== 'number' || isNaN(value)) {
    return createValidationError(fieldName, `${fieldName} must be a valid number`, 'INVALID_NUMBER')
  }
  if (value < min) {
    return createValidationError(fieldName, `${fieldName} must be at least ${min}`, 'MIN_VALUE')
  }
  if (value > max) {
    return createValidationError(fieldName, `${fieldName} must be no more than ${max}`, 'MAX_VALUE')
  }
  return null
}

// User validation
export const validateUser = (user: Partial<User>): ValidationResult => {
  const errors: ValidationError[] = []

  // Required fields
  const requiredError = validateRequired(user.id, 'id')
  if (requiredError) errors.push(requiredError)

  const emailRequiredError = validateRequired(user.email, 'email')
  if (emailRequiredError) errors.push(emailRequiredError)

  const displayNameRequiredError = validateRequired(user.displayName, 'displayName')
  if (displayNameRequiredError) errors.push(displayNameRequiredError)

  // Email validation
  if (user.email && !isValidEmail(user.email)) {
    errors.push(createValidationError('email', 'Invalid email format', 'INVALID_EMAIL'))
  }

  // Display name length
  if (user.displayName) {
    const lengthError = validateStringLength(user.displayName, 'displayName', 1, 50)
    if (lengthError) errors.push(lengthError)
  }

  // Date validation
  if (user.createdAt && !isValidDate(user.createdAt)) {
    errors.push(createValidationError('createdAt', 'Invalid date format', 'INVALID_DATE'))
  }

  if (user.updatedAt && !isValidDate(user.updatedAt)) {
    errors.push(createValidationError('updatedAt', 'Invalid date format', 'INVALID_DATE'))
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateUserPreferences = (preferences: Partial<UserPreferences>): ValidationResult => {
  const errors: ValidationError[] = []

  if (preferences.theme && !['light', 'dark', 'auto'].includes(preferences.theme)) {
    errors.push(createValidationError('theme', 'Theme must be light, dark, or auto', 'INVALID_THEME'))
  }

  if (preferences.timezone) {
    const timezoneError = validateStringLength(preferences.timezone, 'timezone', 1, 50)
    if (timezoneError) errors.push(timezoneError)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// League validation
export const validateCreateLeagueInput = (input: CreateLeagueInput): ValidationResult => {
  const errors: ValidationError[] = []

  // Required fields
  const nameError = validateRequired(input.name, 'name')
  if (nameError) errors.push(nameError)

  const seasonError = validateRequired(input.season, 'season')
  if (seasonError) errors.push(seasonError)

  // Name length
  if (input.name) {
    const lengthError = validateStringLength(input.name, 'name', 1, 100)
    if (lengthError) errors.push(lengthError)
  }

  // Season format
  if (input.season) {
    const seasonLengthError = validateStringLength(input.season, 'season', 1, 50)
    if (seasonLengthError) errors.push(seasonLengthError)
  }

  // Settings validation
  if (input.settings) {
    const settingsValidation = validateLeagueSettings(input.settings)
    errors.push(...settingsValidation.errors)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateLeague = (league: Partial<League>): ValidationResult => {
  const errors: ValidationError[] = []

  // Required fields
  const requiredFields = ['id', 'name', 'season', 'leagueCode', 'commissionerId', 'status']
  requiredFields.forEach(field => {
    const error = validateRequired((league as any)[field], field)
    if (error) errors.push(error)
  })

  // League code format (should be 6 characters)
  if (league.leagueCode) {
    if (league.leagueCode.length !== 6) {
      errors.push(createValidationError('leagueCode', 'League code must be 6 characters', 'INVALID_CODE'))
    }
    if (!/^[A-Z0-9]+$/.test(league.leagueCode)) {
      errors.push(createValidationError('leagueCode', 'League code must contain only uppercase letters and numbers', 'INVALID_CODE_FORMAT'))
    }
  }

  // Status validation
  if (league.status && !['created', 'draft_in_progress', 'active', 'completed', 'archived'].includes(league.status)) {
    errors.push(createValidationError('status', 'Invalid league status', 'INVALID_STATUS'))
  }

  // Settings validation
  if (league.settings) {
    const settingsValidation = validateLeagueSettings(league.settings)
    errors.push(...settingsValidation.errors)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateLeagueSettings = (settings: Partial<LeagueSettings>): ValidationResult => {
  const errors: ValidationError[] = []

  // Max teams validation
  if (settings.maxTeams !== undefined) {
    const maxTeamsError = validateNumber(settings.maxTeams, 'maxTeams', 2, 20)
    if (maxTeamsError) errors.push(maxTeamsError)
  }

  // Contestant draft limit validation
  if (settings.contestantDraftLimit !== undefined) {
    const draftLimitError = validateNumber(settings.contestantDraftLimit, 'contestantDraftLimit', 1, 10)
    if (draftLimitError) errors.push(draftLimitError)
  }

  // Draft format validation
  if (settings.draftFormat && !['snake', 'linear'].includes(settings.draftFormat)) {
    errors.push(createValidationError('draftFormat', 'Draft format must be snake or linear', 'INVALID_DRAFT_FORMAT'))
  }

  // Scoring rules validation
  if (settings.scoringRules) {
    settings.scoringRules.forEach((rule, index) => {
      const ruleValidation = validateScoringRule(rule, `scoringRules[${index}]`)
      errors.push(...ruleValidation.errors)
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateScoringRule = (rule: Partial<ScoringRule>, fieldPrefix: string = 'scoringRule'): ValidationResult => {
  const errors: ValidationError[] = []

  // Required fields
  const actionTypeError = validateRequired(rule.actionType, `${fieldPrefix}.actionType`)
  if (actionTypeError) errors.push(actionTypeError)

  const pointsError = validateRequired(rule.points, `${fieldPrefix}.points`)
  if (pointsError) errors.push(pointsError)

  const descriptionError = validateRequired(rule.description, `${fieldPrefix}.description`)
  if (descriptionError) errors.push(descriptionError)

  const categoryError = validateRequired(rule.category, `${fieldPrefix}.category`)
  if (categoryError) errors.push(categoryError)

  // Points validation
  if (rule.points !== undefined) {
    const pointsNumError = validateNumber(rule.points, `${fieldPrefix}.points`, -10, 10)
    if (pointsNumError) errors.push(pointsNumError)
  }

  // Category validation
  if (rule.category && !['positive', 'negative'].includes(rule.category)) {
    errors.push(createValidationError(`${fieldPrefix}.category`, 'Category must be positive or negative', 'INVALID_CATEGORY'))
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Team validation
export const validateCreateTeamInput = (input: CreateTeamInput): ValidationResult => {
  const errors: ValidationError[] = []

  // Required fields
  const nameError = validateRequired(input.name, 'name')
  if (nameError) errors.push(nameError)

  const leagueIdError = validateRequired(input.leagueId, 'leagueId')
  if (leagueIdError) errors.push(leagueIdError)

  // Name length and format
  if (input.name) {
    const lengthError = validateStringLength(input.name, 'name', 1, 50)
    if (lengthError) errors.push(lengthError)

    // Check for inappropriate content (basic check)
    if (/[<>\"'&]/.test(input.name)) {
      errors.push(createValidationError('name', 'Team name contains invalid characters', 'INVALID_CHARACTERS'))
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateTeam = (team: Partial<Team>): ValidationResult => {
  const errors: ValidationError[] = []

  // Required fields
  const requiredFields = ['id', 'leagueId', 'ownerId', 'name']
  requiredFields.forEach(field => {
    const error = validateRequired((team as any)[field], field)
    if (error) errors.push(error)
  })

  // Drafted contestants validation
  if (team.draftedContestants) {
    if (team.draftedContestants.length > 5) {
      errors.push(createValidationError('draftedContestants', 'Team cannot have more than 5 contestants', 'TOO_MANY_CONTESTANTS'))
    }

    // Check for duplicates
    const uniqueContestants = new Set(team.draftedContestants)
    if (uniqueContestants.size !== team.draftedContestants.length) {
      errors.push(createValidationError('draftedContestants', 'Team cannot have duplicate contestants', 'DUPLICATE_CONTESTANTS'))
    }
  }

  // Total points validation
  if (team.totalPoints !== undefined) {
    const pointsError = validateNumber(team.totalPoints, 'totalPoints', -1000, 1000)
    if (pointsError) errors.push(pointsError)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Contestant validation
export const validateCreateContestantInput = (input: CreateContestantInput): ValidationResult => {
  const errors: ValidationError[] = []

  // Required fields
  const nameError = validateRequired(input.name, 'name')
  if (nameError) errors.push(nameError)

  const leagueIdError = validateRequired(input.leagueId, 'leagueId')
  if (leagueIdError) errors.push(leagueIdError)

  // Name validation
  if (input.name) {
    const lengthError = validateStringLength(input.name, 'name', 1, 100)
    if (lengthError) errors.push(lengthError)
  }

  // Age validation
  if (input.age !== undefined) {
    const ageError = validateNumber(input.age, 'age', 18, 65)
    if (ageError) errors.push(ageError)
  }

  // Optional field length validation
  if (input.hometown) {
    const hometownError = validateStringLength(input.hometown, 'hometown', 0, 100)
    if (hometownError) errors.push(hometownError)
  }

  if (input.occupation) {
    const occupationError = validateStringLength(input.occupation, 'occupation', 0, 100)
    if (occupationError) errors.push(occupationError)
  }

  if (input.bio) {
    const bioError = validateStringLength(input.bio, 'bio', 0, 500)
    if (bioError) errors.push(bioError)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateContestant = (contestant: Partial<Contestant>): ValidationResult => {
  const errors: ValidationError[] = []

  // Required fields
  const requiredFields = ['id', 'leagueId', 'name']
  requiredFields.forEach(field => {
    const error = validateRequired((contestant as any)[field], field)
    if (error) errors.push(error)
  })

  // Profile image URL validation
  if (contestant.profileImageUrl && !isValidUrl(contestant.profileImageUrl)) {
    errors.push(createValidationError('profileImageUrl', 'Invalid profile image URL', 'INVALID_URL'))
  }

  // Elimination episode validation
  if (contestant.eliminationEpisode !== undefined) {
    const episodeError = validateNumber(contestant.eliminationEpisode, 'eliminationEpisode', 1, 20)
    if (episodeError) errors.push(episodeError)
  }

  // Total points validation
  if (contestant.totalPoints !== undefined) {
    const pointsError = validateNumber(contestant.totalPoints, 'totalPoints', -1000, 1000)
    if (pointsError) errors.push(pointsError)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Draft validation
export const validateDraft = (draft: Partial<Draft>): ValidationResult => {
  const errors: ValidationError[] = []

  // Required fields
  const requiredFields = ['id', 'leagueId', 'status']
  requiredFields.forEach(field => {
    const error = validateRequired((draft as any)[field], field)
    if (error) errors.push(error)
  })

  // Status validation
  if (draft.status && !['not_started', 'in_progress', 'completed', 'paused'].includes(draft.status)) {
    errors.push(createValidationError('status', 'Invalid draft status', 'INVALID_STATUS'))
  }

  // Current pick validation
  if (draft.currentPick !== undefined) {
    const pickError = validateNumber(draft.currentPick, 'currentPick', 0, 100)
    if (pickError) errors.push(pickError)
  }

  // Draft order validation
  if (draft.draftOrder) {
    if (draft.draftOrder.length === 0) {
      errors.push(createValidationError('draftOrder', 'Draft order cannot be empty', 'EMPTY_DRAFT_ORDER'))
    }

    // Check for duplicates
    const uniqueTeams = new Set(draft.draftOrder)
    if (uniqueTeams.size !== draft.draftOrder.length) {
      errors.push(createValidationError('draftOrder', 'Draft order cannot have duplicate teams', 'DUPLICATE_TEAMS'))
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Episode validation
export const validateEpisode = (episode: Partial<Episode>): ValidationResult => {
  const errors: ValidationError[] = []

  // Required fields
  const requiredFields = ['id', 'leagueId', 'episodeNumber']
  requiredFields.forEach(field => {
    const error = validateRequired((episode as any)[field], field)
    if (error) errors.push(error)
  })

  // Episode number validation
  if (episode.episodeNumber !== undefined) {
    const episodeError = validateNumber(episode.episodeNumber, 'episodeNumber', 1, 20)
    if (episodeError) errors.push(episodeError)
  }

  // Air date validation
  if (episode.airDate && !isValidDate(episode.airDate)) {
    errors.push(createValidationError('airDate', 'Invalid air date format', 'INVALID_DATE'))
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Scoring validation
export const validateScoreActionInput = (input: ScoreActionInput): ValidationResult => {
  const errors: ValidationError[] = []

  // Required fields
  const requiredFields = ['episodeId', 'contestantId', 'actionType', 'points']
  requiredFields.forEach(field => {
    const error = validateRequired((input as any)[field], field)
    if (error) errors.push(error)
  })

  // Points validation
  if (input.points !== undefined) {
    const pointsError = validateNumber(input.points, 'points', -10, 10)
    if (pointsError) errors.push(pointsError)
  }

  // Action type validation (basic format check)
  if (input.actionType) {
    const actionTypeError = validateStringLength(input.actionType, 'actionType', 1, 50)
    if (actionTypeError) errors.push(actionTypeError)
  }

  // Description validation
  if (input.description) {
    const descriptionError = validateStringLength(input.description, 'description', 0, 200)
    if (descriptionError) errors.push(descriptionError)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateScoringEvent = (event: Partial<ScoringEvent>): ValidationResult => {
  const errors: ValidationError[] = []

  // Required fields
  const requiredFields = ['id', 'episodeId', 'contestantId', 'actionType', 'points', 'timestamp', 'scoredBy']
  requiredFields.forEach(field => {
    const error = validateRequired((event as any)[field], field)
    if (error) errors.push(error)
  })

  // Timestamp validation
  if (event.timestamp && !isValidDate(event.timestamp)) {
    errors.push(createValidationError('timestamp', 'Invalid timestamp format', 'INVALID_DATE'))
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Batch validation helper
export const validateBatch = <T>(
  items: T[], 
  validator: (item: T) => ValidationResult,
  itemName: string = 'item'
): ValidationResult => {
  const allErrors: ValidationError[] = []

  items.forEach((item, index) => {
    const result = validator(item)
    if (!result.isValid) {
      // Prefix errors with item index
      const prefixedErrors = result.errors.map(error => ({
        ...error,
        field: `${itemName}[${index}].${error.field}`
      }))
      allErrors.push(...prefixedErrors)
    }
  })

  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  }
}