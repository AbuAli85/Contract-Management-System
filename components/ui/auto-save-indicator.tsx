'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Cloud,
  CloudOff,
  Check,
  Loader2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AutoSaveIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
  error?: string | null;
  className?: string;
  variant?: 'minimal' | 'detailed';
}

/**
 * Auto-Save Status Indicator
 *
 * Visual feedback for auto-save state:
 * - Saving (spinner)
 * - Saved (checkmark + timestamp)
 * - Error (alert icon)
 * - Never saved (cloud icon)
 */
export function AutoSaveIndicator({
  isSaving,
  lastSaved,
  error,
  className,
  variant = 'minimal',
}: AutoSaveIndicatorProps) {
  const getTimeSinceLastSave = (): string => {
    if (!lastSaved) return 'Not saved';

    const now = new Date();
    const diffMs = now.getTime() - lastSaved.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffSeconds < 10) return 'Just now';
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;

    return lastSaved.toLocaleTimeString();
  };

  if (variant === 'minimal') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('flex items-center gap-2', className)}>
              {error ? (
                <AlertCircle className='h-4 w-4 text-destructive animate-pulse' />
              ) : isSaving ? (
                <Loader2 className='h-4 w-4 text-muted-foreground animate-spin' />
              ) : lastSaved ? (
                <Check className='h-4 w-4 text-green-600' />
              ) : (
                <Cloud className='h-4 w-4 text-muted-foreground' />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {error ? (
              <p className='text-sm text-destructive'>Save failed: {error}</p>
            ) : isSaving ? (
              <p className='text-sm'>Saving draft...</p>
            ) : lastSaved ? (
              <p className='text-sm'>Draft saved {getTimeSinceLastSave()}</p>
            ) : (
              <p className='text-sm'>Not saved yet</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Badge
      variant='outline'
      className={cn(
        'flex items-center gap-2 transition-all',
        error && 'bg-destructive/10 text-destructive border-destructive/30',
        isSaving && 'bg-blue-50 text-blue-700 border-blue-200',
        !isSaving &&
          !error &&
          lastSaved &&
          'bg-green-50 text-green-700 border-green-200',
        !isSaving && !error && !lastSaved && 'bg-muted text-muted-foreground',
        className
      )}
    >
      {error ? (
        <>
          <AlertCircle className='h-3.5 w-3.5 animate-pulse' />
          <span className='text-xs font-medium'>Save failed</span>
        </>
      ) : isSaving ? (
        <>
          <Loader2 className='h-3.5 w-3.5 animate-spin' />
          <span className='text-xs font-medium'>Saving...</span>
        </>
      ) : lastSaved ? (
        <>
          <Check className='h-3.5 w-3.5' />
          <span className='text-xs font-medium'>
            Saved {getTimeSinceLastSave()}
          </span>
        </>
      ) : (
        <>
          <CloudOff className='h-3.5 w-3.5' />
          <span className='text-xs font-medium'>Not saved</span>
        </>
      )}
    </Badge>
  );
}

/**
 * Draft Recovery Dialog Trigger
 *
 * Shows when draft is available on page load
 */
interface DraftRecoveryBannerProps {
  onRestore: () => void;
  onDiscard: () => void;
  draftAge: string;
  className?: string;
}

export function DraftRecoveryBanner({
  onRestore,
  onDiscard,
  draftAge,
  className,
}: DraftRecoveryBannerProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg',
        className
      )}
    >
      <div className='flex-shrink-0'>
        <Clock className='h-5 w-5 text-blue-600' />
      </div>
      <div className='flex-1 min-w-0'>
        <h3 className='text-sm font-semibold text-blue-900'>Draft Available</h3>
        <p className='text-sm text-blue-700 mt-1'>
          We found unsaved changes from {draftAge}. Would you like to restore
          them?
        </p>
      </div>
      <div className='flex-shrink-0 flex items-center gap-2'>
        <button
          onClick={onRestore}
          className='px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors'
        >
          Restore
        </button>
        <button
          onClick={onDiscard}
          className='px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors'
        >
          Discard
        </button>
      </div>
    </div>
  );
}
