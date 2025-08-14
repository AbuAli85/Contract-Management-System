import { jest } from '@jest/globals';

// Mock data types
export interface MockUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export interface MockContract {
  id: string;
  contractNumber: string;
  title: string;
  status?: string;
}

export interface MockPromoter {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  status?: string;
}

// Mock data creators
export const createMockUser = (overrides: Partial<MockUser> = {}): MockUser => ({
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'user',
  ...overrides,
});

export const createMockContract = (overrides: Partial<MockContract> = {}): MockContract => ({
  id: 'contract-1',
  contractNumber: 'CON-001',
  title: 'Test Contract',
  status: 'draft',
  ...overrides,
});

export const createMockPromoter = (overrides: Partial<MockPromoter> = {}): MockPromoter => ({
  id: 1,
  first_name: 'Test',
  last_name: 'Promoter',
  email: 'promoter@example.com',
  status: 'active',
  ...overrides,
});

// Mock Supabase responses
export const createMockSupabaseResponse = <T>(data: T, error: any = null) => ({
  data,
  error,
  count: null,
});

export const createMockSupabaseError = (message: string, code = 'TEST_ERROR') => ({
  message,
  code,
  details: 'Test error details',
  hint: 'Test error hint',
});

// Mock API responses
export const createMockApiResponse = <T>(data: T, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: new Headers(),
  ok: status >= 200 && status < 300,
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
});

export const createMockApiError = (message: string, status = 400) => ({
  error: message,
  status,
  statusText: 'Bad Request',
  headers: new Headers(),
  ok: false,
  json: () => Promise.resolve({ error: message }),
  text: () => Promise.resolve(JSON.stringify({ error: message })),
});

// Mock functions
export const createMockFunction = <T extends (...args: any[]) => any>(
  returnValue?: any
) => {
  return jest.fn().mockReturnValue(returnValue);
};

export const createMockAsyncFunction = <T>(
  returnValue?: T,
  delay = 0
) => {
  return jest.fn().mockImplementation(() => {
    return new Promise<T>((resolve) => {
      setTimeout(() => resolve(returnValue as T), delay);
    });
  });
};

// Test data factories
export const createTestData = {
  users: (count: number) => Array.from({ length: count }, (_, i) => 
    createMockUser({
      id: `user-${i + 1}`,
      email: `user${i + 1}@example.com`,
      firstName: `User${i + 1}`,
      lastName: `Test${i + 1}`,
    })
  ),
  
  contracts: (count: number) => Array.from({ length: count }, (_, i) => 
    createMockContract({
      id: `contract-${i + 1}`,
      contractNumber: `CON-${String(i + 1).padStart(3, '0')}`,
      title: `Test Contract ${i + 1}`,
    })
  ),
  
  promoters: (count: number) => Array.from({ length: count }, (_, i) => 
    createMockPromoter({
      id: i + 1,
      first_name: `Promoter${i + 1}`,
      last_name: `Test${i + 1}`,
      email: `promoter${i + 1}@example.com`,
    })
  ),
};

// Test helpers
export const waitForElementToBeRemoved = (element: Element) => {
  return new Promise<void>((resolve) => {
    const observer = new MutationObserver(() => {
      if (!document.contains(element)) {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
};

export const mockConsoleError = () => {
  const originalError = console.error;
  const mockError = jest.fn();
  
  beforeAll(() => {
    console.error = mockError;
  });
  
  afterAll(() => {
    console.error = originalError;
  });
  
  return mockError;
};

export const mockConsoleWarn = () => {
  const originalWarn = console.warn;
  const mockWarn = jest.fn();
  
  beforeAll(() => {
    console.warn = mockWarn;
  });
  
  afterAll(() => {
    console.warn = originalWarn;
  });
  
  return mockWarn;
};

// Test environment setup
export const setupTestEnvironment = () => {
  beforeAll(() => {
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    // Mock IntersectionObserver
    global.IntersectionObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));

    // Mock ResizeObserver
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
};
