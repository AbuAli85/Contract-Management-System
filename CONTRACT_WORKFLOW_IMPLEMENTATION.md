# Contract Status Workflow Implementation Guide

## 📋 Overview

This guide documents the complete contract status workflow implementation with proper pending → approved → active → expired states.

## 🔄 Contract Workflow States

### Status Transitions

```
draft → pending → approved → active → expired/completed/terminated
                      ↓
                  rejected
```

### Status Definitions

| Status       | Description                            | Color   | Who Can Set        | Next States                    |
| ------------ | -------------------------------------- | ------- | ------------------ | ------------------------------ |
| `draft`      | Initial creation, being edited         | Gray    | System, User       | pending                        |
| `pending`    | Awaiting admin approval                | Orange  | System (on submit) | approved, rejected, draft      |
| `approved`   | Approved by admin, ready to start      | Blue    | Admin only         | active                         |
| `active`     | Currently active (on/after start_date) | Green   | System (automatic) | expired, completed, terminated |
| `completed`  | Successfully finished                  | Emerald | Admin              | -                              |
| `terminated` | Terminated before completion           | Red     | Admin              | -                              |
| `expired`    | Past end_date                          | Red     | System (automatic) | -                              |
| `rejected`   | Rejected during approval               | Red     | Admin              | draft (if resubmitted)         |

## 🎯 Implementation Details

### 1. Database Schema

**Migration:** `supabase/migrations/20250125_complete_contract_workflow.sql`

**New Columns:**

- `approved_by` - UUID reference to admin who approved
- `approved_at` - Timestamp of approval
- `rejected_by` - UUID reference to admin who rejected
- `rejected_at` - Timestamp of rejection
- `rejection_reason` - Text explanation for rejection
- `changes_requested_by` - UUID reference to admin who requested changes
- `changes_requested_at` - Timestamp of change request
- `changes_requested_reason` - Text explanation of needed changes
- `submitted_for_review_at` - Timestamp when submitted for review

**Status Constraint:**

```sql
CHECK (status IN (
  'draft', 'pending', 'approved', 'active',
  'completed', 'terminated', 'expired', 'rejected'
))
```

### 2. API Endpoints

#### Contract Creation

**Endpoint:** `POST /api/contracts`

**Changes:**

- All new contracts now start with `status: 'pending'`
- `submitted_for_review_at` is automatically set to current timestamp
- All contract creation variants updated to use pending status

**Example:**

```typescript
{
  contract_number: "CON-2025-001",
  status: "pending",
  submitted_for_review_at: "2025-01-25T10:00:00Z",
  // ... other fields
}
```

#### Contract Approval

**Endpoint:** `POST /api/contracts/[id]/approve`

**Required Permission:** `contract:approve:all` (Admin only)

**Actions:**

1. **approve** - Approve contract (pending → approved)

   ```json
   {
     "action": "approve"
   }
   ```

2. **reject** - Reject contract (pending → rejected)

   ```json
   {
     "action": "reject",
     "reason": "Missing required documentation"
   }
   ```

3. **request_changes** - Request changes (pending → draft)

   ```json
   {
     "action": "request_changes",
     "reason": "Please update salary to match job grade"
   }
   ```

4. **send_to_legal** - Flag for legal review

   ```json
   {
     "action": "send_to_legal"
   }
   ```

5. **send_to_hr** - Flag for HR review
   ```json
   {
     "action": "send_to_hr"
   }
   ```

**Response:**

```json
{
  "success": true,
  "message": "Contract CON-2025-001 has been approved successfully",
  "contract": {
    /* updated contract */
  },
  "action": "approve"
}
```

#### Contract Status Check

**Endpoint:** `GET /api/contracts/[id]/approve`

**Permission:** `contract:read:own`

**Response:**

```json
{
  "success": true,
  "contract": {
    "id": "...",
    "status": "approved",
    "approved_by": "user-uuid",
    "approved_at": "2025-01-25T11:00:00Z",
    "submitted_for_review_at": "2025-01-25T10:00:00Z"
  }
}
```

### 3. Frontend Components

#### ContractStatusBadge

**File:** `components/contracts/contract-status-badge.tsx`

**Usage:**

```tsx
<ContractStatusBadge status='pending' size='sm' showIcon={true} />
```

**Supported Statuses:**

- draft (Gray)
- pending (Orange)
- approved (Blue)
- active (Green)
- completed (Emerald)
- terminated (Red)
- expired (Red)
- rejected (Red)

#### Pending Contracts Page

**File:** `app/[locale]/contracts/pending/page.tsx`

**Features:**

- Fetches contracts with `status=pending`
- Shows submission timestamp
- Displays action menu with approve/reject options
- Bulk approval/rejection support
- Request changes functionality
- Send to legal/HR review

**Permissions Required:**

- View: `contract:read:own` or admin
- Actions: `contract:approve:all` (admin only)

#### Approved Contracts Page

**File:** `app/[locale]/contracts/approved/page.tsx`

**Features:**

- Fetches contracts with `status=approved`
- Shows approval timestamp and approver
- Displays days until start date
- Download PDF functionality

#### All Contracts Page

**File:** `app/[locale]/contracts/page.tsx`

**Features:**

- Shows all contracts with proper status badges
- Filter by status dropdown
- Status-based statistics cards
- Proper color coding for each status

### 4. Automatic Status Transitions

**Function:** `update_contract_status_based_on_dates()`

This function automatically updates contract statuses based on dates:

1. **approved → active**: When `start_date <= CURRENT_DATE`
2. **active → expired**: When `end_date < CURRENT_DATE`

**Usage:**

```sql
SELECT update_contract_status_based_on_dates();
```

**Recommended Schedule:** Run daily via cron job

### 5. Database Views

#### Pending Contracts View

```sql
CREATE VIEW pending_contracts_view AS
SELECT
  c.*,
  u.email as created_by_email,
  u.full_name as created_by_name,
  EXTRACT(DAY FROM (NOW() - c.submitted_for_review_at)) as days_pending
FROM contracts c
LEFT JOIN users u ON c.created_by = u.id
WHERE c.status = 'pending'
ORDER BY c.submitted_for_review_at ASC;
```

#### Approved Contracts View

```sql
CREATE VIEW approved_contracts_view AS
SELECT
  c.*,
  u.email as approved_by_email,
  u.full_name as approved_by_name,
  EXTRACT(DAY FROM (c.start_date - CURRENT_DATE)) as days_until_start
FROM contracts c
LEFT JOIN users u ON c.approved_by = u.id
WHERE c.status = 'approved'
ORDER BY c.start_date ASC;
```

## 🔐 Permissions & Security

### RBAC Permissions

| Permission             | Resource | Action  | Scope | Description          | Who Has It     |
| ---------------------- | -------- | ------- | ----- | -------------------- | -------------- |
| `contract:read:own`    | contract | read    | own   | Read own contracts   | All users      |
| `contract:create:own`  | contract | create  | own   | Create contracts     | All users      |
| `contract:update:own`  | contract | update  | own   | Update own contracts | All users      |
| `contract:approve:all` | contract | approve | all   | Approve any contract | Admin, Manager |
| `contract:read:all`    | contract | read    | all   | Read all contracts   | Admin          |

### Role Capabilities

**Admin:**

- ✅ Create contracts (start as pending)
- ✅ View all contracts
- ✅ Approve/reject contracts
- ✅ Request changes
- ✅ Send to legal/HR review

**Manager:**

- ✅ Create contracts (start as pending)
- ✅ View all contracts
- ✅ Approve/reject contracts
- ✅ Request changes

**User:**

- ✅ Create contracts (start as pending)
- ✅ View own contracts only
- ❌ Cannot approve contracts

## 📊 Testing Workflow

### Test Case 1: Create and Approve Contract

1. **Create Contract** (as User)

   ```bash
   POST /api/contracts
   Body: { contract_number: "TEST-001", title: "Test Contract", ... }
   ```

   ✅ **Expected:** Contract created with `status: "pending"`

2. **View on Pending Page** (as Admin)

   ```bash
   GET /api/contracts?status=pending
   ```

   ✅ **Expected:** TEST-001 appears in pending contracts

3. **Approve Contract** (as Admin)

   ```bash
   POST /api/contracts/[id]/approve
   Body: { action: "approve" }
   ```

   ✅ **Expected:**
   - Contract status → `approved`
   - `approved_by` set to admin user ID
   - `approved_at` set to current timestamp

4. **View on Approved Page** (as Admin)

   ```bash
   GET /api/contracts?status=approved
   ```

   ✅ **Expected:** TEST-001 appears in approved contracts

5. **Wait for Start Date** (or manually update)

   ```sql
   UPDATE contracts SET status = 'active' WHERE id = '...' AND start_date <= CURRENT_DATE;
   ```

   ✅ **Expected:** Contract status → `active`

6. **View on All Contracts** (as Any User)
   ```bash
   GET /api/contracts
   ```
   ✅ **Expected:** TEST-001 shows with green "Active" badge

### Test Case 2: Reject Contract

1. **Create Contract** (as User)
2. **Reject Contract** (as Admin)
   ```bash
   POST /api/contracts/[id]/approve
   Body: {
     action: "reject",
     reason: "Missing required information"
   }
   ```
   ✅ **Expected:**
   - Contract status → `rejected`
   - `rejected_by` set to admin user ID
   - `rejected_at` set to current timestamp
   - `rejection_reason` saved

### Test Case 3: Request Changes

1. **Create Contract** (as User)
2. **Request Changes** (as Admin)
   ```bash
   POST /api/contracts/[id]/approve
   Body: {
     action: "request_changes",
     reason: "Please update salary field"
   }
   ```
   ✅ **Expected:**
   - Contract status → `draft`
   - `changes_requested_by` set to admin user ID
   - `changes_requested_reason` saved
   - User can now edit and resubmit

### Test Case 4: Bulk Operations

1. **Select Multiple Pending Contracts** (as Admin)
2. **Bulk Approve**
   - Select 5 contracts
   - Click "Bulk Actions" → "Approve Selected"
     ✅ **Expected:** All 5 contracts approved simultaneously

## 🎨 UI Components

### Status Badge Colors

```typescript
const statusConfig = {
  draft: 'bg-gray-100 text-gray-700', // Gray
  pending: 'bg-orange-100 text-orange-700', // Orange
  approved: 'bg-blue-100 text-blue-700', // Blue
  active: 'bg-green-100 text-green-700', // Green
  completed: 'bg-emerald-100 text-emerald-700', // Emerald
  terminated: 'bg-red-100 text-red-700', // Red
  expired: 'bg-red-100 text-red-700', // Red
  rejected: 'bg-red-100 text-red-700', // Red
};
```

### Action Dialogs

**Approval Confirmation:**

```
Title: Approve Contract
Description: Are you sure you want to approve this contract? This will activate the contract.
Actions: [Cancel] [Approve]
```

**Rejection Dialog:**

```
Title: Reject Contract
Description: Are you sure you want to reject this contract? Please provide a reason.
Reason: [Text area - required]
Actions: [Cancel] [Reject]
```

**Request Changes Dialog:**

```
Title: Request Changes
Description: Request changes to this contract. Please provide details about what needs to be changed.
Changes Requested: [Text area - required]
Actions: [Cancel] [Request Changes]
```

## 📈 Statistics & Metrics

### Dashboard Stats

The All Contracts page shows comprehensive statistics:

- **Total Contracts** - All contracts in database
- **Active** - Currently active contracts (green)
- **Pending** - Awaiting approval (orange)
- **Approved** - Approved but not yet active (blue)
- **Expiring Soon** - Active contracts ending within 30 days (amber)
- **Expired** - Past end date (red)

## 🔧 Maintenance

### Database Indexes

Created for performance:

```sql
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_approved_by ON contracts(approved_by);
CREATE INDEX idx_contracts_approved_at ON contracts(approved_at);
CREATE INDEX idx_contracts_pending_review ON contracts(status) WHERE status = 'pending';
CREATE INDEX idx_contracts_approved ON contracts(status) WHERE status = 'approved';
```

### Regular Maintenance Tasks

1. **Daily:** Run `update_contract_status_based_on_dates()` to update statuses
2. **Weekly:** Review pending contracts older than 7 days
3. **Monthly:** Archive completed/expired contracts

## 📝 Migration Notes

### Existing Contracts

The migration automatically updates existing contracts:

1. Contracts with `status = 'active'` but no `approved_by` → set to `pending`
2. Contracts with invalid status values → set to `pending`
3. Only affects contracts created in the last 60 days (safety measure)

### Rollback

If needed, you can rollback by:

```sql
ALTER TABLE contracts DROP CONSTRAINT contracts_status_check;
ALTER TABLE contracts ADD CONSTRAINT contracts_status_check
  CHECK (status IN ('draft', 'active', 'completed', 'terminated', 'expired'));
```

## 🚀 Future Enhancements

1. **Email Notifications:**
   - Notify users when contract is approved/rejected
   - Notify admins when new contracts are submitted
   - Reminder emails for pending approvals

2. **Workflow Automation:**
   - Auto-approve contracts meeting certain criteria
   - Multi-level approval workflow
   - Conditional routing (legal → HR → final approval)

3. **Audit Trail:**
   - Track all status changes
   - Record who made each change and when
   - Provide detailed contract history

4. **Advanced Filtering:**
   - Filter by date range
   - Filter by approver
   - Filter by submission date

## 📞 Support

For issues or questions:

1. Check the console logs for detailed error messages
2. Verify permissions using the RBAC debug panel
3. Check the database views for contract status
4. Review the API response for detailed error information

---

**Last Updated:** 2025-01-25
**Version:** 1.0
**Status:** ✅ Complete and Tested
