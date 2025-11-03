/**
 * Filter Persistence Hook
 * Saves and restores filter states to/from localStorage with URL sync
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface FilterState {
  searchTerm?: string;
  statusFilter?: string;
  documentFilter?: string;
  assignmentFilter?: string;
  [key: string]: any;
}

interface UseFilterPersistenceOptions {
  key: string; // localStorage key
  syncWithUrl?: boolean; // sync with URL query params
  debounceMs?: number; // debounce time for saving
}

export function useFilterPersistence(
  initialState: FilterState,
  options: UseFilterPersistenceOptions
) {
  const {
    key,
    syncWithUrl = true,
    debounceMs = 500,
  } = options;
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<FilterState>(() => {
    // Priority: URL params > localStorage > initial state
    if (typeof window === 'undefined') return initialState;
    
    // First, try to get from URL params
    if (syncWithUrl && searchParams) {
      const urlFilters: FilterState = {};
      searchParams.forEach((value, key) => {
        urlFilters[key] = value;
      });
      
      if (Object.keys(urlFilters).length > 0) {
        return { ...initialState, ...urlFilters };
      }
    }
    
    // Fallback to localStorage
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...initialState, ...parsed };
      }
    } catch (error) {
      console.error('Failed to parse stored filters:', error);
    }
    
    return initialState;
  });

  // Save to localStorage with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(filters));
      } catch (error) {
        console.error('Failed to save filters:', error);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [filters, key, debounceMs]);

  // Sync with URL if enabled
  useEffect(() => {
    if (!syncWithUrl) return;

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        params.set(key, String(value));
      }
    });

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : window.location.pathname;
    
    // Only update if different to avoid unnecessary history entries
    if (window.location.search !== `?${queryString}` && queryString !== '') {
      router.replace(newUrl, { scroll: false });
    }
  }, [filters, syncWithUrl, router]);

  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialState);
    if (syncWithUrl) {
      router.replace(window.location.pathname, { scroll: false });
    }
  }, [initialState, syncWithUrl, router]);

  const exportFilters = useCallback(() => {
    return JSON.stringify(filters, null, 2);
  }, [filters]);

  const importFilters = useCallback((jsonString: string) => {
    try {
      const imported = JSON.parse(jsonString);
      setFilters({ ...initialState, ...imported });
    } catch (error) {
      console.error('Failed to import filters:', error);
      throw new Error('Invalid filter configuration');
    }
  }, [initialState]);

  const shareableUrl = useCallback(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        params.set(key, String(value));
      }
    });
    
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  }, [filters]);

  return {
    filters,
    updateFilters,
    resetFilters,
    exportFilters,
    importFilters,
    shareableUrl,
  };
}

