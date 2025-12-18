# Employee Groups & Automated Attendance Schedules

## Overview

The enhanced automated attendance schedule system supports **single and bulk employee assignments** with **location-based grouping** for professional workforce management.

## Key Features

### 1. **Employee Assignment Types**

#### **All Employees**
- Send schedule to all active employees in the company
- Simple one-click setup
- Best for company-wide policies

#### **Selected Employees**
- Choose individual employees
- Bulk selection with search and filters
- Select by department, job title, or name
- Perfect for specific teams or roles

#### **Employee Groups**
- Pre-configured groups (location, department, project, custom)
- Assign schedule to entire groups at once
- Groups can contain multiple employees
- Easy to manage and update

#### **Location-Based**
- Automatically assign based on office location
- Employees in location groups receive schedules
- Perfect for multi-location companies
- Automatic grouping by workplace

### 2. **Employee Groups**

#### **Group Types**

1. **Location-Based Groups**
   - Linked to office locations
   - Auto-created for each office location
   - Employees assigned to location groups
   - Example: "Grand Mall Muscat Team", "City Center Muscat Team"

2. **Department Groups**
   - Organized by department
   - Example: "Sales Team", "Marketing Team", "Operations"

3. **Project Groups**
   - Temporary groups for specific projects
   - Example: "Q1 Campaign Team", "Product Launch Team"

4. **Custom Groups**
   - Flexible grouping for any criteria
   - Custom naming and organization

#### **Group Management**

- **Create Groups**: Organize employees by location, department, or custom criteria
- **Assign Employees**: Single or bulk assignment to groups
- **Default Times**: Set default check-in/check-out times per group
- **View Members**: See all employees in each group
- **Edit/Delete**: Update groups as needed

### 3. **Professional Schedule Management**

#### **Formal Structure**

1. **Schedule Configuration**
   - Name and description
   - Location settings (office location or custom)
   - Time settings (check-in, check-out, validity)
   - Active days (Monday-Sunday)

2. **Employee Assignment**
   - Choose assignment type (All, Selected, Groups, Location-Based)
   - Visual employee selector with search
   - Bulk selection tools
   - Group-based assignment

3. **Notification Settings**
   - Email and SMS options
   - Send-before timing
   - Automatic distribution

## Best Practices

### **For Single Location Companies**

1. Create one location-based group
2. Assign all employees to that group
3. Create schedule with "Location-Based" assignment
4. All employees at that location automatically receive links

### **For Multi-Location Companies**

1. Create location groups for each office:
   - "Grand Mall Muscat Team"
   - "City Center Muscat Team"
   - "Al Mouj Team"
2. Assign employees to their respective location groups
3. Create separate schedules for each location
4. Use "Location-Based" assignment type

### **For Department-Based Schedules**

1. Create department groups:
   - "Sales Department"
   - "Marketing Department"
   - "Operations Department"
2. Assign employees to department groups
3. Create schedules with "Groups" assignment type
4. Select relevant department groups

### **For Mixed Scenarios**

1. Create multiple groups (location + department)
2. Employees can belong to multiple groups
3. Use "Selected" assignment for specific employees
4. Use "Groups" for bulk assignment

## Workflow Examples

### **Example 1: Grand Mall Muscat Team**

**Setup:**
1. Create office location: "Grand Mall Muscat"
2. System auto-creates group: "Grand Mall Muscat Team"
3. Assign employees working at Grand Mall to this group
4. Create schedule:
   - Location: Grand Mall Muscat
   - Assignment: Location-Based
   - Check-in: 09:00
   - Days: Monday-Friday

**Result:**
- All employees in "Grand Mall Muscat Team" receive daily check-in links
- Links are valid only at Grand Mall location
- Automatic daily generation and distribution

### **Example 2: Sales Team Schedule**

**Setup:**
1. Create department group: "Sales Department"
2. Assign all sales employees to this group
3. Create schedule:
   - Location: Main Office
   - Assignment: Groups → "Sales Department"
   - Check-in: 08:30
   - Check-out: 17:30

**Result:**
- All sales employees receive check-in and check-out links
- Links sent 15 minutes before each time
- Automatic daily generation

### **Example 3: Custom Project Team**

**Setup:**
1. Create project group: "Q1 Campaign Team"
2. Assign project members (from different departments)
3. Create schedule:
   - Location: Client Site (custom coordinates)
   - Assignment: Groups → "Q1 Campaign Team"
   - Check-in: 10:00
   - Days: Monday-Saturday (project timeline)

**Result:**
- Only project team members receive links
- Links valid at client site location
- Schedule active during project period

## Database Schema

### **employee_attendance_groups**
- Stores group definitions
- Links to office locations (if location-based)
- Tracks employee count
- Default times per group

### **employee_group_assignments**
- Links employees to groups
- Many-to-many relationship
- Tracks assignment metadata

### **attendance_link_schedules**
- Enhanced with `assignment_type` and `employee_group_ids`
- Supports all assignment types
- Backward compatible with existing schedules

## API Endpoints

### **Employee Groups**
- `GET /api/employer/attendance-groups` - List all groups
- `POST /api/employer/attendance-groups` - Create group
- `GET /api/employer/attendance-groups/[id]` - Get group details
- `PUT /api/employer/attendance-groups/[id]` - Update group
- `DELETE /api/employer/attendance-groups/[id]` - Delete group

### **Schedules**
- Enhanced with group support
- `assignment_type` field: 'all', 'selected', 'groups', 'location_based'
- `employee_group_ids` array for group assignments

## Migration Steps

1. **Run Migrations:**
   ```bash
   # Apply both migrations
   - 20250112_create_automated_attendance_schedules.sql
   - 20250112_add_employee_groups_to_schedules.sql
   ```

2. **Create Initial Groups:**
   - Navigate to **HR Management > Employee Groups**
   - Create location-based groups for each office
   - Or use auto-create function (if implemented)

3. **Assign Employees:**
   - Use the employee selector
   - Assign employees to appropriate groups
   - Can assign to multiple groups

4. **Create Schedules:**
   - Use new assignment types
   - Select groups or individual employees
   - Configure location and time settings

## Benefits

1. **Efficiency**: Bulk assignment saves time
2. **Organization**: Groups provide clear structure
3. **Flexibility**: Multiple assignment types for different needs
4. **Scalability**: Easy to manage large teams
5. **Professional**: Formal structure for enterprise use
6. **Location-Based**: Automatic assignment by workplace
7. **Maintainability**: Update groups, schedules update automatically

## Future Enhancements

- [ ] Schedule templates
- [ ] Bulk schedule creation
- [ ] Import/export employee groups
- [ ] Schedule analytics per group
- [ ] Group-based reporting
- [ ] Multi-language support
- [ ] Mobile app notifications

