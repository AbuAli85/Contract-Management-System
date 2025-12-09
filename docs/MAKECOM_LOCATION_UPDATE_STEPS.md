# Make.com Scenario Update - Location Fields

## Quick Reference Guide

This guide provides step-by-step instructions to update your Make.com scenario to support bilingual location fields (English and Arabic).

## Summary of Changes

You need to update **2 modules** in your Make.com scenario:

1. **Module 55** (SetVariables) - Add location variables
2. **Module 56** (createADocumentFromTemplate) - Add location to template replacements

---

## Module 55: SetVariables - Add Location Storage

### Current Configuration

Module 55 currently stores 24 variables.

### Required Changes

Add these **2 new variables** to the `variables` array:

```json
{
  "name": "stored_location_en",
  "value": "{{ifempty(1.location_en; 1.work_location)}}"
},
{
  "name": "stored_location_ar",
  "value": "{{ifempty(1.location_ar; 1.work_location)}}"
}
```

### Where to Add

Insert these variables **after** `stored_work_location` in the variables array.

### Complete Variables List (26 variables total)

```json
"variables": [
  {
    "name": "stored_contract_type",
    "value": "{{1.contract_type}}"
  },
  {
    "name": "stored_promoter_id",
    "value": "{{1.promoter_id}}"
  },
  {
    "name": "stored_first_party_id",
    "value": "{{1.first_party_id}}"
  },
  {
    "name": "stored_second_party_id",
    "value": "{{1.second_party_id}}"
  },
  {
    "name": "stored_job_title",
    "value": "{{1.job_title}}"
  },
  {
    "name": "stored_department",
    "value": "{{1.department}}"
  },
  {
    "name": "stored_work_location",
    "value": "{{1.work_location}}"
  },
  // 👇 ADD THESE TWO NEW VARIABLES HERE 👇
  {
    "name": "stored_location_en",
    "value": "{{ifempty(1.location_en; 1.work_location)}}"
  },
  {
    "name": "stored_location_ar",
    "value": "{{ifempty(1.location_ar; 1.work_location)}}"
  },
  // 👆 END OF NEW VARIABLES 👆
  {
    "name": "stored_basic_salary",
    "value": "{{1.basic_salary}}"
  },
  // ... rest of variables remain the same ...
]
```

### Explanation of Fallback Logic

```
{{ifempty(1.location_en; 1.work_location)}}
```

This formula means:

- **If** `location_en` is empty or doesn't exist
  - **Then** use `work_location` as fallback
  - **Else** use `location_en`

The `ifempty()` function is Make.com's built-in function that checks if a value is empty and provides a fallback. This ensures backward compatibility with contracts that only have `work_location`.

---

## Module 56: Google Docs Template - Add Location Replacements

### Current Configuration

Module 56 currently has these request replacements in the `requests` collection:

- ref_number
- first_party_name_ar
- first_party_crn
- second_party_name_ar
- second_party_crn
- promoter_name_ar
- id_card_number
- contract_start_date
- contract_end_date
- first_party_name_en
- second_party_name_en
- promoter_name_en

### Required Changes

Add these **2 new fields** to the `requests` collection:

```json
"location_ar": "{{55.stored_location_ar}}",
"location_en": "{{55.stored_location_en}}"
```

### Complete Requests Configuration

```json
"requests": {
  "ref_number": "{{1.contract_number}}",
  "first_party_name_ar": "{{1.first_party_name_ar}}",
  "first_party_crn": "{{1.first_party_crn}}",
  "second_party_name_ar": "{{1.second_party_name_ar}}",
  "second_party_crn": "{{1.second_party_crn}}",
  "promoter_name_ar": "{{1.promoter_name_ar}}",
  "id_card_number": "{{1.promoter_id_card_number}}",
  "contract_start_date": "{{formatDate(1.contract_start_date; \"DD-MM-YYYY\")}}",
  "contract_end_date": "{{formatDate(1.contract_end_date; \"DD-MM-YYYY\")}}",
  "first_party_name_en": "{{1.first_party_name_en}}",
  "second_party_name_en": "{{1.second_party_name_en}}",
  "promoter_name_en": "{{1.promoter_name_en}}",
  // 👇 ADD THESE TWO NEW FIELDS HERE 👇
  "location_ar": "{{55.stored_location_ar}}",
  "location_en": "{{55.stored_location_en}}"
  // 👆 END OF NEW FIELDS 👆
}
```

---

## Google Docs Template Changes

### Add Location Placeholders

In your Google Docs template (ID: `1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0`), add these placeholders where you want locations to appear:

#### English Section

```
Work Location: {{location_en}}
```

#### Arabic Section

```
موقع العمل: {{location_ar}}
```

### Example Template Layout

```
╔══════════════════════════════════════════╗
║         EMPLOYMENT CONTRACT              ║
╚══════════════════════════════════════════╝

Contract Number: {{ref_number}}

FIRST PARTY (Employer)
Company Name: {{first_party_name_en}}
Commercial Registration: {{first_party_crn}}

SECOND PARTY (Employee)
Employee Name: {{promoter_name_en}}
ID Card Number: {{id_card_number}}

CONTRACT DETAILS
Job Title: (from your existing fields)
Department: (from your existing fields)
Work Location: {{location_en}}  // 👈 ADD THIS
Start Date: {{contract_start_date}}
End Date: {{contract_end_date}}

---

╔══════════════════════════════════════════╗
║            عقد عمل                       ║
╚══════════════════════════════════════════╝

رقم العقد: {{ref_number}}

الطرف الأول (صاحب العمل)
اسم الشركة: {{first_party_name_ar}}
السجل التجاري: {{first_party_crn}}

الطرف الثاني (الموظف)
اسم الموظف: {{promoter_name_ar}}
رقم بطاقة الهوية: {{id_card_number}}

تفاصيل العقد
المسمى الوظيفي: (from your existing fields)
القسم: (from your existing fields)
موقع العمل: {{location_ar}}  // 👈 ADD THIS
تاريخ البدء: {{contract_start_date}}
تاريخ الانتهاء: {{contract_end_date}}
```

---

## Testing Checklist

After making the changes, test with these scenarios:

### Test 1: With Bilingual Locations

```json
{
  "work_location": "Muscat, Oman",
  "location_en": "Muscat, Oman",
  "location_ar": "مسقط، سلطنة عُمان"
}
```

**Expected Result:**

- ✅ English section shows: "Muscat, Oman"
- ✅ Arabic section shows: "مسقط، سلطنة عُمان"

### Test 2: With work_location Only (Backward Compatibility)

```json
{
  "work_location": "Muscat, Oman"
}
```

**Expected Result:**

- ✅ Both English and Arabic sections show: "Muscat, Oman"

### Test 3: With location_en Only

```json
{
  "location_en": "Muscat, Oman",
  "work_location": "Old Location"
}
```

**Expected Result:**

- ✅ English section shows: "Muscat, Oman"
- ✅ Arabic section shows: "Old Location" (fallback)

---

## Verification Steps

1. **Open Make.com Scenario**: Navigate to "Contract Generation - extra"

2. **Edit Module 55**:
   - Click on module 55 (Set multiple variables)
   - Scroll to the "Variables" section
   - Add the 2 new location variables
   - Save the module

3. **Edit Module 56**:
   - Click on module 56 (Create a document from template)
   - Scroll to the "Values" section
   - Add the 2 new location fields
   - Save the module

4. **Update Google Docs Template**:
   - Open the template document
   - Add `{{location_en}}` and `{{location_ar}}` placeholders
   - Save the document

5. **Test the Scenario**:
   - Run a test with sample data
   - Check the generated PDF
   - Verify locations appear correctly in both English and Arabic sections

---

## Troubleshooting

### Problem: Location fields are empty in generated document

**Check:**

1. ✅ Module 55 has the new variables with correct formulas
2. ✅ Module 56 has the new request fields pointing to `{{55.stored_location_en}}` and `{{55.stored_location_ar}}`
3. ✅ Template has `{{location_en}}` and `{{location_ar}}` placeholders
4. ✅ Webhook payload includes location fields

### Problem: Arabic text shows as ???

**Solution:**

1. Ensure UTF-8 encoding in webhook payload
2. Check Google Docs template has RTL text direction for Arabic sections
3. Verify Arabic text is properly saved in the template

### Problem: Fallback not working

**Check:**

1. Module 55 formula syntax: `{{ifempty(1.location_en; 1.work_location)}}`
2. Webhook payload includes `work_location` field
3. Variables are saved correctly in module 55

---

## Quick Copy-Paste Snippets

### For Module 55 (Add to Variables Array)

```json
{
  "name": "stored_location_en",
  "value": "{{ifempty(1.location_en; 1.work_location)}}"
},
{
  "name": "stored_location_ar",
  "value": "{{ifempty(1.location_ar; 1.work_location)}}"
}
```

### For Module 56 (Add to Requests)

```json
"location_ar": "{{55.stored_location_ar}}",
"location_en": "{{55.stored_location_en}}"
```

### For Google Docs Template

```
English: {{location_en}}
Arabic: {{location_ar}}
```

---

## Support

If you encounter issues:

1. Check Make.com scenario execution history for errors
2. Review webhook payload to ensure location fields are included
3. Verify template placeholders match exactly (case-sensitive)
4. Refer to `docs/LOCATION_FIELDS_IMPLEMENTATION.md` for detailed documentation

## Related Documents

- `docs/MAKECOM_SIMPLE_CONTRACT_FLOW_WITH_LOCATIONS.json` - Complete updated flow
- `docs/LOCATION_FIELDS_IMPLEMENTATION.md` - Detailed implementation guide
- `app/api/contracts/makecom/generate/route.ts` - API route handling locations
