/**
 * Update service account key
 * Usage: node scripts/update-service-account-key.js path/to/new-service-account.json
 */

const fs = require('fs');
const path = require('path');

const jsonFilePath = process.argv[2];

if (!jsonFilePath) {
  console.log('\n📋 Update Service Account Key\n');
  console.log('Usage: node scripts/update-service-account-key.js path/to/new-service-account.json\n');
  console.log('💡 Steps to get the new JSON file:');
  console.log('  1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts?project=nth-segment-475411-g1');
  console.log('  2. Click on: contract-generator@nth-segment-475411-g1.iam.gserviceaccount.com');
  console.log('  3. Go to "Keys" tab');
  console.log('  4. Delete old key (trash icon)');
  console.log('  5. Add Key → Create new key → JSON');
  console.log('  6. Download the new JSON file\n');
  process.exit(1);
}

try {
  // Read and validate JSON file
  const jsonContent = fs.readFileSync(path.resolve(jsonFilePath), 'utf8');
  const credentials = JSON.parse(jsonContent);
  
  // Validate required fields
  if (!credentials.type || credentials.type !== 'service_account') {
    throw new Error('Invalid service account JSON file');
  }
  
  if (!credentials.project_id || !credentials.private_key || !credentials.client_email) {
    throw new Error('JSON file is missing required fields');
  }
  
  console.log('\n✅ New service account key found!');
  console.log(`   Project: ${credentials.project_id}`);
  console.log(`   Email: ${credentials.client_email}`);
  console.log(`   Key ID: ${credentials.private_key_id}\n`);
  
  // Generate Base64 encoded key
  const base64Key = Buffer.from(jsonContent).toString('base64');
  
  console.log('🔧 Updated Production Environment Variable:\n');
  console.log('='.repeat(80));
  
  console.log('\n📋 Variable: GOOGLE_SERVICE_ACCOUNT_KEY_BASE64');
  console.log('Value:');
  console.log(base64Key);
  
  console.log('\n' + '='.repeat(80));
  
  console.log('\n🚀 Next Steps:\n');
  
  console.log('1. 📦 UPDATE PRODUCTION ENVIRONMENT:');
  console.log('   - Replace GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 with the new value above');
  console.log('   - Keep GOOGLE_DOCS_TEMPLATE_ID the same: 1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0');
  console.log('   - Redeploy your production site\n');
  
  console.log('2. 🔗 VERIFY TEMPLATE SHARING:');
  console.log('   - Open: https://docs.google.com/document/d/1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0/edit');
  console.log('   - Click "Share" button');
  console.log(`   - Make sure this email is listed: ${credentials.client_email}`);
  console.log('   - Permission should be "Editor"');
  console.log('   - If not listed, add it with "Editor" permission\n');
  
  console.log('3. 🧪 TEST:');
  console.log('   - After redeploying, test: https://portal.thesmartpro.io/api/test-google-sa');
  console.log('   - Should now work without authentication errors!\n');
  
  // Write to file for easy copying
  const outputFile = path.join(process.cwd(), 'UPDATED_SERVICE_ACCOUNT_KEY.txt');
  const outputContent = `# Updated Service Account Key
# Generated on: ${new Date().toISOString()}
# 
# Copy this to your production platform

GOOGLE_SERVICE_ACCOUNT_KEY_BASE64=${base64Key}

GOOGLE_DOCS_TEMPLATE_ID=1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0

# After adding this, verify template is shared with:
# ${credentials.client_email} (Editor permission)
`;
  
  fs.writeFileSync(outputFile, outputContent);
  console.log('📄 Value also saved to: UPDATED_SERVICE_ACCOUNT_KEY.txt');
  console.log('   (This file is gitignored for security)\n');
  
  console.log('🎯 This should resolve the authentication issues!');
  
} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.log('\nTroubleshooting:');
  console.log('  - Make sure the file path is correct');
  console.log('  - Verify the JSON file is valid');
  console.log('  - Check that you downloaded the right file from Google Cloud Console\n');
  process.exit(1);
}


