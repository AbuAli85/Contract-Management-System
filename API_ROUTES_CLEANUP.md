# API Routes Cleanup Guide

## ✅ KEEP - Essential Routes for Promoter & Contract Management

### Authentication & Users
- ✅ `/api/auth/*` - Keep all authentication routes
- ✅ `/api/users/route.ts` - User management
- ✅ `/api/users/profile/*` - User profiles
- ✅ `/api/user-role/route.ts` - Role management
- ✅ `/api/get-user-role/route.ts` - Role checking

### Promoters (Core Feature)
- ✅ `/api/promoters/route.ts` - Main promoters endpoint
- ✅ `/api/promoters/[id]/route.ts` - Individual promoter
- ✅ `/api/promoters/[id]/documents/route.ts` - Document tracking
- ✅ `/api/promoters/[id]/notes/route.ts` - Promoter notes
- ✅ `/api/promoters/dashboard/route.ts` - Promoter dashboard

### Contracts (Core Feature)
- ✅ `/api/contracts/route.ts` - Main contracts endpoint
- ✅ `/api/contracts/[id]/route.ts` - Individual contract
- ✅ `/api/contracts/[id]/approve.ts` - Contract approval
- ✅ `/api/contracts/[id]/reject.ts` - Contract rejection
- ✅ `/api/contracts/[id]/download.ts` - Contract download
- ✅ `/api/contracts/[id]/generate-pdf/route.ts` - PDF generation
- ✅ `/api/generate-contract/route.ts` - Contract generation
- ✅ `/api/contract-generation/route.ts` - Alternative generation endpoint
- ✅ `/api/pdf-generation/route.ts` - PDF utilities

### Parties & Employers (Core Feature)
- ✅ `/api/parties/route.ts` - Parties/employers management

### Dashboard & Analytics
- ✅ `/api/dashboard/stats/route.ts` - Dashboard statistics
- ✅ `/api/dashboard/metrics/route.ts` - System metrics
- ✅ `/api/dashboard/notifications/route.ts` - Notifications

### System & Utilities
- ✅ `/api/health/route.ts` - Health check
- ✅ `/api/permissions/route.ts` - Permission management
- ✅ `/api/notifications/route.ts` - Notifications system
- ✅ `/api/upload/route.ts` - File uploads

---

## ❌ DISABLE/REMOVE - Unused Routes

### Bookings System (Not needed)
- ❌ `/api/bookings/*` - Entire booking system
- ❌ `/api/booking-resources/*` - Booking resources
- ❌ `/api/enhanced/bookings/*` - Enhanced bookings

### HR System (Out of scope)
- ❌ `/api/hr/*` - Entire HR module
  - ❌ `/api/hr/attendance/*`
  - ❌ `/api/hr/leave-requests/*`
  - ❌ `/api/hr/employees/*`
  - ❌ `/api/hr/documents/*`

### Promoter Extended Features (Not essential)
- ❌ `/api/promoters/[id]/attendance/route.ts` - Attendance tracking
- ❌ `/api/promoters/[id]/badges/route.ts` - Gamification badges
- ❌ `/api/promoters/[id]/communications/route.ts` - Communication logs
- ❌ `/api/promoters/[id]/education/route.ts` - Education history
- ❌ `/api/promoters/[id]/experience/route.ts` - Work experience
- ❌ `/api/promoters/[id]/feedback/route.ts` - Feedback system
- ❌ `/api/promoters/[id]/leave-requests/route.ts` - Leave management
- ❌ `/api/promoters/[id]/performance-metrics/route.ts` - Performance tracking
- ❌ `/api/promoters/[id]/reports/route.ts` - Custom reports
- ❌ `/api/promoters/[id]/scores/route.ts` - Scoring system
- ❌ `/api/promoters/[id]/skills/route.ts` - Skills tracking
- ❌ `/api/promoters/[id]/tasks/route.ts` - Task management

### Promoter Gamification
- ❌ `/api/promoter/achievements/*` - Achievements system
- ❌ `/api/promoter/metrics/*` - Detailed metrics
- ❌ `/api/promoter/tasks/*` - Task system

### Provider/Services System (Not needed)
- ❌ `/api/provider/*` - Provider system
- ❌ `/api/services/*` - Services management
- ❌ `/api/enhanced/services/*` - Enhanced services

### Invoice System (Not needed)
- ❌ `/api/invoices/*` - Invoice management

### Companies System (Redundant with Parties)
- ❌ `/api/companies/*` - Companies management
- ❌ `/api/enhanced/companies/*` - Enhanced companies

### Tracking System (Not needed)
- ❌ `/api/trackings/*` - Tracking system

### Review System (Not needed)
- ❌ `/api/reviews/*` - Review system
- ❌ `/api/reviewer-roles/*` - Reviewer roles

### Workflow System (Not needed)
- ❌ `/api/workflow/*` - Workflow configuration

### Audit Logs (Can be disabled for now)
- ❌ `/api/audit-logs/*` - Audit logging

### Dashboard Extended Features
- ❌ `/api/dashboard/activities/*` - Activity tracking
- ❌ `/api/dashboard/analytics/*` - Advanced analytics
- ❌ `/api/dashboard/attendance/*` - Attendance tracking
- ❌ `/api/dashboard/public-stats/*` - Public statistics

### Admin Tools (Keep minimal)
- ⚠️ `/api/admin/bulk-import/*` - Bulk operations (optional)
- ⚠️ `/api/admin/backup/*` - Backup tools (optional)
- ⚠️ `/api/admin/roles/*` - Role management (keep)
- ❌ `/api/admin/seed-data/*` - Data seeding
- ❌ `/api/admin/users/*` - Advanced user management

### Webhooks (Optional)
- ⚠️ `/api/webhook/*` - Webhook handlers (keep for contracts)
- ⚠️ `/api/webhooks/*` - Multiple webhooks (keep for contracts)
- ❌ `/api/bookings/webhook/*` - Booking webhooks

### Miscellaneous
- ❌ `/api/check-user-role/route.ts` - Redundant with get-user-role
- ❌ `/api/clear-cookies/route.ts` - Utility route
- ❌ `/api/force-logout/route.ts` - Utility route
- ❌ `/api/supabase-config/route.ts` - Configuration utility
- ❌ `/api/setup-admin/*` - Setup utilities
- ❌ `/api/setup-user-role/*` - Setup utilities
- ❌ `/api/fix-admin-role/*` - Fix utilities
- ❌ `/api/users-fixed/*` - Backup route

---

## 📝 Implementation Strategy

### Phase 1: Disable Routes (Immediate)
1. Move unused routes to `/api/_disabled/` folder
2. This preserves the code but removes them from the build

### Phase 2: Documentation (Current)
3. Document which routes are essential
4. Create this reference guide

### Phase 3: Cleanup (Future)
5. After confirming the system works, permanently delete unused routes
6. Archive code in git history if needed later

---

## 🔧 Quick Disable Script

To quickly disable routes, we can:
1. Create `/api/_disabled/` folder
2. Move entire feature folders there
3. Update imports if needed

Example folders to move:
```
bookings/ → _disabled/bookings/
hr/ → _disabled/hr/
provider/ → _disabled/provider/
services/ → _disabled/services/
invoices/ → _disabled/invoices/
trackings/ → _disabled/trackings/
reviews/ → _disabled/reviews/
workflow/ → _disabled/workflow/
```

---

**Total Routes Before**: ~150+ API routes
**Total Routes After**: ~30-40 essential routes
**Reduction**: ~75% cleaner codebase

