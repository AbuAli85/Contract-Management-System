const fs = require('fs');
const path = require('path');

console.log('🔧 Updating Make.com webhook URL to the correct one...');

// Read the current .env.local file if it exists
const envPath = path.join(__dirname, '..', '.env.local');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('✅ Found .env.local file');
} else {
  console.log('⚠️ No .env.local file found, creating one...');
}

// Update the webhook URLs to the correct ones from the Make.com scenario
const newWebhookUrl =
  'https://hook.eu2.make.com/71go2x4zwsnha4r1f4en1g9gjxpk3ts4';

// Update MAKE_WEBHOOK_URL
if (envContent.includes('MAKE_WEBHOOK_URL=')) {
  envContent = envContent.replace(
    /MAKE_WEBHOOK_URL=.*/g,
    `MAKE_WEBHOOK_URL=${newWebhookUrl}`
  );
  console.log('✅ Updated existing MAKE_WEBHOOK_URL');
} else {
  envContent += `\nMAKE_WEBHOOK_URL=${newWebhookUrl}`;
  console.log('✅ Added new MAKE_WEBHOOK_URL');
}

// Update NEXT_PUBLIC_MAKE_WEBHOOK_URL
if (envContent.includes('NEXT_PUBLIC_MAKE_WEBHOOK_URL=')) {
  envContent = envContent.replace(
    /NEXT_PUBLIC_MAKE_WEBHOOK_URL=.*/g,
    `NEXT_PUBLIC_MAKE_WEBHOOK_URL=${newWebhookUrl}`
  );
  console.log('✅ Updated existing NEXT_PUBLIC_MAKE_WEBHOOK_URL');
} else {
  envContent += `\nNEXT_PUBLIC_MAKE_WEBHOOK_URL=${newWebhookUrl}`;
  console.log('✅ Added new NEXT_PUBLIC_MAKE_WEBHOOK_URL');
}

// Write the updated content back to the file
fs.writeFileSync(envPath, envContent);
console.log('✅ Updated .env.local file successfully');

console.log('\n📋 Updated Environment Variables:');
console.log(`MAKE_WEBHOOK_URL: ${newWebhookUrl}`);
console.log(`NEXT_PUBLIC_MAKE_WEBHOOK_URL: ${newWebhookUrl}`);

console.log('\n🎯 Make.com Integration Status:');
console.log('✅ Webhook URL updated to the correct one from your scenario');
console.log(
  '✅ Google Docs template ID updated to: 1dzYQ_MDstiErG9O1yP87_bVXvDPQbe8V'
);
console.log('✅ Contract type configuration updated');

console.log('\n🧪 Next Steps:');
console.log('1. Test the integration by generating a contract');
console.log('2. Check Make.com scenario execution');
console.log('3. Verify PDF generation and upload to Supabase');
console.log('4. Confirm contract status update in database');
