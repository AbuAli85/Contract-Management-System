import { NextRequest } from 'next/server'

// Rate limiting storage (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
}

export function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  const key = identifier
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    })
    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetTime: now + windowMs
    }
  }

  if (record.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      resetTime: record.resetTime
    }
  }

  record.count++
  return {
    success: true,
    limit,
    remaining: limit - record.count,
    resetTime: record.resetTime
  }
}

export function getClientIdentifier(request: NextRequest): string {
  // Get IP address for rate limiting
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'
  return ip
}

export interface AuditLogEntry {
  timestamp: string
  userId?: string
  action: string
  resource?: string
  details?: any
  ip: string
  userAgent?: string
  success: boolean
}

export function createAuditLog(
  request: NextRequest,
  action: string,
  success: boolean,
  details?: any
): AuditLogEntry {
  return {
    timestamp: new Date().toISOString(),
    action,
    details,
    ip: getClientIdentifier(request),
    userAgent: request.headers.get('user-agent') || undefined,
    success
  }
}

export function logAuditEvent(entry: AuditLogEntry): void {
  if (process.env.ENABLE_AUDIT_LOGGING === 'true') {
    console.log(`[AUDIT] ${JSON.stringify(entry)}`)
    
    // In production, you would save this to a database or audit service
    // await saveAuditLog(entry)
  }
}

export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSize} bytes`
    }
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`
    }
  }

  return { valid: true }
}

export function sanitizeInput(input: string): string {
  // Basic XSS prevention
  return input
    .replace(/[<>\"']/g, '')
    .trim()
    .substring(0, 1000) // Limit length
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function generateSecureToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

export function hashPassword(password: string): Promise<string> {
  // In production, use bcrypt or similar
  // This is a placeholder implementation
  return Promise.resolve(btoa(password))
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}
