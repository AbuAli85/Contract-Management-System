import { useState, useCallback, useMemo, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  full_name?: string;
  phone?: string;
  department?: string;
  position?: string;
  avatar_url?: string;
  notes?: string;
  permissions?: Record<string, boolean>;
  created_at: string;
  updated_at?: string;
  last_login?: string;
}

export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UserManagementResponse {
  users: User[];
  pagination: UserPagination;
}

export function useUserManagement() {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<UserPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Memoized statistics to prevent recalculation
  const statistics = useMemo(() => {
    const activeUsers = users.filter(u => u.status === 'active').length;
    const adminUsers = users.filter(u => u.role === 'admin').length;
    const recentActivity = users.filter(
      u =>
        u.last_login &&
        new Date(u.last_login) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;

    return {
      total: pagination.total,
      active: activeUsers,
      admins: adminUsers,
      recentActivity,
    };
  }, [users, pagination.total]);

  // Fetch users with filters and pagination
  const fetchUsers = useCallback(
    async (filters: UserFilters = {}) => {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      setLoading(true);
      try {
        const params = new URLSearchParams();

        if (filters.search) params.append('search', filters.search);
        if (filters.role) params.append('role', filters.role);
        if (filters.status) params.append('status', filters.status);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.sortBy) params.append('sortBy', filters.sortBy);
        if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

        const response = await fetch('/api/users?' + params.toString(), {
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to fetch users');
        }

        const data: UserManagementResponse = await response.json();
        setUsers(data.users);
        setPagination(data.pagination);

        return data;
      } catch (error: unknown) {
        // Don't show error for aborted requests
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        toast({
          title: 'Error fetching users',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [toast]
  );

  // Optimized user creation with optimistic update
  const createUser = useCallback(
    async (userData: Partial<User>) => {
      setLoading(true);
      try {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create user');
        }

        const data = await response.json();

        toast({
          title: 'User created successfully',
          description: 'User ' + userData.email + ' has been created.',
        });

        // Refresh users list
        await fetchUsers();

        return data.user;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        toast({
          title: 'Error creating user',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [fetchUsers, toast]
  );

  // Optimized user update with optimistic update
  const updateUser = useCallback(
    async (userId: string, userData: Partial<User>) => {
      setLoading(true);
      try {
        const response = await fetch('/api/users/' + userId, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update user');
        }

        const data = await response.json();

        toast({
          title: 'User updated successfully',
          description:
            'User ' + (userData.email || 'profile') + ' has been updated.',
        });

        // Refresh users list
        await fetchUsers();

        return data.user;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        toast({
          title: 'Error updating user',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [fetchUsers, toast]
  );

  // Optimized user deletion with optimistic update
  const deleteUser = useCallback(
    async (userId: string) => {
      setLoading(true);
      try {
        const response = await fetch('/api/users/' + userId, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete user');
        }

        toast({
          title: 'User deleted successfully',
          description: 'The user has been deleted.',
        });

        // Refresh users list
        await fetchUsers();
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        toast({
          title: 'Error deleting user',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [fetchUsers, toast]
  );

  // Optimized bulk operations
  const bulkUpdateUsers = useCallback(
    async (userIds: string[], updates: Partial<User>) => {
      setLoading(true);
      try {
        const response = await fetch('/api/users/bulk', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userIds, updates }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update users');
        }

        toast({
          title: 'Users updated successfully',
          description: userIds.length + ' users have been updated.',
        });

        // Refresh users list
        await fetchUsers();
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        toast({
          title: 'Error updating users',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [fetchUsers, toast]
  );

  const bulkDeleteUsers = useCallback(
    async (userIds: string[]) => {
      setLoading(true);
      try {
        const response = await fetch('/api/users/bulk', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userIds }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete users');
        }

        toast({
          title: 'Users deleted successfully',
          description: userIds.length + ' users have been deleted.',
        });

        // Refresh users list
        await fetchUsers();
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        toast({
          title: 'Error deleting users',
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [fetchUsers, toast]
  );

  // Get user by ID with caching
  const getUserById = useCallback(
    async (userId: string): Promise<User | null> => {
      try {
        const response = await fetch('/api/users/' + userId);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to fetch user');
        }

        const data = await response.json();
        return data.user;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        toast({
          title: 'Error fetching user',
          description: errorMessage,
          variant: 'destructive',
        });
        return null;
      }
    },
    [toast]
  );

  // Get user statistics
  const getUserStats = useCallback(
    async (userId: string) => {
      try {
        const response = await fetch('/api/users/' + userId + '/stats');

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to fetch user stats');
        }

        const data = await response.json();
        return data.stats;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        toast({
          title: 'Error fetching user stats',
          description: errorMessage,
          variant: 'destructive',
        });
        return null;
      }
    },
    [toast]
  );

  // Get user activity
  const getUserActivity = useCallback(
    async (userId: string, limit = 10) => {
      try {
        const response = await fetch(
          '/api/users/' + userId + '/activity?limit=' + limit
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to fetch user activity');
        }

        const data = await response.json();
        return data.activity;
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        toast({
          title: 'Error fetching user activity',
          description: errorMessage,
          variant: 'destructive',
        });
        return [];
      }
    },
    [toast]
  );

  return {
    // State
    loading,
    users,
    pagination,
    statistics,

    // Actions
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    bulkUpdateUsers,
    bulkDeleteUsers,
    getUserById,
    getUserStats,
    getUserActivity,

    // Utilities
    setUsers,
    setPagination,
  };
}
