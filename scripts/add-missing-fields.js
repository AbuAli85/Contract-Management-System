import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔧 Adding missing contract fields...')

async function addMissingFields() {
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
  
  try {
    // Add basic_salary field
    console.log('1. Adding basic_salary field...')
    const { error: salaryError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE contracts ADD COLUMN IF NOT EXISTS basic_salary NUMERIC(12,2);'
    })
    if (salaryError) console.error('❌ basic_salary error:', salaryError.message)
    else console.log('✅ basic_salary field added')

    // Add allowances field
    console.log('2. Adding allowances field...')
    const { error: allowancesError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE contracts ADD COLUMN IF NOT EXISTS allowances NUMERIC(12,2);'
    })
    if (allowancesError) console.error('❌ allowances error:', allowancesError.message)
    else console.log('✅ allowances field added')

    // Add special_terms field
    console.log('3. Adding special_terms field...')
    const { error: termsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE contracts ADD COLUMN IF NOT EXISTS special_terms TEXT;'
    })
    if (termsError) console.error('❌ special_terms error:', termsError.message)
    else console.log('✅ special_terms field added')

    // Add department field
    console.log('4. Adding department field...')
    const { error: deptError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE contracts ADD COLUMN IF NOT EXISTS department TEXT;'
    })
    if (deptError) console.error('❌ department error:', deptError.message)
    else console.log('✅ department field added')

    // Add contract_type field
    console.log('5. Adding contract_type field...')
    const { error: typeError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contract_type TEXT;'
    })
    if (typeError) console.error('❌ contract_type error:', typeError.message)
    else console.log('✅ contract_type field added')

    // Add currency field
    console.log('6. Adding currency field...')
    const { error: currencyError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE contracts ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT \'OMR\';'
    })
    if (currencyError) console.error('❌ currency error:', currencyError.message)
    else console.log('✅ currency field added')

    // Update existing contracts
    console.log('7. Updating existing contracts...')
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE contracts 
        SET 
          basic_salary = contract_value,
          currency = 'OMR',
          contract_type = 'full-time-permanent'
        WHERE basic_salary IS NULL AND contract_value IS NOT NULL;
      `
    })
    if (updateError) console.error('❌ Update error:', updateError.message)
    else console.log('✅ Existing contracts updated')

    // Verify the changes
    console.log('8. Verifying changes...')
    const { data: contracts, error: verifyError } = await supabase
      .from('contracts')
      .select('id, basic_salary, allowances, special_terms, department, contract_type, currency')
      .limit(5)

    if (verifyError) {
      console.error('❌ Verification error:', verifyError.message)
    } else {
      console.log('✅ Verification successful')
      console.log('Sample contract data:', contracts?.[0])
    }

    console.log('🎉 Migration completed successfully!')

  } catch (error) {
    console.error('❌ Migration failed:', error)
  }
}

addMissingFields() 