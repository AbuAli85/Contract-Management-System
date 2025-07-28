const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function checkContractRelationships() {
  console.log('🔍 Checking contract relationships and foreign keys...')
  
  try {
    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables:')
      console.error('   - NEXT_PUBLIC_SUPABASE_URL')
      console.error('   - SUPABASE_SERVICE_ROLE_KEY')
      return
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    console.log('📋 Checking contracts table structure...')
    
    // Get sample contracts with relationships
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select(`
        id,
        contract_number,
        status,
        first_party_id,
        second_party_id,
        promoter_id,
        first_party:parties!contracts_first_party_id_fkey(id, name_en, name_ar),
        second_party:parties!contracts_second_party_id_fkey(id, name_en, name_ar),
        promoter:promoters!contracts_promoter_id_fkey(id, name_en, name_ar)
      `)
      .limit(5)

    if (contractsError) {
      console.error('❌ Error fetching contracts:', contractsError)
      return
    }

    console.log(`📋 Found ${contracts?.length || 0} sample contracts:`)
    
    if (contracts && contracts.length > 0) {
      contracts.forEach((contract, index) => {
        console.log(`\n📄 Contract ${index + 1}:`)
        console.log(`   ID: ${contract.id}`)
        console.log(`   Number: ${contract.contract_number}`)
        console.log(`   Status: ${contract.status}`)
        console.log(`   First Party ID: ${contract.first_party_id}`)
        console.log(`   Second Party ID: ${contract.second_party_id}`)
        console.log(`   Promoter ID: ${contract.promoter_id}`)
        console.log(`   First Party: ${contract.first_party ? contract.first_party.name_en : 'NULL'}`)
        console.log(`   Second Party: ${contract.second_party ? contract.second_party.name_en : 'NULL'}`)
        console.log(`   Promoter: ${contract.promoter ? contract.promoter.name_en : 'NULL'}`)
      })
    }

    console.log('\n🔍 Checking for contracts with missing relationships...')
    
    // Check contracts with null foreign keys
    const { data: nullRelationships, error: nullError } = await supabase
      .from('contracts')
      .select('id, contract_number, first_party_id, second_party_id, promoter_id')
      .or('first_party_id.is.null,second_party_id.is.null,promoter_id.is.null')
      .limit(10)

    if (nullError) {
      console.error('❌ Error checking null relationships:', nullError)
    } else {
      console.log(`📋 Found ${nullRelationships?.length || 0} contracts with null relationships:`)
      nullRelationships?.forEach(contract => {
        console.log(`   - ${contract.contract_number}: first_party_id=${contract.first_party_id}, second_party_id=${contract.second_party_id}, promoter_id=${contract.promoter_id}`)
      })
    }

    console.log('\n🔍 Checking parties table...')
    
    // Check parties table
    const { data: parties, error: partiesError } = await supabase
      .from('parties')
      .select('id, name_en, name_ar, type')
      .limit(5)

    if (partiesError) {
      console.error('❌ Error fetching parties:', partiesError)
    } else {
      console.log(`📋 Found ${parties?.length || 0} parties:`)
      parties?.forEach(party => {
        console.log(`   - ${party.name_en} (${party.type})`)
      })
    }

    console.log('\n🔍 Checking promoters table...')
    
    // Check promoters table
    const { data: promoters, error: promotersError } = await supabase
      .from('promoters')
      .select('id, name_en, name_ar, status')
      .limit(5)

    if (promotersError) {
      console.error('❌ Error fetching promoters:', promotersError)
    } else {
      console.log(`📋 Found ${promoters?.length || 0} promoters:`)
      promoters?.forEach(promoter => {
        console.log(`   - ${promoter.name_en} (${promoter.status})`)
      })
    }

    console.log('\n🔍 Testing API endpoint...')
    
    // Test the API endpoint
    try {
      const response = await fetch(`${supabaseUrl.replace('.supabase.co', '.supabase.co')}/rest/v1/contracts?select=id,contract_number,status,first_party:parties!contracts_first_party_id_fkey(id,name_en),second_party:parties!contracts_second_party_id_fkey(id,name_en),promoter:promoters!contracts_promoter_id_fkey(id,name_en)&limit=3`, {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      })
      
      if (response.ok) {
        const apiData = await response.json()
        console.log('✅ API endpoint test successful')
        console.log(`📋 API returned ${apiData.length} contracts`)
        if (apiData.length > 0) {
          console.log('📋 Sample API response:', JSON.stringify(apiData[0], null, 2))
        }
      } else {
        console.log('❌ API endpoint test failed:', response.status, response.statusText)
      }
    } catch (apiError) {
      console.log('❌ API endpoint test error:', apiError.message)
    }

  } catch (error) {
    console.error('❌ Script error:', error)
  }
}

// Run the script
checkContractRelationships()
  .then(() => {
    console.log('\n🎉 Relationship check completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  }) 