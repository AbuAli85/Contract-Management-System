#!/usr/bin/env node

/**
 * Authentication System Test Runner
 * 
 * This script runs the authentication system tests and provides
 * detailed feedback on the test results.
 */

const { execSync } = require('child_process')
const path = require('path')

console.log('🧪 Running Authentication System Tests...\n')

try {
  // Run the authentication tests
  const testCommand = 'npm test auth/tests/auth.test.tsx -- --verbose --coverage'
  
  console.log(`Running: ${testCommand}\n`)
  
  execSync(testCommand, { 
    stdio: 'inherit',
    cwd: process.cwd()
  })
  
  console.log('\n✅ All authentication tests passed!')
  
} catch (error) {
  console.error('\n❌ Authentication tests failed!')
  console.error('Please check the test output above for details.')
  process.exit(1)
} 