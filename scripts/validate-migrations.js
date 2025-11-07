#!/usr/bin/env node

/**
 * Migration Validation Script
 * Validates Supabase migration files for naming conventions, ordering, and duplicates
 */

const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations');

// Migration naming pattern: YYYYMMDDHHMMSS_description.sql or YYYYMMDD_description.sql
// Also allows special initial migrations like 00_init.sql
const MIGRATION_NAME_PATTERN = /^(\d{8}|\d{14})_(.+)\.sql$/;
const INITIAL_MIGRATION_PATTERN = /^(00_|init_|initial_).*\.sql$/i;

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function validateMigrations() {
  log('\n🔍 Validating Supabase Migrations...\n', 'blue');

  // Check if migrations directory exists
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    error(`Migrations directory not found: ${MIGRATIONS_DIR}`);
    process.exit(1);
  }

  // Read all migration files
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    warning('No migration files found');
    return true;
  }

  info(`Found ${files.length} migration file(s)\n`);

  const errors = [];
  const warnings = [];
  const timestamps = [];
  const names = new Map();

  // Validate each migration file
  for (const file of files) {
    const filePath = path.join(MIGRATIONS_DIR, file);

    // Allow special initial migrations (00_init.sql, etc.)
    if (INITIAL_MIGRATION_PATTERN.test(file)) {
      info(`  ✓ Special initial migration: ${file}`);
      continue;
    }

    // Check naming pattern
    const match = file.match(MIGRATION_NAME_PATTERN);
    if (!match) {
      errors.push(`Invalid migration name format: ${file}`);
      errors.push(`  Expected format: YYYYMMDDHHMMSS_description.sql or YYYYMMDD_description.sql`);
      continue;
    }

    const [, timestamp, description] = match;
    const timestampNum = parseInt(timestamp, 10);

    // Check for duplicate timestamps (warning only, not error)
    if (timestamps.includes(timestampNum)) {
      warnings.push(`Duplicate timestamp found: ${file}`);
      warnings.push(`  Timestamp ${timestamp} is already used by another migration`);
      warnings.push(`  Consider using full timestamp (YYYYMMDDHHMMSS) for better ordering`);
    } else {
      timestamps.push(timestampNum);
    }

    // Check for duplicate names
    const normalizedName = description.toLowerCase().replace(/[_-]/g, '');
    if (names.has(normalizedName)) {
      warnings.push(`Similar migration names detected:`);
      warnings.push(`  - ${names.get(normalizedName)}`);
      warnings.push(`  - ${file}`);
    } else {
      names.set(normalizedName, file);
    }

    // Validate file is not empty
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.trim().length === 0) {
      errors.push(`Empty migration file: ${file}`);
    }

    // Check for basic SQL syntax issues
    if (content.includes('-- TODO') || content.includes('-- FIXME')) {
      warnings.push(`Migration contains TODO/FIXME comments: ${file}`);
    }

    // Validate description is meaningful
    if (description.length < 3) {
      warnings.push(`Short migration description: ${file} (${description})`);
    }
  }

  // Check for timestamp ordering issues
  const sortedTimestamps = [...timestamps].sort((a, b) => a - b);
  if (JSON.stringify(timestamps) !== JSON.stringify(sortedTimestamps)) {
    warnings.push('Migrations are not in chronological order');
    warnings.push('  This is okay if migrations were created out of order, but may cause issues');
  }

  // Report results
  if (errors.length > 0) {
    log('\n❌ Validation Errors:', 'red');
    errors.forEach(err => log(`  ${err}`, 'red'));
  }

  if (warnings.length > 0) {
    log('\n⚠️  Validation Warnings:', 'yellow');
    warnings.forEach(warn => log(`  ${warn}`, 'yellow'));
  }

  if (errors.length === 0 && warnings.length === 0) {
    success('All migrations are valid!');
    log(`\n📊 Summary:`, 'cyan');
    log(`  Total migrations: ${files.length}`, 'cyan');
    log(`  Latest migration: ${files[files.length - 1]}`, 'cyan');
    return true;
  }

  // Count critical errors (excluding duplicate timestamp warnings)
  const criticalErrors = errors.filter(e => !e.includes('Duplicate timestamp'));
  
  if (criticalErrors.length > 0) {
    log(`\n❌ Found ${criticalErrors.length} critical error(s) that must be fixed`, 'red');
    return false;
  }

  if (warnings.length > 0) {
    log(`\n⚠️  Found ${warnings.length} warning(s) - review recommended`, 'yellow');
    log(`  Note: Duplicate timestamps are allowed but may cause ordering issues`, 'yellow');
  }
  
  return true;
}

// Run validation
try {
  const isValid = validateMigrations();
  process.exit(isValid ? 0 : 1);
} catch (err) {
  error(`Validation failed: ${err.message}`);
  console.error(err);
  process.exit(1);
}

