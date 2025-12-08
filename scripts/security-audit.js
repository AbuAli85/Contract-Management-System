#!/usr/bin/env node
/**
 * Security Audit Script
 * Scans the codebase for potential security issues
 * 
 * Run with: node scripts/security-audit.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COLORS = {
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m',
};

function log(message, color = COLORS.RESET) {
  console.log(`${color}${message}${COLORS.RESET}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, COLORS.BLUE + COLORS.BOLD);
  console.log('='.repeat(60));
}

function logWarning(message) {
  log(`⚠️  ${message}`, COLORS.YELLOW);
}

function logError(message) {
  log(`❌ ${message}`, COLORS.RED);
}

function logSuccess(message) {
  log(`✅ ${message}`, COLORS.GREEN);
}

// Patterns that indicate potential security issues
const SECURITY_PATTERNS = [
  {
    name: 'Hardcoded API Keys',
    pattern: /(api_key|apikey|API_KEY)\s*[=:]\s*['"][^'"]{10,}['"]/gi,
    severity: 'HIGH',
    exclude: ['node_modules', '.env', '.env.local', '.env.example'],
  },
  {
    name: 'Hardcoded Secrets',
    pattern: /(secret|SECRET|password|PASSWORD)\s*[=:]\s*['"][^'"]{8,}['"]/gi,
    severity: 'HIGH',
    exclude: ['node_modules', '.env', '.env.local', '.env.example', '*.md'],
  },
  {
    name: 'JWT Tokens',
    pattern: /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
    severity: 'HIGH',
    exclude: ['node_modules'],
  },
  {
    name: 'Private Keys',
    pattern: /-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----/gi,
    severity: 'CRITICAL',
    exclude: ['node_modules'],
  },
  {
    name: 'Webhook Secrets in Code',
    pattern: /make_webhook_[a-f0-9]{64}/gi,
    severity: 'HIGH',
    exclude: ['node_modules', '.env', '.env.local'],
  },
  {
    name: 'Console.log with Sensitive Data',
    pattern: /console\.log\s*\([^)]*(?:password|secret|token|key|credential)[^)]*\)/gi,
    severity: 'MEDIUM',
    exclude: ['node_modules'],
  },
  {
    name: 'SQL Injection Risk (String Concatenation)',
    pattern: /\+\s*(?:req\.query|req\.body|params)\s*\+/gi,
    severity: 'HIGH',
    exclude: ['node_modules'],
  },
  {
    name: 'Eval Usage',
    pattern: /\beval\s*\(/gi,
    severity: 'HIGH',
    exclude: ['node_modules', 'next.config.js'],
  },
  {
    name: 'innerHTML Assignment',
    pattern: /\.innerHTML\s*=/gi,
    severity: 'MEDIUM',
    exclude: ['node_modules'],
  },
  {
    name: 'dangerouslySetInnerHTML',
    pattern: /dangerouslySetInnerHTML/gi,
    severity: 'MEDIUM',
    exclude: ['node_modules'],
  },
];

// Files to scan
const SCAN_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json'];

// Directories to skip
const SKIP_DIRS = ['node_modules', '.next', '.git', 'dist', 'build', '.vercel'];

function getAllFiles(dirPath, files = []) {
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      
      if (SKIP_DIRS.includes(item)) continue;
      
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        getAllFiles(fullPath, files);
      } else if (SCAN_EXTENSIONS.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Skip directories we can't access
  }
  
  return files;
}

function scanFile(filePath, pattern) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = content.match(pattern.pattern);
    
    if (matches) {
      // Check if file should be excluded
      if (pattern.exclude) {
        for (const excludePattern of pattern.exclude) {
          if (filePath.includes(excludePattern)) {
            return null;
          }
        }
      }
      
      return {
        file: filePath,
        matches: matches.length,
        severity: pattern.severity,
        samples: matches.slice(0, 3).map(m => m.substring(0, 50) + '...'),
      };
    }
  } catch (error) {
    // Skip files we can't read
  }
  
  return null;
}

function runAudit() {
  logSection('🔐 CONTRACT MANAGEMENT SYSTEM - SECURITY AUDIT');
  
  const projectRoot = path.resolve(__dirname, '..');
  const results = {
    critical: [],
    high: [],
    medium: [],
    low: [],
  };
  
  log(`\n📁 Scanning directory: ${projectRoot}\n`);
  
  // Get all files
  const files = getAllFiles(projectRoot);
  log(`Found ${files.length} files to scan\n`);
  
  // Run each security check
  for (const pattern of SECURITY_PATTERNS) {
    log(`\n🔍 Checking for: ${pattern.name}`);
    
    let foundIssues = [];
    
    for (const file of files) {
      const result = scanFile(file, pattern);
      if (result) {
        foundIssues.push(result);
      }
    }
    
    if (foundIssues.length > 0) {
      logWarning(`Found ${foundIssues.length} potential issues:`);
      
      for (const issue of foundIssues) {
        const relativePath = path.relative(projectRoot, issue.file);
        log(`  - ${relativePath} (${issue.matches} matches)`, 
            issue.severity === 'CRITICAL' ? COLORS.RED : 
            issue.severity === 'HIGH' ? COLORS.YELLOW : COLORS.RESET);
        
        results[issue.severity.toLowerCase()].push({
          pattern: pattern.name,
          file: relativePath,
          matches: issue.matches,
        });
      }
    } else {
      logSuccess('No issues found');
    }
  }
  
  // Check for environment variable usage
  logSection('📋 ENVIRONMENT VARIABLE CHECK');
  
  const envVarsUsed = new Set();
  const envRegex = /process\.env\.([A-Z_][A-Z0-9_]*)/g;
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      let match;
      while ((match = envRegex.exec(content)) !== null) {
        envVarsUsed.add(match[1]);
      }
    } catch (error) {
      // Skip
    }
  }
  
  log(`\nFound ${envVarsUsed.size} environment variables used:`);
  
  const sensitiveEnvVars = [...envVarsUsed].filter(v => 
    v.includes('SECRET') || 
    v.includes('KEY') || 
    v.includes('PASSWORD') ||
    v.includes('TOKEN')
  );
  
  if (sensitiveEnvVars.length > 0) {
    log('\n⚠️  Sensitive environment variables (ensure these are not committed):');
    sensitiveEnvVars.forEach(v => log(`  - ${v}`, COLORS.YELLOW));
  }
  
  // Check for .env files that shouldn't be committed
  logSection('📁 SENSITIVE FILE CHECK');
  
  const sensitiveFiles = [
    '.env',
    '.env.local',
    '.env.production',
    '.env.development',
    'service-account.json',
    'google-credentials.json',
  ];
  
  for (const file of sensitiveFiles) {
    const filePath = path.join(projectRoot, file);
    if (fs.existsSync(filePath)) {
      logWarning(`Found sensitive file: ${file}`);
      
      // Check if it's in .gitignore
      const gitignorePath = path.join(projectRoot, '.gitignore');
      if (fs.existsSync(gitignorePath)) {
        const gitignore = fs.readFileSync(gitignorePath, 'utf8');
        if (!gitignore.includes(file)) {
          logError(`  ⚠️  ${file} is NOT in .gitignore!`);
        } else {
          logSuccess(`  ${file} is in .gitignore`);
        }
      }
    }
  }
  
  // Summary
  logSection('📊 AUDIT SUMMARY');
  
  const totalCritical = results.critical.length;
  const totalHigh = results.high.length;
  const totalMedium = results.medium.length;
  const totalLow = results.low.length;
  
  log(`\n  CRITICAL: ${totalCritical}`, totalCritical > 0 ? COLORS.RED : COLORS.GREEN);
  log(`  HIGH:     ${totalHigh}`, totalHigh > 0 ? COLORS.YELLOW : COLORS.GREEN);
  log(`  MEDIUM:   ${totalMedium}`, totalMedium > 0 ? COLORS.YELLOW : COLORS.GREEN);
  log(`  LOW:      ${totalLow}`, totalLow > 0 ? COLORS.RESET : COLORS.GREEN);
  
  const totalIssues = totalCritical + totalHigh + totalMedium + totalLow;
  
  if (totalIssues === 0) {
    logSuccess('\n🎉 No security issues found!');
  } else {
    logWarning(`\n⚠️  Found ${totalIssues} potential security issues.`);
    log('Review each finding and address as needed.\n');
  }
  
  // Recommendations
  logSection('💡 RECOMMENDATIONS');
  
  log(`
1. SECRETS MANAGEMENT
   - Store all secrets in environment variables
   - Never commit secrets to the repository
   - Use a secrets manager in production (e.g., AWS Secrets Manager, Vault)
   - Rotate secrets regularly

2. CONTENT SECURITY POLICY
   - Replace 'unsafe-inline' with nonces for scripts and styles
   - Remove 'unsafe-eval' when possible
   - See: CSP_NONCE_IMPLEMENTATION_GUIDE.md

3. INPUT VALIDATION
   - Validate all user input on both client and server
   - Use parameterized queries for database operations
   - Sanitize output to prevent XSS

4. AUTHENTICATION & AUTHORIZATION
   - Implement proper session management
   - Use RBAC for access control
   - Enable MFA where possible

5. DEPENDENCY MANAGEMENT
   - Run 'npm audit' regularly
   - Keep dependencies updated
   - Remove unused dependencies
`);
  
  return totalIssues;
}

// Run the audit
const issueCount = runAudit();
process.exit(issueCount > 0 ? 1 : 0);

