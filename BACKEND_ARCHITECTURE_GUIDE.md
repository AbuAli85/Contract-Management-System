# Role-Based Backend Architecture: Next.js + Make.com + Supabase

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Supabase Setup & Authentication](#supabase-setup--authentication)
3. [Database Schema Design](#database-schema-design)
4. [Row Level Security (RLS) Policies](#row-level-security-rls-policies)
5. [Make.com Integration](#makecom-integration)
6. [Next.js Implementation](#nextjs-implementation)
7. [API Routes & Security](#api-routes--security)
8. [Example Workflows](#example-workflows)

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Next.js      │    │    Make.com     │    │    Supabase     │
│   Frontend      │◄──►│   Automation    │◄──►│    Backend      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
    ┌────▼────┐             ┌────▼────┐             ┌────▼────┐
    │ Client  │             │ Webhook │             │   Auth  │
    │ Server  │             │ Handler │             │  & RLS  │
    │API Route│             │Scenario │             │Database │
    └─────────┘             └─────────┘             └─────────┘

Data Flow:
1. User interacts with Next.js UI
2. Next.js sends secure API request to Supabase
3. Supabase triggers Make.com webhook (if needed)
4. Make.com processes automation (emails, notifications, etc.)
5. Make.com updates Supabase with results
6. Next.js fetches updated data with RLS protection
```

## Supabase Setup & Authentication

### 1. Custom User Roles Setup

First, let's extend the default Supabase auth with custom roles:

```sql
-- Create custom user roles enum
CREATE TYPE user_role AS ENUM ('admin', 'client', 'provider', 'manager', 'user');

-- Create custom user status enum
CREATE TYPE user_status AS ENUM ('active', 'pending', 'inactive', 'suspended');

-- Extend the default profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    display_name TEXT,
    role user_role DEFAULT 'user'::user_role,
    status user_status DEFAULT 'pending'::user_status,
    avatar_url TEXT,
    phone TEXT,
    company_name TEXT,
    business_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, status)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'user'::user_role),
        'pending'::user_status
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 2. Role-Based Authentication Helper

```sql
-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role AS $$
DECLARE
    user_role_result user_role;
BEGIN
    SELECT role INTO user_role_result
    FROM public.profiles
    WHERE id = user_id;

    RETURN COALESCE(user_role_result, 'user'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(required_role user_role)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = required_role
        FROM public.profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has minimum role level
CREATE OR REPLACE FUNCTION public.has_min_role(min_role user_role)
RETURNS BOOLEAN AS $$
DECLARE
    user_role_level INTEGER;
    min_role_level INTEGER;
BEGIN
    -- Define role hierarchy levels
    user_role_level := CASE (SELECT role FROM public.profiles WHERE id = auth.uid())
        WHEN 'admin' THEN 5
        WHEN 'manager' THEN 4
        WHEN 'provider' THEN 3
        WHEN 'client' THEN 2
        WHEN 'user' THEN 1
        ELSE 0
    END;

    min_role_level := CASE min_role
        WHEN 'admin' THEN 5
        WHEN 'manager' THEN 4
        WHEN 'provider' THEN 3
        WHEN 'client' THEN 2
        WHEN 'user' THEN 1
        ELSE 0
    END;

    RETURN user_role_level >= min_role_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Database Schema Design

### 1. Core Tables

```sql
-- Services table (what providers offer)
CREATE TABLE public.services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    subcategory TEXT,
    price_type TEXT CHECK (price_type IN ('fixed', 'hourly', 'custom')),
    base_price DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    duration_minutes INTEGER,
    availability JSONB DEFAULT '{}',
    location_type TEXT CHECK (location_type IN ('online', 'on-site', 'hybrid')),
    service_area TEXT[],
    max_participants INTEGER DEFAULT 1,
    requirements TEXT[],
    tags TEXT[],
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
    featured BOOLEAN DEFAULT FALSE,
    rating DECIMAL(2,1) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    booking_count INTEGER DEFAULT 0,
    make_webhook_url TEXT, -- For Make.com integration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table (client requests/appointments)
CREATE TABLE public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id UUID REFERENCES public.services(id) ON DELETE RESTRICT,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    booking_number TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'refunded')),

    -- Booking details
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,

    -- Pricing
    quoted_price DECIMAL(10,2) NOT NULL,
    final_price DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',

    -- Client information
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT,
    client_notes TEXT,

    -- Service details
    service_details JSONB DEFAULT '{}',
    location_details JSONB DEFAULT '{}',
    participants INTEGER DEFAULT 1,

    -- Payment tracking
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded', 'failed')),
    payment_method TEXT,
    payment_reference TEXT,

    -- Automation tracking
    make_scenario_id TEXT, -- Track which Make.com scenario processed this
    webhook_responses JSONB DEFAULT '[]',

    -- Metadata
    cancellation_reason TEXT,
    provider_notes TEXT,
    internal_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table (for system alerts)
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('booking', 'payment', 'system', 'reminder', 'review')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity logs (audit trail)
CREATE TABLE public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Make.com webhook logs
CREATE TABLE public.webhook_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    webhook_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    response JSONB,
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'pending')),
    error_message TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Helper Functions for Bookings

```sql
-- Generate unique booking number
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TEXT AS $$
DECLARE
    prefix TEXT := 'BK';
    timestamp_part TEXT := TO_CHAR(NOW(), 'YYYYMMDD');
    random_part TEXT := UPPER(SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 6));
BEGIN
    RETURN prefix || timestamp_part || random_part;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate booking number trigger
CREATE OR REPLACE FUNCTION set_booking_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.booking_number IS NULL OR NEW.booking_number = '' THEN
        NEW.booking_number := generate_booking_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_booking_number
    BEFORE INSERT ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION set_booking_number();
```

## Row Level Security (RLS) Policies

### 1. Enable RLS on All Tables

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
```

### 2. Profiles Table Policies

```sql
-- Profiles: Users can view their own profile, admins/managers can view all
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Admins and managers can view all profiles"
    ON public.profiles FOR SELECT
    USING (has_min_role('manager'::user_role));

-- Profiles: Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Profiles: Only admins can insert/delete profiles
CREATE POLICY "Only admins can manage profiles"
    ON public.profiles FOR ALL
    USING (has_role('admin'::user_role))
    WITH CHECK (has_role('admin'::user_role));
```

### 3. Services Table Policies

```sql
-- Services: Anyone can view active services
CREATE POLICY "Anyone can view active services"
    ON public.services FOR SELECT
    USING (status = 'active');

-- Services: Providers can manage their own services
CREATE POLICY "Providers can manage own services"
    ON public.services FOR ALL
    USING (provider_id = auth.uid() AND has_min_role('provider'::user_role))
    WITH CHECK (provider_id = auth.uid() AND has_min_role('provider'::user_role));

-- Services: Admins and managers can view all services
CREATE POLICY "Admins and managers can view all services"
    ON public.services FOR SELECT
    USING (has_min_role('manager'::user_role));

-- Services: Only providers can create services
CREATE POLICY "Only providers can create services"
    ON public.services FOR INSERT
    WITH CHECK (has_min_role('provider'::user_role) AND provider_id = auth.uid());
```

### 4. Bookings Table Policies

```sql
-- Bookings: Clients can view their own bookings
CREATE POLICY "Clients can view own bookings"
    ON public.bookings FOR SELECT
    USING (client_id = auth.uid());

-- Bookings: Providers can view bookings for their services
CREATE POLICY "Providers can view their service bookings"
    ON public.bookings FOR SELECT
    USING (provider_id = auth.uid() AND has_min_role('provider'::user_role));

-- Bookings: Managers and admins can view all bookings
CREATE POLICY "Managers and admins can view all bookings"
    ON public.bookings FOR SELECT
    USING (has_min_role('manager'::user_role));

-- Bookings: Clients can create bookings
CREATE POLICY "Clients can create bookings"
    ON public.bookings FOR INSERT
    WITH CHECK (has_min_role('client'::user_role) AND client_id = auth.uid());

-- Bookings: Providers can update status of their bookings
CREATE POLICY "Providers can update their booking status"
    ON public.bookings FOR UPDATE
    USING (provider_id = auth.uid() AND has_min_role('provider'::user_role))
    WITH CHECK (provider_id = auth.uid() AND has_min_role('provider'::user_role));

-- Bookings: Clients can cancel their own bookings
CREATE POLICY "Clients can cancel own bookings"
    ON public.bookings FOR UPDATE
    USING (client_id = auth.uid() AND status IN ('pending', 'confirmed'))
    WITH CHECK (client_id = auth.uid() AND status = 'cancelled');
```

### 5. Notifications Policies

```sql
-- Notifications: Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can mark own notifications as read"
    ON public.notifications FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- System can create notifications for any user
CREATE POLICY "System can create notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (true);
```

## Make.com Integration

### 1. Webhook Endpoints Setup

```sql
-- Function to trigger Make.com webhooks
CREATE OR REPLACE FUNCTION trigger_make_webhook(
    webhook_type TEXT,
    payload JSONB
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    -- Insert webhook log
    INSERT INTO public.webhook_logs (webhook_type, payload, status)
    VALUES (webhook_type, payload, 'pending')
    RETURNING id INTO log_id;

    -- The actual webhook call will be handled by Make.com's database trigger
    -- or by Next.js API routes that call Make.com

    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. Database Triggers for Make.com

```sql
-- Trigger for new bookings
CREATE OR REPLACE FUNCTION notify_new_booking()
RETURNS TRIGGER AS $$
DECLARE
    webhook_payload JSONB;
BEGIN
    -- Prepare webhook payload
    webhook_payload := jsonb_build_object(
        'event', 'booking.created',
        'booking_id', NEW.id,
        'booking_number', NEW.booking_number,
        'service_id', NEW.service_id,
        'client_id', NEW.client_id,
        'provider_id', NEW.provider_id,
        'client_email', NEW.client_email,
        'client_name', NEW.client_name,
        'scheduled_start', NEW.scheduled_start,
        'scheduled_end', NEW.scheduled_end,
        'quoted_price', NEW.quoted_price,
        'status', NEW.status,
        'created_at', NEW.created_at
    );

    -- Log the webhook
    PERFORM trigger_make_webhook('booking_created', webhook_payload);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_new_booking_webhook
    AFTER INSERT ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION notify_new_booking();

-- Trigger for booking status changes
CREATE OR REPLACE FUNCTION notify_booking_status_change()
RETURNS TRIGGER AS $$
DECLARE
    webhook_payload JSONB;
BEGIN
    -- Only trigger if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        webhook_payload := jsonb_build_object(
            'event', 'booking.status_changed',
            'booking_id', NEW.id,
            'booking_number', NEW.booking_number,
            'old_status', OLD.status,
            'new_status', NEW.status,
            'client_email', NEW.client_email,
            'provider_id', NEW.provider_id,
            'service_id', NEW.service_id,
            'updated_at', NEW.updated_at
        );

        PERFORM trigger_make_webhook('booking_status_changed', webhook_payload);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_booking_status_change_webhook
    AFTER UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION notify_booking_status_change();
```

### 3. Make.com Scenario Structure

Here's the flow for a **New Booking Scenario**:

```
1. [Webhook Trigger] ← Receives booking data from Supabase
   ↓
2. [Data Parser] ← Extract booking details, client info, provider info
   ↓
3. [Get Provider Details] ← Query Supabase for provider information
   ↓
4. [Route by Service Type] ← Different flows for different service types
   ↓
5. [Send Notifications]:
   ├── [Email to Client] ← Booking confirmation
   ├── [Email to Provider] ← New booking alert
   ├── [Slack/Teams] ← Internal team notification
   └── [SMS] ← Optional SMS alerts
   ↓
6. [Update Database] ← Mark notifications as sent, log automation
   ↓
7. [Create Calendar Events] ← Add to provider's calendar
   ↓
8. [Set Reminders] ← Schedule follow-up scenarios
```

### 4. Make.com Webhook Configuration

In Make.com, create these webhook URLs:

- `https://hook.eu1.make.com/YOUR_WEBHOOK_ID/booking-created`
- `https://hook.eu1.make.com/YOUR_WEBHOOK_ID/booking-status-changed`
- `https://hook.eu1.make.com/YOUR_WEBHOOK_ID/service-created`
- `https://hook.eu1.make.com/YOUR_WEBHOOK_ID/user-registered`
