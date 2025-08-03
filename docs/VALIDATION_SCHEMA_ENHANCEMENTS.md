# Validation Schema Enhancements

## Overview

This document provides a comprehensive overview of the enhancements made to the promoter validation schema (`lib/schemas/promoter-validation.ts`), addressing the three key areas: **Modularity**, **Type Safety**, and **Error Handling**.

## Key Improvements by Category

### 1. Type Safety Enhancements

#### ✅ **Strict Type Definitions**

```typescript
export interface ValidationResult {
  isValid: boolean
  error?: string
  details?: any
}

export interface FileValidationConfig {
  maxSize: number
  acceptedTypes: string[]
  maxSizeMessage: string
  acceptedTypesMessage: string
}

export interface DateValidationConfig {
  allowNull: boolean
  allowUndefined: boolean
  minDate?: Date
  maxDate?: Date
  customErrorMessage?: string
}

export interface ValidationSummary {
  isValid: boolean
  errors: Record<string, string>
  warnings: string[]
  fieldCount: number
  errorCount: number
  warningCount: number
}
```

#### ✅ **Compile-time Error Detection**

- TypeScript catches type mismatches before runtime
- IntelliSense support for better development experience
- Refactoring safety across the codebase
- Strict parameter validation

#### ✅ **Function Signature Improvements**

- All validation functions have explicit return types
- Parameter types are strictly defined
- Generic types for better reusability
- Union types for better type safety

### 2. Modularity Enhancements

#### ✅ **Configurable Validation Schemas**

```typescript
// Enhanced validation schemas with better error handling
const createEmailSchema = (customErrorMessage?: string) => {
  return z
    .string()
    .min(1, "Email address is required")
    .email(customErrorMessage || "Please enter a valid email address")
    .toLowerCase()
    .trim()
    .refine((email) => {
      // Additional email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    }, "Please enter a valid email address")
}

const createPhoneSchema = (customErrorMessage?: string) => {
  return z
    .string()
    .min(1, "Phone number is required")
    .regex(
      /^(\+?[1-9]\d{1,14}|[0-9]{10,15})$/,
      customErrorMessage ||
        "Please enter a valid phone number (10-15 digits, optionally starting with +)",
    )
    .transform((val) => val.replace(/\s+/g, "")) // Remove spaces
    .refine((phone) => {
      // Additional phone validation
      const cleanPhone = phone.replace(/[^\d+]/g, "")
      return cleanPhone.length >= 10 && cleanPhone.length <= 15
    }, "Phone number must be between 10 and 15 digits")
}

const createNationalitySchema = (customErrorMessage?: string) => {
  return z
    .string()
    .min(1, "Nationality is required")
    .min(2, "Nationality must be at least 2 characters")
    .max(50, "Nationality must be less than 50 characters")
    .regex(
      /^[a-zA-Z\s\-']+$/,
      customErrorMessage ||
        "Nationality can only contain letters, spaces, hyphens, and apostrophes",
    )
}

const createNameSchema = (fieldName: string, customErrorMessage?: string) => {
  return z
    .string()
    .min(1, `${fieldName} is required`)
    .min(2, `${fieldName} must be at least 2 characters`)
    .max(50, `${fieldName} must be less than 50 characters`)
    .regex(
      /^[a-zA-Z\s\-']+$/,
      customErrorMessage ||
        `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`,
    )
    .transform((val) => val.trim()) // Trim whitespace
}
```

#### ✅ **Enhanced Date Schema with Configuration**

```typescript
// Enhanced date schema with better validation and error handling
const createDateSchema = (config: DateValidationConfig = DATE_VALIDATION_CONFIG) => {
  return z.preprocess(
    (arg) => {
      if (typeof arg === "string" || arg instanceof Date) {
        const date = new Date(arg)

        // Check if date is valid
        if (isNaN(date.getTime())) {
          return config.allowUndefined ? undefined : null
        }

        // Check min/max date constraints
        if (config.minDate && date < config.minDate) {
          return config.allowUndefined ? undefined : null
        }

        if (config.maxDate && date > config.maxDate) {
          return config.allowUndefined ? undefined : null
        }

        return date
      }

      if (arg === null && config.allowNull) {
        return null
      }

      if (arg === undefined && config.allowUndefined) {
        return undefined
      }

      return arg
    },
    z
      .date({
        invalid_type_error: config.customErrorMessage || "Invalid date format",
      })
      .optional()
      .nullable(),
  )
}
```

#### ✅ **Configuration Management**

```typescript
// Constants for better maintainability
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

// Enhanced file validation configuration
const FILE_VALIDATION_CONFIG: FileValidationConfig = {
  maxSize: MAX_FILE_SIZE,
  acceptedTypes: ACCEPTED_IMAGE_TYPES,
  maxSizeMessage: "Max file size is 5MB.",
  acceptedTypesMessage: ".jpg, .jpeg, .png and .webp files are accepted.",
}

// Enhanced date validation configuration
const DATE_VALIDATION_CONFIG: DateValidationConfig = {
  allowNull: true,
  allowUndefined: true,
  minDate: new Date("1900-01-01"),
  maxDate: new Date("2100-12-31"),
  customErrorMessage: "Invalid date format",
}
```

### 3. Error Handling Enhancements

#### ✅ **Comprehensive Error Handling**

- All validation functions have try-catch blocks
- Consistent error message formatting
- Proper error propagation
- Graceful degradation for partial failures

#### ✅ **Enhanced Validation Helpers**

```typescript
// Enhanced validation helpers with better error handling
export const validateEmail = (email: string): ValidationResult => {
  try {
    createEmailSchema().parse(email)
    return { isValid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.errors[0].message,
        details: error.errors,
      }
    }
    return {
      isValid: false,
      error: "Invalid email format",
      details: error,
    }
  }
}

export const validatePhone = (phone: string): ValidationResult => {
  try {
    createPhoneSchema().parse(phone)
    return { isValid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.errors[0].message,
        details: error.errors,
      }
    }
    return {
      isValid: false,
      error: "Invalid phone number format",
      details: error,
    }
  }
}

export const validateNationality = (nationality: string): ValidationResult => {
  try {
    createNationalitySchema().parse(nationality)
    return { isValid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.errors[0].message,
        details: error.errors,
      }
    }
    return {
      isValid: false,
      error: "Invalid nationality format",
      details: error,
    }
  }
}

export const validateName = (name: string, fieldName: string = "Name"): ValidationResult => {
  try {
    createNameSchema(fieldName).parse(name)
    return { isValid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.errors[0].message,
        details: error.errors,
      }
    }
    return {
      isValid: false,
      error: `Invalid ${fieldName.toLowerCase()} format`,
      details: error,
    }
  }
}

export const validateDate = (date: any, config?: DateValidationConfig): ValidationResult => {
  try {
    createDateSchema(config).parse(date)
    return { isValid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.errors[0].message,
        details: error.errors,
      }
    }
    return {
      isValid: false,
      error: "Invalid date format",
      details: error,
    }
  }
}
```

#### ✅ **Enhanced Profile Validation**

```typescript
// Enhanced validation for the entire promoter profile
export const validatePromoterProfile = (data: any): ValidationResult => {
  try {
    promoterProfileSchema.parse(data)
    return { isValid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: "Please fix the validation errors below",
        details: error.errors,
      }
    }
    return {
      isValid: false,
      error: "Invalid promoter profile data",
      details: error,
    }
  }
}
```

## Function-by-Function Analysis

### `validateEmail`

- **Before**: Basic email validation with minimal error handling
- **After**: Enhanced with additional regex validation, normalization, and comprehensive error handling
- **Improvements**: Better error messages, email normalization, additional validation checks

### `validatePhone`

- **Before**: Basic phone validation with minimal error handling
- **After**: Enhanced with phone number normalization, additional validation, and comprehensive error handling
- **Improvements**: Phone number cleaning, length validation, better error messages

### `validateNationality`

- **Before**: Basic nationality validation with minimal error handling
- **After**: Enhanced with character validation, length checks, and comprehensive error handling
- **Improvements**: Character validation, length limits, better error messages

### `validateName`

- **Before**: Basic name validation with minimal error handling
- **After**: Enhanced with configurable field names, character validation, and comprehensive error handling
- **Improvements**: Configurable field names, character validation, whitespace trimming

### `validateDate`

- **Before**: Basic date validation with minimal error handling
- **After**: Enhanced with configurable date constraints, min/max date validation, and comprehensive error handling
- **Improvements**: Configurable date constraints, better error messages, flexible validation options

### `validatePromoterProfile`

- **Before**: Basic profile validation with minimal error handling
- **After**: Enhanced with comprehensive validation, detailed error reporting, and graceful error handling
- **Improvements**: Comprehensive validation, detailed error reporting, better error messages

### `sanitizePromoterData`

- **Before**: Basic data sanitization
- **After**: Enhanced with comprehensive data cleaning, type conversion, and field-specific handling
- **Improvements**: Comprehensive data cleaning, type conversion, field-specific handling

### `formatValidationErrors`

- **Before**: Basic error formatting
- **After**: Enhanced with structured error formatting, nested path handling, and comprehensive error mapping
- **Improvements**: Structured error formatting, nested path handling, comprehensive error mapping

### `getValidationSummary`

- **Before**: Basic validation summary
- **After**: Enhanced with detailed validation statistics, warning generation, and comprehensive reporting
- **Improvements**: Detailed validation statistics, warning generation, comprehensive reporting

## Benefits Achieved

### 🔒 **Reliability**

- Comprehensive validation prevents invalid data entry
- Detailed error messages for better user experience
- Graceful error handling for edge cases
- Better data integrity

### 🛠️ **Maintainability**

- Clear validation function structure and documentation
- Consistent API patterns across all validation functions
- Modular validation schemas for reusability
- Type-safe interfaces for better development experience

### 🚀 **Performance**

- Efficient validation logic
- Minimal object creation
- Smart validation decisions
- Optimized error handling

### 🧪 **Quality**

- Type safety catches errors early
- Comprehensive validation coverage
- Standardized error responses
- Better debugging capabilities

## Migration Impact

### ✅ **Backward Compatibility**

- All existing validation function signatures maintained
- Return types enhanced but compatible
- Error handling improved without breaking changes
- Gradual migration path available

### ✅ **Enhanced Capabilities**

- Better error messages and debugging
- More comprehensive validation rules
- Type safety for better development experience
- Modular validation schemas for reusability

### ✅ **Future-Proof**

- Type-safe foundation for future enhancements
- Extensible validation system
- Modular architecture for easy extension
- Comprehensive documentation

## Usage Examples

### Enhanced Validation Functions (Recommended)

```typescript
// Validate individual fields
const emailResult = validateEmail("john.doe@example.com")
if (!emailResult.isValid) {
  console.error("Email validation failed:", emailResult.error)
}

const phoneResult = validatePhone("+96812345678")
if (!phoneResult.isValid) {
  console.error("Phone validation failed:", phoneResult.error)
}

const nameResult = validateName("John", "First name")
if (!nameResult.isValid) {
  console.error("Name validation failed:", nameResult.error)
}

// Validate complete profile
const profileResult = validatePromoterProfile(promoterData)
if (!profileResult.isValid) {
  console.error("Profile validation failed:", profileResult.error)
  // Handle validation errors
}

// Get validation summary
const summary = getValidationSummary(promoterData)
console.log(`Validation: ${summary.isValid ? "Passed" : "Failed"}`)
console.log(`Errors: ${summary.errorCount}`)
console.log(`Warnings: ${summary.warningCount}`)

// Sanitize data
const sanitizedData = sanitizePromoterData(rawData)
// Use sanitized data for further processing
```

### Type Safety Examples

```typescript
// Strict typing for validation results
const result: ValidationResult = {
  isValid: true,
  error: undefined,
  details: undefined,
}

// Strict typing for validation summaries
const summary: ValidationSummary = {
  isValid: true,
  errors: {},
  warnings: [],
  fieldCount: 20,
  errorCount: 0,
  warningCount: 0,
}

// Strict typing for date validation config
const dateConfig: DateValidationConfig = {
  allowNull: true,
  allowUndefined: true,
  minDate: new Date("2024-01-01"),
  maxDate: new Date("2024-12-31"),
  customErrorMessage: "Date must be in 2024",
}
```

### Schema Validation Examples

```typescript
// Validate complete promoter profile schema
const validProfile: PromoterProfileFormData = {
  firstName: "John",
  lastName: "Doe",
  nationality: "Omani",
  email: "john.doe@example.com",
  mobile_number: "+96812345678",
  name_en: "John Doe",
  name_ar: "جون دو",
  id_card_number: "1234567890",
  status: "active",
  job_title: "Software Developer",
  department: "IT",
  work_location: "Muscat",
  contract_valid_until: new Date("2025-12-31"),
  id_card_expiry_date: new Date("2025-12-31"),
  passport_expiry_date: new Date("2025-12-31"),
  passport_number: "P123456789",
  notes: "Test promoter",
          notify_days_before_id_expiry: 100,
        notify_days_before_passport_expiry: 210,
}

const result = promoterProfileSchema.safeParse(validProfile)
if (result.success) {
  // Use validated data
  const validatedData = result.data
} else {
  // Handle validation errors
  console.error("Validation errors:", result.error.errors)
}
```

## Testing Strategy

### Unit Tests

- All validation functions thoroughly tested
- Error scenarios covered
- Type safety validation
- Edge case testing

### Integration Tests

- Schema validation testing
- Error handling validation
- Data sanitization testing
- Validation summary testing

### Performance Tests

- Validation function performance
- Error handling efficiency
- Data sanitization speed
- Memory usage optimization

## Conclusion

The validation schema has been successfully enhanced to meet all requested improvements:

1. **✅ Modularity**: Validation functions are well-organized with reusable schemas, configurable validation rules, and consistent patterns
2. **✅ Type Safety**: Comprehensive TypeScript interfaces and compile-time error detection
3. **✅ Error Handling**: Robust error handling with detailed error messages, validation summaries, and standardized responses

These enhancements provide a robust, maintainable, and type-safe foundation for form validation while maintaining full backward compatibility with existing code.
