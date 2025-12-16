# 🏢 Company Switcher System Guide

**Complete guide to understanding and utilizing the company switcher, authorization, and multi-company management system.**

---

## 📋 **Table of Contents**

1. [Overview](#overview)
2. [Data Sources](#data-sources)
3. [Authorization System](#authorization-system)
4. [How It Works](#how-it-works)
5. [Role Hierarchy](#role-hierarchy)
6. [Usage Guide](#usage-guide)
7. [API Endpoints](#api-endpoints)

---

## 🎯 **Overview**

The company switcher allows users to:
- **Switch between multiple companies** they have access to
- **View their role** in each company (owner, admin, manager, etc.)
- **Create new companies** (becomes owner automatically)
- **Manage company settings** based on their role

---

## 📊 **Data Sources**

### **1. Primary Data Source: `/api/user/companies`**

The company switcher fetches data from **`/api/user/companies`** endpoint which queries:

#### **A. `company_members` Table** (Primary Source)
```sql
SELECT 
  company_id,
  role,
  is_primary,
  company:companies (
    id,
    name,
    logo_url,
    group_id
  )
FROM company_members
WHERE user_id = current_user_id
  AND status = 'active'
ORDER BY is_primary DESC
```

**Fields:**
- `company_id` - UUID of the company
- `role` - User's role in company (owner, admin, manager, hr, accountant, member, viewer)
- `is_primary` - Boolean indicating primary company
- `status` - Must be 'active' to appear in switcher

#### **B. `companies` Table** (Fallback for Owners)
```sql
SELECT id, name, logo_url, group_id
FROM companies
WHERE owner_id = current_user_id
  AND is_active = true
```

**Used when:**
- User owns companies directly (legacy support)
- `company_members` entry might be missing

#### **C. `profiles` Table** (Active Company Storage)
```sql
SELECT active_company_id
FROM profiles
WHERE id = current_user_id
```

**Purpose:**
- Stores the currently selected/active company
- Updated when user switches companies

---

## 🔐 **Authorization System**

### **Role-Based Access Control (RBAC)**

The system uses a **hierarchical role system** stored in `company_members.role`:

#### **Role Hierarchy (Highest to Lowest):**

1. **`owner`** 👑
   - Full control over company
   - Can delete company
   - Can assign any role to others
   - Can manage all settings
   - **Color:** Purple badge

2. **`admin`** 🔵
   - Almost full control (except delete company)
   - Can manage members, settings, policies
   - Can assign roles up to their level
   - **Color:** Blue badge

3. **`manager`** 🟢
   - Team management access
   - Can manage employees, tasks, targets
   - Limited settings access
   - **Color:** Emerald badge

4. **`hr`** 🩷
   - Human resources functions
   - Can manage leave requests, performance reviews
   - **Color:** Pink badge

5. **`accountant`** 🟡
   - Financial management
   - Can manage expenses, invoices
   - **Color:** Amber badge

6. **`member`** ⚪
   - Basic access
   - Can view own data
   - Limited permissions
   - **Color:** Gray badge

7. **`viewer`** 👁️
   - Read-only access
   - Can view but not modify
   - **Color:** Gray badge

### **Authorization Checks**

#### **1. Company Access Verification**

When switching companies, the system verifies:

```typescript
// Check company_members first
const membership = await supabase
  .from('company_members')
  .select('role, company:companies(name)')
  .eq('company_id', company_id)
  .eq('user_id', user.id)
  .eq('status', 'active')
  .maybeSingle();

// Fallback: Check if user owns company directly
if (!membership) {
  const ownedCompany = await supabase
    .from('companies')
    .select('id, name, owner_id')
    .eq('id', company_id)
    .single();
  
  if (ownedCompany && ownedCompany.owner_id === user.id) {
    userRole = 'owner';
  }
}
```

#### **2. Permission Checks in API Routes**

Most company-related APIs check permissions:

```typescript
// Example from company/invite-admin/route.ts
const { data: myMembership } = await supabase
  .from('company_members')
  .select('role')
  .eq('company_id', profile.active_company_id)
  .eq('user_id', user.id)
  .eq('status', 'active')
  .single();

// Only owner/admin can invite
if (!myMembership || !['owner', 'admin'].includes(myMembership.role)) {
  return NextResponse.json({ error: 'Owner or Admin access required' }, { status: 403 });
}
```

#### **3. Company Context Helper**

Use `getCompanyContext()` in API routes:

```typescript
import { getCompanyContext } from '@/lib/company-context';

const context = await getCompanyContext();
// Returns: { userId, companyId, companyRole, isAdmin }

if (!context.isAdmin) {
  // Deny access
}
```

---

## ⚙️ **How It Works**

### **1. Fetching Companies**

**Component:** `components/layout/company-switcher.tsx`

```typescript
const fetchCompanies = async () => {
  const response = await fetch('/api/user/companies');
  const data = await response.json();
  
  if (response.ok && data.success) {
    setCompanies(data.companies || []);
    setActiveCompanyId(data.active_company_id);
  }
};
```

**Flow:**
1. User opens app → Company switcher loads
2. Calls `/api/user/companies` endpoint
3. Endpoint queries `company_members` + `companies` tables
4. Returns list of companies with user's role in each
5. Sets active company from `profiles.active_company_id`

### **2. Switching Companies**

**Component:** `components/layout/company-switcher.tsx`

```typescript
const handleSwitch = async (companyId: string) => {
  const response = await fetch('/api/user/companies/switch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company_id: companyId }),
  });
  
  // Updates profiles.active_company_id
  // Refreshes page to load new company context
  router.refresh();
};
```

**Flow:**
1. User clicks company in dropdown
2. Calls `/api/user/companies/switch` endpoint
3. Endpoint verifies user has access to company
4. Updates `profiles.active_company_id`
5. Refreshes page to reload all company-scoped data

### **3. Creating Companies**

**Component:** `components/layout/company-switcher.tsx`

```typescript
const handleCreateCompany = async () => {
  const response = await fetch('/api/user/companies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description }),
  });
  
  // Automatically creates company_members entry with role='owner'
  // Switches to new company
};
```

**Flow:**
1. User clicks "Create Company"
2. Fills in company name and description
3. Calls `/api/user/companies` POST endpoint
4. Creates company in `companies` table
5. Auto-creates `company_members` entry with `role='owner'`
6. Sets as active company

---

## 📈 **Role Hierarchy Details**

### **Role Permissions Matrix**

| Feature | Owner | Admin | Manager | HR | Accountant | Member | Viewer |
|---------|-------|-------|---------|----|-----------|--------|--------|
| Delete Company | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage Members | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Invite Users | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Change Roles | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Company Settings | ✅ | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ |
| Manage Team | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Tasks | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Leave | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage Expenses | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| View Reports | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ |
| View Own Data | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Legend:**
- ✅ = Full access
- ⚠️ = Limited access
- ❌ = No access

---

## 📖 **Usage Guide**

### **For End Users**

#### **Switching Companies:**
1. Click the company name/logo in the header
2. Select a company from the dropdown
3. System automatically switches and refreshes

#### **Viewing Your Role:**
- Your role badge appears next to each company name
- Color indicates role level (purple = owner, blue = admin, etc.)

#### **Creating a Company:**
1. Click "Create New Company" in dropdown
2. Enter company name (required)
3. Enter description (optional)
4. Click "Create Company"
5. Automatically switched to new company as owner

### **For Developers**

#### **Using Company Context in API Routes:**

```typescript
import { getCompanyContext, requireCompanyContext } from '@/lib/company-context';

// Get context (returns null if no company)
const context = await getCompanyContext();

// Require context (throws if no company)
const context = await requireCompanyContext();

// Check specific role
if (hasRole(context, ['owner', 'admin'])) {
  // Allow action
}

// Require specific role
requireRole(context, ['owner', 'admin']);
```

#### **Scoping Queries to Active Company:**

```typescript
const context = await requireCompanyContext();

const { data } = await supabase
  .from('some_table')
  .select('*')
  .eq('company_id', context.companyId);
```

#### **Checking Permissions:**

```typescript
// In API route
const { data: membership } = await supabase
  .from('company_members')
  .select('role')
  .eq('company_id', companyId)
  .eq('user_id', user.id)
  .eq('status', 'active')
  .single();

if (!['owner', 'admin'].includes(membership?.role || '')) {
  return NextResponse.json({ error: 'Access denied' }, { status: 403 });
}
```

---

## 🔌 **API Endpoints**

### **1. GET `/api/user/companies`**

**Purpose:** Fetch all companies user has access to

**Response:**
```json
{
  "success": true,
  "companies": [
    {
      "company_id": "uuid",
      "company_name": "Company Name",
      "company_logo": "url",
      "user_role": "owner",
      "is_primary": true,
      "group_name": null
    }
  ],
  "active_company_id": "uuid"
}
```

**Data Sources:**
- `company_members` table (primary)
- `companies` table (fallback for owners)
- `profiles.active_company_id` (active company)

### **2. POST `/api/user/companies/switch`**

**Purpose:** Switch active company

**Request:**
```json
{
  "company_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Switched to Company Name",
  "company_id": "uuid",
  "role": "owner"
}
```

**Authorization:**
- Verifies user is member of company or owns it
- Returns 403 if no access

### **3. POST `/api/user/companies`**

**Purpose:** Create new company

**Request:**
```json
{
  "name": "Company Name",
  "description": "Optional description",
  "logo_url": "optional-url",
  "business_type": "optional",
  "group_id": "optional-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "company": {
    "id": "uuid",
    "name": "Company Name",
    ...
  },
  "message": "Company created successfully"
}
```

**Auto-Actions:**
- Creates `company_members` entry with `role='owner'`
- Sets `is_primary=true` if first company

---

## 🗄️ **Database Schema**

### **`company_members` Table**

```sql
CREATE TABLE company_members (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES profiles(id),
  role TEXT CHECK (role IN ('owner', 'admin', 'manager', 'hr', 'accountant', 'member', 'viewer')),
  is_primary BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  department TEXT,
  job_title TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(company_id, user_id)
);
```

### **`companies` Table**

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  owner_id UUID REFERENCES profiles(id),
  group_id UUID REFERENCES company_groups(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **`profiles` Table (Relevant Fields)**

```sql
ALTER TABLE profiles ADD COLUMN active_company_id UUID REFERENCES companies(id);
```

---

## 🎯 **Key Points**

1. **Multi-Company Support:** Users can belong to multiple companies with different roles
2. **Active Company:** Only one company is active at a time (stored in `profiles.active_company_id`)
3. **Role-Based Access:** All company features respect role hierarchy
4. **Automatic Ownership:** Creating a company makes you owner automatically
5. **Fallback Support:** System checks both `company_members` and direct ownership
6. **Admin Client:** Uses admin client to bypass RLS for company queries

---

## 🔧 **Troubleshooting**

### **Company Not Appearing in Switcher:**
- Check `company_members.status = 'active'`
- Verify user is in `company_members` table
- Check if company `is_active = true`

### **Cannot Switch Company:**
- Verify user has `company_members` entry with `status='active'`
- Check user owns company directly (fallback)

### **Wrong Role Displayed:**
- Check `company_members.role` field
- Verify `status='active'` in `company_members`

### **No Active Company:**
- System auto-selects first company if none set
- Updates `profiles.active_company_id` automatically

---

## 📝 **Summary**

The company switcher system:
- ✅ Fetches from `company_members` + `companies` tables
- ✅ Uses role-based authorization (owner > admin > manager > ...)
- ✅ Stores active company in `profiles.active_company_id`
- ✅ Verifies access before switching
- ✅ Auto-creates ownership when creating companies
- ✅ Supports multi-company access with different roles

**Main API:** `/api/user/companies` (GET for list, POST for create, `/switch` for switching)

