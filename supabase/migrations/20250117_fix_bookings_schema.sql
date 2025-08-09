-- Migration: Fix bookings table schema for upsert functionality
-- Description: Adds missing booking_number unique constraint and fixes schema conflicts
-- Date: 2025-01-17

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add the missing unique constraint for booking_number (required for upsert)
DO $$ BEGIN
    -- First, add the booking_number column if it doesn't exist
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_number TEXT;
    
    -- Add unique constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'bookings_booking_number_unique'
    ) THEN
        ALTER TABLE bookings 
        ADD CONSTRAINT bookings_booking_number_unique UNIQUE (booking_number);
    END IF;
EXCEPTION
    WHEN duplicate_column THEN null;
    WHEN duplicate_object THEN null;
END $$;

-- Add scheduled_start and scheduled_end columns if they don't exist
-- These are used by the upsert implementation
DO $$ BEGIN
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS scheduled_start TIMESTAMPTZ;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS scheduled_end TIMESTAMPTZ;
    
    -- If we have scheduled_at but not scheduled_start, migrate the data
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'bookings' 
               AND column_name = 'scheduled_at')
    AND EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'bookings' 
                AND column_name = 'scheduled_start')
    AND EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'bookings' 
                AND column_name = 'duration_minutes') THEN
        
        -- Migrate existing data: scheduled_start = scheduled_at, scheduled_end = scheduled_at + duration
        UPDATE bookings 
        SET 
            scheduled_start = scheduled_at,
            scheduled_end = scheduled_at + (duration_minutes || ' minutes')::INTERVAL
        WHERE scheduled_start IS NULL 
        AND scheduled_at IS NOT NULL 
        AND duration_minutes IS NOT NULL;
    END IF;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add other fields used by the upsert implementation if they don't exist
DO $$ BEGIN
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS provider_company_id UUID;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2);
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes TEXT;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
    
    -- Add foreign key constraint for provider_company_id if companies table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'bookings_provider_company_id_fkey'
        ) THEN
            ALTER TABLE bookings 
            ADD CONSTRAINT bookings_provider_company_id_fkey 
            FOREIGN KEY (provider_company_id) REFERENCES companies(id) ON DELETE CASCADE;
        END IF;
    END IF;
EXCEPTION
    WHEN duplicate_column THEN null;
    WHEN duplicate_object THEN null;
END $$;

-- Create a view that provides a unified interface for both old and new schemas
CREATE OR REPLACE VIEW bookings_unified AS
SELECT 
    id,
    service_id,
    client_id,
    provider_company_id,
    booking_number,
    status,
    
    -- Use scheduled_start/scheduled_end if available, fallback to scheduled_at
    COALESCE(scheduled_start, scheduled_at) as scheduled_start,
    COALESCE(
        scheduled_end, 
        scheduled_at + (COALESCE(duration_minutes, 60) || ' minutes')::INTERVAL
    ) as scheduled_end,
    
    -- Original fields
    scheduled_at,
    duration_minutes,
    
    total_price,
    currency,
    notes,
    COALESCE(metadata, '{}') as metadata,
    created_at,
    updated_at
FROM bookings;

-- Create function to handle backward compatibility for inserts/updates
CREATE OR REPLACE FUNCTION handle_booking_compatibility()
RETURNS TRIGGER AS $$
BEGIN
    -- If only scheduled_start and scheduled_end are provided, calculate scheduled_at and duration
    IF NEW.scheduled_start IS NOT NULL AND NEW.scheduled_end IS NOT NULL THEN
        IF NEW.scheduled_at IS NULL THEN
            NEW.scheduled_at = NEW.scheduled_start;
        END IF;
        
        IF NEW.duration_minutes IS NULL THEN
            NEW.duration_minutes = EXTRACT(EPOCH FROM (NEW.scheduled_end - NEW.scheduled_start)) / 60;
        END IF;
    END IF;
    
    -- If only scheduled_at and duration_minutes are provided, calculate scheduled_start and scheduled_end
    IF NEW.scheduled_at IS NOT NULL AND NEW.duration_minutes IS NOT NULL THEN
        IF NEW.scheduled_start IS NULL THEN
            NEW.scheduled_start = NEW.scheduled_at;
        END IF;
        
        IF NEW.scheduled_end IS NULL THEN
            NEW.scheduled_end = NEW.scheduled_at + (NEW.duration_minutes || ' minutes')::INTERVAL;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for backward compatibility
DROP TRIGGER IF EXISTS booking_compatibility_trigger ON bookings;
CREATE TRIGGER booking_compatibility_trigger
    BEFORE INSERT OR UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION handle_booking_compatibility();

-- Add indexes for performance
DO $$ BEGIN
    -- Index on booking_number (should be unique anyway)
    CREATE INDEX IF NOT EXISTS idx_bookings_booking_number ON bookings(booking_number);
    
    -- Index on scheduled_start for time-based queries
    CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_start ON bookings(scheduled_start);
    
    -- Index on provider_company_id for provider queries
    CREATE INDEX IF NOT EXISTS idx_bookings_provider_company_id ON bookings(provider_company_id);
    
    -- Index on status for filtering
    CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- Comments for documentation
COMMENT ON CONSTRAINT bookings_booking_number_unique ON bookings IS 'Unique constraint required for upsert functionality';
COMMENT ON COLUMN bookings.booking_number IS 'Unique booking identifier used as conflict target for upserts';
COMMENT ON COLUMN bookings.scheduled_start IS 'Start time of the booking (used by upsert implementation)';
COMMENT ON COLUMN bookings.scheduled_end IS 'End time of the booking (used by upsert implementation)';
COMMENT ON VIEW bookings_unified IS 'Unified view providing backward compatibility between old and new booking schemas';
COMMENT ON FUNCTION handle_booking_compatibility IS 'Trigger function to maintain compatibility between scheduled_at/duration and scheduled_start/scheduled_end fields';