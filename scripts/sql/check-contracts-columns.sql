-- Check for missing columns in contracts table
-- Run this in Supabase SQL Editor

-- Check if the contracts table has the required columns for actions
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'contracts' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check for specific columns that might be missing
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'approved_at') 
        THEN 'approved_at exists' 
        ELSE 'approved_at MISSING' 
    END as approved_at_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'approved_by') 
        THEN 'approved_by exists' 
        ELSE 'approved_by MISSING' 
    END as approved_by_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'rejected_at') 
        THEN 'rejected_at exists' 
        ELSE 'rejected_at MISSING' 
    END as rejected_at_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'rejected_by') 
        THEN 'rejected_by exists' 
        ELSE 'rejected_by MISSING' 
    END as rejected_by_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'rejection_reason') 
        THEN 'rejection_reason exists' 
        ELSE 'rejection_reason MISSING' 
    END as rejection_reason_status;
