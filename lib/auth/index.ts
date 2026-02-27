/**
 * Auth Utilities — Central export for all authentication helpers.
 *
 * Import from this file rather than individual auth modules to
 * keep imports clean and consistent across the codebase.
 */

// Brute-force protection
export {
  checkBruteForce,
  recordFailedAttempt,
  clearFailedAttempts,
  getClientIP,
} from './brute-force-protection';

export type { BruteForceCheckResult } from './brute-force-protection';

// MFA service
export { MFAService } from './mfa-service';

// Password validation (from security module)
export {
  validatePassword,
  calculatePasswordStrength as getPasswordStrength,
  PASSWORD_REQUIREMENTS,
} from '../security/password-validation';

// Session management helpers
export {
  getServerUser,
  getServerSession,
  requireServerAuth,
} from './server-auth';
