'use client';

import { useEffect, useRef, useCallback } from 'react';

interface SafeDOMOptions {
  onError?: (error: Error) => void;
  retryAttempts?: number;
  retryDelay?: number;
}

export function useSafeDOMManipulation(options: SafeDOMOptions = {}) {
  const mountedRef = useRef(true);
  const { onError, retryAttempts = 3, retryDelay = 100 } = options;

  // Track if component is mounted
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Safe DOM manipulation with retry logic
  const safeDOMOperation = useCallback(
    async <T>(operation: () => T, fallback?: () => T): Promise<T | null> => {
      if (!mountedRef.current) {
        console.warn('Component unmounted, skipping DOM operation');
        return null;
      }

      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= retryAttempts; attempt++) {
        try {
          // Check if component is still mounted before each attempt
          if (!mountedRef.current) {
            console.warn('Component unmounted during DOM operation retry');
            return null;
          }

          const result = await operation();
          return result;
        } catch (error) {
          lastError = error as Error;

          // Log the error for debugging
          console.warn(
            `DOM operation failed (attempt ${attempt}/${retryAttempts}):`,
            error
          );

          // Call error handler if provided
          if (onError) {
            onError(lastError);
          }

          // If this is the last attempt, try fallback or throw
          if (attempt === retryAttempts) {
            if (fallback) {
              try {
                return await fallback();
              } catch (fallbackError) {
                console.error('Fallback operation also failed:', fallbackError);
                throw lastError;
              }
            }
            throw lastError;
          }

          // Wait before retrying
          await new Promise(resolve =>
            setTimeout(resolve, retryDelay * attempt)
          );
        }
      }

      return null;
    },
    [onError, retryAttempts, retryDelay]
  );

  // Safe element insertion
  const safeInsertBefore = useCallback(
    (newNode: Node, referenceNode: Node | null, parentNode: Node) => {
      return safeDOMOperation(
        () => {
          if (!mountedRef.current) return null;

          // Validate nodes before insertion
          if (!newNode || !parentNode) {
            throw new Error('Invalid nodes provided for insertion');
          }

          // Check if reference node is still a child of parent
          if (referenceNode && !parentNode.contains(referenceNode)) {
            console.warn(
              'Reference node is not a child of parent, appending instead'
            );
            parentNode.appendChild(newNode);
            return newNode;
          }

          return parentNode.insertBefore(newNode, referenceNode);
        },
        () => {
          // Fallback: append to end
          if (mountedRef.current && parentNode) {
            return parentNode.appendChild(newNode);
          }
          return null;
        }
      );
    },
    [safeDOMOperation]
  );

  // Safe element removal
  const safeRemoveChild = useCallback(
    (childNode: Node, parentNode: Node) => {
      return safeDOMOperation(() => {
        if (!mountedRef.current) return null;

        // Validate nodes before removal
        if (!childNode || !parentNode) {
          throw new Error('Invalid nodes provided for removal');
        }

        // Check if child is still a child of parent
        if (!parentNode.contains(childNode)) {
          console.warn('Child node is not a child of parent, skipping removal');
          return null;
        }

        return parentNode.removeChild(childNode);
      });
    },
    [safeDOMOperation]
  );

  // Safe element replacement
  const safeReplaceChild = useCallback(
    (newChild: Node, oldChild: Node, parentNode: Node) => {
      return safeDOMOperation(
        () => {
          if (!mountedRef.current) return null;

          // Validate nodes before replacement
          if (!newChild || !oldChild || !parentNode) {
            throw new Error('Invalid nodes provided for replacement');
          }

          // Check if old child is still a child of parent
          if (!parentNode.contains(oldChild)) {
            console.warn(
              'Old child is not a child of parent, appending new child instead'
            );
            parentNode.appendChild(newChild);
            return newChild;
          }

          return parentNode.replaceChild(newChild, oldChild);
        },
        () => {
          // Fallback: remove old, append new
          if (mountedRef.current && parentNode) {
            try {
              if (parentNode.contains(oldChild)) {
                parentNode.removeChild(oldChild);
              }
            } catch (e) {
              // Ignore removal errors
            }
            return parentNode.appendChild(newChild);
          }
          return null;
        }
      );
    },
    [safeDOMOperation]
  );

  return {
    safeDOMOperation,
    safeInsertBefore,
    safeRemoveChild,
    safeReplaceChild,
    isMounted: () => mountedRef.current,
  };
}
