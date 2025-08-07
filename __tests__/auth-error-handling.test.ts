import { describe, it, expect } from 'vitest'

// Mock Supabase error responses
const mockSupabaseErrors = {
  invalidCredentials: {
    message: "Invalid login credentials",
    status: 400
  },
  emailNotConfirmed: {
    message: "Email not confirmed",
    status: 400
  },
  tooManyRequests: {
    message: "Too many requests",
    status: 429
  },
  userNotFound: {
    message: "User not found",
    status: 404
  }
}

// Test error formatting function
function formatAuthError(error: any): string {
  if (!error?.message) {
    return "Authentication failed"
  }
  
  const message = error.message.toLowerCase()
  
  if (message.includes("invalid login credentials")) {
    return "Invalid email or password. Please try again."
  }
  if (message.includes("email not confirmed")) {
    return "Please check your email and confirm your account before signing in."
  }
  if (message.includes("too many requests")) {
    return "Too many login attempts. Please wait a few minutes before trying again."
  }
  if (message.includes("user not found")) {
    return "No account found with this email address."
  }
  
  return error.message
}

describe('Authentication Error Handling', () => {
  it('should format "Invalid login credentials" to user-friendly message', () => {
    const result = formatAuthError(mockSupabaseErrors.invalidCredentials)
    expect(result).toBe("Invalid email or password. Please try again.")
  })

  it('should format "Email not confirmed" to user-friendly message', () => {
    const result = formatAuthError(mockSupabaseErrors.emailNotConfirmed)
    expect(result).toBe("Please check your email and confirm your account before signing in.")
  })

  it('should format "Too many requests" to user-friendly message', () => {
    const result = formatAuthError(mockSupabaseErrors.tooManyRequests)
    expect(result).toBe("Too many login attempts. Please wait a few minutes before trying again.")
  })

  it('should format "User not found" to user-friendly message', () => {
    const result = formatAuthError(mockSupabaseErrors.userNotFound)
    expect(result).toBe("No account found with this email address.")
  })

  it('should handle unknown errors gracefully', () => {
    const unknownError = { message: "Some unknown error" }
    const result = formatAuthError(unknownError)
    expect(result).toBe("Some unknown error")
  })

  it('should handle null/undefined errors gracefully', () => {
    const result = formatAuthError(null)
    expect(result).toBe("Authentication failed")
  })
}) 