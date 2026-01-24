#!/usr/bin/env tsx
/**
 * Pre-Deployment Validation Script
 * 
 * Run this before deploying to catch any issues early.
 * Usage: npx tsx scripts/validate-deployment.ts
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface ValidationResult {
  category: string;
  checks: Array<{
    name: string;
    passed: boolean;
    message?: string;
  }>;
}

const results: ValidationResult[] = [];

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function addCheck(category: string, name: string, passed: boolean, message?: string) {
  let categoryResult = results.find(r => r.category === category);
  if (!categoryResult) {
    categoryResult = { category, checks: [] };
    results.push(categoryResult);
  }
  categoryResult.checks.push({ name, passed, message });
}

// 1. Check required files exist
log('\n📁 Checking Required Files...', 'cyan');

const requiredFiles = [
  'lib/auth/retry.ts',
  'lib/utils/correlation.ts',
  'middleware.ts',
  'app/api/user/companies/route.ts',
  'components/auth/session-refresh.tsx',
  'app/api/diagnostics/env-check/route.ts',
];

requiredFiles.forEach(file => {
  const exists = existsSync(join(process.cwd(), file));
  addCheck('Files', file, exists, exists ? undefined : 'File missing');
  if (exists) {
    log(`  ✓ ${file}`, 'green');
  } else {
    log(`  ✗ ${file} - MISSING`, 'red');
  }
});

// 2. Check for proper imports
log('\n📦 Checking Imports...', 'cyan');

function checkFileImports(filePath: string, expectedImports: string[]) {
  try {
    const content = readFileSync(join(process.cwd(), filePath), 'utf-8');
    let allFound = true;
    const missing: string[] = [];

    expectedImports.forEach(imp => {
      if (!content.includes(imp)) {
        allFound = false;
        missing.push(imp);
      }
    });

    addCheck(
      'Imports',
      filePath,
      allFound,
      allFound ? undefined : `Missing: ${missing.join(', ')}`
    );

    if (allFound) {
      log(`  ✓ ${filePath}`, 'green');
    } else {
      log(`  ✗ ${filePath} - Missing: ${missing.join(', ')}`, 'red');
    }
  } catch (error) {
    addCheck('Imports', filePath, false, 'Cannot read file');
    log(`  ✗ ${filePath} - Cannot read file`, 'red');
  }
}

// Check middleware imports
checkFileImports('middleware.ts', [
  'retryWithBackoff',
  'extractCorrelationId',
  'generateCorrelationId',
]);

// Check API route imports
checkFileImports('app/api/user/companies/route.ts', [
  'retrySupabaseOperation',
  'extractCorrelationId',
  'generateCorrelationId',
  'withCorrelationId',
]);

// Check retry file exports
checkFileImports('lib/auth/retry.ts', [
  'retryWithBackoff',
  'retrySupabaseOperation',
]);

// Check correlation file exports
checkFileImports('lib/utils/correlation.ts', [
  'generateCorrelationId',
  'extractCorrelationId',
  'withCorrelationId',
  'logWithCorrelation',
]);

// 3. Check environment variables
log('\n🔧 Checking Environment Variables...', 'cyan');

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

requiredEnvVars.forEach(envVar => {
  const exists = !!process.env[envVar];
  addCheck('Environment', envVar, exists, exists ? undefined : 'Not set');
  if (exists) {
    log(`  ✓ ${envVar}`, 'green');
  } else {
    log(`  ⚠ ${envVar} - Not set (okay for build, required at runtime)`, 'yellow');
  }
});

// 4. Check TypeScript syntax (basic check)
log('\n🔨 Checking TypeScript Syntax...', 'cyan');

function checkTypeScriptSyntax(filePath: string) {
  try {
    const content = readFileSync(join(process.cwd(), filePath), 'utf-8');
    
    // Basic syntax checks
    const hasValidExports = content.includes('export');
    const hasNoSyntaxErrors = 
      !content.includes('export const') || 
      content.match(/export\s+(const|function|class|interface|type)/);
    
    const isValid = hasValidExports && hasNoSyntaxErrors;
    addCheck('TypeScript', filePath, isValid);
    
    if (isValid) {
      log(`  ✓ ${filePath} - Syntax looks valid`, 'green');
    } else {
      log(`  ⚠ ${filePath} - May have syntax issues`, 'yellow');
    }
  } catch (error) {
    addCheck('TypeScript', filePath, false, 'Cannot read file');
    log(`  ✗ ${filePath} - Cannot read file`, 'red');
  }
}

checkTypeScriptSyntax('lib/auth/retry.ts');
checkTypeScriptSyntax('lib/utils/correlation.ts');

// 5. Check for common issues
log('\n🔍 Checking for Common Issues...', 'cyan');

function checkForIssue(filePath: string, pattern: RegExp, issue: string, shouldExist: boolean = false) {
  try {
    const content = readFileSync(join(process.cwd(), filePath), 'utf-8');
    const found = pattern.test(content);
    const passed = shouldExist ? found : !found;
    addCheck('Code Quality', `${filePath}: ${issue}`, passed);
    if (passed) {
      log(`  ✓ ${filePath}: ${shouldExist ? 'Has' : 'No'} ${issue}`, 'green');
    } else {
      log(`  ⚠ ${filePath}: ${shouldExist ? 'Missing' : 'Found'} ${issue}`, 'yellow');
    }
  } catch (error) {
    // File doesn't exist, skip check
  }
}

// Check for proper error handling
checkForIssue('lib/auth/retry.ts', /catch|error/i, 'error handling', true);
checkForIssue('lib/utils/correlation.ts', /export\s+function/i, 'exported functions', true);

// 6. Check middleware configuration
log('\n⚙️  Checking Middleware Config...', 'cyan');

try {
  const middlewareContent = readFileSync(join(process.cwd(), 'middleware.ts'), 'utf-8');
  
  const hasConfig = middlewareContent.includes('export const config');
  addCheck('Middleware', 'Has config export', hasConfig);
  
  const hasMatcher = middlewareContent.includes('matcher');
  addCheck('Middleware', 'Has matcher', hasMatcher);
  
  const coversApi = middlewareContent.includes('/api/') || 
                    middlewareContent.includes('"/api/"');
  addCheck('Middleware', 'Covers /api/* routes', coversApi);
  
  const hasRetryLogic = middlewareContent.includes('retryWithBackoff');
  addCheck('Middleware', 'Has retry logic', hasRetryLogic);
  
  const hasCorrelationId = middlewareContent.includes('correlationId') || 
                          middlewareContent.includes('correlation');
  addCheck('Middleware', 'Has correlation ID support', hasCorrelationId);
  
  if (hasConfig && hasMatcher && coversApi && hasRetryLogic && hasCorrelationId) {
    log('  ✓ Middleware configuration looks good', 'green');
  } else {
    log('  ⚠ Middleware configuration may need review', 'yellow');
  }
} catch (error) {
  addCheck('Middleware', 'Configuration', false, 'Cannot read middleware.ts');
  log('  ✗ Cannot read middleware.ts', 'red');
}

// 7. Check API route implementation
log('\n🔌 Checking API Route Implementation...', 'cyan');

try {
  const apiRouteContent = readFileSync(join(process.cwd(), 'app/api/user/companies/route.ts'), 'utf-8');
  
  const hasRetryLogic = apiRouteContent.includes('retrySupabaseOperation') || 
                        apiRouteContent.includes('retryWithBackoff');
  addCheck('API Route', 'Has retry logic', hasRetryLogic);
  
  const hasCorrelationId = apiRouteContent.includes('correlationId');
  addCheck('API Route', 'Has correlation ID', hasCorrelationId);
  
  const hasErrorHandling = apiRouteContent.includes('catch') || 
                          apiRouteContent.includes('error');
  addCheck('API Route', 'Has error handling', hasErrorHandling);
  
  const hasEnvCheck = apiRouteContent.includes('NEXT_PUBLIC_SUPABASE_URL') &&
                     apiRouteContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  addCheck('API Route', 'Checks environment variables', hasEnvCheck);
  
  if (hasRetryLogic && hasCorrelationId && hasErrorHandling && hasEnvCheck) {
    log('  ✓ API route implementation looks good', 'green');
  } else {
    log('  ⚠ API route may need review', 'yellow');
  }
} catch (error) {
  addCheck('API Route', 'Implementation', false, 'Cannot read route file');
  log('  ✗ Cannot read API route file', 'red');
}

// 8. Summary
log('\n📊 Validation Summary', 'cyan');
log('='.repeat(50), 'cyan');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
let warningChecks = 0;

results.forEach(result => {
  log(`\n${result.category}:`, 'cyan');
  result.checks.forEach(check => {
    totalChecks++;
    if (check.passed) {
      passedChecks++;
      log(`  ✓ ${check.name}${check.message ? ` - ${check.message}` : ''}`, 'green');
    } else {
      if (check.name.includes('Environment') || check.name.includes('TypeScript')) {
        warningChecks++;
        log(`  ⚠ ${check.name}${check.message ? ` - ${check.message}` : ''}`, 'yellow');
      } else {
        failedChecks++;
        log(`  ✗ ${check.name}${check.message ? ` - ${check.message}` : ''}`, 'red');
      }
    }
  });
});

log('\n' + '='.repeat(50), 'cyan');
log(`Total: ${totalChecks} checks`, 'cyan');
log(`Passed: ${passedChecks}`, 'green');
if (warningChecks > 0) {
  log(`Warnings: ${warningChecks}`, 'yellow');
}
log(`Failed: ${failedChecks}`, failedChecks > 0 ? 'red' : 'green');

// 9. Deployment readiness
log('\n🚀 Deployment Readiness', 'cyan');
log('='.repeat(50), 'cyan');

const criticalFailures = results
  .flatMap(r => r.checks)
  .filter(c => !c.passed && (
    c.name.includes('.ts') && 
    !c.name.includes('Environment') &&
    !c.name.includes('TypeScript')
  ));

if (criticalFailures.length === 0) {
  log('\n✅ All critical checks passed!', 'green');
  log('\nYou can deploy with:', 'cyan');
  log('  git add .', 'cyan');
  log('  git commit -m "feat: Add retry logic and correlation IDs for auth resilience"', 'cyan');
  log('  git push origin main', 'cyan');
  log('\nAfter deployment:', 'cyan');
  log('  1. Check https://portal.thesmartpro.io/api/diagnostics/env-check', 'cyan');
  log('  2. Monitor Vercel logs: vercel logs production --follow', 'cyan');
  log('  3. Look for correlation IDs starting with "cms-"', 'cyan');
  log('  4. Test login flow and verify X-Correlation-ID headers', 'cyan');
} else {
  log('\n⚠️  Some critical checks failed', 'yellow');
  log('\nFailed checks:', 'yellow');
  criticalFailures.forEach(failure => {
    log(`  - ${failure.name}: ${failure.message || 'Failed'}`, 'red');
  });
  log('\nPlease fix these issues before deploying.', 'yellow');
}

// 10. Next steps
log('\n📝 Next Steps', 'cyan');
log('='.repeat(50), 'cyan');

if (criticalFailures.length === 0) {
  log('1. Run build to verify TypeScript:', 'cyan');
  log('   npm run build', 'cyan');
  log('\n2. (Optional) Test locally:', 'cyan');
  log('   npm run dev', 'cyan');
  log('   # Visit http://localhost:3000 and test auth flow', 'cyan');
  log('\n3. Deploy:', 'cyan');
  log('   git push origin main', 'cyan');
  log('\n4. Monitor deployment:', 'cyan');
  log('   # Watch Vercel dashboard', 'cyan');
  log('   # Check logs: vercel logs production --follow', 'cyan');
  log('\n5. Verify:', 'cyan');
  log('   curl -I https://portal.thesmartpro.io/api/diagnostics/env-check', 'cyan');
  log('   # Should see X-Correlation-ID header', 'cyan');
  log('\n6. Test authentication:', 'cyan');
  log('   # Log in at https://portal.thesmartpro.io/en/auth/login', 'cyan');
  log('   # Check Network tab for X-Correlation-ID in headers', 'cyan');
  log('   # Verify /api/user/companies returns 200 (not 401)', 'cyan');
} else {
  log('1. Fix the failed checks listed above', 'cyan');
  log('2. Re-run this validation:', 'cyan');
  log('   npx tsx scripts/validate-deployment.ts', 'cyan');
  log('3. Once all checks pass, proceed with deployment', 'cyan');
}

log('\n' + '='.repeat(50) + '\n', 'cyan');

// Exit with appropriate code
process.exit(criticalFailures.length > 0 ? 1 : 0);
