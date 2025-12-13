# 📊 Team Management - Data Source Documentation

## 🗄️ **Database Tables Used**

### **1. Primary Source: `promoters` Table**

**Location:** `components/employer/add-team-member-dialog.tsx` (Line 118-130)

```typescript
const { data: allPromoters, error: promotersError } = await supabase
  .from('promoters')
  .select('id, name_en, name_ar, email, mobile_number, phone, status, employer_id')
  .order('name_en', { ascending: true });

// Filter out inactive/terminated promoters
const promoters = (allPromoters || []).filter(
  promoter => 
    promoter.status !== 'terminated' && 
    promoter.status !== 'suspended' &&
    promoter.status !== 'inactive'
);
```

**What it contains:**
- All promoter/employee records in the system
- Same data shown in the Promoters management page
- These are the actual employees that can be added to teams

**Fields fetched:**
- `id` - Promoter UUID (primary key)
- `name_en` - English name (used as full_name)
- `name_ar` - Arabic name
- `email` - Email address
- `mobile_number` - Mobile phone number
- `phone` - Phone number
- `status` - Promoter status (active, inactive, terminated, etc.)
- `employer_id` - Current employer (if any)

**Filters Applied:**
- ❌ Excludes promoters with `status = 'terminated'` (terminated employees can't be added)
- ❌ Excludes promoters with `status = 'suspended'` (suspended employees can't be added)
- ❌ Excludes promoters with `status = 'inactive'` (inactive employees can't be added)

**Purpose:**
- Shows all available employees/promoters that can be added to the team
- These are the same people visible in the Promoters management page

---

### **2. Filter Source: `employer_employees` Table**

**Location:** `components/employer/add-team-member-dialog.tsx` (Line 110-114)

```typescript
const { data: currentTeam } = await supabase
  .from('employer_employees')
  .select('employee_id')
  .eq('employer_id', user.id)
  .eq('employment_status', 'active');
```

**What it contains:**
- Employer-employee relationships
- Tracks which employees are already assigned to which employer
- Employment details (job title, department, status, etc.)

**Fields used:**
- `employer_id` - The employer's user ID
- `employee_id` - The employee's user ID (references `profiles.id`)
- `employment_status` - Status (active, terminated, on_leave, etc.)

**Purpose:**
- Filters out employees already in the current employer's team
- Marks employees as "Already in Team" in the UI
- Prevents duplicate team member assignments

---

## 🔄 **Data Flow**

```
1. User opens "Add Team Member" dialog
   ↓
2. Fetch from `employer_employees` table
   - Get list of employee_ids already in team
   ↓
3. Fetch from `profiles` table
   - Get ALL user profiles (employees/promoters)
   ↓
4. Process and filter:
   - Map profiles to AvailableEmployee objects
   - Mark employees as "isInTeam" if their ID is in currentTeam
   - Display in UI with badges
   ↓
5. User selects employee
   ↓
6. Create record in `employer_employees` table
   - Links employer_id to employee_id
   - Stores employment details (job_title, department, etc.)
```

---

## 📋 **Table Schema Reference**

### **`profiles` Table**

**Schema Location:** Supabase `public.profiles`

**Key Fields:**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT,
  status TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Relationship:**
- This is the main user profile table
- All users (employers, employees, promoters, admins) have a record here
- Referenced by `employer_employees.employer_id` and `employer_employees.employee_id`

---

### **`employer_employees` Table**

**Schema Location:** `supabase/migrations/20250130_create_employer_team_management.sql`

**Key Fields:**
```sql
CREATE TABLE employer_employees (
  id UUID PRIMARY KEY,
  employer_id UUID REFERENCES profiles(id),
  employee_id UUID REFERENCES profiles(id),
  employee_code TEXT,
  job_title TEXT,
  department TEXT,
  employment_type TEXT,
  employment_status TEXT,
  hire_date DATE,
  salary DECIMAL(12,2),
  currency TEXT,
  work_location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Purpose:**
- Links employers to their team members
- Stores employment-specific information
- Tracks employment status and history

---

## 🔍 **How It Works**

### **Step 1: Fetch Current Team**
```typescript
// Get employees already in this employer's team
const { data: currentTeam } = await supabase
  .from('employer_employees')
  .select('employee_id')
  .eq('employer_id', user.id)  // Current logged-in employer
  .eq('employment_status', 'active');  // Only active employees

const currentTeamIds = new Set((currentTeam || []).map(t => t.employee_id));
```

### **Step 2: Fetch All Profiles**
```typescript
// Get ALL user profiles (same as Promoters page)
const { data: profiles } = await supabase
  .from('profiles')
  .select('id, email, full_name, first_name, last_name, role, status')
  .order('full_name', { ascending: true });
```

### **Step 3: Map and Mark**
```typescript
// Map profiles to employees and mark if already in team
const employees = profiles.map(profile => ({
  id: profile.id,
  email: profile.email,
  full_name: profile.full_name,
  role: profile.role,
  isInTeam: currentTeamIds.has(profile.id)  // Check if already in team
}));
```

---

## 🎯 **Key Points**

1. **Single Source of Truth:**
   - All employees come from `profiles` table
   - Same data as Promoters page
   - No duplicate data storage

2. **Team Membership:**
   - Tracked in `employer_employees` table
   - One employee can belong to one employer at a time (unless terminated)
   - Status tracked (active, terminated, on_leave, etc.)

3. **Data Consistency:**
   - `profiles` = All users in system
   - `employer_employees` = Team assignments
   - When adding to team, creates link in `employer_employees`

4. **Filtering:**
   - Employees already in team are marked with "In Team" badge
   - Can still see them but can't add again
   - Filtered by `employment_status = 'active'`

---

## 📝 **Example Query Flow**

```sql
-- Step 1: Get current team members
SELECT employee_id 
FROM employer_employees 
WHERE employer_id = 'current-user-id' 
  AND employment_status = 'active';

-- Step 2: Get all profiles
SELECT id, email, full_name, first_name, last_name, role, status
FROM profiles
ORDER BY full_name ASC;

-- Step 3: When adding employee, insert into employer_employees
INSERT INTO employer_employees (
  employer_id,
  employee_id,
  employee_code,
  job_title,
  department,
  employment_type,
  hire_date,
  salary
) VALUES (
  'employer-uuid',
  'employee-uuid',
  'EMP001',
  'Software Engineer',
  'Engineering',
  'full_time',
  '2025-01-30',
  500.00
);
```

---

## ✅ **Summary**

**Data Source:**
- ✅ **`profiles` table** - All employees/promoters (main source)
- ✅ **`employer_employees` table** - Team membership tracking (filter source)

**Database:** Supabase PostgreSQL

**Schema:** `public.profiles` and `public.employer_employees`

**Relationship:**
- `profiles.id` → `employer_employees.employer_id` (employer)
- `profiles.id` → `employer_employees.employee_id` (employee)

---

**Last Updated:** January 2025

