#!/usr/bin/env tsx
/**
 * Authentication & Permission Diagnostic Script
 * 
 * This script diagnoses authentication and permission issues by:
 * 1. Checking user authentication status
 * 2. Verifying user roles and permissions
 * 3. Testing API endpoint accessibility
 * 4. Identifying missing permissions
 * 5. Providing actionable recommendations
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface DiagnosticResult {
  category: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: any;
  fix?: string | undefined;
}

const results: DiagnosticResult[] = [];

function addResult(result: DiagnosticResult) {
  results.push(result);
  const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${result.category}] ${result.message}`);
  if (result.details) {
    console.log('   Details:', JSON.stringify(result.details, null, 2));
  }
  if (result.fix) {
    console.log(`   💡 Fix: ${result.fix}`);
  }
  console.log();
}

async function checkDatabaseConnection() {
  console.log('🔍 Checking database connection...\n');
  
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      addResult({
        category: 'Database Connection',
        status: 'FAIL',
        message: 'Failed to connect to database',
        details: error,
        fix: 'Check your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local'
      });
      return false;
    }
    
    addResult({
      category: 'Database Connection',
      status: 'PASS',
      message: 'Successfully connected to database'
    });
    return true;
  } catch (error) {
    addResult({
      category: 'Database Connection',
      status: 'FAIL',
      message: 'Database connection error',
      details: error,
      fix: 'Verify your Supabase project is active and credentials are correct'
    });
    return false;
  }
}

async function checkRBACTables() {
  console.log('🔍 Checking RBAC tables existence...\n');
  
  const tables = ['roles', 'permissions', 'role_permissions', 'user_roles'];
  
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);
      
      if (error && error.code === 'PGRST116') {
        addResult({
          category: 'RBAC Schema',
          status: 'FAIL',
          message: `Table '${table}' does not exist`,
          details: error,
          fix: `Run migration: supabase migration up 20250211_rbac_schema_fixed.sql`
        });
      } else if (error) {
        addResult({
          category: 'RBAC Schema',
          status: 'WARNING',
          message: `Error accessing table '${table}'`,
          details: error
        });
      } else {
        addResult({
          category: 'RBAC Schema',
          status: 'PASS',
          message: `Table '${table}' exists and is accessible`
        });
      }
    } catch (error) {
      addResult({
        category: 'RBAC Schema',
        status: 'FAIL',
        message: `Exception checking table '${table}'`,
        details: error
      });
    }
  }
}

async function checkDefaultRoles() {
  console.log('🔍 Checking default roles...\n');
  
  const requiredRoles = ['admin', 'manager', 'user', 'viewer'];
  
  try {
    const { data: roles, error } = await supabase
      .from('roles')
      .select('*')
      .in('name', requiredRoles);
    
    if (error) {
      addResult({
        category: 'Default Roles',
        status: 'FAIL',
        message: 'Failed to fetch roles',
        details: error,
        fix: 'Check if roles table exists and is accessible'
      });
      return;
    }
    
    const existingRoleNames = roles?.map(r => r.name) || [];
    const missingRoles = requiredRoles.filter(r => !existingRoleNames.includes(r));
    
    if (missingRoles.length > 0) {
      addResult({
        category: 'Default Roles',
        status: 'WARNING',
        message: `Missing default roles: ${missingRoles.join(', ')}`,
        fix: 'Run the permission seeding script to create missing roles'
      });
    } else {
      addResult({
        category: 'Default Roles',
        status: 'PASS',
        message: 'All default roles exist',
        details: { roles: existingRoleNames }
      });
    }
  } catch (error) {
    addResult({
      category: 'Default Roles',
      status: 'FAIL',
      message: 'Error checking default roles',
      details: error
    });
  }
}

async function checkAdminPermissions() {
  console.log('🔍 Checking admin role permissions...\n');
  
  try {
    // Get admin role
    const { data: adminRole, error: roleError } = await supabase
      .from('roles')
      .select('*')
      .eq('name', 'admin')
      .single();
    
    if (roleError || !adminRole) {
      addResult({
        category: 'Admin Permissions',
        status: 'FAIL',
        message: 'Admin role not found',
        fix: 'Create admin role using the seeding script'
      });
      return;
    }
    
    // Get permissions for admin role
    const { data: rolePermissions, error: permError } = await supabase
      .from('role_permissions')
      .select(`
        *,
        permissions (
          resource,
          action,
          scope
        )
      `)
      .eq('role_id', adminRole.id);
    
    if (permError) {
      addResult({
        category: 'Admin Permissions',
        status: 'FAIL',
        message: 'Failed to fetch admin permissions',
        details: permError
      });
      return;
    }
    
    const permissionCount = rolePermissions?.length || 0;
    
    if (permissionCount === 0) {
      addResult({
        category: 'Admin Permissions',
        status: 'FAIL',
        message: 'Admin role has no permissions assigned',
        fix: 'Run the permission seeding script to assign admin permissions'
      });
    } else {
      addResult({
        category: 'Admin Permissions',
        status: 'PASS',
        message: `Admin role has ${permissionCount} permissions`,
        details: { permissionCount, sample: rolePermissions?.slice(0, 5) }
      });
    }
  } catch (error) {
    addResult({
      category: 'Admin Permissions',
      status: 'FAIL',
      message: 'Error checking admin permissions',
      details: error
    });
  }
}

async function checkUserRoleAssignments() {
  console.log('🔍 Checking user role assignments...\n');
  
  try {
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role');
    
    if (usersError) {
      addResult({
        category: 'User Role Assignments',
        status: 'FAIL',
        message: 'Failed to fetch users',
        details: usersError
      });
      return;
    }
    
    if (!users || users.length === 0) {
      addResult({
        category: 'User Role Assignments',
        status: 'WARNING',
        message: 'No users found in database',
        fix: 'Create at least one admin user'
      });
      return;
    }
    
    // Check user_roles table for RBAC assignments
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        *,
        roles (
          name
        )
      `);
    
    if (rolesError) {
      addResult({
        category: 'User Role Assignments',
        status: 'WARNING',
        message: 'Failed to fetch user role assignments',
        details: rolesError,
        fix: 'User roles might not be properly assigned. Check user_roles table.'
      });
    }
    
    const usersWithoutRoles = users.filter(user => {
      const hasRBARole = userRoles?.some(ur => ur.user_id === user.id);
      const hasLegacyRole = user.role;
      return !hasRBARole && !hasLegacyRole;
    });
    
    if (usersWithoutRoles.length > 0) {
      addResult({
        category: 'User Role Assignments',
        status: 'WARNING',
        message: `${usersWithoutRoles.length} users without role assignments`,
        details: { users: usersWithoutRoles.map(u => u.email) },
        fix: 'Assign roles to these users using the seeding script'
      });
    } else {
      addResult({
        category: 'User Role Assignments',
        status: 'PASS',
        message: `All ${users.length} users have role assignments`
      });
    }
    
    // Check for admin users
    const adminUsers = users.filter(u => u.role === 'admin');
    const rbacAdminUsers = userRoles?.filter(ur => 
      ur.roles && (ur.roles as any).name === 'admin'
    ) || [];
    
    const totalAdmins = new Set([
      ...adminUsers.map(u => u.id),
      ...rbacAdminUsers.map(ur => ur.user_id)
    ]).size;
    
    if (totalAdmins === 0) {
      addResult({
        category: 'User Role Assignments',
        status: 'FAIL',
        message: 'No admin users found',
        fix: 'Assign admin role to at least one user'
      });
    } else {
      addResult({
        category: 'User Role Assignments',
        status: 'PASS',
        message: `Found ${totalAdmins} admin user(s)`
      });
    }
  } catch (error) {
    addResult({
      category: 'User Role Assignments',
      status: 'FAIL',
      message: 'Error checking user role assignments',
      details: error
    });
  }
}

async function checkRBACEnforcementMode() {
  console.log('🔍 Checking RBAC enforcement mode...\n');
  
  const mode = process.env.RBAC_ENFORCEMENT || 'dry-run';
  
  if (mode === 'disabled') {
    addResult({
      category: 'RBAC Configuration',
      status: 'WARNING',
      message: 'RBAC is disabled',
      fix: 'Set RBAC_ENFORCEMENT=enforce in production for security'
    });
  } else if (mode === 'dry-run') {
    addResult({
      category: 'RBAC Configuration',
      status: 'WARNING',
      message: 'RBAC is in dry-run mode',
      details: { mode },
      fix: 'Set RBAC_ENFORCEMENT=enforce for production deployment'
    });
  } else if (mode === 'enforce') {
    addResult({
      category: 'RBAC Configuration',
      status: 'PASS',
      message: 'RBAC enforcement is enabled',
      details: { mode }
    });
  } else {
    addResult({
      category: 'RBAC Configuration',
      status: 'WARNING',
      message: `Unknown RBAC mode: ${mode}`,
      fix: 'Set RBAC_ENFORCEMENT to one of: disabled, dry-run, enforce'
    });
  }
}

async function checkPermissionCache() {
  console.log('🔍 Checking permission cache configuration...\n');
  
  const cacheEnabled = process.env.ENABLE_PERMISSION_CACHE !== 'false';
  const cacheTtl = process.env.PERMISSION_CACHE_TTL || '3600';
  
  addResult({
    category: 'Permission Cache',
    status: cacheEnabled ? 'PASS' : 'WARNING',
    message: cacheEnabled ? 'Permission cache is enabled' : 'Permission cache is disabled',
    details: { 
      enabled: cacheEnabled,
      ttl: `${cacheTtl} seconds`
    },
    fix: cacheEnabled ? undefined : 'Enable cache for better performance: ENABLE_PERMISSION_CACHE=true'
  });
}

async function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 DIAGNOSTIC REPORT SUMMARY');
  console.log('='.repeat(80) + '\n');
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warnings = results.filter(r => r.status === 'WARNING').length;
  const total = results.length;
  
  console.log(`Total Checks: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log();
  
  if (failed > 0) {
    console.log('🔴 CRITICAL ISSUES FOUND:');
    results.filter(r => r.status === 'FAIL').forEach((result, i) => {
      console.log(`\n${i + 1}. [${result.category}] ${result.message}`);
      if (result.fix) {
        console.log(`   💡 ${result.fix}`);
      }
    });
    console.log();
  }
  
  if (warnings > 0) {
    console.log('⚠️  WARNINGS:');
    results.filter(r => r.status === 'WARNING').forEach((result, i) => {
      console.log(`\n${i + 1}. [${result.category}] ${result.message}`);
      if (result.fix) {
        console.log(`   💡 ${result.fix}`);
      }
    });
    console.log();
  }
  
  console.log('='.repeat(80));
  console.log('\n📋 RECOMMENDED ACTIONS:\n');
  
  if (failed > 0 || warnings > 0) {
    console.log('1. Run the permission seeding script:');
    console.log('   npm run seed:permissions');
    console.log();
    console.log('2. Verify admin user has proper permissions:');
    console.log('   npm run check:admin-permissions');
    console.log();
    console.log('3. Set RBAC_ENFORCEMENT=enforce in production');
    console.log();
    console.log('4. Clear permission cache if issues persist:');
    console.log('   npm run clear:cache');
    console.log();
  } else {
    console.log('✅ All checks passed! Your authentication system is properly configured.');
    console.log();
  }
  
  console.log('='.repeat(80) + '\n');
}

async function main() {
  console.log('\n🚀 Authentication & Permission Diagnostic Tool\n');
  console.log('This tool will check your authentication setup and identify issues.\n');
  console.log('='.repeat(80) + '\n');
  
  const connected = await checkDatabaseConnection();
  
  if (!connected) {
    console.log('\n❌ Cannot proceed without database connection. Please fix connection issues first.\n');
    process.exit(1);
  }
  
  await checkRBACTables();
  await checkDefaultRoles();
  await checkAdminPermissions();
  await checkUserRoleAssignments();
  await checkRBACEnforcementMode();
  await checkPermissionCache();
  
  await generateReport();
  
  const failedCount = results.filter(r => r.status === 'FAIL').length;
  process.exit(failedCount > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('\n❌ Diagnostic tool crashed:', error);
  process.exit(1);
});

