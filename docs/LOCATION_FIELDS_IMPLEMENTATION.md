# Location Fields Implementation Guide

## Overview

This document describes the implementation of bilingual location fields (English and Arabic) for the simple contract generation feature in the Contract Management System.

## Changes Made

### 1. Make.com Flow Updates

**File:** `docs/MAKECOM_SIMPLE_CONTRACT_FLOW_WITH_LOCATIONS.json`

#### Module 1: Webhook Interface

Added location field interfaces:

```json
{
  "name": "work_location",
  "type": "text",
  "label": "Work Location (English)"
},
{
  "name": "location_en",
  "type": "text",
  "label": "Location (English)"
},
{
  "name": "location_ar",
  "type": "text",
  "label": "Location (Arabic)"
}
```

#### Module 55: Variable Storage

Added location variable storage with fallback logic:

```json
{
  "name": "stored_location_en",
  "value": "{{if(length(1.location_en) > 0; 1.location_en; 1.work_location)}}"
},
{
  "name": "stored_location_ar",
  "value": "{{if(length(1.location_ar) > 0; 1.location_ar; 1.work_location)}}"
}
```

**Fallback Logic:**

- If `location_en` is provided, use it; otherwise fall back to `work_location`
- If `location_ar` is provided, use it; otherwise fall back to `work_location`
- This ensures backward compatibility with existing contracts that only use `work_location`

#### Module 56: Google Docs Template

Added location fields to template replacement:

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
  "location_ar": "{{55.stored_location_ar}}",
  "location_en": "{{55.stored_location_en}}"
}
```

### 2. API Route Updates

**File:** `app/api/contracts/makecom/generate/route.ts`

#### Added Location Field Processing (Lines 173-175)

```typescript
// Set location fields - use bilingual fields if available, otherwise fallback to work_location
const location_en =
  contractData.location_en || contractData.work_location || '';
const location_ar =
  contractData.location_ar || contractData.work_location || '';
```

#### Added to Enriched Contract Data (Lines 304-309)

```typescript
// Add location fields to enriched data
enrichedContractData = {
  ...enrichedContractData,
  location_en,
  location_ar,
};
```

#### Enhanced Webhook Logging (Lines 590-598)

```typescript
contractDetails: {
  job_title: enhancedPayload.job_title,
  basic_salary: enhancedPayload.basic_salary,
  start_date: enhancedPayload.contract_start_date,
  end_date: enhancedPayload.contract_end_date,
  work_location: enhancedPayload.work_location,
  location_en: enhancedPayload.location_en,
  location_ar: enhancedPayload.location_ar,
}
```

### 3. Database Schema

The `contracts` table already supports location fields:

- `location_en` (TEXT) - Location in English
- `location_ar` (TEXT) - Location in Arabic
- `work_location` (TEXT) - Legacy work location field (kept for backward compatibility)

### 4. Frontend Components

**Files:**

- `components/SimpleContractGenerator.tsx`
- `components/SimpleContractGeneratorWithValidation.tsx`

These components already include the `work_location` field. To add bilingual location support:

#### Option 1: Keep Current Approach

Use `work_location` as the primary field, and the API will automatically populate both `location_en` and `location_ar` with the same value.

#### Option 2: Add Separate Fields (Recommended for Bilingual Support)

Add separate fields for English and Arabic locations:

```tsx
<div className='space-y-2'>
  <Label htmlFor='location_en'>Location (English) *</Label>
  <Input
    id='location_en'
    value={formData.location_en}
    onChange={e => handleInputChange('location_en', e.target.value)}
    placeholder='e.g., Muscat, Oman'
    disabled={generating}
  />
</div>

<div className='space-y-2'>
  <Label htmlFor='location_ar'>Location (Arabic) *</Label>
  <Input
    id='location_ar'
    value={formData.location_ar}
    onChange={e => handleInputChange('location_ar', e.target.value)}
    placeholder='مثال: مسقط، سلطنة عُمان'
    disabled={generating}
    dir='rtl'
  />
</div>
```

## Google Docs Template Setup

### Required Placeholders

In your Google Docs template, add the following placeholders:

1. **{{location_en}}** - Will be replaced with the English location
2. **{{location_ar}}** - Will be replaced with the Arabic location

### Example Template Structure

```
Contract Details
================

English Section:
- Contract Number: {{ref_number}}
- Location: {{location_en}}
- Start Date: {{contract_start_date}}
- End Date: {{contract_end_date}}

Arabic Section:
- رقم العقد: {{ref_number}}
- الموقع: {{location_ar}}
- تاريخ البدء: {{contract_start_date}}
- تاريخ الانتهاء: {{contract_end_date}}
```

## Usage

### API Request Example

When creating a contract through the API, include location fields:

```json
{
  "contractType": "employment",
  "contractData": {
    "promoter_id": "uuid-here",
    "first_party_id": "uuid-here",
    "second_party_id": "uuid-here",
    "job_title": "Software Engineer",
    "department": "IT Department",
    "work_location": "Muscat, Oman",
    "location_en": "Muscat, Oman",
    "location_ar": "مسقط، سلطنة عُمان",
    "basic_salary": 1500,
    "contract_start_date": "2024-01-01",
    "contract_end_date": "2024-12-31"
  },
  "triggerMakecom": true
}
```

### Fallback Behavior

If you only provide `work_location`:

```json
{
  "work_location": "Muscat, Oman"
  // location_en and location_ar will both be set to "Muscat, Oman"
}
```

If you provide bilingual locations:

```json
{
  "work_location": "Muscat, Oman",
  "location_en": "Muscat, Oman",
  "location_ar": "مسقط، سلطنة عُمان"
  // Each field will use its specific value
}
```

## Backward Compatibility

The implementation maintains full backward compatibility:

1. **Existing Contracts**: Contracts using only `work_location` will continue to work
2. **API Compatibility**: The API accepts both old and new field formats
3. **Template Compatibility**: Templates can use either `{{work_location}}` or the new `{{location_en}}`/`{{location_ar}}` placeholders

## Testing

### Test Cases

1. **Test with work_location only**
   - ✅ Should populate both location_en and location_ar with work_location value

2. **Test with bilingual locations**
   - ✅ Should use location_en for English template sections
   - ✅ Should use location_ar for Arabic template sections

3. **Test with mixed values**
   - ✅ Should prefer location_en/location_ar when available
   - ✅ Should fall back to work_location when bilingual fields are empty

### Make.com Testing

1. Trigger webhook with test data
2. Check variable storage in module 55:
   - `stored_location_en` should contain the English location
   - `stored_location_ar` should contain the Arabic location
3. Verify document generation uses correct locations in template

## Troubleshooting

### Issue: Location fields are empty in generated document

**Solution:**

1. Check webhook payload includes `work_location`, `location_en`, and `location_ar`
2. Verify module 55 variable storage is working
3. Check template has correct placeholders: `{{location_en}}` and `{{location_ar}}`

### Issue: Arabic location shows incorrect text

**Solution:**

1. Ensure `location_ar` is properly encoded in UTF-8
2. Check Google Docs template has RTL text direction enabled for Arabic sections
3. Verify webhook payload is not corrupting Arabic characters

### Issue: Fallback not working

**Solution:**

1. Check the fallback logic in module 55: `{{if(length(1.location_en) > 0; 1.location_en; 1.work_location)}}`
2. Ensure `work_location` is included in the webhook payload as a fallback
3. Verify the Make.com scenario is using the updated configuration

## Next Steps

1. **Update Frontend Forms**: Add separate fields for `location_en` and `location_ar` in the contract generation forms
2. **Update Templates**: Add location placeholders to all contract templates that need them
3. **Database Migration**: If needed, backfill existing contracts with location data
4. **Documentation**: Update user documentation to explain bilingual location support

## Related Files

- `docs/MAKECOM_SIMPLE_CONTRACT_FLOW_WITH_LOCATIONS.json` - Updated Make.com flow
- `app/api/contracts/makecom/generate/route.ts` - API route with location handling
- `lib/general-contract-service.ts` - Service layer with location fields
- `components/SimpleContractGenerator.tsx` - Frontend component (needs update)
- `components/SimpleContractGeneratorWithValidation.tsx` - Frontend component (needs update)

## Support

For issues or questions about location field implementation, please:

1. Check this documentation first
2. Review the Make.com scenario logs
3. Check API logs for webhook payload content
4. Contact the development team with specific error messages
