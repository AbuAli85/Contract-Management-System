export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export class ApiErrorHandler {
  static createError(
    message: string,
    code?: string,
    status: number = 500,
    details?: any
  ): ApiError {
    return {
      message,
      code,
      status,
      details,
    };
  }

  static handleAuthError(error: any): ApiError {
    if (error?.message?.includes('Invalid login credentials')) {
      return this.createError(
        'Invalid email or password',
        'INVALID_CREDENTIALS',
        401
      );
    }

    if (error?.message?.includes('Email not confirmed')) {
      return this.createError(
        'Please verify your email address before signing in',
        'EMAIL_NOT_CONFIRMED',
        401
      );
    }

    if (error?.message?.includes('User not found')) {
      return this.createError('User not found', 'USER_NOT_FOUND', 404);
    }

    if (error?.message?.includes('Too many requests')) {
      return this.createError(
        'Too many login attempts. Please try again later.',
        'RATE_LIMITED',
        429
      );
    }

    if (error?.message?.includes('Password should be at least')) {
      return this.createError(
        'Password must be at least 6 characters long',
        'WEAK_PASSWORD',
        400
      );
    }

    if (error?.message?.includes('User already registered')) {
      return this.createError(
        'An account with this email already exists',
        'USER_EXISTS',
        409
      );
    }

    // Default auth error
    return this.createError(
      'Authentication failed',
      'AUTH_ERROR',
      401,
      error?.message
    );
  }

  static handleDatabaseError(error: any): ApiError {
    if (error?.code === '23505') {
      // Unique constraint violation
      return this.createError(
        'Resource already exists',
        'DUPLICATE_ENTRY',
        409
      );
    }

    if (error?.code === '23503') {
      // Foreign key violation
      return this.createError(
        'Referenced resource not found',
        'FOREIGN_KEY_VIOLATION',
        400
      );
    }

    if (error?.code === '42P01') {
      // Table doesn't exist
      return this.createError(
        'Database table not found',
        'TABLE_NOT_FOUND',
        500
      );
    }

    // Default database error
    return this.createError(
      'Database operation failed',
      'DATABASE_ERROR',
      500,
      error?.message
    );
  }

  static handleValidationError(error: any): ApiError {
    if (error?.message?.includes('required')) {
      return this.createError(
        'Missing required fields',
        'VALIDATION_ERROR',
        400,
        error.details
      );
    }

    if (error?.message?.includes('invalid')) {
      return this.createError(
        'Invalid data provided',
        'VALIDATION_ERROR',
        400,
        error.details
      );
    }

    // Default validation error
    return this.createError(
      'Validation failed',
      'VALIDATION_ERROR',
      400,
      error?.message
    );
  }

  static handleNetworkError(error: any): ApiError {
    if (error?.code === 'ECONNREFUSED') {
      return this.createError(
        'Service temporarily unavailable',
        'SERVICE_UNAVAILABLE',
        503
      );
    }

    if (error?.code === 'ETIMEDOUT') {
      return this.createError('Request timeout', 'TIMEOUT', 408);
    }

    // Default network error
    return this.createError(
      'Network error occurred',
      'NETWORK_ERROR',
      500,
      error?.message
    );
  }

  static handleGenericError(error: any): ApiError {
    // Log the error for debugging

    // Return a generic error message to avoid exposing internal details
    return this.createError(
      'An unexpected error occurred',
      'INTERNAL_ERROR',
      500
    );
  }

  static formatErrorResponse(error: ApiError) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      ...(error.details && { details: error.details }),
    };
  }
}
