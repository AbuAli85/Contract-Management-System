# Fix: Duplicate Page Title on Promoters Page

## Issue

The Promoters page title shows "Promoters | Contract Management System | Contract Management System" with a duplicate site name.

## Root Cause

The metadata is likely being merged with a default site title in the layout, causing duplication.

## Solution

### Option 1: Update Promoters Page Metadata

**File:** `app/[locale]/promoters/page.tsx`

Find the metadata export and update it:

```typescript
export const metadata: Metadata = {
  title: 'Promoters', // Remove the site name from here
  description:
    'Manage promoters and staff members with advanced analytics and notifications',
};
```

The root layout should automatically append " | Contract Management System" to create the full title.

### Option 2: Check Root Layout Title Template

**File:** `app/layout.tsx`

Verify that the root layout has a proper title template:

```typescript
export const metadata: Metadata = {
  title: {
    template: '%s | Contract Management System',
    default: 'Contract Management System',
  },
  // ... other metadata
};
```

## Verification

1. Navigate to the Promoters page
2. Check the browser tab title
3. Verify it shows "Promoters | Contract Management System" (not duplicated)
