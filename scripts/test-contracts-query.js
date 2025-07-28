import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Testing contracts query with joins...')

async function testContractsQuery() {
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
  
  try {
    // Test the exact query from use-contracts.ts
    console.log('1. Testing new schema query...')
    const { data, error } = await supabase
      .from("contracts")
      .select(
        `
        *,
        first_party:parties!contracts_first_party_id_fkey(id,name_en,name_ar,crn,type),
        second_party:parties!contracts_second_party_id_fkey(id,name_en,name_ar,crn,type),
        promoters(id,name_en,name_ar,id_card_number,id_card_url,passport_url,status)
      `,
      )
      .order("created_at", { ascending: false })
      .limit(5)

    if (error) {
      console.error('❌ New schema query failed:', error.message)
      console.error('Error details:', error)
      
      // Test without joins
      console.log('\n2. Testing without joins...')
      const { data: basicData, error: basicError } = await supabase
        .from("contracts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5)
      
      if (basicError) {
        console.error('❌ Basic query also failed:', basicError.message)
      } else {
        console.log('✅ Basic query works, issue is with joins')
        console.log('Sample contract:', basicData[0])
      }
      
      // Test individual joins
      console.log('\n3. Testing individual joins...')
      
      // Test first_party join
      const { data: firstPartyData, error: firstPartyError } = await supabase
        .from("contracts")
        .select(`
          id,
          first_party_id,
          first_party:parties!contracts_first_party_id_fkey(id,name_en,name_ar,crn,type)
        `)
        .limit(1)
      
      if (firstPartyError) {
        console.error('❌ First party join failed:', firstPartyError.message)
      } else {
        console.log('✅ First party join works')
      }
      
      // Test second_party join
      const { data: secondPartyData, error: secondPartyError } = await supabase
        .from("contracts")
        .select(`
          id,
          second_party_id,
          second_party:parties!contracts_second_party_id_fkey(id,name_en,name_ar,crn,type)
        `)
        .limit(1)
      
      if (secondPartyError) {
        console.error('❌ Second party join failed:', secondPartyError.message)
      } else {
        console.log('✅ Second party join works')
      }
      
      // Test promoters join
      const { data: promotersData, error: promotersError } = await supabase
        .from("contracts")
        .select(`
          id,
          promoter_id,
          promoters(id,name_en,name_ar,id_card_number,id_card_url,passport_url,status)
        `)
        .limit(1)
      
      if (promotersError) {
        console.error('❌ Promoters join failed:', promotersError.message)
      } else {
        console.log('✅ Promoters join works')
      }
      
    } else {
      console.log('✅ New schema query works!')
      console.log(`Found ${data.length} contracts`)
      if (data.length > 0) {
        console.log('Sample contract with relations:', data[0])
      }
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

testContractsQuery() 