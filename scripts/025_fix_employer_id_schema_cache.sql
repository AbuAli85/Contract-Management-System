-- Fix employer_id schema cache issue
-- This script ensures the employer_id column exists and is properly configured

DO $$
BEGIN
    -- Check if employer_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'promoters' 
        AND column_name = 'employer_id'
    ) THEN
        -- Add employer_id column
        ALTER TABLE promoters ADD COLUMN employer_id UUID;
        
        -- Add foreign key constraint
        ALTER TABLE promoters 
        ADD CONSTRAINT fk_promoters_employer_id 
        FOREIGN KEY (employer_id) REFERENCES parties(id) ON DELETE SET NULL;
        
        -- Add index for performance
        CREATE INDEX IF NOT EXISTS idx_promoters_employer_id ON promoters(employer_id);
        
        -- Add comment for documentation
        COMMENT ON COLUMN promoters.employer_id IS 'Foreign key to the party acting as the employer for this promoter.';
        
        RAISE NOTICE 'Added employer_id column to promoters table';
    ELSE
        RAISE NOTICE 'employer_id column already exists in promoters table';
    END IF;
    
    -- Check if outsourced_to_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'promoters' 
        AND column_name = 'outsourced_to_id'
    ) THEN
        -- Add outsourced_to_id column
        ALTER TABLE promoters ADD COLUMN outsourced_to_id UUID;
        
        -- Add foreign key constraint
        ALTER TABLE promoters 
        ADD CONSTRAINT fk_promoters_outsourced_to_id 
        FOREIGN KEY (outsourced_to_id) REFERENCES parties(id) ON DELETE SET NULL;
        
        -- Add index for performance
        CREATE INDEX IF NOT EXISTS idx_promoters_outsourced_to_id ON promoters(outsourced_to_id);
        
        -- Add comment for documentation
        COMMENT ON COLUMN promoters.outsourced_to_id IS 'Foreign key to the party this promoter is outsourced to.';
        
        RAISE NOTICE 'Added outsourced_to_id column to promoters table';
    ELSE
        RAISE NOTICE 'outsourced_to_id column already exists in promoters table';
    END IF;
    
    -- Check if job_title column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'promoters' 
        AND column_name = 'job_title'
    ) THEN
        -- Add job_title column
        ALTER TABLE promoters ADD COLUMN job_title TEXT;
        
        -- Add comment for documentation
        COMMENT ON COLUMN promoters.job_title IS 'Job title of the promoter.';
        
        RAISE NOTICE 'Added job_title column to promoters table';
    ELSE
        RAISE NOTICE 'job_title column already exists in promoters table';
    END IF;
    
    -- Check if work_location column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'promoters' 
        AND column_name = 'work_location'
    ) THEN
        -- Add work_location column
        ALTER TABLE promoters ADD COLUMN work_location TEXT;
        
        -- Add comment for documentation
        COMMENT ON COLUMN promoters.work_location IS 'Work location of the promoter.';
        
        RAISE NOTICE 'Added work_location column to promoters table';
    ELSE
        RAISE NOTICE 'work_location column already exists in promoters table';
    END IF;
    
    -- Check if contract_valid_until column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'promoters' 
        AND column_name = 'contract_valid_until'
    ) THEN
        -- Add contract_valid_until column
        ALTER TABLE promoters ADD COLUMN contract_valid_until DATE;
        
        -- Add comment for documentation
        COMMENT ON COLUMN promoters.contract_valid_until IS 'Date until which the promoter contract is valid.';
        
        RAISE NOTICE 'Added contract_valid_until column to promoters table';
    ELSE
        RAISE NOTICE 'contract_valid_until column already exists in promoters table';
    END IF;
    
    -- Check if notify_days_before_contract_expiry column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'promoters' 
        AND column_name = 'notify_days_before_contract_expiry'
    ) THEN
        -- Add notify_days_before_contract_expiry column
        ALTER TABLE promoters ADD COLUMN notify_days_before_contract_expiry INTEGER DEFAULT 30;
        
        -- Add comment for documentation
        COMMENT ON COLUMN promoters.notify_days_before_contract_expiry IS 'Number of days before contract expiry to notify. Default 30.';
        
        RAISE NOTICE 'Added notify_days_before_contract_expiry column to promoters table';
    ELSE
        RAISE NOTICE 'notify_days_before_contract_expiry column already exists in promoters table';
    END IF;
    
END $$;

-- Verify the schema
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'promoters' 
AND column_name IN ('employer_id', 'outsourced_to_id', 'job_title', 'work_location', 'contract_valid_until', 'notify_days_before_contract_expiry')
ORDER BY column_name;

-- Show all foreign key constraints for promoters table
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'promoters'
ORDER BY kcu.column_name; 