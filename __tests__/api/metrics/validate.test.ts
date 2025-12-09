/**
 * API Tests for Metrics Validation Endpoint
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/metrics/validate/route';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'admin-user-id' } },
        error: null,
      }),
    },
    from: jest.fn((table: string) => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      }),
    })),
  })),
}));

jest.mock('@/lib/metrics', () => ({
  runFullDataIntegrityCheck: jest.fn().mockResolvedValue({
    metricsValidation: {
      isValid: true,
      errors: [],
      warnings: [],
    },
    consistencyChecks: [
      {
        checkName: 'test_check',
        status: 'PASS',
        message: 'All checks passed',
      },
    ],
    timestamp: new Date().toISOString(),
    overallStatus: 'PASS',
  }),
  validateMetrics: jest.fn().mockReturnValue({
    isValid: true,
    errors: [],
    warnings: [],
  }),
}));

describe('GET /api/metrics/validate', () => {
  it('should return 401 for unauthenticated requests', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    (createClient as jest.Mock).mockReturnValueOnce({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Not authenticated' },
        }),
      },
    });

    const request = new NextRequest(
      'http://localhost:3000/api/metrics/validate'
    );
    const response = await GET(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 403 for non-admin users', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    (createClient as jest.Mock).mockReturnValueOnce({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-id' } },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { role: 'user' },
          error: null,
        }),
      })),
    });

    const request = new NextRequest(
      'http://localhost:3000/api/metrics/validate'
    );
    const response = await GET(request);

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toContain('administrator');
  });

  it('should return integrity check report for admin users', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/metrics/validate'
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.report).toBeDefined();
    expect(data.report).toHaveProperty('metricsValidation');
    expect(data.report).toHaveProperty('consistencyChecks');
    expect(data.report).toHaveProperty('overallStatus');
  });
});

describe('POST /api/metrics/validate', () => {
  it('should return 400 when metrics data is missing', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/metrics/validate',
      {
        method: 'POST',
        body: JSON.stringify({}),
      }
    );

    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('required');
  });

  it('should validate provided metrics', async () => {
    const metricsData = {
      total: 100,
      active: 50,
      pending: 20,
      approved: 10,
      expired: 10,
      completed: 5,
      cancelled: 5,
      expiringSoon: 10,
      totalValue: 1000000,
      averageDuration: 365,
      byStatus: {},
    };

    const request = new NextRequest(
      'http://localhost:3000/api/metrics/validate',
      {
        method: 'POST',
        body: JSON.stringify({ metrics: metricsData }),
      }
    );

    const response = await POST(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.validation).toBeDefined();
    expect(data.validation).toHaveProperty('isValid');
  });
});
