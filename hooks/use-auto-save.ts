import { useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseAutoSaveOptions {
  formKey: string;
  debounceMs?: number;
  enabled?: boolean;
  onSave?: (data: any) => Promise<void>;
  onError?: (error: Error) => void;
  watch?: () => any;
  formState?: { isDirty: boolean };
}

export function useAutoSave<T = any>({
  formKey,
  debounceMs = 2000,
  enabled = true,
  onSave,
  onError,
  watch,
  formState,
}: UseAutoSaveOptions) {
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>('');
  const isSavingRef = useRef(false);

  // Check if required parameters are available
  if (!watch || !formState) {
    console.warn(
      '💾 Auto-save: watch or formState not provided, auto-save disabled'
    );
    return {
      saveData: async () => {},
      loadFromLocalStorage: () => null,
      clearLocalStorage: () => {},
      isSaving: false,
    };
  }

  // Get form data
  const formData = watch();

  // Save to localStorage
  const saveToLocalStorage = useCallback(
    (data: any) => {
      try {
        const key = `auto-save-${formKey}`;
        const timestamp = Date.now();
        const saveData = {
          data,
          timestamp,
          version: '1.0',
        };
        localStorage.setItem(key, JSON.stringify(saveData));
        console.log('💾 Auto-save: Saved to localStorage', { key, timestamp });
      } catch (error) {
        console.error('💾 Auto-save: Failed to save to localStorage', error);
      }
    },
    [formKey]
  );

  // Load from localStorage
  const loadFromLocalStorage = useCallback(() => {
    try {
      const key = `auto-save-${formKey}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        const isExpired = Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000; // 24 hours
        if (!isExpired) {
          console.log('💾 Auto-save: Loaded from localStorage', {
            key,
            timestamp: parsed.timestamp,
          });
          return parsed.data;
        } else {
          localStorage.removeItem(key);
          console.log('💾 Auto-save: Removed expired localStorage data', {
            key,
          });
        }
      }
    } catch (error) {
      console.error('💾 Auto-save: Failed to load from localStorage', error);
    }
    return null;
  }, [formKey]);

  // Clear localStorage
  const clearLocalStorage = useCallback(() => {
    try {
      const key = `auto-save-${formKey}`;
      localStorage.removeItem(key);
      console.log('💾 Auto-save: Cleared localStorage', { key });
    } catch (error) {
      console.error('💾 Auto-save: Failed to clear localStorage', error);
    }
  }, [formKey]);

  // Save data
  const saveData = useCallback(
    async (data: any) => {
      if (isSavingRef.current) return;

      const dataString = JSON.stringify(data);
      if (dataString === lastSavedDataRef.current) {
        return; // No changes
      }

      isSavingRef.current = true;

      try {
        // Save to localStorage first
        saveToLocalStorage(data);

        // Call custom save function if provided
        if (onSave) {
          await onSave(data);
        }

        lastSavedDataRef.current = dataString;
        console.log('💾 Auto-save: Successfully saved data');
      } catch (error) {
        console.error('💾 Auto-save: Failed to save data', error);
        if (onError) {
          onError(error as Error);
        } else {
          toast({
            title: 'Auto-save failed',
            description:
              'Your changes were saved locally but failed to sync with the server.',
            variant: 'destructive',
          });
        }
      } finally {
        isSavingRef.current = false;
      }
    },
    [onSave, onError, saveToLocalStorage, toast]
  );

  // Debounced save
  const debouncedSave = useCallback(
    (data: any) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        saveData(data);
      }, debounceMs);
    },
    [saveData, debounceMs]
  );

  // Watch for form changes and auto-save
  useEffect(() => {
    if (!enabled || !formData) return;

    // Skip if form is pristine (no changes)
    if (formState.isDirty) {
      debouncedSave(formData);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [formData, formState.isDirty, enabled, debouncedSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    saveData,
    loadFromLocalStorage,
    clearLocalStorage,
    isSaving: isSavingRef.current,
  };
}
