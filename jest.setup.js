// Jest setup file for RBAC testing
require('@testing-library/jest-dom');

// Mock environment variables
process.env.RBAC_ENFORCEMENT = 'dry-run';
process.env.NODE_ENV = 'test';

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

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: {
      getUser: jest
        .fn()
        .mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  }),
}));

// Mock Redis client (commented out - package not available)
// jest.mock('redis', () => ({
//   createClient: () => ({
//     get: jest.fn(),
//     set: jest.fn(),
//     del: jest.fn(),
//     flushdb: jest.fn(),
//     connect: jest.fn(),
//     disconnect: jest.fn()
//   })
// }))

// Global test utilities
global.console = {
  ...console,
  // Uncomment to see console.log output during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
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
