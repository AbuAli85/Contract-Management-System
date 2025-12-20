# How to Add Companies to a Holding Group

## 🎯 Quick Guide

There are **3 ways** to add companies/parties to a holding group:

1. **Via UI** (Easiest - Recommended) ✅
2. **Via API** (For automation)
3. **Via SQL** (For bulk operations)

---

## Method 1: Via UI (Easiest) ✅

### Step-by-Step:

1. **Navigate to Holding Groups Page**
   - Go to: `/manage-parties/holding-groups`
   - Or find "Holding Groups" in the sidebar under "Parties & Employers"

2. **Select a Holding Group**
   - Click on the holding group you want to manage
   - Or click "View Members" / "Manage Members" button

3. **Add Members**
   - Click the **"Add Members"** button
   - Select member type:
     - **"Parties (Employers)"** - to add employer parties
     - **"Companies"** - to add companies
   - Select the companies/parties from the dropdown
   - Selected items will appear as badges
   - Click **"Add Members"** to confirm

4. **Remove Members** (if needed)
   - Click the **X** button next to any member to remove it

### Visual Guide:

```
Holding Groups Page
  └─> Select "Falcon Eye Group"
      └─> Click "Add Members"
          └─> Select "Parties (Employers)"
              └─> Choose companies from dropdown
                  └─> Click "Add Members"
```

---

## Method 2: Via API

### Add Members to Holding Group

**Endpoint**: `POST /api/holding-groups/[id]/members`

**Request Body**:
```json
{
  "member_ids": ["party-id-1", "party-id-2", "party-id-3"],
  "member_type": "party"
}
```

**Example using cURL**:
```bash
curl -X POST https://your-domain.com/api/holding-groups/falcon-eye-group-id/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "member_ids": [
      "party-id-1",
      "party-id-2"
    ],
    "member_type": "party"
  }'
```

**Example using JavaScript/TypeScript**:
```typescript
const response = await fetch('/api/holding-groups/falcon-eye-group-id/members', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    member_ids: ['party-id-1', 'party-id-2'],
    member_type: 'party', // or 'company'
  }),
});

const { data, error } = await response.json();
```

---

## Method 3: Via SQL (For Bulk Operations)

### Add Single Company/Party

```sql
INSERT INTO holding_group_members (
  holding_group_id,
  party_id,  -- or company_id
  member_type,
  display_order,
  created_at,
  updated_at
)
VALUES (
  'holding-group-id-here',  -- Falcon Eye Group ID
  'party-id-here',          -- Company/Party ID to add
  'party',                   -- or 'company'
  0,                         -- Display order
  NOW(),
  NOW()
);
```

### Add Multiple Companies/Parties

```sql
-- Get the holding group ID first
SELECT id FROM holding_groups WHERE name_en = 'Falcon Eye Group';

-- Then add multiple members
INSERT INTO holding_group_members (
  holding_group_id,
  party_id,
  member_type,
  display_order,
  created_at,
  updated_at
)
SELECT 
  'holding-group-id-here',  -- Replace with actual ID
  pt.id,
  'party',
  ROW_NUMBER() OVER (ORDER BY pt.name_en),
  NOW(),
  NOW()
FROM parties pt
WHERE pt.id IN ('party-id-1', 'party-id-2', 'party-id-3')
  AND pt.type = 'Employer'
  AND pt.overall_status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM holding_group_members hgm
    WHERE hgm.party_id = pt.id
  );
```

### Add All Falcon Eye Companies (Example)

```sql
-- This is already in the setup script, but here's how to do it manually:
DO $$
DECLARE
  v_falcon_eye_group_id UUID;
BEGIN
  -- Get Falcon Eye Group ID
  SELECT id INTO v_falcon_eye_group_id
  FROM holding_groups
  WHERE name_en = 'Falcon Eye Group'
  LIMIT 1;

  -- Add all Falcon Eye companies
  INSERT INTO holding_group_members (
    holding_group_id,
    party_id,
    member_type,
    display_order,
    created_at,
    updated_at
  )
  SELECT 
    v_falcon_eye_group_id,
    pt.id,
    'party',
    ROW_NUMBER() OVER (ORDER BY pt.name_en),
    NOW(),
    NOW()
  FROM parties pt
  WHERE (LOWER(pt.name_en) LIKE '%falcon%eye%'
     OR LOWER(pt.name_ar) LIKE '%falcon%eye%')
    AND pt.type = 'Employer'
    AND pt.overall_status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM holding_group_members hgm
      WHERE hgm.party_id = pt.id
    );
END $$;
```

---

## 📋 Quick Reference

### Find Holding Group ID
```sql
SELECT id, name_en FROM holding_groups WHERE name_en = 'Falcon Eye Group';
```

### Find Party IDs to Add
```sql
SELECT id, name_en, type 
FROM parties 
WHERE type = 'Employer' 
  AND overall_status = 'active'
ORDER BY name_en;
```

### View Current Members
```sql
SELECT 
  hg.name_en as holding_group,
  pt.name_en as company_name,
  hgm.member_type,
  hgm.display_order
FROM holding_group_members hgm
JOIN holding_groups hg ON hg.id = hgm.holding_group_id
JOIN parties pt ON pt.id = hgm.party_id
WHERE hg.name_en = 'Falcon Eye Group'
ORDER BY hgm.display_order;
```

### Remove a Member
```sql
DELETE FROM holding_group_members
WHERE holding_group_id = 'holding-group-id'
  AND party_id = 'party-id-to-remove';
```

---

## 🎯 Recommended Approach

**For most users**: Use the **UI Method** - it's the easiest and safest.

**For developers/automation**: Use the **API Method**.

**For bulk operations**: Use the **SQL Method**.

---

## ⚠️ Important Notes

1. **One Company = One Group**: Each company/party can only belong to ONE holding group (enforced by unique index)

2. **Member Type**: You must specify whether you're adding a `party` or `company`

3. **Display Order**: Members are ordered by `display_order` (lower numbers appear first)

4. **Active Status**: Only active parties/companies should be added

---

## 🔍 Troubleshooting

### Issue: "Company already in a holding group"
**Solution**: Remove it from the other group first, or check which group it belongs to:
```sql
SELECT hg.name_en 
FROM holding_group_members hgm
JOIN holding_groups hg ON hg.id = hgm.holding_group_id
WHERE hgm.party_id = 'your-party-id';
```

### Issue: "Cannot add inactive company"
**Solution**: Only active companies can be added. Check status:
```sql
SELECT id, name_en, overall_status 
FROM parties 
WHERE id = 'your-party-id';
```

### Issue: "Holding group not found"
**Solution**: Verify the holding group exists:
```sql
SELECT * FROM holding_groups WHERE name_en = 'Falcon Eye Group';
```

