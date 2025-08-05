// Analyze Make.com Blueprint Configuration
console.log('🔍 Analyzing Make.com Blueprint Configuration...');

const blueprintAnalysis = {
  workflow: 'Integration Webhooks, HTTP - FULLY FUNCTIONAL',
  modules: [
    '1. CustomWebHook (Trigger)',
    '2. HTTP GET Contract Data from Supabase',
    '3. BasicFeeder (Process Contract Data)',
    '4. Download ID Card Image',
    '5. Upload ID Card to Google Drive',
    '6. Download Passport Image', 
    '7. Upload Passport to Google Drive',
    '8. Create Google Docs from Template',
    '9. Export Document to PDF',
    '10. Upload PDF to Supabase Storage',
    '11. Update Contract Status in Database',
    '12. Webhook Response'
  ],
  
  issues_identified: {
    critical: [
      {
        issue: 'Supabase URL Mismatch',
        description: 'Module 21 uses different Supabase URL: ekdjxzhujettocosgzql vs reootcngcptfogfozlmz',
        module: 21,
        current: 'https://ekdjxzhujettocosgzql.supabase.co',
        expected: 'https://reootcngcptfogfozlmz.supabase.co'
      },
      {
        issue: 'API Keys Mismatch',
        description: 'Different API keys used in module 21 vs module 2',
        module: 21,
        impact: 'Will fail to update contract status'
      }
    ],
    
    configuration: [
      {
        issue: 'Webhook Response URL',
        description: 'Module 22 references wrong Supabase URL in response',
        module: 22,
        impact: 'Incorrect PDF URL returned'
      }
    ]
  },

  correct_configuration: {
    supabase_url: 'https://reootcngcptfogfozlmz.supabase.co',
    api_keys_needed: [
      'anon_key',
      'service_role_key'
    ],
    storage_bucket: 'contracts',
    google_drive_folder: '1WoJfPb62ILAKaMT1jEjXH3zwjfkXmg3a'
  }
};

console.log('\n🚨 CRITICAL ISSUES FOUND:');
blueprintAnalysis.issues_identified.critical.forEach((issue, index) => {
  console.log(`${index + 1}. ${issue.issue}`);
  console.log(`   Module: ${issue.module}`);
  console.log(`   Description: ${issue.description}`);
  if (issue.current && issue.expected) {
    console.log(`   Current: ${issue.current}`);
    console.log(`   Expected: ${issue.expected}`);
  }
  console.log('');
});

console.log('\n✅ WORKFLOW ANALYSIS:');
console.log('The workflow is well-structured and comprehensive:');
console.log('- Properly handles webhook triggers');
console.log('- Downloads and processes promoter documents');
console.log('- Creates contracts from Google Docs templates');
console.log('- Stores PDFs in Supabase storage');
console.log('- Updates contract status in database');

console.log('\n🔧 REQUIRED FIXES:');
console.log('1. Update Module 21 URL to: https://reootcngcptfogfozlmz.supabase.co');
console.log('2. Update Module 21 API keys to match current project');
console.log('3. Update Module 22 response URL to correct Supabase instance');

console.log('\n📋 WEBHOOK INTEGRATION STATUS:');
console.log('- Webhook Hook ID: 2640726');
console.log('- Current URL: https://reootcngcptfogfozlmz.supabase.co (Module 2) ✅');
console.log('- Update URL: https://ekdjxzhujettocosgzql.supabase.co (Module 21) ❌');
console.log('- Response URL: https://ekdjxzhujettocosgzql.supabase.co (Module 22) ❌');
