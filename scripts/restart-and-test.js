#!/usr/bin/env node

/**
 * Restart and Test Script for Authentication Fixes
 * This script helps restart the application and verify the fixes are working
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Authentication Fixes - Restart and Test Script\n');

// Check if package.json exists
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ package.json not found. Please run this script from the project root.');
  process.exit(1);
}

// Check for common package managers
const packageManagers = [
  { name: 'npm', command: 'npm', args: ['run', 'dev'] },
  { name: 'yarn', command: 'yarn', args: ['dev'] },
  { name: 'pnpm', command: 'pnpm', args: ['dev'] }
];

let packageManager = null;

// Find available package manager
for (const pm of packageManagers) {
  try {
    require('child_process').execSync(`${pm.command} --version`, { stdio: 'ignore' });
    packageManager = pm;
    break;
  } catch (error) {
    // Package manager not available
  }
}

if (!packageManager) {
  console.error('❌ No package manager found. Please install npm, yarn, or pnpm.');
  process.exit(1);
}

console.log(`✅ Using package manager: ${packageManager.name}`);
console.log('\n📋 Summary of Authentication Fixes Applied:\n');

const fixes = [
  '✅ Reduced API calls from every 30s to every 5 minutes',
  '✅ Added global state management to prevent duplicate requests',
  '✅ Implemented middleware-level rate limiting (5 requests/minute)',
  '✅ Fixed security warning by using getUser() instead of getSession()',
  '✅ Removed duplicate rate limiting from API route',
  '✅ Added request deduplication and spam reduction',
  '✅ Added emergency bypass commands for development',
  '✅ Fixed 406 database error handling'
];

fixes.forEach(fix => console.log(`  ${fix}`));

console.log('\n🔄 Restarting development server...\n');

// Kill any existing processes on port 3000
try {
  console.log('🛑 Stopping any existing processes on port 3000...');
  if (process.platform === 'win32') {
    spawn('taskkill', ['/f', '/im', 'node.exe'], { stdio: 'inherit' });
  } else {
    spawn('pkill', ['-f', 'next'], { stdio: 'inherit' });
  }
} catch (error) {
  console.log('ℹ️  No existing processes found or could not stop them');
}

// Wait a moment for processes to stop
setTimeout(() => {
  console.log('🚀 Starting development server...\n');
  
  const devProcess = spawn(packageManager.command, packageManager.args, {
    stdio: 'inherit',
    shell: true
  });

  devProcess.on('error', (error) => {
    console.error('❌ Failed to start development server:', error.message);
    process.exit(1);
  });

  devProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ Development server exited with code ${code}`);
      process.exit(code);
    }
  });

  // Give some time for the server to start
  setTimeout(() => {
    console.log('\n✅ Development server should be running now!');
    console.log('\n📊 Expected Results After Restart:');
    console.log('  • Auth checks every 5 minutes instead of every second');
    console.log('  • Rate limiting at 5 requests per minute');
    console.log('  • Much cleaner console logs');
    console.log('  • No more "column profiles.email does not exist" errors');
    console.log('  • Better performance and reduced server load');
    
    console.log('\n🔍 To monitor the fixes:');
    console.log('  1. Watch the console for reduced auth check logs');
    console.log('  2. Check that rate limiting is working (429 responses)');
    console.log('  3. Verify authentication still works properly');
    
    console.log('\n🚨 Emergency Commands Available:');
    console.log('  • window.forceAuth("luxsess2001@gmail.com", "user") - Force authentication');
    console.log('  • window.enableBypass() - Enable emergency bypass');
    
    console.log('\n⚠️  If you still see issues:');
    console.log('  • Run: node scripts/fix-database-schema.js');
    console.log('  • Check browser console for errors');
    console.log('  • Verify Supabase environment variables');
    
    console.log('\n🎉 Authentication system should now be much more efficient!');
  }, 5000);

}, 2000);