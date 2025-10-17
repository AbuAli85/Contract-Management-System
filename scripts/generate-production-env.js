/**
 * Generate Base64-encoded environment variables for production
 * This reads from .env.local and outputs values ready for production deployment
 */

const fs = require('fs');
const path = require('path');

function parseEnvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  
  // Parse .env file
  content.split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    
    // Handle KEY='value' or KEY="value" or KEY=value
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      let key = match[1].trim();
      let value = match[2].trim();
      
      // Remove quotes if present
      if ((value.startsWith("'") && value.endsWith("'")) || 
          (value.startsWith('"') && value.endsWith('"'))) {
        value = value.slice(1, -1);
      }
      
      env[key] = value;
    }
  });
  
  return env;
}

console.log('\n🔧 Generating Production Environment Variables\n');
console.log('='.repeat(60));

try {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.log('\n❌ .env.local not found!');
    console.log('   Run the setup script first: node setup-env-now.js <json-file>\n');
    process.exit(1);
  }
  
  const env = parseEnvFile(envPath);
  
  if (!env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    console.log('\n❌ GOOGLE_SERVICE_ACCOUNT_KEY not found in .env.local\n');
    process.exit(1);
  }
  
  // Generate Base64 encoded key
  const base64Key = Buffer.from(env.GOOGLE_SERVICE_ACCOUNT_KEY).toString('base64');
  
  console.log('\n✅ Production Environment Variables Generated!\n');
  console.log('Copy these to your production platform (Vercel, Railway, etc.):\n');
  console.log('-'.repeat(60));
  
  console.log('\n📋 Variable 1: GOOGLE_SERVICE_ACCOUNT_KEY_BASE64');
  console.log('Value:');
  console.log(base64Key);
  
  console.log('\n\n📋 Variable 2: GOOGLE_DOCS_TEMPLATE_ID');
  console.log('Value:');
  console.log(env.GOOGLE_DOCS_TEMPLATE_ID || '1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0');
  
  console.log('\n' + '-'.repeat(60));
  
  console.log('\n🚀 How to Add to Your Production Platform:\n');
  
  console.log('📦 VERCEL:');
  console.log('   1. Go to: https://vercel.com/dashboard');
  console.log('   2. Select your project');
  console.log('   3. Settings → Environment Variables');
  console.log('   4. Add both variables above');
  console.log('   5. Redeploy your project\n');
  
  console.log('📦 RAILWAY:');
  console.log('   1. Go to your Railway dashboard');
  console.log('   2. Select your project');
  console.log('   3. Variables tab');
  console.log('   4. Add both variables above');
  console.log('   5. Redeploy (automatic)\n');
  
  console.log('📦 NETLIFY:');
  console.log('   1. Go to: https://app.netlify.com');
  console.log('   2. Select your site');
  console.log('   3. Site settings → Environment variables');
  console.log('   4. Add both variables above');
  console.log('   5. Trigger a new deploy\n');
  
  console.log('📦 CUSTOM SERVER:');
  console.log('   Add to your server\'s .env file or export as environment variables\n');
  
  console.log('='.repeat(60));
  console.log('\n✅ IMPORTANT: Also share the template with the service account!');
  console.log('   Template: https://docs.google.com/document/d/1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0/edit');
  console.log('   Share with: contract-generator@nth-segment-475411-g1.iam.gserviceaccount.com');
  console.log('   Permission: Editor\n');
  
  // Write to a file for easy copying
  const outputFile = path.join(process.cwd(), 'PRODUCTION_ENV_VALUES.txt');
  const outputContent = `# Production Environment Variables
# Generated on: ${new Date().toISOString()}
# 
# Copy these to your production platform

GOOGLE_SERVICE_ACCOUNT_KEY_BASE64=${base64Key}

GOOGLE_DOCS_TEMPLATE_ID=${env.GOOGLE_DOCS_TEMPLATE_ID || '1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0'}

# After adding these, share your template with:
# contract-generator@nth-segment-475411-g1.iam.gserviceaccount.com (Editor permission)
`;
  
  fs.writeFileSync(outputFile, outputContent);
  console.log('📄 Values also saved to: PRODUCTION_ENV_VALUES.txt');
  console.log('   (This file is gitignored for security)\n');
  
} catch (error) {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
}

