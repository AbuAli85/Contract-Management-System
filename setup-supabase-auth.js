#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔐 Setting up Supabase Authentication');
console.log('=====================================');
console.log('');

console.log('📋 Steps to get your Supabase credentials:');
console.log('1. Go to https://supabase.com/dashboard');
console.log('2. Create a new project or select existing');
console.log('3. Go to Settings → API');
console.log('4. Copy your Project URL and anon public key');
console.log('');

rl.question('Enter your Supabase Project URL (e.g., https://your-project.supabase.co): ', (supabaseUrl) => {
  rl.question('Enter your Supabase anon public key (starts with eyJ...): ', (supabaseKey) => {
    
    // Validate inputs
    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Please provide both URL and key');
      rl.close();
      return;
    }

    if (!supabaseUrl.includes('supabase.co')) {
      console.log('❌ Invalid Supabase URL format');
      rl.close();
      return;
    }

    if (!supabaseKey.startsWith('eyJ')) {
      console.log('❌ Invalid anon key format (should start with eyJ...)');
      rl.close();
      return;
    }

    // Create new .env.local content
    const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseKey}
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

    // Write to .env.local
    const envPath = path.join(process.cwd(), '.env.local');
    fs.writeFileSync(envPath, envContent);

    console.log('');
    console.log('✅ Supabase credentials updated!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Restart the development server: npm run dev');
    console.log('2. Go to http://localhost:3004/en/auth/signup');
    console.log('3. Create a new account');
    console.log('4. Then go to http://localhost:3004/en/auth/login');
    console.log('5. Log in with your credentials');
    console.log('');
    console.log('🔗 Supabase Dashboard: https://supabase.com/dashboard');
    console.log('📧 Check your email for verification (if enabled)');

    rl.close();
  });
}); 