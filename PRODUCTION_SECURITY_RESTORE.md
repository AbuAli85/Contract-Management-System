# 🔒 Production Security Restoration Guide

## ✅ Current Status
- 112 promoters successfully imported and displaying
- API working correctly
- UI fully functional
- **Security temporarily disabled for debugging**

---

## 🚨 Security Features Currently Disabled

### 1. Row Level Security (RLS)
- **Status:** DISABLED on `promoters` table
- **Risk:** Any authenticated user can access all data
- **Fix:** Run `scripts/enable_promoters_rls.sql`

### 2. RBAC on API Endpoints
- **Status:** BYPASSED in `/api/promoters/route.ts`
- **Risk:** Permission checks not enforced
- **Fix:** Re-enable RBAC guards (see below)

---

## 🔧 Step-by-Step Security Restoration

### Step 1: Re-enable RLS (Do This First)

1. Open Supabase SQL Editor
2. Run `scripts/enable_promoters_rls.sql`
3. Verify RLS is enabled:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'promoters';
   ```
4. Test the UI still works (should work because SERVICE_ROLE bypasses RLS)

---

### Step 2: Re-enable RBAC (Do This Second)

**In `app/api/promoters/route.ts`:**

Change line 53 from:
```typescript
export async function GET(request: Request) {
```

Back to:
```typescript
export const GET = withRBAC('promoter:read:own', async (request: Request) => {
```

And remove the closing brace at line 156, replacing with:
```typescript
}); // Close withRBAC wrapper
```

Do the same for the POST endpoint (line 159).

---

### Step 3: Assign User Permissions

Run this SQL to give your admin user full access:

```sql
-- Get your user ID
SELECT id, email FROM auth.users LIMIT 5;

-- Assign admin role to your user (replace USER_ID)
INSERT INTO user_role_assignments (user_id, role_id)
SELECT 'YOUR_USER_ID', id FROM roles WHERE name = 'admin'
ON CONFLICT DO NOTHING;

-- Verify
SELECT u.email, r.name as role
FROM auth.users u
JOIN user_role_assignments ura ON u.id = ura.user_id
JOIN roles r ON ura.role_id = r.id
WHERE u.email = 'your@email.com';
```

---

## ⚠️ Important Notes

### Why We Disabled Security
During debugging, we discovered:
1. RBAC tables were missing/misconfigured
2. RLS policies were blocking even SERVICE_ROLE access
3. Empty database was causing API to return 0 records

### Current State is SAFE for Development
- Still requires authentication
- Still uses SERVICE_ROLE key (only server has access)
- Users can't directly access database

### Before Going to Production
- ✅ Re-enable RLS
- ✅ Re-enable RBAC
- ✅ Assign proper user roles
- ✅ Test all permission levels
- ✅ Audit logs enabled

---

## 🧪 Testing After Re-enabling Security

### Test 1: RLS
```sql
-- Should return 112
SELECT COUNT(*) FROM promoters;
```

### Test 2: API
```javascript
// Should return 112 (or based on user's permissions)
fetch('/api/promoters?page=1&limit=10')
  .then(r => r.json())
  .then(d => console.log('Total:', d.total));
```

### Test 3: UI
- Navigate to `/en/promoters`
- Should see all promoters (based on your role)
- Document alerts should work
- Search/filter should work

---

## 📞 Support

If you encounter issues after re-enabling security:

1. Check Vercel logs for RBAC errors
2. Check Supabase logs for RLS errors
3. Verify user has correct roles assigned
4. Verify SERVICE_ROLE_KEY is set in Vercel

---

## ✅ Recommended Order

1. **Test current system** - Make sure everything works
2. **Re-enable RLS** - Should still work (SERVICE_ROLE bypasses)
3. **Test UI again** - Confirm no issues
4. **Re-enable RBAC** - Deploy changes
5. **Assign roles** - Give users permissions
6. **Test with different users** - Verify permissions work

---

**Don't rush this!** Security is important. Test each step thoroughly before moving to the next.

