/**
 * API Key Authentication Middleware
 * Handles API key validation and authentication for external integrations
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  allowedOrigins: string[];
  rateLimitPerMinute: number;
  isActive: boolean;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdBy: string;
  createdAt: string;
}

export interface ApiKeyAuthResult {
  isValid: boolean;
  apiKey?: ApiKey;
  error?: string;
}

/**
 * Hash an API key using SHA-256
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Extract API key from request headers
 */
export function extractApiKey(request: NextRequest): string | null {
  // Check Authorization header: Bearer <api_key>
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  // Check X-API-Key header
  const apiKeyHeader = request.headers.get('x-api-key');
  if (apiKeyHeader) {
    return apiKeyHeader.trim();
  }

  // Check query parameter (less secure, but sometimes needed)
  const { searchParams } = new URL(request.url);
  const apiKeyParam = searchParams.get('api_key');
  if (apiKeyParam) {
    return apiKeyParam.trim();
  }

  return null;
}

/**
 * Validate API key and return key information
 */
export async function validateApiKey(
  apiKey: string
): Promise<ApiKeyAuthResult> {
  try {
    if (!apiKey || apiKey.length < 20) {
      return {
        isValid: false,
        error: 'Invalid API key format',
      };
    }

    // Hash the provided key
    const keyHash = hashApiKey(apiKey);
    const keyPrefix = apiKey.substring(0, 8);

    // Query database for matching key
    const supabase = await createClient();

    // Use service role client to bypass RLS for API key lookup
    const { createClient: createServiceClient } =
      await import('@supabase/supabase-js');
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: apiKeyRecord, error } = await serviceClient
      .from('api_keys')
      .select('*')
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .single();

    if (error || !apiKeyRecord) {
      return {
        isValid: false,
        error: 'Invalid API key',
      };
    }

    // Check if key has expired
    if (apiKeyRecord.expires_at) {
      const expiresAt = new Date(apiKeyRecord.expires_at);
      if (expiresAt < new Date()) {
        return {
          isValid: false,
          error: 'API key has expired',
        };
      }
    }

    // Update last_used_at
    await serviceClient
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKeyRecord.id);

    // Transform database record to ApiKey interface
    const apiKeyData: ApiKey = {
      id: apiKeyRecord.id,
      name: apiKeyRecord.name,
      keyPrefix: apiKeyRecord.key_prefix,
      permissions: apiKeyRecord.permissions || [],
      allowedOrigins: apiKeyRecord.allowed_origins || [],
      rateLimitPerMinute: apiKeyRecord.rate_limit_per_minute || 100,
      isActive: apiKeyRecord.is_active,
      expiresAt: apiKeyRecord.expires_at,
      lastUsedAt: apiKeyRecord.last_used_at,
      createdBy: apiKeyRecord.created_by,
      createdAt: apiKeyRecord.created_at,
    };

    return {
      isValid: true,
      apiKey: apiKeyData,
    };
  } catch (error) {
    console.error('Error validating API key:', error);
    return {
      isValid: false,
      error: 'Internal server error',
    };
  }
}

/**
 * Check if API key has required permission
 */
export function hasPermission(
  apiKey: ApiKey,
  requiredPermission: string
): boolean {
  if (!apiKey.permissions || apiKey.permissions.length === 0) {
    return false;
  }

  // Check exact match
  if (apiKey.permissions.includes(requiredPermission)) {
    return true;
  }

  // Check wildcard permissions (e.g., "read:*" matches "read:dashboard")
  const [action, resource] = requiredPermission.split(':');
  if (resource) {
    const wildcardPermission = `${action}:*`;
    if (apiKey.permissions.includes(wildcardPermission)) {
      return true;
    }
  }

  // Check admin permission
  if (
    apiKey.permissions.includes('*') ||
    apiKey.permissions.includes('admin')
  ) {
    return true;
  }

  return false;
}

/**
 * Check if origin is allowed for this API key
 */
export function isOriginAllowed(
  apiKey: ApiKey,
  origin: string | null
): boolean {
  // If no origins specified, allow all
  if (!apiKey.allowedOrigins || apiKey.allowedOrigins.length === 0) {
    return true;
  }

  if (!origin) {
    return false;
  }

  // Check exact match or subdomain match
  return apiKey.allowedOrigins.some(allowedOrigin => {
    if (origin === allowedOrigin) {
      return true;
    }
    // Allow subdomains (e.g., "*.example.com" matches "app.example.com")
    if (allowedOrigin.startsWith('*.')) {
      const domain = allowedOrigin.substring(2);
      return origin.endsWith(`.${domain}`) || origin === domain;
    }
    return false;
  });
}

/**
 * Middleware wrapper for API key authentication
 */
export function withApiKeyAuth(
  handler: (request: NextRequest, apiKey: ApiKey) => Promise<NextResponse>,
  requiredPermission?: string
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Extract API key from request
      const apiKey = extractApiKey(request);
      if (!apiKey) {
        return NextResponse.json(
          {
            error: 'API key required',
            message:
              'Please provide an API key in the Authorization header (Bearer <key>) or X-API-Key header',
          },
          { status: 401 }
        );
      }

      // Validate API key
      const validation = await validateApiKey(apiKey);
      if (!validation.isValid || !validation.apiKey) {
        return NextResponse.json(
          {
            error: 'Invalid API key',
            message:
              validation.error || 'The provided API key is invalid or expired',
          },
          { status: 401 }
        );
      }

      const apiKeyData = validation.apiKey;

      // Check origin if CORS is enabled
      const origin = request.headers.get('origin');
      if (!isOriginAllowed(apiKeyData, origin)) {
        return NextResponse.json(
          {
            error: 'Origin not allowed',
            message: `The origin "${origin}" is not allowed for this API key`,
          },
          { status: 403 }
        );
      }

      // Check permission if required
      if (
        requiredPermission &&
        !hasPermission(apiKeyData, requiredPermission)
      ) {
        return NextResponse.json(
          {
            error: 'Insufficient permissions',
            message: `This API key does not have the required permission: ${requiredPermission}`,
            required: requiredPermission,
            granted: apiKeyData.permissions,
          },
          { status: 403 }
        );
      }

      // Call the handler with validated API key
      return await handler(request, apiKeyData);
    } catch (error) {
      console.error('API key auth error:', error);
      return NextResponse.json(
        {
          error: 'Authentication error',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Log API key usage
 */
export async function logApiKeyUsage(
  apiKeyId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTimeMs: number,
  request: NextRequest
): Promise<void> {
  try {
    const { createClient: createServiceClient } =
      await import('@supabase/supabase-js');
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await serviceClient.from('api_key_usage_logs').insert({
      api_key_id: apiKeyId,
      endpoint,
      method,
      status_code: statusCode,
      response_time_ms: responseTimeMs,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  } catch (error) {
    console.error('Failed to log API key usage:', error);
    // Don't throw - logging failures shouldn't break the API
  }
}
