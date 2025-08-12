# 🔧 Service Management System Guide

## Overview

The Service Management System provides a complete workflow for creating, managing, and approving services in the Contract Management System. It integrates with Supabase for data storage and Make.com for automated approval workflows.

## 🏗️ Architecture

### Frontend Components

- **Service Creation Form** (`/en/services/new`) - Create new services
- **Services List** (`/en/services`) - View and manage all services
- **Real-time Updates** - Live status updates via Supabase subscriptions

### Backend Integration

- **Supabase Database** - Stores service data and provider information
- **Make.com Webhook** - Handles approval workflows and notifications
- **API Fallback** - Direct database insertion if webhook unavailable

## 📋 Database Schema

### Services Table

```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  provider_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Profiles Table (Providers)

```sql
-- Existing profiles table with role field
-- Providers are profiles with role = 'provider'
```

## 🚀 Features

### 1. Service Creation

- **Form Validation** - Ensures required fields are provided
- **Provider Selection** - Dropdown populated from Supabase profiles table
- **UUID Generation** - Pre-generates service ID for webhook targeting
- **Dual Submission** - Tries webhook first, falls back to API
- **Loading Skeletons** - Smooth loading experience with skeleton components
- **Error Boundaries** - Graceful error handling with retry options

### 2. Real-time Service List

- **Live Updates** - Real-time status changes via Supabase subscriptions
- **Status Indicators** - Visual badges for different service states
- **Statistics Dashboard** - Overview of service statuses
- **Provider Information** - Shows provider name for each service
- **Search & Filters** - Client-side search and status filtering
- **Role-based Actions** - Admin-only approval/rejection buttons

### 3. Approval Workflow

- **Pending Status** - New services start as "pending"
- **Make.com Integration** - Automated approval process with dual webhooks
- **Status Updates** - Real-time status changes
- **Notifications** - Toast notifications for status changes
- **Role-based Access** - Only admin users can approve/reject services

## 🔧 Configuration

### Environment Variables

Add to `.env.local`:

```bash
# Make.com Webhook Configuration
NEXT_PUBLIC_MAKE_SERVICE_CREATION_WEBHOOK=https://hook.eu2.make.com/ckseohqanys963qtkf773le623k2up7l
NEXT_PUBLIC_MAKE_APPROVAL_WEBHOOK=https://hook.eu2.make.com/your-approval-webhook-url
NEXT_PUBLIC_MAKE_BOOKING_CREATED_WEBHOOK=https://hook.eu2.make.com/wb6i8h78k2uxwpq2qvd73lha0hs355ka
NEXT_PUBLIC_MAKE_TRACKING_UPDATED_WEBHOOK=https://hook.eu2.make.com/dxy72blklhm2il5u3g2wl0sg4lkh1bkg
NEXT_PUBLIC_MAKE_PAYMENT_SUCCEEDED_WEBHOOK=https://hook.eu2.make.com/947cw5hvnj21alg3xvcm0zrv0layaayi
```

### Webhook Payload Format

```json
{
  "service_id": "uuid-generated-client-side",
  "provider_id": "provider-uuid-from-profiles",
  "service_name": "Service Name",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

## 📱 User Interface

### Service Creation Form

- **Service Name Input** - Text field with validation
- **Provider Dropdown** - Populated from profiles with role="provider"
- **Submit Button** - Creates service and sends to approval
- **Status Feedback** - Loading, success, and error states
- **Info Card** - Explains the approval process
- **Loading Skeleton** - Smooth loading experience
- **Error Boundary** - Graceful error handling

### Services List

- **Service Cards** - Individual cards for each service
- **Status Badges** - Color-coded status indicators
- **Provider Info** - Shows provider name
- **Timestamps** - Created and updated dates
- **Statistics** - Overview of service counts by status
- **Search & Filters** - Client-side search and filtering
- **Approval Buttons** - Role-based approve/reject actions

## 🔄 Workflow

### 1. Service Creation

1. User fills out service form
2. Form validates required fields
3. System generates UUID for service
4. Attempts webhook submission first
5. Falls back to API route if webhook fails
6. Shows success/error feedback
7. Resets form on success

### 2. Approval Process

1. Service created with "pending" status
2. Make.com webhook receives service data
3. Automated approval workflow runs
4. Status updated in database
5. Real-time update triggers UI refresh
6. Toast notification shows status change

### 3. Real-time Updates

1. Supabase subscription listens for changes
2. INSERT events add new services to list
3. UPDATE events update existing services
4. DELETE events remove services
5. Toast notifications for status changes

### 4. Search & Filtering

1. Client-side search by service name or provider
2. Status filtering (pending, approved, rejected, active, inactive)
3. Real-time filtering as user types
4. Clear filters functionality
5. Active filter indicators

### 5. Role-based Approval

1. Admin users see approve/reject buttons
2. Buttons only appear for pending services
3. Webhook-based status updates
4. Fallback to direct API updates
5. Real-time UI updates after approval

## 🛠️ Development

### Testing the System

1. **Create a Service**

   ```bash
   # Visit the service creation page
   http://localhost:3000/en/services/new
   ```

2. **View Services List**

   ```bash
   # Visit the services list page
   http://localhost:3000/en/services
   ```

3. **Test Real-time Updates**
   - Create a service
   - Watch for real-time updates in the list
   - Check browser console for subscription logs

4. **Test Enhancements**

   ```bash
   # Visit the test page
   http://localhost:3000/en/test-service-enhancements
   ```

5. **Test Webhooks**
   ```bash
   # Visit the webhook debug page
   http://localhost:3000/en/debug-webhooks
   ```

### Debugging

1. **Check Environment Variables**

   ```bash
   # Visit debug page
   http://localhost:3000/en/debug-env
   ```

2. **Test Authentication**

   ```bash
   # Visit auth debug page
   http://localhost:3000/en/debug-auth
   ```

3. **Check Console Logs**
   - Service creation attempts
   - Webhook responses
   - Real-time subscription events

## 🔒 Security Considerations

### Data Validation

- Client-side form validation
- Server-side API validation
- Database constraints

### Authentication

- Uses existing auth system
- Provider selection limited to authenticated users
- Service creation requires valid session

### Error Handling

- Graceful fallback from webhook to API
- User-friendly error messages
- Console logging for debugging

## 📊 Monitoring

### Key Metrics

- Service creation success rate
- Webhook vs API fallback usage
- Real-time update performance
- User engagement with service features

### Logging

- Service creation attempts
- Webhook responses
- Real-time subscription events
- Error conditions and fallbacks

## 🚀 Deployment

### Prerequisites

1. Supabase database with services table
2. Make.com webhook configured
3. Environment variables set
4. Provider profiles in database

### Steps

1. Deploy Next.js application
2. Configure Make.com webhook URL
3. Test service creation workflow
4. Monitor real-time updates
5. Verify approval process

## 🔧 Troubleshooting

### Common Issues

1. **Webhook Not Working**
   - Check webhook URL in environment variables
   - Verify Make.com webhook is active
   - Check network connectivity
   - API fallback should handle this

2. **Real-time Updates Not Working**
   - Check Supabase subscription
   - Verify database permissions
   - Check browser console for errors

3. **Provider Dropdown Empty**
   - Ensure profiles table has providers
   - Check role field is set to "provider"
   - Verify database connection

4. **Service Creation Fails**
   - Check form validation
   - Verify required fields
   - Check API route logs
   - Ensure database permissions

### Debug Commands

```bash
# Check environment variables
node -e "console.log('MAKE_WEBHOOK:', process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL)"

# Test Supabase connection
node test-supabase-connection.js

# Check database schema
# Run in Supabase SQL editor
SELECT * FROM services LIMIT 5;
SELECT * FROM profiles WHERE role = 'provider' LIMIT 5;
```

## 📈 Future Enhancements

### Planned Features

- Service editing capabilities
- Bulk service operations
- Advanced filtering and search
- Service analytics dashboard
- Email notifications
- Service templates

### Integration Opportunities

- Contract generation from services
- Service-based pricing
- Provider performance metrics
- Service category management
- Approval workflow customization

---

This service management system provides a robust foundation for managing services in the Contract Management System, with real-time updates, proper error handling, and integration with external approval workflows.
