# Security Action Plan - Promoters & Contracts

**Date:** October 13, 2025  
**Priority:** 🔴 CRITICAL  
**Status:** Ready for Implementation

---

## 🎯 Executive Summary

Security audit revealed **8 critical/high vulnerabilities** in Promoter and Contract modules that allow:

- Unauthorized data access
- Privilege escalation
- Data tampering
- Bypassing security policies

**All issues have documented fixes. Implementation time: 2-3 days.**

---

## 🚨 Critical Issues Summary

### Promoter Module

1. ❌ **Missing RBAC** - Any user can create/update/delete any promoter
2. ❌ **No Data Scoping** - Users see all promoters (data leak)
3. ⚠️ **Fake Success** - Stub endpoints pretend to save data
4. ⚠️ **Silent Failures** - No error messages for guests

### Contract Module

5. ❌ **Service-Role Abuse** - Bypasses all security policies
6. ❌ **Unscoped Queries** - Users see all contracts
7. ⚠️ **Hard-Coded URLs** - Cannot disable integrations
8. ⚠️ **No Error Handling** - Async failures not tracked

---

## 📋 Implementation Priority

### 🔴 **Day 1 - CRITICAL (Stop-Ship)**

**Must fix before ANY production deployment**

1. **Add RBAC to Promoter APIs** (2-3 hours)
   - File: `app/api/promoters/route.ts`
   - File: `app/api/promoters/[id]/route.ts`
   - Add: `withRBAC()` wrappers
   - Add: Permission checks

2. **Remove Service-Role from Contracts** (1-2 hours)
   - File: `app/api/contracts/route.ts`
   - Change: Use authenticated client
   - Add: User verification

3. **Scope Data Queries** (2-3 hours)
   - File: `app/api/promoters/route.ts:84`
   - File: `app/api/contracts/route.ts:83`
   - Add: `.eq('created_by', user.id)` filters
   - Add: Admin role checks

**Total Day 1:** 5-8 hours

---

### 🟠 **Day 2 - HIGH PRIORITY**

4. **Fix Stub Endpoints** (3-4 hours)
   - Option A: Implement properly
   - Option B: Return 501 Not Implemented
   - Recommendation: Option B (temporary)

5. **External API Configuration** (1-2 hours)
   - Create: `lib/config/external-apis.ts`
   - Update: `.env.example`
   - Move: Hard-coded URLs to env vars

**Total Day 2:** 4-6 hours

---

### 🟡 **Day 3 - MEDIUM PRIORITY**

6. **Error Handling** (2-3 hours)
   - File: `app/api/contract-generation/route.ts`
   - Add: Try-catch with status updates
   - Add: Timeout handling
   - Add: Retry logic (optional)

7. **Integration Tests** (3-4 hours)
   - Test: Access control works
   - Test: Data scoping works
   - Test: RBAC enforced
   - Test: External APIs fail gracefully

**Total Day 3:** 5-7 hours

---

## 🛠️ Quick Start Implementation

### Step 1: Read Documentation

```bash
# Review these files:
cat SECURITY_AUDIT_PROMOTERS_CONTRACTS.md
cat SECURITY_FIXES_IMPLEMENTATION.md
```

### Step 2: Branch & Setup

```bash
# Create feature branch
git checkout -b security/fix-promoters-contracts

# Verify tests work
npm test

# Start dev server
npm run dev
```

### Step 3: Implement Critical Fixes

```bash
# Work through Day 1 fixes:
# 1. app/api/promoters/route.ts - Add RBAC
# 2. app/api/promoters/[id]/route.ts - Add RBAC
# 3. app/api/contracts/route.ts - Remove service-role
# 4. Add query scoping

# Test after each change:
npm test
```

### Step 4: Test Thoroughly

```bash
# Run all tests
npm run test

# Run E2E tests
npm run test:e2e

# Manual testing:
# - Try accessing other user's data
# - Try creating without permission
# - Verify admin can see all
```

### Step 5: Deploy to Staging

```bash
# Commit changes
git add .
git commit -m "fix(security): add RBAC and scope queries for promoters/contracts"

# Push and create PR
git push origin security/fix-promoters-contracts

# Deploy to staging for review
```

---

## 📝 Implementation Checklist

### Critical Fixes (Day 1)

- [ ] Add `withRBAC('promoter:create')` to POST /api/promoters
- [ ] Add `withRBAC('promoter:update')` to PUT /api/promoters/[id]
- [ ] Add `withRBAC('promoter:delete')` to DELETE /api/promoters/[id]
- [ ] Scope promoter GET to `.eq('created_by', user.id)`
- [ ] Remove service-role client from contracts POST
- [ ] Add user authentication check to contracts POST
- [ ] Scope contract GET to user's contracts
- [ ] Test unauthorized access returns 403

### High Priority (Day 2)

- [ ] Return 501 from stub endpoints
- [ ] Create `lib/config/external-apis.ts`
- [ ] Move PDF generator URL to env
- [ ] Move webhook URL to env
- [ ] Add `.env.example` entries
- [ ] Test with APIs disabled

### Medium Priority (Day 3)

- [ ] Add error handling to contract generation
- [ ] Update contract status on failures
- [ ] Add timeout to external API calls
- [ ] Write integration tests
- [ ] Document test scenarios

### Pre-Deployment

- [ ] All tests passing
- [ ] Security team review
- [ ] Staging deployment successful
- [ ] Manual testing complete
- [ ] Rollback plan documented

---

## 🧪 Testing Scenarios

### Test 1: Unauthorized Promoter Access

```bash
# As User A:
curl -H "Authorization: Bearer $USER_A_TOKEN" \
     POST /api/promoters/[user_b_promoter_id] \
     -d '{"name": "hacked"}'

# Expected: 403 Forbidden
```

### Test 2: Data Scoping

```bash
# As User A:
curl -H "Authorization: Bearer $USER_A_TOKEN" \
     GET /api/promoters

# Expected: Only User A's promoters
```

### Test 3: Admin Access

```bash
# As Admin:
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     GET /api/promoters

# Expected: All promoters
```

### Test 4: Contract Security

```bash
# Without auth:
curl POST /api/contracts \
     -d '{"created_by": "other_user"}'

# Expected: 401 Unauthorized
```

---

## 📊 Success Metrics

### Before Fixes

- ❌ Any user can access all promoters
- ❌ Any user can create contracts as anyone
- ❌ No audit trail
- ❌ Service-role key exposed in API

### After Fixes

- ✅ Users only see their own data
- ✅ RBAC enforced on all mutations
- ✅ Audit trail via created_by
- ✅ RLS policies + RBAC in effect
- ✅ External APIs configurable
- ✅ Errors properly handled

---

## 🚀 Deployment Strategy

### Staging Deployment

1. Deploy fixes to staging
2. Run automated tests
3. Manual security testing
4. Performance testing
5. Team review

### Production Deployment

1. ✅ All staging tests passed
2. ✅ Security team sign-off
3. ✅ Database RLS policies verified
4. Deploy during low-traffic window
5. Monitor errors/logs closely
6. Rollback ready if needed

---

## 📞 Support & Resources

### Documentation

- **Security Audit:** `SECURITY_AUDIT_PROMOTERS_CONTRACTS.md`
- **Implementation Guide:** `SECURITY_FIXES_IMPLEMENTATION.md`
- **RBAC System:** `README_RBAC.md`
- **Security Patches:** `CRITICAL_SECURITY_FIXES.md`

### Team Contacts

- **Security Lead:** Review and approve fixes
- **Backend Team:** Implement API changes
- **QA Team:** Test security scenarios
- **DevOps:** Deploy and monitor

---

## ⚠️ CRITICAL REMINDER

**DO NOT DEPLOY TO PRODUCTION UNTIL:**

1. ✅ All Day 1 fixes implemented
2. ✅ Tests passing
3. ✅ Security team approval
4. ✅ Staging deployment successful

**Current Risk Level:** 🔴 CRITICAL  
**Target Risk Level:** 🟢 LOW (after fixes)

---

## 🎯 Timeline

| Day       | Tasks          | Hours      | Status          |
| --------- | -------------- | ---------- | --------------- |
| Day 1     | Critical fixes | 5-8h       | ⏳ Ready        |
| Day 2     | High priority  | 4-6h       | ⏳ Ready        |
| Day 3     | Testing & docs | 5-7h       | ⏳ Ready        |
| **Total** | **All fixes**  | **14-21h** | ⏳ **2-3 days** |

---

**Next Action:** Review audit → Implement Day 1 fixes → Test → Deploy to staging

**Priority:** 🔴 CRITICAL - Start immediately  
**Estimated Completion:** 2-3 business days  
**Blocking:** Production deployment

---

_All security issues must be resolved before production deployment. No exceptions._
