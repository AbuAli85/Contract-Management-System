/**
 * Next.js Instrumentation
 * 
 * This file runs security checks when the application starts.
 * It's automatically executed by Next.js in production builds.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only run in Node.js runtime (server-side)
    try {
      const { enforceSecurityChecks } = await import(
        './lib/security/production-checks'
      );
      
      // Run security checks on startup
      // In production, this will throw an error if critical issues are found
      enforceSecurityChecks();
    } catch (error) {
      // Log error but don't block startup in development
      if (process.env.NODE_ENV === 'production') {
        console.error('❌ Security checks failed:', error);
        throw error;
      } else {
        console.warn('⚠️ Security check warning (development mode):', error);
      }
    }
  }
}

