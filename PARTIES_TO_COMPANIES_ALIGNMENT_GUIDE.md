# 🔄 Parties to Companies Alignment Guide

**Guide for aligning `parties` table (Employers) with `companies` table for the company switcher system.**

---

## 📊 **Current Situation**

### **Two Separate Systems:**

1. **`parties` Table** (Contract Management)
   - Stores employers with `type = 'Employer'`
   - Used for contracts, promoters, business relationships
   - Has rich data: CRN, licenses, contact info, etc.
   - **Your data shows:** 15+ employers (Falcon Eye group, etc.)

2. **`companies` Table** (Company Switcher)
   - Used by company switcher for multi-company access
   - Stores company info for user management
   - Linked via `company_members` table for user roles
   - **Currently:** May not have all parties as companies

### **The Gap:**

- **Parties** = Business entities (for contracts)
- **Companies** = User management entities (for access control)
- **Need:** Sync or map parties (Employers) → companies

---

## 🎯 **Alignment Strategies**

### **Option 1: Sync Parties → Companies (Recommended)**

Create companies from parties where `type = 'Employer'` and sync them.

#### **Migration Script:**

```sql
-- Step 1: Create companies from parties (Employers only)
INSERT INTO companies (
  id,
  name,
  slug,
  description,
  logo_url,
  email,
  phone,
  is_active,
  created_at,
  updated_at
)
SELECT 
  p.id,  -- Use same ID to maintain relationship
  p.name_en,
  LOWER(REGEXP_REPLACE(p.name_en, '[^a-zA-Z0-9]+', '-', 'g')),
  COALESCE(p.notes, ''),
  p.logo_url,
  p.contact_email,
  p.contact_phone,
  CASE WHEN p.overall_status = 'active' THEN true ELSE false END,
  p.created_at,
  p.updated_at
FROM parties p
WHERE p.type = 'Employer'
  AND p.overall_status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM companies c WHERE c.id = p.id
  );

-- Step 2: Create company_members entries for party owners
-- (Assuming you have a way to identify the owner user_id)
-- This would need to be customized based on your user mapping logic
```

#### **Update Company Switcher API:**

Modify `/api/user/companies` to also check parties:

```typescript
// Add to GET /api/user/companies
// Third try: Get companies from parties where user is associated
const { data: partyCompanies } = await adminClient
  .from('parties')
  .select('id, name_en, logo_url, contact_email')
  .eq('type', 'Employer')
  .eq('overall_status', 'active')
  .or(`contact_email.eq.${user.email},contact_person.ilike.%${userProfile?.full_name}%`);

if (partyCompanies) {
  for (const party of partyCompanies) {
    // Check if already in companies list
    if (!allCompanies.find(c => c.company_id === party.id)) {
      allCompanies.push({
        company_id: party.id,
        company_name: party.name_en,
        company_logo: party.logo_url,
        user_role: 'owner', // Or determine from your logic
        is_primary: false,
        group_name: null,
        source: 'parties', // Flag to indicate source
      });
    }
  }
}
```

---

### **Option 2: Add Foreign Key Relationship**

Add a `party_id` column to `companies` table to link them.

#### **Migration:**

```sql
-- Add party_id to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS party_id UUID REFERENCES parties(id) ON DELETE SET NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_companies_party_id ON companies(party_id);

-- Update existing companies to link to parties
UPDATE companies c
SET party_id = p.id
FROM parties p
WHERE LOWER(TRIM(c.name)) = LOWER(TRIM(p.name_en))
  AND p.type = 'Employer'
  AND c.party_id IS NULL;
```

#### **Benefits:**
- Maintains relationship between parties and companies
- Can query both tables together
- Preserves data integrity

---

### **Option 3: Unified Query (Hybrid Approach)**

Modify company switcher to query both tables and merge results.

#### **Updated API Endpoint:**

```typescript
// In /api/user/companies GET handler
export async function GET() {
  // ... existing company_members and companies queries ...
  
  // NEW: Also fetch from parties
  const { data: employerParties } = await adminClient
    .from('parties')
    .select('id, name_en, name_ar, logo_url, contact_email, contact_phone')
    .eq('type', 'Employer')
    .eq('overall_status', 'active');
  
  // Map parties to company format
  const partyCompanies = (employerParties || []).map(party => ({
    company_id: party.id,
    company_name: party.name_en,
    company_logo: party.logo_url,
    user_role: determineUserRole(party, user), // Custom logic
    is_primary: false,
    group_name: null,
    source: 'parties',
  }));
  
  // Merge with existing companies (deduplicate by ID)
  const merged = [...allCompanies, ...partyCompanies]
    .filter((v, i, a) => a.findIndex(t => t.company_id === v.company_id) === i);
  
  return NextResponse.json({
    success: true,
    companies: merged,
    active_company_id: activeCompanyId,
  });
}
```

---

## 🔍 **Analysis of Your Parties Data**

Based on your provided data, here's what I see:

### **Employers in Parties (15 total):**

1. **Quality project management LLC** - CRN: 1433266
2. **Vision Electronics LLC** - CRN: 1623029
3. **Falcon Eye Management and Investment** - CRN: 1412009
4. **AL AMRI INVESTMENT AND SERVICES LLC** - CRN: 1315483 (84 active contracts)
5. **Tawreed International** - CRN: 1428173
6. **FALCON ELECTRONIC LLC** - CRN: 1622553
7. **Falcon Eye Modern Investments SPC** - CRN: 1354155
8. **Falcon Eye Projects Management** - CRN: 1376466
9. **Amjad Al Maerifa LLC** - CRN: 1173975
10. **Blue Oasis Quality Services SPC** - CRN: 1367636
11. **Falcon Eye Al Khaleej** - CRN: 1607044
12. **Falcon Eye Business and Promotion** - CRN: 1251257
13. **Falcon Eye Orbit** - CRN: 1607083
14. **Falcon Eye Investment SPC** - CRN: 1015721
15. **Falcon Eye Management and Business** - CRN: 1410869
16. **Falcon Eye Promotion and Investment** - CRN: 1374638
17. **MUSCAT HORIZON BUSINESS DEVELOPMENT** - CRN: 1438137

### **Common Patterns:**

- **Most have:** `contact_email: "chairman@falconeyegroup.net"`
- **Most have:** `contact_person: "Fahad alamri"`
- **Many have:** `role: "ceo"` or `role: "chairman"`
- **All are:** `overall_status: "active"`

### **Recommendation:**

Since many employers share the same contact email, you could:
1. **Create companies** from these parties
2. **Link them** to the user with email `chairman@falconeyegroup.net`
3. **Assign role** based on party `role` field (ceo → owner/admin)

---

## 🛠️ **Implementation Steps**

### **Step 1: Create Sync Script**

```sql
-- sync_parties_to_companies.sql
-- This script creates companies from parties and links them to users

-- 1. Create companies from active employers
INSERT INTO companies (
  id,
  name,
  slug,
  description,
  email,
  phone,
  is_active,
  created_at,
  updated_at
)
SELECT 
  p.id,
  p.name_en,
  LOWER(REGEXP_REPLACE(REGEXP_REPLACE(p.name_en, '[^a-zA-Z0-9]+', '-', 'g'), '^-|-$', '', 'g')),
  COALESCE(p.notes, ''),
  p.contact_email,
  p.contact_phone,
  CASE WHEN p.overall_status = 'active' THEN true ELSE false END,
  p.created_at,
  p.updated_at
FROM parties p
WHERE p.type = 'Employer'
  AND p.overall_status = 'active'
  AND NOT EXISTS (SELECT 1 FROM companies c WHERE c.id = p.id)
ON CONFLICT (id) DO NOTHING;

-- 2. Find users by contact_email and create company_members
-- This assumes you have users with matching emails
INSERT INTO company_members (
  company_id,
  user_id,
  role,
  is_primary,
  status,
  created_at
)
SELECT DISTINCT
  c.id,
  u.id,
  CASE 
    WHEN p.role IN ('ceo', 'chairman', 'owner') THEN 'owner'
    WHEN p.role IN ('admin', 'manager') THEN 'admin'
    ELSE 'member'
  END,
  ROW_NUMBER() OVER (PARTITION BY u.id ORDER BY p.created_at) = 1, -- First company is primary
  'active',
  NOW()
FROM companies c
JOIN parties p ON p.id = c.id
JOIN profiles u ON u.email = p.contact_email
WHERE p.type = 'Employer'
  AND p.overall_status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM company_members cm 
    WHERE cm.company_id = c.id AND cm.user_id = u.id
  );
```

### **Step 2: Update Company Switcher API**

Modify `/api/user/companies/route.ts` to include parties:

```typescript
// Add after existing company queries
// Third source: Get companies from parties (Employers)
if (user.email) {
  const { data: partyEmployers } = await adminClient
    .from('parties')
    .select(`
      id,
      name_en,
      logo_url,
      contact_email,
      role
    `)
    .eq('type', 'Employer')
    .eq('overall_status', 'active')
    .eq('contact_email', user.email);

  if (partyEmployers) {
    const existingIds = new Set(allCompanies.map(c => c.company_id));
    for (const party of partyEmployers) {
      if (!existingIds.has(party.id)) {
        // Determine role from party.role
        let userRole = 'member';
        if (['ceo', 'chairman', 'owner'].includes(party.role?.toLowerCase() || '')) {
          userRole = 'owner';
        } else if (['admin', 'manager'].includes(party.role?.toLowerCase() || '')) {
          userRole = 'admin';
        }

        allCompanies.push({
          company_id: party.id,
          company_name: party.name_en,
          company_logo: party.logo_url,
          user_role: userRole,
          is_primary: allCompanies.length === 0,
          group_name: null,
          source: 'parties', // Flag to track source
        });
      }
    }
  }
}
```

### **Step 3: Add Party ID to Companies (Optional)**

If you want to maintain the relationship:

```sql
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS party_id UUID REFERENCES parties(id);

-- Link existing companies to parties by name match
UPDATE companies c
SET party_id = p.id
FROM parties p
WHERE LOWER(TRIM(c.name)) = LOWER(TRIM(p.name_en))
  AND p.type = 'Employer'
  AND c.party_id IS NULL;
```

---

## 📋 **Quick Reference**

### **Tables Involved:**

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `parties` | Business entities (Employers/Clients) | `id`, `name_en`, `type`, `contact_email` |
| `companies` | User management entities | `id`, `name`, `slug`, `owner_id` |
| `company_members` | User-company relationships | `company_id`, `user_id`, `role`, `status` |
| `profiles` | User profiles | `id`, `email`, `active_company_id` |

### **Mapping Logic:**

```
parties (type='Employer') 
  → companies (create if not exists)
  → company_members (link user by contact_email)
  → profiles.active_company_id (set active company)
```

---

## ✅ **Verification Queries**

After alignment, verify with these queries:

```sql
-- 1. Check companies created from parties
SELECT 
  c.id,
  c.name,
  p.name_en as party_name,
  p.contact_email,
  p.type
FROM companies c
JOIN parties p ON p.id = c.id
WHERE p.type = 'Employer';

-- 2. Check company_members created
SELECT 
  cm.company_id,
  c.name as company_name,
  u.email as user_email,
  cm.role,
  cm.status
FROM company_members cm
JOIN companies c ON c.id = cm.company_id
JOIN profiles u ON u.id = cm.user_id
WHERE cm.status = 'active';

-- 3. Check for orphaned parties (no company)
SELECT 
  p.id,
  p.name_en,
  p.contact_email,
  p.type
FROM parties p
WHERE p.type = 'Employer'
  AND p.overall_status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM companies c WHERE c.id = p.id
  );
```

---

## 🎯 **Next Steps**

1. **Review** your parties data (you've already done this)
2. **Decide** on alignment strategy (Option 1, 2, or 3)
3. **Run** sync script to create companies from parties
4. **Update** company switcher API to include parties
5. **Test** company switcher with new data
6. **Verify** all employers appear in switcher

---

## 💡 **Recommendation**

**Use Option 1 (Sync Parties → Companies)** because:
- ✅ Maintains data consistency
- ✅ Uses existing company switcher infrastructure
- ✅ Preserves party data integrity
- ✅ Easy to maintain going forward

Then update the company switcher API to also query parties as a fallback for any missing companies.

