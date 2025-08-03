// DynamoDB table schemas and access patterns for Bachelor Fantasy League

export interface DynamoDBTableSchema {
  tableName: string
  partitionKey: string
  sortKey?: string
  globalSecondaryIndexes?: GlobalSecondaryIndex[]
  localSecondaryIndexes?: LocalSecondaryIndex[]
  attributes: AttributeDefinition[]
}

export interface GlobalSecondaryIndex {
  indexName: string
  partitionKey: string
  sortKey?: string
  projectionType: 'ALL' | 'KEYS_ONLY' | 'INCLUDE'
  projectedAttributes?: string[]
}

export interface LocalSecondaryIndex {
  indexName: string
  sortKey: string
  projectionType: 'ALL' | 'KEYS_ONLY' | 'INCLUDE'
  projectedAttributes?: string[]
}

export interface AttributeDefinition {
  attributeName: string
  attributeType: 'S' | 'N' | 'B'
}

// Main application table - single table design
export const MAIN_TABLE_SCHEMA: DynamoDBTableSchema = {
  tableName: 'BachelorFantasyLeague',
  partitionKey: 'PK',
  sortKey: 'SK',
  globalSecondaryIndexes: [
    {
      indexName: 'GSI1',
      partitionKey: 'GSI1PK',
      sortKey: 'GSI1SK',
      projectionType: 'ALL'
    },
    {
      indexName: 'GSI2',
      partitionKey: 'GSI2PK',
      sortKey: 'GSI2SK',
      projectionType: 'ALL'
    },
    {
      indexName: 'GSI3',
      partitionKey: 'GSI3PK',
      sortKey: 'GSI3SK',
      projectionType: 'ALL'
    }
  ],
  attributes: [
    { attributeName: 'PK', attributeType: 'S' },
    { attributeName: 'SK', attributeType: 'S' },
    { attributeName: 'GSI1PK', attributeType: 'S' },
    { attributeName: 'GSI1SK', attributeType: 'S' },
    { attributeName: 'GSI2PK', attributeType: 'S' },
    { attributeName: 'GSI2SK', attributeType: 'S' },
    { attributeName: 'GSI3PK', attributeType: 'S' },
    { attributeName: 'GSI3SK', attributeType: 'S' }
  ]
}

// Access patterns and key structures
export const ACCESS_PATTERNS = {
  // User patterns
  USER_BY_ID: {
    description: 'Get user by ID',
    table: 'Main',
    keyStructure: {
      PK: 'USER#{userId}',
      SK: 'PROFILE'
    }
  },
  
  USER_BY_EMAIL: {
    description: 'Get user by email',
    table: 'Main',
    index: 'GSI1',
    keyStructure: {
      GSI1PK: 'USER_EMAIL#{email}',
      GSI1SK: 'USER#{userId}'
    }
  },

  // League patterns
  LEAGUE_BY_ID: {
    description: 'Get league by ID',
    table: 'Main',
    keyStructure: {
      PK: 'LEAGUE#{leagueId}',
      SK: 'METADATA'
    }
  },

  LEAGUE_BY_CODE: {
    description: 'Get league by join code',
    table: 'Main',
    index: 'GSI1',
    keyStructure: {
      GSI1PK: 'LEAGUE_CODE#{leagueCode}',
      GSI1SK: 'LEAGUE#{leagueId}'
    }
  },

  LEAGUES_BY_USER: {
    description: 'Get all leagues for a user',
    table: 'Main',
    index: 'GSI2',
    keyStructure: {
      GSI2PK: 'USER#{userId}',
      GSI2SK: 'LEAGUE#{leagueId}'
    }
  },

  // Team patterns
  TEAM_BY_ID: {
    description: 'Get team by ID',
    table: 'Main',
    keyStructure: {
      PK: 'TEAM#{teamId}',
      SK: 'METADATA'
    }
  },

  TEAMS_BY_LEAGUE: {
    description: 'Get all teams in a league',
    table: 'Main',
    keyStructure: {
      PK: 'LEAGUE#{leagueId}',
      SK: 'TEAM#{teamId}'
    }
  },

  TEAMS_BY_OWNER: {
    description: 'Get all teams owned by a user',
    table: 'Main',
    index: 'GSI1',
    keyStructure: {
      GSI1PK: 'USER#{userId}',
      GSI1SK: 'TEAM#{teamId}'
    }
  },

  // Contestant patterns
  CONTESTANT_BY_ID: {
    description: 'Get contestant by ID',
    table: 'Main',
    keyStructure: {
      PK: 'CONTESTANT#{contestantId}',
      SK: 'METADATA'
    }
  },

  CONTESTANTS_BY_LEAGUE: {
    description: 'Get all contestants in a league',
    table: 'Main',
    keyStructure: {
      PK: 'LEAGUE#{leagueId}',
      SK: 'CONTESTANT#{contestantId}'
    }
  },

  CONTESTANTS_BY_POINTS: {
    description: 'Get contestants ordered by points',
    table: 'Main',
    index: 'GSI1',
    keyStructure: {
      GSI1PK: 'LEAGUE#{leagueId}#STANDINGS',
      GSI1SK: 'POINTS#{paddedPoints}#CONTESTANT#{contestantId}'
    }
  },

  // Draft patterns
  DRAFT_BY_LEAGUE: {
    description: 'Get draft for a league',
    table: 'Main',
    keyStructure: {
      PK: 'LEAGUE#{leagueId}',
      SK: 'DRAFT'
    }
  },

  DRAFT_PICKS: {
    description: 'Get all draft picks for a draft',
    table: 'Main',
    keyStructure: {
      PK: 'DRAFT#{draftId}',
      SK: 'PICK#{pickNumber}'
    }
  },

  // Episode and scoring patterns
  EPISODE_BY_ID: {
    description: 'Get episode by ID',
    table: 'Main',
    keyStructure: {
      PK: 'EPISODE#{episodeId}',
      SK: 'METADATA'
    }
  },

  EPISODES_BY_LEAGUE: {
    description: 'Get all episodes for a league',
    table: 'Main',
    keyStructure: {
      PK: 'LEAGUE#{leagueId}',
      SK: 'EPISODE#{episodeNumber}'
    }
  },

  SCORING_EVENTS_BY_EPISODE: {
    description: 'Get all scoring events for an episode',
    table: 'Main',
    keyStructure: {
      PK: 'EPISODE#{episodeId}',
      SK: 'EVENT#{timestamp}#{eventId}'
    }
  },

  SCORING_EVENTS_BY_CONTESTANT: {
    description: 'Get all scoring events for a contestant',
    table: 'Main',
    index: 'GSI1',
    keyStructure: {
      GSI1PK: 'CONTESTANT#{contestantId}',
      GSI1SK: 'EVENT#{timestamp}#{eventId}'
    }
  },

  RECENT_SCORING_EVENTS: {
    description: 'Get recent scoring events for a league',
    table: 'Main',
    index: 'GSI2',
    keyStructure: {
      GSI2PK: 'LEAGUE#{leagueId}#EVENTS',
      GSI2SK: 'TIMESTAMP#{timestamp}#{eventId}'
    }
  }
} as const

// Helper functions for key generation
export const KeyGenerators = {
  user: (userId: string) => ({
    PK: `USER#${userId}`,
    SK: 'PROFILE'
  }),

  userByEmail: (email: string, userId: string) => ({
    GSI1PK: `USER_EMAIL#${email}`,
    GSI1SK: `USER#${userId}`
  }),

  league: (leagueId: string) => ({
    PK: `LEAGUE#${leagueId}`,
    SK: 'METADATA'
  }),

  leagueByCode: (leagueCode: string, leagueId: string) => ({
    GSI1PK: `LEAGUE_CODE#${leagueCode}`,
    GSI1SK: `LEAGUE#${leagueId}`
  }),

  team: (teamId: string) => ({
    PK: `TEAM#${teamId}`,
    SK: 'METADATA'
  }),

  teamInLeague: (leagueId: string, teamId: string) => ({
    PK: `LEAGUE#${leagueId}`,
    SK: `TEAM#${teamId}`
  }),

  contestant: (contestantId: string) => ({
    PK: `CONTESTANT#${contestantId}`,
    SK: 'METADATA'
  }),

  contestantInLeague: (leagueId: string, contestantId: string) => ({
    PK: `LEAGUE#${leagueId}`,
    SK: `CONTESTANT#${contestantId}`
  }),

  contestantByPoints: (leagueId: string, points: number, contestantId: string) => ({
    GSI1PK: `LEAGUE#${leagueId}#STANDINGS`,
    GSI1SK: `POINTS#${points.toString().padStart(10, '0')}#CONTESTANT#${contestantId}`
  }),

  episode: (episodeId: string) => ({
    PK: `EPISODE#${episodeId}`,
    SK: 'METADATA'
  }),

  episodeInLeague: (leagueId: string, episodeNumber: number) => ({
    PK: `LEAGUE#${leagueId}`,
    SK: `EPISODE#${episodeNumber.toString().padStart(3, '0')}`
  }),

  scoringEvent: (episodeId: string, timestamp: string, eventId: string) => ({
    PK: `EPISODE#${episodeId}`,
    SK: `EVENT#${timestamp}#${eventId}`
  }),

  scoringEventByContestant: (contestantId: string, timestamp: string, eventId: string) => ({
    GSI1PK: `CONTESTANT#${contestantId}`,
    GSI1SK: `EVENT#${timestamp}#${eventId}`
  }),

  recentScoringEvent: (leagueId: string, timestamp: string, eventId: string) => ({
    GSI2PK: `LEAGUE#${leagueId}#EVENTS`,
    GSI2SK: `TIMESTAMP#${timestamp}#${eventId}`
  })
}

// Default scoring rules
export const DEFAULT_SCORING_RULES = [
  { actionType: 'kiss_mouth', points: 2, description: 'Kiss on mouth', category: 'positive' as const },
  { actionType: 'receive_rose_weekly', points: 3, description: 'Receive rose this week', category: 'positive' as const },
  { actionType: 'receive_rose_one_on_one', points: 2, description: 'Receive rose on 1-on-1 date', category: 'positive' as const },
  { actionType: 'receive_rose_group_date', points: 2, description: 'Receive group date rose', category: 'positive' as const },
  { actionType: 'interrupt_one_on_one', points: 1, description: 'Interrupt 1-on-1 time', category: 'positive' as const },
  { actionType: 'win_group_challenge', points: 2, description: 'Winning group date challenge', category: 'positive' as const },
  { actionType: 'wavelength_moment', points: 1, description: 'Wavelength moment', category: 'positive' as const },
  { actionType: 'phrase_right_reasons', points: 1, description: 'Say "right reasons"', category: 'positive' as const },
  { actionType: 'phrase_journey', points: 1, description: 'Say "journey"', category: 'positive' as const },
  { actionType: 'phrase_connection', points: 1, description: 'Say "connection"', category: 'positive' as const },
  { actionType: 'phrase_girls_girl', points: 1, description: 'Say "girls girl"', category: 'positive' as const },
  { actionType: 'nudity_black_box', points: 2, description: 'Nudity/black box per outfit', category: 'positive' as const },
  { actionType: 'sex_fantasy_suite', points: 4, description: 'Sex in fantasy suite or before', category: 'positive' as const },
  { actionType: 'falling_for_you', points: 2, description: 'Say "falling for you"', category: 'positive' as const },
  { actionType: 'i_love_you', points: 4, description: 'Say "I love you"', category: 'positive' as const },
  { actionType: 'sparkles', points: 1, description: 'Sparkles in any form', category: 'positive' as const },
  { actionType: 'crying', points: -1, description: 'Crying per scene', category: 'negative' as const },
  { actionType: 'medical_attention', points: -1, description: 'Requiring medical attention', category: 'negative' as const },
  { actionType: 'vomiting', points: -2, description: 'Vomiting', category: 'negative' as const },
  { actionType: 'physical_altercation', points: -3, description: 'Initiating physical altercation', category: 'negative' as const },
  { actionType: 'significant_other', points: -5, description: 'Having significant other while on show', category: 'negative' as const }
]