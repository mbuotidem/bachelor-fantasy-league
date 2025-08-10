import { getCurrentUser } from 'aws-amplify/auth';

/**
 * Get the current authenticated user's ID from Cognito
 * @returns Promise<string> - The user's unique identifier
 * @throws Error if user is not authenticated
 */
export async function getCurrentUserId(): Promise<string> {
  try {
    const user = await getCurrentUser();
    return user.userId;
  } catch (error) {
    console.debug('Failed to get current user ID:', error);
    throw new Error('User not authenticated');
  }
}

/**
 * Get the current authenticated user's details from Cognito
 * @returns Promise with user details including userId, username, and signInDetails
 */
export async function getCurrentUserDetails() {
  try {
    const user = await getCurrentUser();
    return {
      userId: user.userId,
      username: user.username,
      signInDetails: user.signInDetails,
    };
  } catch (error) {
    console.debug('Failed to get current user details:', error);
    throw new Error('User not authenticated');
  }
}

/**
 * Check if a user is currently authenticated
 * @returns Promise<boolean>
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    await getCurrentUser();
    return true;
  } catch (error) {
    console.debug('User is not authenticated:', error);
    return false;
  }
}