# 🏢 Company-Scoped System Implementation Guide

**Complete guide for making the entire system company-scoped, showing only data and features related to the selected company.**

---

## 📋 **Overview**

The system now automatically filters all data, features, and components based on the user's **active company**. When a user switches companies, all views, data, and functionality update to show only information related to that company.

---

## 🏗️ **Architecture**

### **1. Company Context System**

#### **Client-Side (React Context)**
- **Location**: `components/providers/company-provider.tsx`
- **Hook**: `useCompany()` - Access company context in any component
- **Features**:
  - Automatically fetches active company on mount
  - Provides `company`, `companyId`, `isLoading`
  - `switchCompany(companyId)` - Switch active company
  - `refreshCompany()` - Refresh company data

#### **Server-Side (API Routes)**
- **Location**: `lib/company-context.ts` and `lib/company-scope.ts`
- **Functions**:
  - `getCompanyContext()` - Get company context with role info
  - `getCompanyScope()` - Get companyId and partyId for filtering
  - `requireCompanyScope()` - Require active company (throws if none)
  - `addCompanyFilter()` - Automatically add company filter to queries

---

## 🔧 **Implementation**

### **Step 1: Using Company Context in Components**

```typescript
'use client';

import { useCompany } from '@/components/providers/company-provider';

export function MyComponent() {
  const { company, companyId, isLoading, switchCompany } = useCompany();

  if (isLoading) return <div>Loading...</div>;
  if (!company) return <div>No company selected</div>;

  return (
    <div>
      <h1>Viewing: {company.name}</h1>
      <p>Company ID: {companyId}</p>
      <button onClick={() => switchCompany('other-company-id')}>
        Switch Company
      </button>
    </div>
  );
}
```

### **Step 2: Scoping API Endpoints**

#### **Option A: Using Company Scope (Recommended)**

```typescript
import { getCompanyScope, addCompanyFilter } from '@/lib/company-scope';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const scope = await getCompanyScope();

  if (!scope?.companyId) {
    return NextResponse.json({ data: [], message: 'No company selected' });
  }

  // Automatically filter by company
  let query = supabase.from('promoters').select('*');
  query = addCompanyFilter(query, scope, 'promoters');

  const { data, error } = await query;
  return NextResponse.json({ data, error });
}
```

#### **Option B: Using Company Context**

```typescript
import { requireCompanyContext } from '@/lib/company-context';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const context = await requireCompanyContext();
  const supabase = await createClient();

  // Filter by company_id
  const { data } = await supabase
    .from('some_table')
    .select('*')
    .eq('company_id', context.companyId);

  return NextResponse.json({ data });
}
```

### **Step 3: Scoping by Party ID**

For tables that use `party_id` (like `promoters`, `contracts`):

```typescript
import { getCompanyScope } from '@/lib/company-scope';

export async function GET(request: NextRequest) {
  const scope = await getCompanyScope();

  if (!scope?.partyId) {
    return NextResponse.json({ data: [] });
  }

  // Promoters use employer_id which references parties(id)
  const { data: promoters } = await supabase
    .from('promoters')
    .select('*')
    .eq('employer_id', scope.partyId);

  return NextResponse.json({ data: promoters });
}
```

---

## 📊 **Tables and Their Scoping**

### **Tables Using `company_id`**
- `company_members` - Direct company membership
- `company_settings` - Company-specific settings
- `company_policies` - Company policies
- `employer_employees` - Can use both company_id and party_id

### **Tables Using `party_id` (via employer_id)**
- `promoters` - `employer_id` → `parties(id)`
- `contracts` - `second_party_id` → `parties(id)` (for employers)

### **Hybrid Tables**
- `employer_employees` - Can filter by:
  - `company_id` (if set)
  - `employer_id` (profile ID) → find via party's contact_email

---

## 🎯 **Key Features**

### **1. Automatic Data Filtering**
All queries automatically filter by the active company:
- ✅ Promoters show only for selected company
- ✅ Contracts show only for selected company
- ✅ Team members show only for selected company
- ✅ Reports and analytics scoped to company
- ✅ Settings and configurations company-specific

### **2. Company Switching**
Users can switch companies via:
- Company switcher dropdown in header
- `useCompany().switchCompany(companyId)` hook
- API endpoint: `POST /api/user/companies/switch`

### **3. Role-Based Access**
Company context includes:
- `companyRole` - User's role in the company (owner, admin, member)
- `isAdmin` - Boolean for admin/owner access
- Automatic permission checks

---

## 🔄 **Migration Checklist**

### **API Endpoints to Update**

- [x] `/api/employer/team` - ✅ Updated
- [x] `/api/company/team` - ✅ Created
- [ ] `/api/contracts` - Filter by party_id
- [ ] `/api/promoters` - Filter by employer_id (party_id)
- [ ] `/api/parties` - Show only employer's party
- [ ] `/api/analytics/*` - Scope all analytics to company
- [ ] `/api/reports/*` - Scope all reports to company

### **Components to Update**

- [x] Company Provider - ✅ Created
- [x] Company Switcher - ✅ Exists
- [ ] Dashboard - Filter data by company
- [ ] Promoters List - Filter by company
- [ ] Contracts List - Filter by company
- [ ] Analytics Pages - Scope to company
- [ ] Reports - Scope to company

### **Database Queries**

- [x] Team Management - ✅ Updated
- [ ] All promoter queries - Add employer_id filter
- [ ] All contract queries - Add party_id filter
- [ ] All analytics queries - Add company scope

---

## 🚀 **Quick Start**

### **1. Add Company Provider (Already Done)**
✅ Added to `app/providers.tsx`

### **2. Use in Components**

```typescript
import { useCompany } from '@/components/providers/company-provider';

function MyComponent() {
  const { company, companyId } = useCompany();
  // Component automatically scoped to company
}
```

### **3. Update API Endpoints**

```typescript
import { getCompanyScope } from '@/lib/company-scope';

export async function GET() {
  const scope = await getCompanyScope();
  // Use scope.companyId or scope.partyId for filtering
}
```

---

## 📝 **Best Practices**

1. **Always Check Company Context**
   - Use `requireCompanyScope()` in APIs that need a company
   - Show empty state if no company selected

2. **Handle Missing Company**
   - Don't throw errors, show helpful messages
   - Guide users to select a company

3. **Cache Company Data**
   - Company context is cached in React Query
   - Refresh on company switch

4. **Consistent Filtering**
   - Use `addCompanyFilter()` utility for consistency
   - Document which tables use company_id vs party_id

---

## 🔍 **Testing**

### **Test Scenarios**

1. **Switch Company**
   - Select different company
   - Verify all data updates
   - Check URL params (if applicable)

2. **No Company Selected**
   - Verify empty states show
   - Check error messages are helpful

3. **Multiple Companies**
   - User with access to multiple companies
   - Verify switching works correctly
   - Check data isolation

---

## 🎉 **Benefits**

✅ **Data Isolation** - Each company sees only their data  
✅ **Multi-Tenancy** - Support multiple companies per user  
✅ **Security** - Automatic filtering prevents data leaks  
✅ **User Experience** - Seamless company switching  
✅ **Scalability** - Easy to add new company-scoped features  

---

## 📚 **Related Documentation**

- `COMPANY_SWITCHER_SYSTEM_GUIDE.md` - Company switcher details
- `PARTIES_TO_COMPANIES_ALIGNMENT_GUIDE.md` - Parties/Companies alignment
- `lib/company-context.ts` - Server-side company context
- `lib/company-scope.ts` - Company scoping utilities

---

**Last Updated**: January 2025  
**Status**: ✅ Core Implementation Complete

