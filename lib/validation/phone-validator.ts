/**
 * Phone Number Validation Utility
 *
 * Validates phone numbers to prevent incomplete entries like "00968"
 * Supports international formats with proper minimum length requirements
 */

export interface PhoneValidationResult {
  isValid: boolean;
  error?: string;
  formatted?: string;
}

/**
 * Validates a phone number
 *
 * Rules:
 * - Must contain only digits, spaces, hyphens, parentheses, and optional leading +
 * - Minimum 10 digits (country code + subscriber number)
 * - Maximum 15 digits (ITU-T E.164 standard)
 * - Cannot be just a country code (e.g., "00968" or "+968")
 *
 * @param phone - Phone number to validate
 * @param options - Validation options
 * @returns Validation result with error message if invalid
 */
export function validatePhoneNumber(
  phone: string | null | undefined,
  options: {
    required?: boolean;
    minDigits?: number;
    maxDigits?: number;
  } = {}
): PhoneValidationResult {
  const {
    required = false,
    minDigits = 10, // Minimum: country code + 8-digit number
    maxDigits = 15, // ITU-T E.164 standard maximum
  } = options;

  // Handle empty values
  if (!phone || phone.trim() === '') {
    if (required) {
      return {
        isValid: false,
        error: 'Phone number is required',
      };
    }
    return { isValid: true }; // Optional field, empty is OK
  }

  const trimmed = phone.trim();

  // Check for valid characters (digits, spaces, hyphens, parentheses, optional +)
  if (!/^[\+]?[0-9\s\-\(\)]+$/.test(trimmed)) {
    return {
      isValid: false,
      error:
        'Phone number can only contain digits, spaces, hyphens, and parentheses',
    };
  }

  // Extract only digits for length validation
  const digitsOnly = trimmed.replace(/\D/g, '');

  // Check minimum length
  if (digitsOnly.length < minDigits) {
    return {
      isValid: false,
      error: `Phone number must have at least ${minDigits} digits (including country code). Example: +968 9123 4567`,
    };
  }

  // Check maximum length
  if (digitsOnly.length > maxDigits) {
    return {
      isValid: false,
      error: `Phone number is too long (maximum ${maxDigits} digits)`,
    };
  }

  // Check if it's just a country code (common mistake)
  // Country codes are typically 1-3 digits
  if (digitsOnly.length <= 4) {
    return {
      isValid: false,
      error:
        'Phone number appears incomplete. Please include the full number after the country code.',
    };
  }

  // Additional validation: Check for suspicious patterns
  const suspiciousPatterns = [
    /^0{5,}/, // Five or more zeros at start (e.g., "00000")
    /^1{5,}/, // Five or more ones (e.g., "11111")
    /^(\d)\1{9,}/, // Same digit repeated 10+ times
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(digitsOnly)) {
      return {
        isValid: false,
        error:
          'Phone number appears invalid. Please check and enter a valid number.',
      };
    }
  }

  return {
    isValid: true,
    formatted: formatPhoneNumber(trimmed),
  };
}

/**
 * Formats a phone number for display
 *
 * Examples:
 * - "96891234567" → "+968 9123 4567"
 * - "00968 9123 4567" → "+968 9123 4567"
 * - "+1 (555) 123-4567" → "+1 555 123 4567"
 *
 * @param phone - Phone number to format
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';

  // Remove all non-digit characters except leading +
  const cleaned = phone.trim();
  const hasPlus = cleaned.startsWith('+');
  const digitsOnly = cleaned.replace(/\D/g, '');

  // Handle "00" prefix (international dialing code)
  let finalDigits = digitsOnly;
  if (digitsOnly.startsWith('00')) {
    finalDigits = digitsOnly.substring(2); // Remove "00"
  }

  // Don't format if too short
  if (finalDigits.length < 8) {
    return hasPlus ? `+${digitsOnly}` : digitsOnly;
  }

  // Format based on length and common patterns
  if (finalDigits.startsWith('968')) {
    // Oman format: +968 XXXX XXXX
    return `+968 ${finalDigits.substring(3, 7)} ${finalDigits.substring(7)}`;
  } else if (finalDigits.startsWith('971')) {
    // UAE format: +971 XX XXX XXXX
    return `+971 ${finalDigits.substring(3, 5)} ${finalDigits.substring(5, 8)} ${finalDigits.substring(8)}`;
  } else if (finalDigits.startsWith('966')) {
    // Saudi Arabia format: +966 XX XXX XXXX
    return `+966 ${finalDigits.substring(3, 5)} ${finalDigits.substring(5, 8)} ${finalDigits.substring(8)}`;
  } else if (finalDigits.startsWith('1') && finalDigits.length === 11) {
    // US/Canada format: +1 XXX XXX XXXX
    return `+1 ${finalDigits.substring(1, 4)} ${finalDigits.substring(4, 7)} ${finalDigits.substring(7)}`;
  } else {
    // Generic international format: +XXX XXXX...
    const countryCode = finalDigits.substring(0, 3);
    const rest = finalDigits.substring(3);

    // Split rest into groups of 4
    const groups = rest.match(/.{1,4}/g) || [];

    return `+${countryCode} ${groups.join(' ')}`;
  }
}

/**
 * Validates mobile number (stricter than phone)
 * Mobile numbers typically don't have area codes or extensions
 */
export function validateMobileNumber(
  mobile: string | null | undefined,
  required: boolean = false
): PhoneValidationResult {
  return validatePhoneNumber(mobile, {
    required,
    minDigits: 10, // Country code + 8 digits minimum
    maxDigits: 15,
  });
}

/**
 * Checks if a phone number appears to be incomplete
 * Used for identifying existing invalid data
 */
export function isIncompletePhoneNumber(
  phone: string | null | undefined
): boolean {
  if (!phone || phone.trim() === '') return false;

  const digitsOnly = phone.replace(/\D/g, '');

  // Too short (likely just country code)
  if (digitsOnly.length <= 4) return true;

  // Common incomplete patterns
  const incompletePatterns = [
    /^00968$/, // Just Oman country code
    /^968$/, // Oman code without prefix
    /^00971$/, // Just UAE country code
    /^971$/, // UAE code without prefix
    /^00966$/, // Just Saudi country code
    /^966$/, // Saudi code without prefix
    /^00\d{1,3}$/, // Any country code with 00 prefix only
    /^\+?\d{1,4}$/, // 1-4 digits (likely incomplete)
  ];

  return incompletePatterns.some(pattern => pattern.test(phone.trim()));
}

/**
 * Get example phone number for placeholder
 */
export function getPhoneNumberExample(countryCode: string = '968'): string {
  const examples: Record<string, string> = {
    '968': '+968 9123 4567', // Oman
    '971': '+971 50 123 4567', // UAE
    '966': '+966 50 123 4567', // Saudi Arabia
    '1': '+1 555 123 4567', // US/Canada
    '44': '+44 20 1234 5678', // UK
  };

  return examples[countryCode] || '+XXX XXXX XXXX';
}
