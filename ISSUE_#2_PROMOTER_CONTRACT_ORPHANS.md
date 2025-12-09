# Issue #2: Active Promoters with Zero Contracts

## Problem Summary

**Severity**: High  
**Status**: 🔍 Diagnosed - Fix Available

Active promoters showing as assigned to a company (e.g., "Falcon Eye Business and Promotion") display **zero contracts** in the Professional tab, indicating a data integrity issue.

---

## Root Cause Analysis

### Database Schema

```
promoters table:
  - id (UUID)
  - employer_id (UUID, references parties)  ← Shows assignment
  - status (TEXT)

contracts table:
  - id (UUID)
  - promoter_id (UUID, references promoters)  ← Actual contracts
  - employer_id (UUID, references parties)
```

### The Disconnect

1. **Promoter Assignment**: `promoters.employer_id` indicates a promoter is assigned to a company
2. **Contract Records**: `contracts.promoter_id` represents actual employment contracts
3. **The Gap**: A promoter can have `employer_id` set WITHOUT any contract records

### Code Path

```typescript
// In Professional Tab (app/[locale]/manage-promoters/[id]/page.tsx:385-398)
const { data: contractsData } = await supabase
  .from('contracts')
  .select('*')
  .eq('promoter_id', promoterId); // ← Returns empty array

setPromoterDetails({
  ...promoterData,
  contracts: contractsData || [], // ← Shows zero contracts
});
```

---

## Impact Assessment

### Data Integrity Issues

- ❌ **Inconsistent State**: Promoters shown as assigned but with no contract evidence
- ❌ **Broken Business Logic**: Assignment without formal agreement
- ❌ **Reporting Errors**: Statistics and analytics incorrect
- ❌ **Compliance Risk**: Employment without documented contracts

### User Experience

- Confusing UI showing "assigned" but zero contracts
- Undermines trust in system accuracy
- Difficult to track actual employment relationships

---

## Diagnostic Tools

### 1. SQL Query to Find Orphans

Run this in Supabase SQL Editor:

```sql
-- Find all orphaned promoters
SELECT
    p.id,
    p.name_en,
    p.name_ar,
    p.status,
    p.employer_id,
    employer.name_en as employer_name,
    p.job_title,
    COUNT(c.id) as contract_count,
    p.created_at
FROM promoters p
LEFT JOIN parties employer ON employer.id = p.employer_id
LEFT JOIN contracts c ON c.promoter_id = p.id
WHERE p.status = 'active'
  AND p.employer_id IS NOT NULL
GROUP BY p.id, p.name_en, p.name_ar, p.status, p.employer_id, employer.name_en, p.job_title, p.created_at
HAVING COUNT(c.id) = 0
ORDER BY p.created_at DESC;
```

### 2. TypeScript Diagnostic Script

```bash
# Run diagnostic (no changes)
npm run fix-promoter-orphans -- --dry-run

# View statistics only
npm run fix-promoter-orphans
```

---

## Solution Options

### Option 1: Create Placeholder Contracts (Quick Fix)

**Pros:**

- Immediate data consistency
- Maintains historical assignment record
- No data loss

**Cons:**

- Not real contracts
- May need cleanup later

**Command:**

```bash
npm run fix-promoter-orphans -- --create-contracts
```

**What it does:**

- Creates a contract record for each orphaned promoter
- Contract number: `PLACEHOLDER-{timestamp}-{id}`
- Status: `active`
- Type: `employment`
- Description: "Auto-generated placeholder contract"

### Option 2: Manual Contract Creation (Recommended)

**Process:**

1. Export list of orphaned promoters
2. HR team reviews each case
3. Create proper contracts for legitimate assignments
4. Remove `employer_id` for invalid assignments

**Command:**

```bash
# Export list
npm run fix-promoter-orphans -- --dry-run > orphaned_promoters.txt
```

### Option 3: Remove Invalid Assignments

For promoters no longer employed:

```sql
UPDATE promoters
SET employer_id = NULL,
    status = 'inactive'
WHERE id IN (
  -- List of orphaned promoter IDs that are no longer employed
);
```

---

## Prevention Measures

### 1. Database Constraints

Create a validation function:

```sql
-- Function to validate promoter-contract consistency
CREATE OR REPLACE FUNCTION validate_promoter_contract_consistency()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.employer_id IS NOT NULL AND NEW.status = 'active' THEN
    -- Check if promoter has at least one contract
    IF NOT EXISTS (
      SELECT 1 FROM contracts
      WHERE promoter_id = NEW.id
      AND status IN ('active', 'pending')
    ) THEN
      RAISE WARNING 'Promoter % assigned to employer but has no active contracts', NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on promoter updates
CREATE TRIGGER check_promoter_contract_consistency
  AFTER INSERT OR UPDATE ON promoters
  FOR EACH ROW
  EXECUTE FUNCTION validate_promoter_contract_consistency();
```

### 2. Application-Level Validation

In contract creation form:

```typescript
// When creating a promoter assignment
async function assignPromoterToEmployer(
  promoterId: string,
  employerId: string
) {
  // 1. Update promoter.employer_id
  await supabase
    .from('promoters')
    .update({ employer_id: employerId })
    .eq('id', promoterId);

  // 2. IMMEDIATELY create a contract
  await supabase.from('contracts').insert({
    promoter_id: promoterId,
    employer_id: employerId,
    contract_number: generateContractNumber(),
    title: 'Employment Contract',
    contract_type: 'employment',
    status: 'pending', // Pending until details filled
    start_date: new Date().toISOString(),
  });
}
```

### 3. UI Warning

Add warning in Professional tab when no contracts exist:

```tsx
{
  promoterDetails.employer_id && promoterDetails.contracts.length === 0 && (
    <Alert variant='warning'>
      <AlertTriangle className='h-4 w-4' />
      <AlertTitle>No Contract Found</AlertTitle>
      <AlertDescription>
        This promoter is assigned to {employerName} but has no contract on file.
        <Button
          onClick={() =>
            router.push(`/generate-contract?promoter=${promoterId}`)
          }
        >
          Create Contract Now
        </Button>
      </AlertDescription>
    </Alert>
  );
}
```

---

## Testing Checklist

- [ ] Run diagnostic script to identify all orphans
- [ ] Review cases with HR team
- [ ] Create proper contracts for legitimate assignments
- [ ] Remove invalid assignments
- [ ] Implement validation triggers
- [ ] Add UI warnings
- [ ] Verify Professional tab shows correct counts
- [ ] Test contract creation workflow
- [ ] Monitor for new orphans over 30 days

---

## Migration Script

File: `supabase/migrations/20251021_diagnose_promoter_contract_orphans.sql`

Contains:

- Diagnostic queries
- Statistics views
- Integrity check functions

---

## Related Files

- **Diagnostic**: `scripts/fix-promoter-contract-orphans.ts`
- **Migration**: `supabase/migrations/20251021_diagnose_promoter_contract_orphans.sql`
- **UI Component**: `app/[locale]/manage-promoters/[id]/page.tsx` (line 1185-1209)

---

## Success Metrics

- **Zero orphaned promoters** with active status and employer_id
- **100% of active assignments** have corresponding contract records
- **No new orphans** created over 30-day period
- **UI consistency**: Assignment status matches contract data

---

## Next Steps

1. **Immediate**: Run diagnostic to quantify the issue

   ```bash
   npm run fix-promoter-orphans -- --dry-run
   ```

2. **Short-term**: Create placeholder contracts or manual cleanup

   ```bash
   npm run fix-promoter-orphans -- --create-contracts
   ```

3. **Long-term**: Implement validation rules and UI warnings

4. **Ongoing**: Monitor for data consistency weekly

---

## Support

For questions or assistance:

- Review diagnostic output
- Check audit logs for contract deletion history
- Consult HR team for employment verification
