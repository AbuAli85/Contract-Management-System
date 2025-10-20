# 🔧 Make.com General Contract Blueprint - Placeholders Update

## 📋 **Missing Placeholders Added**

The original blueprint was missing the **product** and **location** placeholders that are specific to the General Contracts system. These have now been added in both Arabic and English.

---

## ✅ **New Placeholders Added**

### **1. Products (Bilingual)**

- **`product_en`** - Products/Services in English
- **`product_ar`** - Products/Services in Arabic

### **2. Location (Bilingual)**

- **`location_en`** - Location in English
- **`location_ar`** - Location in Arabic

---

## 🔄 **Updated Modules**

### **Module 55: Data Consolidation (SetVariables)**

**Added 4 new variables:**

```json
{
  "name": "stored_products_en",
  "value": "{{1.products_en}}"
},
{
  "name": "stored_products_ar",
  "value": "{{1.products_ar}}"
},
{
  "name": "stored_location_en",
  "value": "{{1.location_en}}"
},
{
  "name": "stored_location_ar",
  "value": "{{1.location_ar}}"
}
```

### **Module 56: Document Generation (Google Docs)**

**Added 4 new text replacements:**

```json
"requests": {
  // ... existing placeholders ...
  "product_ar": "{{55.stored_products_ar}}",
  "product_en": "{{55.stored_products_en}}",
  "location_ar": "{{55.stored_location_ar}}",
  "location_en": "{{55.stored_location_en}}"
}
```

### **Module 10: Status Update (HTTP)**

**Updated webhook payload to include products and location:**

```json
"data": "{
  \"contract_id\": \"{{53.contract_id}}\",
  \"contract_number\": \"{{54.contract_number}}\",
  \"pdf_url\": \"{{var.organization.SUPABASE_URL}}/storage/v1/object/public/{{var.organization.CONTRACTS_STORAGE_BUCKET}}/{{54.contract_number}}-{{55.stored_promoter_name_en}}.pdf\",
  \"google_drive_url\": \"https://docs.google.com/document/d/{{56.id}}/edit\",
  \"status\": \"generated\",
  \"images_processed\": {
    \"id_card\": false,
    \"passport\": false
  },
  \"products\": {
    \"en\": \"{{55.stored_products_en}}\",
    \"ar\": \"{{55.stored_products_ar}}\"
  },
  \"location\": {
    \"en\": \"{{55.stored_location_en}}\",
    \"ar\": \"{{55.stored_location_ar}}\"
  }
}"
```

### **Module 11: Webhook Response**

**Updated response to include products and location:**

```json
"body": "{
  \"contract_id\": \"{{53.contract_id}}\",
  \"contract_number\": \"{{54.contract_number}}\",
  \"pdf_url\": \"{{var.organization.SUPABASE_URL}}/storage/v1/object/public/{{var.organization.CONTRACTS_STORAGE_BUCKET}}/{{54.contract_number}}-{{55.stored_promoter_name_en}}.pdf\",
  \"google_drive_url\": \"https://docs.google.com/document/d/{{56.id}}/edit\",
  \"status\": \"generated\",
  \"images_processed\": {
    \"id_card\": false,
    \"passport\": false
  },
  \"products\": {
    \"en\": \"{{55.stored_products_en}}\",
    \"ar\": \"{{55.stored_products_ar}}\"
  },
  \"location\": {
    \"en\": \"{{55.stored_location_en}}\",
    \"ar\": \"{{55.stored_location_ar}}\"
  }
}"
```

---

## 🔧 **Additional Improvements Made**

### **1. Fixed Logo Assignment**

- **Before**: `kix.9n0jtkeyw9ii-t.0` was using `{{55.stored_first_party_logo_url}}`
- **After**: `kix.9n0jtkeyw9ii-t.0` now uses `{{55.stored_second_party_logo_url}}` (correct for General Contracts)

### **2. Updated Webhook URL**

- **Before**: `/api/webhook/contract-pdf-ready`
- **After**: `/api/webhook/contract-pdf-ready-general` (specific to General Contracts)

### **3. Dynamic PDF URL Construction**

- **Before**: Hardcoded URL construction
- **After**: Uses `{{var.organization.SUPABASE_URL}}` for dynamic URL building

---

## 📊 **Complete Placeholder List**

### **Text Replacements (16 total)**

1. `ref_number` - Contract number
2. `id_card_number` - Promoter ID card number
3. `first_party_crn` - First party CRN
4. `promoter_name_ar` - Promoter name (Arabic)
5. `promoter_name_en` - Promoter name (English)
6. `second_party_crn` - Second party CRN
7. `contract_end_date` - Contract end date (DD-MM-YYYY)
8. `contract_start_date` - Contract start date (DD-MM-YYYY)
9. `first_party_name_ar` - First party name (Arabic)
10. `first_party_name_en` - First party name (English)
11. `second_party_name_ar` - Second party name (Arabic)
12. `second_party_name_en` - Second party name (English)
13. **`product_ar`** - Products/Services (Arabic) ✨ **NEW**
14. **`product_en`** - Products/Services (English) ✨ **NEW**
15. **`location_ar`** - Location (Arabic) ✨ **NEW**
16. **`location_en`** - Location (English) ✨ **NEW**

### **Image Replacements (3 total)**

1. `kix.2k5omiotmkl-t.0` - Promoter ID card image
2. `kix.4io8vw4k1u1n-t.0` - Promoter passport image
3. `kix.9n0jtkeyw9ii-t.0` - Second party logo (corrected)

---

## 🎯 **Required Webhook Data**

Your application's webhook payload should now include:

```json
{
  "contract_id": "uuid",
  "contract_number": "PAC-01012025-1234",
  "promoter_id": "uuid",
  "first_party_id": "uuid",
  "second_party_id": "uuid",
  "promoter_name_en": "John Doe",
  "promoter_name_ar": "جون دو",
  "promoter_id_card_number": "1234567890",
  "promoter_id_card_url": "https://...",
  "promoter_passport_url": "https://...",
  "first_party_name_en": "Client Company",
  "first_party_name_ar": "شركة العميل",
  "second_party_name_en": "Provider Company",
  "second_party_name_ar": "شركة المزود",
  "first_party_logo": "https://...",
  "second_party_logo": "https://...",
  "contract_start_date": "2025-01-01",
  "contract_end_date": "2025-12-31",
  "products_en": "Software Development Services", ✨ **NEW**
  "products_ar": "خدمات تطوير البرمجيات", ✨ **NEW**
  "location_en": "Dubai, UAE", ✨ **NEW**
  "location_ar": "دبي، الإمارات العربية المتحدة" ✨ **NEW**
}
```

---

## ✅ **Status: Updated and Ready**

The Make.com blueprint now includes all required placeholders for the General Contracts system:

- ✅ **Products** (English & Arabic)
- ✅ **Location** (English & Arabic)
- ✅ **All existing placeholders** maintained
- ✅ **Proper logo assignment** (second party logo)
- ✅ **Correct webhook endpoints** for General Contracts
- ✅ **Dynamic URL construction** for better flexibility

**The blueprint is now complete and ready for production use with the General Contracts system!** 🎉
