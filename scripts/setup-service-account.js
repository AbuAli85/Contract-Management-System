/**
 * Secure Service Account Setup Script
 * This script helps you set up Google Service Account credentials without exposing them in code
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔧 Google Service Account Setup Helper\n');

console.log(
  '📋 This script will help you set up your Google Service Account credentials securely.\n'
);

console.log('🚨 IMPORTANT SECURITY NOTES:');
console.log('   - Never commit actual credentials to git');
console.log('   - Use environment variables for production');
console.log('   - Keep your private keys secure\n');

console.log('📋 Step 1: Create Service Account');
console.log('   1. Go to: https://console.cloud.google.com/');
console.log('   2. Navigate to: IAM & Admin → Service Accounts');
console.log('   3. Click "Create Service Account"');
console.log('   4. Name: contract-generator');
console.log('   5. Click "Create and Continue"');
console.log('   6. Skip permissions (click "Continue")');
console.log('   7. Click "Done"\n');

console.log('📋 Step 2: Generate Key');
console.log('   1. Find your service account in the list');
console.log('   2. Click on the service account name');
console.log('   3. Go to "Keys" tab');
console.log('   4. Click "Add Key" → "Create new key"');
console.log('   5. Choose "JSON" format');
console.log('   6. Click "Create"');
console.log('   7. Save the downloaded JSON file securely\n');

console.log('📋 Step 3: Set Up Environment Variables');
console.log('   You have two options:\n');

console.log('   Option A: Direct JSON (for local development)');
console.log('   Add to your .env.local:');
console.log(
  '   GOOGLE_SERVICE_ACCOUNT_KEY=\'{"type":"service_account",...}\'\n'
);

console.log('   Option B: Base64 Encoded (for production)');
console.log('   Add to your production environment:');
console.log(
  '   GOOGLE_SERVICE_ACCOUNT_KEY_BASE64=eyJ0eXBlIjoic2VydmljZV9hY2NvdW50Ii4uLn0=\n'
);

console.log('📋 Step 4: Share Google Docs Template');
console.log('   1. Open your Google Docs template');
console.log('   2. Click "Share" button');
console.log('   3. Add your service account email (from the JSON file)');
console.log('   4. Give it "Editor" permission');
console.log('   5. Click "Send"\n');

console.log('📋 Step 5: Test Your Setup');
console.log('   After setting up, test with:');
console.log('   - Local: http://localhost:3000/api/test-google-sa');
console.log('   - Production: https://your-domain.com/api/test-google-sa\n');

console.log('🔒 Security Reminders:');
console.log('   - Never commit .env files to git');
console.log('   - Use environment variables in production');
console.log('   - Rotate keys regularly');
console.log('   - Monitor usage in Google Cloud Console\n');

console.log('✅ Setup complete! Your contract generation should now work.\n');

// Check if .env.local exists and warn about security
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log('⚠️  Found .env.local file');
  console.log('   Make sure it contains your service account key');
  console.log("   And that it's in your .gitignore file\n");
} else {
  console.log(
    '💡 Tip: Create a .env.local file with your service account key\n'
  );
}

console.log('🚀 Ready to generate contracts!');
