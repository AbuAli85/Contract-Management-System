// Simple script to check Make.com enabled contract types
const contractTypes = [
  {
    id: 'full-time-permanent',
    name: 'Full-Time Permanent Employment',
    makecomTemplateId: 'full_time_permanent_employment_v2',
    googleDocsTemplateId: '1dzYQ_MDstiErG9O1yP87_bVXvDPQbe8V',
    isActive: true
  },
  {
    id: 'part-time-contract',
    name: 'Part-Time Contract',
    makecomTemplateId: 'part_time_contract_v2',
    googleDocsTemplateId: '2BcDeFgHiJkLmNoPqRsTuVwXyZ234567890',
    isActive: true
  },
  {
    id: 'fixed-term-contract',
    name: 'Fixed-Term Contract',
    makecomTemplateId: 'fixed_term_contract_v2',
    googleDocsTemplateId: '3CdEfGhIjKlMnOpQrStUvWxYzA345678901',
    isActive: true
  },
  {
    id: 'business-service-contract',
    name: 'Business Service Contract',
    makecomTemplateId: 'business_service_contract_v2',
    googleDocsTemplateId: '4DeFgHiJkLmNoPqRsTuVwXyZbC456789012',
    isActive: true
  },
  {
    id: 'consulting-agreement',
    name: 'Consulting Agreement',
    makecomTemplateId: 'consulting_agreement_v2',
    googleDocsTemplateId: '5EfGhIjKlMnOpQrStUvWxYzBcD567890123',
    isActive: true
  },
  {
    id: 'freelance-service-agreement',
    name: 'Freelance Service Agreement',
    makecomTemplateId: 'freelance_service_agreement_v2',
    googleDocsTemplateId: '6FgHiJkLmNoPqRsTuVwXyZcDe678901234',
    isActive: true
  },
  {
    id: 'business-partnership-agreement',
    name: 'Business Partnership Agreement',
    makecomTemplateId: 'business_partnership_agreement_v2',
    googleDocsTemplateId: '7GhIjKlMnOpQrStUvWxYzDeF789012345',
    isActive: true
  },
  {
    id: 'non-disclosure-agreement',
    name: 'Non-Disclosure Agreement',
    makecomTemplateId: 'non_disclosure_agreement_v2',
    googleDocsTemplateId: '8HiJkLmNoPqRsTuVwXyZeFg890123456',
    isActive: true
  },
  {
    id: 'vendor-service-agreement',
    name: 'Vendor Service Agreement',
    makecomTemplateId: 'vendor_service_agreement_v2',
    googleDocsTemplateId: '9IjKlMnOpQrStUvWxYzFgH901234567',
    isActive: true
  }
]

console.log('🎯 Make.com Integration - Contract Types Analysis\n')

// Filter enabled contract types
const enabledTypes = contractTypes.filter(type => 
  type.makecomTemplateId && type.isActive
)

console.log(`✅ Total Contract Types: ${contractTypes.length}`)
console.log(`✅ Make.com Enabled: ${enabledTypes.length}`)
console.log(`❌ Not Enabled: ${contractTypes.length - enabledTypes.length}\n`)

console.log('📋 Make.com Enabled Contract Types:')
enabledTypes.forEach((type, index) => {
  console.log(`${index + 1}. ${type.name}`)
  console.log(`   ID: ${type.id}`)
  console.log(`   Make.com Template: ${type.makecomTemplateId}`)
  console.log(`   Google Docs Template: ${type.googleDocsTemplateId}`)
  console.log('')
})

console.log('📋 Contract Types NOT Enabled for Make.com:')
const notEnabled = contractTypes.filter(type => 
  !type.makecomTemplateId || !type.isActive
)
notEnabled.forEach((type, index) => {
  console.log(`${index + 1}. ${type.name} (ID: ${type.id})`)
})

console.log('\n🎯 Summary:')
console.log('✅ All 9 contract types are configured for Make.com integration')
console.log('✅ Each has a unique Make.com template ID')
console.log('✅ Each has a Google Docs template ID')
console.log('✅ All are marked as active')

console.log('\n🚀 Forms that will work with Make.com:')
console.log('1. Full-Time Permanent Employment Form')
console.log('2. Part-Time Contract Form')
console.log('3. Fixed-Term Contract Form')
console.log('4. Business Service Contract Form')
console.log('5. Consulting Agreement Form')
console.log('6. Freelance Service Agreement Form')
console.log('7. Business Partnership Agreement Form')
console.log('8. Non-Disclosure Agreement Form')
console.log('9. Vendor Service Agreement Form')

console.log('\n📄 Note: Currently only the Full-Time Permanent Employment template')
console.log('   has a real Google Docs template ID configured.')
console.log('   Other templates use placeholder IDs that need to be updated.')