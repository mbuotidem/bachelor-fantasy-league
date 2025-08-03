'use client';

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

// Generate the GraphQL client with proper typing
export const client = generateClient<Schema>();

// Export the client type for use in services
export type APIClient = typeof client;

// Re-export the Schema type for convenience
export type { Schema };