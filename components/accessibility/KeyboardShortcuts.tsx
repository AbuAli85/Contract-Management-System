'use client';

import React, { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
}

export interface KeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

/**
 * Keyboard Shortcuts Handler
 * 
 * Enables keyboard navigation and shortcuts throughout the application
 * 
 * @example
 * ```tsx
 * const shortcuts = [
 *   { key: 's', ctrl: true, action: handleSave, description: 'Save form' },
 *   { key: 'k', ctrl: true, action: openSearch, description: 'Open search' }
 * ];
 * 
 * <KeyboardShortcuts shortcuts={shortcuts} />
 * ```
 */
export function KeyboardShortcuts({
  shortcuts,
  enabled = true,
}: KeyboardShortcutsProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Find matching shortcut
      const matchingShortcut = shortcuts.find(
        (shortcut) =>
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          !!event.ctrlKey === !!shortcut.ctrl &&
          !!event.altKey === !!shortcut.alt &&
          !!event.shiftKey === !!shortcut.shift
      );

      if (matchingShortcut) {
        event.preventDefault();
        matchingShortcut.action();
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, enabled]);

  return null;
}

/**
 * Common application shortcuts
 */
export function useCommonShortcuts() {
  const router = useRouter();

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'k',
      ctrl: true,
      action: () => {
        // Open search modal
        const searchInput = document.querySelector<HTMLInputElement>(
          '[data-search-input]'
        );
        searchInput?.focus();
      },
      description: 'Open search',
    },
    {
      key: 'h',
      ctrl: true,
      action: () => router.push('/dashboard'),
      description: 'Go to dashboard',
    },
    {
      key: '/',
      action: () => {
        const searchInput = document.querySelector<HTMLInputElement>(
          '[data-search-input]'
        );
        searchInput?.focus();
      },
      description: 'Focus search',
    },
    {
      key: '?',
      shift: true,
      action: () => {
        // Show keyboard shortcuts help
        const helpModal = document.querySelector<HTMLElement>(
          '[data-shortcuts-modal]'
        );
        if (helpModal) {
          // Toggle modal
        }
      },
      description: 'Show keyboard shortcuts',
    },
  ];

  return shortcuts;
}

/**
 * Keyboard shortcuts help modal
 */
export function KeyboardShortcutsHelp({
  shortcuts,
  isOpen,
  onClose,
}: {
  shortcuts: KeyboardShortcut[];
  isOpen: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      data-shortcuts-modal
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="shortcuts-title" className="text-2xl font-bold mb-4">
          Keyboard Shortcuts
        </h2>
        
        <div className="space-y-2">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b"
            >
              <span className="text-gray-700">{shortcut.description}</span>
              <kbd className="px-3 py-1.5 text-sm font-mono bg-gray-100 border border-gray-300 rounded">
                {shortcut.ctrl && '⌘ + '}
                {shortcut.alt && 'Alt + '}
                {shortcut.shift && 'Shift + '}
                {shortcut.key.toUpperCase()}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

