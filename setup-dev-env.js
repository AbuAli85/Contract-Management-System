#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up development environment...');

const envPath = path.join(process.cwd(), '.env.local');
const envContent = `# Supabase Configuration
# Replace these with your actual Supabase project credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Webhook Configuration (optional for development)
MAKE_SERVICE_CREATION_WEBHOOK=https://hook.eu1.make.com/your-service-creation-webhook
MAKE_BOOKING_CREATED_WEBHOOK=https://hook.eu1.make.com/your-booking-created-webhook
MAKE_TRACKING_UPDATED_WEBHOOK=https://hook.eu1.make.com/your-tracking-updated-webhook
MAKE_PAYMENT_SUCCEEDED_WEBHOOK=https://hook.eu1.make.com/your-payment-succeeded-webhook
WEBHOOK_SECRET=your-webhook-secret-here

# Security Headers (optional)
SECURITY_HEADERS_ENABLED=true
ENABLE_XSS_PROTECTION=true
ENABLE_CONTENT_SECURITY_POLICY=true
ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com

# Development Settings
NODE_ENV=development
ENABLE_REQUEST_LOGGING=true

# Build Configuration
BUILD_ID=dev-$(date +%s)
`;

if (fs.existsSync(envPath)) {
  console.log('⚠️  .env.local already exists. Skipping creation.');
  console.log(
    '📝 Please update your .env.local file with real Supabase credentials.'
  );
} else {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env.local file');
  console.log(
    '📝 Please update the Supabase credentials in .env.local with your actual values'
  );
}

console.log('\n📋 Next steps:');
console.log(
  '1. Get your Supabase project URL and anon key from your Supabase dashboard'
);
console.log(
  '2. Update NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
);
console.log('3. Restart the development server: npm run dev');
console.log('\n🔗 Supabase Dashboard: https://supabase.com/dashboard');
console.log(
  '\n💡 For development without Supabase, the app will work in "safe mode"'
);
