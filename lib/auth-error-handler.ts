export interface AuthErrorResponse {
  success: false
  error: string
  code?: string
}

export interface AuthSuccessResponse<T = any> {
  success: true
  data?: T
  message?: string
}

export type AuthResponse<T = any> = AuthSuccessResponse<T> | AuthErrorResponse

export class AuthErrorHandler {
  static createError(message: string, code?: string): AuthErrorResponse {
    return {
      success: false,
      error: message,
      code
    }
  }

  static createSuccess<T>(data?: T, message?: string): AuthSuccessResponse<T> {
    return {
      success: true,
      data,
      message
    }
  }

  static handleValidationError(field: string, message: string): AuthErrorResponse {
    return this.createError(`${field}: ${message}`, 'VALIDATION_ERROR')
  }

  static handleAuthError(error: any): AuthErrorResponse {
    if (error?.message) {
      return this.createError(error.message, 'AUTH_ERROR')
    }
    return this.createError('Authentication failed', 'AUTH_ERROR')
  }

  static handleGenericError(error: any): AuthErrorResponse {
    console.error('Auth error:', error)
    return this.createError('Internal server error', 'INTERNAL_ERROR')
  }
} 