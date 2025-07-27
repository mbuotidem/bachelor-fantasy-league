/**
 * Test configuration for different environments
 */

const config = {
  // Test environment settings
  testEnvironment: process.env.NODE_ENV || 'test',
  
  // API endpoints for testing
  apiEndpoints: {
    development: 'http://localhost:3000/api',
    test: 'http://localhost:3000/api',
    staging: process.env.STAGING_API_URL || 'https://staging-api.example.com',
    production: process.env.PRODUCTION_API_URL || 'https://api.example.com',
  },
  
  // Test database settings
  database: {
    test: {
      region: 'us-east-1',
      tableName: 'bachelor-fantasy-test',
    },
  },
  
  // Authentication settings for testing
  auth: {
    testUser: {
      email: 'test@example.com',
      password: 'TestPassword123!',
    },
    mockTokens: {
      accessToken: 'mock-access-token',
      idToken: 'mock-id-token',
      refreshToken: 'mock-refresh-token',
    },
  },
  
  // Test timeouts
  timeouts: {
    unit: 5000,
    integration: 10000,
    e2e: 30000,
  },
  
  // Feature flags for testing
  features: {
    enableRealTimeUpdates: true,
    enablePushNotifications: false,
    enableAnalytics: false,
  },
}

module.exports = config