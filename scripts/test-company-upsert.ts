/**
 * Test script for company upsert functionality
 * This demonstrates the upsert behavior with different scenarios
 */

import { createClient } from '@supabase/supabase-js'

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface TestCompanyData {
  name: string
  slug: string
  email?: string | null
  description?: string
  business_type?: 'individual' | 'small_business' | 'enterprise' | 'non_profit'
  phone?: string
  website?: string
  created_by: string
}

// Test scenarios
const testScenarios = [
  {
    name: 'Email-based upsert - Initial creation',
    data: {
      name: 'Tech Innovations LLC',
      slug: 'tech-innovations',
      email: 'contact@techinnovations.com',
      description: 'Cutting-edge technology solutions',
      business_type: 'small_business' as const,
      phone: '+1 (555) 123-4567',
      website: 'https://techinnovations.com',
      created_by: '00000000-0000-0000-0000-000000000000' // Placeholder user ID
    },
    conflict: 'lower_email'
  },
  {
    name: 'Email-based upsert - Update existing (same email, different case)',
    data: {
      name: 'Tech Innovations Corporation', // Changed name
      slug: 'tech-innovations-corp',         // Changed slug
      email: 'CONTACT@TECHINNOVATIONS.COM', // Same email, different case
      description: 'Advanced technology solutions and consulting', // Updated description
      business_type: 'enterprise' as const, // Changed business type
      phone: '+1 (555) 123-4567',
      website: 'https://techinnovations.com',
      created_by: '00000000-0000-0000-0000-000000000000'
    },
    conflict: 'lower_email'
  },
  {
    name: 'Slug-based upsert - Initial creation',
    data: {
      name: 'Creative Studio Design',
      slug: 'creative-studio',
      email: null, // No email for slug-based upsert
      description: 'Professional design and branding services',
      business_type: 'small_business' as const,
      phone: '+1 (555) 987-6543',
      website: 'https://creativestudio.design',
      created_by: '00000000-0000-0000-0000-000000000000'
    },
    conflict: 'slug'
  },
  {
    name: 'Slug-based upsert - Update existing',
    data: {
      name: 'Creative Studio & Design', // Updated name
      slug: 'creative-studio',         // Same slug
      email: 'hello@creativestudio.design', // Added email
      description: 'Premium design, branding, and digital marketing services', // Updated description
      business_type: 'small_business' as const,
      phone: '+1 (555) 987-6543',
      website: 'https://creativestudio.design',
      created_by: '00000000-0000-0000-0000-000000000000'
    },
    conflict: 'slug'
  }
]

async function testUpsertScenario(scenario: { name: string; data: TestCompanyData; conflict: string }) {
  console.log(`\n🧪 Testing: ${scenario.name}`)
  console.log(`📋 Conflict resolution: ${scenario.conflict}`)
  
  try {
    const { data, error } = await supabase
      .from('companies')
      .upsert([scenario.data], {
        onConflict: scenario.conflict,
        ignoreDuplicates: false
      })
      .select('*')
      .single()

    if (error) {
      console.error(`❌ Error:`, error)
      return null
    }

    console.log(`✅ Success:`)
    console.log(`   ID: ${data.id}`)
    console.log(`   Name: ${data.name}`)
    console.log(`   Slug: ${data.slug}`)
    console.log(`   Email: ${data.email || 'null'}`)
    console.log(`   Lower Email: ${data.lower_email || 'null'}`)
    console.log(`   Created: ${data.created_at}`)
    console.log(`   Updated: ${data.updated_at}`)
    
    return data

  } catch (error) {
    console.error(`❌ Exception:`, error)
    return null
  }
}

async function demonstrateConflictResolution() {
  console.log('🚀 Company Upsert Conflict Resolution Demo')
  console.log('=' .repeat(50))

  // Test each scenario
  for (const scenario of testScenarios) {
    await testUpsertScenario(scenario)
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second between tests
  }

  // Show final state of companies
  console.log('\n📊 Final State of Companies:')
  console.log('=' .repeat(30))
  
  const { data: companies, error } = await supabase
    .from('companies')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching companies:', error)
    return
  }

  companies?.forEach((company, index) => {
    console.log(`\n${index + 1}. ${company.name}`)
    console.log(`   ID: ${company.id}`)
    console.log(`   Slug: /${company.slug}`)
    console.log(`   Email: ${company.email || 'null'}`)
    console.log(`   Lower Email: ${company.lower_email || 'null'}`)
    console.log(`   Business Type: ${company.business_type}`)
    console.log(`   Created: ${company.created_at}`)
    console.log(`   Updated: ${company.updated_at}`)
    console.log(`   Times Updated: ${new Date(company.updated_at) > new Date(company.created_at) ? 'YES' : 'NO'}`)
  })
}

// Cleanup function to remove test data
async function cleanup() {
  console.log('\n🧹 Cleaning up test data...')
  
  const testEmails = ['contact@techinnovations.com', 'hello@creativestudio.design']
  const testSlugs = ['tech-innovations', 'tech-innovations-corp', 'creative-studio']
  
  const { error } = await supabase
    .from('companies')
    .delete()
    .or(`email.in.(${testEmails.join(',')}),slug.in.(${testSlugs.join(',')})`)

  if (error) {
    console.error('Cleanup error:', error)
  } else {
    console.log('✅ Test data cleaned up successfully')
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  
  if (args.includes('--cleanup')) {
    await cleanup()
    return
  }
  
  try {
    await demonstrateConflictResolution()
    
    if (args.includes('--auto-cleanup')) {
      await cleanup()
    } else {
      console.log('\n💡 Run with --cleanup flag to remove test data')
      console.log('💡 Run with --auto-cleanup to run tests and cleanup automatically')
    }
  } catch (error) {
    console.error('Script error:', error)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { demonstrateConflictResolution, cleanup, testScenarios }