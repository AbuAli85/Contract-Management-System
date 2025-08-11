#!/usr/bin/env node

/**
 * 🛡️ RBAC Permission Fix Application Script (Simple Version)
 * 
 * This script directly creates the missing RBAC permissions using
 * Supabase client methods instead of raw SQL execution.
 * 
 * Usage: node scripts/apply_rbac_fixes_simple.js
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Define the missing permissions that need to be added
const MISSING_PERMISSIONS = [
  // User Management
  { resource: 'user', action: 'read', scope: 'all', name: 'user:read:all', description: 'Read all users' },
  { resource: 'user', action: 'create', scope: 'all', name: 'user:create:all', description: 'Create new users' },
  { resource: 'user', action: 'update', scope: 'all', name: 'user:update:all', description: 'Update any user' },
  { resource: 'user', action: 'delete', scope: 'all', name: 'user:delete:all', description: 'Delete users' },
  
  // Contract Operations
  { resource: 'contract', action: 'read', scope: 'own', name: 'contract:read:own', description: 'Read own contracts' },
  { resource: 'contract', action: 'create', scope: 'own', name: 'contract:create:own', description: 'Create own contracts' },
  { resource: 'contract', action: 'update', scope: 'own', name: 'contract:update:own', description: 'Update own contracts' },
  { resource: 'contract', action: 'generate', scope: 'own', name: 'contract:generate:own', description: 'Generate own contracts' },
  { resource: 'contract', action: 'download', scope: 'own', name: 'contract:download:own', description: 'Download own contracts' },
  { resource: 'contract', action: 'approve', scope: 'all', name: 'contract:approve:all', description: 'Approve contracts' },
  { resource: 'contract', action: 'message', scope: 'own', name: 'contract:message:own', description: 'Send contract messages' },
  
  // Company Management
  { resource: 'company', action: 'read', scope: 'own', name: 'company:read:own', description: 'Read own company' },
  { resource: 'company', action: 'read', scope: 'organization', name: 'company:read:organization', description: 'Read organization companies' },
  { resource: 'company', action: 'read', scope: 'all', name: 'company:read:all', description: 'Read all companies' },
  { resource: 'company', action: 'manage', scope: 'all', name: 'company:manage:all', description: 'Manage all companies' },
  
  // Profile Operations
  { resource: 'profile', action: 'read', scope: 'own', name: 'profile:read:own', description: 'Read own profile' },
  { resource: 'profile', action: 'update', scope: 'own', name: 'profile:update:own', description: 'Update own profile' },
  { resource: 'profile', action: 'read', scope: 'all', name: 'profile:read:all', description: 'Read all profiles' },
  
  // Role Management
  { resource: 'role', action: 'read', scope: 'all', name: 'role:read:all', description: 'Read all roles' },
  { resource: 'role', action: 'assign', scope: 'all', name: 'role:assign:all', description: 'Assign roles to users' },
  { resource: 'role', action: 'update', scope: 'all', name: 'role:update:all', description: 'Update role definitions' },
  
  // System Operations
  { resource: 'permission', action: 'manage', scope: 'all', name: 'permission:manage:all', description: 'Manage all permissions' },
  { resource: 'data', action: 'seed', scope: 'all', name: 'data:seed:all', description: 'Seed system data' },
  { resource: 'data', action: 'import', scope: 'all', name: 'data:import:all', description: 'Import data' },
  { resource: 'system', action: 'backup', scope: 'all', name: 'system:backup:all', description: 'Create system backups' },
  
  // Service Management
  { resource: 'service', action: 'create', scope: 'own', name: 'service:create:own', description: 'Create own services' },
  { resource: 'service', action: 'update', scope: 'own', name: 'service:update:own', description: 'Update own services' },
  
  // Promoter Operations
  { resource: 'promoter', action: 'read', scope: 'own', name: 'promoter:read:own', description: 'Read own promoter data' },
  { resource: 'promoter', action: 'manage', scope: 'own', name: 'promoter:manage:own', description: 'Manage own promoter data' },
  
  // Party Operations
  { resource: 'party', action: 'read', scope: 'own', name: 'party:read:own', description: 'Read own party data' },
  
  // Notification Operations
  { resource: 'notification', action: 'read', scope: 'own', name: 'notification:read:own', description: 'Read own notifications' },
  { resource: 'notification', action: 'read', scope: 'organization', name: 'notification:read:organization', description: 'Read organization notifications' },
  
  // Analytics Operations
  { resource: 'analytics', action: 'read', scope: 'all', name: 'analytics:read:all', description: 'Read analytics data' },
  
  // Additional Missing Permissions (P0 Critical)
  { resource: 'file', action: 'upload', scope: 'own', name: 'file:upload:own', description: 'Upload own files' },
  { resource: 'notification', action: 'create', scope: 'own', name: 'notification:create:own', description: 'Create own notifications' },
  { resource: 'audit', action: 'read', scope: 'all', name: 'audit:read:all', description: 'Read audit logs' },
  { resource: 'webhook', action: 'ingest', scope: 'public', name: 'webhook:ingest:public', description: 'Ingest webhook data' },
  { resource: 'user', action: 'approve', scope: 'all', name: 'user:approve:all', description: 'Approve user registrations' },
  { resource: 'contract', action: 'submit', scope: 'own', name: 'contract:submit:own', description: 'Submit own contracts' }
];

async function applyRBACFixes() {
  console.log('🛡️ Applying RBAC Permission Fixes (Simple Version)...\n');
  
  try {
    // Check if we have the required environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing required environment variables:');
      console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
      console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
      console.error('\nPlease ensure these are set in your .env.local file');
      process.exit(1);
    }
    
    console.log('✅ Environment variables loaded');
    console.log('🔗 Supabase URL:', supabaseUrl);
    
    // Import Supabase client dynamically
    const { createClient } = await import('@supabase/supabase-js');
    
    // Create admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    console.log('✅ Supabase client created');
    console.log(`📝 Found ${MISSING_PERMISSIONS.length} permissions to add`);
    
    // Add each missing permission
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < MISSING_PERMISSIONS.length; i++) {
      const permission = MISSING_PERMISSIONS[i];
      
      try {
        console.log(`\n🔄 Adding permission ${i + 1}/${MISSING_PERMISSIONS.length}: ${permission.name}`);
        
        // Insert the permission using upsert (insert or update if exists)
        const { data, error } = await supabase
          .from('permissions')
          .upsert(permission, { 
            onConflict: 'name',
            ignoreDuplicates: false 
          });
        
        if (error) {
          console.error(`   ❌ Error:`, error.message);
          errorCount++;
        } else {
          console.log(`   ✅ Success: ${permission.name}`);
          successCount++;
        }
        
        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err) {
        console.error(`   ❌ Exception:`, err.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Execution Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📝 Total: ${MISSING_PERMISSIONS.length}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 All RBAC permission fixes applied successfully!');
      console.log('🔄 Now run: npm run rbac:drift (should show 0 P0 issues)');
    } else {
      console.log('\n⚠️  Some fixes failed. Please review the errors above.');
      console.log('\n💡 Alternative: Apply the SQL manually through Supabase dashboard');
      console.log('   File: scripts/fix_rbac_permissions.sql');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
applyRBACFixes().catch(console.error);
