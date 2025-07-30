# 🛡️ Roles & Permissions System

## Overview

The Contract Management System now features a comprehensive **Roles & Permissions** management system that provides full administrative control over user access and system capabilities. This system is designed with enterprise-grade security and flexibility in mind.

## 🏗️ Architecture

### Database Schema

#### **Roles Table**

```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,           -- Internal role identifier
    display_name VARCHAR(100) NOT NULL,         -- Human-readable name
    description TEXT,                           -- Role description
    permissions TEXT[] DEFAULT '{}',            -- Array of permission IDs
    is_system BOOLEAN DEFAULT FALSE,            -- System roles cannot be deleted
    is_active BOOLEAN DEFAULT TRUE,             -- Active/inactive status
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);
```

#### **Permissions Table**

```sql
CREATE TABLE permissions (
    id VARCHAR(100) PRIMARY KEY,                -- Permission identifier
    name VARCHAR(255) NOT NULL,                 -- Human-readable name
    description TEXT,                           -- Permission description
    category VARCHAR(100) NOT NULL,             -- Permission category
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **Role Statistics View**

```sql
CREATE VIEW role_statistics AS
SELECT
    r.id, r.name, r.display_name, r.description,
    r.permissions, r.is_system, r.is_active,
    COUNT(u.id) as user_count,
    r.created_at, r.updated_at
FROM roles r
LEFT JOIN users u ON u.role = r.name
WHERE r.is_active = TRUE
GROUP BY r.id, r.name, r.display_name, r.description,
         r.permissions, r.is_system, r.is_active,
         r.created_at, r.updated_at
ORDER BY r.name;
```

## 🔐 Default System Roles

### **1. Admin** 👑

- **Description**: Full system access with all permissions
- **Permissions**: All system permissions
- **User Count**: 1 (system administrator)
- **Status**: System role (cannot be deleted)

### **2. Manager** 💼

- **Description**: User management and contract approval
- **Permissions**:
  - User Management: View, Create, Edit
  - Contract Management: View, Create, Edit, Approve
  - Dashboard & Analytics: View dashboard, analytics, reports
  - Promoter Management: View, Create, Edit
  - Party Management: View, Create, Edit
- **User Count**: 2
- **Status**: System role (cannot be deleted)

### **3. User** 👤

- **Description**: Basic contract operations
- **Permissions**:
  - Contract Management: View, Create, Edit
  - Dashboard: View dashboard
  - Promoter Management: View
  - Party Management: View
- **User Count**: 8
- **Status**: System role (cannot be deleted)

### **4. Viewer** 👁️

- **Description**: Read-only access
- **Permissions**:
  - Contract Management: View
  - Dashboard: View dashboard
  - Promoter Management: View
  - Party Management: View
- **User Count**: 1
- **Status**: System role (cannot be deleted)

## 🔑 Permission Categories

### **1. User Management**

- `users.view` - View Users
- `users.create` - Create Users
- `users.edit` - Edit Users
- `users.delete` - Delete Users
- `users.bulk` - Bulk Actions

### **2. Promoter Management**

- `promoters.view` - View Promoters
- `promoters.create` - Add Promoters
- `promoters.edit` - Edit Promoters
- `promoters.delete` - Delete Promoters
- `promoters.bulk` - Bulk Delete Promoters
- `promoters.export` - Export Promoters
- `promoters.archive` - Archive Promoters

### **3. Party Management**

- `parties.view` - View Parties
- `parties.create` - Add Parties
- `parties.edit` - Edit Parties
- `parties.delete` - Delete Parties
- `parties.bulk` - Bulk Delete Parties
- `parties.export` - Export Parties
- `parties.archive` - Archive Parties

### **4. Contract Management**

- `contracts.view` - View Contracts
- `contracts.create` - Create Contracts
- `contracts.edit` - Edit Contracts
- `contracts.delete` - Delete Contracts
- `contracts.approve` - Approve Contracts
- `contracts.export` - Export Contracts
- `contracts.archive` - Archive Contracts

### **5. Dashboard & Analytics**

- `dashboard.view` - View Dashboard
- `analytics.view` - View Analytics
- `reports.generate` - Generate Reports

### **6. System Administration**

- `settings.view` - View Settings
- `settings.edit` - Edit Settings
- `logs.view` - View Logs
- `backup.create` - Create Backups
- `system.restore` - Restore System

## 🎯 Features

### **1. Role Management**

- ✅ **Create Custom Roles**: Administrators can create new roles with specific permissions
- ✅ **Edit Role Permissions**: Modify existing role permissions (except system roles)
- ✅ **Delete Roles**: Remove custom roles (with safety checks)
- ✅ **Role Statistics**: View user counts and role usage
- ✅ **System Role Protection**: System roles cannot be modified or deleted

### **2. Permission Management**

- ✅ **Granular Permissions**: Fine-grained control over system access
- ✅ **Category Organization**: Permissions organized by functional areas
- ✅ **Permission Search**: Find permissions quickly with search functionality
- ✅ **Permission Filtering**: Filter by category for better organization

### **3. User Interface**

- ✅ **Professional Design**: Modern, responsive interface with professional styling
- ✅ **Tabbed Interface**: Separate tabs for Roles Overview and Permissions Management
- ✅ **Interactive Cards**: Role cards with hover effects and quick actions
- ✅ **Modal Dialogs**: Clean dialogs for create, edit, and delete operations
- ✅ **Real-time Updates**: Immediate feedback and data refresh

### **4. Security Features**

- ✅ **Admin-Only Access**: Only administrators can manage roles and permissions
- ✅ **Audit Logging**: All role changes are logged for security tracking
- ✅ **Permission Validation**: Server-side validation of all permission changes
- ✅ **Role Conflict Prevention**: Prevents creation of duplicate roles
- ✅ **User Impact Warnings**: Warns before deleting roles with assigned users

### **5. Export & Reporting**

- ✅ **CSV Export**: Export role data for reporting and analysis
- ✅ **Role Statistics**: Comprehensive role usage statistics
- ✅ **User Impact Analysis**: Shows how many users are affected by role changes

## 🚀 API Endpoints

### **Roles Management**

- `GET /api/users/roles` - Fetch all roles with user counts
- `POST /api/users/roles` - Create new role
- `GET /api/users/roles/[id]` - Fetch specific role
- `PUT /api/users/roles/[id]` - Update role
- `DELETE /api/users/roles/[id]` - Delete role

### **Permissions Management**

- `GET /api/users/permissions` - Fetch all permissions

### **User Activity Logging**

- `GET /api/users/activity` - Fetch user activity logs

## 🔧 Database Functions

### **Permission Checking**

```sql
-- Check if user has specific permission
SELECT user_has_permission('user-uuid', 'contracts.create');

-- Get all permissions for a role
SELECT get_role_permissions('admin');
```

### **Role Statistics**

```sql
-- Get role statistics with user counts
SELECT * FROM role_statistics;
```

## 🎨 UI Components

### **Role Cards**

- **Visual Indicators**: Color-coded role types with icons
- **Quick Actions**: Edit and delete buttons on hover
- **Permission Summary**: Shows permission count and preview
- **User Count**: Displays number of users assigned to role

### **Permission Management**

- **Category Tabs**: Organized by functional areas
- **Search & Filter**: Find permissions quickly
- **Toggle Switches**: Easy permission assignment
- **System Indicators**: Shows which permissions are system-level

### **Modal Dialogs**

- **Create Role**: Form with name, description, and permission selection
- **Edit Role**: Modify existing role details and permissions
- **Delete Confirmation**: Safety dialog with user impact warning

## 📊 Usage Examples

### **Creating a Custom Role**

1. Navigate to "User Management" → "Roles & Permissions"
2. Click "Create Role" button
3. Enter role name and description
4. Select permissions using toggle switches
5. Click "Create Role"

### **Modifying Role Permissions**

1. Hover over a role card
2. Click the edit (pencil) icon
3. Modify role details and permissions
4. Click "Update Role"

### **Exporting Role Data**

1. Click "Export" button
2. CSV file will be downloaded with role information
3. Use for reporting or analysis

## 🔒 Security Considerations

### **Access Control**

- Only users with `admin` role can access role management
- All API endpoints validate admin permissions
- System roles are protected from modification

### **Data Validation**

- Server-side validation of all role data
- Permission existence verification
- Role name uniqueness enforcement

### **Audit Trail**

- All role changes are logged in `user_activity_log`
- Includes user ID, action type, and details
- Timestamps for all modifications

## 🚀 Benefits

### **For Administrators**

- **Full Control**: Complete control over user access and permissions
- **Flexibility**: Create custom roles for specific business needs
- **Security**: Granular permission control for enhanced security
- **Audit**: Complete audit trail of all role changes

### **For Users**

- **Clear Access**: Understand exactly what they can and cannot do
- **Consistent Experience**: Role-based UI that adapts to permissions
- **Security**: Protected from unauthorized access

### **For the System**

- **Scalability**: Easy to add new permissions and roles
- **Maintainability**: Centralized permission management
- **Performance**: Efficient permission checking with database functions
- **Compliance**: Audit trail supports compliance requirements

## 🔄 Future Enhancements

### **Planned Features**

- **Role Templates**: Pre-defined role templates for common use cases
- **Permission Groups**: Group permissions for easier management
- **Role Inheritance**: Hierarchical role system
- **Time-based Permissions**: Temporary permission grants
- **Permission Analytics**: Usage analytics for permissions

### **Integration Opportunities**

- **SSO Integration**: Role mapping from external identity providers
- **API Permissions**: Granular API access control
- **Workflow Integration**: Role-based approval workflows
- **Notification System**: Role-based notification preferences

---

## 📝 Implementation Notes

This Roles & Permissions system is fully integrated with the existing authentication and authorization infrastructure. It provides a solid foundation for enterprise-grade access control while maintaining flexibility for future enhancements.

The system is designed to be:

- **Secure**: Multiple layers of security validation
- **Scalable**: Efficient database design for large user bases
- **Maintainable**: Clean code structure and comprehensive documentation
- **User-Friendly**: Intuitive interface for administrators
- **Auditable**: Complete tracking of all changes

**Ready for Production Use** ✅
