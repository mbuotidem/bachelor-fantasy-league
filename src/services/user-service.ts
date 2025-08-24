import { BaseService, ValidationError, NotFoundError } from './base-service';
import type { Schema } from '../lib/api-client';
import type { User, UserPreferences } from '../types';

// Type definitions for GraphQL operations
type UserModel = Schema['User']['type'];
type CreateUserData = Schema['User']['createType'];
type UpdateUserData = Schema['User']['updateType'];

export interface CreateUserInput {
  email: string;
  displayName: string;
  preferences?: UserPreferences;
}

export interface UpdateUserInput {
  userId: string;
  email?: string;
  displayName?: string;
  preferences?: UserPreferences;
}

export class UserService extends BaseService {

  // Create a new user
  async createUser(input: CreateUserInput): Promise<User> {
    this.validateRequired(input, ['email', 'displayName']);

    const defaultPreferences: UserPreferences = {
      notifications: {
        email: true,
        push: true,
        scoring: true,
        draft: true
      },
      theme: 'light',
      timezone: 'America/New_York'
    };

    const createData: CreateUserData = {
      email: input.email,
      displayName: input.displayName,
      preferences: JSON.stringify(input.preferences || defaultPreferences),
    };

    return this.withRetry(async () => {
      const response = await this.client.models.User.create(createData);

      if (!response.data) {
        throw new Error('Failed to create user');
      }

      return this.transformUserModel(response.data);
    });
  }

  // Get a user by ID
  async getUser(userId: string): Promise<User> {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    return this.withRetry(async () => {
      const response = await this.client.models.User.get({ id: userId });

      if (!response.data) {
        throw new NotFoundError('User', userId);
      }

      return this.transformUserModel(response.data);
    });
  }

  // Get current authenticated user
  async getCurrentUser(): Promise<User> {
    const currentUserId = await this.getCurrentUserId();
    return this.getUser(currentUserId);
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<User> {
    if (!email) {
      throw new ValidationError('Email is required');
    }

    return this.withRetry(async () => {
      const response = await this.client.models.User.list({
        filter: { email: { eq: email } }
      });

      if (!response.data || response.data.length === 0) {
        throw new NotFoundError('User with email', email);
      }

      return this.transformUserModel(response.data[0]);
    });
  }

  // Update user information
  async updateUser(input: UpdateUserInput): Promise<User> {
    this.validateRequired(input, ['userId']);

    const updateData: UpdateUserData = {
      id: input.userId,
      ...(input.email && { email: input.email }),
      ...(input.displayName && { displayName: input.displayName }),
      ...(input.preferences && { preferences: JSON.stringify(input.preferences) }),
    };

    return this.withRetry(async () => {
      const response = await this.client.models.User.update(updateData);

      if (!response.data) {
        throw new NotFoundError('User', input.userId);
      }

      return this.transformUserModel(response.data);
    });
  }

  // Update user preferences
  async updateUserPreferences(userId: string, preferences: UserPreferences): Promise<User> {
    return this.updateUser({
      userId,
      preferences
    });
  }

  // Delete a user
  async deleteUser(userId: string): Promise<void> {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    return this.withRetry(async () => {
      const response = await this.client.models.User.delete({ id: userId });

      if (!response.data) {
        throw new NotFoundError('User', userId);
      }
    });
  }

  // Check if user exists
  async userExists(userId: string): Promise<boolean> {
    try {
      await this.getUser(userId);
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return false;
      }
      throw error;
    }
  }

  // Get or create user (useful for auth integration)
  async getOrCreateUser(input: CreateUserInput): Promise<User> {
    try {
      return await this.getUserByEmail(input.email);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return await this.createUser(input);
      }
      throw error;
    }
  }

  // Private helper methods

  private transformUserModel(model: UserModel): User {
    let preferences: UserPreferences;

    try {
      preferences = model.preferences ?
        JSON.parse(model.preferences as string) : {
          notifications: {
            email: true,
            push: true,
            scoring: true,
            draft: true
          },
          theme: 'light',
          timezone: 'America/New_York'
        };
    } catch (error) {
      console.warn('Failed to parse user preferences:', error);
      preferences = {
        notifications: {
          email: true,
          push: true,
          scoring: true,
          draft: true
        },
        theme: 'light',
        timezone: 'America/New_York'
      };
    }

    return {
      id: model.id,
      email: model.email,
      displayName: model.displayName,
      preferences,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}