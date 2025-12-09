/**
 * Setup script for new service account
 * Usage: node scripts/setup-new-service-account.js path/to/new-service-account.json
 */

const fs = require('fs');
const path = require('path');

const jsonFilePath = process.argv[2];

if (!jsonFilePath) {
  console.log('\n📋 Setup New Service Account\n');
  console.log(
    'Usage: node scripts/setup-new-service-account.js path/to/new-service-account.json\n'
  );
  console.log('Example:');
  console.log(
    '  node scripts/setup-new-service-account.js ~/Downloads/nth-segment-475411-g1-abc123.json'
  );
  console.log('\n💡 Steps to get the JSON file:');
  console.log(
    '  1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts?project=nth-segment-475411-g1'
  );
  console.log('  2. Create new service account: "contract-generator-v2"');
  console.log('  3. Create new key (JSON)');
  console.log('  4. Download the JSON file\n');
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

  if (
    !credentials.project_id ||
    !credentials.private_key ||
    !credentials.client_email
  ) {
    throw new Error('JSON file is missing required fields');
  }

  console.log('\n✅ New service account JSON found!');
  console.log(`   Project: ${credentials.project_id}`);
  console.log(`   Email: ${credentials.client_email}\n`);

  // Generate Base64 encoded key
  const base64Key = Buffer.from(jsonContent).toString('base64');

  console.log('🔧 Production Environment Variables for NEW Service Account:\n');
  console.log('='.repeat(80));

  console.log('\n📋 Variable 1: GOOGLE_SERVICE_ACCOUNT_KEY_BASE64');
  console.log('Value:');
  console.log(base64Key);

  console.log('\n\n📋 Variable 2: GOOGLE_DOCS_TEMPLATE_ID');
  console.log('Value:');
  console.log('1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0');

  console.log('\n' + '='.repeat(80));

  console.log('\n🚀 Next Steps:\n');

  console.log('1. 📦 UPDATE PRODUCTION ENVIRONMENT VARIABLES:');
  console.log(
    '   - Replace GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 with the new value above'
  );
  console.log('   - Keep GOOGLE_DOCS_TEMPLATE_ID the same');
  console.log('   - Redeploy your production site\n');

  console.log('2. 🔗 SHARE TEMPLATE WITH NEW SERVICE ACCOUNT:');
  console.log(
    '   - Open: https://docs.google.com/document/d/1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0/edit'
  );
  console.log('   - Click "Share" button');
  console.log(`   - Add: ${credentials.client_email}`);
  console.log('   - Set permission: Editor');
  console.log('   - Uncheck "Notify people"');
  console.log('   - Click "Done"\n');

  console.log('3. 🧪 TEST:');
  console.log(
    '   - After redeploying, test: https://portal.thesmartpro.io/api/test-google-sa'
  );
  console.log('   - Should now work without storage quota errors!\n');

  // Write to file for easy copying
  const outputFile = path.join(process.cwd(), 'NEW_SERVICE_ACCOUNT_ENV.txt');
  const outputContent = `# New Service Account Environment Variables
# Generated on: ${new Date().toISOString()}
# 
# Copy these to your production platform

GOOGLE_SERVICE_ACCOUNT_KEY_BASE64=${base64Key}

GOOGLE_DOCS_TEMPLATE_ID=1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0

# After adding these, share your template with:
# ${credentials.client_email} (Editor permission)
`;

  fs.writeFileSync(outputFile, outputContent);
  console.log('📄 Values also saved to: NEW_SERVICE_ACCOUNT_ENV.txt');
  console.log('   (This file is gitignored for security)\n');

  console.log(
    '🎯 This new service account should resolve the storage quota issue!'
  );
} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.log('\nTroubleshooting:');
  console.log('  - Make sure the file path is correct');
  console.log('  - Verify the JSON file is valid');
  console.log(
    '  - Check that you downloaded the right file from Google Cloud Console\n'
  );
  process.exit(1);
}
