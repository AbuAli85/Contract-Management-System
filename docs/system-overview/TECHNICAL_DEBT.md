# Technical Debt Tracker

This document tracks known technical debt items that need to be addressed for a production-ready system.

## High Priority

### 1. TypeScript Strict Checking Disabled

**Status**: Build currently ignores TypeScript errors
**Location**: `next.config.js` - `ignoreBuildErrors: true`
**Impact**: Type safety is not enforced at build time

**Required Actions**:
1. Fix type errors in `app/api/admin/roles/route.ts` - permissions mapping
2. Fix type errors in `app/api/admin/bulk-import/route.ts` - array index access
3. Fix type errors in files using `api_keys` table - table not in generated types
4. Add proper types for Supabase tables not in auto-generated types
5. Run `npx supabase gen types typescript` to regenerate database types

**Files with Type Errors**:
- `app/api/admin/roles/route.ts`
- `app/api/admin/bulk-import/route.ts`
- `app/api/admin/api-keys/**/*` (entire folder)
- Various files using `any` type

### 2. ESLint Rules Relaxed

**Status**: Some rules changed from `error` to `warn`
**Location**: `.eslintrc.json`
**Impact**: Code quality issues not blocking deployment

**Changed Rules**:
- `@typescript-eslint/no-unused-vars`: error → warn
- `object-shorthand`: error → warn
- `prefer-template`: error → warn

**Required Actions**:
1. Fix unused variable warnings
2. Apply object shorthand syntax
3. Use template literals consistently
4. Change rules back to `error`

### 3. Disabled API Routes

**Status**: Several API routes are disabled but still in codebase
**Location**: 
- `app/api/_disabled/`
- `app/api/_disabled_debug/`

**Required Actions**:
1. Review each disabled route for relevance
2. Delete obsolete routes
3. Fix and re-enable needed routes
4. Archive disabled code if needed for reference

## Medium Priority

### 4. Duplicate/Legacy API Routes

**Status**: Multiple routes for same functionality
**Impact**: Confusion, maintenance overhead

**Examples**:
- Multiple auth login routes
- Multiple contract generation routes
- Duplicate health check endpoints

**Required Actions**:
1. Audit all API routes
2. Consolidate to standard patterns
3. Add deprecation warnings to legacy routes
4. Remove legacy routes after migration

### 5. Console.log Usage

**Status**: Many files use console.log instead of structured logger
**Impact**: Inconsistent logging, potential info leakage

**Required Actions**:
1. Replace console.log with logger from `lib/utils/logger.ts`
2. Add appropriate log levels
3. Ensure no sensitive data in logs

### 6. xlsx Library Vulnerability

**Status**: Known high-severity vulnerability with no fix
**Location**: `node_modules/xlsx`
**Usage**: `components/excel-import-modal.tsx`

**Required Actions**:
1. Consider replacing with `exceljs` library
2. Add additional input validation for uploaded files
3. Restrict file upload access to admin users only

## Low Priority

### 7. Hardcoded Demo Credentials

**Status**: Demo credentials visible in code
**Location**: `components/auth/offline-login-form.tsx`
**Impact**: Security in development mode

**Required Actions**:
1. Move demo credentials to environment variables
2. Disable demo mode in production
3. Add warning banner in demo mode

### 8. TODO Comments in Code

**Status**: 112 TODO/FIXME comments across codebase
**Location**: See `docs/system-overview/TODO_TRACKER.md`

**Required Actions**:
1. Convert TODOs to GitHub issues
2. Prioritize by impact
3. Address systematically

## Tracking

| Item | Priority | Status | Target Date |
|------|----------|--------|-------------|
| TypeScript checking | High | Open | - |
| ESLint rules | High | Open | - |
| Disabled routes cleanup | Medium | Open | - |
| API route consolidation | Medium | Open | - |
| Console.log cleanup | Medium | Open | - |
| xlsx replacement | Medium | Open | - |
| Demo credentials | Low | Open | - |
| TODO cleanup | Low | Open | - |

## Definition of Done

Each item is considered done when:
1. Code changes are implemented
2. Tests are passing
3. Build succeeds with strict checks
4. Code review completed
5. Documentation updated

