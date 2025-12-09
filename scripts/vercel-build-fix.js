#!/usr/bin/env node

/**
 * Vercel Build Fix Script
 * This script helps identify and fix common Vercel build issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Vercel Build Fix Script Starting...\n');

// Check for common issues
const issues = [];
const fixes = [];

// 1. Check for standalone output in next.config.js
console.log('📋 Checking next.config.js...');
try {
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');

  if (nextConfigContent.includes("output: 'standalone'")) {
    issues.push(
      '❌ Found standalone output in next.config.js (causes Vercel issues)'
    );
    fixes.push(
      '✅ Comment out or remove output: "standalone" from next.config.js'
    );
  } else {
    console.log('✅ next.config.js output configuration looks good');
  }
} catch (error) {
  console.log('⚠️  Could not read next.config.js');
}

// 2. Check for Turbopack usage
console.log('\n📋 Checking for Turbopack usage...');
try {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  if (packageJson.scripts && packageJson.scripts.build) {
    if (packageJson.scripts.build.includes('--turbo')) {
      issues.push(
        '❌ Found --turbo flag in build script (can cause Vercel issues)'
      );
      fixes.push(
        '✅ Remove --turbo flag from build script or add --no-turbo to vercel.json'
      );
    } else {
      console.log('✅ Build script looks good');
    }
  }
} catch (error) {
  console.log('⚠️  Could not read package.json');
}

// 3. Check for large files that might cause memory issues
console.log('\n📋 Checking for large files...');
const checkLargeFiles = (dir, maxSize = 10 * 1024 * 1024) => {
  // 10MB
  const files = fs.readdirSync(dir);
  const largeFiles = [];

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (
      stat.isDirectory() &&
      !file.startsWith('.') &&
      file !== 'node_modules'
    ) {
      largeFiles.push(...checkLargeFiles(filePath, maxSize));
    } else if (stat.isFile() && stat.size > maxSize) {
      largeFiles.push({ path: filePath, size: stat.size });
    }
  });

  return largeFiles;
};

try {
  const largeFiles = checkLargeFiles(process.cwd());
  if (largeFiles.length > 0) {
    issues.push(
      `❌ Found ${largeFiles.length} large files (>10MB) that might cause memory issues`
    );
    largeFiles.forEach(file => {
      console.log(
        `   - ${file.path} (${(file.size / 1024 / 1024).toFixed(2)}MB)`
      );
    });
    fixes.push('✅ Consider optimizing or removing large files');
  } else {
    console.log('✅ No large files found');
  }
} catch (error) {
  console.log('⚠️  Could not check for large files');
}

// 4. Check for environment variables
console.log('\n📋 Checking environment variables...');
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  issues.push(`❌ Missing environment variables: ${missingEnvVars.join(', ')}`);
  fixes.push('✅ Set these environment variables in Vercel dashboard');
} else {
  console.log('✅ All required environment variables are set');
}

// 5. Check for problematic dependencies
console.log('\n📋 Checking for problematic dependencies...');
try {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  const problematicDeps = [
    '@libsql/hrana-client', // Known to cause Turbopack issues
    'sharp', // Can cause memory issues
  ];

  const foundProblematic = problematicDeps.filter(
    dep => packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]
  );

  if (foundProblematic.length > 0) {
    issues.push(
      `❌ Found potentially problematic dependencies: ${foundProblematic.join(', ')}`
    );
    fixes.push('✅ Consider updating or replacing these dependencies');
  } else {
    console.log('✅ No problematic dependencies found');
  }
} catch (error) {
  console.log('⚠️  Could not check dependencies');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 BUILD ISSUE SUMMARY');
console.log('='.repeat(50));

if (issues.length === 0) {
  console.log('✅ No obvious issues found!');
  console.log('\n💡 If build is still failing, try:');
  console.log('   1. Check Vercel build logs for specific errors');
  console.log('   2. Ensure all environment variables are set');
  console.log('   3. Try a clean build (delete .next folder)');
  console.log('   4. Contact Vercel support with build logs');
} else {
  console.log(`❌ Found ${issues.length} potential issues:\n`);
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue}`);
  });

  console.log('\n🔧 RECOMMENDED FIXES:\n');
  fixes.forEach((fix, index) => {
    console.log(`${index + 1}. ${fix}`);
  });
}

console.log('\n🚀 Next Steps:');
console.log('1. Apply the recommended fixes above');
console.log('2. Commit and push changes');
console.log('3. Redeploy on Vercel');
console.log('4. Check build logs if issues persist');

console.log('\n✅ Vercel Build Fix Script Complete!');
