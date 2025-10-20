#!/usr/bin/env node

/**
 * Vercel Build Diagnostic Script
 * Helps identify potential issues that might cause Vercel builds to fail
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vercel Build Diagnostic Starting...\n');

// Check Node.js version
console.log('📋 Environment Information:');
console.log(`Node.js Version: ${process.version}`);
console.log(`Platform: ${process.platform}`);
console.log(`Architecture: ${process.arch}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'undefined'}\n`);

// Check package.json
console.log('📦 Package Information:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`Package Name: ${packageJson.name}`);
  console.log(`Package Version: ${packageJson.version}`);
  console.log(`Next.js Version: ${packageJson.dependencies?.next || 'Not found'}`);
  console.log(`TypeScript Version: ${packageJson.devDependencies?.typescript || 'Not found'}`);
  console.log(`Zustand Version: ${packageJson.dependencies?.zustand || 'Not found'}\n`);
} catch (error) {
  console.error('❌ Error reading package.json:', error.message);
}

// Check critical files
console.log('📁 Critical Files Check:');
const criticalFiles = [
  'next.config.js',
  'vercel.json',
  'package.json',
  'tsconfig.json',
  'lib/stores/contracts-store.ts',
  'components/promoters/enhanced-promoters-view-refactored.tsx',
  'app/[locale]/promoters/page.tsx'
];

criticalFiles.forEach(file => {
  try {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      console.log(`✅ ${file} (${stats.size} bytes)`);
    } else {
      console.log(`❌ ${file} - MISSING`);
    }
  } catch (error) {
    console.log(`❌ ${file} - ERROR: ${error.message}`);
  }
});

// Check for binary files that might cause issues
console.log('\n🔍 Binary Files Check:');
const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.eot'];
const checkForBinaryFiles = (dir, depth = 0) => {
  if (depth > 3) return; // Limit depth to avoid infinite recursion
  
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        checkForBinaryFiles(filePath, depth + 1);
      } else if (stat.isFile()) {
        const ext = path.extname(file).toLowerCase();
        if (binaryExtensions.includes(ext)) {
          console.log(`📄 ${filePath}`);
        }
      }
    });
  } catch (error) {
    // Ignore permission errors
  }
};

checkForBinaryFiles('.');

// Check for potential TypeScript issues
console.log('\n🔧 TypeScript Configuration Check:');
try {
  const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  console.log('✅ tsconfig.json is valid JSON');
  console.log(`Target: ${tsconfig.compilerOptions?.target || 'Not specified'}`);
  console.log(`Module: ${tsconfig.compilerOptions?.module || 'Not specified'}`);
  console.log(`Strict: ${tsconfig.compilerOptions?.strict || 'Not specified'}`);
} catch (error) {
  console.error('❌ Error reading tsconfig.json:', error.message);
}

// Check for environment variables that might be needed
console.log('\n🌍 Environment Variables Check:');
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

requiredEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar} is set`);
  } else {
    console.log(`⚠️  ${envVar} is not set (might be needed for production)`);
  }
});

// Check for large files that might cause build issues
console.log('\n📊 Large Files Check (>1MB):');
const checkLargeFiles = (dir, depth = 0) => {
  if (depth > 3) return;
  
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        checkLargeFiles(filePath, depth + 1);
      } else if (stat.isFile() && stat.size > 1024 * 1024) {
        console.log(`📦 ${filePath} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
      }
    });
  } catch (error) {
    // Ignore permission errors
  }
};

checkLargeFiles('.');

console.log('\n✅ Vercel Build Diagnostic Complete!');
console.log('\n💡 If Vercel builds are still failing, check:');
console.log('   1. Environment variables in Vercel dashboard');
console.log('   2. Build logs in Vercel dashboard for specific errors');
console.log('   3. Node.js version compatibility');
console.log('   4. Memory limits (Vercel has 4GB limit)');
console.log('   5. Build timeout (Vercel has 15-minute limit)');
