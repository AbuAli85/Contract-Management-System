#!/usr/bin/env tsx

/**
 * 🛡️ RBAC Guard Lint
 *
 * This script walks through API routes and ensures each exported handler
 * is properly wrapped with RBAC guards (withRBAC or withAnyRBAC).
 *
 * Critical paths (admin, contracts, users, audit-logs, upload, workflow)
 * must have guards or the script exits with non-zero code.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';

interface RouteFile {
  path: string;
  hasGuards: boolean;
  missingHandlers: string[];
  guardedHandlers: string[];
  issues: string[];
}

interface LintReport {
  totalFiles: number;
  filesWithGuards: number;
  filesMissingGuards: number;
  criticalIssues: number;
  routeFiles: RouteFile[];
  summary: {
    admin: { total: number; guarded: number; missing: number };
    contracts: { total: number; guarded: number; missing: number };
    users: { total: number; guarded: number; missing: number };
    auditLogs: { total: number; guarded: number; missing: number };
    upload: { total: number; guarded: number; missing: number };
    workflow: { total: number; guarded: number; missing: number };
    other: { total: number; guarded: number; missing: number };
  };
}

class RBACGuardLinter {
  private criticalPaths = [
    'admin',
    'contracts',
    'users',
    'audit-logs',
    'upload',
    'workflow',
  ];
  private routeFiles: RouteFile[] = [];

  async run(): Promise<void> {
    console.log('🔒 Starting RBAC guard linting...\n');

    await this.scanAPIRoutes();
    await this.generateReport();
    await this.validateCriticalPaths();
  }

  private async scanAPIRoutes(): Promise<void> {
    console.log('🔍 Scanning API routes...');

    try {
      // Find all route.ts files in the API directory
      const routeFiles = await glob('app/api/**/route.ts', {
        ignore: ['node_modules/**', 'dist/**', 'build/**', '.next/**'],
      });

      console.log(`   📁 Found ${routeFiles.length} route files`);

      for (const filePath of routeFiles) {
        await this.analyzeRouteFile(filePath);
      }

      console.log(`   ✅ Analysis complete`);
    } catch (error) {
      console.error('   ❌ Error scanning API routes:', error);
      process.exit(1);
    }
  }

  private async analyzeRouteFile(filePath: string): Promise<void> {
    const content = readFileSync(filePath, 'utf-8');
    const relativePath = filePath.replace('app/api/', '');

    const routeFile: RouteFile = {
      path: relativePath,
      hasGuards: false,
      missingHandlers: [],
      guardedHandlers: [],
      issues: [],
    };

    // Extract exported HTTP method handlers
    const httpMethods = [
      'GET',
      'POST',
      'PUT',
      'DELETE',
      'PATCH',
      'HEAD',
      'OPTIONS',
    ];
    const handlers: { method: string; line: number; hasGuard: boolean }[] = [];

    for (const method of httpMethods) {
      const methodRegex = new RegExp(
        `export\\s+const\\s+${method}\\s*=\\s*(\\w+)\\(`,
        'g'
      );
      let match;

      while ((match = methodRegex.exec(content)) !== null) {
        const wrapper = match[1];
        const lineNumber = content.substring(0, match.index).split('\n').length;

        // Check if the handler is wrapped with RBAC guard
        const hasGuard = wrapper === 'withRBAC' || wrapper === 'withAnyRBAC';

        handlers.push({
          method,
          line: lineNumber,
          hasGuard,
        });

        if (hasGuard) {
          routeFile.guardedHandlers.push(method);
        } else {
          routeFile.missingHandlers.push(method);
        }
      }
    }

    // Check for any handlers without guards
    if (handlers.length > 0) {
      routeFile.hasGuards = handlers.every(h => h.hasGuard);

      if (!routeFile.hasGuards) {
        const missing = handlers.filter(h => !h.hasGuard);
        routeFile.issues.push(
          `Missing RBAC guards for: ${missing.map(h => `${h.method} (line ${h.line})`).join(', ')}`
        );
      }
    } else {
      routeFile.issues.push('No HTTP method handlers found');
    }

    this.routeFiles.push(routeFile);
  }

  private async generateReport(): Promise<void> {
    console.log('📋 Generating lint report...');

    const report: LintReport = {
      totalFiles: this.routeFiles.length,
      filesWithGuards: this.routeFiles.filter(f => f.hasGuards).length,
      filesMissingGuards: this.routeFiles.filter(f => !f.hasGuards).length,
      criticalIssues: 0,
      routeFiles: this.routeFiles,
      summary: {
        admin: { total: 0, guarded: 0, missing: 0 },
        contracts: { total: 0, guarded: 0, missing: 0 },
        users: { total: 0, guarded: 0, missing: 0 },
        auditLogs: { total: 0, guarded: 0, missing: 0 },
        upload: { total: 0, guarded: 0, missing: 0 },
        workflow: { total: 0, guarded: 0, missing: 0 },
        other: { total: 0, guarded: 0, missing: 0 },
      },
    };

    // Categorize files and count issues
    for (const file of this.routeFiles) {
      const category = this.categorizeRoute(file.path);

      if (category === 'other') {
        report.summary.other.total++;
        if (file.hasGuards) {
          report.summary.other.guarded++;
        } else {
          report.summary.other.missing++;
        }
      } else {
        report.summary[category].total++;
        if (file.hasGuards) {
          report.summary[category].guarded++;
        } else {
          report.summary[category].missing++;
          if (this.criticalPaths.includes(category)) {
            report.criticalIssues++;
          }
        }
      }
    }

    // Generate markdown report
    const reportContent = this.generateMarkdownReport(report);
    writeFileSync('docs/rbac_guard_lint.md', reportContent);

    console.log('   ✅ Report generated: docs/rbac_guard_lint.md');

    // Display summary
    console.log('\n📊 GUARD LINT SUMMARY:');
    console.log(`   📁 Total Route Files: ${report.totalFiles}`);
    console.log(`   ✅ Properly Guarded: ${report.filesWithGuards}`);
    console.log(`   ❌ Missing Guards: ${report.filesMissingGuards}`);
    console.log(`   🔴 Critical Issues: ${report.criticalIssues}`);

    // Display category breakdown
    for (const [category, stats] of Object.entries(report.summary)) {
      if (stats.total > 0) {
        const status = stats.missing > 0 ? '❌' : '✅';
        console.log(
          `   ${status} ${category}: ${stats.guarded}/${stats.total} guarded`
        );
      }
    }
  }

  private categorizeRoute(path: string): keyof LintReport['summary'] {
    if (path.startsWith('admin/')) return 'admin';
    if (path.startsWith('contracts/')) return 'contracts';
    if (path.startsWith('users/')) return 'users';
    if (path.startsWith('audit-logs/')) return 'auditLogs';
    if (path.startsWith('upload/')) return 'upload';
    if (path.startsWith('workflow/')) return 'workflow';
    return 'other';
  }

  private async validateCriticalPaths(): Promise<void> {
    console.log('\n🔍 Validating critical paths...');

    let hasCriticalIssues = false;

    for (const path of this.criticalPaths) {
      const files = this.routeFiles.filter(f => f.path.startsWith(path + '/'));
      const missingGuards = files.filter(f => !f.hasGuards);

      if (missingGuards.length > 0) {
        console.log(
          `   ❌ ${path}: ${missingGuards.length} files missing guards`
        );
        hasCriticalIssues = true;

        for (const file of missingGuards) {
          console.log(`      - ${file.path}: ${file.issues.join(', ')}`);
        }
      } else {
        console.log(`   ✅ ${path}: All files properly guarded`);
      }
    }

    if (hasCriticalIssues) {
      console.log('\n❌ CRITICAL: Critical paths have missing RBAC guards!');
      console.log(
        '   This creates security vulnerabilities. Please fix before production deployment.'
      );
      process.exit(1);
    } else {
      console.log(
        '\n✅ All critical paths are properly secured with RBAC guards.'
      );
    }
  }

  private generateMarkdownReport(report: LintReport): string {
    const timestamp = new Date().toISOString();

    return `# 🛡️ RBAC Guard Lint Report

Generated: ${timestamp}

## 📊 Executive Summary

- **Total Route Files**: ${report.totalFiles}
- **Properly Guarded**: ${report.filesWithGuards}
- **Missing Guards**: ${report.filesMissingGuards}
- **Critical Issues**: ${report.criticalIssues}

## 🚨 Critical Path Security Status

### Admin Routes
- **Total**: ${report.summary.admin.total}
- **Guarded**: ${report.summary.admin.guarded}
- **Missing**: ${report.summary.admin.missing}
- **Status**: ${report.summary.admin.missing > 0 ? '❌ INSECURE' : '✅ SECURE'}

### Contract Routes
- **Total**: ${report.summary.contracts.total}
- **Guarded**: ${report.summary.contracts.guarded}
- **Missing**: ${report.summary.contracts.missing}
- **Status**: ${report.summary.contracts.missing > 0 ? '❌ INSECURE' : '✅ SECURE'}

### User Routes
- **Total**: ${report.summary.users.total}
- **Guarded**: ${report.summary.users.guarded}
- **Missing**: ${report.summary.users.missing}
- **Status**: ${report.summary.users.missing > 0 ? '❌ INSECURE' : '✅ SECURE'}

### Audit Log Routes
- **Total**: ${report.summary.auditLogs.total}
- **Guarded**: ${report.summary.auditLogs.guarded}
- **Missing**: ${report.summary.auditLogs.missing}
- **Status**: ${report.summary.auditLogs.missing > 0 ? '❌ INSECURE' : '✅ SECURE'}

### Upload Routes
- **Total**: ${report.summary.upload.total}
- **Guarded**: ${report.summary.upload.guarded}
- **Missing**: ${report.summary.upload.missing}
- **Status**: ${report.summary.upload.missing > 0 ? '❌ INSECURE' : '✅ SECURE'}

### Workflow Routes
- **Total**: ${report.summary.workflow.total}
- **Guarded**: ${report.summary.workflow.guarded}
- **Missing**: ${report.summary.workflow.missing}
- **Status**: ${report.summary.workflow.missing > 0 ? '❌ INSECURE' : '✅ SECURE'}

### Other Routes
- **Total**: ${report.summary.other.total}
- **Guarded**: ${report.summary.other.guarded}
- **Missing**: ${report.summary.other.missing}
- **Status**: ${report.summary.other.missing > 0 ? '⚠️ REVIEW' : '✅ SECURE'}

## 📋 Detailed File Analysis

${report.routeFiles
  .map(file => {
    const status = file.hasGuards ? '✅' : '❌';
    const issues =
      file.issues.length > 0 ? `\n    - Issues: ${file.issues.join(', ')}` : '';
    const handlers =
      file.guardedHandlers.length > 0
        ? `\n    - Guarded: ${file.guardedHandlers.join(', ')}`
        : '';
    const missing =
      file.missingHandlers.length > 0
        ? `\n    - Missing Guards: ${file.missingHandlers.join(', ')}`
        : '';

    return `### ${status} \`${file.path}\`${issues}${handlers}${missing}`;
  })
  .join('\n\n')}

## 🚨 Action Items

${
  report.criticalIssues > 0
    ? `1. **IMMEDIATE**: Fix missing RBAC guards in critical paths:
     ${this.criticalPaths
       .map(path => {
         const files = report.routeFiles.filter(
           f => f.path.startsWith(path + '/') && !f.hasGuards
         );
         if (files.length > 0) {
           return `   - ${path}: ${files.map(f => f.path).join(', ')}`;
         }
         return null;
       })
       .filter(Boolean)
       .join('\n     ')}`
    : '1. ✅ No critical issues to fix'
}

${
  report.filesMissingGuards > 0
    ? `2. **REVIEW**: Add RBAC guards to remaining unsecured routes:
     ${report.routeFiles
       .filter(f => !f.hasGuards)
       .map(f => `   - \`${f.path}\``)
       .join('\n     ')}`
    : '2. ✅ All routes are properly secured'
}

## 🔧 How to Fix

### Add RBAC Guard to Route Handler
\`\`\`typescript
// Before (INSECURE)
export const GET = async (request: NextRequest) => {
  // handler logic
};

// After (SECURE)
export const GET = withRBAC('resource:action:scope', async (request: NextRequest) => {
  // handler logic
});
\`\`\`

### Use Multiple Permission Check
\`\`\`typescript
export const GET = withAnyRBAC(['permission1', 'permission2'], async (request: NextRequest) => {
  // handler logic
});
\`\`\`

### Required Permission Format
All permissions must follow the format: \`{resource}:{action}:{scope}\`

Examples:
- \`user:read:own\` - User can read their own data
- \`contract:create:all\` - User can create contracts for anyone
- \`admin:manage:system\` - Admin can manage system settings

## 📚 RBAC Guard Functions

### withRBAC(permission, handler)
Single permission check - user must have exact permission.

### withAnyRBAC(permissions[], handler)
Multiple permission check - user must have at least one permission.

## 🚨 Security Implications

Missing RBAC guards create security vulnerabilities:
- **Unauthorized Access**: Users can access endpoints without proper permissions
- **Data Breaches**: Sensitive data may be exposed to unauthorized users
- **Privilege Escalation**: Users may gain access to admin functions
- **Compliance Issues**: May violate security compliance requirements

---
*Report generated by RBAC Guard Lint script*
`;
  }
}

// Run the linter
async function main() {
  try {
    const linter = new RBACGuardLinter();
    await linter.run();
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
