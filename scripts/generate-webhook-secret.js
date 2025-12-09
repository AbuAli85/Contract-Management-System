#!/usr/bin/env node

/**
 * Webhook Secret Generator for Make.com Integration
 *
 * This script generates a secure webhook secret and provides
 * instructions for setting it up in Make.com and your application.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${colors.cyan}Step ${step}:${colors.reset} ${message}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Generate webhook secret
function generateWebhookSecret() {
  // Generate a secure random string
  const secret = crypto.randomBytes(32).toString('hex');
  return `make_webhook_${secret}`;
}

// Update .env.local file
function updateEnvFile(secret) {
  const envPath = path.join(process.cwd(), '.env.local');

  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Check if MAKE_WEBHOOK_SECRET already exists
  if (envContent.includes('MAKE_WEBHOOK_SECRET=')) {
    // Update existing entry
    envContent = envContent.replace(
      /MAKE_WEBHOOK_SECRET=.*/,
      `MAKE_WEBHOOK_SECRET=${secret}`
    );
  } else {
    // Add new entry
    envContent += `\n# Make.com Webhook Secret\nMAKE_WEBHOOK_SECRET=${secret}\n`;
  }

  fs.writeFileSync(envPath, envContent);
  return envPath;
}

// Main function
function main() {
  log(
    `${colors.bright}${colors.magenta}🔐 Make.com Webhook Secret Generator${colors.reset}`
  );
  log(
    `${colors.cyan}==========================================${colors.reset}`
  );

  // Step 1: Generate secret
  logStep(1, 'Generating secure webhook secret');
  const secret = generateWebhookSecret();
  logSuccess(`Generated webhook secret: ${secret}`);

  // Step 2: Update .env.local
  logStep(2, 'Updating .env.local file');
  try {
    const envPath = updateEnvFile(secret);
    logSuccess(`Updated ${envPath}`);
  } catch (error) {
    logError(`Failed to update .env.local: ${error.message}`);
    logInfo('You can manually add this to your .env.local file:');
    log(`MAKE_WEBHOOK_SECRET=${secret}`, 'yellow');
  }

  // Step 3: Instructions for Make.com
  logStep(3, 'Set up in Make.com');
  logInfo('1. Go to https://www.make.com/');
  logInfo('2. Click on your organization name (top right)');
  logInfo('3. Select "Organization settings"');
  logInfo('4. Go to "Variables" tab');
  logInfo('5. Click "Add variable"');
  logInfo('6. Set:');
  log(`   Name: MAKE_WEBHOOK_SECRET`, 'yellow');
  log(`   Value: ${secret}`, 'yellow');
  log(`   Type: Text`, 'yellow');
  logInfo('7. Save the variable');

  // Step 4: Test instructions
  logStep(4, 'Test your webhook');
  logInfo('You can test with this curl command:');
  log(
    `curl -X POST https://portal.thesmartpro.io/api/webhook/makecom \\`,
    'yellow'
  );
  log(`  -H "Content-Type: application/json" \\`, 'yellow');
  log(`  -H "X-Webhook-Secret: ${secret}" \\`, 'yellow');
  log(
    `  -d '{"contract_id": "test-001", "contract_number": "TEST-001"}'`,
    'yellow'
  );

  // Step 5: Security reminder
  logStep(5, 'Security reminder');
  logWarning('Keep this secret secure and never commit it to version control!');
  logInfo('The secret has been added to your .env.local file');
  logInfo('Make sure .env.local is in your .gitignore file');

  log('');
  logSuccess('Webhook secret setup completed!');
  logInfo(
    'Your Make.com HTTP module can now use: {{var.organization.MAKE_WEBHOOK_SECRET}}'
  );
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { generateWebhookSecret, updateEnvFile };
