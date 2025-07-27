'use client';

import '../lib/amplify'; // This will configure Amplify when imported

export function AmplifyProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}