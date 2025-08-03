# Notification Days Update Summary

## Overview
Successfully updated the notification days for both existing and new promoters:
- **ID Expiry Notification**: Changed from 30 days to **100 days**
- **Passport Expiry Notification**: Changed from 30/60/90 days to **210 days**

## Changes Made

### 1. Application Code Updates
- **Forms**: Updated all promoter forms to use new default values
  - `components/promoter-form-simple.tsx` - Defaults: 100/210
  - `components/promoter-form.tsx` - Defaults: 100/210
  - `components/promoter-form-professional.tsx` - Defaults: 100/210

- **API**: Updated API validation defaults
  - `app/api/promoters/route.ts` - API defaults: 100/210

- **Services**: Updated notification thresholds
  - `app/api/dashboard/notifications/route.ts` - ID: 100 days, Passport: 210 days
  - `app/api/dashboard/stats/route.ts` - Updated calculation thresholds
  - `lib/promoter-service.ts` - Updated document status filtering

### 2. Database Schema Updates
- **Migration Scripts**: Updated default values in all migration files
  - `scripts/001_create_promoters_table.sql` - Table creation defaults: 100/210
  - `scripts/003_alter_promoters_refactor.sql` - Migration defaults: 100/210
  - `restore-database-schema.sql` - Schema restore defaults: 100/210

- **Status Constraint**: Fixed status constraint to support all application statuses
  - Added support for: `holiday`, `on_leave`, `terminated`, `pending_approval`, `pending_review`, `retired`, `probation`, `resigned`, `contractor`, `temporary`, `training`, `other`

### 3. Data Updates
- **Seed Data**: Updated test data to use new values
  - `scripts/seed-promoters.js` - All test promoters: 100/210

- **Test Files**: Updated test cases and expectations
  - `__tests__/promoter-validation.test.ts` - Test expectations: 100/210

- **Documentation**: Updated documentation examples
  - `docs/VALIDATION_SCHEMA_ENHANCEMENTS.md` - Documentation examples: 100/210

## Scripts Created for Database Updates

### 1. `scripts/complete-promoter-update.sql`
**Comprehensive script that:**
- Fixes status constraint issues
- Updates notification days for all existing promoters
- Handles database constraints properly
- Provides verification and summary

### 2. `scripts/update-existing-promoters-notification-days.sql`
**Focused script that:**
- Shows current notification day distribution
- Updates all existing promoters to new values
- Verifies the updates were successful

### 3. `scripts/check-current-statuses.sql`
**Diagnostic script that:**
- Shows current status values in database
- Identifies any invalid statuses
- Helps troubleshoot constraint issues

## Impact

### For Existing Promoters
- All existing promoters will be updated to use 100 days for ID expiry notifications
- All existing promoters will be updated to use 210 days for passport expiry notifications
- Status values will be standardized to match application requirements

### For New Promoters
- New promoters created through forms will default to 100/210 days
- New promoters created via API will default to 100/210 days
- Database schema ensures new records use correct defaults

### For Notifications
- System will now alert users 100 days before ID expiry (instead of 30)
- System will now alert users 210 days before passport expiry (instead of 30/60/90)
- Dashboard statistics will reflect the new notification thresholds

## Execution Instructions

1. **Run the complete update script:**
   ```sql
   -- Execute scripts/complete-promoter-update.sql
   ```

2. **Verify the updates:**
   - Check that all promoters have notification days set to 100/210
   - Verify status constraints are working properly
   - Confirm no constraint violations remain

3. **Test the application:**
   - Create new promoters to verify defaults
   - Check notification system behavior
   - Verify dashboard statistics

## Notes
- The changes are backward compatible
- Existing promoters will be automatically updated
- New promoters will use the correct defaults
- All forms and APIs consistently use the new values
- Status constraint now supports all application status values 