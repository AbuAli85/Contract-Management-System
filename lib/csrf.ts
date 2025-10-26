import Tokens from 'csrf';

const tokens = new Tokens();

/**
 * Generate a CSRF token for form protection
 * @returns A CSRF token string
 */
export function generateCSRFToken(): string {
  const secret = process.env.CSRF_SECRET || 'default-secret-change-in-production';
  return tokens.create(secret);
}

/**
 * Verify a CSRF token
 * @param token The token to verify
 * @returns True if valid, false otherwise
 */
export function verifyCSRFToken(token: string): boolean {
  const secret = process.env.CSRF_SECRET || 'default-secret-change-in-production';
  return tokens.verify(secret, token);
}

