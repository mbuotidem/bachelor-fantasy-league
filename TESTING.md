# Testing Guide

This document outlines the testing setup and practices for the Bachelor Fantasy League application.

## Testing Framework Overview

The project uses a comprehensive testing setup with multiple layers:

- **Unit Tests**: Jest + React Testing Library
- **End-to-End Tests**: Playwright
- **Test Data**: Custom factories and mocking utilities
- **Coverage**: Jest coverage reporting with thresholds

## Running Tests

### Unit Tests
```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### End-to-End Tests
```bash
# Run all e2e tests
npm run test:e2e

# Run e2e tests with UI mode
npm run test:e2e:ui

# Run e2e tests in headed mode (visible browser)
npm run test:e2e:headed
```

### All Tests
```bash
# Run both unit and e2e tests
npm run test:all
```

## Test Structure

### Directory Structure
```
bachelor-fantasy-league/
├── src/
│   ├── __tests__/          # Unit tests for components
│   └── test-utils/         # Testing utilities and factories
├── tests/
│   ├── unit/              # Additional unit tests
│   └── e2e/               # End-to-end tests
├── jest.config.js         # Jest configuration
├── jest.setup.js          # Jest setup and global mocks
├── playwright.config.ts   # Playwright configuration
└── test.config.js         # Test environment configuration
```

## Test Data Factories

The project includes comprehensive test data factories for creating mock objects:

```typescript
import { 
  createMockUser, 
  createMockLeague, 
  createMockContestant,
  createMockScoringEvent 
} from '@/test-utils/factories'

// Create a single mock user
const user = createMockUser({ email: 'test@example.com' })

// Create multiple mock contestants
const contestants = createMockContestants(5, 'league-123')
```

## Testing Utilities

### Custom Render Function
```typescript
import { render, screen } from '@/test-utils/test-helpers'

// Renders components with necessary providers
render(<MyComponent />)
```

### User Interactions
```typescript
import { setupUserEvent } from '@/test-utils/test-helpers'

const user = setupUserEvent()
await user.click(screen.getByRole('button'))
```

### Mocking Utilities
```typescript
import { mockLocalStorage, mockFetch } from '@/test-utils/test-helpers'

// Mock browser APIs
const localStorage = mockLocalStorage()

// Mock API responses
mockFetch({ data: 'test' })
```

## Configuration

### Jest Configuration
- **Environment**: jsdom for DOM testing
- **Setup**: Automatic mocking of AWS Amplify and Next.js
- **Coverage**: Thresholds set for quality assurance
- **Module Mapping**: Support for `@/` path aliases

### Playwright Configuration
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Base URL**: http://localhost:3000
- **Features**: Screenshots on failure, video recording, trace collection
- **Dev Server**: Automatically starts Next.js dev server

## Best Practices

### Unit Testing
1. Test component behavior, not implementation details
2. Use descriptive test names that explain the expected behavior
3. Mock external dependencies (APIs, services)
4. Test both happy path and error scenarios
5. Use factories for consistent test data

### End-to-End Testing
1. Test complete user workflows
2. Focus on critical user journeys
3. Test responsive design on mobile viewports
4. Verify real-time functionality works correctly
5. Test cross-browser compatibility

### Test Data
1. Use factories for consistent, realistic test data
2. Create focused test scenarios with minimal data
3. Avoid hardcoded values in tests
4. Use meaningful names for test data

## Continuous Integration

The project includes GitHub Actions workflows for:
- Running unit tests on every PR
- Running e2e tests on staging deployments
- Generating coverage reports
- Cross-browser testing

## Coverage Requirements

Current coverage thresholds:
- **Statements**: 40%
- **Branches**: 50%
- **Functions**: 30%
- **Lines**: 50%

These will be increased as the codebase grows and more tests are added.

## Debugging Tests

### Jest Tests
```bash
# Run specific test file
npm run test -- src/__tests__/page.test.tsx

# Run tests matching pattern
npm run test -- --testNamePattern="renders"

# Debug mode
npm run test -- --detectOpenHandles --forceExit
```

### Playwright Tests
```bash
# Run specific test
npm run test:e2e -- tests/e2e/example.spec.ts

# Debug mode with browser visible
npm run test:e2e:headed

# Interactive UI mode
npm run test:e2e:ui
```

## Adding New Tests

### Unit Test Example
```typescript
import { render, screen } from '@/test-utils/test-helpers'
import { createMockUser } from '@/test-utils/factories'
import UserProfile from '@/components/UserProfile'

describe('UserProfile', () => {
  it('displays user information', () => {
    const user = createMockUser({ displayName: 'John Doe' })
    render(<UserProfile user={user} />)
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })
})
```

### E2E Test Example
```typescript
import { test, expect } from '@playwright/test'

test('user can create a league', async ({ page }) => {
  await page.goto('/leagues/create')
  
  await page.fill('[data-testid="league-name"]', 'Test League')
  await page.click('[data-testid="create-button"]')
  
  await expect(page.locator('[data-testid="league-code"]')).toBeVisible()
})
```

This testing setup provides a solid foundation for maintaining code quality and ensuring the application works correctly across different scenarios and environments.