import { useAuthenticator } from '@aws-amplify/ui-react';

export const useAuth = () => {
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  
  return {
    user,
    signOut,
    isAuthenticated: !!user,
  };
};