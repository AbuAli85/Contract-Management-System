import { createHash } from 'crypto'

export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return sanitizeString(input)
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput)
  }
  
  if (input && typeof input === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      const sanitizedKey = sanitizeString(key)
      sanitized[sanitizedKey] = sanitizeInput(value)
    }
    return sanitized
  }
  
  return input
}

function sanitizeString(str: string): string {
  if (typeof str !== 'string') return str
  
  return str
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove SQL injection patterns
    .replace(/('|(\\)|;|--|\/\*|\*\/|xp_|sp_|exec|execute|union|select|insert|update|delete|drop|create|alter|truncate)/gi, '')
    // Remove XSS patterns
    .replace(/(javascript:|vbscript:|onload|onerror|onclick|onmouseover|onfocus|onblur)/gi, '')
    // Limit length
    .substring(0, 10000)
    // Trim whitespace
    .trim()
}

export function validateInput(input: any, rules: ValidationRules): ValidationResult {
  const errors: string[] = []
  
  // Required check
  if (rules.required && (input === null || input === undefined || input === '')) {
    errors.push('This field is required')
  }
  
  // Type check
  if (input !== null && input !== undefined && rules.type) {
    const actualType = Array.isArray(input) ? 'array' : typeof input
    if (actualType !== rules.type) {
      errors.push(`Expected ${rules.type}, got ${actualType}`)
    }
  }
  
  // String validations
  if (typeof input === 'string') {
    if (rules.minLength && input.length < rules.minLength) {
      errors.push(`Minimum length is ${rules.minLength}`)
    }
    
    if (rules.maxLength && input.length > rules.maxLength) {
      errors.push(`Maximum length is ${rules.maxLength}`)
    }
    
    if (rules.pattern && !rules.pattern.test(input)) {
      errors.push('Invalid format')
    }
    
    if (rules.email && !isValidEmail(input)) {
      errors.push('Invalid email format')
    }
    
    if (rules.url && !isValidUrl(input)) {
      errors.push('Invalid URL format')
    }
    
    if (rules.noHTML && containsHTML(input)) {
      errors.push('HTML content is not allowed')
    }
    
    if (rules.noSQL && containsSQLInjection(input)) {
      errors.push('Potential SQL injection detected')
    }
  }
  
  // Number validations
  if (typeof input === 'number') {
    if (rules.min !== undefined && input < rules.min) {
      errors.push(`Minimum value is ${rules.min}`)
    }
    
    if (rules.max !== undefined && input > rules.max) {
      errors.push(`Maximum value is ${rules.max}`)
    }
  }
  
  // Array validations
  if (Array.isArray(input)) {
    if (rules.minItems && input.length < rules.minItems) {
      errors.push(`Minimum ${rules.minItems} items required`)
    }
    
    if (rules.maxItems && input.length > rules.maxItems) {
      errors.push(`Maximum ${rules.maxItems} items allowed`)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export interface ValidationRules {
  required?: boolean
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array'
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  email?: boolean
  url?: boolean
  noHTML?: boolean
  noSQL?: boolean
  minItems?: number
  maxItems?: number
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

// Common validation patterns
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-\(\)]{10,}$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  slug: /^[a-z0-9-]+$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
}

// Validation rule presets
export const VALIDATION_PRESETS = {
  email: {
    required: true,
    type: 'string' as const,
    email: true,
    maxLength: 255
  },
  password: {
    required: true,
    type: 'string' as const,
    minLength: 8,
    maxLength: 128,
    pattern: VALIDATION_PATTERNS.password
  },
  name: {
    required: true,
    type: 'string' as const,
    minLength: 1,
    maxLength: 100,
    noHTML: true,
    noSQL: true
  },
  description: {
    type: 'string' as const,
    maxLength: 1000,
    noSQL: true
  },
  phone: {
    type: 'string' as const,
    pattern: VALIDATION_PATTERNS.phone
  },
  uuid: {
    required: true,
    type: 'string' as const,
    pattern: VALIDATION_PATTERNS.uuid
  }
}

function isValidEmail(email: string): boolean {
  return VALIDATION_PATTERNS.email.test(email)
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

function containsHTML(str: string): boolean {
  return /<[^>]*>/g.test(str)
}

function containsSQLInjection(str: string): boolean {
  const sqlPatterns = [
    /('|(\\)|;|--|\/\*|\*\/)/gi,
    /(union|select|insert|update|delete|drop|create|alter|truncate|exec|execute)/gi,
    /(xp_|sp_)/gi
  ]
  
  return sqlPatterns.some(pattern => pattern.test(str))
}
