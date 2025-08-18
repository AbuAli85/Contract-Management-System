-- Fix column data type mismatches in contracts table
-- This script resolves data type issues that prevent proper data insertion
-- Date: 2025-01-20

-- Step 1: Check current column types
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'contracts' 
AND table_schema = 'public'
AND column_name IN ('promoter_id', 'first_party_id', 'second_party_id', 'client_id', 'employer_id')
ORDER BY column_name;

-- Step 2: Fix promoter_id data type
DO $$ 
BEGIN
    -- Check current data type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'promoter_id'
        AND data_type = 'integer'
        AND table_schema = 'public'
    ) THEN
        -- Change from INTEGER to TEXT
        ALTER TABLE contracts 
        ALTER COLUMN promoter_id TYPE TEXT;
        
        RAISE NOTICE 'Changed promoter_id from INTEGER to TEXT';
    ELSE
        RAISE NOTICE 'promoter_id is already TEXT or different type';
    END IF;
END $$;

-- Step 3: Ensure all party ID columns are TEXT type
DO $$ 
BEGIN
    -- Fix first_party_id if it's not TEXT
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'first_party_id'
        AND data_type != 'text'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE contracts 
        ALTER COLUMN first_party_id TYPE TEXT;
        
        RAISE NOTICE 'Changed first_party_id to TEXT type';
    END IF;
    
    -- Fix second_party_id if it's not TEXT
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'second_party_id'
        AND data_type != 'text'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE contracts 
        ALTER COLUMN second_party_id TYPE TEXT;
        
        RAISE NOTICE 'Changed second_party_id to TEXT type';
    END IF;
    
    -- Fix client_id if it's not TEXT
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'client_id'
        AND data_type != 'text'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE contracts 
        ALTER COLUMN client_id TYPE TEXT;
        
        RAISE NOTICE 'Changed client_id to TEXT type';
    END IF;
    
    -- Fix employer_id if it's not TEXT
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'employer_id'
        AND data_type != 'text'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE contracts 
        ALTER COLUMN employer_id TYPE TEXT;
        
        RAISE NOTICE 'Changed employer_id to TEXT type';
    END IF;
END $$;

-- Step 4: Ensure all party ID columns can accept NULL values
ALTER TABLE contracts 
ALTER COLUMN promoter_id DROP NOT NULL;

ALTER TABLE contracts 
ALTER COLUMN first_party_id DROP NOT NULL;

ALTER TABLE contracts 
ALTER COLUMN second_party_id DROP NOT NULL;

-- Step 5: Verify the fix
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'contracts' 
AND table_schema = 'public'
AND column_name IN ('promoter_id', 'first_party_id', 'second_party_id', 'client_id', 'employer_id')
ORDER BY column_name;

-- Step 6: Test insert with the new data types
DO $$ 
BEGIN
    -- Try to insert a test record to verify the fix
    INSERT INTO contracts (
        contract_number,
        title,
        contract_type,
        status,
        is_current,
        priority,
        start_date,
        end_date,
        first_party_id,
        second_party_id,
        promoter_id
    ) VALUES (
        'TEST-' || EXTRACT(EPOCH FROM NOW())::TEXT,
        'Test Contract - Data Type Fix',
        'employment',
        'draft',
        true,
        'medium',
        '2025-01-20',
        '2026-01-20',
        'test-client-123',
        'test-employer-456',
        'test-promoter-789'
    );
    
    RAISE NOTICE 'Test insert successful - data types are working!';
    
    -- Clean up the test record
    DELETE FROM contracts WHERE contract_number LIKE 'TEST-%';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test insert failed: %', SQLERRM;
END $$;
