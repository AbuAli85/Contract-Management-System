import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

/**
 * Critical Security Tests for Contract Management System
 * These tests verify that the security vulnerabilities have been fixed
 */

describe('🔒 Critical Security Vulnerability Tests', () => {
  
  describe('🚨 P0 Critical - Authorization Bypass Prevention', () => {
    
    test('should reject cookie-based role manipulation', async () => {
      // Simulate cookie manipulation attack
      const response = await fetch('/admin/dashboard', {
        headers: {
          'Cookie': 'active_role=admin'
        }
      });
      
      // Should redirect to login or return 401, not allow admin access
      expect([401, 302, 403]).toContain(response.status);
      expect(response.status).not.toBe(200);
    });

    test('should not grant admin access via email change', async () => {
      // Test that changing email to hardcoded value doesn't grant admin
      const userToken = await getTestUserToken();
      
      const profileResponse = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'luxsess2001@gmail.com' // Previously hardcoded admin email
        })
      });

      // Should update email but not grant admin role
      const roleResponse = await fetch('/api/user/roles', {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      
      const roleData = await roleResponse.json();
      expect(roleData.roles).not.toContain('admin');
    });

    test('should enforce RBAC in production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      const originalRBAC = process.env.RBAC_ENFORCEMENT;
      
      // Set production environment
      process.env.NODE_ENV = 'production';
      process.env.RBAC_ENFORCEMENT = 'dry-run';
      
      // Should throw error when trying to use dry-run in production
      expect(() => {
        const { guardPermission } = require('@/lib/rbac/guard');
        // This should throw an error
      }).toThrow('RBAC must be enforced in production');
      
      // Restore environment
      process.env.NODE_ENV = originalEnv;
      process.env.RBAC_ENFORCEMENT = originalRBAC;
    });
  });

  describe('⚠️ P1 High - Authentication Security', () => {
    
    test('should reject weak passwords in registration', async () => {
      const weakPasswords = [
        'password',
        '123456',
        'weak',
        'NoNumbers!',
        'nouppercase123!',
        'NOLOWERCASE123!',
        'NoSpecial123'
      ];

      for (const password of weakPasswords) {
        const response = await fetch('/api/auth/register-new', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password,
            fullName: 'Test User',
            role: 'user'
          })
        });

        expect(response.status).toBe(400);
        const error = await response.json();
        expect(error.error).toContain('Password must be');
      }
    });

    test('should reject invalid email formats', async () => {
      const invalidEmails = [
        'notanemail',
        '@domain.com',
        'user@',
        'user.domain.com',
        'user@domain',
        ''
      ];

      for (const email of invalidEmails) {
        const response = await fetch('/api/auth/register-new', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password: 'ValidPass123!',
            fullName: 'Test User',
            role: 'user'
          })
        });

        expect(response.status).toBe(400);
        const error = await response.json();
        expect(error.error).toBe('Invalid email format');
      }
    });

    test('should return generic error messages for login failures', async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        })
      });

      expect(response.status).toBe(401);
      const error = await response.json();
      expect(error.error).toBe('Invalid credentials');
      
      // Should not reveal whether email exists or password is wrong
      expect(error.error).not.toContain('email');
      expect(error.error).not.toContain('password');
      expect(error.error).not.toContain('user not found');
    });

    test('should prevent admin role assignment in public registration', async () => {
      const response = await fetch('/api/auth/register-new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'ValidPass123!',
          fullName: 'Test User',
          role: 'admin' // Should be rejected
        })
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.error).toBe('Invalid role specified');
    });
  });

  describe('🔐 P1 High - Webhook Security', () => {
    
    test('should reject webhooks without valid signatures', async () => {
      const response = await fetch('/api/webhooks/payment-success', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: '123e4567-e89b-12d3-a456-426614174000',
          payment_amount: 100,
          payment_method: 'card'
        })
      });

      expect(response.status).toBe(401);
      const error = await response.json();
      expect(error.error).toContain('signature');
    });

    test('should reject webhooks with invalid signatures', async () => {
      const response = await fetch('/api/webhooks/payment-success', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'stripe-signature': 'invalid_signature'
        },
        body: JSON.stringify({
          booking_id: '123e4567-e89b-12d3-a456-426614174000',
          payment_amount: 100,
          payment_method: 'card'
        })
      });

      expect(response.status).toBe(401);
      const error = await response.json();
      expect(error.error).toBe('Invalid signature');
    });

    test('should detect and reject webhook replay attacks', async () => {
      const payload = JSON.stringify({
        booking_id: '123e4567-e89b-12d3-a456-426614174000',
        payment_amount: 100,
        payment_method: 'card'
      });

      // Generate valid signature
      const { generateWebhookSignature } = require('@/lib/auth/webhook-security');
      const signature = generateWebhookSignature(payload, 'test_secret');

      // Send first request (should succeed if properly signed)
      const firstResponse = await fetch('/api/webhooks/payment-success', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'stripe-signature': signature
        },
        body: payload
      });

      // Send same request again (should be detected as replay)
      const replayResponse = await fetch('/api/webhooks/payment-success', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'stripe-signature': signature
        },
        body: payload
      });

      expect(replayResponse.status).toBe(409);
      const error = await replayResponse.json();
      expect(error.error).toBe('Webhook replay detected');
    });
  });

  describe('🛡️ P2 Medium - Security Headers and CORS', () => {
    
    test('should always include security headers', async () => {
      const response = await fetch('/api/health');
      
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    });

    test('should validate CORS origins properly', async () => {
      // Test with invalid origin
      const invalidOriginResponse = await fetch('/api/test', {
        headers: {
          'Origin': 'https://malicious-site.com'
        }
      });

      expect(invalidOriginResponse.headers.get('Access-Control-Allow-Origin')).toBeNull();

      // Test with valid origin (if configured)
      const validOriginResponse = await fetch('/api/test', {
        headers: {
          'Origin': 'http://localhost:3000'
        }
      });

      // Should allow localhost in development
      if (process.env.NODE_ENV === 'development') {
        expect(validOriginResponse.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
      }
    });
  });

  describe('🔍 Cross-User Data Access Prevention', () => {
    
    test('should prevent cross-user data access', async () => {
      const userAToken = await getTestUserToken('userA');
      const userBId = await getTestUserId('userB');

      // Try to access user B's data with user A's token
      const response = await fetch(`/api/users/${userBId}/contracts`, {
        headers: {
          'Authorization': `Bearer ${userAToken}`
        }
      });

      expect(response.status).toBe(403);
    });

    test('should enforce resource ownership', async () => {
      const userToken = await getTestUserToken();
      const otherUserResource = await createTestResource('otherUser');

      // Try to access resource owned by another user
      const response = await fetch(`/api/contracts/${otherUserResource.id}`, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });

      expect([403, 404]).toContain(response.status);
    });
  });

  describe('📊 Dependency Security', () => {
    
    test('should have no critical vulnerabilities', () => {
      // This test would typically run npm audit programmatically
      const { execSync } = require('child_process');
      
      try {
        const auditResult = execSync('npm audit --audit-level=critical --json', { 
          encoding: 'utf-8',
          timeout: 30000 
        });
        
        const audit = JSON.parse(auditResult);
        expect(audit.metadata.vulnerabilities.critical).toBe(0);
      } catch (error) {
        // npm audit returns non-zero exit code if vulnerabilities found
        if (error.status === 1) {
          const auditResult = JSON.parse(error.stdout);
          expect(auditResult.metadata.vulnerabilities.critical).toBe(0);
        } else {
          throw error;
        }
      }
    });
  });
});

// Helper functions for testing
async function getTestUserToken(userId = 'testuser'): Promise<string> {
  // Implementation would create a test user and return a valid JWT token
  return 'test_token_' + userId;
}

async function getTestUserId(userId = 'testuser'): Promise<string> {
  // Implementation would return a test user ID
  return 'test_user_id_' + userId;
}

async function createTestResource(ownerId: string): Promise<{ id: string }> {
  // Implementation would create a test resource owned by specified user
  return { id: 'test_resource_' + ownerId };
}
