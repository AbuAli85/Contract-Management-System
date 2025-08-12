# RBAC Setup Guide

## ✅ Setup Complete!

The RBAC system has been successfully set up with:
- **5 RBAC tables** created and populated
- **12 pre-defined roles** with proper permission mappings
- **63 permissions** covering all major resources and actions
- **Materialized view** for fast permission lookups
- **Helper functions** for managing roles and permissions

## Quick Start

1. **✅ Migration applied** (via Supabase dashboard)
2. **✅ Roles and permissions seeded** (`npm run rbac:seed`)
3. **✅ Setup verified** (`npm run rbac:test-simple`)

## Available Commands

```bash
# Seed the RBAC system (run once after migration)
npm run rbac:seed

# Test the setup (simple version - recommended)
npm run rbac:test-simple

# Test the setup (advanced version)
npm run rbac:test-setup

# Generate RBAC documentation
npm run rbac:docs
```

## What Gets Created

- **Tables:** `rbac_roles`, `rbac_permissions`, `rbac_role_permissions`, `rbac_user_role_assignments`, `rbac_audit_logs`
- **Materialized View:** `rbac_user_permissions_mv` for fast permission lookups
- **Functions:** Helper functions for upserting roles/permissions
- **12 Pre-defined Roles:** Basic Client, Premium Client, Enterprise Client, Client Administrator, Individual Provider, Provider Team Member, Provider Manager, Provider Administrator, Support Agent, Content Moderator, Platform Administrator, System Administrator

## Usage

The RBAC guard is already wired into `/api/bookings` as an example:

```typescript
import { withRBAC } from '@/lib/rbac/guard'

export const GET = withRBAC('booking:read:own', async (req) => {
  // Your handler logic
})
```

## Next Steps

1. **Set environment variable:**
   ```bash
   # .env.local
   RBAC_ENFORCEMENT=dry-run  # Start with dry-run to audit
   ```

2. **Assign roles to users** via `rbac_user_role_assignments` table

3. **Wire more endpoints** with `withRBAC()` guard

4. **Switch to enforcement mode** when ready:
   ```bash
   RBAC_ENFORCEMENT=enforce
   ```

## Monitoring

Check `rbac_audit_logs` table to see permission checks during dry-run mode.

## Current Status

- ✅ **Phase 0**: Project survey complete
- ✅ **Phase 1**: Database schema & seeds complete  
- ✅ **Phase 2**: Enforcement layer implemented
- ✅ **Phase 3**: Route protection started (bookings API)
- ✅ **Phase 4**: Caching implemented
- ✅ **Phase 5**: Audit logging implemented
- 🔄 **Phase 6**: Tests in progress
- 🔄 **Phase 7**: Documentation in progress
