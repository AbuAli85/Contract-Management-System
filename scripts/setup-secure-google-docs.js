#!/usr/bin/env node

/**
 * Secure Google Docs Setup Script
 * This script sets up the Google Docs integration with secure credentials
 */

const fs = require('fs');
const path = require('path');

console.log('🔐 Secure Google Docs Setup\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.log('📝 Creating .env.local file...');
  fs.writeFileSync(envPath, '');
  console.log('✅ .env.local file created\n');
}

// Read current .env.local content
let envContent = '';
if (envExists) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

// Secure Google Docs environment variables (with placeholders)
const secureGoogleDocsEnvVars = `
# Google Docs Integration - SECURE SETUP
# IMPORTANT: Replace the placeholders below with your actual values

# Google Service Account Key (JSON format)
# Get this from Google Cloud Console -> Service Accounts -> Keys
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project-id","private_key_id":"your-private-key-id","private_key":"-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY_HERE\\n-----END PRIVATE KEY-----\\n","client_email":"your-service-account@your-project.iam.gserviceaccount.com","client_id":"your-client-id","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"your-cert-url","universe_domain":"googleapis.com"}'

# Google Docs Template ID (Create a template and get this ID from the URL)
GOOGLE_DOCS_TEMPLATE_ID=your-template-document-id-here

# Google Drive Output Folder ID (Optional - for organizing generated contracts)
GOOGLE_DRIVE_OUTPUT_FOLDER_ID=your-output-folder-id-here
`;

// Check if Google Docs vars are already in .env.local
const hasGoogleDocsVars = envContent.includes('GOOGLE_SERVICE_ACCOUNT_KEY');

if (!hasGoogleDocsVars) {
  console.log(
    '📝 Adding secure Google Docs environment variables to .env.local...'
  );
  fs.appendFileSync(envPath, secureGoogleDocsEnvVars);
  console.log('✅ Secure Google Docs environment variables added\n');
} else {
  console.log('✅ Google Docs environment variables already present\n');
}

// Display setup instructions
console.log('🔧 SETUP INSTRUCTIONS:');
console.log('');
console.log('1. 📋 Get your Google Service Account Key:');
console.log('   - Go to https://console.cloud.google.com');
console.log('   - Project: nth-segment-475411-g1');
console.log('   - IAM & Admin → Service Accounts');
console.log('   - Click on contract-generator service account');
console.log('   - Keys tab → Add Key → Create New Key → JSON');
console.log('   - Copy the entire JSON content');
console.log('');

console.log('2. 📝 Update .env.local:');
console.log('   - Replace GOOGLE_SERVICE_ACCOUNT_KEY with your actual JSON');
console.log('   - Replace GOOGLE_DOCS_TEMPLATE_ID with your template ID');
console.log('   - (Optional) Replace GOOGLE_DRIVE_OUTPUT_FOLDER_ID');
console.log('');

console.log('3. 📄 Create Google Docs Template:');
console.log('   - Go to https://docs.google.com/document/create');
console.log(
  '   - Add placeholders like {{contract_number}}, {{promoter_name_en}}'
);
console.log(
  '   - Share with: contract-generator@nth-segment-475411-g1.iam.gserviceaccount.com'
);
console.log('   - Set permission to Editor');
console.log('   - Copy document ID from URL');
console.log('');

console.log('4. 🔧 Enable Google APIs:');
console.log('   - Google Docs API');
console.log('   - Google Drive API');
console.log('');

console.log('5. 🧪 Test the integration:');
console.log('   - npm run dev');
console.log('   - Visit: http://localhost:3000/api/debug/google-docs-config');
console.log('   - Should show all green checkmarks');
console.log('');

console.log('🚨 SECURITY NOTES:');
console.log('- Never commit .env.local to git');
console.log('- Never share your service account key');
console.log('- Use environment variables in production');
console.log('- Rotate keys regularly');
console.log('');

console.log('📚 For production deployment:');
console.log('- Add environment variables to your hosting platform');
console.log('- See PRODUCTION_GOOGLE_DOCS_SETUP.md for details');
console.log('');

console.log('🎉 Secure setup completed!');
console.log(
  "Update your .env.local file with the actual credentials and you're ready to go!"
);
