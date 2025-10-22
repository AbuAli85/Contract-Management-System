# 🔒 Promoter Validation Implementation Guide

## Overview

This guide explains the complete implementation for preventing contracts without promoters and managing existing contracts missing promoter assignments.

---

## 📦 What's Included

### 1. **Database Migration**
`supabase/migrations/20251023_add_promoter_validation.sql`

**Features:**
- ✅ Helper tables for suggestions and audit
- ✅ Functions for finding contracts without promoters
- ✅ AI-powered promoter suggestion engine
- ✅ Bulk assignment functionality
- ✅ Audit trail for all changes
- ✅ Statistics and reporting views
- ✅ Future-ready constraint (commented out)

### 2. **API Endpoints**
`app/api/admin/contracts-without-promoters/route.ts`

**Endpoints:**
- `GET` - List contracts without promoters (with filters)
- `POST` - Generate AI suggestions for a contract
- `PUT` - Bulk assign promoters to contracts

### 3. **Admin Interface**
`app/[locale]/admin/contracts-without-promoters/page.tsx`

**Features:**
- ✅ Dashboard with statistics
- ✅ Filterable contract list
- ✅ AI-powered suggestions
- ✅ Bulk selection and assignment
- ✅ Auto-assign top suggestions
- ✅ Priority-based sorting
- ✅ Real-time validation

### 4. **Validation Library**
`lib/validations/contract-promoter-validation.ts`

**Functions:**
- Client-side validation for forms
- Server-side API validation
- Contract type exemption rules
- Status-based validation
- Suggestion helper functions

---

## 🚀 Deployment Steps

### Step 1: Run the Database Migration

```bash
# Via Supabase CLI
supabase migration up

# Or via Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Copy contents of supabase/migrations/20251023_add_promoter_validation.sql
# 3. Execute
```

**What it does:**
- Creates helper tables
- Adds database functions
- Generates initial suggestions for existing contracts
- Sets up audit logging

### Step 2: Deploy API & Admin Interface

```bash
# Stage the files
git add app/api/admin/contracts-without-promoters/route.ts
git add app/[locale]/admin/contracts-without-promoters/page.tsx
git add lib/validations/contract-promoter-validation.ts
git add supabase/migrations/20251023_add_promoter_validation.sql

# Commit
git commit -m "feat: Add promoter validation and admin interface for contract management

- Add database migration for promoter validation
- Create admin API endpoints for managing contracts without promoters
- Implement AI-powered promoter suggestion engine
- Add admin interface for bulk promoter assignment
- Create validation library for contract forms
- Add audit trail for promoter changes"

# Push
git push origin main
```

### Step 3: Verify Deployment

```bash
# Check migration ran successfully
psql -d your_database -c "SELECT * FROM get_promoter_assignment_stats();"

# Should show statistics about contracts with/without promoters
```

---

## 🎯 Using the Admin Interface

### Access the Interface

1. Navigate to: `/en/admin/contracts-without-promoters`
2. Must have admin role to access

### Dashboard Features

#### **Statistics Cards**
- Total contracts
- Contracts with promoters (percentage)
- Contracts without promoters
- High priority contracts (active/pending without promoters)

#### **Filters**
- By status (draft, pending, active)
- By priority (high, medium, low)
- Real-time results

#### **Bulk Actions**
1. Select contracts using checkboxes
2. Click "Auto-assign Top Suggestions" for AI-powered assignments
3. Or manually select promoters from dropdowns
4. Click "Save Assignments" to apply changes

### Priority Levels

| Priority | Criteria | Urgency |
|----------|----------|---------|
| **High** | Active or Pending contracts | ⚠️ Immediate action |
| **Medium** | Draft contracts > 7 days old | ⏰ Action needed soon |
| **Low** | Draft contracts < 7 days old | ℹ️ Can wait |

---

## 🤖 AI Suggestion Engine

### How It Works

The system suggests promoters based on:

1. **Historical Data (85% confidence)**
   - Promoters who worked with same parties
   - Similar contract periods
   - Same geographic location

2. **Availability (60% confidence)**
   - Active promoters without current assignments
   - Balanced workload distribution

3. **Fallback (40% confidence)**
   - All active promoters in system
   - Alphabetical order

### Generate Suggestions

**Via UI:**
- Click "Generate" button next to contract
- System analyzes and provides 5 suggestions

**Via API:**
```javascript
POST /api/admin/contracts-without-promoters
{
  "contractId": "abc-123",
  "maxSuggestions": 5
}
```

---

## 🔒 Future Validation (Making Promoter Required)

### Current State
- Promoter is **optional** (allows NULL)
- Validation is **soft** (warnings only)
- Existing contracts not affected

### Making It Required

**Step 1: Fix All Existing Contracts**
1. Use admin interface to assign promoters to all contracts
2. Verify: `SELECT COUNT(*) FROM contracts WHERE promoter_id IS NULL;` returns 0

**Step 2: Enable Database Constraint**

Uncomment in migration file:
```sql
-- Make promoter_id required for most contract types
ALTER TABLE contracts
ADD CONSTRAINT check_promoter_required 
CHECK (
    promoter_id IS NOT NULL 
    OR contract_type IN ('partnership', 'consultancy')
    OR status = 'draft'
);
```

Or for strict requirement:
```sql
-- Make promoter_id required for ALL contracts
ALTER TABLE contracts 
ALTER COLUMN promoter_id SET NOT NULL;
```

**Step 3: Update API Validation**

In `app/api/contracts/route.ts` (or your contract creation endpoint):

```typescript
import { validateContractPromoter } from '@/lib/validations/contract-promoter-validation';

// Before inserting contract
const validation = await validateContractPromoter({
  promoter_id: contractData.promoter_id,
  contract_type: contractData.contract_type,
  status: contractData.status,
});

if (!validation.valid) {
  return NextResponse.json(
    {
      success: false,
      error: validation.message,
    },
    { status: 400 }
  );
}
```

---

## 📊 Database Functions Reference

### `get_contracts_without_promoters(status, limit, offset)`
Returns contracts missing promoters with filters.

```sql
SELECT * FROM get_contracts_without_promoters('active', 50, 0);
```

### `suggest_promoters_for_contract(contract_id, max_suggestions)`
AI-powered promoter suggestions for a contract.

```sql
SELECT * FROM suggest_promoters_for_contract(
  '36076d16-f27c-4751-b74e-f8de5d23faaa',
  5
);
```

### `bulk_assign_promoters(assignments, assigned_by)`
Bulk assign promoters to multiple contracts.

```sql
SELECT * FROM bulk_assign_promoters(
  '[
    {"contract_id": "abc", "promoter_id": "xyz"},
    {"contract_id": "def", "promoter_id": "uvw"}
  ]'::jsonb,
  'user-uuid'
);
```

### `get_promoter_assignment_stats()`
Statistics about promoter assignments.

```sql
SELECT * FROM get_promoter_assignment_stats();
```

---

## 🎨 Customization Options

### Modify Suggestion Algorithm

Edit `suggest_promoters_for_contract` function in migration:

```sql
-- Add more criteria
-- Adjust confidence scores
-- Change time windows
-- Add geographic filters
```

### Add More Contract Type Exemptions

In `lib/validations/contract-promoter-validation.ts`:

```typescript
const exemptContractTypes = [
  'partnership',
  'consultancy',
  'consulting',
  'service-agreement',
  'vendor',
  'your-custom-type', // Add here
];
```

### Change Priority Calculation

In migration, modify `contracts_needing_promoters` view:

```sql
CASE 
  WHEN c.status IN ('active', 'pending') THEN 'high'
  WHEN c.status = 'draft' AND ... THEN 'medium'
  -- Add your logic
  ELSE 'low'
END as priority
```

---

## 🧪 Testing the Implementation

### Test 1: Admin Interface Access
```bash
# Visit the admin page
curl http://localhost:3000/en/admin/contracts-without-promoters
# Should return admin interface (with auth)
```

### Test 2: API Endpoints
```bash
# Get contracts without promoters
curl -X GET http://localhost:3000/api/admin/contracts-without-promoters

# Generate suggestions
curl -X POST http://localhost:3000/api/admin/contracts-without-promoters \
  -H "Content-Type: application/json" \
  -d '{"contractId":"abc-123","maxSuggestions":5}'

# Bulk assign
curl -X PUT http://localhost:3000/api/admin/contracts-without-promoters \
  -H "Content-Type: application/json" \
  -d '{"assignments":[{"contract_id":"abc","promoter_id":"xyz"}]}'
```

### Test 3: Database Functions
```sql
-- Test stats
SELECT * FROM get_promoter_assignment_stats();

-- Test suggestions
SELECT * FROM suggest_promoters_for_contract(
  'your-contract-id',
  5
);

-- Test bulk assignment
SELECT * FROM bulk_assign_promoters(
  '[{"contract_id":"test","promoter_id":"test"}]'::jsonb,
  'admin-user-id'
);
```

---

## 📈 Monitoring & Maintenance

### Daily Checks
```sql
-- Check how many contracts still need promoters
SELECT COUNT(*) FROM contracts WHERE promoter_id IS NULL;

-- Check high priority contracts
SELECT * FROM contracts_needing_promoters WHERE priority = 'high';
```

### Weekly Reports
```sql
-- Generate weekly report
SELECT 
  date_trunc('week', created_at) as week,
  COUNT(*) as total_created,
  COUNT(promoter_id) as with_promoter,
  COUNT(*) - COUNT(promoter_id) as without_promoter
FROM contracts
WHERE created_at > NOW() - INTERVAL '4 weeks'
GROUP BY week
ORDER BY week DESC;
```

### Audit Trail
```sql
-- Review recent promoter changes
SELECT * 
FROM contract_promoter_audit
WHERE changed_at > NOW() - INTERVAL '7 days'
ORDER BY changed_at DESC;
```

---

## 🔧 Troubleshooting

### "Permission Denied" Error
**Solution:** Ensure user has admin role:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

### Suggestions Not Generating
**Solution:** Check promoters table has active promoters:
```sql
SELECT COUNT(*) FROM promoters WHERE status = 'active';
```

### Bulk Assignment Fails
**Solution:** Check audit logs:
```sql
SELECT * FROM contract_promoter_audit ORDER BY changed_at DESC LIMIT 10;
```

---

## 📝 Next Steps

1. ✅ Run the database migration
2. ✅ Deploy the API and admin interface
3. ✅ Access `/en/admin/contracts-without-promoters`
4. ✅ Assign promoters to existing contracts
5. ✅ Test the validation in contract creation forms
6. ✅ Monitor statistics and audit logs
7. ✅ (Optional) Enable strict validation after cleanup

---

**Created:** 2025-10-23  
**Status:** ✅ **Ready for Deployment**  
**Estimated Setup Time:** 15 minutes

