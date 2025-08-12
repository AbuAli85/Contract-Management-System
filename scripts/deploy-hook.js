#!/usr/bin/env node

const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Triggering deployment via deploy hook...');

// Function to trigger deploy hook
async function triggerDeployHook(hookUrl) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      hookUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Contract-Management-System/1.0',
        },
      },
      res => {
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          console.log(`✅ Deploy hook triggered successfully!`);
          console.log(`📊 Response: ${res.statusCode} ${res.statusMessage}`);
          resolve(data);
        });
      }
    );

    req.on('error', error => {
      console.error('❌ Deploy hook failed:', error.message);
      reject(error);
    });

    req.end();
  });
}

// Function to update build timestamp
function updateBuildTimestamp() {
  console.log('\n🕒 Updating build timestamp...');

  const timestamp = Date.now();
  const buildTimestamp = {
    timestamp: new Date().toISOString(),
    buildId: `build-${timestamp}`,
    version: `1.0.0-${timestamp}`,
    environment: process.env.NODE_ENV || 'production',
  };

  try {
    // Update package.json version
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    packageJson.version = buildTimestamp.version;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    // Ensure public directory exists
    const publicDir = path.join(__dirname, '..', 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Create build timestamp file
    const timestampPath = path.join(publicDir, 'build-timestamp.json');
    fs.writeFileSync(timestampPath, JSON.stringify(buildTimestamp, null, 2));

    console.log(`✅ Build timestamp updated: ${buildTimestamp.buildId}`);
    return buildTimestamp;
  } catch (error) {
    console.error('❌ Error updating build timestamp:', error.message);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    // Get deploy hook URL from environment or arguments
    const hookUrl = process.env.VERCEL_DEPLOY_HOOK || process.argv[2];

    if (!hookUrl) {
      console.error('❌ No deploy hook URL provided!');
      console.log('📝 Usage: node scripts/deploy-hook.js <hook-url>');
      console.log('📝 Or set VERCEL_DEPLOY_HOOK environment variable');
      process.exit(1);
    }

    // Step 1: Update build timestamp
    const buildInfo = updateBuildTimestamp();

    // Step 2: Build the project
    console.log('\n📋 Building the project...');
    try {
      execSync('pnpm build', { stdio: 'inherit' });
      console.log('✅ Build completed successfully');
    } catch (error) {
      console.error('❌ Build failed:', error.message);
      process.exit(1);
    }

    // Step 3: Trigger deploy hook
    console.log('\n🚀 Triggering deployment...');
    await triggerDeployHook(hookUrl);

    console.log('\n🎉 Deployment triggered successfully!');
    console.log(`📝 Build ID: ${buildInfo.buildId}`);
    console.log(`🕒 Timestamp: ${buildInfo.timestamp}`);
    console.log('\n📝 Next steps:');
    console.log('1. Check your Vercel dashboard for deployment status');
    console.log('2. Clear browser cache (Ctrl+Shift+R)');
    console.log('3. Test the application on the deployed URL');
  } catch (error) {
    console.error('\n❌ Deploy hook failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
