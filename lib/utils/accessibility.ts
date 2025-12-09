/**
 * Accessibility Utilities
 * Helpers for improving accessibility and WCAG compliance
 */

import { useEffect, useRef, useCallback } from 'react';

/**
 * Focus trap hook for modal dialogs
 */
export function useFocusTrap(isActive: boolean = true) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element on mount
    firstElement?.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Announce to screen readers
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Keyboard navigation hook
 */
export function useKeyboardNavigation(
  items: any[],
  onSelect: (item: any) => void,
  isActive: boolean = true
) {
  const selectedIndexRef = useRef(0);

  useEffect(() => {
    if (!isActive || items.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          selectedIndexRef.current = Math.min(
            selectedIndexRef.current + 1,
            items.length - 1
          );
          announceToScreenReader(
            `Item ${selectedIndexRef.current + 1} of ${items.length}`,
            'polite'
          );
          break;

        case 'ArrowUp':
          e.preventDefault();
          selectedIndexRef.current = Math.max(selectedIndexRef.current - 1, 0);
          announceToScreenReader(
            `Item ${selectedIndexRef.current + 1} of ${items.length}`,
            'polite'
          );
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          onSelect(items[selectedIndexRef.current]);
          break;

        case 'Home':
          e.preventDefault();
          selectedIndexRef.current = 0;
          announceToScreenReader('First item', 'polite');
          break;

        case 'End':
          e.preventDefault();
          selectedIndexRef.current = items.length - 1;
          announceToScreenReader('Last item', 'polite');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [items, onSelect, isActive]);

  return selectedIndexRef.current;
}

/**
 * Props for skip navigation link
 */
export interface SkipNavigationLinkProps {
  targetId: string;
  label?: string;
}

/**
 * Create skip navigation link props
 * Returns props object to be spread on an anchor element
 */
export function createSkipNavigationLinkProps({
  targetId,
  label = 'Skip to main content',
}: SkipNavigationLinkProps) {
  return {
    href: `#${targetId}`,
    className:
      'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded',
    children: label,
  };
}

/**
 * Check color contrast ratio
 */
export function getContrastRatio(
  foreground: string,
  background: string
): number {
  const getLuminance = (hexColor: string): number => {
    const rgb = parseInt(hexColor.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;

    const components = [r, g, b].map(c => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });

    const [rs, gs, bs] = components;
    return 0.2126 * (rs || 0) + 0.7152 * (gs || 0) + 0.0722 * (bs || 0);
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * WCAG compliance levels
 */
export function checkWCAGCompliance(
  contrastRatio: number,
  level: 'AA' | 'AAA' = 'AA',
  size: 'normal' | 'large' = 'normal'
): boolean {
  const requirements = {
    AA: {
      normal: 4.5,
      large: 3,
    },
    AAA: {
      normal: 7,
      large: 4.5,
    },
  };

  return contrastRatio >= requirements[level][size];
}

/**
 * Reduced motion preference hook
 */
export function usePrefersReducedMotion() {
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion.current = e.matches;
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion.current;
}

/**
 * Create focus visible event handlers
 * Returns event handlers for managing focus-visible state
 */
export function createFocusVisibleHandlers(
  setIsFocusVisible: (visible: boolean) => void
) {
  let hadKeyboardEvent = false;
  let isMouseDown = false;

  return {
    handleKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        hadKeyboardEvent = true;
      }
    },
    handleMouseDown: () => {
      isMouseDown = true;
      hadKeyboardEvent = false;
    },
    handleMouseUp: () => {
      isMouseDown = false;
    },
    handleFocus: () => {
      if (hadKeyboardEvent || isMouseDown) {
        setIsFocusVisible(true);
      }
    },
    handleBlur: () => {
      setIsFocusVisible(false);
      hadKeyboardEvent = false;
    },
  };
}

/**
 * ARIA live region hook
 */
export function useAriaLiveRegion(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
) {
  useEffect(() => {
    if (!message) return;

    announceToScreenReader(message, priority);
  }, [message, priority]);
}

/**
 * Generate unique IDs for accessibility
 */
let idCounter = 0;

export function useUniqueId(prefix: string = 'id'): string {
  const idRef = useRef<string>();

  if (!idRef.current) {
    idRef.current = `${prefix}-${++idCounter}`;
  }

  return idRef.current;
}

/**
 * Manage focus restoration
 */
export function useFocusRestore() {
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  const saveFocus = useCallback(() => {
    previousActiveElementRef.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback(() => {
    previousActiveElementRef.current?.focus();
    previousActiveElementRef.current = null;
  }, []);

  return { saveFocus, restoreFocus };
}

/**
 * Landmark regions utility
 */
export const landmarkRoles = {
  banner: 'banner',
  complementary: 'complementary',
  contentinfo: 'contentinfo',
  form: 'form',
  main: 'main',
  navigation: 'navigation',
  region: 'region',
  search: 'search',
} as const;

/**
 * Helper to create accessible button props
 */
export function createAccessibleButtonProps(options: {
  label: string;
  description?: string;
  pressed?: boolean;
  expanded?: boolean;
  controls?: string;
  disabled?: boolean;
}) {
  return {
    'aria-label': options.label,
    'aria-describedby': options.description,
    'aria-pressed': options.pressed,
    'aria-expanded': options.expanded,
    'aria-controls': options.controls,
    'aria-disabled': options.disabled,
    role: 'button',
    tabIndex: options.disabled ? -1 : 0,
  };
}

/**
 * Helper to create accessible table props
 */
export function createAccessibleTableProps(options: {
  label: string;
  description?: string;
  rowCount?: number;
  columnCount?: number;
}) {
  return {
    role: 'table',
    'aria-label': options.label,
    'aria-describedby': options.description,
    'aria-rowcount': options.rowCount,
    'aria-colcount': options.columnCount,
  };
}
