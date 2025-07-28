import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Checking contract schema...')

async function checkContractSchema() {
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
  
  try {
    // Test queries to check which columns exist
    console.log('1. Testing different column combinations...')
    
    // Test new schema
    console.log('\nTesting new schema (first_party_id, second_party_id)...')
    const { data: newSchemaData, error: newSchemaError } = await supabase
      .from('contracts')
      .select('id, first_party_id, second_party_id, promoter_id')
      .limit(1)
    
    if (newSchemaError) {
      console.log('❌ New schema failed:', newSchemaError.message)
    } else {
      console.log('✅ New schema works!')
      console.log('Sample data:', newSchemaData[0])
    }
    
    // Test old schema
    console.log('\nTesting old schema (employer_id, client_id)...')
    const { data: oldSchemaData, error: oldSchemaError } = await supabase
      .from('contracts')
      .select('id, employer_id, client_id, promoter_id')
      .limit(1)
    
    if (oldSchemaError) {
      console.log('❌ Old schema failed:', oldSchemaError.message)
    } else {
      console.log('✅ Old schema works!')
      console.log('Sample data:', oldSchemaData[0])
    }
    
    // Test basic query
    console.log('\nTesting basic query...')
    const { data: basicData, error: basicError } = await supabase
      .from('contracts')
      .select('*')
      .limit(1)
    
    if (basicError) {
      console.error('❌ Basic query failed:', basicError.message)
    } else {
      console.log('✅ Basic query successful')
      if (basicData && basicData.length > 0) {
        console.log('Available columns:', Object.keys(basicData[0]))
      }
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

checkContractSchema() 