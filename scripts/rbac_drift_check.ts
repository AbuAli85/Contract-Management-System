#!/usr/bin/env tsx

/**
 * 🛡️ RBAC Drift Check
 * 
 * This script analyzes RBAC permissions across:
 * - Database seeds (scripts/seed_rbac.sql)
 * - Code guards (withRBAC, withAnyRBAC)
 * - Documentation (docs/rbac_endpoint_mapping.md)
 * 
 * Outputs drift report with priority levels:
 * - P0: Used in code but NOT seeded (CRITICAL)
 * - P2: Seeded but NOT used in code (LOW)
 * - P2: Declared in docs but neither seeded nor used (LOW)
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

interface Permission {
  name: string;
  resource: string;
  action: string;
  scope: string;
  description: string;
}

interface DriftReport {
  p0Critical: string[];
  p2Low: string[];
  p2Documentation: string[];
  summary: {
    totalSeeded: number;
    totalUsedInCode: number;
    totalInDocs: number;
    p0Count: number;
    p2Count: number;
    p2DocCount: number;
  };
}

class RBACDriftChecker {
  private seededPermissions: Set<string> = new Set();
  private usedInCode: Set<string> = new Set();
  private inDocumentation: Set<string> = new Set();
  private permissionDetails: Map<string, Permission> = new Map();

  async run(): Promise<void> {
    console.log('🔍 Starting RBAC drift analysis...\n');

    await this.parseSeededPermissions();
    await this.parseCodeGuards();
    await this.parseDocumentation();
    await this.generateReport();
  }

  private async parseSeededPermissions(): Promise<void> {
    console.log('📊 Parsing seeded permissions from database...');
    
    try {
      // Check if we have database credentials
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseServiceKey) {
        console.log('   ⚠️  No database credentials, falling back to seed_rbac.sql file...');
        await this.parseSeededPermissionsFromFile();
        return;
      }
      
      // Import Supabase client dynamically
      const { createClient } = await import('@supabase/supabase-js');
      
      // Create admin client
      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      
      // Query the permissions table
      const { data: permissions, error } = await supabase
        .from('permissions')
        .select('*');
      
      if (error) {
        console.log('   ⚠️  Database query failed, falling back to seed_rbac.sql file...');
        await this.parseSeededPermissionsFromFile();
        return;
      }
      
      // Process database permissions
      permissions.forEach(perm => {
        this.seededPermissions.add(perm.name);
        this.permissionDetails.set(perm.name, {
          name: perm.name,
          resource: perm.resource,
          action: perm.action,
          scope: perm.scope,
          description: perm.description || ''
        });
      });
      
      console.log(`   ✅ Found ${this.seededPermissions.size} seeded permissions from database`);
    } catch (error) {
      console.log('   ⚠️  Database connection failed, falling back to seed_rbac.sql file...');
      await this.parseSeededPermissionsFromFile();
    }
  }

  private async parseSeededPermissionsFromFile(): Promise<void> {
    try {
      const seedContent = readFileSync('scripts/seed_rbac.sql', 'utf-8');
      
      // Extract permission INSERT statements
      const permissionRegex = /INSERT INTO permissions \(.*?\) VALUES\s*\((.*?)\)/gs;
      let match;
      
      while ((match = permissionRegex.exec(seedContent)) !== null) {
        const values = match[1].split(',').map(v => v.trim().replace(/'/g, ''));
        if (values.length >= 4) {
          const name = values[3];
          const resource = values[0];
          const action = values[1];
          const scope = values[2];
          const description = values[4] || '';
          
          this.seededPermissions.add(name);
          this.permissionDetails.set(name, {
            name,
            resource,
            action,
            scope,
            description
          });
        }
      }
      
      console.log(`   ✅ Found ${this.seededPermissions.size} seeded permissions from file`);
    } catch (error) {
      console.error('   ❌ Error reading seed_rbac.sql:', error);
      process.exit(1);
    }
  }

  private async parseCodeGuards(): Promise<void> {
    console.log('🔒 Parsing code guards...');
    
    try {
      // Find all TypeScript files with withRBAC or withAnyRBAC
      const files = await glob('**/*.{ts,tsx}', {
        ignore: ['node_modules/**', 'dist/**', 'build/**', '.next/**', 'scripts/**']
      });
      
      let totalGuards = 0;
      
      for (const file of files) {
        const content = readFileSync(file, 'utf-8');
        
        // Extract withRBAC('permission:name')
        const withRBACRegex = /withRBAC\(['"`]([^'"`]+)['"`]/g;
        let match;
        while ((match = withRBACRegex.exec(content)) !== null) {
          this.usedInCode.add(match[1]);
          totalGuards++;
        }
        
        // Extract withAnyRBAC(['permission1', 'permission2'])
        const withAnyRBACRegex = /withAnyRBAC\(\[([^\]]+)\]/g;
        while ((match = withAnyRBACRegex.exec(content)) !== null) {
          const permissions = match[1]
            .split(',')
            .map(p => p.trim().replace(/['"`]/g, ''))
            .filter(p => p.length > 0);
          
          permissions.forEach(p => this.usedInCode.add(p));
          totalGuards += permissions.length;
        }
      }
      
      console.log(`   ✅ Found ${totalGuards} permission guards across ${files.length} files`);
    } catch (error) {
      console.error('   ❌ Error parsing code guards:', error);
      process.exit(1);
    }
  }

  private async parseDocumentation(): Promise<void> {
    console.log('📚 Parsing documentation...');
    
    try {
      const docContent = readFileSync('docs/rbac_endpoint_mapping.md', 'utf-8');
      
      // Extract permissions from endpoint mapping table
      const permissionRegex = /`([^`]+)`/g;
      let match;
      
      while ((match = permissionRegex.exec(docContent)) !== null) {
        const permission = match[1];
        if (permission.includes(':') && permission.split(':').length === 3) {
          this.inDocumentation.add(permission);
        }
      }
      
      console.log(`   ✅ Found ${this.inDocumentation.size} documented permissions`);
    } catch (error) {
      console.error('   ❌ Error reading rbac_endpoint_mapping.md:', error);
      // Don't exit, documentation is optional
    }
  }

  private async generateReport(): Promise<void> {
    console.log('\n📋 Generating drift report...');
    
    const report: DriftReport = {
      p0Critical: [],
      p2Low: [],
      p2Documentation: [],
      summary: {
        totalSeeded: this.seededPermissions.size,
        totalUsedInCode: this.usedInCode.size,
        totalInDocs: this.inDocumentation.size,
        p0Count: 0,
        p2Count: 0,
        p2DocCount: 0
      }
    };

    // P0: Used in code but NOT seeded (CRITICAL)
    for (const permission of this.usedInCode) {
      if (!this.seededPermissions.has(permission)) {
        report.p0Critical.push(permission);
        report.summary.p0Count++;
      }
    }

    // P2: Seeded but NOT used in code (LOW)
    for (const permission of this.seededPermissions) {
      if (!this.usedInCode.has(permission)) {
        report.p2Low.push(permission);
        report.summary.p2Count++;
      }
    }

    // P2: In docs but neither seeded nor used (LOW)
    for (const permission of this.inDocumentation) {
      if (!this.seededPermissions.has(permission) && !this.usedInCode.has(permission)) {
        report.p2Documentation.push(permission);
        report.summary.p2DocCount++;
      }
    }

    // Generate markdown report
    const reportContent = this.generateMarkdownReport(report);
    writeFileSync('docs/rbac_drift_report.md', reportContent);
    
    console.log('   ✅ Report generated: docs/rbac_drift_report.md');
    
    // Display summary
    console.log('\n📊 DRIFT ANALYSIS SUMMARY:');
    console.log(`   🔴 P0 Critical: ${report.summary.p0Count} permissions used in code but NOT seeded`);
    console.log(`   🟡 P2 Low: ${report.summary.p2Count} permissions seeded but NOT used in code`);
    console.log(`   🟡 P2 Doc: ${report.summary.p2DocCount} permissions documented but not implemented`);
    
    // Exit with error if P0 issues found
    if (report.summary.p0Count > 0) {
      console.log('\n❌ CRITICAL: P0 issues found! Permissions used in code but not seeded.');
      console.log('   This will cause runtime errors. Please fix before production deployment.');
      process.exit(1);
    } else {
      console.log('\n✅ No critical drift issues found. RBAC system is aligned.');
    }
  }

  private generateMarkdownReport(report: DriftReport): string {
    const timestamp = new Date().toISOString();
    
    return `# 🛡️ RBAC Drift Report

Generated: ${timestamp}

## 📊 Executive Summary

- **Total Seeded Permissions**: ${report.summary.totalSeeded}
- **Total Used in Code**: ${report.summary.totalUsedInCode}
- **Total in Documentation**: ${report.summary.totalInDocs}

## 🔴 P0 Critical Issues (Used in Code but NOT Seeded)

${report.p0Critical.length === 0 ? '✅ No critical issues found' : 
  report.p0Critical.map(p => `- \`${p}\``).join('\n')}

## 🟡 P2 Low Priority Issues

### Seeded but NOT Used in Code
${report.p2Low.length === 0 ? '✅ All seeded permissions are used' : 
  report.p2Low.map(p => `- \`${p}\``).join('\n')}

### Documented but NOT Implemented
${report.p2Documentation.length === 0 ? '✅ All documented permissions are implemented' : 
  report.p2Documentation.map(p => `- \`${p}\``).join('\n')}

## 📋 Detailed Permission Analysis

### Seeded Permissions
${Array.from(this.seededPermissions).sort().map(p => `- \`${p}\``).join('\n')}

### Used in Code
${Array.from(this.usedInCode).sort().map(p => `- \`${p}\``).join('\n')}

### In Documentation
${Array.from(this.inDocumentation).sort().map(p => `- \`${p}\``).join('\n')}

## 🚨 Action Items

${report.summary.p0Count > 0 ? 
  `1. **IMMEDIATE**: Add missing permissions to \`scripts/seed_rbac.sql\`:
     ${report.p0Critical.map(p => `   - \`${p}\``).join('\n     ')}` : 
  '1. ✅ No immediate action required'}

${report.summary.p2Count > 0 ? 
  `2. **REVIEW**: Consider removing unused seeded permissions:
     ${report.p2Low.map(p => `   - \`${p}\``).join('\n     ')}` : 
  '2. ✅ No unused permissions to review'}

${report.summary.p2DocCount > 0 ? 
  `3. **REVIEW**: Update documentation or implement missing permissions:
     ${report.p2Documentation.map(p => `   - \`${p}\``).join('\n     ')}` : 
  '3. ✅ Documentation is aligned'}

## 🔧 How to Fix

### Add Missing Permissions
\`\`\`sql
-- Add to scripts/seed_rbac.sql
INSERT INTO permissions (resource, action, scope, name, description) VALUES
    ('resource', 'action', 'scope', 'permission:name', 'Description');
\`\`\`

### Remove Unused Permissions
\`\`\`sql
-- Remove from scripts/seed_rbac.sql
DELETE FROM permissions WHERE name = 'unused:permission:name';
\`\`\`

### Update Documentation
Edit \`docs/rbac_endpoint_mapping.md\` to reflect actual implementation.

---
*Report generated by RBAC Drift Check script*
`;
  }
}

// Run the checker
async function main() {
  try {
    const checker = new RBACDriftChecker();
    await checker.run();
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
