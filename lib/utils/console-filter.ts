/**
 * Console Error Filter
 * Filters out browser extension errors that clutter the console
 * These errors don't affect application functionality
 */

if (typeof window !== 'undefined') {
  const originalError = console.error;
  const originalWarn = console.warn;

  // Patterns to filter (browser extension errors)
  const filterPatterns = [
    /content\.js/i,
    /installHook\.js/i,
    /tactiq\.io/i,
    /ffp\.tactiq\.io/i,
    /Extension context invalidated/i,
    /chrome-extension:/i,
    /moz-extension:/i,
    /Fetch failed loading.*tactiq/i,
    /Fetch finished loading.*tactiq/i,
    /Fetch failed loading: GET.*tactiq/i,
    /Fetch finished loading: POST.*tactiq/i,
  ];

  const shouldFilter = (message: string): boolean => {
    return filterPatterns.some(pattern => pattern.test(message));
  };

  console.error = (...args: any[]) => {
    const message = args
      .map(arg => (typeof arg === 'string' ? arg : JSON.stringify(arg)))
      .join(' ');

    if (!shouldFilter(message)) {
      originalError.apply(console, args);
    }
  };

  console.warn = (...args: any[]) => {
    const message = args
      .map(arg => (typeof arg === 'string' ? arg : JSON.stringify(arg)))
      .join(' ');

    if (!shouldFilter(message)) {
      originalWarn.apply(console, args);
    }
  };
}
