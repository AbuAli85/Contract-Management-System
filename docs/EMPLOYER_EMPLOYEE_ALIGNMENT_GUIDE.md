# Employer-Employee Alignment System Guide

## Overview

This comprehensive system aligns employers with their employees, tracking assignments, tasks, targets, and attendance in one unified interface.

## Features

### 1. **Employee Management**
- View all employees under an employer
- Track employment status (active, on leave, terminated)
- Monitor job titles, departments, and work locations
- Employee codes and hire dates

### 2. **Client Assignments**
- Link employees to client assignments
- Track assignment status (active, completed, terminated)
- Monitor assignment dates and locations
- View client information for each assignment
- Generate deployment letters for assignments

### 3. **Task Management**
- Assign tasks to employees
- Track task status (pending, in progress, completed)
- Set priorities (low, medium, high, urgent)
- Monitor due dates and completion
- Task comments and updates

### 4. **Targets & Goals**
- Set performance targets for employees
- Track progress percentages
- Monitor target completion dates
- Different target types (performance, sales, quality, etc.)
- Progress tracking over time

### 5. **Attendance Tracking**
- Record check-in/check-out times
- Track attendance status (present, absent, late, leave)
- Monitor total hours and overtime
- Location-based attendance
- Approval workflow

## How to Use

### Accessing the Alignment Dashboard

1. Navigate to **HR Management → Alignment Overview** in the sidebar
2. Or go directly to `/hr/alignment`

### View Modes

#### Overview Mode
- Quick stats for all employees
- Summary of assignments, tasks, and targets
- Employee cards with key information

#### Detailed View
- Expandable employee details
- Full task lists
- Complete target progress
- Assignment history

### Key Actions

#### View Employee Details
1. Click "View Details" on any employee card
2. See all assignments, tasks, and targets
3. Monitor progress and status

#### Filter and Search
- Use tabs to switch between:
  - **Employees & Assignments**: See all employees with their client assignments
  - **Tasks Overview**: View all tasks across employees
  - **Targets Overview**: Monitor all targets and goals

#### Navigate to Related Features
- Click assignment links to view full assignment details
- Access task management from employee details
- View target progress and update values

## Data Relationships

```
Employer
  └── Employer-Employee Relationship
       ├── Client Assignments
       │    └── Deployment Letters
       ├── Tasks
       │    └── Task Comments
       ├── Targets
       │    └── Target Progress
       └── Attendance Records
```

## API Endpoints

### Get Alignment Data
```
GET /api/hr/employer-employees/alignment?employer_id={id}
```

Returns:
- All employees for the employer
- Their active assignments
- All tasks (pending and completed)
- Active targets with progress
- Calculated statistics

## Statistics Tracked

For each employee:
- **Active Assignments**: Number of current client assignments
- **Tasks Progress**: Completed vs total tasks
- **Active Targets**: Number of active goals
- **Targets Progress**: Average progress percentage

## Best Practices

1. **Regular Updates**: Keep assignments, tasks, and targets updated
2. **Clear Communication**: Use task comments for updates
3. **Progress Tracking**: Regularly update target progress
4. **Status Management**: Keep assignment statuses current
5. **Documentation**: Add notes to assignments and tasks

## Integration Points

### With Other HR Features

- **Documents**: Link documents to employees and assignments
- **Deployment Letters**: Generate from assignments
- **Team Management**: Manage employee permissions and settings
- **Attendance**: Track working hours per assignment
- **Reports**: Generate comprehensive HR reports

## Permissions

- **Employers**: Can view and manage their own employees
- **Employees**: Can view their own records
- **Admins**: Full access to all data
- **Managers**: Can view team data

## Troubleshooting

### No Data Showing
- Check if you have employees assigned
- Verify employer_id matches your user
- Check RLS policies if using Supabase

### Missing Assignments
- Ensure assignments are linked to employer_employee_id
- Check assignment status (only active shown by default)
- Verify client party exists

### Tasks Not Appearing
- Confirm tasks are assigned to correct employee
- Check task status filters
- Verify employer_employee_id matches

## Next Steps

1. Set up employee records
2. Create client assignments
3. Assign tasks and set targets
4. Track attendance
5. Monitor progress through the alignment dashboard

