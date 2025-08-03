-- Force Refresh Supabase Client Schema Cache
-- This script helps resolve schema cache issues when the database is correct but client cache is stale

-- Step 1: Force a schema refresh by querying the table structure
-- This helps Supabase refresh its internal schema cache
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'promoters' 
ORDER BY ordinal_position;

-- Step 2: Query the table to force cache refresh
SELECT COUNT(*) as total_promoters FROM promoters;

-- Step 3: Test specific columns that might be causing issues
SELECT 
    id,
    name_en,
    name_ar,
    employer_id,
    outsourced_to_id,
    job_title,
    work_location,
    contract_valid_until,
    notify_days_before_contract_expiry
FROM promoters 
LIMIT 1;

-- Step 4: Verify foreign key relationships are working
SELECT 
    p.id,
    p.name_en,
    p.employer_id,
    pt.name as employer_name
FROM promoters p
LEFT JOIN parties pt ON p.employer_id = pt.id
LIMIT 5;

-- Step 5: Check for any schema cache inconsistencies
SELECT 
    'Schema Cache Status' as status,
    COUNT(*) as total_columns,
    COUNT(CASE WHEN column_name = 'employer_id' THEN 1 END) as has_employer_id,
    COUNT(CASE WHEN column_name = 'outsourced_to_id' THEN 1 END) as has_outsourced_to_id,
    COUNT(CASE WHEN column_name = 'job_title' THEN 1 END) as has_job_title,
    COUNT(CASE WHEN column_name = 'work_location' THEN 1 END) as has_work_location,
    COUNT(CASE WHEN column_name = 'contract_valid_until' THEN 1 END) as has_contract_valid_until,
    COUNT(CASE WHEN column_name = 'notify_days_before_contract_expiry' THEN 1 END) as has_notify_days_before_contract_expiry
FROM information_schema.columns 
WHERE table_name = 'promoters';

-- Step 6: Force refresh by accessing all columns
SELECT 
    id,
    name_en,
    name_ar,
    id_card_number,
    id_card_url,
    passport_url,
    employer_id,
    outsourced_to_id,
    job_title,
    work_location,
    status,
    contract_valid_until,
    id_card_expiry_date,
    passport_expiry_date,
    notify_days_before_id_expiry,
    notify_days_before_passport_expiry,
    notify_days_before_contract_expiry,
    notes,
    created_at
FROM promoters 
LIMIT 1; 