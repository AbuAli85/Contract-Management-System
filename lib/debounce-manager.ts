// Global debounce manager to prevent infinite loops and excessive API calls
class DebounceManager {
  private static instance: DebounceManager | null = null;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private callCounts: Map<string, number> = new Map();
  private lastResetTime: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): DebounceManager {
    if (!DebounceManager.instance) {
      DebounceManager.instance = new DebounceManager();
    }
    return DebounceManager.instance;
  }

  // Debounce function calls with circuit breaker
  debounce<T extends (...args: any[]) => any>(
    key: string,
    func: T,
    delay: number = 500,
    maxCallsPerMinute: number = 10
  ): T {
    return ((...args: any[]) => {
      // Circuit breaker check
      const now = Date.now();
      const lastReset = this.lastResetTime.get(key) || 0;
      const callCount = this.callCounts.get(key) || 0;

      // Reset counter every minute
      if (now - lastReset > 60000) {
        this.callCounts.set(key, 0);
        this.lastResetTime.set(key, now);
      } else if (callCount >= maxCallsPerMinute) {
        return Promise.resolve();
      }

      // Clear existing timer
      const existingTimer = this.debounceTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new timer
      const timer = setTimeout(() => {
        this.callCounts.set(key, (this.callCounts.get(key) || 0) + 1);
        func(...args);
        this.debounceTimers.delete(key);
      }, delay);

      this.debounceTimers.set(key, timer);
    }) as T;
  }

  // Check if a key is currently being debounced
  isDebouncing(key: string): boolean {
    return this.debounceTimers.has(key);
  }

  // Clear all debounce timers
  clearAll(): void {
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }
}

export const debounceManager = DebounceManager.getInstance();
