import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hashApiKey } from '@/lib/api-key-auth';
import { withRBAC } from '@/lib/rbac/guard';
import crypto from 'crypto';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Generate a new API key
 */
function generateApiKey(): { key: string; prefix: string; hash: string } {
  // Generate a secure random key
  const randomBytes = crypto.randomBytes(32);
  const key = `tsp_${randomBytes.toString('base64url')}`;
  const prefix = key.substring(0, 4); // "tsp_"
  const hash = hashApiKey(key);
  
  return { key, prefix, hash };
}

/**
 * GET /api/admin/api-keys
 * List all API keys (admin only)
 */
export const GET = withRBAC('admin:manage', async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    
    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all API keys
    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching API keys:', error);
      return NextResponse.json(
        { error: 'Failed to fetch API keys', details: error.message },
        { status: 500 }
      );
    }

    // Don't expose key hashes - only show prefixes
    const sanitizedKeys = apiKeys.map(key => ({
      id: key.id,
      name: key.name,
      keyPrefix: key.key_prefix,
      permissions: key.permissions,
      allowedOrigins: key.allowed_origins,
      rateLimitPerMinute: key.rate_limit_per_minute,
      isActive: key.is_active,
      expiresAt: key.expires_at,
      lastUsedAt: key.last_used_at,
      createdAt: key.created_at,
      updatedAt: key.updated_at,
    }));

    return NextResponse.json({
      success: true,
      apiKeys: sanitizedKeys,
      count: sanitizedKeys.length,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/api-keys:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/admin/api-keys
 * Create a new API key
 */
export const POST = withRBAC('admin:manage', async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    
    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const {
      name,
      permissions = [],
      allowedOrigins = [],
      rateLimitPerMinute = 100,
      expiresAt = null,
    } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Validate permissions format
    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Permissions must be an array' },
        { status: 400 }
      );
    }

    // Generate API key
    const { key, prefix, hash } = generateApiKey();

    // Insert into database
    const { data: apiKeyRecord, error: insertError } = await supabase
      .from('api_keys')
      .insert({
        name: name.trim(),
        key_hash: hash,
        key_prefix: prefix,
        permissions: permissions,
        allowed_origins: allowedOrigins,
        rate_limit_per_minute: rateLimitPerMinute,
        expires_at: expiresAt || null,
        created_by: user.id,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating API key:', insertError);
      return NextResponse.json(
        { error: 'Failed to create API key', details: insertError.message },
        { status: 500 }
      );
    }

    // Return the full key ONLY ONCE (for security)
    return NextResponse.json({
      success: true,
      message: 'API key created successfully',
      apiKey: {
        id: apiKeyRecord.id,
        name: apiKeyRecord.name,
        key: key, // ⚠️ Only returned once - save this!
        keyPrefix: prefix,
        permissions: apiKeyRecord.permissions,
        allowedOrigins: apiKeyRecord.allowed_origins,
        rateLimitPerMinute: apiKeyRecord.rate_limit_per_minute,
        expiresAt: apiKeyRecord.expires_at,
        createdAt: apiKeyRecord.created_at,
      },
      warning: 'Save this API key now - it will not be shown again!',
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/api-keys:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

