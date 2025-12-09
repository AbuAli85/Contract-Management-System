'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export interface AnnouncerProps {
  message: string;
  priority?: 'polite' | 'assertive';
  clearAfter?: number;
}

/**
 * Screen Reader Live Region Announcer
 *
 * Announces dynamic content changes to screen reader users
 *
 * @example
 * ```tsx
 * const [announcement, setAnnouncement] = useState('');
 *
 * // When something happens
 * setAnnouncement('Contract saved successfully');
 *
 * <ScreenReaderAnnouncer message={announcement} />
 * ```
 */
export function ScreenReaderAnnouncer({
  message,
  priority = 'polite',
  clearAfter = 5000,
}: AnnouncerProps) {
  const [mounted, setMounted] = useState(false);
  const [displayMessage, setDisplayMessage] = useState(message);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (message) {
      setDisplayMessage(message);

      if (clearAfter > 0) {
        const timer = setTimeout(() => {
          setDisplayMessage('');
        }, clearAfter);

        return () => clearTimeout(timer);
      }
    }
  }, [message, clearAfter]);

  if (!mounted) return null;

  return createPortal(
    <div
      role='status'
      aria-live={priority}
      aria-atomic='true'
      className='sr-only'
    >
      {displayMessage}
    </div>,
    document.body
  );
}

/**
 * Hook for making announcements
 */
export function useScreenReaderAnnouncement() {
  const [announcement, setAnnouncement] = useState('');

  const announce = (message: string) => {
    setAnnouncement(message);
  };

  return {
    announce,
    Announcer: () => <ScreenReaderAnnouncer message={announcement} />,
  };
}
