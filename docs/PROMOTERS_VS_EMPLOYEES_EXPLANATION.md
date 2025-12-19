# 📚 Promoters vs Employees: Understanding the Difference

## 🎯 **QUICK SUMMARY**

**Promoters** and **Employees** are two different data models in the system that represent the same people, but serve different purposes:

- **Promoters** = **Contract/Field Workers** (from the original contract management system)
- **Employees** = **Team Members** (for attendance, tasks, targets, permissions)

**Now they're unified!** Promoters are automatically treated as employees when needed.

---

## 📊 **DETAILED COMPARISON**

### **1. PROMOTERS TABLE** (`promoters`)

**Purpose**: Original contract management system - tracks field workers/promoters for contracts

**Key Characteristics**:
- ✅ **Business Entity**: Linked to `parties` table (business entities)
- ✅ **Contract-Focused**: Designed for contract assignments
- ✅ **Field Workers**: Represents promoters working on contracts
- ✅ **Rich Data**: 67+ fields including documents, personal info, financial details

**Key Fields**:
```sql
- id (UUID)
- name_en, name_ar (bilingual names)
- email, phone, mobile_number
- employer_id → parties(id)  -- Links to business entity
- job_title, department, work_location
- status (active, inactive, pending, suspended)
- Documents: id_card, passport, visa, work_permit
- Financial: bank details, tax_id
- Personal: nationality, date_of_birth, gender
- Emergency contacts
- Created/updated timestamps
```

**Relationships**:
- `employer_id` → `parties(id)` (business entity/employer)
- Used in `contracts` table (promoter assignments)

---

### **2. EMPLOYER_EMPLOYEES TABLE** (`employer_employees`)

**Purpose**: Team management system - tracks employees for attendance, tasks, targets, permissions

**Key Characteristics**:
- ✅ **User Management**: Linked to `profiles` table (system users)
- ✅ **Feature-Focused**: Designed for attendance, tasks, targets, permissions
- ✅ **Team Members**: Represents employees in the team management system
- ✅ **Employment Details**: Salary, hire date, employment type, status

**Key Fields**:
```sql
- id (UUID)
- employer_id → profiles(id)  -- Profile ID of employer
- employee_id → profiles(id)  -- Profile ID of employee (NOT promoter ID!)
- company_id → companies(id)  -- Company for multi-company support
- party_id → parties(id)  -- Links to business entity
- promoter_id → promoters(id)  -- Optional link to promoter
- employee_code (auto-generated: EMP-YYYYMMDD-XXXX)
- job_title, department
- employment_type (full_time, part_time, contract, etc.)
- employment_status (active, inactive, on_leave, terminated)
- hire_date, termination_date
- salary, currency
- work_location, notes
- reporting_manager_id → profiles(id)
- Created/updated timestamps
```

**Relationships**:
- `employer_id` → `profiles(id)` (employer's profile)
- `employee_id` → `profiles(id)` (employee's profile)
- `company_id` → `companies(id)` (company context)
- `party_id` → `parties(id)` (business entity link)
- `promoter_id` → `promoters(id)` (optional link)

---

## 🔄 **THE RELATIONSHIP**

### **How They Connect**

```
┌─────────────────┐
│   PROMOTERS     │  (Contract/Field Workers)
│                 │
│ - employer_id   │──┐
│   → parties     │  │
│                 │  │
│ - email         │  │  ┌──────────────────────┐
│ - name_en       │  │  │  EMPLOYER_EMPLOYEES │  (Team Members)
└─────────────────┘  │  │                      │
                     │  │ - employer_id        │
                     │  │   → profiles         │
┌─────────────────┐  │  │ - employee_id       │
│    PROFILES     │  │  │   → profiles         │
│                 │  │  │ - promoter_id        │──┐
│ - email         │◄─┼──│   → promoters        │  │
│ - full_name     │  │  │ - party_id           │◄─┘
│ - id            │  │  │   → parties          │
└─────────────────┘  │  └──────────────────────┘
                      │
┌─────────────────┐  │
│    PARTIES      │◄─┘
│                 │
│ - contact_email │
│ - type          │
│ - name_en       │
└─────────────────┘
```

### **The Link Process**

1. **Promoter** exists in `promoters` table
   - Has `employer_id` → `parties(id)`
   - Has `email`, `name_en`, etc.

2. **Profile** exists in `profiles` table
   - Matches promoter's `email`
   - Has `full_name`, `id`, etc.

3. **Employer Profile** exists
   - Matches party's `contact_email`
   - Represents the employer

4. **Employer_Employee** record created
   - `employer_id` → employer's profile ID
   - `employee_id` → employee's profile ID
   - `promoter_id` → promoter's ID (optional link)
   - `party_id` → party's ID (from promoter's employer_id)

---

## 🎯 **KEY DIFFERENCES**

| Aspect | **Promoters** | **Employees** |
|--------|--------------|---------------|
| **Purpose** | Contract/Field Workers | Team Members |
| **Linked To** | `parties` (business entities) | `profiles` (system users) |
| **Primary Use** | Contract assignments | Attendance, tasks, targets |
| **Data Model** | Business/contract focused | User/employment focused |
| **Fields** | 67+ fields (documents, financial, personal) | Employment details (salary, hire date, etc.) |
| **Status** | `active`, `inactive`, `pending`, `suspended` | `active`, `inactive`, `on_leave`, `terminated` |
| **Code** | No code | Auto-generated `employee_code` |
| **Required** | Can exist standalone | Requires profile match |

---

## 🔧 **WHY TWO TABLES?**

### **Historical Reasons**

1. **Promoters** came first
   - Original contract management system
   - Designed for field workers on contracts
   - Linked to business entities (`parties`)

2. **Employees** added later
   - Team management features needed
   - Attendance, tasks, targets, permissions
   - Linked to system users (`profiles`)

### **Current State**

**Before**: Promoters and employees were separate
- Promoters couldn't access team features
- Required manual conversion

**Now**: Unified system
- Promoters automatically become employees when needed
- Auto-conversion on feature access
- Seamless experience

---

## ✨ **HOW IT WORKS NOW**

### **Auto-Conversion Process**

When a **promoter** accesses a feature (attendance, tasks, etc.):

1. System detects `promoter_`-prefixed ID
2. Finds matching profile by email
3. Finds employer profile from party
4. Creates `employer_employee` record automatically
5. Feature works immediately

### **Result**

- ✅ Promoters treated as full employees
- ✅ No manual conversion needed
- ✅ All features available
- ✅ Unified team experience

---

## 📝 **EXAMPLE SCENARIO**

### **Scenario**: Muhammad Junaid (Promoter)

**In Promoters Table**:
```sql
id: aa63d142-3627-4b74-9411-0285ab12d930
email: junaidshahid691@gmail.com
name_en: Muhammad Junaid
employer_id: [party_id] → Digital Morph party
status: active
```

**In Profiles Table**:
```sql
id: [profile_id]
email: junaidshahid691@gmail.com  -- Matches promoter email
full_name: Muhammad Junaid
```

**When Accessing Attendance**:
1. System receives: `promoter_aa63d142-3627-4b74-9411-0285ab12d930`
2. Auto-creates `employer_employee` record:
   ```sql
   employer_id: [employer_profile_id]
   employee_id: [profile_id]  -- From matching email
   promoter_id: aa63d142-3627-4b74-9411-0285ab12d930
   party_id: [party_id]  -- From promoter's employer_id
   employee_code: EMP-20251219-XXXX
   employment_status: active
   ```
3. Attendance feature works immediately!

---

## 🎯 **SUMMARY**

**Promoters** = Contract/Field Workers (original system)
**Employees** = Team Members (team management features)

**They represent the same people**, but:
- Different data models
- Different purposes
- Different relationships

**Now unified**: Promoters automatically become employees when accessing team features!

---

## 💡 **KEY TAKEAWAYS**

1. **Promoters** are contract-focused (business entities)
2. **Employees** are feature-focused (system users)
3. **They're linked** via email matching and profiles
4. **Auto-conversion** makes them seamless
5. **Same people**, different representations

**The system now treats them the same!** 🎉

