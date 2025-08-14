// Jest setup file for comprehensive testing
require('@testing-library/jest-dom');
const React = require('react');

// Mock environment variables
process.env.RBAC_ENFORCEMENT = 'dry-run';
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock next-intl
jest.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key) => key,
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

// Create a proper Supabase query builder mock
const createSupabaseQueryBuilder = () => {
  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    and: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    count: jest.fn().mockResolvedValue({ data: null, error: null, count: 0 }),
  };

  // Mock the final execution methods
  mockQueryBuilder.single.mockResolvedValue({ data: null, error: null });
  mockQueryBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });
  mockQueryBuilder.count.mockResolvedValue({ data: null, error: null, count: 0 });

  return mockQueryBuilder;
};

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithPassword: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signUp: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: jest.fn(() => createSupabaseQueryBuilder()),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  }),
}));

// Mock Supabase server client
jest.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
    from: jest.fn(() => createSupabaseQueryBuilder()),
  }),
  createClientWithAuth: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: jest.fn(() => createSupabaseQueryBuilder()),
  }),
}));

// Mock Supabase admin client
jest.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: () => ({
    from: jest.fn(() => createSupabaseQueryBuilder()),
  }),
}));

// Mock auth provider
jest.mock('@/components/auth-provider', () => ({
  AuthProvider: ({ children }) => React.createElement('div', null, children),
  useAuth: () => ({
    user: null,
    session: null,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    loading: false,
  }),
}));

// Mock auth error boundary
jest.mock('@/components/auth-error-boundary', () => ({
  AuthErrorBoundary: ({ children }) => React.createElement('div', null, children),
}));

// Mock toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Global test utilities
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock performance API for performance tests
global.performance = {
  now: jest.fn(() => Date.now()),
};

// Mock crypto API
global.crypto = {
  randomUUID: jest.fn(() => 'test-uuid-123'),
};

// Mock fetch API
global.fetch = jest.fn();

// Mock URL API
global.URL = {
  createObjectURL: jest.fn(() => 'blob:test'),
  revokeObjectURL: jest.fn(),
};

// Mock File API
global.File = class MockFile {
  constructor(bits, name, options) {
    this.name = name;
    this.size = bits.length;
    this.type = options?.type || 'text/plain';
  }
};

// Mock FormData API
global.FormData = class MockFormData {
  constructor() {
    this.data = new Map();
  }

  append(key, value) {
    this.data.set(key, value);
  }

  get(key) {
    return this.data.get(key);
  }

  has(key) {
    return this.data.has(key);
  }

  delete(key) {
    this.data.delete(key);
  }
};

// Mock Headers API
global.Headers = class MockHeaders {
  constructor(init = {}) {
    this.data = new Map(Object.entries(init));
  }

  get(name) {
    return this.data.get(name.toLowerCase());
  }

  set(name, value) {
    this.data.set(name.toLowerCase(), value);
  }

  has(name) {
    return this.data.has(name.toLowerCase());
  }

  delete(name) {
    this.data.delete(name.toLowerCase());
  }

  forEach(callback) {
    this.data.forEach((value, key) => callback(value, key));
  }
};

// Mock Request API
global.Request = class MockRequest {
  constructor(input, init = {}) {
    this.url =
      typeof input === 'string' ? input : input?.url || 'http://localhost:3000';
    this.method = init.method || 'GET';
    this.headers = new global.Headers(init.headers);
    this.body = init.body;
  }
};

// Mock Response API
global.Response = class MockResponse {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.statusText = init.statusText || 'OK';
    this.headers = new global.Headers(init.headers);
    this.ok = this.status >= 200 && this.status < 300;
  }

  json() {
    return Promise.resolve(JSON.parse(this.body));
  }

  text() {
    return Promise.resolve(this.body);
  }
};

// Mock NextRequest and NextResponse
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest extends global.Request {
    constructor(input, init = {}) {
      super(input, init);
    }
  },
  NextResponse: class MockNextResponse extends global.Response {
    constructor(body, init = {}) {
      super(body, init);
    }

    static json(data, init = {}) {
      return new global.Response(JSON.stringify(data), {
        ...init,
        headers: {
          'content-type': 'application/json',
          ...init.headers,
        },
      });
    }

    static redirect(url, init = {}) {
      return new global.Response(null, {
        ...init,
        status: 302,
        headers: {
          location: url,
          ...init.headers,
        },
      });
    }
  },
}));

// Setup test environment
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.resetAllMocks();
});
