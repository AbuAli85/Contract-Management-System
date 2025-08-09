-- Migration: Fix specific booking table issues
-- Description: Adds missing columns and constraints identified in schema check
-- Date: 2025-01-17

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fix Issue 1: Add missing 'notes' column
DO $$ 
BEGIN
    -- Add notes column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'notes'
    ) THEN
        ALTER TABLE bookings ADD COLUMN notes TEXT;
        COMMENT ON COLUMN bookings.notes IS 'General notes for the booking';
    END IF;
END $$;

-- Fix Issue 2: Add unique constraint on booking_number
DO $$ 
BEGIN
    -- First ensure booking_number column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'booking_number'
    ) THEN
        ALTER TABLE bookings ADD COLUMN booking_number TEXT;
    END IF;

    -- Add unique constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'bookings_booking_number_unique' 
        AND table_name = 'bookings'
    ) THEN
        -- First, update any NULL booking_numbers with unique values
        UPDATE bookings 
        SET booking_number = 'BK-MIGR-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || id::TEXT
        WHERE booking_number IS NULL;

        -- Add the unique constraint
        ALTER TABLE bookings 
        ADD CONSTRAINT bookings_booking_number_unique UNIQUE (booking_number);
        
        COMMENT ON CONSTRAINT bookings_booking_number_unique ON bookings 
        IS 'Unique constraint required for upsert operations using booking_number as conflict target';
    END IF;
END $$;

-- Fix Issue 3: Ensure all required columns for upsert exist
DO $$ 
BEGIN
    -- Add scheduled_start if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'scheduled_start'
    ) THEN
        ALTER TABLE bookings ADD COLUMN scheduled_start TIMESTAMPTZ;
    END IF;

    -- Add scheduled_end if it doesn't exist  
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'scheduled_end'
    ) THEN
        ALTER TABLE bookings ADD COLUMN scheduled_end TIMESTAMPTZ;
    END IF;

    -- Add provider_company_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'provider_company_id'
    ) THEN
        ALTER TABLE bookings ADD COLUMN provider_company_id UUID;
    END IF;

    -- Add total_price if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'total_price'
    ) THEN
        ALTER TABLE bookings ADD COLUMN total_price DECIMAL(10,2);
    END IF;

    -- Add currency if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'currency'
    ) THEN
        ALTER TABLE bookings ADD COLUMN currency TEXT DEFAULT 'USD';
    END IF;

    -- Add metadata if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE bookings ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END $$;

-- Fix Issue 4: Migrate existing data if needed
DO $$ 
BEGIN
    -- If we have scheduled_at but missing scheduled_start, migrate the data
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'scheduled_at'
    ) THEN
        -- Update scheduled_start from scheduled_at where null
        UPDATE bookings 
        SET scheduled_start = scheduled_at 
        WHERE scheduled_start IS NULL AND scheduled_at IS NOT NULL;

        -- Update scheduled_end from scheduled_at + duration where possible
        UPDATE bookings 
        SET scheduled_end = scheduled_at + (COALESCE(duration_minutes, 60) || ' minutes')::INTERVAL
        WHERE scheduled_end IS NULL 
        AND scheduled_at IS NOT NULL;
    END IF;
END $$;

-- Fix Issue 5: Add foreign key constraints if tables exist
DO $$ 
BEGIN
    -- Add foreign key for provider_company_id if companies table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'companies'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'bookings_provider_company_id_fkey'
    ) THEN
        ALTER TABLE bookings 
        ADD CONSTRAINT bookings_provider_company_id_fkey 
        FOREIGN KEY (provider_company_id) REFERENCES companies(id) ON DELETE SET NULL;
    END IF;

    -- Add foreign key for service_id if services table exists  
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'services'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'bookings_service_id_fkey'
    ) THEN
        ALTER TABLE bookings 
        ADD CONSTRAINT bookings_service_id_fkey 
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add performance indexes
DO $$ 
BEGIN
    -- Index on booking_number for fast lookups
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_bookings_booking_number'
    ) THEN
        CREATE INDEX idx_bookings_booking_number ON bookings(booking_number);
    END IF;

    -- Index on scheduled_start for time-based queries
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_bookings_scheduled_start'
    ) THEN
        CREATE INDEX idx_bookings_scheduled_start ON bookings(scheduled_start);
    END IF;

    -- Index on provider_company_id for provider queries
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_bookings_provider_company_id'
    ) THEN
        CREATE INDEX idx_bookings_provider_company_id ON bookings(provider_company_id);
    END IF;

    -- Index on status for filtering
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_bookings_status'
    ) THEN
        CREATE INDEX idx_bookings_status ON bookings(status);
    END IF;
END $$;

-- Create or replace compatibility function for backward compatibility
CREATE OR REPLACE FUNCTION sync_booking_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    -- If scheduled_start/end are provided, sync to scheduled_at/duration
    IF NEW.scheduled_start IS NOT NULL AND NEW.scheduled_end IS NOT NULL THEN
        NEW.scheduled_at = NEW.scheduled_start;
        NEW.duration_minutes = EXTRACT(EPOCH FROM (NEW.scheduled_end - NEW.scheduled_start)) / 60;
    END IF;
    
    -- If scheduled_at/duration are provided, sync to scheduled_start/end
    IF NEW.scheduled_at IS NOT NULL AND NEW.duration_minutes IS NOT NULL THEN
        NEW.scheduled_start = COALESCE(NEW.scheduled_start, NEW.scheduled_at);
        NEW.scheduled_end = COALESCE(NEW.scheduled_end, NEW.scheduled_at + (NEW.duration_minutes || ' minutes')::INTERVAL);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for timestamp synchronization
DROP TRIGGER IF EXISTS sync_booking_timestamps_trigger ON bookings;
CREATE TRIGGER sync_booking_timestamps_trigger
    BEFORE INSERT OR UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION sync_booking_timestamps();

-- Verify the fixes by selecting table info
DO $$
DECLARE
    _record RECORD;
BEGIN
    RAISE NOTICE 'Booking table schema after fixes:';
    
    FOR _record IN 
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  % % % %', 
            _record.column_name, 
            _record.data_type,
            CASE WHEN _record.is_nullable = 'NO' THEN 'NOT NULL' ELSE 'NULL' END,
            COALESCE('DEFAULT ' || _record.column_default, '');
    END LOOP;
    
    RAISE NOTICE 'Constraints:';
    FOR _record IN
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints
        WHERE table_name = 'bookings'
    LOOP
        RAISE NOTICE '  % (%)', _record.constraint_name, _record.constraint_type;
    END LOOP;
END $$;