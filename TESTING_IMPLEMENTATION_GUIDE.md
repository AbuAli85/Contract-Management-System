# Testing Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing a comprehensive testing strategy for the Contract Management System, including unit tests, integration tests, and end-to-end tests.

---

## 1. Testing Framework Setup

### Install Testing Dependencies

Add the following dependencies to your project:

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install --save-dev @types/jest ts-jest
npm install --save-dev cypress @cypress/code-coverage
npm install --save-dev msw  # Mock Service Worker for API mocking
```

### Configure Jest

Create a `jest.config.js` file in the project root:

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you soon)
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/dist/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
```

Create a `jest.setup.js` file:

```javascript
import '@testing-library/jest-dom'

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
```

### Configure Cypress

Create a `cypress.config.ts` file:

```typescript
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
  },
})
```

### Update package.json Scripts

Add the following scripts to your `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "cypress open",
    "test:e2e:headless": "cypress run",
    "test:all": "npm run test && npm run test:e2e:headless"
  }
}
```

---

## 2. Unit Testing Examples

### Testing Utility Functions

Create `lib/utils/__tests__/validation.test.ts`:

```typescript
import { validateEmail, validatePassword } from '../validation'

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name+tag@example.co.uk')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
    })
  })

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      expect(validatePassword('StrongP@ss123')).toBe(true)
    })

    it('should reject weak passwords', () => {
      expect(validatePassword('weak')).toBe(false)
      expect(validatePassword('12345678')).toBe(false)
    })
  })
})
```

### Testing React Components

Create `components/ui/__tests__/Button.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../button'

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>)
    expect(screen.getByText('Click me')).toBeDisabled()
  })

  it('applies variant styles correctly', () => {
    const { rerender } = render(<Button variant="destructive">Delete</Button>)
    expect(screen.getByText('Delete')).toHaveClass('destructive')

    rerender(<Button variant="outline">Cancel</Button>)
    expect(screen.getByText('Cancel')).toHaveClass('outline')
  })
})
```

### Testing Custom Hooks

Create `hooks/__tests__/useAuth.test.ts`:

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useAuth } from '../useAuth'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
    },
  })),
}))

describe('useAuth Hook', () => {
  it('should return user when authenticated', async () => {
    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.user).toBeDefined()
    })
  })

  it('should handle sign out', async () => {
    const { result } = renderHook(() => useAuth())

    await result.current.signOut()

    await waitFor(() => {
      expect(result.current.user).toBeNull()
    })
  })
})
```

---

## 3. Integration Testing

### Testing API Routes

Create `app/api/contracts/__tests__/route.test.ts`:

```typescript
import { GET, POST } from '../route'
import { NextRequest } from 'next/server'

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: [{ id: '1', contract_number: 'TEST-001' }],
          error: null,
        })),
      })),
      insert: jest.fn(() => ({
        data: { id: '1' },
        error: null,
      })),
    })),
  })),
}))

describe('/api/contracts', () => {
  describe('GET', () => {
    it('should return contracts list', async () => {
      const request = new NextRequest('http://localhost:3000/api/contracts')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.contracts).toBeDefined()
      expect(Array.isArray(data.contracts)).toBe(true)
    })

    it('should filter contracts by status', async () => {
      const request = new NextRequest('http://localhost:3000/api/contracts?status=approved')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.contracts).toBeDefined()
    })
  })

  describe('POST', () => {
    it('should create a new contract', async () => {
      const contractData = {
        contract_number: 'TEST-001',
        party_id: '123',
        status: 'draft',
      }

      const request = new NextRequest('http://localhost:3000/api/contracts', {
        method: 'POST',
        body: JSON.stringify(contractData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBeDefined()
    })

    it('should validate required fields', async () => {
      const invalidData = {
        // Missing required fields
      }

      const request = new NextRequest('http://localhost:3000/api/contracts', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })
})
```

---

## 4. End-to-End Testing with Cypress

### User Authentication Flow

Create `cypress/e2e/auth/login.cy.ts`:

```typescript
describe('User Login', () => {
  beforeEach(() => {
    cy.visit('/auth/login')
  })

  it('should display login form', () => {
    cy.get('input[name="email"]').should('be.visible')
    cy.get('input[name="password"]').should('be.visible')
    cy.get('button[type="submit"]').should('be.visible')
  })

  it('should show validation errors for invalid inputs', () => {
    cy.get('button[type="submit"]').click()
    cy.contains('Email is required').should('be.visible')
    cy.contains('Password is required').should('be.visible')
  })

  it('should login successfully with valid credentials', () => {
    cy.get('input[name="email"]').type('test@example.com')
    cy.get('input[name="password"]').type('password123')
    cy.get('button[type="submit"]').click()

    cy.url().should('include', '/dashboard')
    cy.contains('Welcome').should('be.visible')
  })

  it('should show error for invalid credentials', () => {
    cy.get('input[name="email"]').type('wrong@example.com')
    cy.get('input[name="password"]').type('wrongpassword')
    cy.get('button[type="submit"]').click()

    cy.contains('Invalid credentials').should('be.visible')
  })
})
```

### Contract Creation Flow

Create `cypress/e2e/contracts/create-contract.cy.ts`:

```typescript
describe('Contract Creation', () => {
  beforeEach(() => {
    // Login first
    cy.login('admin@example.com', 'password123')
    cy.visit('/contracts/create')
  })

  it('should create a new contract', () => {
    // Fill in contract details
    cy.get('input[name="contract_number"]').type('TEST-001')
    cy.get('select[name="party_id"]').select('Party 1')
    cy.get('select[name="contract_type"]').select('Employment')
    
    // Fill in contract terms
    cy.get('input[name="start_date"]').type('2025-01-01')
    cy.get('input[name="end_date"]').type('2025-12-31')
    cy.get('textarea[name="description"]').type('Test contract description')

    // Submit form
    cy.get('button[type="submit"]').click()

    // Verify success
    cy.contains('Contract created successfully').should('be.visible')
    cy.url().should('include', '/contracts/')
  })

  it('should validate required fields', () => {
    cy.get('button[type="submit"]').click()

    cy.contains('Contract number is required').should('be.visible')
    cy.contains('Party is required').should('be.visible')
  })
})
```

### Cypress Custom Commands

Create `cypress/support/commands.ts`:

```typescript
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      logout(): Chainable<void>
    }
  }
}

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/auth/login')
    cy.get('input[name="email"]').type(email)
    cy.get('input[name="password"]').type(password)
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/dashboard')
  })
})

Cypress.Commands.add('logout', () => {
  cy.visit('/auth/logout')
  cy.url().should('include', '/auth/login')
})

export {}
```

---

## 5. Test Coverage and Quality

### Running Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run E2E tests (interactive)
npm run test:e2e

# Run E2E tests (headless)
npm run test:e2e:headless

# Run all tests
npm run test:all
```

### Coverage Goals

Aim for the following coverage thresholds:

| Metric | Target |
|--------|--------|
| Statements | 70% |
| Branches | 70% |
| Functions | 70% |
| Lines | 70% |

### CI/CD Integration

Add testing to your GitHub Actions workflow (`.github/workflows/test.yml`):

```yaml
name: Tests

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run unit tests
        run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
      
      - name: Run E2E tests
        run: npm run test:e2e:headless
      
      - name: Upload Cypress screenshots
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: cypress-screenshots
          path: cypress/screenshots
```

---

## 6. Best Practices

### Unit Testing Best Practices

1. **Test behavior, not implementation** - Focus on what the code does, not how it does it
2. **Keep tests simple and focused** - Each test should verify one specific behavior
3. **Use descriptive test names** - Test names should clearly describe what is being tested
4. **Arrange-Act-Assert pattern** - Structure tests with setup, execution, and verification
5. **Mock external dependencies** - Isolate the code under test from external systems

### Integration Testing Best Practices

1. **Test critical user flows** - Focus on the most important user journeys
2. **Use realistic test data** - Test with data that resembles production data
3. **Test error scenarios** - Verify that errors are handled gracefully
4. **Clean up after tests** - Ensure tests don't leave behind test data

### E2E Testing Best Practices

1. **Test from the user's perspective** - Simulate real user interactions
2. **Keep tests independent** - Each test should be able to run in isolation
3. **Use page objects** - Encapsulate page-specific logic in reusable objects
4. **Handle asynchronous operations** - Use proper waits and assertions
5. **Test critical paths first** - Prioritize the most important user flows

---

## 7. Next Steps

1. **Implement the testing framework** - Set up Jest and Cypress as described above
2. **Write tests for critical paths** - Start with the most important features
3. **Integrate with CI/CD** - Add automated testing to your deployment pipeline
4. **Monitor coverage** - Track test coverage and aim to improve it over time
5. **Maintain tests** - Keep tests up to date as the codebase evolves

---

**Document Created:** December 21, 2025  
**Author:** Manus AI

