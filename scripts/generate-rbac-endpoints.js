#!/usr/bin/env node

/**
 * 🔐 RBAC Endpoint Coverage Generator
 * 
 * This script analyzes the codebase to identify endpoints that need RBAC protection
 * and generates stub files for implementing permission checks.
 * 
 * Usage: node scripts/generate-rbac-endpoints.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const CONFIG = {
  // Directories to scan for API endpoints
  scanDirs: [
    'app/api/**/*.ts',
    'app/api/**/*.tsx',
    'pages/api/**/*.ts',
    'pages/api/**/*.js'
  ],
  // Output directory for generated stubs
  outputDir: 'docs/rbac-endpoints',
  // File patterns to exclude
  excludePatterns: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/*.test.*',
    '**/*.spec.*'
  ]
};

// RBAC permission templates
const PERMISSION_TEMPLATES = {
  // CRUD operations
  'GET': 'read',
  'POST': 'create',
  'PUT': 'edit',
  'PATCH': 'edit',
  'DELETE': 'delete',
  
  // Custom operations
  'SEARCH': 'search',
  'EXPORT': 'export',
  'IMPORT': 'import',
  'APPROVE': 'approve',
  'REJECT': 'reject'
};

// Resource mapping based on file paths
const RESOURCE_MAPPING = {
  'users': 'user',
  'user': 'user',
  'profiles': 'profile',
  'profile': 'profile',
  'contracts': 'contract',
  'contract': 'contract',
  'bookings': 'booking',
  'booking': 'booking',
  'companies': 'company',
  'company': 'company',
  'promoters': 'promoter',
  'promoter': 'promoter',
  'parties': 'party',
  'party': 'party',
  'services': 'service',
  'service': 'service',
  'roles': 'role',
  'role': 'role',
  'permissions': 'permission',
  'permission': 'permission'
};

// Scope suggestions based on resource and action
const SCOPE_SUGGESTIONS = {
  'user:read': ['own', 'organization', 'all'],
  'user:write': ['own', 'organization', 'all'],
  'user:delete': ['all'],
  'contract:read': ['own', 'organization', 'provider', 'all'],
  'contract:write': ['own', 'organization', 'provider', 'all'],
  'contract:delete': ['own', 'organization', 'provider', 'all'],
  'booking:read': ['own', 'organization', 'provider', 'all'],
  'booking:write': ['own', 'organization', 'provider', 'all'],
  'role:assign': ['all'],
  'role:revoke': ['all'],
  'permission:grant': ['all'],
  'permission:revoke': ['all']
};

/**
 * Extract HTTP method from file content
 */
function extractHttpMethod(content) {
  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  const foundMethods = [];
  
  for (const method of methods) {
    if (content.includes(`export async function ${method}`) || 
        content.includes(`export const ${method}`) ||
        content.includes(`method: '${method}'`) ||
        content.includes(`method: "${method}"`)) {
      foundMethods.push(method);
    }
  }
  
  return foundMethods.length > 0 ? foundMethods : ['GET']; // Default to GET
}

/**
 * Extract resource type from file path
 */
function extractResourceType(filePath) {
  const pathParts = filePath.split('/');
  
  for (const part of pathParts) {
    if (RESOURCE_MAPPING[part]) {
      return RESOURCE_MAPPING[part];
    }
  }
  
  // Try to infer from filename
  const fileName = path.basename(filePath, path.extname(filePath));
  if (RESOURCE_MAPPING[fileName]) {
    return RESOURCE_MAPPING[fileName];
  }
  
  return 'unknown';
}

/**
 * Generate permission suggestions
 */
function generatePermissionSuggestions(resource, actions) {
  const suggestions = [];
  
  for (const action of actions) {
    const permissionKey = `${resource}:${action}`;
    const scopes = SCOPE_SUGGESTIONS[permissionKey] || ['own', 'organization', 'provider', 'all'];
    
    for (const scope of scopes) {
      suggestions.push(`${resource}:${action}:${scope}`);
    }
  }
  
  return suggestions;
}

/**
 * Generate RBAC stub content
 */
function generateRbacStub(filePath, httpMethods, resourceType) {
  const fileName = path.basename(filePath, path.extname(filePath));
  const relativePath = path.relative(process.cwd(), filePath);
  
  const actions = httpMethods.map(method => PERMISSION_TEMPLATES[method] || 'read');
  const permissions = generatePermissionSuggestions(resourceType, actions);
  
  return `# RBAC Protection for ${relativePath}

## Endpoint Information
- **File**: \`${relativePath}\`
- **Resource Type**: \`${resourceType}\`
- **HTTP Methods**: ${httpMethods.join(', ')}
- **Actions**: ${actions.join(', ')}

## Required Permissions

The following permissions should be checked before allowing access:

${permissions.map(perm => `- \`${perm}\``).join('\n')}

## Implementation Example

\`\`\`typescript
import { permissionEvaluator } from '@/lib/rbac/evaluate';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: any }
) {
  try {
    // Extract user ID from authenticated session
    const userId = await getUserIdFromSession(request);
    
    // Check permission
    const decision = await permissionEvaluator.evaluatePermission(
      userId,
      '${resourceType}:read:own', // Adjust scope as needed
      {
        context: {
          user: { id: userId },
          params,
          resourceType: '${resourceType}',
          resourceId: params.id,
          request
        }
      }
    );
    
    if (!decision.allowed) {
      return new Response('Forbidden', { status: 403 });
    }
    
    // Proceed with endpoint logic
    // ... your existing code here
    
  } catch (error) {
    console.error('Permission check failed:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
\`\`\`

## Permission Decision

The permission check returns a \`PermissionDecision\` object with:

- \`allowed\`: boolean indicating if access is granted
- \`reason\`: string explaining the decision
- \`permission\`: the permission that was checked
- \`resource\`: the resource type
- \`action\`: the action being performed
- \`scope\`: the scope of access
- \`user_id\`: the user making the request
- \`user_roles\`: array of user's roles
- \`user_permissions\`: array of user's permissions

## Testing

Test this endpoint with users having different permission levels:

1. **No permissions**: Should return 403 Forbidden
2. **Own scope only**: Should allow access to own resources
3. **Organization scope**: Should allow access to organization resources
4. **All scope**: Should allow access to all resources

## Notes

- Adjust the scope (\`own\`, \`organization\`, \`provider\`, \`all\`) based on your security requirements
- Consider implementing resource-level ownership checks for \`own\` scope
- Log all permission decisions for audit purposes
- Cache user permissions to improve performance
`;
}

/**
 * Generate index file
 */
function generateIndex(endpoints) {
  const indexContent = `# RBAC Endpoint Coverage

This document provides an overview of all endpoints that need RBAC protection.

## Summary

- **Total Endpoints**: ${endpoints.length}
- **Protected Resources**: ${[...new Set(endpoints.map(e => e.resourceType))].join(', ')}
- **Coverage Status**: ${endpoints.filter(e => e.hasRbac).length}/${endpoints.length} endpoints protected

## Endpoints by Resource Type

${Object.entries(
  endpoints.reduce((acc, endpoint) => {
    const resource = endpoint.resourceType;
    if (!acc[resource]) acc[resource] = [];
    acc[resource].push(endpoint);
    return acc;
  }, {})
).map(([resource, resourceEndpoints]) => `
### ${resource.charAt(0).toUpperCase() + resource.slice(1)}

${resourceEndpoints.map(endpoint => 
  `- [${endpoint.relativePath}](./${endpoint.fileName}.md) - ${endpoint.httpMethods.join(', ')}`
).join('\n')}
`).join('\n')}

## Implementation Status

| Resource | Total | Protected | Pending |
|----------|-------|-----------|---------|
${Object.entries(
  endpoints.reduce((acc, endpoint) => {
    const resource = endpoint.resourceType;
    if (!acc[resource]) acc[resource] = { total: 0, protected: 0, pending: 0 };
    acc[resource].total++;
    if (endpoint.hasRbac) {
      acc[resource].protected++;
    } else {
      acc[resource].pending++;
    }
    return acc;
  }, {})
).map(([resource, stats]) => 
  `| ${resource} | ${stats.total} | ${stats.protected} | ${stats.pending} |`
).join('\n')}

## Next Steps

1. **Review generated stubs** for each endpoint
2. **Implement permission checks** using the provided examples
3. **Test with different user roles** and permission levels
4. **Update audit logging** to track permission decisions
5. **Monitor performance** and adjust caching as needed

## RBAC Configuration

Ensure the following environment variables are set:

\`\`\`bash
# Enable RBAC enforcement
RBAC_ENFORCEMENT=true

# Optional: Redis cache for permissions
REDIS_URL=redis://localhost:6379

# Cache settings
RBAC_CACHE_TTL=900000
RBAC_CACHE_MAX_SIZE=1000
\`\`\`

## Support

For questions about RBAC implementation, refer to:
- [RBAC System Documentation](../rbac-system.md)
- [Permission Evaluation Guide](../rbac-permissions.md)
- [Audit Logging Guide](../rbac-audit.md)
`;

  return indexContent;
}

/**
 * Main function
 */
async function main() {
  console.log('🔐 RBAC Endpoint Coverage Generator');
  console.log('=====================================\n');
  
  // Create output directory
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    console.log(`✅ Created output directory: ${CONFIG.outputDir}`);
  }
  
  // Find all API endpoints
  const endpoints = [];
  
  for (const pattern of CONFIG.scanDirs) {
    const files = glob.sync(pattern, { ignore: CONFIG.excludePatterns });
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const httpMethods = extractHttpMethod(content);
        const resourceType = extractResourceType(file);
        const hasRbac = content.includes('permissionEvaluator') || 
                        content.includes('rbac') ||
                        content.includes('PermissionDecision');
        
        endpoints.push({
          filePath: file,
          relativePath: path.relative(process.cwd(), file),
          fileName: path.basename(file, path.extname(file)),
          httpMethods,
          resourceType,
          hasRbac
        });
        
        console.log(`📁 Found endpoint: ${file} (${httpMethods.join(', ')})`);
        
      } catch (error) {
        console.warn(`⚠️  Could not read file: ${file}`, error.message);
      }
    }
  }
  
  console.log(`\n📊 Found ${endpoints.length} endpoints to analyze\n`);
  
  // Generate stubs for each endpoint
  for (const endpoint of endpoints) {
    const stubContent = generateRbacStub(
      endpoint.filePath,
      endpoint.httpMethods,
      endpoint.resourceType
    );
    
    const outputFile = path.join(CONFIG.outputDir, `${endpoint.fileName}.md`);
    fs.writeFileSync(outputFile, stubContent);
    console.log(`✅ Generated stub: ${outputFile}`);
  }
  
  // Generate index file
  const indexContent = generateIndex(endpoints);
  const indexFile = path.join(CONFIG.outputDir, 'README.md');
  fs.writeFileSync(indexFile, indexContent);
  console.log(`✅ Generated index: ${indexFile}`);
  
  console.log(`\n🎉 RBAC endpoint coverage generation complete!`);
  console.log(`📁 Output directory: ${CONFIG.outputDir}`);
  console.log(`📚 Generated ${endpoints.length} endpoint stubs`);
  console.log(`\nNext steps:`);
  console.log(`1. Review the generated stubs in ${CONFIG.outputDir}`);
  console.log(`2. Implement permission checks for each endpoint`);
  console.log(`3. Test with different user roles and permissions`);
  console.log(`4. Monitor audit logs for permission decisions`);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error generating RBAC endpoints:', error);
    process.exit(1);
  });
}

module.exports = { main, generateRbacStub, generateIndex };
