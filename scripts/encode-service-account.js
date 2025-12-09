/**
 * Script to encode Service Account JSON to Base64
 * Run: node scripts/encode-service-account.js path/to/service-account.json
 */

const fs = require('fs');
const path = require('path');

// Get file path from command line argument
const filePath = process.argv[2];

if (!filePath) {
  console.error(
    '❌ Error: Please provide the path to your service account JSON file'
  );
  console.log(
    'Usage: node scripts/encode-service-account.js path/to/service-account.json'
  );
  process.exit(1);
}

try {
  // Read the JSON file
  const jsonContent = fs.readFileSync(path.resolve(filePath), 'utf8');

  // Validate it's valid JSON
  JSON.parse(jsonContent);

  // Encode to Base64
  const base64Encoded = Buffer.from(jsonContent).toString('base64');

  console.log('\n✅ Service Account JSON encoded successfully!\n');
  console.log('📋 Add this to your production environment variables:\n');
  console.log('Variable Name: GOOGLE_SERVICE_ACCOUNT_KEY_BASE64');
  console.log('\nVariable Value (copy this):');
  console.log('─'.repeat(80));
  console.log(base64Encoded);
  console.log('─'.repeat(80));
  console.log('\n💡 In your production environment:');
  console.log(
    '   1. Create environment variable: GOOGLE_SERVICE_ACCOUNT_KEY_BASE64'
  );
  console.log('   2. Paste the value above');
  console.log('   3. The app will automatically decode it\n');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
