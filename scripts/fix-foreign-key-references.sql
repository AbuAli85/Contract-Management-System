-- Fix foreign key constraints to point to correct tables
-- This script will update the contracts table foreign keys to reference the right tables

DO $$ 
BEGIN
    -- Drop existing foreign key constraints if they exist
    BEGIN
        ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_client_id_fkey;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop contracts_client_id_fkey: %', SQLERRM;
    END;
    
    BEGIN
        ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_employer_id_fkey;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop contracts_employer_id_fkey: %', SQLERRM;
    END;
    
    BEGIN
        ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_promoter_id_fkey;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop contracts_promoter_id_fkey: %', SQLERRM;
    END;
    
    -- Add correct foreign key constraints
    BEGIN
        ALTER TABLE contracts 
        ADD CONSTRAINT contracts_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES parties(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added contracts_client_id_fkey -> parties(id)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add contracts_client_id_fkey: %', SQLERRM;
    END;
    
    BEGIN
        ALTER TABLE contracts 
        ADD CONSTRAINT contracts_employer_id_fkey 
        FOREIGN KEY (employer_id) REFERENCES parties(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added contracts_employer_id_fkey -> parties(id)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add contracts_employer_id_fkey: %', SQLERRM;
    END;
    
    BEGIN
        ALTER TABLE contracts 
        ADD CONSTRAINT contracts_promoter_id_fkey 
        FOREIGN KEY (promoter_id) REFERENCES promoters(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added contracts_promoter_id_fkey -> promoters(id)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add contracts_promoter_id_fkey: %', SQLERRM;
    END;
    
    -- Also add constraints for the new party ID columns if they don't exist
    BEGIN
        ALTER TABLE contracts 
        ADD CONSTRAINT contracts_first_party_id_fkey 
        FOREIGN KEY (first_party_id) REFERENCES parties(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added contracts_first_party_id_fkey -> parties(id)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add contracts_first_party_id_fkey: %', SQLERRM;
    END;
    
    BEGIN
        ALTER TABLE contracts 
        ADD CONSTRAINT contracts_second_party_id_fkey 
        FOREIGN KEY (second_party_id) REFERENCES parties(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added contracts_second_party_id_fkey -> parties(id)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add contracts_second_party_id_fkey: %', SQLERRM;
    END;
    
END $$;

-- Verify the constraints were added correctly
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'contracts'
    AND tc.table_schema = 'public'
ORDER BY tc.constraint_name;
