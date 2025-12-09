#!/usr/bin/env node
/**
 * Get Supabase Authentication Token
 *
 * This script authenticates with Supabase and returns an access token
 * for use in API testing and validation scripts.
 *
 * Usage:
 *   node tests/get-auth-token.js
 *
 * Environment Variables:
 *   NEXT_PUBLIC_SUPABASE_URL       - Supabase project URL (required)
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY  - Supabase anonymous key (required)
 *   TEST_USER_EMAIL                - Test user email (required)
 *   TEST_USER_PASSWORD             - Test user password (required)
 */

// Check if we can use ES modules or need CommonJS
let createClient;

(async () => {
  try {
    // Try to import using dynamic import for Node.js compatibility
    const { createClient: client } = await import('@supabase/supabase-js');
    createClient = client;
  } catch (error) {
    console.error('Error: @supabase/supabase-js is not installed.');
    console.error('Run: npm install @supabase/supabase-js');
    process.exit(1);
  }

  // Load environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  // Validate environment variables
  const missing = [];
  if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!email) missing.push('TEST_USER_EMAIL');
  if (!password) missing.push('TEST_USER_PASSWORD');

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => console.error(`   - ${varName}`));
    console.error('\nSet them in your .env.local file or export them:');
    console.error('  export NEXT_PUBLIC_SUPABASE_URL="your-url"');
    console.error('  export NEXT_PUBLIC_SUPABASE_ANON_KEY="your-key"');
    console.error('  export TEST_USER_EMAIL="test@example.com"');
    console.error('  export TEST_USER_PASSWORD="your-password"');
    process.exit(1);
  }

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.error('🔐 Authenticating with Supabase...');
  console.error(`   Email: ${email}`);

  // Sign in
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('❌ Authentication failed:', error.message);
    process.exit(1);
  }

  if (!data.session || !data.session.access_token) {
    console.error('❌ No session or access token received');
    process.exit(1);
  }

  console.error('✅ Authentication successful');
  console.error(`   User ID: ${data.user.id}`);
  console.error(
    `   Token expires: ${new Date(data.session.expires_at * 1000).toISOString()}`
  );
  console.error('');
  console.error('📋 Access Token (copy this):');
  console.error(
    '─────────────────────────────────────────────────────────────'
  );

  // Output the token to stdout (so it can be captured)
  console.log(data.session.access_token);

  console.error(
    '─────────────────────────────────────────────────────────────'
  );
  console.error('');
  console.error('💡 Usage:');
  console.error(
    '   export SUPABASE_AUTH_TOKEN="$(node tests/get-auth-token.js)"'
  );
  console.error('   node tests/performance-validation.js');

  process.exit(0);
})();
