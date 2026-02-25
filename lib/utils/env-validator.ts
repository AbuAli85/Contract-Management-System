/**
 * Environment Variable Validator
 * Checks and validates required environment variables for the application
 */

export interface EnvCheckResult {
  isValid: boolean;
  missing: string[];
  invalid: string[];
  warnings: string[];
  environment: string;
  details: Record<string, boolean | string>;
}

// Required environment variables
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

// Optional but recommended environment variables
const RECOMMENDED_ENV_VARS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'RBAC_ENFORCEMENT',
] as const;

/**
 * Validates environment variables and returns detailed check results
 */
export function validateEnvironmentVariables(): EnvCheckResult {
  const result: EnvCheckResult = {
    isValid: true,
    missing: [],
    invalid: [],
    warnings: [],
    environment: process.env.NODE_ENV || 'unknown',
    details: {},
  };

  // Check required variables
  for (const varName of REQUIRED_ENV_VARS) {
    const value = process.env[varName];

    if (!value) {
      result.missing.push(varName);
      result.isValid = false;
      result.details[varName] = false;
    } else {
      result.details[varName] = true;

      // Validate format for specific variables
      if (varName === 'NEXT_PUBLIC_SUPABASE_URL') {
        if (!value.startsWith('http')) {
          result.invalid.push(`${varName} (must be a valid URL)`);
          result.isValid = false;
        }
      }

      if (varName === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
        if (value.length < 100) {
          result.invalid.push(
            `${varName} (seems too short, might be incorrect)`
          );
          result.isValid = false;
        }
      }
    }
  }

  // Check recommended variables (warnings only)
  for (const varName of RECOMMENDED_ENV_VARS) {
    const value = process.env[varName];

    if (!value) {
      result.warnings.push(
        `${varName} is not set (recommended for full functionality)`
      );
      result.details[varName] = 'not set';
    } else {
      result.details[varName] = varName === 'RBAC_ENFORCEMENT' ? value : true;
    }
  }

  return result;
}

/**
 * Checks if all required environment variables are present
 */
export function hasRequiredEnvVars(): boolean {
  return REQUIRED_ENV_VARS.every(varName => !!process.env[varName]);
}

/**
 * Gets a user-friendly error message for missing environment variables
 */
export function getEnvErrorMessage(checkResult: EnvCheckResult): string {
  if (checkResult.isValid && checkResult.warnings.length === 0) {
    return 'All environment variables are properly configured';
  }

  const messages: string[] = [];

  if (checkResult.missing.length > 0) {
    messages.push(
      `Missing required environment variables: ${checkResult.missing.join(', ')}`
    );
  }

  if (checkResult.invalid.length > 0) {
    messages.push(
      `Invalid environment variables: ${checkResult.invalid.join(', ')}`
    );
  }

  if (checkResult.warnings.length > 0) {
    messages.push(`Warnings: ${checkResult.warnings.join('; ')}`);
  }

  messages.push(
    '\nPlease check your .env.local file and ensure all required variables are set correctly.'
  );

  return messages.join('\n');
}

/**
 * Logs environment variable check results
 */
export function logEnvCheck(): void {
  const result = validateEnvironmentVariables();

  if (result.missing.length > 0) {
    console.error('❌ Missing variables:', result.missing);
  }

  if (result.invalid.length > 0) {
    console.error('❌ Invalid variables:', result.invalid);
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️  Warnings:', result.warnings);
  }

  if (result.isValid && result.warnings.length === 0) {
  }
}

/**
 * Throws an error if required environment variables are missing
 */
export function assertRequiredEnvVars(): void {
  const result = validateEnvironmentVariables();

  if (!result.isValid) {
    const errorMessage = getEnvErrorMessage(result);
    throw new Error(
      `Environment configuration error:\n\n${errorMessage}\n\nSee ENVIRONMENT_SETUP_GUIDE.md for help.`
    );
  }
}

/**
 * Gets RBAC enforcement mode safely
 */
export function getRBACMode(): 'enforce' | 'dry-run' | 'disabled' {
  const mode = process.env.RBAC_ENFORCEMENT?.toLowerCase();

  if (mode === 'enforce' || mode === 'true') return 'enforce';
  if (mode === 'disabled' || mode === 'false') return 'disabled';

  return 'dry-run'; // default
}

/**
 * Checks if RBAC bypass is enabled
 */
export function isRBACBypassed(): boolean {
  return (
    process.env.RBAC_BYPASS === 'true' ||
    process.env.RBAC_ENFORCEMENT === 'disabled'
  );
}
