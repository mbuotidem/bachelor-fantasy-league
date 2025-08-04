# Authentication Integration Guide

This guide explains how the service layer integrates with AWS Cognito authentication to automatically handle user context.

## Overview

All services now automatically retrieve the current authenticated user's ID from AWS Cognito when performing operations that require user ownership or tracking.

## Key Features

### Automatic User ID Resolution
- Services automatically get the current user ID from Cognito
- No need to manually pass user IDs in most cases
- Proper error handling for unauthenticated users

### Authentication Utilities

```typescript
import { getCurrentUserId, getCurrentUserDetails, isAuthenticated } from '../lib/auth-utils';

// Get current user ID
const userId = await getCurrentUserId();

// Get full user details
const userDetails = await getCurrentUserDetails();
// Returns: { userId, username, signInDetails }

// Check authentication status
const authenticated = await isAuthenticated();
```

## Service Usage Examples

### Creating a League
```typescript
import { leagueService } from '../services';

// The service automatically sets commissionerId to current user
const league = await leagueService.createLeague({
  name: 'My Fantasy League',
  season: 'Season 29'
});
// league.commissionerId will be the current authenticated user's ID
```

### Creating a Team
```typescript
import { teamService } from '../services';

// Option 1: Let service use current authenticated user as owner
const team = await teamService.createTeam({
  leagueId: 'league-123',
  name: 'My Team'
});

// Option 2: Explicitly specify owner (useful for admin operations)
const adminTeam = await teamService.createTeam({
  leagueId: 'league-123',
  name: 'Admin Team',
  ownerId: 'specific-user-id'
});
```

### Joining a League
```typescript
import { leagueService } from '../services';

// Join a league and automatically create a team
const result = await leagueService.joinLeague({
  leagueCode: 'ABC123',
  teamName: 'My Fantasy Team'
});

// result.league contains the league details
// result.teamId contains the newly created team's ID
console.log(`Joined league: ${result.league.name}`);
console.log(`Created team with ID: ${result.teamId}`);
```

### Scoring Actions
```typescript
import { scoringService } from '../services';

// The service automatically sets scoredBy to current user
const scoringEvent = await scoringService.scoreAction({
  episodeId: 'episode-123',
  contestantId: 'contestant-456',
  actionType: 'kiss_mouth',
  points: 2,
  description: 'Kiss during one-on-one date'
});
// scoringEvent.scoredBy will be the current authenticated user's ID
```

## Error Handling

### Authentication Errors
```typescript
import { UnauthorizedError } from '../services';

try {
  const league = await leagueService.createLeague({
    name: 'My League',
    season: 'Season 29'
  });
} catch (error) {
  if (error instanceof UnauthorizedError) {
    // User is not authenticated
    console.error('Please sign in to create a league');
    // Redirect to login or show auth UI
  }
}
```

### Checking Authentication Before Operations
```typescript
import { isAuthenticated } from '../lib/auth-utils';

const handleCreateLeague = async () => {
  if (!(await isAuthenticated())) {
    // Show authentication UI
    return;
  }
  
  // Proceed with league creation
  const league = await leagueService.createLeague({
    name: 'My League',
    season: 'Season 29'
  });
};
```

## Testing

### Mocking Authentication in Tests
```typescript
// Mock auth utilities for testing
jest.mock('../lib/auth-utils', () => ({
  getCurrentUserId: jest.fn().mockResolvedValue('test-user-123'),
  getCurrentUserDetails: jest.fn().mockResolvedValue({
    userId: 'test-user-123',
    username: 'testuser',
    signInDetails: { loginId: 'test@example.com' }
  }),
  isAuthenticated: jest.fn().mockResolvedValue(true)
}));
```

### Testing Authentication Failures
```typescript
it('should handle authentication failure', async () => {
  const { getCurrentUserId } = require('../lib/auth-utils');
  getCurrentUserId.mockRejectedValueOnce(new Error('User not authenticated'));

  await expect(leagueService.createLeague({
    name: 'Test League',
    season: 'Season 29'
  })).rejects.toThrow('User must be authenticated to perform this action');
});
```

## Implementation Details

### BaseService Integration
All services extend `BaseService` which provides the `getCurrentUserId()` method:

```typescript
// In BaseService
protected async getCurrentUserId(): Promise<string> {
  try {
    return await getCurrentUserId();
  } catch (error) {
    throw new UnauthorizedError('User must be authenticated to perform this action');
  }
}
```

### Service Method Pattern
Services follow this pattern for operations requiring user context:

```typescript
async createResource(input: CreateResourceInput): Promise<Resource> {
  // Get current user ID (throws UnauthorizedError if not authenticated)
  const userId = await this.getCurrentUserId();
  
  // Use userId in the operation
  const createData = {
    ...input,
    ownerId: userId, // or commissionerId, scoredBy, etc.
  };
  
  // Proceed with API call
  return this.withRetry(async () => {
    const response = await this.client.models.Resource.create(createData);
    return this.transformResourceModel(response.data);
  });
}
```

## Security Considerations

1. **Server-side Validation**: While services automatically set user IDs, server-side authorization rules in the GraphQL schema ensure users can only access/modify their own resources.

2. **Token Refresh**: AWS Amplify automatically handles token refresh, so services don't need to worry about expired tokens.

3. **Offline Handling**: Services will throw `UnauthorizedError` when offline or when tokens are invalid.

## Migration from Hardcoded IDs

If you have existing code with hardcoded user IDs, here's how to migrate:

### Before (Hardcoded)
```typescript
const createData = {
  leagueId: input.leagueId,
  ownerId: 'current-user-id', // ❌ Hardcoded
  name: input.name,
};
```

### After (Authentication-aware)
```typescript
const ownerId = await this.getCurrentUserId(); // ✅ Dynamic
const createData = {
  leagueId: input.leagueId,
  ownerId,
  name: input.name,
};
```

This ensures proper user context and security throughout the application.