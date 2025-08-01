const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function checkPromoterSchema() {
  console.log('=== Checking Promoter Table Schema ===')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // Get a sample promoter to see all available fields
    console.log('\n1. Getting sample promoter data...')
    const { data: samplePromoter, error: sampleError } = await supabase
      .from('promoters')
      .select('*')
      .limit(1)
      .single()
    
    if (sampleError) {
      console.error('❌ Failed to get sample promoter:', sampleError.message)
      return
    }
    
    console.log('✅ Sample promoter fields:')
    Object.keys(samplePromoter).forEach(field => {
      console.log(`   - ${field}: ${typeof samplePromoter[field]} (${samplePromoter[field]})`)
    })
    
    // Check for specific problematic fields
    console.log('\n2. Checking for problematic fields...')
    const problematicFields = ['passport_number', 'passport_url', 'id_card_url', 'profile_picture_url']
    
    problematicFields.forEach(field => {
      if (samplePromoter.hasOwnProperty(field)) {
        console.log(`✅ ${field}: EXISTS (${samplePromoter[field]})`)
      } else {
        console.log(`❌ ${field}: MISSING`)
      }
    })
    
    // Test update with only existing fields
    console.log('\n3. Testing update with existing fields only...')
    const safeUpdate = {
      name_en: samplePromoter.name_en,
      name_ar: samplePromoter.name_ar,
      id_card_number: samplePromoter.id_card_number,
      status: samplePromoter.status,
      updated_at: new Date().toISOString()
    }
    
    console.log('Safe update data:', safeUpdate)
    
    const { data: updateResult, error: updateError } = await supabase
      .from('promoters')
      .update(safeUpdate)
      .eq('id', samplePromoter.id)
      .select()
      .single()
    
    if (updateError) {
      console.error('❌ Safe update failed:', updateError.message)
    } else {
      console.log('✅ Safe update successful')
    }
    
    // Test update with problematic fields
    console.log('\n4. Testing update with problematic fields...')
    const problematicUpdate = {
      ...safeUpdate,
      passport_number: 'A123456789', // This field doesn't exist
      passport_url: 'https://example.com/passport.jpg', // This might not exist
      id_card_url: 'https://example.com/id.jpg', // This might not exist
      profile_picture_url: 'https://example.com/profile.jpg' // This might not exist
    }
    
    console.log('Problematic update data:', problematicUpdate)
    
    const { data: problematicResult, error: problematicError } = await supabase
      .from('promoters')
      .update(problematicUpdate)
      .eq('id', samplePromoter.id)
      .select()
      .single()
    
    if (problematicError) {
      console.error('❌ Problematic update failed:', problematicError.message)
      
      if (problematicError.message.includes('passport_number')) {
        console.log('🔍 The passport_number column does not exist in the database')
      }
      if (problematicError.message.includes('passport_url')) {
        console.log('🔍 The passport_url column does not exist in the database')
      }
      if (problematicError.message.includes('id_card_url')) {
        console.log('🔍 The id_card_url column does not exist in the database')
      }
      if (problematicError.message.includes('profile_picture_url')) {
        console.log('🔍 The profile_picture_url column does not exist in the database')
      }
    } else {
      console.log('✅ Problematic update successful (all fields exist)')
    }
    
    console.log('\n=== Schema Check Complete ===')
    
  } catch (error) {
    console.error('❌ Schema check failed:', error.message)
  }
}

checkPromoterSchema().catch(console.error) 