/**
 * Text Formatting Utilities
 *
 * Provides consistent text transformation across the application
 * to ensure professional appearance and readability.
 */

/**
 * Convert string to Title Case (capitalize first letter of each word)
 * Handles special cases like "o'", "d'", "mc", etc.
 *
 * @example
 * toTitleCase("john smith") // "John Smith"
 * toTitleCase("o'connor") // "O'Connor"
 * toTitleCase("mcdonald") // "McDonald"
 * toTitleCase("jean-paul") // "Jean-Paul"
 */
export function toTitleCase(str: string | null | undefined): string {
  if (!str) return '';

  const cleaned = str.trim();
  if (!cleaned) return '';

  // List of words that should stay lowercase (unless first word)
  const lowercase = [
    'a',
    'an',
    'and',
    'as',
    'at',
    'but',
    'by',
    'for',
    'if',
    'in',
    'nor',
    'of',
    'on',
    'or',
    'so',
    'the',
    'to',
    'up',
    'yet',
  ];

  // Special prefixes to handle
  const specialPrefixes = [
    {
      pattern: /\b(mc)([a-z])/gi,
      replacement: (match: string, prefix: string, letter: string) =>
        prefix.charAt(0).toUpperCase() +
        prefix.charAt(1).toLowerCase() +
        letter.toUpperCase(),
    },
    {
      pattern: /\b(mac)([a-z])/gi,
      replacement: (match: string, prefix: string, letter: string) =>
        prefix.charAt(0).toUpperCase() +
        prefix.charAt(1).toLowerCase() +
        prefix.charAt(2).toLowerCase() +
        letter.toUpperCase(),
    },
    {
      pattern: /\b([od]')([a-z])/gi,
      replacement: (match: string, prefix: string, letter: string) =>
        prefix.toUpperCase() + letter.toUpperCase(),
    },
  ];

  // Split by spaces, hyphens, and other word boundaries
  const words = cleaned.split(/(\s+|-)/);

  const titleCased = words
    .map((word, index) => {
      if (!word || /^\s+$/.test(word) || word === '-') {
        return word;
      }

      const lowerWord = word.toLowerCase();

      // Apply special prefix rules
      let result = word;
      for (const { pattern, replacement } of specialPrefixes) {
        result = result.replace(pattern, replacement);
      }

      // If no special pattern matched, apply standard title case
      if (result === word) {
        // Keep lowercase words lowercase (unless first word)
        if (index !== 0 && lowercase.includes(lowerWord)) {
          result = lowerWord;
        } else {
          // Standard title case
          result = lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1);
        }
      }

      return result;
    })
    .join('');

  return titleCased;
}

/**
 * Capitalize first letter of string
 *
 * @example
 * capitalize("active") // "Active"
 * capitalize("ACTIVE") // "Active"
 */
export function capitalize(str: string | null | undefined): string {
  if (!str) return '';

  const cleaned = str.trim().toLowerCase();
  if (!cleaned) return '';

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Format proper nouns (names, places, etc.) to Title Case
 *
 * @example
 * formatProperNoun("john doe") // "John Doe"
 * formatProperNoun("o'brien") // "O'Brien"
 */
export function formatProperNoun(str: string | null | undefined): string {
  return toTitleCase(str);
}

/**
 * Format nationality with proper capitalization
 *
 * @example
 * formatNationality("egyptian") // "Egyptian"
 * formatNationality("EGYPTIAN") // "Egyptian"
 * formatNationality("united states") // "United States"
 */
export function formatNationality(str: string | null | undefined): string {
  if (!str) return '';

  const cleaned = str.trim().toLowerCase();
  if (!cleaned) return '';

  // Special cases for nationalities
  const specialCases: Record<string, string> = {
    usa: 'USA',
    uae: 'UAE',
    uk: 'UK',
    'united states': 'United States',
    'united kingdom': 'United Kingdom',
    'united arab emirates': 'United Arab Emirates',
  };

  if (specialCases[cleaned]) {
    return specialCases[cleaned];
  }

  return toTitleCase(cleaned);
}

/**
 * Format status value with proper capitalization
 *
 * @example
 * formatStatus("active") // "Active"
 * formatStatus("expiring_soon") // "Expiring Soon"
 * formatStatus("not_started") // "Not Started"
 */
export function formatStatus(status: string | null | undefined): string {
  if (!status) return '';

  const cleaned = status.trim().toLowerCase();
  if (!cleaned) return '';

  // Replace underscores and hyphens with spaces
  const withSpaces = cleaned.replace(/[_-]/g, ' ');

  // Apply title case
  return toTitleCase(withSpaces);
}

/**
 * Format email address (lowercase)
 *
 * @example
 * formatEmail("John.Doe@Example.COM") // "john.doe@example.com"
 */
export function formatEmail(email: string | null | undefined): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

/**
 * Format phone number for display
 * Removes extra spaces and normalizes format
 *
 * @example
 * formatPhone("+971  50  123  4567") // "+971 50 123 4567"
 * formatPhone("00971501234567") // "00971 50 123 4567"
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '';

  const cleaned = phone.trim().replace(/\s+/g, ' ');
  return cleaned;
}

/**
 * Truncate text with ellipsis
 *
 * @example
 * truncateText("This is a very long text", 10) // "This is a..."
 */
export function truncateText(
  text: string | null | undefined,
  maxLength: number
): string {
  if (!text) return '';

  const cleaned = text.trim();
  if (cleaned.length <= maxLength) return cleaned;

  return `${cleaned.slice(0, maxLength)}...`;
}

/**
 * Format display name from various name fields
 * Applies proper Title Case formatting
 *
 * @example
 * formatDisplayName("john", "doe") // "John Doe"
 * formatDisplayName("john doe") // "John Doe"
 */
export function formatDisplayName(
  firstName?: string | null,
  lastName?: string | null,
  fullName?: string | null
): string {
  // If full name provided, use it
  if (fullName) {
    return toTitleCase(fullName);
  }

  // Combine first and last name
  const parts = [firstName, lastName].filter(Boolean);
  if (parts.length > 0) {
    return toTitleCase(parts.join(' '));
  }

  return '';
}

/**
 * Format job title with proper capitalization
 *
 * @example
 * formatJobTitle("senior sales manager") // "Senior Sales Manager"
 * formatJobTitle("CEO") // "CEO"
 */
export function formatJobTitle(title: string | null | undefined): string {
  if (!title) return '';

  const cleaned = title.trim();
  if (!cleaned) return '';

  // Keep all-caps acronyms as-is (e.g., CEO, CTO)
  if (cleaned === cleaned.toUpperCase() && cleaned.length <= 5) {
    return cleaned;
  }

  return toTitleCase(cleaned);
}

/**
 * Format address with proper capitalization
 *
 * @example
 * formatAddress("123 main street") // "123 Main Street"
 */
export function formatAddress(address: string | null | undefined): string {
  if (!address) return '';
  return toTitleCase(address);
}

/**
 * Format city name
 *
 * @example
 * formatCity("new york") // "New York"
 * formatCity("al ain") // "Al Ain"
 */
export function formatCity(city: string | null | undefined): string {
  if (!city) return '';
  return toTitleCase(city);
}

/**
 * Check if text is truncated by CSS
 * Useful for adding tooltips
 */
export function isTextTruncated(element: HTMLElement | null): boolean {
  if (!element) return false;
  return element.scrollWidth > element.clientWidth;
}
