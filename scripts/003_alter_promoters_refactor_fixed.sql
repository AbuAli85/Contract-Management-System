-- Fixed version of the promoters refactor migration
-- This version handles the status constraint properly

DO $$
BEGIN
    -- Handle old column names if they exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='promoters' AND column_name='notify_before_id_expiry_days'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name='promoters' AND column_name='notify_days_before_id_expiry'
        ) THEN
            ALTER TABLE promoters RENAME COLUMN notify_before_id_expiry_days TO notify_days_before_id_expiry;
        ELSE
            ALTER TABLE promoters DROP COLUMN notify_before_id_expiry_days;
        END IF;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='promoters' AND column_name='notify_before_passport_expiry_days'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name='promoters' AND column_name='notify_days_before_passport_expiry'
        ) THEN
            ALTER TABLE promoters RENAME COLUMN notify_before_passport_expiry_days TO notify_days_before_passport_expiry;
        ELSE
            ALTER TABLE promoters DROP COLUMN notify_before_passport_expiry_days;
        END IF;
    END IF;

    -- Add notify_days_before_id_expiry
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='notify_days_before_id_expiry') THEN
        ALTER TABLE promoters ADD COLUMN notify_days_before_id_expiry INTEGER DEFAULT 100;
    END IF;

    -- Add notify_days_before_passport_expiry
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='notify_days_before_passport_expiry') THEN
        ALTER TABLE promoters ADD COLUMN notify_days_before_passport_expiry INTEGER DEFAULT 210;
    END IF;

    -- Add status (using TEXT with a CHECK constraint for ENUM-like behavior)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='status') THEN
        ALTER TABLE promoters ADD COLUMN status TEXT DEFAULT 'active';
    END IF;

    -- Fix any existing invalid status values before adding the constraint
    UPDATE promoters SET status = 'active' WHERE status IS NULL;
    
    -- Common mappings for invalid statuses
    UPDATE promoters SET status = 'pending_approval' WHERE status = 'pending';
    UPDATE promoters SET status = 'active' WHERE status = 'approved';
    UPDATE promoters SET status = 'inactive' WHERE status IN ('rejected', 'expired', 'cancelled', 'deleted');
    UPDATE promoters SET status = 'suspended' WHERE status = 'blocked';
    UPDATE promoters SET status = 'terminated' WHERE status = 'fired';
    
    -- Catch-all for any other unexpected values
    UPDATE promoters SET status = 'active' 
    WHERE status NOT IN ('active', 'inactive', 'suspended', 'holiday', 'on_leave', 'terminated', 'pending_approval', 'pending_review', 'retired', 'probation', 'resigned', 'contractor', 'temporary', 'training', 'other');

    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name='promoters' AND constraint_name='promoters_status_check'
    ) THEN
        ALTER TABLE promoters DROP CONSTRAINT promoters_status_check;
    END IF;

    -- Add the new constraint with all supported status values
    ALTER TABLE promoters ADD CONSTRAINT promoters_status_check 
    CHECK (status IN ('active', 'inactive', 'suspended', 'holiday', 'on_leave', 'terminated', 'pending_approval', 'pending_review', 'retired', 'probation', 'resigned', 'contractor', 'temporary', 'training', 'other'));

    -- Remove old contract-related fields if they exist.
    -- Be cautious with DROP COLUMN if data migration is needed.
    -- For this script, we assume it's safe or data is handled separately.
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='employer_id') THEN
        ALTER TABLE promoters DROP COLUMN employer_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='outsourced_to_id') THEN
        ALTER TABLE promoters DROP COLUMN outsourced_to_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='job_title') THEN
        ALTER TABLE promoters DROP COLUMN job_title;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='work_location') THEN
        ALTER TABLE promoters DROP COLUMN work_location;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='contract_valid_until') THEN
        ALTER TABLE promoters DROP COLUMN contract_valid_until;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='notify_before_contract_expiry_days') THEN
        ALTER TABLE promoters DROP COLUMN notify_before_contract_expiry_days;
    END IF;

END $$;

-- Add passport_number if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='passport_number') THEN
        ALTER TABLE promoters ADD COLUMN passport_number TEXT;
    END IF;
END $$;

-- Add mobile_number if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='mobile_number') THEN
        ALTER TABLE promoters ADD COLUMN mobile_number TEXT;
    END IF;
END $$;

-- Add profile_picture_url if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='promoters' AND column_name='profile_picture_url') THEN
        ALTER TABLE promoters ADD COLUMN profile_picture_url TEXT;
    END IF;
END $$;

COMMENT ON COLUMN promoters.notify_days_before_id_expiry IS 'Number of days before ID card expiry to notify. Default 100.';
COMMENT ON COLUMN promoters.notify_days_before_passport_expiry IS 'Number of days before passport expiry to notify. Default 210.';
COMMENT ON COLUMN promoters.status IS 'Status of the promoter: active, inactive, suspended, holiday, on_leave, terminated, pending_approval, pending_review, retired, probation, resigned, contractor, temporary, training, other. Default active.'; 