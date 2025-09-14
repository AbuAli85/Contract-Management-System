-- Comprehensive fix for missing contract table columns
-- This script resolves multiple PGRST204 errors by adding all missing columns
-- Date: 2025-01-20

-- Step 1: Add is_current column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'is_current'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE contracts 
        ADD COLUMN is_current BOOLEAN DEFAULT TRUE;
        
        RAISE NOTICE 'Added is_current column to contracts table';
    ELSE
        RAISE NOTICE 'is_current column already exists in contracts table';
    END IF;
END $$;

-- Step 2: Add notify_days_before_contract_expiry column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'notify_days_before_contract_expiry'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE contracts 
        ADD COLUMN notify_days_before_contract_expiry INTEGER DEFAULT 30;
        
        RAISE NOTICE 'Added notify_days_before_contract_expiry column to contracts table';
    ELSE
        RAISE NOTICE 'notify_days_before_contract_expiry column already exists in contracts table';
    END IF;
END $$;

-- Step 3: Add terms column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'terms'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE contracts 
        ADD COLUMN terms TEXT;
        
        RAISE NOTICE 'Added terms column to contracts table';
    ELSE
        RAISE NOTICE 'terms column already exists in contracts table';
    END IF;
END $$;

-- Step 4: Add value column if it doesn't exist (for contract value)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'value'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE contracts 
        ADD COLUMN value DECIMAL(15,2);
        
        RAISE NOTICE 'Added value column to contracts table';
    ELSE
        RAISE NOTICE 'value column already exists in contracts table';
    END IF;
END $$;

-- Step 5: Add missing columns that might be referenced in the application
DO $$ 
BEGIN
    -- Add total_value if it doesn't exist (alternative to value)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'total_value'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE contracts 
        ADD COLUMN total_value DECIMAL(15,2);
        
        RAISE NOTICE 'Added total_value column to contracts table';
    END IF;
    
    -- Add basic_salary if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'basic_salary'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE contracts 
        ADD COLUMN basic_salary DECIMAL(15,2);
        
        RAISE NOTICE 'Added basic_salary column to contracts table';
    END IF;
    
    -- Add amount if it doesn't exist (alternative to value)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'amount'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE contracts 
        ADD COLUMN amount DECIMAL(15,2);
        
        RAISE NOTICE 'Added amount column to contracts table';
    END IF;
    
    -- Add contract_value if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'contract_value'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE contracts 
        ADD COLUMN contract_value DECIMAL(15,2);
        
        RAISE NOTICE 'Added contract_value column to contracts table';
    END IF;
    
    -- Add payment_terms if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'payment_terms'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE contracts 
        ADD COLUMN payment_terms TEXT;
        
        RAISE NOTICE 'Added payment_terms column to contracts table';
    END IF;
    
    -- Add billing_frequency if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'billing_frequency'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE contracts 
        ADD COLUMN billing_frequency TEXT;
        
        RAISE NOTICE 'Added billing_frequency column to contracts table';
    END IF;
    
    -- Add priority if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'priority'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE contracts 
        ADD COLUMN priority TEXT DEFAULT 'medium';
        
        RAISE NOTICE 'Added priority column to contracts table';
    END IF;
    
    -- Add renewal_terms if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'renewal_terms'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE contracts 
        ADD COLUMN renewal_terms TEXT;
        
        RAISE NOTICE 'Added renewal_terms column to contracts table';
    END IF;
    
    -- Add termination_clause if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'termination_clause'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE contracts 
        ADD COLUMN termination_clause TEXT;
        
        RAISE NOTICE 'Added termination_clause column to contracts table';
    END IF;
    
    -- Add notice_period if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'notice_period'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE contracts 
        ADD COLUMN notice_period INTEGER DEFAULT 30;
        
        RAISE NOTICE 'Added notice_period column to contracts table';
    END IF;
    
    -- Add tags if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'tags'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE contracts 
        ADD COLUMN tags TEXT[];
        
        RAISE NOTICE 'Added tags column to contracts table';
    END IF;
    
    -- Add attachments if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'attachments'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE contracts 
        ADD COLUMN attachments TEXT[];
        
        RAISE NOTICE 'Added attachments column to contracts table';
    END IF;
    
    -- Add notes if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'notes'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE contracts 
        ADD COLUMN notes TEXT;
        
        RAISE NOTICE 'Added notes column to contracts table';
    END IF;
    
    -- Add created_by if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'created_by'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE contracts 
        ADD COLUMN created_by UUID;
        
        RAISE NOTICE 'Added created_by column to contracts table';
    END IF;
    
    -- Add updated_by if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'updated_by'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE contracts 
        ADD COLUMN updated_by UUID;
        
        RAISE NOTICE 'Added updated_by column to contracts table';
    END IF;
END $$;

-- Step 6: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contracts_is_current ON contracts(is_current);
CREATE INDEX IF NOT EXISTS idx_contracts_promoter_id_is_current ON contracts(promoter_id, is_current DESC);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_priority ON contracts(priority);
CREATE INDEX IF NOT EXISTS idx_contracts_start_date ON contracts(start_date);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON contracts(end_date);

-- Step 7: Add comments to the new columns
COMMENT ON COLUMN contracts.is_current IS 'Indicates if this is the current active contract for the promoter';
COMMENT ON COLUMN contracts.notify_days_before_contract_expiry IS 'Number of days before contract expiry to send notifications';
COMMENT ON COLUMN contracts.terms IS 'General terms and conditions of the contract';
COMMENT ON COLUMN contracts.value IS 'Monetary value of the contract';
COMMENT ON COLUMN contracts.priority IS 'Priority level of the contract (low, medium, high, urgent)';
COMMENT ON COLUMN contracts.renewal_terms IS 'Terms for contract renewal';
COMMENT ON COLUMN contracts.termination_clause IS 'Clause describing termination conditions';
COMMENT ON COLUMN contracts.notice_period IS 'Notice period in days for contract termination';
COMMENT ON COLUMN contracts.tags IS 'Array of tags for categorizing contracts';
COMMENT ON COLUMN contracts.attachments IS 'Array of attachment file paths';
COMMENT ON COLUMN contracts.notes IS 'Additional notes about the contract';
COMMENT ON COLUMN contracts.created_by IS 'User ID who created the contract';
COMMENT ON COLUMN contracts.updated_by IS 'User ID who last updated the contract';

-- Step 8: Verify the fix
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'contracts' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 9: Show sample data with new columns
SELECT 
    id,
    contract_number,
    title,
    contract_type,
    status,
    is_current,
    priority,
    start_date,
    end_date
FROM contracts 
LIMIT 5;
