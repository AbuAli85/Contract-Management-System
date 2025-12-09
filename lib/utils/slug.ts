/**
 * Slug generation and handling utilities for SEO-friendly URLs
 */

/**
 * Generates a URL-friendly slug from a string
 * @param text - The text to convert to a slug
 * @returns A URL-safe slug
 */
export function generateSlug(text: string): string {
  return (
    text
      .toString()
      .toLowerCase()
      .trim()
      // Replace Arabic characters with transliteration or remove
      .normalize('NFD') // Normalize unicode
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^\w\s-]/g, '') // Remove non-word chars (except spaces and hyphens)
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+/, '') // Remove leading hyphens
      .replace(/-+$/, '')
  ); // Remove trailing hyphens
}

/**
 * Creates a slug from promoter name with fallback
 * @param nameEn - English name
 * @param nameAr - Arabic name
 * @param id - UUID for uniqueness
 * @returns A unique slug
 */
export function generatePromoterSlug(
  nameEn?: string | null,
  nameAr?: string | null,
  id?: string
): string {
  const name = nameEn || nameAr || 'promoter';
  const baseSlug = generateSlug(name);

  // Add first 8 characters of UUID for uniqueness
  const uniqueSuffix = id ? `-${id.slice(0, 8)}` : '';

  return `${baseSlug}${uniqueSuffix}`;
}

/**
 * Extracts UUID from a slug or returns the slug if it's already a UUID
 * @param slugOrId - Either a slug (e.g., "john-doe-3784d546") or UUID
 * @returns The UUID
 */
export function extractIdFromSlug(slugOrId: string): string {
  // Check if it's already a UUID
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(slugOrId)) {
    return slugOrId;
  }

  // Extract UUID from slug (last part after final hyphen, should be 8 chars)
  const parts = slugOrId.split('-');
  const lastPart = parts[parts.length - 1];

  // If the last part looks like a partial UUID (8 hex chars), search by it
  if (lastPart && /^[0-9a-f]{8}$/i.test(lastPart)) {
    return lastPart;
  }

  // Return as-is if we can't extract (will fail gracefully in query)
  return slugOrId;
}

/**
 * Checks if a string is a valid UUID
 * @param str - String to check
 * @returns True if valid UUID
 */
export function isUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}
