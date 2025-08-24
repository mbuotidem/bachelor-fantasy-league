import { BaseService } from './base-service';
import { UserService } from './user-service';
import { TeamService } from './team-service';
import { getCurrentUserDetails } from '../lib/auth-utils';
import { fetchUserAttributes } from 'aws-amplify/auth';

/**
 * Service to help migrate existing teams to have proper user records
 */
export class UserMigrationService extends BaseService {
  private userService: UserService;
  private teamService: TeamService;

  constructor() {
    super();
    this.userService = new UserService();
    this.teamService = new TeamService();
  }

  /**
   * Create user records for all team owners that don't have them
   * This is useful for migrating existing data
   */
  async createMissingUserRecords(leagueId: string): Promise<void> {
    try {
      console.log(`Starting user migration for league ${leagueId}...`);
      
      // Get all teams in the league
      const teams = await this.teamService.getTeamsByLeague(leagueId);
      const uniqueOwnerIds = [...new Set(teams.map(team => team.ownerId))];
      
      let created = 0;
      let existing = 0;

      for (const ownerId of uniqueOwnerIds) {
        try {
          // Check if user already exists
          await this.userService.getUser(ownerId);
          existing++;
          console.log(`User ${ownerId} already exists`);
        } catch (error) {
          // User doesn't exist, create one
          try {
            const currentUserId = await this.getCurrentUserId();
            let email = `user-${ownerId.substring(0, 8)}@placeholder.local`;
            let displayName = `Team Owner (${ownerId.substring(0, 8)})`;

            // If this is the current user, try to get better details
            if (ownerId === currentUserId) {
              try {
                const userDetails = await getCurrentUserDetails();
                email = userDetails.signInDetails?.loginId || email;
                displayName = userDetails.username || displayName;
                
                // Try to get name from Cognito attributes
                try {
                  const attributes = await fetchUserAttributes();
                  const givenName = attributes.given_name;
                  const familyName = attributes.family_name;
                  
                  if (givenName) {
                    displayName = familyName ? `${givenName} ${familyName}` : givenName;
                  }
                } catch (attributeError) {
                  console.warn('Could not fetch user attributes:', attributeError);
                }
              } catch (authError) {
                console.warn('Could not get current user details:', authError);
              }
            }

            await this.userService.createUser({
              email,
              displayName
            });

            created++;
            console.log(`Created user record for ${ownerId}: ${displayName}`);
          } catch (createError) {
            console.error(`Failed to create user record for ${ownerId}:`, createError);
          }
        }
      }

      console.log(`User migration complete. Created: ${created}, Existing: ${existing}`);
    } catch (error) {
      console.error('User migration failed:', error);
      throw error;
    }
  }

  /**
   * Create a user record for the current authenticated user
   * Useful for ensuring the current user has a proper record
   */
  async createCurrentUserRecord(): Promise<void> {
    try {
      const currentUserId = await this.getCurrentUserId();
      
      // Check if user already exists
      try {
        const existingUser = await this.userService.getUser(currentUserId);
        console.log(`Current user already exists: ${existingUser.displayName}`);
        return;
      } catch (error) {
        // User doesn't exist, create one
      }

      const userDetails = await getCurrentUserDetails();
      const email = userDetails.signInDetails?.loginId || `${userDetails.username}@placeholder.local`;
      let displayName = userDetails.username || `User ${currentUserId.substring(0, 8)}`;
      
      // Try to get name from Cognito attributes
      try {
        const attributes = await fetchUserAttributes();
        const givenName = attributes.given_name;
        const familyName = attributes.family_name;
        
        if (givenName) {
          displayName = familyName ? `${givenName} ${familyName}` : givenName;
        }
      } catch (attributeError) {
        console.warn('Could not fetch user attributes:', attributeError);
      }

      await this.userService.createUser({
        email,
        displayName
      });

      console.log(`Created current user record: ${displayName}`);
    } catch (error) {
      console.error('Failed to create current user record:', error);
      throw error;
    }
  }
}