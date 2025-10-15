# Promoter Form & Management System - Usage Guide

This guide provides comprehensive documentation for the promoter form and management system created based on the `promoters` database table schema.

## 📁 Files Created

### 1. Schema & Types
- **`lib/schemas/promoter-form-schema.ts`** - Comprehensive Zod validation schema
  - Full field validation with business rules
  - Type-safe form data types
  - Form sections configuration for progressive disclosure

### 2. Components
- **`components/promoter-form-comprehensive.tsx`** - Multi-section form component
  - 10 organized sections (basic, contact, personal, documents, etc.)
  - Step-by-step navigation with progress tracking
  - Real-time validation with React Hook Form + Zod
  - Date picker integration for all date fields
  - Responsive design with animations

- **`components/promoters-table.tsx`** - Data table component
  - Search and filter functionality
  - Status badges and visual indicators
  - Export to CSV
  - CRUD action menu
  - Responsive layout

### 3. Example Page
- **`app/[locale]/manage-promoters/comprehensive/page.tsx`** - Complete working example
  - Form in a dialog/modal
  - Integrated table view
  - Create, Read, Update, Delete operations
  - Data refresh on changes

## 🎯 Features

### Form Features

1. **10 Organized Sections**
   - Basic Information (name, profile picture)
   - Contact Information (email, phone, address)
   - Personal Information (nationality, DOB, gender)
   - Identity Documents (ID card, passport, visa, work permit)
   - Emergency Contact
   - Employment Information (job title, company, department)
   - Education (level, university, graduation)
   - Banking Information (bank account, IBAN, SWIFT)
   - Status & Availability
   - Additional Information (notes, notifications)

2. **Validation**
   - Required fields enforced
   - Email format validation
   - Date validation (past/future checks)
   - IBAN format validation
   - Cross-field validation (e.g., if passport number provided, expiry date required)
   - Business rules (ID card expiry must be in future)

3. **UX Enhancements**
   - Progress bar showing completion
   - Section navigation
   - Smooth animations between sections
   - Previous/Next navigation
   - Form field descriptions
   - Error messages with context

### Table Features

1. **Data Display**
   - Avatar with initials fallback
   - Status badges with colors
   - Contact information
   - Job details
   - Overall status indicator
   - Availability status

2. **Filtering & Search**
   - Full-text search across name, email, ID card
   - Status filter dropdown
   - Clear filters button
   - Results count display

3. **Actions**
   - View details
   - Edit promoter
   - Delete with confirmation
   - Export to CSV

## 🚀 Usage

### Basic Form Usage

```tsx
import { PromoterFormComprehensive } from '@/components/promoter-form-comprehensive';
import type { PromoterFormData } from '@/lib/schemas/promoter-form-schema';

function MyComponent() {
  const handleSubmit = async (data: PromoterFormData) => {
    // Convert dates to ISO strings for API
    const apiData = {
      ...data,
      id_card_expiry_date: data.id_card_expiry_date?.toISOString(),
      passport_expiry_date: data.passport_expiry_date?.toISOString(),
      // ... other date fields
    };

    // Send to API
    const response = await fetch('/api/promoters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiData),
    });
  };

  return (
    <PromoterFormComprehensive
      onSubmit={handleSubmit}
      mode="create"
    />
  );
}
```

### Form with Initial Data (Edit Mode)

```tsx
const initialData = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  id_card_number: '12345678',
  id_card_expiry_date: new Date('2025-12-31'),
  status: 'active' as const,
  // ... other fields
};

return (
  <PromoterFormComprehensive
    initialData={initialData}
    promoterId="some-uuid"
    onSubmit={handleUpdate}
    onCancel={handleCancel}
    mode="edit"
  />
);
```

### Table Usage

```tsx
import { PromotersTable } from '@/components/promoters-table';

function PromotersPage() {
  const [promoters, setPromoters] = useState([]);

  const handleEdit = (id: string) => {
    // Navigate to edit page or open modal
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/promoters/${id}`, { method: 'DELETE' });
    // Refresh data
  };

  return (
    <PromotersTable
      promoters={promoters}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onView={(id) => router.push(`/promoters/${id}`)}
      onRefresh={fetchPromoters}
    />
  );
}
```

### Complete Example with Dialog

See `app/[locale]/manage-promoters/comprehensive/page.tsx` for a complete working example that includes:
- Form in a dialog
- Table view
- Create/Edit switching
- Data fetching and refresh
- Error handling

## 🔌 API Integration

### Existing API Endpoints

The system uses the existing API routes:

- **GET /api/promoters** - List all promoters
- **POST /api/promoters** - Create new promoter
- **GET /api/promoters/[id]** - Get single promoter
- **PUT /api/promoters/[id]** - Update promoter
- **DELETE /api/promoters/[id]** - Delete promoter

### API Data Format

When submitting to the API, convert Date objects to ISO strings:

```typescript
const apiData = {
  ...formData,
  id_card_expiry_date: formData.id_card_expiry_date?.toISOString(),
  passport_expiry_date: formData.passport_expiry_date?.toISOString(),
  visa_expiry_date: formData.visa_expiry_date?.toISOString(),
  work_permit_expiry_date: formData.work_permit_expiry_date?.toISOString(),
  date_of_birth: formData.date_of_birth?.toISOString(),
};
```

When receiving from API, convert ISO strings back to Date objects:

```typescript
const formData = {
  ...apiData,
  id_card_expiry_date: apiData.id_card_expiry_date
    ? new Date(apiData.id_card_expiry_date)
    : undefined,
  // ... other date fields
};
```

## 📋 Database Schema Reference

The form implements all fields from the `promoters` table:

```sql
CREATE TABLE public.promoters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text,
  name_ar text,
  first_name text,
  last_name text,
  email text,
  phone text,
  mobile_number text,
  profile_picture_url text,
  id_card_number text UNIQUE,
  id_card_expiry_date date,
  passport_number text,
  passport_expiry_date date,
  visa_number text,
  visa_expiry_date date,
  work_permit_number text,
  work_permit_expiry_date date,
  nationality text,
  date_of_birth date,
  gender text,
  marital_status text,
  address text,
  city text,
  state text,
  country text,
  postal_code text,
  emergency_contact text,
  emergency_phone text,
  job_title text,
  company text,
  department text,
  specialization text,
  experience_years integer,
  education_level text,
  university text,
  graduation_year integer,
  skills text,
  certifications text,
  bank_name text,
  account_number text,
  iban text,
  swift_code text,
  tax_id text,
  status text,
  overall_status text,
  rating numeric,
  availability text,
  preferred_language text,
  timezone text,
  special_requirements text,
  notes text,
  employer_id uuid REFERENCES parties(id),
  notify_days_before_id_expiry integer DEFAULT 100,
  notify_days_before_passport_expiry integer DEFAULT 210,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## 🎨 Customization

### Styling

The components use shadcn/ui components and Tailwind CSS. You can customize:
- Colors via Tailwind config
- Component variants via shadcn/ui theme
- Layout spacing and sizing

### Validation

Modify `lib/schemas/promoter-form-schema.ts` to:
- Add/remove required fields
- Change validation rules
- Add custom refinements
- Modify error messages

### Form Sections

Adjust the `FORM_SECTIONS` constant in the schema file to:
- Reorder sections
- Add/remove sections
- Change section titles and descriptions
- Group fields differently

### Table Columns

Edit `components/promoters-table.tsx` to:
- Add/remove columns
- Change column order
- Customize cell rendering
- Add custom filters

## 🔒 Security

- All API routes are protected with RBAC (Role-Based Access Control)
- Form validation on both client and server
- SQL injection protection via Supabase
- XSS protection via React
- Input sanitization

## 📱 Responsive Design

Both components are fully responsive:
- Mobile-first approach
- Breakpoints for tablet and desktop
- Touch-friendly interfaces
- Optimized table scrolling on mobile

## 🧪 Testing Example

```typescript
// Test form submission
const testData: PromoterFormData = {
  first_name: 'Test',
  last_name: 'User',
  id_card_number: 'TEST123456',
  id_card_expiry_date: new Date('2025-12-31'),
  status: 'active',
  overall_status: 'good',
  availability: 'available',
  preferred_language: 'en',
  notify_days_before_id_expiry: 100,
  notify_days_before_passport_expiry: 210,
  // ... other required fields
};

await handleSubmit(testData);
```

## 🐛 Troubleshooting

### Common Issues

1. **Dates not saving correctly**
   - Ensure dates are converted to ISO strings before API calls
   - Check timezone handling

2. **Validation errors**
   - Review Zod schema requirements
   - Check that all required fields are provided
   - Verify date formats

3. **API errors**
   - Check API route permissions (RBAC)
   - Verify Supabase connection
   - Review server logs

## 📚 Additional Resources

- [React Hook Form Documentation](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Supabase Documentation](https://supabase.com/docs)

## 🎉 Demo

Access the demo page at: `/[locale]/manage-promoters/comprehensive`

This page demonstrates:
- Complete CRUD operations
- Form in modal
- Table with all features
- Data refresh
- Error handling

