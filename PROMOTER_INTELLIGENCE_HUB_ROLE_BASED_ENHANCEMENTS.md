# 🎯 Promoter Intelligence Hub - Role-Based Enhancements

## ✅ Implementation Complete

The Promoter Intelligence Hub has been enhanced with comprehensive role-based access control (RBAC) to support both **Employers** and **Employees** with different views, permissions, and features.

---

## 🔐 Role-Based System Architecture

### **User Roles Supported:**

1. **Employer** - Companies/Organizations managing promoters
   - Can view and manage their assigned promoters
   - Full dashboard with analytics
   - Can create, edit, export promoters
   - Can manage assignments

2. **Employee** - Individual promoters/workers
   - View-only access to their own profile
   - Document status tracking
   - Self-service features

3. **Admin** - Full system access
   - Can view all promoters
   - All management features

4. **Manager** - Limited administrative access
   - Can view and manage promoters
   - Cannot delete

5. **Viewer** - Read-only access
   - Limited viewing capabilities

---

## 🆕 New Components Created

### 1. **`promoters-role-context.tsx`**
**Purpose:** Central role management and permission context

**Features:**
- ✅ Detects user role (employer, employee, admin, manager, viewer)
- ✅ Extracts employer_id and company_id from user metadata
- ✅ Provides permission flags (canCreate, canEdit, canDelete, canExport, etc.)
- ✅ Role-based filtering support
- ✅ Session and user metadata integration

**Key Functions:**
- `useRoleContext()` - Hook to access role information
- `RoleContextProvider` - Wraps the application with role context

---

### 2. **`promoters-employee-view.tsx`**
**Purpose:** Self-service view for employees to see their own profile

**Features:**
- ✅ Personal profile display
- ✅ Document status (ID Card, Passport) with visual indicators
- ✅ Contact information
- ✅ Assignment details
- ✅ Action required alerts
- ✅ Document expiry warnings
- ✅ Edit profile button (if permissions allow)
- ✅ Download documents option

**UI Elements:**
- Profile header with avatar
- Status badges (Active, Critical, Needs Attention)
- Document status cards with progress indicators
- Action alerts for expired/expiring documents

---

### 3. **`promoters-employer-dashboard.tsx`**
**Purpose:** Comprehensive dashboard for employers managing their workforce

**Features:**
- ✅ Employer-specific metrics
- ✅ Workforce overview cards
- ✅ Compliance rate tracking
- ✅ Document expiry monitoring
- ✅ Quick action buttons (Add, Export, Analytics)
- ✅ Enhanced charts and visualizations
- ✅ Role-based data filtering

**Metrics Displayed:**
- Total promoters assigned
- Active promoters count
- Documents expiring count
- Critical issues count
- Compliance rate percentage

---

## 🔄 Enhanced Components

### **`enhanced-promoters-view-refactored.tsx`**

**Role-Based Enhancements:**

1. **Role Detection Integration**
   - Wrapped with `RoleContextProvider`
   - Uses `useRoleContext()` throughout
   - Conditional rendering based on role

2. **Role-Based Filtering**
   - Employers see only their assigned promoters (filtered by `employerId`)
   - Employees see only their own profile
   - Admins see all promoters
   - API calls include role-based filter parameters

3. **Conditional UI Rendering**
   - **Employee View:** Shows `PromotersEmployeeView` component
   - **Employer View:** Shows full dashboard with filters, bulk actions, analytics
   - **Admin View:** Full access to all features

4. **Permission-Based Actions**
   - Create button only shown if `canCreate`
   - Edit button only shown if `canEdit`
   - Delete button only shown if `canDelete`
   - Export button only shown if `canExport`
   - Bulk actions only shown if `canBulkActions`

5. **Role-Based Header**
   - Employees: Simple "My Profile" header
   - Employers/Admins: Full premium header with metrics

---

### **`promoters-table.tsx`**

**Role-Based Enhancements:**

1. **Optional Callbacks**
   - `onEditPromoter` is now optional
   - `onAddPromoter` is now optional
   - Conditional rendering based on permissions

2. **Permission Checks**
   - Edit actions only available if `canEdit`
   - Add actions only available if `canCreate`
   - Inline editing only enabled if `canEdit`

---

### **`promoters-table-row.tsx`**

**Role-Based Enhancements:**

1. **Optional Edit Handler**
   - `onEdit` is now optional
   - Shows permission error if edit attempted without permission
   - Graceful handling of missing permissions

---

## 🔍 Role-Based Filtering Logic

### **API Filter Parameters:**

```typescript
// For Employers
if (roleContext.employerId) {
  params.set('employerId', roleContext.employerId);
}

// For Employees
if (roleContext.isEmployee && roleContext.userId) {
  params.set('userId', roleContext.userId);
}
```

### **Data Filtering:**

- **Employers:** See only promoters where `employer_id === roleContext.employerId`
- **Employees:** See only their own profile where `id === roleContext.userId`
- **Admins:** See all promoters (no filtering)

---

## 🎨 UI/UX Enhancements

### **Employee View:**
- Clean, focused profile view
- Document status prominently displayed
- Action alerts for expired/expiring documents
- Limited navigation (no bulk actions, no filters)
- Self-service document download

### **Employer View:**
- Full dashboard with metrics
- Advanced filtering capabilities
- Bulk actions support
- Analytics and charts
- Export functionality
- Assignment management

### **Admin View:**
- Full system access
- All features enabled
- Can view all promoters across all employers
- System-wide analytics

---

## 🔐 Permission Matrix

| Feature | Employee | Employer | Manager | Admin |
|---------|----------|----------|---------|-------|
| View Own Profile | ✅ | ✅ | ✅ | ✅ |
| View Assigned Promoters | ❌ | ✅ | ✅ | ✅ |
| View All Promoters | ❌ | ❌ | ✅ | ✅ |
| Create Promoters | ❌ | ✅ | ✅ | ✅ |
| Edit Promoters | ❌ | ✅ | ✅ | ✅ |
| Delete Promoters | ❌ | ❌ | ❌ | ✅ |
| Export Data | ❌ | ✅ | ✅ | ✅ |
| Bulk Actions | ❌ | ✅ | ✅ | ✅ |
| Analytics | ❌ | ✅ | ✅ | ✅ |
| Manage Assignments | ❌ | ✅ | ✅ | ✅ |

---

## 📋 Implementation Checklist

- ✅ Role detection and context provider
- ✅ Employee self-service view
- ✅ Employer dashboard
- ✅ Role-based filtering in API calls
- ✅ Permission-based UI rendering
- ✅ Conditional action buttons
- ✅ Role-specific headers
- ✅ Permission checks in all components
- ✅ Optional callbacks for restricted actions
- ✅ Error handling for permission violations
- ✅ TypeScript type safety
- ✅ No linter errors

---

## 🚀 Usage Examples

### **For Employees:**
```typescript
// Employee sees only their profile
<PromotersEmployeeView
  promoter={myProfile}
  onEdit={canEdit ? handleEdit : undefined}
  onDownloadDocuments={handleDownload}
/>
```

### **For Employers:**
```typescript
// Employer sees their workforce dashboard
<PromotersEmployerDashboard
  promoters={assignedPromoters}
  metrics={employerMetrics}
  onAddPromoter={canCreate ? handleAdd : undefined}
  onExport={canExport ? handleExport : undefined}
/>
```

### **Role Context Usage:**
```typescript
const roleContext = useRoleContext();

if (roleContext.isEmployee) {
  // Show employee view
} else if (roleContext.isEmployer) {
  // Show employer dashboard
} else {
  // Show admin view
}
```

---

## 🔧 Configuration

### **User Metadata Required:**

For **Employers:**
```json
{
  "role": "employer",
  "employer_id": "uuid-here",
  "company_id": "uuid-here"
}
```

For **Employees:**
```json
{
  "role": "promoter" | "employee",
  "user_id": "uuid-here"
}
```

---

## ✅ Testing Checklist

- [x] Employee can view their own profile
- [x] Employee cannot see other promoters
- [x] Employer can view their assigned promoters
- [x] Employer cannot see other employers' promoters
- [x] Admin can view all promoters
- [x] Permissions are correctly enforced
- [x] UI elements show/hide based on permissions
- [x] API filtering works correctly
- [x] No TypeScript errors
- [x] No linter errors

---

## 📝 Notes

1. **Role Detection:** The system checks user metadata from both `user.user_metadata` and `session.user.user_metadata` for maximum compatibility.

2. **Fallback Behavior:** If role cannot be determined, user defaults to "viewer" role with minimal permissions.

3. **Permission Inheritance:** Admins and Managers automatically get employer-level permissions.

4. **Data Security:** All filtering happens server-side to prevent data leakage.

---

## 🎯 Status

**Status:** ✅ **FULLY IMPLEMENTED AND TESTED**

**Version:** Role-Based Edition 1.0  
**Production Ready:** ✅ YES  
**All Tests Passing:** ✅ YES  
**No Linter Errors:** ✅ YES

---

**Last Updated:** Current Date  
**Status:** Production Ready 🚀

