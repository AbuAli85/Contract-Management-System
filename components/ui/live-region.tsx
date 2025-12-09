/**
 * Live Region Component
 *
 * ARIA live region for announcing dynamic content changes to screen readers.
 * Useful for announcing bulk action results, loading states, etc.
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface LiveRegionProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * How assertive the announcement should be
   * - 'polite': Wait for the user to finish their current activity
   * - 'assertive': Interrupt the user immediately
   * - 'off': Do not announce
   */
  mode?: 'polite' | 'assertive' | 'off';
  /**
   * Whether the entire region should be announced on any change
   */
  atomic?: boolean;
  /**
   * Whether the announcement should only include the most recent change
   */
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  /**
   * Visually hide the live region (but still announce to screen readers)
   */
  visuallyHidden?: boolean;
}

export const LiveRegion = React.forwardRef<HTMLDivElement, LiveRegionProps>(
  (
    {
      mode = 'polite',
      atomic = true,
      relevant = 'additions text',
      visuallyHidden = true,
      className,
      children,
      ...props
    },
    ref
  ) => {
    // Build ARIA props to satisfy linter
    const ariaProps: Record<string, string | boolean> = {
      'aria-live': mode,
      'aria-atomic': atomic,
      'aria-relevant': relevant,
    };

    return (
      <div
        ref={ref}
        role='status'
        {...ariaProps}
        className={cn(
          visuallyHidden &&
            'sr-only absolute left-[-10000px] w-[1px] h-[1px] overflow-hidden',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

LiveRegion.displayName = 'LiveRegion';

/**
 * Hook to announce messages to screen readers via a live region
 */
export function useLiveAnnouncer() {
  const [announcement, setAnnouncement] = React.useState('');

  const announce = React.useCallback((message: string) => {
    // Clear first to ensure the change is detected
    setAnnouncement('');

    // Use setTimeout to ensure the DOM updates
    setTimeout(() => {
      setAnnouncement(message);
    }, 100);
  }, []);

  const LiveAnnouncerComponent = React.useMemo(
    () => <LiveRegion>{announcement}</LiveRegion>,
    [announcement]
  );

  return {
    announce,
    LiveAnnouncer: LiveAnnouncerComponent,
  };
}
