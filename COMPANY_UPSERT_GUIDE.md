# 🏢 Company Upsert System Documentation

## Overview

This document provides comprehensive documentation for the enhanced company upsert system with automatic conflict resolution using PostgreSQL's `UPSERT` capabilities and generated columns.

## 🎯 Key Features

### ✅ **Automatic Conflict Resolution**
- **Email-based upsert**: Uses case-insensitive email matching via generated `lower_email` column
- **Slug-based upsert**: Falls back to URL-friendly slug matching when email is not available
- **Smart strategy selection**: Automatically chooses the best upsert strategy based on available data

### ✅ **Production-Ready Implementation**
- **Type-safe**: Full TypeScript support with comprehensive interfaces
- **RBAC integration**: Role-based permissions for all operations
- **Error handling**: Comprehensive error handling with user-friendly messages
- **Validation**: Input validation at both client and server levels
- **Performance optimized**: Efficient database queries with proper indexing

### ✅ **Developer Experience**
- **React hooks**: Easy-to-use hooks for React components
- **API endpoints**: RESTful API for external integrations
- **Interactive demo**: Full-featured demo component for testing
- **Code examples**: Comprehensive examples and documentation

## 📊 Database Schema

### Enhanced Companies Table

```sql
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    website TEXT,
    email TEXT,
    phone TEXT,
    address JSONB DEFAULT '{}',
    business_type company_type DEFAULT 'small_business',
    registration_number TEXT,
    tax_number TEXT,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    -- Generated column for case-insensitive email matching
    lower_email TEXT GENERATED ALWAYS AS (LOWER(email)) STORED,
    
    -- Constraints
    CONSTRAINT companies_slug_unique UNIQUE (slug),
    CONSTRAINT companies_email_unique UNIQUE (email) WHERE email IS NOT NULL,
    CONSTRAINT companies_lower_email_unique UNIQUE (lower_email) WHERE lower_email IS NOT NULL
);
```

### Key Database Features

1. **Generated Column**: `lower_email` automatically maintains lowercase email for case-insensitive matching
2. **Conditional Unique Constraints**: Allows NULL emails while maintaining uniqueness
3. **Proper Indexing**: Performance-optimized indexes for all search patterns
4. **JSONB Support**: Flexible address and settings storage

## 🔧 Implementation Components

### 1. Service Layer (`lib/company-service.ts`)

```typescript
import { upsertCompany } from '@/lib/company-service'

// Email-based upsert (recommended when email is available)
const company = await upsertCompany({
  name: "Tech Solutions Inc",
  slug: "tech-solutions",
  email: "info@techsolutions.com",
  createdBy: userId
})

// Slug-based upsert (fallback when no email)
const company = await upsertCompanyBySlug({
  name: "Creative Studio",
  slug: "creative-studio",
  createdBy: userId
})
```

**Key Functions:**
- `upsertCompany()` - Email-based upsert with RBAC
- `upsertCompanyBySlug()` - Slug-based upsert alternative
- `getCompany()` - Fetch with permission checking
- `updateCompany()` - Secure updates
- `listCompanies()` - Filtered listing with pagination
- `deleteCompany()` - Soft delete implementation

### 2. API Endpoints (`app/api/enhanced/companies/`)

**Base endpoint**: `/api/enhanced/companies`

#### POST - Create/Update Company
```typescript
const response = await fetch('/api/enhanced/companies', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: "Tech Solutions Inc",
    slug: "tech-solutions",
    email: "info@techsolutions.com",
    upsert_strategy: "email" // "email" or "slug"
  })
})
```

#### GET - List Companies
```typescript
const response = await fetch('/api/enhanced/companies?search=tech&business_type=enterprise&page=1&limit=20')
```

#### PUT - Update Company
```typescript
const response = await fetch('/api/enhanced/companies', {
  method: 'PUT',
  body: JSON.stringify({ id: companyId, name: "Updated Name" })
})
```

#### DELETE - Soft Delete
```typescript
const response = await fetch(`/api/enhanced/companies?id=${companyId}`, {
  method: 'DELETE'
})
```

### 3. React Hooks (`hooks/use-company.ts`)

```typescript
import { useCompanyUpsert, useCompanies, useCompanyForm } from '@/hooks/use-company'

// Upsert hook
const { upsertCompany, isLoading } = useCompanyUpsert()

// List hook with filtering
const { companies, total, isLoading } = useCompanies({
  search: "tech",
  business_type: "enterprise",
  page: 1,
  limit: 20
})

// Form management hook
const { formData, updateField, validateForm, isValid } = useCompanyForm()
```

### 4. UI Components

#### Company Upsert Form
```tsx
import { CompanyUpsertForm } from '@/components/companies/company-upsert-form'

<CompanyUpsertForm
  existingCompany={company} // Optional for updates
  onSuccess={(company) => console.log('Created/updated:', company)}
  onCancel={() => setFormOpen(false)}
/>
```

#### Interactive Demo
```tsx
import { CompanyUpsertDemo } from '@/components/companies/company-upsert-demo'

<CompanyUpsertDemo />
```

## 🚀 Usage Examples

### Basic Upsert Operations

#### 1. Email-Based Upsert
```typescript
// First call - creates new company
const company1 = await upsertCompany({
  name: "Tech Solutions Inc",
  slug: "tech-solutions",
  email: "info@techsolutions.com",
  createdBy: userId
})

// Second call - updates existing company (matches on lower_email)
const company2 = await upsertCompany({
  name: "Tech Solutions Corporation", // Updated name
  slug: "tech-solutions-corp",        // Updated slug  
  email: "INFO@TECHSOLUTIONS.COM",    // Same email, different case
  description: "Updated description",  // New field
  createdBy: userId
})

// company1.id === company2.id (same company, updated)
```

#### 2. Slug-Based Upsert
```typescript
// When email is not available
const company = await upsertCompanyBySlug({
  name: "Creative Studio",
  slug: "creative-studio", // Unique identifier
  phone: "+1 (555) 123-4567",
  createdBy: userId
})
```

### Advanced Usage

#### 1. Form Integration
```typescript
const CompanyForm = () => {
  const { upsertCompany, isLoading } = useCompanyUpsert()
  const { formData, updateField, validateForm } = useCompanyForm()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    const company = await upsertCompany({
      ...formData,
      upsert_strategy: formData.email ? 'email' : 'slug'
    })
    
    console.log('Company saved:', company)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={formData.name}
        onChange={(e) => updateField('name', e.target.value)}
      />
      {/* More form fields */}
    </form>
  )
}
```

#### 2. API Integration
```typescript
const ApiExample = async () => {
  try {
    const response = await fetch('/api/enhanced/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: "Demo Company",
        slug: "demo-company",
        email: "demo@company.com",
        business_type: "small_business",
        upsert_strategy: "email"
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error)
    }

    const result = await response.json()
    console.log('Success:', result.data)
    
  } catch (error) {
    console.error('Error:', error.message)
  }
}
```

## 🔒 Security & Permissions

### RBAC Integration

The system integrates with the enhanced RBAC system:

```typescript
// Required permissions
'companies.create'  // Create new companies
'companies.view'    // View companies  
'companies.edit'    // Edit companies
'companies.delete'  // Delete companies

// Role-based access
- admin/super_admin: Full access to all companies
- manager: Limited access based on company membership
- provider: Can create/edit own company
- client/user: View active companies only
```

### Data Protection

1. **Row Level Security**: Comprehensive RLS policies
2. **Input Validation**: Server-side validation for all inputs
3. **SQL Injection Protection**: Parameterized queries
4. **Permission Checking**: All operations check user permissions
5. **Soft Deletes**: Companies are marked inactive instead of deleted

## 📈 Performance Considerations

### Database Optimization

```sql
-- Key indexes for performance
CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_companies_lower_email ON companies(lower_email);
CREATE INDEX idx_companies_active ON companies(is_active);
CREATE INDEX idx_companies_business_type ON companies(business_type);
CREATE INDEX idx_companies_created_by ON companies(created_by);
```

### Query Performance

- **Generated Column**: `lower_email` provides O(1) lookup for case-insensitive email matching
- **Partial Indexes**: Conditional unique constraints reduce index size
- **JSONB Indexing**: GIN indexes on address and settings for fast searches
- **Pagination**: All list operations support efficient pagination

## 🧪 Testing

### Test Script

Run the comprehensive test script:

```bash
# Run tests with automatic cleanup
npm run test:company-upsert -- --auto-cleanup

# Run tests only (manual cleanup)
npm run test:company-upsert

# Cleanup test data
npm run test:company-upsert -- --cleanup
```

### Interactive Demo

Visit the demo page to test all functionality:

```
/demo/company-upsert
```

### Test Scenarios

The system includes tests for:

1. **Email-based upsert creation**
2. **Email-based upsert updates (case-insensitive)**
3. **Slug-based upsert creation**  
4. **Slug-based upsert updates**
5. **Conflict resolution behavior**
6. **Permission checking**
7. **Validation edge cases**

## 🔧 Configuration

### Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional
NEXT_PUBLIC_ENABLE_COMPANY_DEMO=true
```

### Database Migration

```bash
# Apply the enhanced schema
supabase db push

# Or apply specific migration
psql -f supabase/migrations/20250117_enhance_client_provider_system.sql
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Unique Constraint Violations
```
Error: A company with this email already exists
```
**Solution**: This is expected behavior - the upsert will update the existing company

#### 2. Permission Denied
```
Error: Insufficient permissions to create/update companies
```
**Solution**: Ensure user has the required role and permissions

#### 3. Invalid Slug Format
```
Error: Slug must be lowercase, alphanumeric, and hyphen-separated
```
**Solution**: Use only lowercase letters, numbers, and hyphens

#### 4. Generated Column Issues
```
Error: cannot insert into column "lower_email"
```
**Solution**: Don't manually insert into `lower_email` - it's generated automatically

### Debug Mode

Enable debug logging:

```typescript
// In your component
const { upsertCompany, isLoading, error } = useCompanyUpsert()

useEffect(() => {
  if (error) {
    console.error('Upsert error:', error)
  }
}, [error])
```

## 📋 Best Practices

### 1. Upsert Strategy Selection
- **Use email-based upsert** when email is available and reliable
- **Use slug-based upsert** for companies without email or when email changes frequently
- **Validate inputs** before sending to server

### 2. Error Handling
```typescript
try {
  const company = await upsertCompany(data)
  // Success
} catch (error) {
  if (error.message.includes('permissions')) {
    // Handle permission error
  } else if (error.message.includes('unique')) {
    // Handle conflict (shouldn't happen with upsert)
  } else {
    // Handle other errors
  }
}
```

### 3. Form Management
- **Use the provided hooks** for consistent behavior
- **Validate on both client and server**
- **Provide clear feedback** for validation errors
- **Handle loading states** appropriately

### 4. Performance
- **Use pagination** for large lists
- **Implement debouncing** for search
- **Cache results** with React Query
- **Minimize re-renders** with proper memoization

## 🚀 Deployment

### Production Checklist

- [ ] Database migration applied
- [ ] Environment variables configured
- [ ] RBAC permissions set up
- [ ] RLS policies enabled
- [ ] Indexes created
- [ ] Test suite passing
- [ ] Demo functionality working

### Monitoring

Monitor these metrics in production:

- **Upsert success rate**
- **API response times** 
- **Database query performance**
- **Error rates by operation**
- **User permission violations**

---

## 📞 Support

- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Check inline code documentation
- **Demo**: Use the interactive demo for testing
- **Tests**: Run the test suite for validation

This upsert system provides a robust, production-ready solution for company management with automatic conflict resolution! 🎉