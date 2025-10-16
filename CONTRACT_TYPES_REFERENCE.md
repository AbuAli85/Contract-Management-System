# 📋 Contract Types Reference Guide

**Error:** `"Contract type not found"`  
**Location:** `lib/contract-type-config.ts` line 1106  
**Cause:** The `contract_type` value doesn't match any configured type

---

## ✅ Valid Contract Type IDs

### **Frontend Configuration (lib/contract-type-config.ts)**

These are the **9 enhanced contract types** configured in the system:

| ID | Name | Category | Status |
|----|------|----------|--------|
| `full-time-permanent` | Full-Time Permanent Employment | Employment | ✅ Active |
| `part-time-fixed` | Part-Time Fixed-Term Contract | Employment | ✅ Active |
| `consulting-agreement` | Consulting Services Agreement | Consulting | ✅ Active |
| `service-contract` | Professional Services Contract | Service | ✅ Active |
| `freelance-project` | Freelance Project Contract | Freelance | ✅ Active |
| `partnership-agreement` | Business Partnership Agreement | Partnership | ✅ Active |
| `nda-standard` | Non-Disclosure Agreement (NDA) | NDA | ✅ Active |
| `vendor-supply` | Vendor Supply Agreement | Vendor | ✅ Active |
| `lease-equipment` | Equipment Lease Agreement | Lease | ✅ Active |

### **Database Values (for existing contracts)**

These are **legacy values** stored in the database:

| Value | Description | Valid |
|-------|-------------|-------|
| `employment` | Employment contract | ✅ Yes |
| `service` | Service contract | ✅ Yes |
| `consultancy` | Consultancy contract | ✅ Yes |
| `partnership` | Partnership | ✅ Yes |

---

## 🔍 How to Debug the Error

### **Step 1: Check What Value Was Sent**

The error message should indicate what contract type was attempted. Common issues:

❌ **Wrong:** `'unlimited-contract'` (from old CONTRACT_TYPES constant)  
✅ **Correct:** `'full-time-permanent'` (from enhanced config)

❌ **Wrong:** `'oman-unlimited-makecom'` (old Make.com type)  
✅ **Correct:** Use one of the 9 enhanced types above

### **Step 2: Check Your Form Data**

If you're creating a contract, ensure `contract_type` matches one of the valid IDs:

```typescript
const formData = {
  contract_type: 'full-time-permanent', // ✅ Valid
  // ... other fields
};
```

### **Step 3: Run Diagnostic Query**

```sql
-- See what contract types currently exist in your database
SELECT DISTINCT contract_type, COUNT(*) 
FROM contracts 
GROUP BY contract_type;
```

---

## 🔧 Common Fixes

### **Fix 1: Update Old Contract Type References**

If you have old contracts with invalid types:

```sql
-- Map old types to new enhanced types
UPDATE contracts 
SET contract_type = CASE
  WHEN contract_type IN ('unlimited-contract', 'full-time-permanent-old') THEN 'full-time-permanent'
  WHEN contract_type IN ('limited-contract', 'part-time') THEN 'part-time-fixed'
  WHEN contract_type IN ('consulting', 'consultancy') THEN 'consulting-agreement'
  WHEN contract_type = 'service' THEN 'service-contract'
  WHEN contract_type = 'freelance' THEN 'freelance-project'
  ELSE 'full-time-permanent' -- default
END
WHERE contract_type NOT IN (
  'full-time-permanent',
  'part-time-fixed',
  'consulting-agreement',
  'service-contract',
  'freelance-project',
  'partnership-agreement',
  'nda-standard',
  'vendor-supply',
  'lease-equipment'
);
```

### **Fix 2: Update Frontend Form**

Ensure your contract form uses the correct dropdown options:

```tsx
// ✅ CORRECT - Use enhanced contract types
import { enhancedContractTypes } from '@/lib/contract-type-config';

<select name="contract_type">
  {enhancedContractTypes.map(type => (
    <option key={type.id} value={type.id}>
      {type.name}
    </option>
  ))}
</select>

// ❌ WRONG - Don't use old CONTRACT_TYPES constant
import { CONTRACT_TYPES } from '@/constants/contract-options';
```

### **Fix 3: Add Fallback in Validation**

If you need to support legacy types temporarily:

```typescript
// In lib/contract-type-config.ts
export function getEnhancedContractTypeConfig(
  contractTypeId: string
): ContractTypeConfig | null {
  // Try exact match first
  let config = enhancedContractTypes.find(type => type.id === contractTypeId);
  
  // Fallback mapping for legacy types
  if (!config) {
    const legacyMap: Record<string, string> = {
      'employment': 'full-time-permanent',
      'service': 'service-contract',
      'consultancy': 'consulting-agreement',
      'partnership': 'partnership-agreement',
    };
    
    const mappedId = legacyMap[contractTypeId];
    if (mappedId) {
      config = enhancedContractTypes.find(type => type.id === mappedId);
    }
  }
  
  return config || null;
}
```

---

## 📊 Contract Type Configuration Details

### **Full-Time Permanent**
```typescript
{
  id: 'full-time-permanent',
  name: 'Full-Time Permanent Employment',
  category: 'employment',
  makecomTemplateId: 'full_time_permanent_employment_v2',
  googleDocsTemplateId: '1dzYQ_MDstiErG9O1yP87_bVXvDPQbe8V',
  requiresApproval: true,
}
```

### **Required Fields:**
- job_title
- department
- basic_salary
- contract_start_date
- contract_end_date
- work_location
- email
- currency

---

## 🚀 Testing

### **Valid API Request Example:**

```json
{
  "contract_type": "full-time-permanent",
  "first_party_id": "uuid-here",
  "second_party_id": "uuid-here",
  "promoter_id": "uuid-here",
  "job_title": "Senior Developer",
  "department": "Engineering",
  "basic_salary": 3000,
  "currency": "OMR",
  "contract_start_date": "2025-01-01",
  "contract_end_date": "2026-01-01",
  "work_location": "Muscat",
  "email": "developer@example.com"
}
```

### **Test in Browser Console:**

```javascript
// Check available contract types
import { enhancedContractTypes } from '@/lib/contract-type-config';
console.log('Available types:', enhancedContractTypes.map(t => t.id));

// Validate a contract type
import { validateContractTypeData } from '@/lib/contract-type-config';
const result = validateContractTypeData('full-time-permanent', {
  job_title: 'Developer',
  // ... other fields
});
console.log('Validation result:', result);
```

---

## 📝 Summary

**Valid Contract Type IDs:**
1. `full-time-permanent`
2. `part-time-fixed`
3. `consulting-agreement`
4. `service-contract`
5. `freelance-project`
6. `partnership-agreement`
7. `nda-standard`
8. `vendor-supply`
9. `lease-equipment`

**Legacy Database Values (still supported):**
- `employment`
- `service`
- `consultancy`
- `partnership`

**Action Required:**
- Check what `contract_type` value is being sent
- Ensure it matches one of the 9 enhanced IDs above
- Update any old references to use new IDs
- Run diagnostic query to check existing contracts

---

**Last Updated:** October 16, 2025

