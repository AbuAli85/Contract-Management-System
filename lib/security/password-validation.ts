/**
 * Password Security and Validation
 * Implements comprehensive password strength checking and validation
 */

export interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
  description: string;
}

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4; // 0=very weak, 1=weak, 2=medium, 3=strong, 4=very strong
  label: 'very weak' | 'weak' | 'medium' | 'strong' | 'very strong';
  color: string;
  percentage: number;
  passedRequirements: string[];
  failedRequirements: string[];
  isValid: boolean;
}

/**
 * Password requirements
 */
export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    label: 'Minimum 8 characters',
    test: password => password.length >= 8,
    description: 'Password must be at least 8 characters long',
  },
  {
    label: 'At least one uppercase letter',
    test: password => /[A-Z]/.test(password),
    description: 'Include at least one uppercase letter (A-Z)',
  },
  {
    label: 'At least one lowercase letter',
    test: password => /[a-z]/.test(password),
    description: 'Include at least one lowercase letter (a-z)',
  },
  {
    label: 'At least one number',
    test: password => /[0-9]/.test(password),
    description: 'Include at least one number (0-9)',
  },
  {
    label: 'At least one special character',
    test: password => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    description: 'Include at least one special character (!@#$%^&*...)',
  },
];

/**
 * Validate password against requirements
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
  passedRequirements: string[];
  failedRequirements: string[];
} {
  const errors: string[] = [];
  const passedRequirements: string[] = [];
  const failedRequirements: string[] = [];

  PASSWORD_REQUIREMENTS.forEach(requirement => {
    if (requirement.test(password)) {
      passedRequirements.push(requirement.label);
    } else {
      failedRequirements.push(requirement.label);
      errors.push(requirement.description);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    passedRequirements,
    failedRequirements,
  };
}

/**
 * Calculate password strength score
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      label: 'very weak',
      color: '#ef4444',
      percentage: 0,
      passedRequirements: [],
      failedRequirements: PASSWORD_REQUIREMENTS.map(r => r.label),
      isValid: false,
    };
  }

  let score = 0;
  const validation = validatePassword(password);

  // Base score from requirements (0-5 points)
  score = validation.passedRequirements.length;

  // Bonus points for length
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Bonus for variety
  const hasUpperAndLower = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasLettersAndNumbers =
    /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
    password
  );

  if (hasUpperAndLower && hasLettersAndNumbers) score += 1;
  if (hasSpecialChars && password.length >= 10) score += 1;

  // Penalty for common patterns
  if (/^[a-z]+$/i.test(password)) score -= 1; // Only letters
  if (/^[0-9]+$/.test(password)) score -= 1; // Only numbers
  if (/(.)\1{2,}/.test(password)) score -= 1; // Repeated characters
  if (/(123|abc|qwerty|password|admin)/i.test(password)) score -= 2; // Common words

  // Normalize score to 0-4
  const normalizedScore = Math.max(0, Math.min(4, score)) as 0 | 1 | 2 | 3 | 4;

  const strengthMap: Record<0 | 1 | 2 | 3 | 4, PasswordStrength> = {
    0: {
      score: 0,
      label: 'very weak',
      color: '#ef4444',
      percentage: 20,
      passedRequirements: validation.passedRequirements,
      failedRequirements: validation.failedRequirements,
      isValid: false,
    },
    1: {
      score: 1,
      label: 'weak',
      color: '#f97316',
      percentage: 40,
      passedRequirements: validation.passedRequirements,
      failedRequirements: validation.failedRequirements,
      isValid: false,
    },
    2: {
      score: 2,
      label: 'medium',
      color: '#eab308',
      percentage: 60,
      passedRequirements: validation.passedRequirements,
      failedRequirements: validation.failedRequirements,
      isValid: validation.isValid,
    },
    3: {
      score: 3,
      label: 'strong',
      color: '#22c55e',
      percentage: 80,
      passedRequirements: validation.passedRequirements,
      failedRequirements: validation.failedRequirements,
      isValid: validation.isValid,
    },
    4: {
      score: 4,
      label: 'very strong',
      color: '#16a34a',
      percentage: 100,
      passedRequirements: validation.passedRequirements,
      failedRequirements: validation.failedRequirements,
      isValid: validation.isValid,
    },
  };

  return strengthMap[normalizedScore];
}

/**
 * Check if password has been breached using haveibeenpwned API
 * Uses k-anonymity model - only first 5 chars of hash are sent
 */
export async function checkPasswordBreach(password: string): Promise<{
  isBreached: boolean;
  breachCount: number;
  error?: string;
}> {
  try {
    // Hash the password using SHA-1 (required by haveibeenpwned)
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const hash = hashHex.toUpperCase();

    // Use k-anonymity: only send first 5 characters
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);

    // Call haveibeenpwned API
    const response = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix}`,
      {
        headers: {
          'User-Agent': 'Contract-Management-System',
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to check password breach:', response.status);
      return {
        isBreached: false,
        breachCount: 0,
        error:
          'Unable to verify password security. Please ensure it meets all requirements.',
      };
    }

    const text = await response.text();
    const lines = text.split('\n');

    // Check if our hash suffix appears in the results
    for (const line of lines) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix === suffix && count) {
        return {
          isBreached: true,
          breachCount: parseInt(count, 10),
        };
      }
    }

    // Not found in breach database
    return {
      isBreached: false,
      breachCount: 0,
    };
  } catch (error) {
    console.error('Error checking password breach:', error);
    // Don't fail password validation if breach check fails
    return {
      isBreached: false,
      breachCount: 0,
      error:
        'Unable to verify password security. Please ensure it meets all requirements.',
    };
  }
}

/**
 * Hash password for storage (for password history)
 * Uses SHA-256 for password comparison (not for auth - Supabase handles that)
 */
export async function hashPasswordForHistory(
  password: string
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Check if password was used recently (password history)
 */
export async function checkPasswordHistory(
  userId: string | undefined,
  newPassword: string,
  limit: number = 5
): Promise<{
  isReused: boolean;
  message?: string;
}> {
  try {
    if (!userId) {
      // No user ID provided (e.g., during registration)
      return { isReused: false };
    }

    const newPasswordHash = await hashPasswordForHistory(newPassword);

    // Fetch recent password hashes from database
    const response = await fetch(
      `/api/auth/password-history/${userId}?limit=${limit}`
    );

    if (!response.ok) {
      console.error('Failed to fetch password history:', response.status);
      // Don't fail password change if history check fails
      return { isReused: false };
    }

    const data = await response.json();
    const previousHashes: string[] = data.hashes || [];

    // Check if new password matches any previous password
    if (previousHashes.includes(newPasswordHash)) {
      return {
        isReused: true,
        message: `This password was recently used. Please choose a different password. You cannot reuse your last ${limit} passwords.`,
      };
    }

    return { isReused: false };
  } catch (error) {
    console.error('Error checking password history:', error);
    // Don't fail password change if history check fails
    return { isReused: false };
  }
}

/**
 * Comprehensive password validation
 * Checks: requirements, strength, breaches, history
 */
export async function validatePasswordComprehensive(
  password: string,
  userId?: string,
  options: {
    checkBreach?: boolean;
    checkHistory?: boolean;
    requireMinimumStrength?: boolean;
  } = {}
): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
  strength: PasswordStrength;
  breachInfo?: { isBreached: boolean; breachCount: number } | undefined;
  historyInfo?: { isReused: boolean; message?: string } | undefined;
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Check basic requirements
  const validation = validatePassword(password);
  if (!validation.isValid) {
    errors.push(...validation.errors);
  }

  // 2. Calculate strength
  const strength = calculatePasswordStrength(password);

  // 3. Check minimum strength requirement
  if (options.requireMinimumStrength && strength.score < 2) {
    errors.push('Password is too weak. Please choose a stronger password.');
  }

  // 4. Check breach database (optional)
  let breachInfo: { isBreached: boolean; breachCount: number } | undefined =
    undefined;
  if (options.checkBreach) {
    breachInfo = await checkPasswordBreach(password);
    if (breachInfo.isBreached) {
      errors.push(
        `This password has been found in ${breachInfo.breachCount.toLocaleString()} data breaches. Please choose a different password.`
      );
    }
    if ((breachInfo as any).error) {
      warnings.push((breachInfo as any).error);
    }
  }

  // 5. Check password history (optional)
  let historyInfo: { isReused: boolean; message?: string } | undefined =
    undefined;
  if (options.checkHistory) {
    historyInfo = await checkPasswordHistory(userId, password);
    if (historyInfo.isReused && historyInfo.message) {
      errors.push(historyInfo.message);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    strength,
    breachInfo,
    historyInfo,
  };
}
