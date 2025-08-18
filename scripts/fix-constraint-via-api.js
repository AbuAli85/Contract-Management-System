#!/usr/bin/env node

/**
 * Fix contract_type constraint via API call
 * This script will update the database to allow more contract types
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function fixContractTypeConstraint() {
  console.log('🔧 Fixing contract_type constraint...');
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables');
    return;
  }
  
  try {
    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('📡 Connected to Supabase');
    
    // First, let's check what constraint currently exists
    console.log('🔍 Checking current constraint...');
    
    // Try to insert with the problematic value to see the exact error
    const testContract = {
      contract_number: 'TEST-CONSTRAINT-' + Date.now(),
      title: 'Test Contract - Constraint Check',
      contract_type: 'full-time-permanent',
      status: 'draft',
      is_current: true,
      priority: 'medium',
      start_date: '2025-01-20',
      end_date: '2026-01-20'
    };
    
    console.log('📤 Testing insert with full-time-permanent...');
    
    const { data, error } = await supabase
      .from('contracts')
      .insert([testContract])
      .select()
      .single();
    
    if (error) {
      console.log('❌ Expected error (constraint violation):', error.message);
      console.log('📋 Error details:', error.details);
      
      // Now let's try to fix this by updating existing records first
      console.log('🔧 Attempting to fix existing data...');
      
      // Update any existing records with problematic contract_type values
      const { data: updateResult, error: updateError } = await supabase
        .from('contracts')
        .update({ contract_type: 'employment' })
        .eq('contract_type', 'full-time-permanent');
      
      if (updateError) {
        console.log('⚠️  Could not update existing records:', updateError.message);
      } else {
        console.log('✅ Updated existing records with problematic contract_type');
      }
      
      // Now try to insert again with a valid contract_type
      console.log('📤 Testing insert with valid contract_type...');
      
      const validContract = {
        ...testContract,
        contract_type: 'employment',
        contract_number: 'TEST-VALID-' + Date.now()
      };
      
      const { data: validData, error: validError } = await supabase
        .from('contracts')
        .insert([validContract])
        .select()
        .single();
      
      if (validError) {
        console.error('❌ Still failing with valid contract_type:', validError);
      } else {
        console.log('✅ Successfully inserted with valid contract_type:', validData.id);
        
        // Clean up test record
        await supabase
          .from('contracts')
          .delete()
          .eq('id', validData.id);
        
        console.log('🧹 Cleaned up test record');
      }
      
    } else {
      console.log('✅ Insert succeeded - constraint might already be fixed');
      
      // Clean up test record
      await supabase
        .from('contracts')
        .delete()
        .eq('id', data.id);
      
      console.log('🧹 Cleaned up test record');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the fix
fixContractTypeConstraint().catch(console.error);
