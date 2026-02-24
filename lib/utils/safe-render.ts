/**
 * Utility functions to safely render values in React
 * Prevents React error #31: "Objects are not valid as a React child"
 */

/**
 * Safely converts a value to a string for rendering
 * Handles objects, arrays, null, undefined, etc.
 */
export function safeRender(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : '';
  }

  if (typeof value === 'object') {
    // Check if it's an empty object
    const keys = Object.keys(value);
    if (keys.length === 0) {
      return '';
    }

    // Try to find a displayable property
    if ('name' in value && value.name) return String(value.name);
    if ('title' in value && value.title) return String(value.title);
    if ('label' in value && value.label) return String(value.label);
    if ('id' in value && value.id) return String(value.id);

    // If no displayable property, return empty string
    return '';
  }

  return String(value);
}

/**
 * Alias for safeRender - safely converts a value to a string
 * @deprecated Use safeRender instead, but kept for backward compatibility
 */
export function safeString(value: any, fallback: string = ''): string {
  const result = safeRender(value);
  return result || fallback;
}

/**
 * Validates if a value can be safely rendered in React
 */
export function canRender(value: any): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === 'object') {
    // Empty objects cannot be rendered
    return Object.keys(value).length > 0;
  }

  return false;
}

/**
 * Safely gets a property from an object, returning a default if invalid
 */
export function safeGet<T>(obj: any, key: string, defaultValue: T): T {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return defaultValue;
  }

  if (key in obj) {
    const value = obj[key];
    // If value is an empty object, return default
    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      if (Object.keys(value).length === 0) {
        return defaultValue;
      }
    }
    return value as T;
  }

  return defaultValue;
}
