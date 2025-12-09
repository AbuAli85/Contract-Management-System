# Form Validation Implementation Guide

This document describes the comprehensive form validation implemented across the Smart Pro Contracts Portal.

## Overview

All major forms in the application now have:

- ✅ Real-time inline validation using **react-hook-form** with **zod** schemas
- ✅ Visual feedback (red borders for errors, green for valid fields)
- ✅ Error messages displayed below fields
- ✅ Checkmark icons on valid fields
- ✅ Submit buttons disabled until form is valid
- ✅ All inputs disabled during form submission
- ✅ Loading states with spinners
- ✅ Toast notifications for success/error

## Implemented Forms

### 1. Contract Generation Form ✅

**Location**: `components/SimpleContractGeneratorWithValidation.tsx`
**Schema**: `lib/schemas/contract-form-schema.ts`
**Page**: `app/[locale]/generate-contract/page.tsx`

**Validation Rules**:

- **Promoter**: Required, must select from list
- **First Party (Client)**: Required
- **Second Party (Employer)**: Required
- **Contract Type**: Required
- **Job Title**: Required, 2-100 characters
- **Department**: Required, 2-100 characters
- **Work Location**: Required, 2-200 characters
- **Basic Salary**: Required, must be positive, max 1,000,000
- **Start Date**: Required
- **End Date**: Required, must be after start date
- **Probation Period**: Required
- **Notice Period**: Required
- **Working Hours**: Required
- **Housing Allowance**: Optional, must be non-negative
- **Transport Allowance**: Optional, must be non-negative
- **Special Terms**: Optional

**Features**:

- Real-time validation as user types
- Visual border feedback (red/green)
- Error icons and messages
- Submit disabled until valid
- All inputs disabled during generation
- "Generating contract..." status message
- Auto-save functionality maintained

### 2. Profile Form ✅

**Location**: `app/[locale]/profile/page.tsx`
**Schema**: `lib/schemas/profile-form-schema.ts`

**Validation Rules**:

- **Full Name**: Required, 2-100 characters
- **Email**: Read-only, valid email format
- **Phone**: Optional, international phone format validation
- **Department**: Optional, 2-100 characters
- **Position**: Optional, 2-100 characters
- **Avatar URL**: Optional, valid URL format
- **Language**: Required, enum (en/ar)
- **Timezone**: Required
- **Email Notifications**: Boolean
- **SMS Notifications**: Boolean

**Password Change Validation**:

- **Current Password**: Required
- **New Password**: Required, min 8 characters, must contain uppercase, lowercase, and number
- **Confirm Password**: Required, must match new password

**Features**:

- Real-time validation
- Password strength requirements clearly displayed
- Visual feedback on all fields
- Submit disabled until valid
- All inputs disabled during save

### 3. Party Management Form ✅

**Location**: `components/party-form.tsx`
**Schema**: `lib/party-schema.ts`

**Validation Rules**:

- **Name (English)**: Required, 2-255 characters
- **Name (Arabic)**: Optional, 2-255 characters
- **CRN**: Optional, 5-50 characters
- **Type**: Required, enum (Employer/Client)
- **Role**: Optional, max 100 characters
- **Status**: Required, enum (Active/Inactive/Suspended)
- **CR Expiry Date**: Optional, must be in future if CRN provided
- **Tax Number**: Optional, max 50 characters
- **License Number**: Optional, max 50 characters
- **License Expiry Date**: Optional, must be in future if license number provided
- **Contact Person**: Optional, 2-100 characters
- **Contact Phone**: Optional, valid phone format
- **Contact Email**: Optional, valid email format
- **Address**: Optional, max 500 characters
- **Notes**: Optional, max 2000 characters

**Cross-field Validation**:

- If CRN is provided, CR expiry date must be in the future
- If license number is provided, license expiry date must be in the future

**Features**:

- Comprehensive validation with react-hook-form
- Visual feedback (red/green borders)
- Submit button disabled until valid
- All inputs disabled during submission
- Loading state with spinner

### 4. Promoter Form ✅

**Location**: `components/promoter-form-comprehensive.tsx`, `components/promoter-form.tsx`, `components/promoter-profile-form.tsx`
**Schema**: `lib/schemas/promoter-form-schema.ts`

**Validation Rules** (Comprehensive):

- **Basic Information**:
  - name_en: Optional, 2-255 chars
  - name_ar: Optional, 2-255 chars
  - first_name: Required, min 1 char, max 100
  - last_name: Required, min 1 char, max 100

- **Contact Information**:
  - email: Optional, valid email format
  - phone: Optional, max 20 chars
  - mobile_number: Optional, max 20 chars
  - address, city, state, country, postal_code: All optional with max limits

- **Identity Documents**:
  - id_card_number: Required, min 5, max 50 chars
  - id_card_expiry_date: Required, must be in future
  - passport_number: Optional, max 50 chars
  - passport_expiry_date: Optional (required if passport number provided), must be in future
  - visa_number, visa_expiry_date: Optional with future date validation
  - work_permit_number, work_permit_expiry_date: Optional with future date validation

- **Personal Information**:
  - nationality: Optional, max 100 chars
  - date_of_birth: Optional, must be in past
  - gender: Optional, enum (male/female/other/prefer_not_to_say)
  - marital_status: Optional, enum (single/married/divorced/widowed)

- **Employment Information**:
  - job_title: Optional, max 200 chars
  - company: Optional, max 255 chars
  - department: Optional, max 200 chars
  - specialization: Optional, max 255 chars
  - experience_years: Optional, 0-70
  - employer_id: Optional, valid UUID

- **Education**:
  - education_level: Optional, enum
  - university: Optional, max 255 chars
  - graduation_year: Optional, 1950 to current year + 10
  - skills, certifications: Optional, max 1000 chars

- **Banking Information**:
  - bank_name: Optional, max 200 chars
  - account_number: Optional, max 50 chars
  - iban: Optional, max 50 chars, valid IBAN format
  - swift_code: Optional, max 20 chars
  - tax_id: Optional, max 50 chars

- **Status & Availability**:
  - status: Enum (active/inactive/pending/suspended/on_leave), default 'pending'
  - overall_status: Enum (excellent/good/fair/warning/critical), default 'good'
  - rating: Optional, 0-5
  - availability: Enum (available/busy/unavailable/part_time), default 'available'

- **Preferences**:
  - preferred_language: Enum (en/ar/both), default 'en'
  - timezone: Optional, max 100 chars

- **Additional**:
  - special_requirements: Optional, max 1000 chars
  - notes: Optional, max 2000 chars
  - notify_days_before_id_expiry: Default 100, 1-365
  - notify_days_before_passport_expiry: Default 210, 1-365

**Cross-field Validations**:

- If passport number provided, passport expiry date required
- If work permit number provided, work permit expiry date required
- If visa number provided, visa expiry date required
- Passport expiry must be in future if provided
- Date of birth cannot be in future
- IBAN format validation

**Features**:

- Multi-step form with sections (Basic, Contact, Documents, Personal, Emergency, Employment, Education, Banking, Status, Additional)
- Progressive disclosure pattern
- Comprehensive validation with react-hook-form
- Visual feedback throughout
- Submit disabled when invalid

## Reusable Validation Components

### FormFieldWithValidation

**Location**: `components/ui/form-field-with-validation.tsx`

Provides a standard Input field with:

- Required field indicator (\*)
- Red border on error
- Green border on valid
- Error icon (AlertCircle) on invalid
- Checkmark icon (CheckCircle2) on valid
- Error message below field
- Disabled state support
- Accessibility (aria-invalid, aria-describedby)

### SelectFieldWithValidation

**Location**: `components/ui/select-field-with-validation.tsx`

Provides a Select dropdown with:

- Required field indicator (\*)
- Visual validation feedback
- Error/success icons
- Error messages
- Disabled state support
- Accessibility features

## Usage Pattern

```typescript
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { myFormSchema, type MyFormData } from '@/lib/schemas/my-form-schema';

function MyForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MyFormData>({
    resolver: zodResolver(myFormSchema),
    mode: 'onChange', // Real-time validation
    defaultValues: { /* ... */ },
  });

  const onSubmit = async (data: MyFormData) => {
    setIsSubmitting(true);
    try {
      await submitData(data);
      toast({ title: 'Success', description: 'Data saved successfully' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Controller
        name="fieldName"
        control={form.control}
        render={({ field }) => (
          <FormFieldWithValidation
            label="Field Label"
            name="fieldName"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={form.formState.errors.fieldName}
            disabled={isSubmitting}
            required
            isValid={!!form.formState.dirtyFields.fieldName && !form.formState.errors.fieldName}
          />
        )}
      />

      <Button
        type="submit"
        disabled={isSubmitting || !form.formState.isValid}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          'Save'
        )}
      </Button>
    </form>
  );
}
```

## Common Validation Rules

### Email Validation

```typescript
z.string().email('Please enter a valid email address');
```

### Phone Validation

```typescript
const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
z.string().regex(phoneRegex, 'Please enter a valid phone number');
```

### Required Field with Length

```typescript
z.string()
  .min(2, 'Must be at least 2 characters')
  .max(100, 'Must be less than 100 characters');
```

### Optional Field with Length

```typescript
z.string()
  .max(100, 'Must be less than 100 characters')
  .optional()
  .or(z.literal(''));
```

### Date in Future

```typescript
z.date().refine(date => date > new Date(), {
  message: 'Date must be in the future',
});
```

### Date in Past

```typescript
z.date().refine(date => date < new Date(), {
  message: 'Date cannot be in the future',
});
```

### Positive Number with Max

```typescript
z.number()
  .positive('Must be greater than 0')
  .max(1000000, 'Please enter a valid amount');
```

### Cross-field Validation (Date Range)

```typescript
.refine((data) => {
  if (data.start_date && data.end_date) {
    return new Date(data.end_date) > new Date(data.start_date);
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['end_date'],
})
```

## Accessibility Features

All validated forms include:

- `aria-invalid` attribute on error state
- `aria-describedby` linking to error messages
- `aria-label` for screen readers
- Proper label associations
- Keyboard navigation support
- Focus management
- Screen reader friendly error announcements

## Testing Checklist

- [ ] Form shows validation errors on invalid input
- [ ] Form shows success indicators on valid input
- [ ] Submit button is disabled when form is invalid
- [ ] Submit button is disabled during submission
- [ ] All inputs are disabled during submission
- [ ] Loading spinner appears on submit button
- [ ] Toast notification shows on success
- [ ] Toast notification shows on error
- [ ] Error messages are clear and helpful
- [ ] Form works with keyboard navigation
- [ ] Form works with screen readers
- [ ] Auto-save functionality works (where applicable)

## Future Enhancements

Consider adding:

1. Field-level async validation (e.g., check if email already exists)
2. Debounced validation for expensive checks
3. Form progress indicators
4. Field dependencies (show/hide based on other fields)
5. Custom validation messages based on user locale
6. Validation summary at top of form
7. Auto-focus first invalid field on submit
8. Unsaved changes warning before navigation

## Maintenance Notes

- All schemas are centralized in `lib/schemas/` directory
- Reusable validation components are in `components/ui/`
- Follow the established pattern when adding new forms
- Keep validation rules consistent across similar fields
- Update this document when adding new validated forms
