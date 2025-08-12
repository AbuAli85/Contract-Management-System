#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting auto-deploy process...');

// Function to run commands
function runCommand(command, description) {
  console.log(`\n📋 ${description}`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed successfully`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
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

// Function to commit and push changes
function commitAndPush(buildId) {
  console.log('\n📝 Committing and pushing changes...');

  try {
    // Add all changes
    execSync('git add .', { stdio: 'inherit' });

    // Commit with build ID
    execSync(
      `git commit -m "Auto-deploy: Build ${buildId} - ${new Date().toISOString()}"`,
      {
        stdio: 'inherit',
      }
    );

    // Push to trigger auto-deploy
    execSync('git push', { stdio: 'inherit' });

    console.log('✅ Changes committed and pushed successfully');
  } catch (error) {
    console.error('❌ Git operations failed:', error.message);
    process.exit(1);
  }
}

// Function to deploy directly with Vercel
function deployWithVercel() {
  console.log('\n🚀 Deploying with Vercel...');

  try {
    // Deploy to production
    execSync('vercel --prod --yes', { stdio: 'inherit' });
    console.log('✅ Deployment completed successfully');
  } catch (error) {
    console.error('❌ Vercel deployment failed:', error.message);
    process.exit(1);
  }
}

// Main execution
async function main() {
  try {
    // Step 1: Update build timestamp
    const buildInfo = updateBuildTimestamp();

    // Step 2: Build the project
    runCommand('pnpm build', 'Building the project');

    // Step 3: Choose deployment method
    const args = process.argv.slice(2);
    const method = args[0] || 'git'; // Default to git method

    if (method === 'git') {
      // Method 1: Commit and push to trigger auto-deploy
      commitAndPush(buildInfo.buildId);
      console.log('\n🎉 Auto-deploy triggered!');
      console.log('📝 Changes pushed to repository');
      console.log('🔄 Vercel will automatically deploy from the push');
    } else if (method === 'direct') {
      // Method 2: Deploy directly with Vercel CLI
      deployWithVercel();
      console.log('\n🎉 Direct deployment completed!');
    } else {
      console.log('\n❌ Invalid method. Use "git" or "direct"');
      process.exit(1);
    }

    console.log('\n📝 Next steps:');
    console.log('1. Check your Vercel dashboard for deployment status');
    console.log('2. Clear browser cache (Ctrl+Shift+R)');
    console.log('3. Test the application on the deployed URL');
  } catch (error) {
    console.error('\n❌ Auto-deploy failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
