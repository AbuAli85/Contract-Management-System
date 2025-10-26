# 📄 Contract Generation System - Sharaf DG Deployment Letters

**Template:** Promoters Deployment Letter - Sharaf DG  
**Date:** October 26, 2025  
**Status:** Production Ready

---

## 📊 Workflow Overview

### Purpose
Automated generation of bilingual (English/Arabic) deployment letters for promoters assigned to Sharaf DG contracts.

### Flow Summary
```
Webhook Trigger → Store Variables → Fetch Template → Generate Document → 
Export PDF → Upload to Storage → Notify App → Return Response
```

---

## 🔄 Detailed Workflow Analysis

### Module 1: Webhook Trigger
**Type:** Custom Webhook  
**Purpose:** Receive contract generation request

**Input Fields:**
```typescript
{
  contract_id: string           // UUID
  contract_number: string       // e.g., "SDG-2025-001"
  contract_type: string         // Type of contract
  promoter_id: string          // UUID
  first_party_id: string       // Employer party UUID
  second_party_id: string      // Client party UUID (Sharaf DG)
  
  // Promoter Information
  promoter_name_en: string     // English name
  promoter_name_ar: string     // Arabic name
  promoter_mobile_number: string
  promoter_email: string
  promoter_id_card_number: string
  promoter_id_card_url: string      // Image URL
  promoter_passport_url: string     // Image URL
  passport_number: string
  
  // Party Information
  first_party_name_en: string       // e.g., "Falcon Eye Group"
  first_party_name_ar: string
  first_party_crn: string           // Commercial Registration Number
  first_party_logo: string          // Logo URL
  
  second_party_name_en: string      // "Sharaf DG"
  second_party_name_ar: string
  second_party_crn: string
  second_party_logo: string
  
  // Contract Details
  job_title: string
  department: string
  work_location: string
  basic_salary: number
  contract_start_date: string       // ISO date
  contract_end_date: string         // ISO date
  special_terms: string             // Optional
}
```

### Modules 2-4: Variable Storage
**Purpose:** Store contract data in Make.com variables for use throughout workflow

**Why Needed:**
- Ensures data persistence across modules
- Allows data transformation (e.g., date formatting)
- Prevents re-fetching data from webhook

### Module 5: Fetch Google Doc Template
**Template ID:** `1KEaL5uiIueZTCasMXVJInlrp0dPmd8Z6tm8Qof7ih2E`  
**Location:** `/contracts/templates/Promoters deployment letter-Sharaf DG`

**Template Placeholders:**
```
English Fields:
- {{first_party_name_en}}
- {{second_party_name_en}}
- {{first_party_crn}}
- {{second_party_crn}}

Arabic Fields:
- {{first_party_name_ar}}
- {{second_party_name_ar}}
- {{promoter_name_ar}}

Dates:
- {{contract_start_date}}     // Formatted as DD-MM-YYYY
- {{contract_end_date}}        // Formatted as DD-MM-YYYY

IDs:
- {{id_card_number}}
- {{passport_number}}

Images (special handling):
- ID_CARD_IMAGE (kix.oxkt724lli4z-t.0)
- PASSPORT_IMAGE (kix.3ecuabnckqxm-t.0)
```

### Module 6: Create Document from Template
**Purpose:** Generate filled document from template

**Features:**
- Text placeholder replacement
- Image embedding (ID card and passport)
- Date formatting
- Bilingual support
- Auto-naming: `{contract_number}-{promoter_name_en}.pdf`

**Output Folder:** `1tBNSMae1HsHxdq8WjMaoeuhn6WAPTpvP`

### Module 7: Export to PDF
**Format:** `application/pdf`  
**Source:** Generated Google Doc  
**Output:** PDF binary data

### Module 8: Upload to Supabase
**Bucket:** Environment variable `CONTRACTS_STORAGE_BUCKET`  
**File Name:** `{contract_number}-{promoter_name_en}.pdf`  
**Upsert:** Enabled (overwrites if exists)

**Public URL Pattern:**
```
https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/contracts/{contract_number}.pdf
```

### Module 9: Notify Application
**Endpoint:** `{CONTRACTS_API_URL}/api/webhook/contract-pdf-ready`  
**Method:** PATCH  
**Headers:**
- `X-Webhook-Secret`: Secure webhook validation
- `X-Make-Request-ID`: Trace requests
- `Content-Type`: application/json

**Payload:**
```json
{
  "contract_id": "uuid",
  "contract_number": "SDG-2025-001",
  "pdf_url": "https://..../contracts/SDG-2025-001.pdf",
  "google_drive_url": "https://docs.google.com/document/d/.../edit",
  "status": "generated",
  "images_processed": {
    "id_card": false,
    "passport": false
  }
}
```

### Module 10: Webhook Response
**Status:** 200  
**Body:** Same as notification payload

---

## 📋 Template Requirements

### Document Structure

#### Section 1: Header
- First party logo (left)
- Second party logo (right)
- Document title (bilingual)

#### Section 2: Document Information (Arabic)
```
التاريخ: {{contract_start_date}}
الموضوع: خطاب إلحاق موظف

السادة/ {{second_party_name_ar}}
المحترمين،

نشير إلى العقد رقم {{first_party_crn}} المبرم بيننا...
```

#### Section 3: Promoter Details (Arabic)
```
الاسم: {{promoter_name_ar}}
رقم الهوية: {{id_card_number}}
رقم الجواز: {{passport_number}}
```

#### Section 4: Contract Terms
- Start date / End date
- Job title
- Department
- Work location
- Basic salary (if applicable)

#### Section 5: Document Images
- ID Card Image (embedded)
- Passport Image (embedded)

#### Section 6: Footer
- Company stamp
- Authorized signature
- Date

### Template Placeholders Mapping

| Placeholder | Source Field | Format |
|-------------|--------------|--------|
| `{{first_party_name_en}}` | `first_party_name_en` | As-is |
| `{{first_party_name_ar}}` | `first_party_name_ar` | RTL |
| `{{second_party_name_en}}` | `second_party_name_en` | As-is |
| `{{second_party_name_ar}}` | `second_party_name_ar` | RTL |
| `{{promoter_name_ar}}` | `promoter_name_ar` | RTL |
| `{{id_card_number}}` | `promoter_id_card_number` | As-is |
| `{{passport_number}}` | `passport_number` | As-is |
| `{{contract_start_date}}` | `contract_start_date` | DD-MM-YYYY |
| `{{contract_end_date}}` | `contract_end_date` | DD-MM-YYYY |
| `{{first_party_crn}}` | `first_party_crn` | As-is |
| `{{second_party_crn}}` | `second_party_crn` | As-is |
| `ID_CARD_IMAGE` | `promoter_id_card_url` | Image embed |
| `PASSPORT_IMAGE` | `promoter_passport_url` | Image embed |

---

## 🎨 UI/UX Implementation Needs

### 1. Contract Generation Button

**Location:** Contract details page  
**Trigger:** When contract status is 'approved' or 'active'

```typescript
// Component: GenerateContractButton.tsx
interface Props {
  contractId: string;
  contractNumber: string;
  isGenerating: boolean;
  onGenerate: () => void;
}
```

### 2. Generation Status Indicator

**States:**
- `idle`: Not generated
- `generating`: In progress (show spinner)
- `generated`: PDF ready (show download link)
- `error`: Generation failed

### 3. PDF Viewer/Download

**Features:**
- Inline PDF preview
- Download button
- Share link
- Print option
- Google Drive link (for editing)

### 4. Regeneration Confirmation

**Flow:**
```
User clicks "Regenerate" → 
Show confirmation modal → 
"This will overwrite existing PDF. Continue?" → 
Yes: Trigger generation → 
Update status
```

### 5. Template Preview (Admin)

**Purpose:** Preview template before generation  
**Features:**
- Show all placeholders
- Sample data filling
- Validation of required fields

---

## 🔧 Technical Implementation

### Frontend API Call

```typescript
// app/api/contracts/[id]/generate-pdf/route.ts
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const contractId = params.id;
  
  // 1. Fetch complete contract data
  const contract = await getContractWithRelations(contractId);
  
  // 2. Validate all required fields
  validateContractData(contract);
  
  // 3. Call Make.com webhook
  const response = await fetch(MAKE_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contract_id: contract.id,
      contract_number: contract.contract_number,
      contract_type: contract.contract_type,
      // ... all fields
    }),
  });
  
  // 4. Return immediate response
  return Response.json({
    status: 'generating',
    message: 'PDF generation started'
  });
}
```

### Backend Webhook Handler

```typescript
// app/api/webhook/contract-pdf-ready/route.ts
export async function PATCH(request: Request) {
  // 1. Verify webhook secret
  const secret = request.headers.get('X-Webhook-Secret');
  if (secret !== process.env.PDF_WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // 2. Parse payload
  const data = await request.json();
  
  // 3. Update contract in database
  await supabase
    .from('contracts')
    .update({
      pdf_url: data.pdf_url,
      google_drive_url: data.google_drive_url,
      pdf_generated_at: new Date().toISOString(),
      pdf_status: data.status,
    })
    .eq('id', data.contract_id);
  
  // 4. Send notification to user (optional)
  await sendNotification({
    userId: contract.created_by,
    type: 'contract_pdf_ready',
    contractId: data.contract_id,
  });
  
  return Response.json({ success: true });
}
```

---

## 🚨 Error Handling

### Possible Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Missing required field | Incomplete contract data | Validate before calling webhook |
| Image URL inaccessible | Invalid promoter document URLs | Check URLs are publicly accessible |
| Template not found | Wrong template ID | Verify template exists in Google Drive |
| Supabase upload failed | Storage bucket issue | Check bucket permissions |
| Webhook timeout | Large file/slow network | Implement retry mechanism |

### Retry Logic

```typescript
async function generateContractPDF(contractId: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await callMakeWebhook(contractId);
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await sleep(2000 * (i + 1)); // Exponential backoff
    }
  }
}
```

---

## 📊 Database Schema Updates

### Add PDF Tracking Fields

```sql
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS google_drive_url TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMPTZ;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS pdf_status TEXT CHECK (pdf_status IN ('pending', 'generating', 'generated', 'error'));
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS pdf_error_message TEXT;

-- Index for filtering
CREATE INDEX IF NOT EXISTS idx_contracts_pdf_status ON contracts(pdf_status);
```

---

## 🎯 Success Criteria

- [ ] All contract data properly mapped
- [ ] Images embedded correctly (ID card, passport)
- [ ] Bilingual content displays properly (Arabic RTL)
- [ ] Dates formatted correctly (DD-MM-YYYY)
- [ ] PDF stored in Supabase storage
- [ ] Webhook notification received
- [ ] UI shows generation status
- [ ] Download link works
- [ ] Google Drive link accessible
- [ ] Error handling implemented

---

## 📝 Next Steps

1. **Create Google Doc Template** (next file)
2. **Implement UI Components** (Generate button, status, viewer)
3. **Create API Routes** (Generation trigger, webhook handler)
4. **Add Database Fields** (PDF tracking)
5. **Test End-to-End** (Full workflow)
6. **Deploy to Production**

---

**Template Guide:** See `SHARAF_DG_TEMPLATE_GUIDE.md` (next)  
**UI Components:** See `CONTRACT_PDF_UI_COMPONENTS.md` (next)  
**API Implementation:** See API routes above

