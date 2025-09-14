-- Fix contract_type constraint issue
-- This script resolves the check constraint violation
-- Date: 2025-01-20

-- Step 1: Check what values are currently allowed
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'contracts'::regclass 
AND contype = 'c'
AND conname LIKE '%contract_type%';

-- Step 2: Drop the existing constraint (if it exists)
DO $$ 
BEGIN
    -- Try to drop the constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'contracts'::regclass 
        AND contype = 'c'
        AND conname LIKE '%contract_type%'
    ) THEN
        -- Get the constraint name
        DECLARE
            constraint_name text;
        BEGIN
            SELECT conname INTO constraint_name
            FROM pg_constraint 
            WHERE conrelid = 'contracts'::regclass 
            AND contype = 'c'
            AND conname LIKE '%contract_type%';
            
            EXECUTE 'ALTER TABLE contracts DROP CONSTRAINT ' || quote_ident(constraint_name);
            RAISE NOTICE 'Dropped constraint: %', constraint_name;
        END;
    ELSE
        RAISE NOTICE 'No contract_type constraint found to drop';
    END IF;
END $$;

-- Step 3: Create a new, more flexible constraint
ALTER TABLE contracts 
ADD CONSTRAINT contracts_contract_type_check 
CHECK (contract_type IN (
    'employment',
    'service', 
    'sales',
    'partnership',
    'consulting',
    'maintenance',
    'full-time-permanent',
    'full-time-contract',
    'part-time',
    'freelance',
    'internship',
    'other'
));

-- Step 4: Verify the new constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'contracts'::regclass 
AND contype = 'c'
AND conname LIKE '%contract_type%';

-- Step 5: Test insert with the problematic value
DO $$ 
BEGIN
    -- Try to insert a test record with the problematic contract_type
    INSERT INTO contracts (
        contract_number,
        title,
        contract_type,
        status,
        is_current,
        priority,
        start_date,
        end_date
    ) VALUES (
        'TEST-CONSTRAINT-' || EXTRACT(EPOCH FROM NOW())::TEXT,
        'Test Contract - Constraint Fix',
        'full-time-permanent',
        'draft',
        true,
        'medium',
        '2025-01-20',
        '2026-01-20'
    );
    
    RAISE NOTICE 'Test insert successful - constraint is working!';
    
    -- Clean up the test record
    DELETE FROM contracts WHERE contract_number LIKE 'TEST-CONSTRAINT-%';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test insert failed: %', SQLERRM;
END $$;
