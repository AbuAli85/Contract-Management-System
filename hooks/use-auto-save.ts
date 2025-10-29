'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useDebounce } from 'use-debounce';

export interface AutoSaveOptions {
  key: string; // Unique key for localStorage
  interval?: number; // Auto-save interval in milliseconds (default: 30000 = 30s)
  enabled?: boolean; // Enable/disable auto-save
  onSave?: (data: any) => void; // Callback when auto-save triggers
  onRestore?: (data: any) => void; // Callback when draft is restored
  excludeFields?: string[]; // Fields to exclude from auto-save
}

export interface AutoSaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  hasDraft: boolean;
  saveDraft: (data: any) => void;
  loadDraft: () => any | null;
  clearDraft: () => void;
  getTimeSinceLastSave: () => string;
}

/**
 * Auto-Save Hook for Forms
 * 
 * Automatically saves form data to localStorage at regular intervals
 * Provides draft recovery on page reload
 * 
 * @example
 * ```tsx
 * const autoSave = useAutoSave({
 *   key: 'promoter-form-draft',
 *   interval: 30000, // 30 seconds
 *   onSave: (data) => console.log('Draft saved:', data),
 * });
 * 
 * // In your form
 * useEffect(() => {
 *   if (formData) {
 *     autoSave.saveDraft(formData);
 *   }
 * }, [formData]);
 * 
 * // On component mount, check for draft
 * useEffect(() => {
 *   const draft = autoSave.loadDraft();
 *   if (draft) {
 *     // Show recovery dialog or auto-restore
 *   }
 * }, []);
 * ```
 */
export function useAutoSave(options: AutoSaveOptions): AutoSaveState {
  const {
    key,
    interval = 30000, // 30 seconds default
    enabled = true,
    onSave,
    onRestore,
    excludeFields = [],
  } = options;

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const dataRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check for existing draft on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        setHasDraft(true);
        setLastSaved(parsed.timestamp ? new Date(parsed.timestamp) : null);
        
        if (onRestore) {
          onRestore(parsed.data);
        }
      }
    } catch (error) {
      console.warn('Failed to load draft:', error);
      // Clear corrupted draft
      localStorage.removeItem(key);
    }
  }, [key, onRestore]);

  // Save draft to localStorage
  const saveDraft = useCallback(
    (data: any) => {
      if (!enabled || typeof window === 'undefined') return;

      dataRef.current = data;

      // Don't save if data is empty or unchanged
      if (!data || Object.keys(data).length === 0) return;

      try {
        // Filter out excluded fields
        const filteredData = { ...data };
        excludeFields.forEach(field => {
          delete filteredData[field];
        });

        const draft = {
          data: filteredData,
          timestamp: new Date().toISOString(),
          version: '1.0',
        };

        setIsSaving(true);
        localStorage.setItem(key, JSON.stringify(draft));
        setLastSaved(new Date());
        setHasDraft(true);

        if (onSave) {
          onSave(filteredData);
        }

        // Reset saving state after a brief delay
        setTimeout(() => setIsSaving(false), 500);
      } catch (error) {
        console.error('Failed to save draft:', error);
        setIsSaving(false);
      }
    },
    [key, enabled, excludeFields, onSave]
  );

  // Load draft from localStorage
  const loadDraft = useCallback((): any | null => {
    if (typeof window === 'undefined') return null;

    try {
      const saved = localStorage.getItem(key);
      if (!saved) return null;

      const parsed = JSON.parse(saved);
      return parsed.data || null;
    } catch (error) {
      console.warn('Failed to load draft:', error);
      return null;
    }
  }, [key]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(key);
      setHasDraft(false);
      setLastSaved(null);
      dataRef.current = null;
    } catch (error) {
      console.warn('Failed to clear draft:', error);
    }
  }, [key]);

  // Get human-readable time since last save
  const getTimeSinceLastSave = useCallback((): string => {
    if (!lastSaved) return 'Never';

    const now = new Date();
    const diffMs = now.getTime() - lastSaved.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffSeconds < 10) return 'Just now';
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return lastSaved.toLocaleString();
  }, [lastSaved]);

  // Set up auto-save interval
  useEffect(() => {
    if (!enabled) return;

    intervalRef.current = setInterval(() => {
      if (dataRef.current) {
        saveDraft(dataRef.current);
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, saveDraft]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isSaving,
    lastSaved,
    hasDraft,
    saveDraft,
    loadDraft,
    clearDraft,
    getTimeSinceLastSave,
  };
}

/**
 * Debounced Auto-Save Hook
 * 
 * Similar to useAutoSave but uses debouncing instead of interval
 * Better for forms that update frequently
 */
export function useDebouncedAutoSave(
  options: AutoSaveOptions & { debounceMs?: number }
): AutoSaveState {
  const {
    key,
    debounceMs = 2000, // 2 seconds default
    enabled = true,
    onSave,
    onRestore,
    excludeFields = [],
  } = options;

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [pendingData, setPendingData] = useState<any>(null);
  
  // Debounce the pending data
  const [debouncedData] = useDebounce(pendingData, debounceMs);

  // Check for existing draft on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        setHasDraft(true);
        setLastSaved(parsed.timestamp ? new Date(parsed.timestamp) : null);
        
        if (onRestore) {
          onRestore(parsed.data);
        }
      }
    } catch (error) {
      console.warn('Failed to load draft:', error);
      localStorage.removeItem(key);
    }
  }, [key, onRestore]);

  // Save when debounced data changes
  useEffect(() => {
    if (!enabled || !debouncedData) return;

    const performSave = async () => {
      try {
        // Filter out excluded fields
        const filteredData = { ...debouncedData };
        excludeFields.forEach(field => {
          delete filteredData[field];
        });

        const draft = {
          data: filteredData,
          timestamp: new Date().toISOString(),
          version: '1.0',
        };

        setIsSaving(true);
        localStorage.setItem(key, JSON.stringify(draft));
        setLastSaved(new Date());
        setHasDraft(true);

        if (onSave) {
          onSave(filteredData);
        }

        setTimeout(() => setIsSaving(false), 500);
      } catch (error) {
        console.error('Failed to save draft:', error);
        setIsSaving(false);
      }
    };

    performSave();
  }, [debouncedData, enabled, key, excludeFields, onSave]);

  const saveDraft = useCallback(
    (data: any) => {
      if (!enabled) return;
      setPendingData(data);
    },
    [enabled]
  );

  const loadDraft = useCallback((): any | null => {
    if (typeof window === 'undefined') return null;

    try {
      const saved = localStorage.getItem(key);
      if (!saved) return null;

      const parsed = JSON.parse(saved);
      return parsed.data || null;
    } catch (error) {
      console.warn('Failed to load draft:', error);
      return null;
    }
  }, [key]);

  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(key);
      setHasDraft(false);
      setLastSaved(null);
      setPendingData(null);
    } catch (error) {
      console.warn('Failed to clear draft:', error);
    }
  }, [key]);

  const getTimeSinceLastSave = useCallback((): string => {
    if (!lastSaved) return 'Never';

    const now = new Date();
    const diffMs = now.getTime() - lastSaved.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffSeconds < 10) return 'Just now';
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return lastSaved.toLocaleString();
  }, [lastSaved]);

  return {
    isSaving,
    lastSaved,
    hasDraft,
    saveDraft,
    loadDraft,
    clearDraft,
    getTimeSinceLastSave,
  };
}
