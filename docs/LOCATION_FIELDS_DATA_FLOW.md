# Location Fields Data Flow Diagram

## Overview
This document illustrates how location data flows from the frontend through the API to Make.com and finally into the generated PDF contract.

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React)                                │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  SimpleContractGenerator / SimpleContractGeneratorWithValidation   │ │
│  │                                                                      │ │
│  │  User Input:                                                         │ │
│  │  • work_location: "Muscat, Oman"                                    │ │
│  │  • location_en: "Muscat, Oman"              (optional, future)      │ │
│  │  • location_ar: "مسقط، سلطنة عُمان"         (optional, future)      │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                     │                                     │
│                                     │ POST /api/contracts/makecom/generate│
│                                     ▼                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │
┌─────────────────────────────────────────────────────────────────────────┐
│                       BACKEND API (Next.js)                              │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  app/api/contracts/makecom/generate/route.ts                       │ │
│  │                                                                      │ │
│  │  Processing:                                                         │ │
│  │  ┌────────────────────────────────────────────────────────────┐   │ │
│  │  │ 1. Receive contractData from request                        │   │ │
│  │  │    {                                                         │   │ │
│  │  │      work_location: "Muscat, Oman",                          │   │ │
│  │  │      location_en: "Muscat, Oman",                            │   │ │
│  │  │      location_ar: "مسقط، سلطنة عُمان"                        │   │ │
│  │  │    }                                                         │   │ │
│  │  └────────────────────────────────────────────────────────────┘   │ │
│  │                                                                      │ │
│  │  ┌────────────────────────────────────────────────────────────┐   │ │
│  │  │ 2. Set fallback logic (Lines 173-175)                      │   │ │
│  │  │    const location_en = contractData.location_en ||          │   │ │
│  │  │                        contractData.work_location || '';    │   │ │
│  │  │    const location_ar = contractData.location_ar ||          │   │ │
│  │  │                        contractData.work_location || '';    │   │ │
│  │  └────────────────────────────────────────────────────────────┘   │ │
│  │                                                                      │ │
│  │  ┌────────────────────────────────────────────────────────────┐   │ │
│  │  │ 3. Fetch related data (promoter, parties)                   │   │ │
│  │  │    • Promoter data with images                              │   │ │
│  │  │    • First party (employer) data                            │   │ │
│  │  │    • Second party data                                      │   │ │
│  │  └────────────────────────────────────────────────────────────┘   │ │
│  │                                                                      │ │
│  │  ┌────────────────────────────────────────────────────────────┐   │ │
│  │  │ 4. Enrich contract data (Lines 304-309)                     │   │ │
│  │  │    enrichedContractData = {                                 │   │ │
│  │  │      ...enrichedContractData,                               │   │ │
│  │  │      location_en,                                           │   │ │
│  │  │      location_ar,                                           │   │ │
│  │  │      // + all other fields                                  │   │ │
│  │  │    }                                                         │   │ │
│  │  └────────────────────────────────────────────────────────────┘   │ │
│  │                                                                      │ │
│  │  ┌────────────────────────────────────────────────────────────┐   │ │
│  │  │ 5. Create contract in database                              │   │ │
│  │  │    INSERT INTO contracts (...)                              │   │ │
│  │  │    VALUES (... location_en, location_ar ...)               │   │ │
│  │  └────────────────────────────────────────────────────────────┘   │ │
│  │                                                                      │ │
│  │  ┌────────────────────────────────────────────────────────────┐   │ │
│  │  │ 6. Prepare webhook payload                                  │   │ │
│  │  │    enhancedPayload = {                                      │   │ │
│  │  │      contract_id: "...",                                    │   │ │
│  │  │      contract_number: "PAC-...",                            │   │ │
│  │  │      work_location: "Muscat, Oman",                         │   │ │
│  │  │      location_en: "Muscat, Oman",                           │   │ │
│  │  │      location_ar: "مسقط، سلطنة عُمان",                      │   │ │
│  │  │      promoter_name_en: "...",                               │   │ │
│  │  │      // + all enriched fields                               │   │ │
│  │  │    }                                                         │   │ │
│  │  └────────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                     │                                     │
│                                     │ POST to MAKECOM_WEBHOOK_URL         │
│                                     ▼                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │
┌─────────────────────────────────────────────────────────────────────────┐
│                      MAKE.COM SCENARIO                                   │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  Module 1: CustomWebHook (Receive Data)                            │ │
│  │  ┌──────────────────────────────────────────────────────────────┐ │ │
│  │  │  Receives:                                                     │ │ │
│  │  │  {                                                             │ │ │
│  │  │    contract_id: "uuid",                                        │ │ │
│  │  │    contract_number: "PAC-22102024-1234",                       │ │ │
│  │  │    work_location: "Muscat, Oman",                              │ │ │
│  │  │    location_en: "Muscat, Oman",                                │ │ │
│  │  │    location_ar: "مسقط، سلطنة عُمان",                           │ │ │
│  │  │    promoter_id: "uuid",                                        │ │ │
│  │  │    first_party_id: "uuid",                                     │ │ │
│  │  │    second_party_id: "uuid",                                    │ │ │
│  │  │    // ... other fields                                         │ │ │
│  │  │  }                                                             │ │ │
│  │  └──────────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                     │                                     │
│                                     ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  Module 53-54: Set contract_id and contract_number variables       │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                     │                                     │
│                                     ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  Module 57-59: Fetch promoter and parties data from Supabase      │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                     │                                     │
│                                     ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  Module 55: SetVariables (Store all data)                          │ │
│  │  ┌──────────────────────────────────────────────────────────────┐ │ │
│  │  │  Variables stored:                                             │ │ │
│  │  │  • stored_contract_type                                        │ │ │
│  │  │  • stored_promoter_id                                          │ │ │
│  │  │  • stored_job_title                                            │ │ │
│  │  │  • stored_department                                           │ │ │
│  │  │  • stored_work_location                                        │ │ │
│  │  │  • stored_location_en ← NEW! ✨                                │ │ │
│  │  │    = if(length(1.location_en) > 0;                             │ │ │
│  │  │         1.location_en;                                         │ │ │
│  │  │         1.work_location)                                       │ │ │
│  │  │  • stored_location_ar ← NEW! ✨                                │ │ │
│  │  │    = if(length(1.location_ar) > 0;                             │ │ │
│  │  │         1.location_ar;                                         │ │ │
│  │  │         1.work_location)                                       │ │ │
│  │  │  • stored_basic_salary                                         │ │ │
│  │  │  • stored_promoter_name_en                                     │ │ │
│  │  │  • stored_promoter_name_ar                                     │ │ │
│  │  │  • stored_promoter_id_card_image_url                           │ │ │
│  │  │  • stored_promoter_passport_image_url                          │ │ │
│  │  │  • stored_first_party_logo_url                                 │ │ │
│  │  │  • ... (26 variables total)                                    │ │ │
│  │  └──────────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                     │                                     │
│                                     ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  Module 4: Get Google Docs template                                │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                     │                                     │
│                                     ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  Module 5: Store template content                                  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                     │                                     │
│                                     ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  Module 56: Create Document from Template                          │ │
│  │  ┌──────────────────────────────────────────────────────────────┐ │ │
│  │  │  Text Replacements:                                            │ │ │
│  │  │  • {{ref_number}} → "PAC-22102024-1234"                        │ │ │
│  │  │  • {{first_party_name_en}} → "ABC Company"                     │ │ │
│  │  │  • {{first_party_name_ar}} → "شركة ABC"                        │ │ │
│  │  │  • {{promoter_name_en}} → "John Doe"                           │ │ │
│  │  │  • {{promoter_name_ar}} → "جون دو"                             │ │ │
│  │  │  • {{location_en}} → "Muscat, Oman" ← NEW! ✨                  │ │ │
│  │  │    (from 55.stored_location_en)                                │ │ │
│  │  │  • {{location_ar}} → "مسقط، سلطنة عُمان" ← NEW! ✨            │ │ │
│  │  │    (from 55.stored_location_ar)                                │ │ │
│  │  │  • {{contract_start_date}} → "01-01-2024"                      │ │ │
│  │  │  • {{contract_end_date}} → "31-12-2024"                        │ │ │
│  │  │                                                                 │ │ │
│  │  │  Image Replacements:                                           │ │ │
│  │  │  • kix.9n0jtkeyw9ii-t.0 → First party logo                     │ │ │
│  │  │  • kix.2k5omiotmkl-t.0 → Promoter ID card image               │ │ │
│  │  │  • kix.4io8vw4k1u1n-t.0 → Promoter passport image             │ │ │
│  │  └──────────────────────────────────────────────────────────────┘ │ │
│  │                                                                      │ │
│  │  Output: Google Docs document with all fields replaced              │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                     │                                     │
│                                     ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  Module 8: Export Document as PDF                                  │ │
│  │  Output: PDF file with filled contract                             │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                     │                                     │
│                                     ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  Module 9: Upload PDF to Supabase Storage                          │ │
│  │  File: PAC-22102024-1234-John_Doe.pdf                              │ │
│  │  Bucket: contracts                                                  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                     │                                     │
│                                     ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  Module 10: Send webhook back to API                               │ │
│  │  POST /api/webhook/contract-pdf-ready                              │ │
│  │  {                                                                  │ │
│  │    contract_id: "uuid",                                             │ │
│  │    pdf_url: "https://.../contracts/PAC-22102024-1234.pdf",         │ │
│  │    status: "generated"                                              │ │
│  │  }                                                                  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                     │                                     │
│                                     ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  Module 11: Respond to original webhook                            │ │
│  │  Status: 200 OK                                                     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │
┌─────────────────────────────────────────────────────────────────────────┐
│                       GENERATED CONTRACT PDF                             │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                      EMPLOYMENT CONTRACT                            │ │
│  │  ═══════════════════════════════════════════════════════════════   │ │
│  │                                                                      │ │
│  │  Contract Number: PAC-22102024-1234                                 │ │
│  │                                                                      │ │
│  │  FIRST PARTY (Employer)                                             │ │
│  │  Company Name: ABC Company                                          │ │
│  │                                                                      │ │
│  │  SECOND PARTY (Employee)                                            │ │
│  │  Employee Name: John Doe                                            │ │
│  │  ID Card Number: 12345678                                           │ │
│  │                                                                      │ │
│  │  CONTRACT DETAILS                                                   │ │
│  │  Job Title: Software Engineer                                       │ │
│  │  Department: IT Department                                          │ │
│  │  Work Location: Muscat, Oman  ← ✨ FROM location_en                │ │
│  │  Start Date: 01-01-2024                                             │ │
│  │  End Date: 31-12-2024                                               │ │
│  │                                                                      │ │
│  │  ───────────────────────────────────────────────────────────────   │ │
│  │                                                                      │ │
│  │                          عقد عمل                                    │ │
│  │  ═══════════════════════════════════════════════════════════════   │ │
│  │                                                                      │ │
│  │  رقم العقد: PAC-22102024-1234                                       │ │
│  │                                                                      │ │
│  │  الطرف الأول (صاحب العمل)                                          │ │
│  │  اسم الشركة: شركة ABC                                               │ │
│  │                                                                      │ │
│  │  الطرف الثاني (الموظف)                                             │ │
│  │  اسم الموظف: جون دو                                                 │ │
│  │  رقم بطاقة الهوية: 12345678                                         │ │
│  │                                                                      │ │
│  │  تفاصيل العقد                                                       │ │
│  │  المسمى الوظيفي: مهندس برمجيات                                     │ │
│  │  القسم: قسم تقنية المعلومات                                         │ │
│  │  موقع العمل: مسقط، سلطنة عُمان  ← ✨ FROM location_ar             │ │
│  │  تاريخ البدء: 01-01-2024                                            │ │
│  │  تاريخ الانتهاء: 31-12-2024                                         │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Fallback Logic Visualization

### Scenario 1: All Location Fields Provided ✅
```
Input:
├─ work_location: "Muscat, Oman"
├─ location_en: "Muscat, Oman"
└─ location_ar: "مسقط، سلطنة عُمان"

Module 55 Processing:
├─ stored_location_en = "Muscat, Oman"  (uses location_en)
└─ stored_location_ar = "مسقط، سلطنة عُمان"  (uses location_ar)

Document Output:
├─ English section: "Muscat, Oman"  ✅
└─ Arabic section: "مسقط، سلطنة عُمان"  ✅
```

### Scenario 2: Only work_location Provided (Backward Compatible) ✅
```
Input:
└─ work_location: "Muscat, Oman"

Module 55 Processing:
├─ stored_location_en = "Muscat, Oman"  (fallback to work_location)
└─ stored_location_ar = "Muscat, Oman"  (fallback to work_location)

Document Output:
├─ English section: "Muscat, Oman"  ✅
└─ Arabic section: "Muscat, Oman"  ✅
```

### Scenario 3: Partial Location Fields ✅
```
Input:
├─ work_location: "Default Location"
└─ location_en: "Muscat, Oman"

Module 55 Processing:
├─ stored_location_en = "Muscat, Oman"  (uses location_en)
└─ stored_location_ar = "Default Location"  (fallback to work_location)

Document Output:
├─ English section: "Muscat, Oman"  ✅
└─ Arabic section: "Default Location"  ✅
```

### Scenario 4: Empty Location Fields (Edge Case) ⚠️
```
Input:
├─ work_location: ""
├─ location_en: ""
└─ location_ar: ""

Module 55 Processing:
├─ stored_location_en = ""  (empty)
└─ stored_location_ar = ""  (empty)

Document Output:
├─ English section: ""  (blank)
└─ Arabic section: ""  (blank)
```

---

## Key Data Transformation Points

### 🔵 Point 1: API Route (Lines 173-175)
**Purpose:** Set fallback values
```typescript
const location_en = contractData.location_en || contractData.work_location || '';
const location_ar = contractData.location_ar || contractData.work_location || '';
```

### 🔵 Point 2: API Route (Lines 304-309)
**Purpose:** Add to enriched payload
```typescript
enrichedContractData = {
  ...enrichedContractData,
  location_en,
  location_ar,
};
```

### 🔵 Point 3: Make.com Module 55
**Purpose:** Store with fallback logic
```javascript
{{if(length(1.location_en) > 0; 1.location_en; 1.work_location)}}
```

### 🔵 Point 4: Make.com Module 56
**Purpose:** Replace in template
```json
"location_en": "{{55.stored_location_en}}",
"location_ar": "{{55.stored_location_ar}}"
```

---

## Summary

The location data flows through 4 main stages:

1. **Frontend** → Collects location data (current: work_location only)
2. **API** → Processes and enriches with fallback logic
3. **Make.com** → Stores variables and replaces template placeholders
4. **PDF** → Final document with location in both languages

**Key Feature:** Automatic fallback ensures backward compatibility while supporting future bilingual contracts.

---

## Testing Workflow

```
1. Send test request → /api/contracts/makecom/generate
                       {
                         location_en: "Muscat",
                         location_ar: "مسقط"
                       }
                       
2. Check logs → API route shows enriched data
                ✅ location_en: "Muscat"
                ✅ location_ar: "مسقط"
                
3. Check Make.com → Module 55 shows stored variables
                    ✅ stored_location_en: "Muscat"
                    ✅ stored_location_ar: "مسقط"
                    
4. Check template → Module 56 replaces placeholders
                    {{location_en}} → "Muscat"
                    {{location_ar}} → "مسقط"
                    
5. Check PDF → Download and verify
               ✅ English section shows "Muscat"
               ✅ Arabic section shows "مسقط"
```

---

## Related Documents
- `MAKECOM_LOCATION_UPDATE_STEPS.md` - Step-by-step update guide
- `LOCATION_FIELDS_IMPLEMENTATION.md` - Detailed technical implementation
- `MAKECOM_SIMPLE_CONTRACT_FLOW_WITH_LOCATIONS.json` - Complete Make.com flow

