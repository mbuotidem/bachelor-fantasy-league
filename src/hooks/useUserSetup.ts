import { useEffect } from 'react';
import { Hub } from 'aws-amplify/utils';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { userService } from '../services';
import { getCurrentUserDetails } from '../lib/auth-utils';

/**
 * Hook to automatically create User records when users sign up
 */
export function useUserSetup() {
  useEffect(() => {
    const hubListener = (data: any) => {
      const { payload } = data;
      
      if (payload.event === 'signedIn') {
        // User just signed in, check if they have a User record
        createUserRecordIfNeeded();
      }
    };

    // Listen for auth events
    const unsubscribe = Hub.listen('auth', hubListener);

    return () => {
      unsubscribe();
    };
  }, []);

  const createUserRecordIfNeeded = async () => {
    try {
      const userDetails = await getCurrentUserDetails();
      const userId = userDetails.userId;

      // Check if user record already exists
      try {
        await userService.getUser(userId);
        console.log('User record already exists');
        return;
      } catch (error) {
        // User record doesn't exist, create one
      }

      // Get user attributes from Cognito
      const email = userDetails.signInDetails?.loginId || `user-${userId.substring(0, 8)}@placeholder.local`;
      
      // Get user attributes including the name
      let displayName = userDetails.username || `User ${userId.substring(0, 8)}`;
      
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
      
      await userService.createUser({
        email,
        displayName
      });

      console.log(`Created user record for ${userId}: ${displayName}`);
    } catch (error) {
      console.error('Failed to create user record:', error);
    }
  };
}