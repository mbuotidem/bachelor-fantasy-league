import '@testing-library/jest-dom'

// Mock AWS Amplify
jest.mock('aws-amplify', () => ({
  Amplify: {
    configure: jest.fn(),
  },
  Auth: {
    signIn: jest.fn(),
    signOut: jest.fn(),
    signUp: jest.fn(),
    getCurrentUser: jest.fn(),
    confirmSignUp: jest.fn(),
    forgotPassword: jest.fn(),
    forgotPasswordSubmit: jest.fn(),
  },
  API: {
    graphql: jest.fn(),
  },
  Storage: {
    put: jest.fn(),
    get: jest.fn(),
    remove: jest.fn(),
  },
}))

// Mock amplify_outputs.json
jest.mock('../../amplify_outputs.json', () => ({
  auth: {
    user_pool_id: 'mock-pool-id',
    aws_region: 'us-east-1',
    user_pool_client_id: 'mock-client-id',
    identity_pool_id: 'mock-identity-pool',
  },
  data: {
    url: 'https://mock.appsync-api.us-east-1.amazonaws.com/graphql',
    aws_region: 'us-east-1',
    default_authorization_type: 'AWS_IAM',
  },
}), { virtual: true })

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})