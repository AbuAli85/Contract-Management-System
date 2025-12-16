# ⚙️ System Logic & Implementation Standards

**Professional System Architecture - How Things Actually Work**

---

## 🎯 **CORE SYSTEM LOGIC**

### **1. Company Scoping Logic**

**How It Works:**
```
User Login
  ↓
System gets user's active_company_id from profiles table
  ↓
All queries automatically filter by company_id
  ↓
User only sees their company's data
  ↓
Switching company updates active_company_id
  ↓
All data refreshes for new company
```

**Implementation Pattern:**
```typescript
// Every API endpoint MUST:
1. Get user's active_company_id
2. Verify resource belongs to company
3. Filter all queries by company_id
4. Return only company's data
```

**Example:**
```typescript
// ✅ CORRECT - Company-scoped
const { data: userProfile } = await supabase
  .from('profiles')
  .select('active_company_id')
  .eq('id', user.id)
  .single();

const { data: employees } = await supabase
  .from('employer_employees')
  .select('*')
  .eq('company_id', userProfile.active_company_id); // ✅ Company filter

// ❌ WRONG - No company filter
const { data: employees } = await supabase
  .from('employer_employees')
  .select('*'); // ❌ Shows all companies' data!
```

---

### **2. Permission & Access Control Logic**

**How It Works:**
```
User Action Request
  ↓
System checks user's role (admin, employer, employee)
  ↓
System checks specific permissions (if needed)
  ↓
System checks resource ownership (if applicable)
  ↓
Allow or Deny
```

**Role Hierarchy:**
```
Admin
  ├─ Can access all companies
  ├─ Can manage all users
  └─ Can configure system

Employer (Company Owner)
  ├─ Can access only their company
  ├─ Can manage their employees
  └─ Can view reports for their company

Employee
  ├─ Can access only their own data
  ├─ Can view their tasks/targets
  └─ Can submit requests
```

**Implementation Pattern:**
```typescript
// Check role first
const { data: profile } = await supabase
  .from('profiles')
  .select('role, active_company_id')
  .eq('id', user.id)
  .single();

// Admin can do anything
if (profile?.role === 'admin') {
  // Allow access
  return;
}

// Employer can access their company
if (profile?.role === 'employer') {
  // Verify company ownership
  const { data: company } = await supabase
    .from('companies')
    .select('owner_id')
    .eq('id', profile.active_company_id)
    .single();
  
  if (company?.owner_id === user.id) {
    // Allow access
    return;
  }
}

// Employee can access only their own data
if (profile?.role === 'employee') {
  // Verify resource belongs to employee
  const { data: resource } = await supabase
    .from('resource_table')
    .select('employee_id')
    .eq('id', resourceId)
    .eq('employee_id', user.id)
    .single();
  
  if (resource) {
    // Allow access
    return;
  }
}

// Deny access
return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
```

---

### **3. Data Relationship Logic**

**How Data Connects:**
```
Company
  ├─ Has many: Employees (via employer_employees)
  ├─ Has many: Clients (via parties)
  └─ Has many: Contracts

Employee (Promoter)
  ├─ Belongs to: Company (via employer_employees.company_id)
  ├─ Has many: Tasks (via employee_tasks)
  ├─ Has many: Targets (via employee_targets)
  ├─ Has many: Attendance (via employee_attendance)
  └─ Has many: Assignments (via client_assignments)

Client Assignment
  ├─ Belongs to: Employee (via employer_employee_id)
  ├─ Belongs to: Client (via client_party_id)
  └─ Has one: Deployment Letter (via contract_id)
```

**Foreign Key Rules:**
```sql
-- Always use CASCADE for related data
CREATE TABLE employee_tasks (
  employer_employee_id UUID REFERENCES employer_employees(id) ON DELETE CASCADE
);

-- This means: If employee is deleted, their tasks are also deleted
```

---

### **4. Workflow Automation Logic**

#### **Assignment → Deployment Letter Workflow**

```
User creates assignment
  ↓
System checks:
  - Employee exists and is active
  - Client exists
  - Dates are valid
  ↓
System creates assignment record
  ↓
IF "Generate Deployment Letter" is checked:
  ↓
  System gathers data:
    - Employee details (name, ID, passport)
    - Client details (name, CRN, logo)
    - Assignment details (job title, dates, location)
  ↓
  System calls Make.com webhook
  ↓
  Make.com:
    - Fetches Google Docs template
    - Replaces placeholders with data
    - Inserts images (ID card, passport)
    - Exports as PDF
    - Uploads to Supabase Storage
  ↓
  System updates assignment with deployment_letter_id
  ↓
  System sends email to client with PDF
  ↓
  System notifies employee
```

**Implementation:**
```typescript
// Create assignment
const { data: assignment } = await supabase
  .from('client_assignments')
  .insert({
    employer_employee_id,
    client_party_id,
    start_date,
    end_date,
    job_title,
    // ... other fields
  })
  .select()
  .single();

// If generate letter is checked
if (generateDeploymentLetter) {
  // Call deployment letter generation API
  const response = await fetch('/api/deployment-letters/generate', {
    method: 'POST',
    body: JSON.stringify({
      assignment_id: assignment.id,
      employee_id: employer_employee_id,
      client_id: client_party_id,
    }),
  });
  
  const { deployment_letter_id } = await response.json();
  
  // Update assignment with letter ID
  await supabase
    .from('client_assignments')
    .update({ deployment_letter_id })
    .eq('id', assignment.id);
}
```

---

### **5. Payroll Calculation Logic**

```
Payroll Run Created
  ↓
System gets all active employees for company
  ↓
For each employee:
  ↓
  Calculate Basic Salary
    - Get from salary_structures table
    - Use current active structure
  ↓
  Calculate Allowances
    - Sum all allowances (housing, transport, etc.)
  ↓
  Calculate Overtime
    - Get attendance records for month
    - Calculate hours over standard (e.g., 8 hours/day)
    - Multiply by overtime rate
  ↓
  Calculate Deductions
    - Sum all deductions (tax, insurance, etc.)
  ↓
  Calculate Net Salary
    Net = Basic + Allowances + Overtime - Deductions
  ↓
  Create payroll entry
  ↓
Generate Payslip PDF
  ↓
Send to employee
```

**Implementation:**
```typescript
async function calculatePayroll(companyId: string, month: Date) {
  // Get all active employees
  const { data: employees } = await supabase
    .from('employer_employees')
    .select('id, employee_id, salary')
    .eq('company_id', companyId)
    .eq('employment_status', 'active');
  
  const payrollEntries = [];
  
  for (const employee of employees) {
    // Get salary structure
    const { data: salary } = await supabase
      .from('salary_structures')
      .select('*')
      .eq('employer_employee_id', employee.id)
      .eq('status', 'active')
      .single();
    
    // Calculate overtime
    const { data: attendance } = await supabase
      .from('employee_attendance')
      .select('total_hours, overtime_hours')
      .eq('employer_employee_id', employee.id)
      .gte('attendance_date', startOfMonth(month))
      .lte('attendance_date', endOfMonth(month));
    
    const totalOvertime = attendance.reduce((sum, a) => sum + (a.overtime_hours || 0), 0);
    const overtimePay = totalOvertime * (salary.overtime_rate || 0);
    
    // Calculate net salary
    const basic = salary.basic_salary || 0;
    const allowances = Object.values(salary.allowances || {}).reduce((sum, a) => sum + a, 0);
    const deductions = Object.values(salary.deductions || {}).reduce((sum, d) => sum + d, 0);
    const net = basic + allowances + overtimePay - deductions;
    
    payrollEntries.push({
      employer_employee_id: employee.id,
      basic_salary: basic,
      allowances,
      overtime_pay: overtimePay,
      deductions,
      net_salary: net,
    });
  }
  
  return payrollEntries;
}
```

---

### **6. Document Expiry Alert Logic**

```
Daily Cron Job (runs at 9 AM)
  ↓
System queries all documents
  ↓
For each document:
  ↓
  IF expiry_date exists:
    ↓
    Calculate days until expiry
    ↓
    IF days <= 30 AND reminder not sent:
      ↓
      Create reminder record
      ↓
      Send email to:
        - Employee
        - HR Manager
      ↓
      Add notification to dashboard
```

**Implementation:**
```typescript
// Cron job: /api/cron/document-reminders
export async function GET() {
  const today = new Date();
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  
  // Find documents expiring in next 30 days
  const { data: expiringDocs } = await supabase
    .from('employee_documents')
    .select(`
      *,
      employer_employees!inner(
        employee_id,
        employer_id,
        company_id
      )
    `)
    .not('expiry_date', 'is', null)
    .lte('expiry_date', thirtyDaysFromNow.toISOString())
    .gte('expiry_date', today.toISOString())
    .eq('status', 'verified');
  
  for (const doc of expiringDocs) {
    // Check if reminder already sent
    const { data: existingReminder } = await supabase
      .from('document_reminders')
      .select('id')
      .eq('document_id', doc.id)
      .eq('reminder_type', 'expiry_warning')
      .single();
    
    if (!existingReminder) {
      // Create reminder
      await supabase
        .from('document_reminders')
        .insert({
          document_id: doc.id,
          reminder_type: 'expiry_warning',
          reminder_date: today,
          status: 'sent',
        });
      
      // Send notifications
      await sendDocumentExpiryAlert(doc);
    }
  }
}
```

---

### **7. Attendance Calculation Logic**

```
Employee Checks In
  ↓
System records:
  - check_in timestamp
  - location (if available)
  - method (web/mobile/device)
  ↓
System determines status:
  - IF check_in time > 9:00 AM: status = 'late'
  - ELSE: status = 'present'
  ↓
Employee Works
  ↓
Employee Checks Out
  ↓
System records:
  - check_out timestamp
  ↓
System calculates:
  - total_hours = (check_out - check_in) / 3600
  - IF total_hours > 8: overtime_hours = total_hours - 8
  - ELSE: overtime_hours = 0
  ↓
System updates attendance record
  ↓
System updates employee's monthly totals
```

**Implementation:**
```typescript
async function recordCheckOut(employeeId: string) {
  const today = new Date().toISOString().slice(0, 10);
  
  // Get today's attendance
  const { data: attendance } = await supabase
    .from('employee_attendance')
    .select('*')
    .eq('employer_employee_id', employeeId)
    .eq('attendance_date', today)
    .single();
  
  if (!attendance?.check_in) {
    throw new Error('No check-in recorded');
  }
  
  const checkOut = new Date();
  const checkIn = new Date(attendance.check_in);
  
  // Calculate hours
  const totalHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
  const standardHours = 8;
  const overtimeHours = totalHours > standardHours ? totalHours - standardHours : 0;
  
  // Update attendance
  await supabase
    .from('employee_attendance')
    .update({
      check_out: checkOut.toISOString(),
      total_hours: totalHours,
      overtime_hours: overtimeHours,
      status: attendance.status, // Keep existing status
    })
    .eq('id', attendance.id);
}
```

---

## 🏗️ **DATABASE DESIGN LOGIC**

### **Table Relationships**

```sql
-- Core relationship chain
companies
  └─ employer_employees (company_id)
      ├─ employee_tasks (employer_employee_id)
      ├─ employee_targets (employer_employee_id)
      ├─ employee_attendance (employer_employee_id)
      ├─ employee_documents (employer_employee_id)
      ├─ salary_structures (employer_employee_id)
      └─ client_assignments (employer_employee_id)
          └─ contracts (deployment_letter_id)
```

### **Indexing Strategy**

```sql
-- Always index foreign keys
CREATE INDEX idx_employee_tasks_employer_employee_id 
  ON employee_tasks(employer_employee_id);

-- Index frequently queried columns
CREATE INDEX idx_employee_attendance_date 
  ON employee_attendance(attendance_date);

-- Index for filtering
CREATE INDEX idx_employee_tasks_status 
  ON employee_tasks(status);

-- Composite indexes for common queries
CREATE INDEX idx_attendance_employee_date 
  ON employee_attendance(employer_employee_id, attendance_date);
```

### **Data Integrity Rules**

```sql
-- Prevent invalid data
ALTER TABLE employee_attendance
  ADD CONSTRAINT check_hours_positive 
  CHECK (total_hours >= 0);

-- Ensure unique records
ALTER TABLE employee_attendance
  ADD CONSTRAINT unique_employee_date 
  UNIQUE (employer_employee_id, attendance_date);

-- Cascade deletes
ALTER TABLE employee_tasks
  ADD CONSTRAINT fk_employee_tasks_employee
  FOREIGN KEY (employer_employee_id)
  REFERENCES employer_employees(id)
  ON DELETE CASCADE;
```

---

## 🔄 **STATE MANAGEMENT LOGIC**

### **React Query Pattern**

```typescript
// Fetch data with company scope
const { data: employees, isLoading } = useQuery({
  queryKey: ['employees', companyId, page],
  queryFn: () => fetchEmployees(page, companyId),
  enabled: !!companyId, // Only fetch when company selected
});

// Mutations with optimistic updates
const mutation = useMutation({
  mutationFn: createTask,
  onMutate: async (newTask) => {
    // Cancel outgoing queries
    await queryClient.cancelQueries(['tasks']);
    
    // Snapshot previous value
    const previousTasks = queryClient.getQueryData(['tasks']);
    
    // Optimistically update
    queryClient.setQueryData(['tasks'], (old) => [...old, newTask]);
    
    return { previousTasks };
  },
  onError: (err, newTask, context) => {
    // Rollback on error
    queryClient.setQueryData(['tasks'], context.previousTasks);
  },
  onSettled: () => {
    // Refetch to ensure consistency
    queryClient.invalidateQueries(['tasks']);
  },
});
```

---

## 🎯 **ERROR HANDLING LOGIC**

### **Standard Error Response**

```typescript
// Consistent error format
{
  error: "Human-readable error message",
  code: "ERROR_CODE", // For programmatic handling
  details?: {
    field: "Specific field error",
    // ... other details
  }
}
```

### **Error Handling Pattern**

```typescript
try {
  // Operation
} catch (error) {
  // Log for debugging
  console.error('Operation failed:', error);
  
  // Return user-friendly error
  if (error.code === 'PGRST116') {
    return NextResponse.json(
      { error: 'Resource not found', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }
  
  if (error.code === '23505') {
    return NextResponse.json(
      { error: 'This record already exists', code: 'DUPLICATE' },
      { status: 409 }
    );
  }
  
  // Generic error
  return NextResponse.json(
    { error: 'An error occurred. Please try again.', code: 'INTERNAL_ERROR' },
    { status: 500 }
  );
}
```

---

## ✅ **VALIDATION LOGIC**

### **Input Validation Pattern**

```typescript
import { z } from 'zod';

// Define schema
const assignmentSchema = z.object({
  employer_employee_id: z.string().uuid(),
  client_party_id: z.string().uuid(),
  start_date: z.string().date(),
  end_date: z.string().date().optional(),
  job_title: z.string().min(1).max(100),
});

// Validate
const result = assignmentSchema.safeParse(body);
if (!result.success) {
  return NextResponse.json(
    { 
      error: 'Validation failed',
      details: result.error.format()
    },
    { status: 400 }
  );
}
```

---

## 📊 **REPORTING LOGIC**

### **Aggregation Queries**

```typescript
// Get team performance summary
async function getTeamPerformance(companyId: string, period: DateRange) {
  const { data } = await supabase
    .from('employee_tasks')
    .select(`
      status,
      count:count(),
      employer_employees!inner(
        company_id
      )
    `)
    .eq('employer_employees.company_id', companyId)
    .gte('created_at', period.start)
    .lte('created_at', period.end)
    .group('status');
  
  return {
    completed: data.find(d => d.status === 'completed')?.count || 0,
    in_progress: data.find(d => d.status === 'in_progress')?.count || 0,
    pending: data.find(d => d.status === 'pending')?.count || 0,
  };
}
```

---

## 🔐 **SECURITY LOGIC**

### **Row Level Security (RLS)**

```sql
-- Employees can only see their own data
CREATE POLICY "Employees see own attendance"
  ON employee_attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employer_employees ee
      WHERE ee.id = employee_attendance.employer_employee_id
      AND ee.employee_id = auth.uid()
    )
  );

-- Employers can see their company's data
CREATE POLICY "Employers see company attendance"
  ON employee_attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employer_employees ee
      JOIN profiles p ON p.id = ee.employer_id
      WHERE ee.id = employee_attendance.employer_employee_id
      AND ee.company_id = p.active_company_id
    )
  );
```

---

## 🎯 **BEST PRACTICES**

### **1. Always Verify Company Scope**
```typescript
// ✅ DO THIS
const { data: userProfile } = await supabase
  .from('profiles')
  .select('active_company_id')
  .eq('id', user.id)
  .single();

// Then filter by company_id
.eq('company_id', userProfile.active_company_id)
```

### **2. Use Transactions for Related Operations**
```typescript
// ✅ DO THIS - Use transaction
await supabase.rpc('create_assignment_with_letter', {
  assignment_data,
  letter_data,
});
```

### **3. Validate Before Processing**
```typescript
// ✅ DO THIS
const validation = schema.safeParse(data);
if (!validation.success) {
  return error;
}
// Then process
```

### **4. Log Important Actions**
```typescript
// ✅ DO THIS
await supabase
  .from('audit_logs')
  .insert({
    user_id: user.id,
    action: 'created_assignment',
    resource_id: assignment.id,
    details: { ... },
  });
```

---

## 📝 **SUMMARY**

**System Logic Principles:**

1. ✅ **Company-Scoped** - All data filtered by company
2. ✅ **Role-Based** - Access based on user role
3. ✅ **Relationship-Aware** - Data properly linked
4. ✅ **Automated** - System does the work
5. ✅ **Validated** - Input always checked
6. ✅ **Secure** - RLS + RBAC
7. ✅ **Audited** - All actions logged
8. ✅ **Consistent** - Same patterns everywhere

**This is how a professional system works - logical, secure, and reliable!** ⚙️

