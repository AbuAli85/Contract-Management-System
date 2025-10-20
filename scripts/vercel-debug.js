#!/usr/bin/env node

/**
 * Vercel Deployment Debug Script
 * 
 * This script helps diagnose common Vercel deployment issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vercel Deployment Diagnostics\n');

// Check Node.js version
console.log('📋 Environment Information:');
console.log(`   Node.js Version: ${process.version}`);
console.log(`   Platform: ${process.platform}`);
console.log(`   Architecture: ${process.arch}\n`);

// Check package.json
console.log('📦 Package.json Analysis:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  console.log(`   Name: ${packageJson.name}`);
  console.log(`   Version: ${packageJson.version}`);
  console.log(`   Node Engine: ${packageJson.engines?.node || 'Not specified'}`);
  console.log(`   Build Script: ${packageJson.scripts?.build || 'Not found'}`);
  console.log(`   Start Script: ${packageJson.scripts?.start || 'Not found'}`);
  
  // Check for problematic dependencies
  const problematicDeps = [
    'sharp', 'canvas', 'puppeteer', 'playwright', 
    'sqlite3', 'better-sqlite3', 'mysql2', 'pg'
  ];
  
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const foundProblematic = problematicDeps.filter(dep => deps[dep]);
  
  if (foundProblematic.length > 0) {
    console.log(`   ⚠️  Potentially problematic dependencies: ${foundProblematic.join(', ')}`);
  } else {
    console.log('   ✅ No problematic dependencies detected');
  }
  
} catch (error) {
  console.log(`   ❌ Error reading package.json: ${error.message}`);
}

console.log('\n');

// Check environment variables
console.log('🔧 Environment Variables Check:');
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`   ✅ ${envVar}: Set (${value.length} characters)`);
  } else {
    console.log(`   ❌ ${envVar}: Missing`);
  }
});

console.log('\n');

// Check file structure
console.log('📁 Critical Files Check:');
const criticalFiles = [
  'package.json',
  'next.config.js',
  'vercel.json',
  'app/layout.tsx',
  'middleware.ts'
];

criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}: Exists`);
  } else {
    console.log(`   ❌ ${file}: Missing`);
  }
});

console.log('\n');

// Check for large files that might cause issues
console.log('📊 File Size Analysis:');
const checkDirectory = (dir, maxSize = 50 * 1024 * 1024) => { // 50MB
  try {
    const files = fs.readdirSync(dir);
    let hasLargeFiles = false;
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile() && stats.size > maxSize) {
        console.log(`   ⚠️  Large file: ${filePath} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
        hasLargeFiles = true;
      }
    });
    
    if (!hasLargeFiles) {
      console.log(`   ✅ No large files in ${dir}`);
    }
  } catch (error) {
    console.log(`   ❌ Error checking ${dir}: ${error.message}`);
  }
};

checkDirectory('.');
checkDirectory('public');

console.log('\n');

// Check for common build issues
console.log('🚨 Common Build Issues Check:');
const issues = [];

// Check for TypeScript errors
try {
  const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  if (tsconfig.compilerOptions?.strict === false) {
    issues.push('TypeScript strict mode is disabled');
  }
} catch (error) {
  issues.push('Cannot read tsconfig.json');
}

// Check for ESLint issues
if (fs.existsSync('.eslintrc.json') || fs.existsSync('eslint.config.js')) {
  console.log('   ✅ ESLint configuration found');
} else {
  issues.push('No ESLint configuration found');
}

// Check for Next.js config
if (fs.existsSync('next.config.js')) {
  console.log('   ✅ Next.js configuration found');
} else {
  issues.push('No Next.js configuration found');
}

if (issues.length > 0) {
  console.log('   ⚠️  Potential issues:');
  issues.forEach(issue => console.log(`      - ${issue}`));
} else {
  console.log('   ✅ No obvious build issues detected');
}

console.log('\n');

// Recommendations
console.log('💡 Recommendations:');
console.log('   1. Ensure all required environment variables are set in Vercel dashboard');
console.log('   2. Check Vercel build logs for specific error messages');
console.log('   3. Try deploying with a minimal configuration first');
console.log('   4. Consider using Vercel CLI for local testing: npx vercel');
console.log('   5. Check if any dependencies require native compilation');

console.log('\n✨ Diagnostics complete!');
