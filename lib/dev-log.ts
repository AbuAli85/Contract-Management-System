export function devLog(...args: unknown[]): void {
  if (process.env.NODE_ENV === 'development') {
  }
}

// Debug function for navigation issues
export function debugNavigation(message: string, data?: unknown) {
  if (process.env.NODE_ENV === 'development') {
  }
}
