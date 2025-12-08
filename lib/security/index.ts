/**
 * Security Module - Central export for all security utilities
 * 
 * This module provides comprehensive security features including:
 * - Input validation and sanitization
 * - CSRF protection
 * - CSP nonce generation
 * - Rate limiting utilities
 * - Password validation
 * 
 * @module lib/security
 */

// Input validation and sanitization
export * from './input-validator';

// CSRF token management
export * from './csrf-protection';

// CSP nonce generation (server-side only)
export { generateNonce, buildCSPWithNonce, buildCSPReportOnly } from './csp-nonce';

// CSP nonce context (client-side)
// Note: Import NonceProvider and useNonce directly from './nonce-context' in components
// export * from './nonce-context'; // Uncomment when client components need it

// Re-export common security utilities
// These are exported from their specific modules but available here for convenience

/**
 * Security best practices summary:
 * 
 * 1. INPUT VALIDATION
 *    - Always validate user input on both client and server
 *    - Use validateInput() for comprehensive validation
 *    - Sanitize HTML content with sanitizeHtml()
 * 
 * 2. CSRF PROTECTION
 *    - Include CSRF tokens in all state-changing requests
 *    - Validate tokens in API routes using validateCSRFToken()
 *    - Use getCSRFToken() to get the current token for requests
 * 
 * 3. CONTENT SECURITY POLICY
 *    - Use nonce-based CSP for inline scripts/styles
 *    - Generate nonces per-request with generateNonce()
 *    - Use NonceProvider in layout to pass nonce to components
 * 
 * 4. PASSWORD SECURITY
 *    - Use validatePasswordComprehensive() for password validation
 *    - Check against breach databases (HIBP)
 *    - Enforce password history
 * 
 * 5. RATE LIMITING
 *    - Apply rate limits to all API endpoints
 *    - Use stricter limits for authentication endpoints
 *    - Implement progressive delays for failed attempts
 * 
 * 6. OUTPUT ENCODING
 *    - Encode all output appropriately for the context
 *    - Use React's built-in escaping for JSX
 *    - Use encodeForContext() for manual encoding
 */

