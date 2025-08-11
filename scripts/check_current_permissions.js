#!/usr/bin/env node

/**
 * 🔍 Check Current Database Permissions
 * 
 * This script checks what permissions are currently in the database
 * to verify if the RBAC fixes were actually applied.
 * 
 * Usage: node scripts/check_current_permissions.js
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function checkCurrentPermissions() {
  console.log('🔍 Checking Current Database Permissions...\n');
  
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
    
    // Query the permissions table
    console.log('\n📊 Querying permissions table...');
    
    const { data: permissions, error } = await supabase
      .from('permissions')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('❌ Error querying permissions:', error.message);
      process.exit(1);
    }
    
    console.log(`✅ Found ${permissions.length} permissions in database\n`);
    
    // Display all permissions
    console.log('📋 CURRENT PERMISSIONS IN DATABASE:');
    console.log('=====================================');
    
    permissions.forEach((perm, index) => {
      console.log(`${index + 1}. ${perm.name} (${perm.resource}:${perm.action}:${perm.scope})`);
    });
    
    // Check for specific missing permissions
    console.log('\n🔍 CHECKING FOR MISSING CRITICAL PERMISSIONS:');
    console.log('===============================================');
    
    const criticalPermissions = [
      'user:read:all', 'user:create:all', 'user:update:all', 'user:delete:all',
      'contract:read:own', 'contract:create:own', 'contract:update:own',
      'company:read:own', 'company:read:all', 'company:manage:all',
      'profile:read:own', 'profile:update:own', 'profile:read:all',
      'role:read:all', 'role:assign:all', 'role:update:all',
      'permission:manage:all', 'data:seed:all', 'data:import:all',
      'system:backup:all', 'analytics:read:all'
    ];
    
    const foundPermissions = permissions.map(p => p.name);
    const missingPermissions = criticalPermissions.filter(p => !foundPermissions.includes(p));
    
    if (missingPermissions.length === 0) {
      console.log('✅ All critical permissions are present!');
    } else {
      console.log(`❌ Missing ${missingPermissions.length} critical permissions:`);
      missingPermissions.forEach(perm => console.log(`   - ${perm}`));
    }
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('============');
    console.log(`Total permissions in database: ${permissions.length}`);
    console.log(`Critical permissions found: ${criticalPermissions.length - missingPermissions.length}`);
    console.log(`Critical permissions missing: ${missingPermissions.length}`);
    
    if (missingPermissions.length > 0) {
      console.log('\n🚨 ACTION REQUIRED:');
      console.log('The RBAC permission fixes were NOT applied to the database.');
      console.log('You need to either:');
      console.log('1. Get the SUPABASE_SERVICE_ROLE_KEY and run: npm run rbac:fix:simple');
      console.log('2. Apply the SQL manually through Supabase dashboard');
      console.log('3. Fix Docker issues and use Supabase CLI');
    } else {
      console.log('\n🎉 SUCCESS:');
      console.log('All critical permissions are present. Run: npm run rbac:drift');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
checkCurrentPermissions().catch(console.error);
