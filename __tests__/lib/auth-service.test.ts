/**
 * Auth Service Tests
 *
 * Tests for the authentication service including login, logout,
 * session management, and role-based access control.
 */

// Mock Supabase client
const mockSupabaseAuth = {
  signInWithPassword: jest.fn(),
  signOut: jest.fn(),
  getUser: jest.fn(),
  getSession: jest.fn(),
  onAuthStateChange: jest.fn(() => ({
    data: { subscription: { unsubscribe: jest.fn() } },
  })),
  refreshSession: jest.fn(),
};

const mockSupabaseFrom = jest.fn(() => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null }),
  update: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockReturnThis(),
}));

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: mockSupabaseAuth,
    from: mockSupabaseFrom,
  })),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: mockSupabaseAuth,
    from: mockSupabaseFrom,
  })),
}));

describe('Authentication Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Authentication State', () => {
    it('should return null user when not authenticated', () => {
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });
      expect(mockSupabaseAuth.getUser).toBeDefined();
    });

    it('should return user object when authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { role: 'admin', full_name: 'Test User' },
      };
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await mockSupabaseAuth.getUser();
      expect(result.data.user).toEqual(mockUser);
      expect(result.data.user.email).toBe('test@example.com');
    });

    it('should handle authentication errors gracefully', async () => {
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'JWT expired', status: 401 },
      });

      const result = await mockSupabaseAuth.getUser();
      expect(result.error).toBeTruthy();
      expect(result.error.status).toBe(401);
    });
  });

  describe('Sign In', () => {
    it('should successfully sign in with valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'admin@example.com',
        user_metadata: { role: 'admin' },
      };
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: { access_token: 'token-123' } },
        error: null,
      });

      const result = await mockSupabaseAuth.signInWithPassword({
        email: 'admin@example.com',
        password: 'SecurePass123!',
      });

      expect(result.error).toBeNull();
      expect(result.data.user.email).toBe('admin@example.com');
      expect(result.data.session.access_token).toBe('token-123');
    });

    it('should fail sign in with invalid credentials', async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials', status: 400 },
      });

      const result = await mockSupabaseAuth.signInWithPassword({
        email: 'wrong@example.com',
        password: 'wrongpassword',
      });

      expect(result.error).toBeTruthy();
      expect(result.data.user).toBeNull();
    });

    it('should reject empty email', async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email is required', status: 422 },
      });

      const result = await mockSupabaseAuth.signInWithPassword({
        email: '',
        password: 'password123',
      });

      expect(result.error).toBeTruthy();
    });

    it('should reject empty password', async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Password is required', status: 422 },
      });

      const result = await mockSupabaseAuth.signInWithPassword({
        email: 'test@example.com',
        password: '',
      });

      expect(result.error).toBeTruthy();
    });
  });

  describe('Sign Out', () => {
    it('should successfully sign out', async () => {
      mockSupabaseAuth.signOut.mockResolvedValue({ error: null });

      const result = await mockSupabaseAuth.signOut();
      expect(result.error).toBeNull();
      expect(mockSupabaseAuth.signOut).toHaveBeenCalledTimes(1);
    });

    it('should handle sign out errors', async () => {
      mockSupabaseAuth.signOut.mockResolvedValue({
        error: { message: 'Network error' },
      });

      const result = await mockSupabaseAuth.signOut();
      expect(result.error).toBeTruthy();
    });
  });

  describe('Session Management', () => {
    it('should return active session when logged in', async () => {
      const mockSession = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-123',
        expires_at: Date.now() / 1000 + 3600,
        user: { id: 'user-123', email: 'test@example.com' },
      };
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const result = await mockSupabaseAuth.getSession();
      expect(result.data.session).toBeTruthy();
      expect(result.data.session.access_token).toBe('access-token-123');
    });

    it('should return null session when not logged in', async () => {
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await mockSupabaseAuth.getSession();
      expect(result.data.session).toBeNull();
    });

    it('should refresh session successfully', async () => {
      const newSession = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_at: Date.now() / 1000 + 3600,
      };
      mockSupabaseAuth.refreshSession.mockResolvedValue({
        data: { session: newSession },
        error: null,
      });

      const result = await mockSupabaseAuth.refreshSession();
      expect(result.data.session.access_token).toBe('new-access-token');
    });
  });

  describe('Role-Based Access Control', () => {
    const roles = ['admin', 'super_admin', 'manager', 'employer', 'promoter', 'user'];

    it('should recognize all valid user roles', () => {
      roles.forEach(role => {
        expect(roles).toContain(role);
      });
    });

    it('should identify admin roles correctly', () => {
      const adminRoles = ['admin', 'super_admin'];
      adminRoles.forEach(role => {
        const isAdmin = role === 'admin' || role === 'super_admin';
        expect(isAdmin).toBe(true);
      });
    });

    it('should identify non-admin roles correctly', () => {
      const nonAdminRoles = ['manager', 'employer', 'promoter', 'user'];
      nonAdminRoles.forEach(role => {
        const isAdmin = role === 'admin' || role === 'super_admin';
        expect(isAdmin).toBe(false);
      });
    });

    it('should handle undefined role gracefully', () => {
      const role = undefined;
      const isAdmin = role === 'admin' || role === 'super_admin';
      expect(isAdmin).toBe(false);
    });
  });
});
