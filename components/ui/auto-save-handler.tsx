import React, { useEffect } from 'react';
import { useAutoSave } from '@/hooks/use-auto-save';
import { useFormContext } from 'react-hook-form';

interface AutoSaveHandlerProps {
  formKey: string;
  debounceMs?: number;
  enabled?: boolean;
  onSave?: (data: any) => Promise<void>;
  onError?: (error: Error) => void;
  onStatusChange?: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
  onLastSavedChange?: (date: Date | null) => void;
}

export function AutoSaveHandler({
  formKey,
  debounceMs = 3000,
  enabled = true,
  onSave,
  onError,
  onStatusChange,
  onLastSavedChange,
}: AutoSaveHandlerProps) {
  const form = useFormContext();

  const { loadFromLocalStorage, clearLocalStorage } = useAutoSave({
    formKey,
    debounceMs,
    enabled,
    onSave,
    onError,
    watch: form.watch,
    formState: form.formState,
  });

  // Load auto-saved data on mount
  useEffect(() => {
    if (enabled) {
      const savedData = loadFromLocalStorage();
      if (savedData) {
        console.log('💾 Auto-save: Loading saved data from localStorage');
        form.reset(savedData);
        onLastSavedChange?.(new Date(savedData.timestamp || Date.now()));
        onStatusChange?.('saved');
      }
    }
  }, [enabled, loadFromLocalStorage, form, onLastSavedChange, onStatusChange]);

  // This component doesn't render anything, it just handles auto-save
  return null;
}
