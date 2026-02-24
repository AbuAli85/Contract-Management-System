/**
 * Utility functions for masking sensitive ID numbers
 * Protects personal identifiers (ID cards, passports) from full exposure
 */

/**
 * Masks an ID card or passport number, showing only last 4 digits
 * @param idNumber - The full ID number to mask
 * @returns Masked ID (e.g., "****1234")
 */
export function maskIdNumber(idNumber: string | null | undefined): string {
  if (!idNumber || typeof idNumber !== 'string') {
    return '—';
  }

  const trimmed = idNumber.trim();
  if (trimmed.length <= 4) {
    // Too short to mask meaningfully
    return '****';
  }

  // Show only last 4 digits
  const lastFour = trimmed.slice(-4);
  const masked = '*'.repeat(Math.max(0, trimmed.length - 4));
  return `${masked}${lastFour}`;
}

/**
 * Checks if a search term is a partial ID match (for search suggestions)
 * Requires at least 4 characters before showing suggestions
 * @param searchTerm - The search term to check
 * @returns true if search term appears to be an ID search
 */
export function isIdSearch(searchTerm: string): boolean {
  if (!searchTerm || searchTerm.length < 4) {
    return false;
  }

  // Check if it's mostly digits (likely an ID search)
  const digitCount = (searchTerm.match(/\d/g) || []).length;
  return digitCount >= 3;
}

/**
 * Formats an ID for display in search suggestions
 * Shows partial match with masking
 * @param idNumber - The full ID number
 * @param searchTerm - The search term (to highlight match)
 * @returns Formatted ID string
 */
export function formatIdForSuggestion(
  idNumber: string,
  searchTerm: string
): string {
  const masked = maskIdNumber(idNumber);
  // If search term matches the last part, show it
  if (idNumber.toLowerCase().endsWith(searchTerm.toLowerCase())) {
    const visiblePart = idNumber.slice(-searchTerm.length);
    const rest = idNumber.slice(0, -searchTerm.length);
    return `${'*'.repeat(Math.max(0, rest.length - 4))}${rest.slice(-4)}${visiblePart}`;
  }
  return masked;
}

/**
 * Validates if a search term can be used to search IDs
 * Requires minimum length for security
 * @param searchTerm - The search term
 * @returns true if search term is valid for ID searching
 */
export function canSearchById(searchTerm: string): boolean {
  return searchTerm.length >= 4 && /\d/.test(searchTerm);
}
