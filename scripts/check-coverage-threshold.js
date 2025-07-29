#!/usr/bin/env node

/**
 * Coverage Threshold Check Script
 * 
 * This script checks if the test coverage meets the required 80% threshold
 * and fails the build if coverage is insufficient.
 */

const fs = require('fs');
const path = require('path');

const COVERAGE_THRESHOLD = 80;
const COVERAGE_FILE = path.join(__dirname, '../coverage/lcov-report/index.html');

function checkCoverage() {
  console.log('🔍 Checking coverage threshold...');
  
  // Check if coverage file exists
  if (!fs.existsSync(COVERAGE_FILE)) {
    console.error('❌ Coverage file not found. Run tests with coverage first.');
    process.exit(1);
  }

  // Read coverage summary
  const coverageSummaryPath = path.join(__dirname, '../coverage/coverage-summary.json');
  if (!fs.existsSync(coverageSummaryPath)) {
    console.error('❌ Coverage summary not found. Run tests with coverage first.');
    process.exit(1);
  }

  const coverageSummary = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
  
  // Calculate overall coverage
  let totalLines = 0;
  let coveredLines = 0;
  let totalFunctions = 0;
  let coveredFunctions = 0;
  let totalBranches = 0;
  let coveredBranches = 0;
  let totalStatements = 0;
  let coveredStatements = 0;

  Object.values(coverageSummary).forEach(file => {
    totalLines += file.lines.total;
    coveredLines += file.lines.covered;
    totalFunctions += file.functions.total;
    coveredFunctions += file.functions.covered;
    totalBranches += file.branches.total;
    coveredBranches += file.branches.covered;
    totalStatements += file.statements.total;
    coveredStatements += file.statements.covered;
  });

  const lineCoverage = totalLines > 0 ? (coveredLines / totalLines) * 100 : 0;
  const functionCoverage = totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0;
  const branchCoverage = totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0;
  const statementCoverage = totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0;

  console.log('\n📊 Coverage Summary:');
  console.log(`Lines: ${lineCoverage.toFixed(2)}% (${coveredLines}/${totalLines})`);
  console.log(`Functions: ${functionCoverage.toFixed(2)}% (${coveredFunctions}/${totalFunctions})`);
  console.log(`Branches: ${branchCoverage.toFixed(2)}% (${coveredBranches}/${totalBranches})`);
  console.log(`Statements: ${statementCoverage.toFixed(2)}% (${coveredStatements}/${totalStatements})`);

  // Check if all metrics meet threshold
  const meetsThreshold = 
    lineCoverage >= COVERAGE_THRESHOLD &&
    functionCoverage >= COVERAGE_THRESHOLD &&
    branchCoverage >= COVERAGE_THRESHOLD &&
    statementCoverage >= COVERAGE_THRESHOLD;

  if (meetsThreshold) {
    console.log(`\n✅ All coverage metrics meet the ${COVERAGE_THRESHOLD}% threshold!`);
    process.exit(0);
  } else {
    console.log(`\n❌ Coverage does not meet the ${COVERAGE_THRESHOLD}% threshold:`);
    
    if (lineCoverage < COVERAGE_THRESHOLD) {
      console.log(`  - Lines: ${lineCoverage.toFixed(2)}% < ${COVERAGE_THRESHOLD}%`);
    }
    if (functionCoverage < COVERAGE_THRESHOLD) {
      console.log(`  - Functions: ${functionCoverage.toFixed(2)}% < ${COVERAGE_THRESHOLD}%`);
    }
    if (branchCoverage < COVERAGE_THRESHOLD) {
      console.log(`  - Branches: ${branchCoverage.toFixed(2)}% < ${COVERAGE_THRESHOLD}%`);
    }
    if (statementCoverage < COVERAGE_THRESHOLD) {
      console.log(`  - Statements: ${statementCoverage.toFixed(2)}% < ${COVERAGE_THRESHOLD}%`);
    }
    
    console.log('\n💡 To improve coverage:');
    console.log('  1. Add more test cases for uncovered code paths');
    console.log('  2. Test edge cases and error conditions');
    console.log('  3. Ensure all user flows are covered');
    console.log('  4. Run: npm run test:coverage to see detailed coverage report');
    
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Coverage Threshold Check Script

Usage: node scripts/check-coverage-threshold.js [options]

Options:
  --help, -h    Show this help message
  --threshold   Set custom threshold (default: 80)

Examples:
  node scripts/check-coverage-threshold.js
  node scripts/check-coverage-threshold.js --threshold 90
  `);
  process.exit(0);
}

// Check for custom threshold
const thresholdIndex = args.indexOf('--threshold');
if (thresholdIndex !== -1 && args[thresholdIndex + 1]) {
  const customThreshold = parseInt(args[thresholdIndex + 1]);
  if (!isNaN(customThreshold) && customThreshold > 0 && customThreshold <= 100) {
    COVERAGE_THRESHOLD = customThreshold;
    console.log(`📊 Using custom threshold: ${COVERAGE_THRESHOLD}%`);
  }
}

checkCoverage();