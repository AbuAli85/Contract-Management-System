#!/usr/bin/env node

/**
 * Find all remaining template literals in the codebase
 */

const fs = require('fs');
const path = require('path');

function findFiles(dir, extensions = ['.tsx', '.jsx', '.ts', '.js']) {
  let results = [];
  
  if (!fs.existsSync(dir)) return results;
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, .next, .git directories
      if (!['node_modules', '.next', '.git', 'cypress'].includes(file)) {
        results = results.concat(findFiles(fullPath, extensions));
      }
    } else {
      const ext = path.extname(file);
      if (extensions.includes(ext)) {
        results.push(fullPath);
      }
    }
  }
  
  return results;
}

console.log('🔍 SCANNING ALL TEMPLATE LITERALS IN CODEBASE');
console.log('=' .repeat(60));

const sourceFiles = findFiles('.', ['.tsx', '.jsx', '.ts', '.js']);
const templateLiteralFiles = [];
let totalTemplatesFound = 0;

sourceFiles.forEach(filePath => {
  // Skip test files and verification scripts
  if (filePath.includes('.test.') || 
      filePath.includes('check-em-error') || 
      filePath.includes('verify-') ||
      filePath.includes('node_modules') ||
      filePath.includes('.next')) {
    return;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const templateLiterals = content.match(/`[^`]*\${[^}]*}[^`]*`/g);
    
    if (templateLiterals) {
      templateLiteralFiles.push({
        file: filePath,
        templates: templateLiterals,
        count: templateLiterals.length
      });
      totalTemplatesFound += templateLiterals.length;
    }
  } catch (error) {
    // Skip files that can't be read
  }
});

console.log(`📊 Found template literals in ${templateLiteralFiles.length} files:`);
console.log(`📊 Total template literals: ${totalTemplatesFound}`);

templateLiteralFiles.forEach((fileInfo, index) => {
  console.log(`\n${index + 1}. ${fileInfo.file} (${fileInfo.count} templates)`);
  fileInfo.templates.forEach((template, idx) => {
    console.log(`   ${idx + 1}. ${template.substring(0, 100)}...`);
  });
});

if (totalTemplatesFound === 0) {
  console.log('\n✅ NO TEMPLATE LITERALS FOUND IN SOURCE CODE!');
  console.log('🎉 The ReferenceError should be resolved.');
} else {
  console.log('\n⚠️  TEMPLATE LITERALS STILL PRESENT');
  console.log('🔧 Consider converting these to string concatenation for better stability.');
}
