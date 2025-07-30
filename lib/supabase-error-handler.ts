// Enhanced error handling for Supabase operations
export interface SupabaseErrorDetails {
  code: string
  message: string
  status: number
  details?: any
  timestamp: string
  requestId?: string
  userId?: string
  operation?: string
}

export class SupabaseErrorHandler {
  // Error codes mapping
  static readonly ERROR_CODES = {
    // Authentication errors
    AUTH_INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
    AUTH_USER_NOT_FOUND: "AUTH_USER_NOT_FOUND",
    AUTH_EMAIL_NOT_CONFIRMED: "AUTH_EMAIL_NOT_CONFIRMED",
    AUTH_WEAK_PASSWORD: "AUTH_WEAK_PASSWORD",
    AUTH_USER_EXISTS: "AUTH_USER_EXISTS",
    AUTH_SESSION_EXPIRED: "AUTH_SESSION_EXPIRED",
    AUTH_REFRESH_FAILED: "AUTH_REFRESH_FAILED",

    // Database errors
    DB_CONNECTION_FAILED: "DB_CONNECTION_FAILED",
    DB_TIMEOUT: "DB_TIMEOUT",
    DB_RATE_LIMIT: "DB_RATE_LIMIT",
    DB_FOREIGN_KEY_VIOLATION: "DB_FOREIGN_KEY_VIOLATION",
    DB_UNIQUE_CONSTRAINT: "DB_UNIQUE_CONSTRAINT",
    DB_TABLE_NOT_FOUND: "DB_TABLE_NOT_FOUND",
    DB_PERMISSION_DENIED: "DB_PERMISSION_DENIED",
    DB_ROW_LEVEL_SECURITY: "DB_ROW_LEVEL_SECURITY",

    // Network errors
    NETWORK_TIMEOUT: "NETWORK_TIMEOUT",
    NETWORK_CONNECTION_REFUSED: "NETWORK_CONNECTION_REFUSED",
    NETWORK_UNREACHABLE: "NETWORK_UNREACHABLE",

    // Client errors
    CLIENT_INITIALIZATION_ERROR: "CLIENT_INITIALIZATION_ERROR",
    CLIENT_STORAGE_ERROR: "CLIENT_STORAGE_ERROR",
    CLIENT_SSR_MODE: "CLIENT_SSR_MODE",

    // Generic errors
    UNKNOWN_ERROR: "UNKNOWN_ERROR",
    OPERATION_FAILED: "OPERATION_FAILED",
    VALIDATION_ERROR: "VALIDATION_ERROR",
  }

  // Create a standardized error object
  static createError(
    message: string,
    code: string,
    status: number = 500,
    details?: any,
    requestId?: string,
    userId?: string,
    operation?: string,
  ): SupabaseErrorDetails {
    return {
      code,
      message,
      status,
      details,
      timestamp: new Date().toISOString(),
      requestId,
      userId,
      operation,
    }
  }

  // Handle authentication errors
  static handleAuthError(error: any, requestId?: string, userId?: string): SupabaseErrorDetails {
    const errorMessage = error?.message || "Authentication error"

    if (errorMessage.includes("Invalid login credentials")) {
      return this.createError(
        "Invalid email or password",
        this.ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        401,
        error,
        requestId,
        userId,
        "auth.signInWithPassword",
      )
    }

    if (errorMessage.includes("Email not confirmed")) {
      return this.createError(
        "Please verify your email address before signing in",
        this.ERROR_CODES.AUTH_EMAIL_NOT_CONFIRMED,
        401,
        error,
        requestId,
        userId,
        "auth.signInWithPassword",
      )
    }

    if (errorMessage.includes("User not found")) {
      return this.createError(
        "User not found",
        this.ERROR_CODES.AUTH_USER_NOT_FOUND,
        404,
        error,
        requestId,
        userId,
        "auth.signInWithPassword",
      )
    }

    if (errorMessage.includes("Password should be at least")) {
      return this.createError(
        "Password must be at least 6 characters long",
        this.ERROR_CODES.AUTH_WEAK_PASSWORD,
        400,
        error,
        requestId,
        userId,
        "auth.signUp",
      )
    }

    if (errorMessage.includes("User already registered")) {
      return this.createError(
        "An account with this email already exists",
        this.ERROR_CODES.AUTH_USER_EXISTS,
        409,
        error,
        requestId,
        userId,
        "auth.signUp",
      )
    }

    if (errorMessage.includes("JWT expired")) {
      return this.createError(
        "Session has expired. Please log in again.",
        this.ERROR_CODES.AUTH_SESSION_EXPIRED,
        401,
        error,
        requestId,
        userId,
        "auth.refreshSession",
      )
    }

    // Default auth error
    return this.createError(
      "Authentication failed",
      this.ERROR_CODES.AUTH_INVALID_CREDENTIALS,
      401,
      error,
      requestId,
      userId,
      "auth",
    )
  }

  // Handle database errors
  static handleDatabaseError(
    error: any,
    requestId?: string,
    userId?: string,
    operation?: string,
  ): SupabaseErrorDetails {
    const errorCode = error?.code
    const errorMessage = error?.message || "Database error"

    // PostgreSQL error codes
    if (errorCode === "23505") {
      // Unique constraint violation
      return this.createError(
        "Resource already exists",
        this.ERROR_CODES.DB_UNIQUE_CONSTRAINT,
        409,
        error,
        requestId,
        userId,
        operation,
      )
    }

    if (errorCode === "23503") {
      // Foreign key violation
      return this.createError(
        "Referenced resource not found",
        this.ERROR_CODES.DB_FOREIGN_KEY_VIOLATION,
        400,
        error,
        requestId,
        userId,
        operation,
      )
    }

    if (errorCode === "42P01") {
      // Table doesn't exist
      return this.createError(
        "Database table not found",
        this.ERROR_CODES.DB_TABLE_NOT_FOUND,
        500,
        error,
        requestId,
        userId,
        operation,
      )
    }

    if (errorCode === "42501") {
      // Permission denied
      return this.createError(
        "Permission denied",
        this.ERROR_CODES.DB_PERMISSION_DENIED,
        403,
        error,
        requestId,
        userId,
        operation,
      )
    }

    // Supabase-specific error codes
    if (errorCode === "PGRST301") {
      return this.createError(
        "Rate limit exceeded",
        this.ERROR_CODES.DB_RATE_LIMIT,
        429,
        error,
        requestId,
        userId,
        operation,
      )
    }

    if (errorCode === "PGRST302") {
      return this.createError(
        "Connection timeout",
        this.ERROR_CODES.DB_TIMEOUT,
        408,
        error,
        requestId,
        userId,
        operation,
      )
    }

    if (errorMessage.includes("new row violates row-level security policy")) {
      return this.createError(
        "Access denied by row-level security policy",
        this.ERROR_CODES.DB_ROW_LEVEL_SECURITY,
        403,
        error,
        requestId,
        userId,
        operation,
      )
    }

    // Default database error
    return this.createError(
      "Database operation failed",
      this.ERROR_CODES.OPERATION_FAILED,
      500,
      error,
      requestId,
      userId,
      operation,
    )
  }

  // Handle network errors
  static handleNetworkError(
    error: any,
    requestId?: string,
    userId?: string,
    operation?: string,
  ): SupabaseErrorDetails {
    const errorCode = error?.code
    const errorMessage = error?.message || "Network error"

    if (errorCode === "ECONNREFUSED") {
      return this.createError(
        "Service temporarily unavailable",
        this.ERROR_CODES.NETWORK_CONNECTION_REFUSED,
        503,
        error,
        requestId,
        userId,
        operation,
      )
    }

    if (errorCode === "ETIMEDOUT" || errorMessage.includes("timeout")) {
      return this.createError(
        "Request timeout",
        this.ERROR_CODES.NETWORK_TIMEOUT,
        408,
        error,
        requestId,
        userId,
        operation,
      )
    }

    if (errorCode === "ENOTFOUND" || errorMessage.includes("unreachable")) {
      return this.createError(
        "Service unreachable",
        this.ERROR_CODES.NETWORK_UNREACHABLE,
        503,
        error,
        requestId,
        userId,
        operation,
      )
    }

    // Default network error
    return this.createError(
      "Network error occurred",
      this.ERROR_CODES.NETWORK_TIMEOUT,
      500,
      error,
      requestId,
      userId,
      operation,
    )
  }

  // Handle client errors
  static handleClientError(
    error: any,
    requestId?: string,
    userId?: string,
    operation?: string,
  ): SupabaseErrorDetails {
    const errorMessage = error?.message || "Client error"

    if (errorMessage.includes("SSR mode")) {
      return this.createError(
        "Operation not available in server-side rendering mode",
        this.ERROR_CODES.CLIENT_SSR_MODE,
        503,
        error,
        requestId,
        userId,
        operation,
      )
    }

    if (errorMessage.includes("localStorage") || errorMessage.includes("storage")) {
      return this.createError(
        "Client storage error",
        this.ERROR_CODES.CLIENT_STORAGE_ERROR,
        500,
        error,
        requestId,
        userId,
        operation,
      )
    }

    if (errorMessage.includes("environment variables")) {
      return this.createError(
        "Client initialization error - missing environment variables",
        this.ERROR_CODES.CLIENT_INITIALIZATION_ERROR,
        500,
        error,
        requestId,
        userId,
        operation,
      )
    }

    // Default client error
    return this.createError(
      "Client operation failed",
      this.ERROR_CODES.CLIENT_INITIALIZATION_ERROR,
      500,
      error,
      requestId,
      userId,
      operation,
    )
  }

  // Main error handler that categorizes and handles all Supabase errors
  static handleError(
    error: any,
    operation: string = "unknown",
    requestId?: string,
    userId?: string,
  ): SupabaseErrorDetails {
    console.error(`❌ Supabase error in ${operation}:`, error)

    // Check if it's a known error type
    if (error && typeof error === "object") {
      const errorMessage = error.message || ""
      const errorCode = error.code || ""

      // Authentication errors
      if (
        errorMessage.includes("auth") ||
        errorMessage.includes("login") ||
        errorMessage.includes("password") ||
        errorMessage.includes("JWT") ||
        errorCode.startsWith("AUTH_")
      ) {
        return this.handleAuthError(error, requestId, userId, operation)
      }

      // Database errors
      if (
        errorCode.startsWith("PGRST") ||
        errorCode.startsWith("235") ||
        errorCode.startsWith("42") ||
        errorMessage.includes("database") ||
        errorMessage.includes("table") ||
        errorMessage.includes("row-level security")
      ) {
        return this.handleDatabaseError(error, requestId, userId, operation)
      }

      // Network errors
      if (
        errorCode.startsWith("E") ||
        errorMessage.includes("timeout") ||
        errorMessage.includes("connection") ||
        errorMessage.includes("network")
      ) {
        return this.handleNetworkError(error, requestId, userId, operation)
      }

      // Client errors
      if (
        errorMessage.includes("SSR") ||
        errorMessage.includes("localStorage") ||
        errorMessage.includes("environment")
      ) {
        return this.handleClientError(error, requestId, userId, operation)
      }
    }

    // Unknown error
    return this.createError(
      "An unexpected error occurred",
      this.ERROR_CODES.UNKNOWN_ERROR,
      500,
      error,
      requestId,
      userId,
      operation,
    )
  }

  // Format error for API response
  static formatErrorResponse(errorDetails: SupabaseErrorDetails) {
    return {
      success: false,
      error: errorDetails.message,
      code: errorDetails.code,
      status: errorDetails.status,
      timestamp: errorDetails.timestamp,
      requestId: errorDetails.requestId,
      ...(errorDetails.details && { details: errorDetails.details }),
    }
  }

  // Log error for monitoring (in production, send to monitoring service)
  static logError(errorDetails: SupabaseErrorDetails) {
    const logEntry = {
      level: "error",
      timestamp: errorDetails.timestamp,
      code: errorDetails.code,
      message: errorDetails.message,
      status: errorDetails.status,
      requestId: errorDetails.requestId,
      userId: errorDetails.userId,
      operation: errorDetails.operation,
      details: errorDetails.details,
    }

    // In development, log to console
    if (process.env.NODE_ENV === "development") {
      console.error("🔴 Supabase Error:", logEntry)
    }

    // In production, you would send this to your monitoring service
    // Example: Sentry.captureException(errorDetails)
    // Example: LogRocket.track('supabase_error', logEntry)

    return logEntry
  }

  // Check if error is retryable
  static isRetryableError(errorDetails: SupabaseErrorDetails): boolean {
    const retryableCodes = [
      this.ERROR_CODES.NETWORK_TIMEOUT,
      this.ERROR_CODES.NETWORK_CONNECTION_REFUSED,
      this.ERROR_CODES.DB_TIMEOUT,
      this.ERROR_CODES.DB_RATE_LIMIT,
      this.ERROR_CODES.AUTH_REFRESH_FAILED,
    ]

    return retryableCodes.includes(errorDetails.code)
  }

  // Get retry delay for retryable errors
  static getRetryDelay(errorDetails: SupabaseErrorDetails, attempt: number): number {
    const baseDelay = 1000 // 1 second
    const maxDelay = 30000 // 30 seconds

    if (errorDetails.code === this.ERROR_CODES.DB_RATE_LIMIT) {
      return Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
    }

    return Math.min(baseDelay * attempt, maxDelay)
  }
}
