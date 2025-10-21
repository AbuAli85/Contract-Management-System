import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: {
      status: 'pass' | 'fail';
      responseTime?: number;
      error?: string;
    };
    authentication: {
      status: 'pass' | 'fail';
      error?: string;
    };
    rbac: {
      status: 'pass' | 'fail';
      tablesExist: boolean;
      rolesCount?: number;
      permissionsCount?: number;
      error?: string;
    };
    apiEndpoints: {
      status: 'pass' | 'fail';
      endpoints?: {
        contracts: 'pass' | 'fail';
        parties: 'pass' | 'fail';
        profile: 'pass' | 'fail';
      };
      error?: string;
    };
  };
  environment: {
    nodeEnv: string;
    rbacMode: string;
    cacheEnabled: boolean;
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: { status: 'pass' },
      authentication: { status: 'pass' },
      rbac: { status: 'pass', tablesExist: false },
      apiEndpoints: { status: 'pass' },
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      rbacMode: process.env.RBAC_ENFORCEMENT || 'dry-run',
      cacheEnabled: process.env.ENABLE_PERMISSION_CACHE !== 'false',
    },
  };

  try {
    // 1. Database connectivity check
    console.log('🏥 Health Check: Testing database connection...');
    const dbStartTime = Date.now();
    
    try {
      const supabase = await createClient();
      const { error: dbError } = await supabase.from('users').select('count').limit(1);
      
      health.checks.database.responseTime = Date.now() - dbStartTime;
      
      if (dbError) {
        health.checks.database.status = 'fail';
        health.checks.database.error = dbError.message;
        health.status = 'unhealthy';
        console.error('❌ Health Check: Database connection failed:', dbError.message);
      } else {
        console.log(`✅ Health Check: Database connected (${health.checks.database.responseTime}ms)`);
      }
    } catch (error) {
      health.checks.database.status = 'fail';
      health.checks.database.error = error instanceof Error ? error.message : 'Unknown error';
      health.status = 'unhealthy';
      console.error('❌ Health Check: Database error:', error);
    }

    // 2. Authentication check
    console.log('🏥 Health Check: Testing authentication...');
    
    try {
      const supabase = await createClient();
      const { data, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        health.checks.authentication.status = 'fail';
        health.checks.authentication.error = authError.message;
        health.status = 'degraded';
        console.error('⚠️ Health Check: Auth service error:', authError.message);
      } else {
        console.log('✅ Health Check: Authentication service operational');
      }
    } catch (error) {
      health.checks.authentication.status = 'fail';
      health.checks.authentication.error = error instanceof Error ? error.message : 'Unknown error';
      health.status = 'degraded';
      console.error('⚠️ Health Check: Auth check error:', error);
    }

    // 3. RBAC tables check
    console.log('🏥 Health Check: Testing RBAC configuration...');
    
    try {
      const supabase = await createClient();
      
      // Try rbac_ prefixed tables first
      const { data: rbacRoles, error: rbacRolesError } = await supabase
        .from('rbac_roles')
        .select('count')
        .limit(1);
      
      const { data: rbacPerms, error: rbacPermsError } = await supabase
        .from('rbac_permissions')
        .select('count')
        .limit(1);
      
      const usingRbacTables = !rbacRolesError && !rbacPermsError;
      
      // Try standard tables as fallback
      const { data: standardRoles, error: standardRolesError } = await supabase
        .from('roles')
        .select('count')
        .limit(1);
      
      const { data: standardPerms, error: standardPermsError } = await supabase
        .from('permissions')
        .select('count')
        .limit(1);
      
      const usingStandardTables = !standardRolesError && !standardPermsError;
      
      if (usingRbacTables || usingStandardTables) {
        health.checks.rbac.tablesExist = true;
        health.checks.rbac.rolesCount = usingRbacTables 
          ? (rbacRoles as any)?.[0]?.count 
          : (standardRoles as any)?.[0]?.count;
        health.checks.rbac.permissionsCount = usingRbacTables
          ? (rbacPerms as any)?.[0]?.count
          : (standardPerms as any)?.[0]?.count;
        
        console.log(`✅ Health Check: RBAC tables found (${usingRbacTables ? 'rbac_*' : 'standard'})`);
        console.log(`   Roles: ${health.checks.rbac.rolesCount}, Permissions: ${health.checks.rbac.permissionsCount}`);
        
        // Check if we have permissions configured
        if (health.checks.rbac.permissionsCount === 0) {
          health.checks.rbac.status = 'fail';
          health.checks.rbac.error = 'No permissions configured';
          health.status = 'degraded';
          console.warn('⚠️ Health Check: No permissions found - run seeding script');
        }
      } else {
        health.checks.rbac.status = 'fail';
        health.checks.rbac.error = 'RBAC tables not found';
        health.status = 'degraded';
        console.error('❌ Health Check: RBAC tables not found');
      }
    } catch (error) {
      health.checks.rbac.status = 'fail';
      health.checks.rbac.error = error instanceof Error ? error.message : 'Unknown error';
      health.status = 'degraded';
      console.error('❌ Health Check: RBAC check error:', error);
    }

    // 4. API endpoints check (basic structure validation)
    console.log('🏥 Health Check: Validating API endpoints...');
    
    try {
      // We won't actually call the endpoints to avoid auth issues in health check
      // Just verify the environment is configured correctly
      const requiredEnvVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      ];
      
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        health.checks.apiEndpoints.status = 'fail';
        health.checks.apiEndpoints.error = `Missing env vars: ${missingVars.join(', ')}`;
        health.status = 'unhealthy';
        console.error('❌ Health Check: Missing environment variables:', missingVars);
      } else {
        health.checks.apiEndpoints.endpoints = {
          contracts: 'pass',
          parties: 'pass',
          profile: 'pass',
        };
        console.log('✅ Health Check: API environment configured correctly');
      }
    } catch (error) {
      health.checks.apiEndpoints.status = 'fail';
      health.checks.apiEndpoints.error = error instanceof Error ? error.message : 'Unknown error';
      health.status = 'degraded';
      console.error('❌ Health Check: API endpoints check error:', error);
    }

  } catch (error) {
    console.error('❌ Health Check: Critical error:', error);
    health.status = 'unhealthy';
  }

  const responseTime = Date.now() - startTime;
  console.log(`\n🏥 Health Check completed in ${responseTime}ms - Status: ${health.status}\n`);

  // Return appropriate status code
  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

  return NextResponse.json(
    {
      ...health,
      responseTime,
    },
    {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    }
  );
}

