# Phone Number Validation Implementation

## ✅ Problem Solved

**Issue**: Promoters could be added with incomplete phone numbers like "00968" (just the country code) preventing contact.

**Solution**: Comprehensive phone validation on frontend and backend with auto-formatting.

## 🎯 What Was Implemented

### 1. **Phone Validation Utility** (`lib/validation/phone-validator.ts`)

A comprehensive validation module with:

#### Features:

- ✅ Minimum 10 digits (country code + subscriber number)
- ✅ Maximum 15 digits (ITU-T E.164 standard)
- ✅ Prevents incomplete entries (just country code)
- ✅ Detects suspicious patterns (all zeros, all ones, etc.)
- ✅ Auto-formatting for common country codes
- ✅ Clear, actionable error messages

#### Functions:

```typescript
// Main validation function
validatePhoneNumber(phone, { required, minDigits, maxDigits });

// Mobile-specific validation
validateMobileNumber(mobile, required);

// Auto-format phone numbers
formatPhoneNumber(phone); // "+96891234567" → "+968 9123 4567"

// Check if existing number is incomplete
isIncompletePhoneNumber(phone);

// Get example for placeholder
getPhoneNumberExample('968'); // Returns "+968 9123 4567"
```

### 2. **Frontend Validation** (Add/Edit Promoter Forms)

#### Form Updates:

- ✅ Real-time validation with clear error messages
- ✅ Auto-formatting on blur (when user leaves field)
- ✅ Helpful placeholders with examples
- ✅ Type `tel` for better mobile keyboard
- ✅ Helper text: "Include country code (e.g., +968 9123 4567)"

#### Validation Rules:

```typescript
Phone validation:
- Optional field
- If provided: minimum 10 digits
- If provided: maximum 15 digits
- Cannot be just country code (e.g., "00968")
- Must be properly formatted

Mobile validation:
- Same rules as phone
- Stricter formatting expectations
```

### 3. **Backend Validation** (`app/api/promoters/route.ts`)

#### API Schema Updates:

```typescript
// Phone validation in Zod schema
phone: z.string()
  .optional()
  .refine(
    val => {
      if (!val || val.trim() === '') return true;
      const digitsOnly = val.replace(/\D/g, '');
      return digitsOnly.length >= 10 && digitsOnly.length <= 15;
    },
    {
      message:
        'Phone number must be complete (10-15 digits including country code). Example: +968 9123 4567',
    }
  );

// Same validation applied to mobile_number
```

#### Error Responses:

- Returns clear, actionable error messages
- Example: "Mobile number must be complete (10-15 digits including country code). Example: +968 9123 4567"

### 4. **Diagnostic SQL Script** (`scripts/check-incomplete-phone-numbers.sql`)

Identifies existing incomplete phone numbers with 8 sections:

1. **Count Summary**: How many promoters have incomplete/missing phones
2. **Incomplete List**: Promoters with ≤4 digits (just country code)
3. **Suspicious List**: Promoters with 5-9 digits (too short)
4. **Common Patterns**: Groups by incomplete pattern types
5. **No Contact Info**: Promoters missing all contact info
6. **Summary by Status**: Breakdown of issues by promoter status
7. **Export Format**: CSV-ready list for manual correction
8. **Update Template**: Safe UPDATE query examples

## 📱 Phone Number Format Examples

### Supported Formats:

#### Oman:

```
Input:  "96891234567" or "00968 9123 4567"
Output: "+968 9123 4567"
```

#### UAE:

```
Input:  "971501234567" or "00971 50 123 4567"
Output: "+971 50 123 4567"
```

#### Saudi Arabia:

```
Input:  "966501234567" or "00966 50 123 4567"
Output: "+966 50 123 4567"
```

#### US/Canada:

```
Input:  "15551234567" or "+1 (555) 123-4567"
Output: "+1 555 123 4567"
```

#### Generic:

```
Input:  Any valid international number
Output: "+XXX XXXX XXXX..." (grouped by 4)
```

## 🚫 What Gets Rejected

### Incomplete Numbers:

- ❌ "00968" (just country code)
- ❌ "968" (country code without prefix)
- ❌ "+968" (country code with +)
- ❌ "00" (just international prefix)
- ❌ Any number with < 10 total digits

### Suspicious Patterns:

- ❌ "00000" or "11111" (repeated digits)
- ❌ "0000000000" (10 zeros)
- ❌ Numbers with > 15 digits

### Invalid Characters:

- ❌ Letters: "phone123"
- ❌ Special chars: "phone#123"
- ✅ Allowed: digits, spaces, hyphens, parentheses, leading +

## 🎨 User Experience

### Before Validation:

```
Phone Number: [___________]
             (no guidance)

User types: "00968"
Form accepts it ✓ (BAD!)
Promoter saved with incomplete phone
Cannot contact promoter ❌
```

### After Validation:

```
Phone Number: [+968 9123 4567]
              Include country code (e.g., +968 9123 4567)

User types: "00968"
Error: "Phone number must have at least 10 digits..."
Cannot submit form ✓
Forced to enter complete number
```

## 🧪 Testing Guide

### Test Scenarios:

#### 1. Empty Phone (Optional):

```
Input: (empty)
Result: ✅ Valid (optional field)
```

#### 2. Complete Phone:

```
Input: "+968 9123 4567"
Result: ✅ Valid
Formatted: "+968 9123 4567"
```

#### 3. Incomplete Phone:

```
Input: "00968"
Result: ❌ Invalid
Error: "Phone number appears incomplete. Please include the full number..."
```

#### 4. Too Short:

```
Input: "968 912"
Result: ❌ Invalid
Error: "Phone number must have at least 10 digits..."
```

#### 5. Too Long:

```
Input: "+968 9123 4567 8901 2345"
Result: ❌ Invalid
Error: "Phone number is too long (maximum 15 digits)"
```

#### 6. Invalid Characters:

```
Input: "phone-968-9123"
Result: ❌ Invalid
Error: "Phone number can only contain digits, spaces, hyphens..."
```

#### 7. Auto-Formatting:

```
Input: "96891234567" (user types and leaves field)
Result: ✅ Auto-formatted to "+968 9123 4567"
```

## 📊 Validation Flow

### Frontend Flow:

```
User types phone number
    ↓
On blur (leave field)
    ↓
Auto-format if valid
    ↓
On submit
    ↓
Validate with validatePhoneNumber()
    ↓
If invalid: Show error
If valid: Submit to API
```

### Backend Flow:

```
API receives request
    ↓
Zod schema validation
    ↓
Check phone format
    ↓
If invalid: Return 400 with error message
If valid: Save to database
```

## 🗂️ Files Modified

### Created:

1. **`lib/validation/phone-validator.ts`** (NEW)
   - Phone validation utility functions
   - Auto-formatting logic
   - 236 lines of comprehensive validation

2. **`scripts/check-incomplete-phone-numbers.sql`** (NEW)
   - Diagnostic queries for existing data
   - 8 sections covering all scenarios
   - Update templates for corrections

### Modified:

3. **`components/promoter-form-professional.tsx`**
   - Import phone validator
   - Update validation logic (lines 365-378)
   - Add auto-formatting on blur
   - Better placeholders and helper text
   - Type="tel" for better mobile UX

4. **`app/api/promoters/route.ts`**
   - Add phone/mobile validation to Zod schema
   - Minimum 10 digits, maximum 15 digits
   - Clear error messages

## 📈 Impact

### Data Quality:

- ✅ No more incomplete phone numbers (e.g., "00968")
- ✅ Consistent formatting across all entries
- ✅ Valid international format
- ✅ Can actually contact promoters

### User Experience:

- ✅ Clear validation feedback
- ✅ Helpful examples in placeholders
- ✅ Auto-formatting reduces errors
- ✅ Specific error messages guide users

### System Benefits:

- ✅ Frontend + backend validation (defense in depth)
- ✅ Reusable validation utility
- ✅ Can identify existing bad data
- ✅ Easy to add new country formats

## 🔍 Finding Existing Issues

Run the diagnostic script to find incomplete numbers:

```sql
-- In Supabase SQL Editor
-- Run: scripts/check-incomplete-phone-numbers.sql

-- Quick check:
SELECT COUNT(*)
FROM promoters
WHERE LENGTH(REGEXP_REPLACE(COALESCE(phone, ''), '[^0-9]', '', 'g')) <= 4
   OR LENGTH(REGEXP_REPLACE(COALESCE(mobile_number, ''), '[^0-9]', '', 'g')) <= 4;
```

## 🛠️ Fixing Existing Data

### Process:

1. **Identify**: Run diagnostic script (Section 2)
2. **Export**: Get list of affected promoters
3. **Collect**: Contact promoters for correct numbers
4. **Validate**: Verify numbers before updating
5. **Update**: Use UPDATE template from script
6. **Verify**: Confirm updates worked

### Update Template:

```sql
-- Single update (safe)
UPDATE promoters
SET
  phone = '+968 9123 4567',
  mobile_number = '+968 9876 5432',
  updated_at = NOW()
WHERE id = 'promoter-uuid-here'
RETURNING id, name_en, phone, mobile_number;
```

## 🎯 Validation Rules Summary

| Criterion          | Rule      | Example                              |
| ------------------ | --------- | ------------------------------------ |
| **Minimum Length** | 10 digits | +968 9123 4567 (12 chars, 10 digits) |
| **Maximum Length** | 15 digits | Per ITU-T E.164 standard             |
| **Country Code**   | Required  | +968, +971, +966, +1, etc.           |
| **Format**         | Flexible  | +968 9123 4567 or 96891234567        |
| **Characters**     | Limited   | Digits, space, hyphen, (), +         |
| **Empty**          | Optional  | Phone fields are optional            |
| **Incomplete**     | Rejected  | "00968" or "968" alone = invalid     |

## 🚀 Future Enhancements

Possible improvements:

1. **Country Code Dropdown**: Pre-select common countries
2. **Real-time Formatting**: Format as user types (not just on blur)
3. **Carrier Validation**: Check if number format matches carrier
4. **Duplicate Detection**: Warn if number already exists
5. **Phone Verification**: Send SMS code to verify number
6. **International Library**: Use libphonenumber for advanced validation

## ✅ Status

**Implementation**: ✅ Complete
**Testing**: ✅ No linter errors
**Documentation**: ✅ Complete
**Diagnostic Tools**: ✅ Available
**Deployment**: 🚀 Ready for production

---

**Preventing incomplete phone numbers since 2025** 📱✨
