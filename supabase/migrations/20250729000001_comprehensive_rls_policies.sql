-- Migration: Comprehensive RLS Policies for All Tables
-- Date: 2025-07-29
-- Description: Implement comprehensive Row Level Security policies for all tables

-- Enable RLS on all tables and create comprehensive security policies

-- ============================================================================
-- USERS TABLE RLS POLICIES
-- ============================================================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Managers can view users in their department" ON users;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND
        -- Users can only update certain fields
        (role = OLD.role OR role = 'admin') AND
        (status = OLD.status OR role = 'admin')
    );

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update all users
CREATE POLICY "Admins can update all users" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can delete users
CREATE POLICY "Admins can delete users" ON users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        ) AND
        -- Prevent self-deletion
        auth.uid() != id
    );

-- Managers can view users in their department
CREATE POLICY "Managers can view users in their department" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users manager
            WHERE manager.id = auth.uid() 
            AND manager.role = 'manager'
            AND manager.department = users.department
        )
    );

-- ============================================================================
-- PROFILES TABLE RLS POLICIES
-- ============================================================================

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- PROMOTERS TABLE RLS POLICIES
-- ============================================================================

-- Enable RLS on promoters table
ALTER TABLE promoters ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all promoters" ON promoters;
DROP POLICY IF EXISTS "Users can create promoters" ON promoters;
DROP POLICY IF EXISTS "Users can update promoters" ON promoters;
DROP POLICY IF EXISTS "Users can delete promoters" ON promoters;
DROP POLICY IF EXISTS "Promoters can view own data" ON promoters;

-- Users can view all promoters (for management purposes)
CREATE POLICY "Users can view all promoters" ON promoters
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager', 'user')
        )
    );

-- Users can create promoters
CREATE POLICY "Users can create promoters" ON promoters
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Users can update promoters
CREATE POLICY "Users can update promoters" ON promoters
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Users can delete promoters
CREATE POLICY "Users can delete promoters" ON promoters
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- PROMOTER CV TABLES RLS POLICIES
-- ============================================================================

-- Enable RLS on promoter_skills table
ALTER TABLE promoter_skills ENABLE ROW LEVEL SECURITY;

-- Users can view skills for all promoters
CREATE POLICY "Users can view promoter skills" ON promoter_skills
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager', 'user')
        )
    );

-- Users can manage skills
CREATE POLICY "Users can manage promoter skills" ON promoter_skills
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Enable RLS on promoter_experience table
ALTER TABLE promoter_experience ENABLE ROW LEVEL SECURITY;

-- Users can view experience for all promoters
CREATE POLICY "Users can view promoter experience" ON promoter_experience
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager', 'user')
        )
    );

-- Users can manage experience
CREATE POLICY "Users can manage promoter experience" ON promoter_experience
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Enable RLS on promoter_education table
ALTER TABLE promoter_education ENABLE ROW LEVEL SECURITY;

-- Users can view education for all promoters
CREATE POLICY "Users can view promoter education" ON promoter_education
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager', 'user')
        )
    );

-- Users can manage education
CREATE POLICY "Users can manage promoter education" ON promoter_education
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Enable RLS on promoter_documents table
ALTER TABLE promoter_documents ENABLE ROW LEVEL SECURITY;

-- Users can view documents for all promoters
CREATE POLICY "Users can view promoter documents" ON promoter_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager', 'user')
        )
    );

-- Users can manage documents
CREATE POLICY "Users can manage promoter documents" ON promoter_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- ============================================================================
-- CONTRACTS TABLE RLS POLICIES
-- ============================================================================

-- Enable RLS on contracts table
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all contracts" ON contracts;
DROP POLICY IF EXISTS "Users can create contracts" ON contracts;
DROP POLICY IF EXISTS "Users can update contracts" ON contracts;
DROP POLICY IF EXISTS "Users can delete contracts" ON contracts;
DROP POLICY IF EXISTS "Users can approve contracts" ON contracts;

-- Users can view all contracts
CREATE POLICY "Users can view all contracts" ON contracts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager', 'user')
        )
    );

-- Users can create contracts
CREATE POLICY "Users can create contracts" ON contracts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Users can update contracts
CREATE POLICY "Users can update contracts" ON contracts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Users can delete contracts
CREATE POLICY "Users can delete contracts" ON contracts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Users can approve contracts
CREATE POLICY "Users can approve contracts" ON contracts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- ============================================================================
-- CONTRACT VERSIONS TABLE RLS POLICIES
-- ============================================================================

-- Enable RLS on contract_versions table
ALTER TABLE contract_versions ENABLE ROW LEVEL SECURITY;

-- Users can view contract versions
CREATE POLICY "Users can view contract versions" ON contract_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager', 'user')
        )
    );

-- Users can create contract versions
CREATE POLICY "Users can create contract versions" ON contract_versions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Users can update contract versions
CREATE POLICY "Users can update contract versions" ON contract_versions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Users can delete contract versions
CREATE POLICY "Users can delete contract versions" ON contract_versions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- PARTIES TABLE RLS POLICIES
-- ============================================================================

-- Enable RLS on parties table
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all parties" ON parties;
DROP POLICY IF EXISTS "Users can create parties" ON parties;
DROP POLICY IF EXISTS "Users can update parties" ON parties;
DROP POLICY IF EXISTS "Users can delete parties" ON parties;

-- Users can view all parties
CREATE POLICY "Users can view all parties" ON parties
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager', 'user')
        )
    );

-- Users can create parties
CREATE POLICY "Users can create parties" ON parties
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Users can update parties
CREATE POLICY "Users can update parties" ON parties
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Users can delete parties
CREATE POLICY "Users can delete parties" ON parties
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- CONTACTS TABLE RLS POLICIES
-- ============================================================================

-- Enable RLS on contacts table
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view contacts for accessible parties" ON contacts;
DROP POLICY IF EXISTS "Users can insert contacts for accessible parties" ON contacts;
DROP POLICY IF EXISTS "Users can update contacts for accessible parties" ON contacts;
DROP POLICY IF EXISTS "Users can delete contacts for accessible parties" ON contacts;

-- Users can view contacts for parties they can access
CREATE POLICY "Users can view contacts for accessible parties" ON contacts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager', 'user')
        )
    );

-- Users can create contacts for parties they can access
CREATE POLICY "Users can insert contacts for accessible parties" ON contacts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Users can update contacts for parties they can access
CREATE POLICY "Users can update contacts for accessible parties" ON contacts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Users can delete contacts for parties they can access
CREATE POLICY "Users can delete contacts for accessible parties" ON contacts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- ============================================================================
-- TAGS TABLE RLS POLICIES
-- ============================================================================

-- Enable RLS on tags table
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Users can view all tags
CREATE POLICY "Users can view all tags" ON tags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager', 'user')
        )
    );

-- Users can create tags
CREATE POLICY "Users can create tags" ON tags
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Users can update tags
CREATE POLICY "Users can update tags" ON tags
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Users can delete tags
CREATE POLICY "Users can delete tags" ON tags
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- PROMOTER TAGS TABLE RLS POLICIES
-- ============================================================================

-- Enable RLS on promoter_tags table
ALTER TABLE promoter_tags ENABLE ROW LEVEL SECURITY;

-- Users can view promoter tags
CREATE POLICY "Users can view promoter tags" ON promoter_tags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager', 'user')
        )
    );

-- Users can manage promoter tags
CREATE POLICY "Users can manage promoter tags" ON promoter_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- ============================================================================
-- COMMUNICATIONS TABLE RLS POLICIES
-- ============================================================================

-- Enable RLS on communications table
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;

-- Users can view communications for parties they can access
CREATE POLICY "Users can view communications" ON communications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager', 'user')
        )
    );

-- Users can create communications
CREATE POLICY "Users can create communications" ON communications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Users can update communications
CREATE POLICY "Users can update communications" ON communications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Users can delete communications
CREATE POLICY "Users can delete communications" ON communications
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- SYSTEM TABLES RLS POLICIES
-- ============================================================================

-- Enable RLS on email_queue table
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Only service role can access email queue
CREATE POLICY "Service role can access email queue" ON email_queue
    FOR ALL USING (auth.role() = 'service_role');

-- Enable RLS on system_activity_log table
ALTER TABLE system_activity_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view system activity logs
CREATE POLICY "Admins can view system activity logs" ON system_activity_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Service role can insert system activity logs
CREATE POLICY "Service role can insert system activity logs" ON system_activity_log
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Enable RLS on contract_activity_log table
ALTER TABLE contract_activity_log ENABLE ROW LEVEL SECURITY;

-- Users can view contract activity logs
CREATE POLICY "Users can view contract activity logs" ON contract_activity_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager', 'user')
        )
    );

-- Service role can insert contract activity logs
CREATE POLICY "Service role can insert contract activity logs" ON contract_activity_log
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Enable RLS on contract_export_logs table
ALTER TABLE contract_export_logs ENABLE ROW LEVEL SECURITY;

-- Users can view export logs
CREATE POLICY "Users can view export logs" ON contract_export_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager', 'user')
        )
    );

-- Service role can insert export logs
CREATE POLICY "Service role can insert export logs" ON contract_export_logs
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Enable RLS on signatures table
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;

-- Users can view signatures for contracts they can access
CREATE POLICY "Users can view signatures" ON signatures
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager', 'user')
        )
    );

-- Users can create signatures
CREATE POLICY "Users can create signatures" ON signatures
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Users can update signatures
CREATE POLICY "Users can update signatures" ON signatures
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is manager
CREATE OR REPLACE FUNCTION is_manager(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id AND role = 'manager'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin or manager
CREATE OR REPLACE FUNCTION is_admin_or_manager(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id AND role IN ('admin', 'manager')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access resource
CREATE OR REPLACE FUNCTION can_access_resource(
    resource_owner_id UUID,
    user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Admin can access everything
    IF is_admin(user_id) THEN
        RETURN TRUE;
    END IF;
    
    -- Manager can access resources in their department
    IF is_manager(user_id) THEN
        RETURN EXISTS (
            SELECT 1 FROM users u1, users u2
            WHERE u1.id = user_id
            AND u2.id = resource_owner_id
            AND u1.department = u2.department
        );
    END IF;
    
    -- User can only access their own resources
    RETURN user_id = resource_owner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AUDIT TRIGGERS
-- ============================================================================

-- Function to log RLS policy violations
CREATE OR REPLACE FUNCTION log_rls_violation(
    table_name TEXT,
    operation TEXT,
    user_id UUID DEFAULT auth.uid()
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO system_activity_log (
        action,
        details,
        created_by
    ) VALUES (
        'rls_violation',
        jsonb_build_object(
            'table', table_name,
            'operation', operation,
            'user_id', user_id,
            'timestamp', NOW()
        ),
        'system'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- INDEXES FOR RLS PERFORMANCE
-- ============================================================================

-- Create indexes to improve RLS policy performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_promoters_status ON promoters(status);
CREATE INDEX IF NOT EXISTS idx_parties_status ON parties(status);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Create a view to verify RLS policies are working
CREATE OR REPLACE VIEW rls_policy_verification AS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Create a function to test RLS policies
CREATE OR REPLACE FUNCTION test_rls_policies()
RETURNS TABLE (
    table_name TEXT,
    policy_name TEXT,
    operation TEXT,
    status TEXT
) AS $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT 
            tablename,
            policyname,
            cmd
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        table_name := policy_record.tablename;
        policy_name := policy_record.policyname;
        operation := policy_record.cmd;
        status := 'ACTIVE';
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;