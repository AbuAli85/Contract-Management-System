import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/docs
 * API Documentation endpoint
 */
export async function GET(request: NextRequest) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://portal.thesmartpro.io';

  const documentation = {
    title: 'TheSmartPro.io Platform API',
    version: '1.0.0',
    baseUrl: `${baseUrl}/api`,
    description: 'RESTful API for TheSmartPro.io Contract Management Platform',
    authentication: {
      methods: [
        {
          type: 'API Key',
          description: 'Bearer token authentication using API keys',
          header: 'Authorization: Bearer <api_key>',
          alternative: 'X-API-Key: <api_key>',
          howToGet: 'Generate API keys via /api/admin/api-keys (admin only)',
        },
        {
          type: 'Session',
          description: 'Cookie-based session authentication',
          header: 'Cookie: sb-<project-ref>-auth-token=<session-token>',
          howToGet: 'Login via /api/auth/login',
        },
      ],
    },
    endpoints: {
      public: {
        'GET /api/dashboard/public-stats': {
          description:
            'Get public platform statistics (no authentication required)',
          authentication: 'Optional (API key for enhanced stats)',
          parameters: {},
          response: {
            basic: {
              totalContracts: 'number',
              totalPromoters: 'number',
              totalParties: 'number',
            },
            enhanced: {
              totalContracts: 'number',
              activeContracts: 'number',
              pendingContracts: 'number',
              totalPromoters: 'number',
              activePromoters: 'number',
              totalParties: 'number',
            },
          },
          example: {
            url: `${baseUrl}/api/dashboard/public-stats`,
            headers: {
              Authorization: 'Bearer tsp_...',
            },
          },
        },
        'GET /api/health-check': {
          description: 'Health check endpoint',
          authentication: 'None',
          response: {
            status: 'string',
            timestamp: 'string',
            services: 'object',
          },
        },
      },
      authenticated: {
        'GET /api/dashboard/stats': {
          description: 'Get detailed dashboard statistics',
          authentication: 'Required (Session or API Key)',
          permissions: ['read:dashboard'],
          response: {
            totalContracts: 'number',
            activeContracts: 'number',
            pendingContracts: 'number',
            totalPromoters: 'number',
            activePromoters: 'number',
            contractsByStatus: 'object',
            expiringDocuments: 'number',
          },
        },
        'GET /api/contracts': {
          description: 'List contracts with pagination and filtering',
          authentication: 'Required',
          permissions: ['read:contracts'],
          parameters: {
            page: 'number (optional, default: 1)',
            limit: 'number (optional, default: 20)',
            status:
              'string (optional: all, active, pending, approved, expired)',
            party_id: 'string (optional, UUID)',
          },
          response: {
            contracts: 'array',
            pagination: 'object',
          },
        },
        'GET /api/contracts/{id}': {
          description: 'Get single contract details',
          authentication: 'Required',
          permissions: ['read:contracts'],
          response: {
            success: 'boolean',
            contract: 'object',
          },
        },
        'GET /api/promoters': {
          description: 'List promoters with pagination',
          authentication: 'Required',
          permissions: ['read:promoters'],
          parameters: {
            page: 'number',
            limit: 'number',
            status: 'string (active, inactive, pending)',
            employer_id: 'string (UUID)',
          },
        },
        'GET /api/parties': {
          description: 'List parties (clients, employers, suppliers)',
          authentication: 'Required',
          permissions: ['read:parties'],
          parameters: {
            type: 'string (Client, Employer, Supplier)',
            page: 'number',
            limit: 'number',
          },
        },
      },
      admin: {
        'GET /api/admin/api-keys': {
          description: 'List all API keys (admin only)',
          authentication: 'Required (Admin session)',
          permissions: ['admin:manage'],
        },
        'POST /api/admin/api-keys': {
          description: 'Create a new API key',
          authentication: 'Required (Admin session)',
          permissions: ['admin:manage'],
          body: {
            name: 'string (required)',
            permissions: 'array (optional, default: [])',
            allowedOrigins: 'array (optional, default: [])',
            rateLimitPerMinute: 'number (optional, default: 100)',
            expiresAt: 'string (optional, ISO date)',
          },
          response: {
            success: 'boolean',
            apiKey: {
              id: 'string',
              name: 'string',
              key: 'string (only shown once!)',
              keyPrefix: 'string',
              permissions: 'array',
            },
          },
        },
        'PUT /api/admin/api-keys/{id}': {
          description: 'Update an API key',
          authentication: 'Required (Admin session)',
          permissions: ['admin:manage'],
        },
        'DELETE /api/admin/api-keys/{id}': {
          description: 'Deactivate an API key',
          authentication: 'Required (Admin session)',
          permissions: ['admin:manage'],
        },
      },
    },
    permissions: {
      'read:dashboard': 'Read dashboard statistics',
      'read:contracts': 'Read contract data',
      'read:promoters': 'Read promoter data',
      'read:parties': 'Read party data',
      'read:*': 'Read all resources',
      'admin:manage': 'Admin management access',
      '*': 'Full access',
    },
    rateLimiting: {
      default: '100 requests per minute per API key',
      public: '100 requests per minute per IP address',
    },
    cors: {
      enabled: true,
      allowedOrigins: 'Configurable per API key',
    },
    examples: {
      javascript: {
        publicStats: `
// Fetch public stats (no authentication)
const response = await fetch('${baseUrl}/api/dashboard/public-stats');
const stats = await response.json();
        `,
        authenticatedStats: `
// Fetch enhanced stats with API key
const response = await fetch('${baseUrl}/api/dashboard/public-stats', {
  headers: {
    'Authorization': 'Bearer tsp_YOUR_API_KEY_HERE'
  }
});
const stats = await response.json();
        `,
        contracts: `
// Fetch contracts with API key
const response = await fetch('${baseUrl}/api/contracts?page=1&limit=20&status=active', {
  headers: {
    'Authorization': 'Bearer tsp_YOUR_API_KEY_HERE'
  }
});
const data = await response.json();
        `,
      },
      curl: {
        publicStats: `
curl -X GET "${baseUrl}/api/dashboard/public-stats"
        `,
        authenticatedStats: `
curl -X GET "${baseUrl}/api/dashboard/public-stats" \\
  -H "Authorization: Bearer tsp_YOUR_API_KEY_HERE"
        `,
      },
    },
    support: {
      documentation: `${baseUrl}/api/docs`,
      healthCheck: `${baseUrl}/api/health-check`,
      issues: 'Contact platform administrator',
    },
  };

  return NextResponse.json(documentation, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
