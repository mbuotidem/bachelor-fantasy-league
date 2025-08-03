import { client, type APIClient } from '../lib/api-client';

// Custom error types for better error handling
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class ValidationError extends APIError {
  constructor(message: string, public field?: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends APIError {
  constructor(resource: string, id?: string) {
    super(`${resource}${id ? ` with id ${id}` : ''} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends APIError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

// Base service class with common functionality
export abstract class BaseService {
  protected client: APIClient;
  protected retryConfig: RetryConfig;

  constructor(retryConfig: Partial<RetryConfig> = {}) {
    this.client = client;
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  // Retry logic with exponential backoff
  protected async withRetry<T>(
    operation: () => Promise<T>,
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<T> {
    const config = { ...this.retryConfig, ...retryConfig };
    let lastError: Error;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain error types
        if (this.shouldNotRetry(error)) {
          throw this.transformError(error);
        }

        // Don't retry on the last attempt
        if (attempt === config.maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
          config.maxDelay
        );

        // Add jitter to prevent thundering herd
        const jitteredDelay = delay + Math.random() * 1000;

        await this.sleep(jitteredDelay);
      }
    }

    throw this.transformError(lastError!);
  }

  // Determine if an error should not be retried
  private shouldNotRetry(error: unknown): boolean {
    // Don't retry validation errors, not found errors, or unauthorized errors
    if (error && typeof error === 'object' && 'name' in error) {
      const errorName = (error as { name: string }).name;
      if (errorName === 'ValidationError' || 
          errorName === 'NotFoundError' || 
          errorName === 'UnauthorizedError') {
        return true;
      }
    }

    // Don't retry 4xx errors (client errors)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const statusCode = (error as { statusCode: number }).statusCode;
      if (statusCode >= 400 && statusCode < 500) {
        return true;
      }
    }

    return false;
  }

  // Transform GraphQL/Amplify errors into our custom error types
  protected transformError(error: unknown): APIError {
    if (error instanceof APIError) {
      return error;
    }

    // Handle GraphQL errors
    if (error && typeof error === 'object' && 'errors' in error && Array.isArray(error.errors)) {
      const graphqlError = error.errors[0];
      
      if (graphqlError?.errorType === 'Unauthorized') {
        return new UnauthorizedError(graphqlError.message);
      }
      
      if (graphqlError?.errorType === 'DynamoDB:ConditionalCheckFailedException') {
        return new NotFoundError('Resource');
      }

      return new APIError(
        graphqlError?.message || 'GraphQL operation failed',
        500,
        graphqlError?.errorType,
        error
      );
    }

    // Handle network errors
    if (error && typeof error === 'object') {
      const errorObj = error as Record<string, unknown>;
      
      if (errorObj.name === 'NetworkError' || errorObj.code === 'NETWORK_ERROR') {
        return new APIError(
          'Network error occurred. Please check your connection.',
          0,
          'NETWORK_ERROR',
          error
        );
      }

      // Handle timeout errors
      if (errorObj.name === 'TimeoutError' || errorObj.code === 'TIMEOUT') {
        return new APIError(
          'Request timed out. Please try again.',
          408,
          'TIMEOUT',
          error
        );
      }

      // Default error transformation
      return new APIError(
        (errorObj.message as string) || 'An unexpected error occurred',
        (errorObj.statusCode as number) || 500,
        (errorObj.code as string) || 'UNKNOWN_ERROR',
        error
      );
    }

    // Fallback for non-object errors
    return new APIError(
      'An unexpected error occurred',
      500,
      'UNKNOWN_ERROR',
      error
    );
  }

  // Utility method for sleeping
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Helper method to handle common GraphQL response patterns
  protected handleResponse<T>(response: { data?: T; errors?: unknown[] }): T {
    if (response.errors && response.errors.length > 0) {
      const error = response.errors[0] as { message?: string; errorType?: string };
      throw new APIError(
        error.message || 'GraphQL operation failed',
        500,
        error.errorType,
        response.errors
      );
    }

    if (!response.data) {
      throw new APIError('No data returned from API', 500, 'NO_DATA');
    }

    return response.data;
  }

  // Helper method to validate required fields
  protected validateRequired(data: Record<string, unknown> | object, requiredFields: string[]): void {
    const missingFields = requiredFields.filter(field => {
      const value = (data as Record<string, unknown>)[field];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      throw new ValidationError(
        `Missing required fields: ${missingFields.join(', ')}`,
        missingFields[0]
      );
    }
  }
}