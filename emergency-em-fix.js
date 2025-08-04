#!/usr/bin/env node

/**
 * Emergency fix for ReferenceError: can't access lexical declaration 'em' before initialization
 * This targets the most common patterns that cause this specific error
 */

const fs = require('fs');
const path = require('path');

console.log('🚨 EMERGENCY EM ERROR FIX');
console.log('=' .repeat(50));

// Files most likely to cause the issue
const criticalFiles = [
  'app/layout.tsx',
  'components/mobile-nav.tsx', 
  'components/ui/form.tsx',
  'components/ui/chart.tsx',
  'next.config.js',
  'app/[locale]/dashboard/page.tsx'
];

console.log('🔧 STEP 1: Clear browser cache and restart');
console.log('   - Press Ctrl+Shift+R to hard refresh');
console.log('   - Clear localStorage: localStorage.clear()');
console.log('   - Clear sessionStorage: sessionStorage.clear()');

console.log('\n🔧 STEP 2: Check Next.js build cache');
console.log('   - Delete .next folder');
console.log('   - Restart development server');

let hasActions = false;

criticalFiles.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for common problematic patterns
  const issues = [];
  
  // Pattern 1: Template literals with expressions
  const templateLiterals = content.match(/`[^`]*\${[^}]*}[^`]*`/g);
  if (templateLiterals) {
    issues.push(`Template literals: ${templateLiterals.length}`);
  }
  
  // Pattern 2: Destructuring with em-like variables
  const destructuring = content.match(/const\s*\{\s*[^}]*em[^}]*\s*\}/g);
  if (destructuring) {
    issues.push(`Destructuring with 'em': ${destructuring.length}`);
  }
  
  // Pattern 3: CSS-in-JS with rem/em units
  const cssUnits = content.match(/['"]\d+(\.\d+)?r?em['"]/g);
  if (cssUnits) {
    issues.push(`CSS em/rem units: ${cssUnits.length}`);
  }
  
  if (issues.length > 0) {
    console.log(`\n⚠️  ${filePath}:`);
    issues.forEach(issue => console.log(`   - ${issue}`));
    hasActions = true;
  }
});

console.log('\n🔧 STEP 3: Emergency fallback solutions');
console.log('   1. Disable minification temporarily in next.config.js');
console.log('   2. Add swcMinify: false to next.config.js');
console.log('   3. Use Node.js 18 instead of 20+ if using newer version');

console.log('\n📋 QUICK FIX FOR NEXT.CONFIG.JS:');
console.log(`
module.exports = {
  swcMinify: false,  // Disable SWC minification
  experimental: {
    esmExternals: false  // Disable ESM externals
  }
}
`);

if (!hasActions) {
  console.log('\n✅ Critical files appear clean!');
  console.log('   The error may be from browser cache or build cache.');
  console.log('   Try the browser cache clearing steps above.');
}

console.log('\n🎯 IF ERROR PERSISTS:');
console.log('   1. Open browser DevTools (F12)');
console.log('   2. Go to Console tab');
console.log('   3. Look for the exact error line');
console.log('   4. Check the source map to find the original file');
console.log('   5. Clear all caches and restart both browser and server');
