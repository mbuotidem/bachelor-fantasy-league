import { BaseService, APIError, ValidationError, NotFoundError, UnauthorizedError } from '../services/base-service';

// Mock the API client
jest.mock('../lib/api-client', () => ({
  client: {
    models: {
      Test: {
        create: jest.fn(),
        get: jest.fn(),
        list: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      }
    }
  }
}));

// Mock auth utilities
jest.mock('../lib/auth-utils', () => ({
  getCurrentUserId: jest.fn().mockResolvedValue('test-user-123'),
  getCurrentUserDetails: jest.fn().mockResolvedValue({
    userId: 'test-user-123',
    username: 'testuser',
    signInDetails: { loginId: 'test@example.com' }
  }),
  isAuthenticated: jest.fn().mockResolvedValue(true)
}));

// Test implementation of BaseService
class TestService extends BaseService {
  async testOperation() {
    return this.withRetry(async () => {
      return 'success';
    });
  }

  async testFailingOperation() {
    return this.withRetry(async () => {
      throw new Error('Test error');
    });
  }

  // Public method to test withRetry with custom operation
  async testWithRetry<T>(operation: () => Promise<T>, retryConfig?: any) {
    return this.withRetry(operation, retryConfig);
  }

  async testValidation(data: Record<string, any>, requiredFields: string[]) {
    this.validateRequired(data, requiredFields);
    return 'validation passed';
  }

  async testErrorTransformation(error: any) {
    return this.transformError(error);
  }

  async testHandleResponse(response: { data?: any; errors?: any[] }) {
    return this.handleResponse(response);
  }

  async testGetCurrentUserId() {
    return this.getCurrentUserId();
  }
}

describe('BaseService', () => {
  let testService: TestService;

  beforeEach(() => {
    testService = new TestService();
    jest.clearAllMocks();
  });

  describe('Error Classes', () => {
    it('should create APIError with correct properties', () => {
      const error = new APIError('Test message', 500, 'TEST_CODE');

      expect(error.message).toBe('Test message');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('APIError');
    });

    it('should create ValidationError with correct properties', () => {
      const error = new ValidationError('Validation failed', 'email');

      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.field).toBe('email');
      expect(error.name).toBe('ValidationError');
    });

    it('should create NotFoundError with correct properties', () => {
      const error = new NotFoundError('User', '123');

      expect(error.message).toBe('User with id 123 not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.name).toBe('NotFoundError');
    });

    it('should create UnauthorizedError with correct properties', () => {
      const error = new UnauthorizedError();

      expect(error.message).toBe('Unauthorized access');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.name).toBe('UnauthorizedError');
    });
  });

  describe('withRetry', () => {
    it('should return result on successful operation', async () => {
      const result = await testService.testOperation();
      expect(result).toBe('success');
    });

    it('should retry on failure and eventually succeed', async () => {
      let attempts = 0;
      const result = await testService.testWithRetry(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success after retries';
      });

      expect(result).toBe('success after retries');
      expect(attempts).toBe(3);
    });

    it('should not retry validation errors', async () => {
      let attempts = 0;

      try {
        await testService.testWithRetry(async () => {
          attempts++;
          throw new ValidationError('Invalid input');
        });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(attempts).toBe(1);
      }
    });

    it('should not retry not found errors', async () => {
      let attempts = 0;

      try {
        await testService.testWithRetry(async () => {
          attempts++;
          throw new NotFoundError('Resource');
        });
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
        expect(attempts).toBe(1);
      }
    });

    it('should not retry unauthorized errors', async () => {
      let attempts = 0;

      try {
        await testService.testWithRetry(async () => {
          attempts++;
          throw new UnauthorizedError();
        });
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedError);
        expect(attempts).toBe(1);
      }
    });

    it('should respect maxRetries configuration', async () => {
      let attempts = 0;

      try {
        await testService.testWithRetry(async () => {
          attempts++;
          throw new Error('Always fails');
        }, { maxRetries: 2 });
      } catch (error) {
        expect(attempts).toBe(3); // Initial attempt + 2 retries
      }
    });
  });

  describe('validateRequired', () => {
    it('should pass validation when all required fields are present', async () => {
      const data = { name: 'John', email: 'john@example.com' };
      const result = await testService.testValidation(data, ['name', 'email']);
      expect(result).toBe('validation passed');
    });

    it('should throw ValidationError when required field is missing', async () => {
      const data = { name: 'John' };

      await expect(testService.testValidation(data, ['name', 'email']))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when required field is empty string', async () => {
      const data = { name: 'John', email: '' };

      await expect(testService.testValidation(data, ['name', 'email']))
        .rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when required field is null', async () => {
      const data = { name: 'John', email: null };

      await expect(testService.testValidation(data, ['name', 'email']))
        .rejects.toThrow(ValidationError);
    });

    it('should include missing fields in error message', async () => {
      const data = { name: 'John' };

      try {
        await testService.testValidation(data, ['name', 'email', 'age']);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain('email, age');
      }
    });
  });

  describe('transformError', () => {
    it('should return APIError as-is', async () => {
      const originalError = new APIError('Original error');
      const result = await testService.testErrorTransformation(originalError);
      expect(result).toBe(originalError);
    });

    it('should transform GraphQL unauthorized error', async () => {
      const graphqlError = {
        errors: [{ errorType: 'Unauthorized', message: 'Access denied' }]
      };

      const result = await testService.testErrorTransformation(graphqlError);
      expect(result).toBeInstanceOf(UnauthorizedError);
      expect(result.message).toBe('Access denied');
    });

    it('should transform GraphQL conditional check failed error', async () => {
      const graphqlError = {
        errors: [{ errorType: 'DynamoDB:ConditionalCheckFailedException' }]
      };

      const result = await testService.testErrorTransformation(graphqlError);
      expect(result).toBeInstanceOf(NotFoundError);
    });

    it('should transform network error', async () => {
      const networkError = { name: 'NetworkError', message: 'Network failed' };

      const result = await testService.testErrorTransformation(networkError);
      expect(result).toBeInstanceOf(APIError);
      expect(result.code).toBe('NETWORK_ERROR');
    });

    it('should transform timeout error', async () => {
      const timeoutError = { name: 'TimeoutError', message: 'Request timed out' };

      const result = await testService.testErrorTransformation(timeoutError);
      expect(result).toBeInstanceOf(APIError);
      expect(result.code).toBe('TIMEOUT');
    });

    it('should transform unknown error', async () => {
      const unknownError = new Error('Unknown error');

      const result = await testService.testErrorTransformation(unknownError);
      expect(result).toBeInstanceOf(APIError);
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('Unknown error');
    });
  });

  describe('handleResponse', () => {
    it('should return data when response is successful', async () => {
      const response = { data: { id: '123', name: 'Test' } };
      const result = await testService.testHandleResponse(response);
      expect(result).toEqual({ id: '123', name: 'Test' });
    });

    it('should throw APIError when response has errors', async () => {
      const response = {
        errors: [{ message: 'GraphQL error', errorType: 'ValidationError' }]
      };

      await expect(testService.testHandleResponse(response))
        .rejects.toThrow(APIError);
    });

    it('should throw APIError when response has no data', async () => {
      const response = {};

      await expect(testService.testHandleResponse(response))
        .rejects.toThrow(APIError);
    });
  });

  describe('getCurrentUserId', () => {
    it('should return current user ID from auth', async () => {
      const userId = await testService.testGetCurrentUserId();
      expect(userId).toBe('test-user-123');
    });

    it('should throw UnauthorizedError when user is not authenticated', async () => {
      const { getCurrentUserId } = require('../lib/auth-utils');
      getCurrentUserId.mockRejectedValueOnce(new Error('User not authenticated'));

      await expect(testService.testGetCurrentUserId())
        .rejects.toThrow('User must be authenticated to perform this action');
    });
  });
});