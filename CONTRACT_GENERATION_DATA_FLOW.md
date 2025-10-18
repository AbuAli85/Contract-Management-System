# Contract Generation Data Flow Analysis

## 📊 Data Sources and Flow

The contract generation system uses **BOTH Supabase and Make.com** in a hybrid approach:

### 🔄 **Primary Data Flow**

```
1. User Input → 2. Supabase Database → 3. Make.com Webhook → 4. PDF Generation → 5. Storage
```

---

## 🗄️ **Data Sources**

### **1. Supabase Database (Primary Source)**
- **Promoters Table**: `promoters` - Contains promoter information
- **Parties Table**: `parties` - Contains employer/client information  
- **Contracts Table**: `contracts` - Stores contract records
- **Storage**: `contracts` bucket - Stores generated PDFs

### **2. Make.com (Processing Engine)**
- **Webhook URL**: `MAKE_WEBHOOK_URL` environment variable
- **Template Processing**: Handles document generation
- **PDF Creation**: Generates final contract documents

---

## 🔍 **Detailed Data Flow**

### **Step 1: Data Input**
```json
{
  "promoter_id": "2df30edb-2bd3-4a31-869f-2394feed0f19",
  "first_party_id": "4cc8417a-3ff2-46a6-b901-1f9c8bd8b6ce", 
  "second_party_id": "8776a032-5dad-4cd0-b0f8-c3cdd64e2831",
  "contract_type": "full-time-permanent",
  "job_title": "promoter",
  "basic_salary": 250,
  "contract_start_date": "2025-10-18",
  "contract_end_date": "2026-10-17"
}
```

### **Step 2: Supabase Data Enrichment**
The system fetches additional data from Supabase:

```typescript
// From promoters table
const promoter = await supabase
  .from('promoters')
  .select('id, name_en, name_ar, id_card_number, passport_number, id_card_url, passport_url, email, mobile_number')
  .eq('id', contractData.promoter_id)
  .single();

// From parties table  
const firstParty = await supabase
  .from('parties')
  .select('id, name_en, name_ar, email, phone, address')
  .eq('id', contractData.first_party_id)
  .single();

const secondParty = await supabase
  .from('parties')
  .select('id, name_en, name_ar, email, phone, address')
  .eq('id', contractData.second_party_id)
  .single();
```

### **Step 3: Contract Record Creation**
```typescript
const contractData = {
  contract_number: "PAC-18102025-8SAY",
  promoter_id: body.promoter_id,
  employer_id: body.second_party_id,  // second_party = employer
  client_id: body.first_party_id,     // first_party = client
  title: body.job_title,
  contract_type: "employment",
  start_date: "2025-10-18",
  end_date: "2026-10-17",
  value: 250,
  status: "draft"
};

await supabase.from('contracts').insert(contractData);
```

### **Step 4: Make.com Webhook Trigger**
```typescript
await fetch(process.env.MAKE_WEBHOOK_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contractId: contract.id,
    contractNumber,
    update_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/generate-contract`,
    // All enriched data from Supabase
    ...enrichedContractData
  })
});
```

### **Step 5: Make.com Processing**
Make.com receives the webhook and:
1. **Template Selection**: Chooses appropriate contract template
2. **Data Mapping**: Maps Supabase data to template placeholders
3. **Document Generation**: Creates PDF using Google Docs API
4. **File Storage**: Uploads PDF to Google Drive or Supabase Storage
5. **Status Update**: Calls back to update contract status

---

## 🎯 **Key Data Sources by Component**

### **Supabase Tables Used:**
- `promoters` - Promoter personal information, documents, contact details
- `parties` - Employer and client company information
- `contracts` - Contract records, status, metadata
- `contracts` storage bucket - Generated PDF files

### **Make.com Integration:**
- **Webhook Endpoint**: Receives contract data
- **Google Docs API**: Template processing and PDF generation
- **Google Drive**: Document storage and sharing
- **Email Integration**: Contract delivery

### **Environment Variables:**
- `MAKE_WEBHOOK_URL` - Make.com webhook endpoint
- `GOOGLE_SERVICE_ACCOUNT_KEY` - Google API credentials
- `GOOGLE_DOCS_TEMPLATE_ID` - Template document ID
- `GOOGLE_DRIVE_OUTPUT_FOLDER_ID` - Output folder

---

## 🔄 **Data Enrichment Process**

### **Input Data** (from user/form):
- Basic contract details
- IDs for promoter, first party, second party
- Contract terms and dates

### **Enriched Data** (from Supabase):
- Promoter: Full name, ID numbers, document URLs, contact info
- First Party: Company name, address, contact details
- Second Party: Company name, address, contact details
- Contract: Generated number, status, timestamps

### **Final Data** (sent to Make.com):
- Complete promoter information with document URLs
- Full party details for both employer and client
- All contract terms and metadata
- Template-specific placeholders and mappings

---

## 📋 **Summary**

**Data Sources:**
- ✅ **Supabase**: Primary database for all business data
- ✅ **Make.com**: Document processing and generation engine
- ✅ **Google APIs**: Template processing and file storage

**Data Flow:**
1. User submits contract data
2. System enriches data from Supabase tables
3. Contract record created in Supabase
4. Enriched data sent to Make.com webhook
5. Make.com processes and generates PDF
6. PDF stored and contract status updated

**Key Point**: The system uses Supabase as the **data source** and Make.com as the **processing engine** for document generation.
