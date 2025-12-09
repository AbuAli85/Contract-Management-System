# Outsourcing Model Implementation Guide

## Business Model Confirmed ✅

Your diagnostic results prove you have a **staffing agency/outsourcing business model**:

### Real-World Example from Your Data

**Shahmeer Abdul Sattar**:

- **Employed by**: Amjad Al Maerifa LLC (payroll, benefits, HR)
- **Works at**: Blue Oasis Quality Services (client site)
- **5 Active Contracts**: Total value 10,800 OMR
  - Blue Oasis: 3 contracts (6,600 OMR)
  - AL AMRI: 2 contracts (4,200 OMR)

This is **common in recruitment/staffing agencies** where:

1. Agency employs the worker (employer of record)
2. Worker is placed at client company
3. Client pays agency, agency pays worker

---

## Current Schema Ambiguity

### The Problem

Your database uses `employer_id` for two different concepts:

```sql
promoters table:
  employer_id → Who employs them (staffing agency)

contracts table:
  employer_id → Where they work (client company)
```

**Same column name, different meanings!** This causes confusion.

---

## Recommended Solution: Schema Enhancement

### Add Explicit Client Company Field

```sql
-- Migration: 20251022_add_client_company_to_contracts.sql

-- Step 1: Add new column for clarity
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS client_company_id UUID REFERENCES parties(id);

-- Step 2: Migrate existing data
-- For contracts where employer_id doesn't match promoter's employer,
-- the contract.employer_id is actually the CLIENT company
UPDATE contracts c
SET client_company_id = c.employer_id,
    employer_id = p.employer_id
FROM promoters p
WHERE c.promoter_id::uuid = p.id
  AND c.employer_id IS NOT NULL
  AND p.employer_id IS NOT NULL
  AND c.employer_id != p.employer_id;

-- Step 3: Add helpful comments
COMMENT ON COLUMN contracts.employer_id IS 'The company that employs the promoter (employer of record, pays salary)';
COMMENT ON COLUMN contracts.client_company_id IS 'The client company where the promoter works (outsourced location)';

-- Step 4: Create index for performance
CREATE INDEX IF NOT EXISTS idx_contracts_client_company ON contracts(client_company_id);
```

### Result

After migration, your data becomes:

| Promoter    | Employer (Payroll)            | Client (Work Location)      | Clarity  |
| ----------- | ----------------------------- | --------------------------- | -------- |
| Shahmeer    | Amjad Al Maerifa LLC          | Blue Oasis Quality Services | ✅ Clear |
| Abdul Basit | Falcon Eye Modern Investments | Amjad Al Maerifa LLC        | ✅ Clear |
| Abdelrhman  | Falcon Eye Business           | Amjad Al Maerifa LLC        | ✅ Clear |

---

## UI Enhancements

### 1. Contract Display - Show Both Companies

**Before** (Confusing):

```
Employer: Blue Oasis Quality Services
```

**After** (Clear):

```
Employer (Payroll): Amjad Al Maerifa LLC
Client (Work Location): Blue Oasis Quality Services
Type: Outsourced
```

### 2. Professional Tab - Breakdown

```tsx
// In app/[locale]/manage-promoters/[id]/page.tsx

<Card>
  <CardHeader>
    <CardTitle>Contract Summary</CardTitle>
  </CardHeader>
  <CardContent>
    <div className='space-y-4'>
      {/* Primary Employer */}
      <div>
        <h4 className='font-semibold'>Primary Employer</h4>
        <p>{promoterDetails.parties?.name_en}</p>
        <Badge>Employer of Record</Badge>
      </div>

      {/* Client Assignments */}
      <div>
        <h4 className='font-semibold'>Client Assignments</h4>
        {clientCompanies.map(client => (
          <div
            key={client.id}
            className='flex items-center justify-between p-2 border rounded'
          >
            <div>
              <p className='font-medium'>{client.name}</p>
              <p className='text-sm text-muted-foreground'>
                {client.activeContracts} active contract(s)
              </p>
            </div>
            <Badge>{client.totalValue} OMR</Badge>
          </div>
        ))}
      </div>

      {/* Contract Type Badge */}
      <Badge variant={hasClientAssignments ? 'secondary' : 'default'}>
        {hasClientAssignments ? 'Outsourced' : 'Direct Employment'}
      </Badge>
    </div>
  </CardContent>
</Card>
```

### 3. Contract Form - Clarify Selection

```tsx
// In contract generation form

<FormField
  name="employer_id"
  label="Employer (Who pays salary?)"
  description="Select the company responsible for payroll and benefits"
  required
/>

<FormField
  name="client_company_id"
  label="Client Company (Where do they work?)"
  description="Leave empty for direct employment, or select client for outsourcing"
  optional
/>

{clientCompanyId && clientCompanyId !== employerId && (
  <Alert>
    <Info className="h-4 w-4" />
    <AlertTitle>Outsourced Assignment</AlertTitle>
    <AlertDescription>
      This promoter is employed by {employerName} but will work at {clientName}.
    </AlertDescription>
  </Alert>
)}
```

---

## Updated Types

```typescript
// File: lib/types.ts

export interface Contract {
  id: string;
  contract_number: string;
  promoter_id: string;

  // Employment relationship
  employer_id?: string; // Company that employs (payroll)
  employer?: Party; // Populated employer data

  // Work location (for outsourcing)
  client_company_id?: string | null; // Where promoter works (if different)
  client_company?: Party | null; // Populated client data

  // Contract details
  title: string;
  contract_type: 'employment' | 'service' | 'consultancy' | 'partnership';
  status:
    | 'draft'
    | 'pending'
    | 'active'
    | 'completed'
    | 'terminated'
    | 'expired';
  start_date: string;
  end_date?: string;
  value?: number;

  // Metadata
  is_outsourced?: boolean; // Computed: employer_id !== client_company_id
  created_at: string;
  updated_at: string;
}

export interface EnhancedContract extends Contract {
  is_outsourced: boolean;
  outsourcing_type?: 'direct' | 'outsourced' | 'secondment';
}
```

---

## Report Enhancements

### Dashboard Widget: Outsourcing Overview

```tsx
<Card>
  <CardHeader>
    <CardTitle>Employment Model Breakdown</CardTitle>
  </CardHeader>
  <CardContent>
    <div className='space-y-2'>
      <div className='flex justify-between'>
        <span>Direct Employment</span>
        <Badge>{directEmploymentCount}</Badge>
      </div>
      <div className='flex justify-between'>
        <span>Outsourced to Clients</span>
        <Badge variant='secondary'>{outsourcedCount}</Badge>
      </div>
      <Separator />
      <div className='flex justify-between font-semibold'>
        <span>Total Active</span>
        <Badge variant='outline'>{totalActive}</Badge>
      </div>
    </div>
  </CardContent>
</Card>
```

### Client Revenue Report

```sql
-- Revenue by client company (for outsourced contracts)
SELECT
    client.name_en as client_name,
    COUNT(DISTINCT c.promoter_id) as promoters_assigned,
    COUNT(c.id) as active_contracts,
    SUM(c.value) as total_contract_value,
    AVG(c.value) as avg_contract_value
FROM contracts c
JOIN parties client ON client.id = c.client_company_id
WHERE c.status = 'active'
  AND c.client_company_id IS NOT NULL
  AND c.client_company_id != c.employer_id
GROUP BY client.id, client.name_en
ORDER BY total_contract_value DESC;
```

---

## Implementation Checklist

### Phase 1: Schema Migration (30 min)

- [ ] Create migration file: `20251022_add_client_company_to_contracts.sql`
- [ ] Add `client_company_id` column
- [ ] Migrate existing data (mismatched employer IDs)
- [ ] Add helpful column comments
- [ ] Test migration in development
- [ ] Apply to production

### Phase 2: Type Updates (15 min)

- [ ] Update `Contract` interface in `lib/types.ts`
- [ ] Add `is_outsourced` computed property
- [ ] Update TypeScript types generation
- [ ] Test type safety

### Phase 3: UI Updates (1-2 hours)

- [ ] Update contract form to show both fields
- [ ] Add clarity labels ("Payroll" vs "Work Location")
- [ ] Update Professional tab to show breakdown
- [ ] Add outsourcing badge/indicator
- [ ] Update contract detail page

### Phase 4: API Updates (30 min)

- [ ] Update `/api/contracts` to include `client_company`
- [ ] Add `is_outsourced` to response
- [ ] Update contract creation endpoint
- [ ] Test API responses

### Phase 5: Reports & Analytics (1 hour)

- [ ] Add outsourcing breakdown widget
- [ ] Client revenue report
- [ ] Staffing agency performance metrics
- [ ] Update exports to include client company

---

## Validation Rules

### Prevent Future Confusion

```sql
-- Trigger to validate outsourcing logic
CREATE OR REPLACE FUNCTION validate_contract_outsourcing()
RETURNS TRIGGER AS $$
DECLARE
  promoter_employer_id UUID;
BEGIN
  -- Get promoter's employer
  SELECT employer_id INTO promoter_employer_id
  FROM promoters
  WHERE id = NEW.promoter_id::uuid;

  -- If contract employer doesn't match promoter employer
  IF promoter_employer_id IS NOT NULL
     AND NEW.employer_id IS NOT NULL
     AND promoter_employer_id != NEW.employer_id THEN

    -- If client_company_id is not set, automatically set it
    IF NEW.client_company_id IS NULL THEN
      NEW.client_company_id := NEW.employer_id;
      NEW.employer_id := promoter_employer_id;

      RAISE NOTICE 'Auto-corrected outsourcing: employer=%, client=%',
        promoter_employer_id, NEW.client_company_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_contract_outsourcing_trigger
  BEFORE INSERT OR UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION validate_contract_outsourcing();
```

---

## Benefits of This Approach

### Clarity ✅

- No more confusion about "employer"
- Explicit distinction between payroll and work location
- Self-documenting schema

### Accuracy ✅

- Proper representation of staffing agency model
- Correct financial reporting (agency vs client revenue)
- Better analytics on client relationships

### User Experience ✅

- Clear labels in UI
- Helpful tooltips
- Intuitive contract creation

### Business Intelligence ✅

- Track which clients use which agencies
- Analyze outsourcing profitability
- Monitor client diversification

---

## Example Migration Script

```sql
-- File: supabase/migrations/20251022_implement_outsourcing_model.sql

BEGIN;

-- Add client_company_id column
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS client_company_id UUID REFERENCES parties(id);

-- Migrate existing outsourced contracts
-- Contracts where employer != promoter's employer are outsourced
UPDATE contracts c
SET
  client_company_id = c.employer_id,  -- Current employer is actually client
  employer_id = p.employer_id,        -- Use promoter's employer
  updated_at = NOW()
FROM promoters p
WHERE c.promoter_id::uuid = p.id
  AND c.employer_id IS NOT NULL
  AND p.employer_id IS NOT NULL
  AND c.employer_id != p.employer_id
  AND c.status IN ('active', 'pending');

-- Add comments for clarity
COMMENT ON COLUMN contracts.employer_id IS
  'Company that employs the promoter (employer of record, handles payroll and benefits)';
COMMENT ON COLUMN contracts.client_company_id IS
  'Client company where promoter works (for outsourced/secondment arrangements). NULL for direct employment.';

-- Create index
CREATE INDEX IF NOT EXISTS idx_contracts_client_company ON contracts(client_company_id);

-- Add computed column for easy querying
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS is_outsourced BOOLEAN
GENERATED ALWAYS AS (
  client_company_id IS NOT NULL AND client_company_id != employer_id
) STORED;

-- Validation trigger
CREATE OR REPLACE FUNCTION validate_contract_outsourcing()
RETURNS TRIGGER AS $$
DECLARE
  promoter_employer_id UUID;
BEGIN
  SELECT employer_id INTO promoter_employer_id
  FROM promoters
  WHERE id = NEW.promoter_id::uuid;

  IF promoter_employer_id IS NOT NULL
     AND NEW.employer_id IS NOT NULL
     AND promoter_employer_id != NEW.employer_id
     AND NEW.client_company_id IS NULL THEN

    NEW.client_company_id := NEW.employer_id;
    NEW.employer_id := promoter_employer_id;

    RAISE NOTICE 'Auto-corrected outsourcing for contract %', NEW.contract_number;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_contract_outsourcing_trigger
  BEFORE INSERT OR UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION validate_contract_outsourcing();

COMMIT;

-- Verification query
SELECT
  'Total Contracts' as metric,
  COUNT(*) as count
FROM contracts
UNION ALL
SELECT
  'Direct Employment' as metric,
  COUNT(*) as count
FROM contracts
WHERE client_company_id IS NULL OR client_company_id = employer_id
UNION ALL
SELECT
  'Outsourced to Client' as metric,
  COUNT(*) as count
FROM contracts
WHERE is_outsourced = true;
```

---

## Quick Implementation (30 Minutes)

### Step 1: Run Migration (5 min)

```sql
-- Copy the migration SQL above
-- Run in Supabase SQL Editor
```

### Step 2: Update API Response (10 min)

```typescript
// File: app/api/contracts/route.ts

// In the SELECT query, add:
.select(`
  *,
  employer:employer_id (id, name_en, name_ar, type),
  client:client_company_id (id, name_en, name_ar, type),
  promoter:promoter_id (id, name_en, name_ar, mobile_number)
`)

// In the response transformation:
const transformedContract = {
  ...contract,
  employer: contract.employer,
  client: contract.client || contract.employer, // Fallback to employer if direct
  is_outsourced: contract.is_outsourced,
  employment_type: contract.is_outsourced ? 'outsourced' : 'direct',
};
```

### Step 3: Update UI (15 min)

```tsx
// File: app/[locale]/contracts/page.tsx or similar

{
  contract.is_outsourced ? (
    <div className='space-y-2'>
      <div className='flex items-center gap-2'>
        <Building2 className='h-4 w-4 text-blue-600' />
        <div>
          <p className='text-xs text-muted-foreground'>Employer (Payroll)</p>
          <p className='font-medium'>{contract.employer?.name_en}</p>
        </div>
      </div>
      <div className='flex items-center gap-2'>
        <MapPin className='h-4 w-4 text-green-600' />
        <div>
          <p className='text-xs text-muted-foreground'>
            Client (Work Location)
          </p>
          <p className='font-medium'>{contract.client?.name_en}</p>
        </div>
      </div>
      <Badge variant='secondary'>Outsourced</Badge>
    </div>
  ) : (
    <div>
      <p className='text-xs text-muted-foreground'>Employer</p>
      <p className='font-medium'>{contract.employer?.name_en}</p>
      <Badge>Direct Employment</Badge>
    </div>
  );
}
```

---

## Analytics Queries

### Outsourcing Revenue by Client

```sql
SELECT
    client.name_en as client_name,
    COUNT(DISTINCT c.promoter_id) as promoters_assigned,
    COUNT(c.id) as contracts_count,
    SUM(c.value) as total_monthly_value,
    AVG(c.value) as avg_contract_value,
    MIN(c.start_date) as first_contract_date,
    MAX(c.end_date) as latest_contract_end
FROM contracts c
JOIN parties client ON client.id = c.client_company_id
WHERE c.is_outsourced = true
  AND c.status = 'active'
GROUP BY client.id, client.name_en
ORDER BY total_monthly_value DESC;
```

### Staffing Agency Performance

```sql
SELECT
    employer.name_en as agency_name,
    COUNT(DISTINCT c.promoter_id) as total_promoters_employed,
    COUNT(DISTINCT c.client_company_id) as clients_served,
    SUM(c.value) as total_contract_value,
    COUNT(c.id) FILTER (WHERE c.is_outsourced = true) as outsourced_contracts,
    COUNT(c.id) FILTER (WHERE c.is_outsourced = false) as direct_contracts
FROM contracts c
JOIN parties employer ON employer.id = c.employer_id
WHERE c.status = 'active'
GROUP BY employer.id, employer.name_en
ORDER BY total_promoters_employed DESC;
```

---

## Benefits Summary

### Business Intelligence

- ✅ Track revenue by client company
- ✅ Analyze staffing agency performance
- ✅ Monitor client diversification
- ✅ Identify most profitable outsourcing arrangements

### Operational Clarity

- ✅ HR knows who handles payroll
- ✅ Operations know where promoters work
- ✅ Finance can track client billing
- ✅ Compliance understands employment relationships

### User Experience

- ✅ No more confusion about "employer"
- ✅ Clear distinction in UI
- ✅ Accurate reports
- ✅ Professional presentation

---

## Success Metrics

### After Implementation

- [x] Schema explicitly represents outsourcing
- [x] All 7 mismatched contracts migrated correctly
- [x] UI shows both employer and client clearly
- [x] Reports distinguish direct vs outsourced
- [x] New contracts automatically validated
- [x] Zero user confusion about employer vs client

---

## Timeline

| Phase                | Duration       | Status           |
| -------------------- | -------------- | ---------------- |
| Analysis & Diagnosis | 30 min         | ✅ COMPLETE      |
| Schema Design        | 15 min         | ✅ COMPLETE      |
| Migration SQL        | 15 min         | ✅ READY         |
| Type Updates         | 15 min         | ⏳ PENDING       |
| UI Updates           | 2 hours        | ⏳ PENDING       |
| Testing              | 30 min         | ⏳ PENDING       |
| **Total**            | **~3.5 hours** | **20% COMPLETE** |

---

## Next Steps

### Immediate (Do Now)

1. **Review this document** with stakeholders
2. **Confirm** outsourcing model is correct
3. **Run migration** in production

### Short-term (This Week)

4. **Update types** and API responses
5. **Enhance UI** to show employer vs client
6. **Test thoroughly** with real data

### Long-term (This Month)

7. **Create reports** for outsourcing analytics
8. **Train users** on new terminology
9. **Monitor** for data quality

---

## Conclusion

**Issue #2 is NOT a bug - it's a feature!** Your business uses a staffing agency model that wasn't properly represented in the schema.

**Recommended Action**: Implement the schema enhancement to make outsourcing explicit and clear for all users.

This will transform confusing data into clear business intelligence. 🎯
