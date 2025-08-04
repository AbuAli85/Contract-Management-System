#!/usr/bin/env node

/**
 * Comprehensive check for ReferenceError: Cannot access 'em' before initialization
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 COMPREHENSIVE REFERENCEROR CHECK');
console.log('=' .repeat(60));

const filesToCheck = [
  'app/[locale]/dashboard/page.tsx',
  'components/mobile-nav.tsx',
  'components/ui/form.tsx',
  'components/ui/chart.tsx',
  'next.config.js'
];

let totalTemplatesFound = 0;
let totalIssues = 0;

filesToCheck.forEach((filePath, index) => {
  console.log(`\n${index + 1}️⃣ CHECKING: ${filePath}`);
  console.log('─' .repeat(50));
  
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for template literals
    const templateLiterals = content.match(/`[^`]*\${[^}]*}[^`]*`/g);
    const templateCount = templateLiterals ? templateLiterals.length : 0;
    totalTemplatesFound += templateCount;
    
    console.log(`   📝 Template literals found: ${templateCount}`);
    
    if (templateLiterals) {
      console.log('   ⚠️  Template literals detected:');
      templateLiterals.forEach((literal, idx) => {
        console.log(`      ${idx + 1}. ${literal.substring(0, 80)}...`);
        totalIssues++;
      });
    } else {
      console.log('   ✅ No template literals found');
    }
    
    // Check for backticks
    const backticks = (content.match(/`/g) || []).length;
    console.log(`   📊 Backtick count: ${backticks}`);
    
    if (backticks > 0) {
      console.log('   ⚠️  Backticks found - checking if they are template literals...');
      const lines = content.split('\n');
      let backticksInTemplates = 0;
      lines.forEach((line, lineIndex) => {
        if (line.includes('`') && line.includes('${')) {
          console.log(`      Line ${lineIndex + 1}: ${line.trim()}`);
          backticksInTemplates++;
        }
      });
      if (backticksInTemplates === 0) {
        console.log('   ✅ Backticks are not in template literals');
      }
    }
    
  } else {
    console.log('   ❌ File not found');
  }
});

console.log('\n' + '=' .repeat(60));
console.log('🎯 SUMMARY:');
console.log(`   📊 Total template literals found: ${totalTemplatesFound}`);
console.log(`   ⚠️  Total potential issues: ${totalIssues}`);

if (totalIssues === 0) {
  console.log('   ✅ NO TEMPLATE LITERALS FOUND - ISSUE SHOULD BE RESOLVED');
} else {
  console.log('   ❌ TEMPLATE LITERALS STILL PRESENT - NEEDS FIXING');
}

console.log('\n🚀 RECOMMENDED ACTIONS:');
if (totalIssues > 0) {
  console.log('   1. Replace remaining template literals with string concatenation');
  console.log('   2. Use "string" + variable + "string" instead of `string${variable}string`');
  console.log('   3. Test the application to ensure the error is resolved');
} else {
  console.log('   1. Restart the development server');
  console.log('   2. Clear browser cache');
  console.log('   3. Test the application - error should be resolved');
}
