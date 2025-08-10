-- Test: Approval Workflow Schema
-- Description: Tests the approval workflow schema migration
-- Date: 2024-01-XX
-- Author: System

-- Test 1: Verify tables exist
DO $$
BEGIN
    -- Check if contract_approvals table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'contract_approvals') THEN
        RAISE EXCEPTION 'contract_approvals table does not exist';
    END IF;
    
    -- Check if reviewer_roles table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reviewer_roles') THEN
        RAISE EXCEPTION 'reviewer_roles table does not exist';
    END IF;
    
    -- Check if workflow_config table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'workflow_config') THEN
        RAISE EXCEPTION 'workflow_config table does not exist';
    END IF;
    
    RAISE NOTICE 'All tables exist successfully';
END $$;

-- Test 2: Verify contracts table has new columns
DO $$
BEGIN
    -- Check if approval_status column exists
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'contracts' AND column_name = 'approval_status'
    ) THEN
        RAISE EXCEPTION 'approval_status column does not exist in contracts table';
    END IF;
    
    -- Check if current_reviewer_id column exists
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'contracts' AND column_name = 'current_reviewer_id'
    ) THEN
        RAISE EXCEPTION 'current_reviewer_id column does not exist in contracts table';
    END IF;
    
    RAISE NOTICE 'All new columns exist in contracts table';
END $$;

-- Test 3: Verify functions exist
DO $$
BEGIN
    -- Check if get_next_reviewer function exists
    IF NOT EXISTS (
        SELECT FROM information_schema.routines 
        WHERE routine_name = 'get_next_reviewer'
    ) THEN
        RAISE EXCEPTION 'get_next_reviewer function does not exist';
    END IF;
    
    -- Check if update_contract_approval_status function exists
    IF NOT EXISTS (
        SELECT FROM information_schema.routines 
        WHERE routine_name = 'update_contract_approval_status'
    ) THEN
        RAISE EXCEPTION 'update_contract_approval_status function does not exist';
    END IF;
    
    RAISE NOTICE 'All functions exist successfully';
END $$;

-- Test 4: Verify default workflow configuration
DO $$
DECLARE
    config_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO config_count FROM workflow_config WHERE is_active = true;
    
    IF config_count < 3 THEN
        RAISE EXCEPTION 'Default workflow configuration is incomplete. Found % configurations, expected 3', config_count;
    END IF;
    
    RAISE NOTICE 'Default workflow configuration exists: % configurations found', config_count;
END $$;

-- Test 5: Verify RLS policies
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE tablename IN ('contract_approvals', 'reviewer_roles', 'workflow_config');
    
    IF policy_count < 6 THEN
        RAISE EXCEPTION 'RLS policies are incomplete. Found % policies, expected at least 6', policy_count;
    END IF;
    
    RAISE NOTICE 'RLS policies exist: % policies found', policy_count;
END $$;

-- Test 6: Test workflow functions with sample data
DO $$
DECLARE
    test_user_id UUID;
    test_contract_id UUID;
    next_reviewer UUID;
BEGIN
    -- Create a test user if none exists
    INSERT INTO users (id, email, role, created_at)
    VALUES (gen_random_uuid(), 'test@example.com', 'admin', NOW())
    ON CONFLICT DO NOTHING
    RETURNING id INTO test_user_id;
    
    -- Get existing user if test user wasn't created
    IF test_user_id IS NULL THEN
        SELECT id INTO test_user_id FROM users LIMIT 1;
    END IF;
    
    -- Create a test contract if none exists
    INSERT INTO contracts (id, contract_number, first_party_id, second_party_id, promoter_id, status, created_at)
    VALUES (gen_random_uuid(), 'PAC-23072024-TEST', test_user_id, test_user_id, test_user_id, 'draft', NOW())
    ON CONFLICT DO NOTHING
    RETURNING id INTO test_contract_id;
    
    -- Get existing contract if test contract wasn't created
    IF test_contract_id IS NULL THEN
        SELECT id INTO test_contract_id FROM contracts LIMIT 1;
    END IF;
    
    -- Test get_next_reviewer function
    SELECT get_next_reviewer(test_contract_id, 'draft') INTO next_reviewer;
    
    -- Test update_contract_approval_status function
    PERFORM update_contract_approval_status(test_contract_id, 'legal_review', test_user_id);
    
    RAISE NOTICE 'Workflow functions tested successfully';
END $$;

-- Test 7: Verify indexes exist
DO $$
DECLARE
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO index_count 
    FROM pg_indexes 
    WHERE indexname LIKE 'idx_contract_approvals_%' 
       OR indexname LIKE 'idx_reviewer_roles_%' 
       OR indexname LIKE 'idx_workflow_config_%'
       OR indexname LIKE 'idx_contracts_approval_%';
    
    IF index_count < 8 THEN
        RAISE EXCEPTION 'Indexes are incomplete. Found % indexes, expected at least 8', index_count;
    END IF;
    
    RAISE NOTICE 'All indexes exist: % indexes found', index_count;
END $$;

-- All tests passed
SELECT 'All approval workflow schema tests passed successfully' as test_result; 