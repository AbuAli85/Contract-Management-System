# Security Audit: Promoters & Contracts - CRITICAL ISSUES

**Date:** October 13, 2025  
**Auditor:** Security Review  
**Status:** 🚨 CRITICAL - Immediate Action Required

---

## 🚨 Critical Findings

### Promoter Management Module

#### 1. **CRITICAL - Missing RBAC Guards** 
**Severity:** HIGH  
**Files:**
- `app/api/promoters/route.ts:160` (POST - create)
- `app/api/promoters/[id]/route.ts:248` (PUT - update)
- `app/api/promoters/[id]/route.ts:274` (DELETE - delete)

**Issue:** Any authenticated user can create, update, or delete ANY promoter record.

**Impact:**
- Data tampering by unauthorized users
- Privilege escalation
- Data loss from malicious deletions

**Fix Required:** Add RBAC guards using `withRBAC()` wrapper

---

#### 2. **HIGH - Data Leakage in GET Endpoints**
**Severity:** HIGH  
**Files:**
- `app/api/promoters/route.ts:84` (GET list)
- `app/api/promoters/[id]/route.ts:102` (GET single)

**Issue:** Endpoints return full promoter table without scoping to requester.

**Impact:**
- Users can access other users' sensitive data
- No data isolation between tenants/users
- GDPR/privacy violations

**Fix Required:** Scope queries to authenticated user or implement strict RLS

---

#### 3. **MEDIUM - Stub Endpoints Faking Success**
**Severity:** MEDIUM  
**Files:**
- `app/api/promoters/[id]/documents.ts:20`
- `app/api/promoters/[id]/education.ts:19`
- `app/api/promoters/[id]/experience.ts:21`
- `app/api/promoters/[id]/skills.ts:16`

**Issue:** Endpoints return 200 success but don't actually store data.

**Impact:**
- Data loss - users think data is saved
- Business logic failures
- User confusion and support burden

**Fix Required:** Either implement properly or remove/disable UI affordances

---

#### 4. **MEDIUM - No Server-Side Fallbacks**
**Severity:** MEDIUM  
**File:** `hooks/use-promoters.ts:24`

**Issue:** Client-side only with no fallbacks; guests see silent failures.

**Impact:**
- Poor UX - no error messages
- Debugging difficulty
- Confusion about auth state

**Fix Required:** Use server components for read-mostly data or add proper error handling

---

### Contracts & Letters Module

#### 5. **CRITICAL - Service-Role Key Abuse**
**Severity:** CRITICAL  
**Files:**
- `app/api/contracts/route.ts:205` (POST with service-role)
- `app/api/contracts/route.ts:363` (Multiple schema writes)

**Issue:** Uses service-role key to bypass RLS; allows arbitrary contract creation.

**Impact:**
- Complete bypass of security policies
- Users can create contracts as any user
- Data integrity compromised

**Fix Required:** Use authenticated anon client with proper RLS policies

---

#### 6. **HIGH - Unscoped Contract List**
**Severity:** HIGH  
**File:** `app/api/contracts/route.ts:83`

**Issue:** Tagged as `contract:read:own` but fetches entire contracts table.

**Impact:**
- Users can see all contracts
- Confidential business data exposed
- Competitive intelligence leakage

**Fix Required:** Filter by requester.id or enforce via RLS

---

#### 7. **MEDIUM - Hard-Coded External URLs**
**Severity:** MEDIUM  
**Files:**
- `app/api/contract-generation/route.ts:6`
- `app/api/contract-generation/route.ts:8`

**Issue:** External API/webhook URLs hard-coded; no config management.

**Impact:**
- Cannot change vendors easily
- Cannot disable integrations
- Secrets in code

**Fix Required:** Move to environment variables with disable flags

---

#### 8. **MEDIUM - No Async Error Handling**
**Severity:** MEDIUM  
**File:** `app/api/contract-generation/route.ts:50`

**Issue:** PDF generation failures leave contract as "completed" with no retry.

**Impact:**
- Contracts marked complete without PDFs
- No visibility into failures
- Manual intervention required

**Fix Required:** Add retry logic, error states, and monitoring

---

## 📋 Fix Priority

### 🔴 IMMEDIATE (Today)
1. **Add RBAC guards to promoter mutations**
2. **Remove service-role key from contract POST**
3. **Scope contract list queries to user**
4. **Add authentication checks to promoter GET endpoints**

### 🟠 HIGH PRIORITY (This Week)
5. **Implement or remove stub promoter endpoints**
6. **Move external URLs to environment config**
7. **Add error handling to async operations**

### 🟡 MEDIUM PRIORITY (Next Sprint)
8. **Add server components for read-heavy pages**
9. **Implement retry logic for external calls**
10. **Add integration tests for critical flows**

---

## 🛠️ Recommended Fixes

### Fix 1: Add RBAC to Promoter APIs

```typescript
// app/api/promoters/route.ts
import { withRBAC } from '@/lib/rbac/guard';

export const POST = withRBAC(
  'promoter:create',
  async (request: NextRequest) => {
    // Implementation with proper scoping
  }
);
```

### Fix 2: Scope Contract Queries

```typescript
// app/api/contracts/route.ts
export const GET = withRBAC(
  'contract:read:own',
  async (request: NextRequest) => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Scope to user
    const { data } = await supabase
      .from('contracts')
      .select('*')
      .or(`created_by.eq.${user.id},assigned_to.eq.${user.id}`);
  }
);
```

### Fix 3: Remove Service-Role from Contracts

```typescript
// app/api/contracts/route.ts
export async function POST(request: NextRequest) {
  // Use authenticated client, not service-role
  const supabase = await createClient(); // Uses anon key + RLS
  
  // Verify user is authenticated
  const { data: { user }, error } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Now RLS policies will enforce security
  const { data, error: insertError } = await supabase
    .from('contracts')
    .insert({ ...contractData, created_by: user.id });
}
```

### Fix 4: Environment Config for External APIs

```typescript
// lib/config/external-apis.ts
export const externalAPIs = {
  pdfGenerator: {
    enabled: process.env.PDF_GENERATION_ENABLED === 'true',
    url: process.env.PDF_GENERATOR_URL,
    apiKey: process.env.PDF_GENERATOR_API_KEY,
  },
  makeWebhook: {
    enabled: process.env.MAKE_WEBHOOK_ENABLED === 'true',
    url: process.env.MAKE_WEBHOOK_URL,
    secret: process.env.MAKE_WEBHOOK_SECRET,
  }
};
```

---

## 🧪 Testing Requirements

### Critical Path Tests

1. **Promoter Access Control**
   - [ ] User A cannot see User B's promoters
   - [ ] User without `promoter:create` cannot create
   - [ ] User without `promoter:delete` cannot delete
   - [ ] Admin can see all promoters

2. **Contract Security**
   - [ ] User can only see their own contracts
   - [ ] Cannot create contract as another user
   - [ ] RLS policies enforce boundaries
   - [ ] Service-role key not exposed

3. **Stub Endpoint Behavior**
   - [ ] Document upload either works or returns proper error
   - [ ] UI reflects actual capability
   - [ ] No false success messages

---

## 📊 Impact Assessment

### Current Risk Level: 🔴 **CRITICAL**

**Exploitability:** High - Any authenticated user  
**Impact:** Severe - Data breach, tampering, loss  
**Detection:** Low - No audit trails for unauthorized access  

### After Fixes: 🟢 **LOW**

**Exploitability:** Low - Requires specific permissions  
**Impact:** Limited - RLS + RBAC enforce boundaries  
**Detection:** High - Audit logs track all access  

---

## 📞 Action Items

### Development Team
- [ ] Review this audit
- [ ] Prioritize fixes
- [ ] Implement RBAC guards
- [ ] Test all critical paths
- [ ] Deploy to staging
- [ ] Run penetration tests

### Security Team
- [ ] Verify fixes in staging
- [ ] Review RLS policies
- [ ] Audit external API security
- [ ] Sign off before production

---

## 📚 References

- RBAC Implementation: `README_RBAC.md`
- Security Patches: `CRITICAL_SECURITY_FIXES.md`
- RLS Policies: `supabase/migrations/`

---

**Next Review:** After fixes are deployed  
**Severity:** 🚨 CRITICAL - Do Not Deploy Without Fixes  
**Estimated Fix Time:** 2-3 days with testing

---

*This audit is part of ongoing security review. All findings must be addressed before production deployment.*

