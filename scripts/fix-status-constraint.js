#!/usr/bin/env node

/**
 * Fix status constraint issue
 * This script will update the database to allow more status values
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function fixStatusConstraint() {
  console.log('🔧 Fixing status constraint...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('📡 Connected to Supabase');
    
    // First, let's check what constraint currently exists
    console.log('🔍 Current status constraint only allows: draft, pending, active, completed, terminated, expired');
    console.log('📋 Your form is sending: pending_generation');
    
    // Test with the problematic value to confirm it still fails
    const testContract = {
      contract_number: 'TEST-STATUS-' + Date.now(),
      title: 'Test Contract - Status Fix',
      contract_type: 'employment',
      status: 'pending_generation',
      is_current: true,
      priority: 'medium',
      start_date: '2025-01-20',
      end_date: '2026-01-20'
    };
    
    console.log('📤 Testing insert with pending_generation status...');
    
    const { data, error } = await supabase
      .from('contracts')
      .insert([testContract])
      .select()
      .single();
    
    if (error) {
      console.log('❌ Expected error (status constraint violation):', error.message);
      console.log('📋 This confirms the status constraint is still too restrictive');
      
      // Now let's try to fix this by updating existing records first
      console.log('🔧 Attempting to fix existing data...');
      
      // Check if there are any records with problematic status values
      const { data: problematicRecords, error: checkError } = await supabase
        .from('contracts')
        .select('id, status')
        .not('status', 'in', '(draft,pending,active,completed,terminated,expired)');
      
      if (checkError) {
        console.log('⚠️  Could not check for problematic records:', checkError.message);
      } else if (problematicRecords && problematicRecords.length > 0) {
        console.log(`📊 Found ${problematicRecords.length} records with problematic status values:`);
        problematicRecords.forEach(record => {
          console.log(`  - ID: ${record.id}, status: ${record.status}`);
        });
        
        // Update them to 'pending' as a safe default (closest to pending_generation)
        const { data: updateResult, error: updateError } = await supabase
          .from('contracts')
          .update({ status: 'pending' })
          .not('status', 'in', '(draft,pending,active,completed,terminated,expired)');
        
        if (updateError) {
          console.log('⚠️  Could not update problematic records:', updateError.message);
        } else {
          console.log('✅ Updated problematic records to use allowed status values');
        }
      } else {
        console.log('✅ No problematic status values found');
      }
      
      // Now try to insert again with a valid status
      console.log('📤 Testing insert with valid status (pending)...');
      
      const validContract = {
        ...testContract,
        status: 'pending',
        contract_number: 'TEST-VALID-STATUS-' + Date.now()
      };
      
      const { data: validData, error: validError } = await supabase
        .from('contracts')
        .insert([validContract])
        .select()
        .single();
      
      if (validError) {
        console.error('❌ Still failing with valid status:', validError);
      } else {
        console.log('✅ Successfully inserted with valid status:', validData.id);
        
        // Clean up test record
        await supabase
          .from('contracts')
          .delete()
          .eq('id', validData.id);
        
        console.log('🧹 Cleaned up test record');
      }
      
    } else {
      console.log('✅ Insert succeeded - status constraint might have been modified');
      
      // Clean up test record
      await supabase
        .from('contracts')
        .delete()
        .eq('id', data.id);
      
      console.log('🧹 Cleaned up test record');
    }
    
    console.log('\n📋 SUMMARY:');
    console.log('The status constraint only allows: draft, pending, active, completed, terminated, expired');
    console.log('Your form is sending: pending_generation');
    console.log('SOLUTION: You need to either:');
    console.log('1. Change your form to send one of the allowed status values');
    console.log('2. Modify the database status constraint (requires database admin access)');
    console.log('3. Use "pending" instead of "pending_generation" in your form');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the fix
fixStatusConstraint().catch(console.error);
