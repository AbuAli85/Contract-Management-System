# User Management System Setup Guide

## Overview

The User Management System provides comprehensive user administration capabilities with role-based access control (RBAC) and granular permissions. This system allows administrators to create, edit, delete users, and manage their permissions with full control.

## Features

### ✅ **Core Features**

- **User CRUD Operations** - Create, Read, Update, Delete users
- **Role-Based Access Control** - Admin, Manager, User, Viewer roles
- **Granular Permissions** - 17+ specific permissions across 4 categories
- **Bulk Operations** - Select multiple users for batch actions
- **Advanced Filtering** - Filter by role, status, department, and search
- **Sortable Tables** - Sort by any column
- **Statistics Dashboard** - Real-time user statistics
- **Audit Trail** - Complete activity logging
- **Security** - Row Level Security (RLS) policies

### 🔐 **Permission Categories**

1. **User Management** (5 permissions)
   - View, Create, Edit, Delete, Bulk Actions
2. **Contract Management** (5 permissions)
   - View, Create, Edit, Delete, Approve
3. **Dashboard & Analytics** (3 permissions)
   - View Dashboard, View Analytics, Generate Reports
4. **System Administration** (4 permissions)
   - View/Edit Settings, View Logs, Create Backups

## Database Setup

### 1. Run Database Schema

Execute the SQL schema in `database/schema.sql`:

```sql
-- This will create:
-- - users table with full user management support
-- - permissions table with all available permissions
-- - user_activity_log table for audit trail
-- - RLS policies for security
-- - Default admin user
-- - Helper functions and views
```

### 2. Default Admin User

The schema creates a default admin user:

- **Email**: `admin@example.com`
- **Role**: `admin`
- **Status**: `active`
- **Permissions**: All permissions granted

⚠️ **Important**: Change the default admin password in production!

## API Endpoints

### GET `/api/users`

Fetch all users with optional filtering:

```javascript
// Query parameters
?role=admin&status=active&department=Engineering&search=john
```

### POST `/api/users`

Create a new user:

```javascript
{
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "user",
  "status": "active",
  "department": "Engineering",
  "position": "Senior",
  "phone": "+1-555-123-4567",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

### PUT `/api/users`

Update an existing user:

```javascript
{
  "userId": "user-uuid",
  "email": "user@example.com",
  "role": "manager",
  "permissions": ["users.view", "users.create", "contracts.view"]
}
```

### DELETE `/api/users?id=user-uuid`

Delete a user (cannot delete self).

## User Roles & Permissions

### Role Hierarchy

1. **Admin** - Full system access
2. **Manager** - User management + contract approval
3. **User** - Basic contract operations
4. **Viewer** - Read-only access

### Default Role Permissions

| Role        | User Management    | Contract Management         | Dashboard                | System        |
| ----------- | ------------------ | --------------------------- | ------------------------ | ------------- |
| **Admin**   | All (5)            | All (5)                     | All (3)                  | All (4)       |
| **Manager** | View, Create, Edit | View, Create, Edit, Approve | View, Analytics, Reports | View Settings |
| **User**    | None               | View, Create, Edit          | View Dashboard           | None          |
| **Viewer**  | None               | View Only                   | View Dashboard           | None          |

## Usage Guide

### 1. Accessing User Management

Navigate to: `http://localhost:3000/en/dashboard/users`

### 2. Adding a New User

1. Click **"Add User"** button
2. Fill in required fields:
   - Email (required)
   - Full Name (optional)
   - Role (required)
   - Status (required)
3. Optional fields:
   - Department
   - Position
   - Phone
   - Avatar URL
4. Click **"Add User"**

### 3. Managing User Permissions (Admin Only)

1. Click the **Shield icon** next to any user
2. Select the user's role
3. Check/uncheck specific permissions
4. Use category checkboxes for bulk permission management
5. Click **"Save Permissions"**

### 4. Editing Users

1. Click the **Edit icon** next to any user
2. Modify user information
3. Click **"Update User"**

### 5. Deleting Users

1. Click the **Delete icon** next to any user
2. Confirm deletion in the modal
3. Click **"Delete User"**

### 6. Bulk Operations

1. Select multiple users using checkboxes
2. Choose bulk action:
   - Activate
   - Deactivate
   - Delete
3. Confirm the action

### 7. Filtering and Searching

- **Search**: Search by email, name, role, or department
- **Role Filter**: Filter by user role
- **Status Filter**: Filter by user status
- **Department Filter**: Filter by department
- **Sorting**: Click column headers to sort

## Security Features

### Row Level Security (RLS)

- Users can only view their own data
- Admins and authorized users can view all data
- Permission-based access control for all operations

### Activity Logging

All user management actions are logged:

- User creation, updates, deletions
- Permission changes
- Login attempts
- Bulk operations

### Permission Validation

- Server-side permission checking
- Role-based access control
- Granular permission system

## API Integration

### Frontend Integration

The user management system integrates with:

- Next.js 13+ App Router
- Supabase for authentication and database
- TypeScript for type safety
- Tailwind CSS for styling

### Authentication

- Uses Supabase Auth
- JWT token validation
- Session management

## Troubleshooting

### Common Issues

1. **"Insufficient permissions" error**
   - Ensure user has required permissions
   - Check user role in database

2. **User not found errors**
   - Verify user exists in `users` table
   - Check Supabase Auth integration

3. **Permission not working**
   - Verify permissions array in database
   - Check RLS policies
   - Ensure proper role assignment

### Database Queries

Check user permissions:

```sql
SELECT email, role, permissions FROM users WHERE id = 'user-uuid';
```

View activity logs:

```sql
SELECT * FROM user_activity_log WHERE user_id = 'user-uuid' ORDER BY created_at DESC;
```

Get user statistics:

```sql
SELECT * FROM user_statistics;
```

## Production Considerations

### Security

1. **Change default admin password**
2. **Enable HTTPS**
3. **Set up proper CORS policies**
4. **Implement rate limiting**
5. **Regular security audits**

### Performance

1. **Database indexing** (already included)
2. **Caching strategies**
3. **Pagination for large datasets**
4. **Optimize queries**

### Monitoring

1. **Activity log monitoring**
2. **Error tracking**
3. **Performance monitoring**
4. **User analytics**

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review database logs
3. Check browser console for errors
4. Verify API responses

## Future Enhancements

- [ ] Email verification workflow
- [ ] Two-factor authentication
- [ ] User groups/teams
- [ ] Advanced audit reporting
- [ ] API rate limiting
- [ ] User import/export
- [ ] Custom permission creation
- [ ] User session management
