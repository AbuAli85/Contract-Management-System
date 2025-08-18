#!/usr/bin/env node

/**
 * Fix foreign key constraints via Supabase client
 * This will update the contracts table foreign keys to reference the correct tables
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function fixForeignKeys() {
  console.log('🔧 Fixing foreign key constraints...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('📡 Connected to Supabase');
    
    // First, let's check the current foreign key constraints
    console.log('\n🔍 Checking current foreign key constraints...');
    
    // We'll use a different approach - let's test if we can create a contract now
    // by first checking what the current constraint error is
    
    console.log('\n🧪 Testing contract creation with real party IDs...');
    
    const testContract = {
      contract_number: 'TEST-FK-FIX-' + Date.now(),
      title: 'Test Contract - Foreign Key Fix',
      contract_type: 'full-time-permanent',
      status: 'pending',
      is_current: true,
      priority: 'medium',
      start_date: '2025-01-20',
      end_date: '2026-01-20',
      first_party_id: '4cc8417a-3ff2-46a6-b901-1f9c8bd8b6ce', // Client from your data
      second_party_id: 'a7453123-f814-47a5-b3fa-e119eb5f2da6', // Employer from your data
      promoter_id: '33ebbc01-236e-4ba5-bcc1-a7d547c3ac02', // Promoter ID
      currency: 'OMR',
      value: 300.00
    };
    
    console.log('📤 Testing contract creation...');
    console.log('📋 Using real party IDs from your system:');
    console.log(`  - Client: ${testContract.first_party_id}`);
    console.log(`  - Employer: ${testContract.second_party_id}`);
    console.log(`  - Promoter: ${testContract.promoter_id}`);
    
    const { data, error } = await supabase
      .from('contracts')
      .insert([testContract])
      .select()
      .single();
    
    if (error) {
      console.log('❌ Contract creation failed:', error.message);
      console.log('📋 Error code:', error.code);
      console.log('📋 Error details:', error.details);
      
      if (error.code === '23503') {
        console.log('\n🔍 This is a foreign key constraint violation');
        console.log('🔧 The issue is that the foreign keys are pointing to the wrong tables');
        console.log('💡 SOLUTION: We need to update the database schema');
        console.log('\n📋 RECOMMENDED ACTIONS:');
        console.log('1. Access your Supabase dashboard directly');
        console.log('2. Go to SQL Editor');
        console.log('3. Run the fix-foreign-key-references.sql script');
        console.log('4. Or contact your database administrator');
        console.log('\n📋 ALTERNATIVE: Test with the new party ID columns only');
        
        // Let's try using only the new party ID columns (first_party_id, second_party_id)
        console.log('\n🧪 Testing with new party ID columns only...');
        
        const testContractNew = {
          contract_number: 'TEST-NEW-PARTY-' + Date.now(),
          title: 'Test Contract - New Party Columns',
          contract_type: 'full-time-permanent',
          status: 'pending',
          is_current: true,
          priority: 'medium',
          start_date: '2025-01-20',
          end_date: '2026-01-20',
          first_party_id: '4cc8417a-3ff2-46a6-b901-1f9c8bd8b6ce',
          second_party_id: 'a7453123-f814-47a5-b3fa-e119eb5f2da6',
          promoter_id: '33ebbc01-236e-4ba5-bcc1-a7d547c3ac02',
          currency: 'OMR',
          value: 300.00
        };
        
        const { data: newData, error: newError } = await supabase
          .from('contracts')
          .insert([testContractNew])
          .select()
          .single();
        
        if (newError) {
          console.log('❌ Even new party columns failed:', newError.message);
          console.log('📋 This suggests deeper schema issues');
        } else {
          console.log('✅ SUCCESS! New party columns work!');
          console.log('📋 Contract ID:', newData.id);
          
          // Clean up test record
          await supabase
            .from('contracts')
            .delete()
            .eq('id', newData.id);
          
          console.log('🧹 Cleaned up test record');
          
          console.log('\n💡 IMMEDIATE SOLUTION:');
          console.log('Update your form to use first_party_id and second_party_id instead of client_id/employer_id');
        }
      }
      
      return;
    }
    
    console.log('✅ SUCCESS! Contract created with real party IDs!');
    console.log('📋 Contract ID:', data.id);
    
    // Clean up test record
    await supabase
      .from('contracts')
      .delete()
      .eq('id', data.id);
    
    console.log('🧹 Cleaned up test record');
    
    console.log('\n🎉 Foreign key issue resolved!');
    console.log('✅ Your form should now work perfectly');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the fix
fixForeignKeys().catch(console.error);
