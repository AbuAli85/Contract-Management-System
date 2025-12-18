-- ============================================================================
-- Fix Infinite Recursion in company_members RLS Policies
-- Date: 2025-01-31
-- Description: Fixes infinite recursion error (42P17) in company_members RLS
-- ============================================================================

-- Drop all existing policies on company_members to start fresh
DROP POLICY IF EXISTS "Users can view their own company memberships" ON company_members;
DROP POLICY IF EXISTS "Users can view company members" ON company_members;
DROP POLICY IF EXISTS "Company members can view members" ON company_members;
DROP POLICY IF EXISTS "Company admins can manage members" ON company_members;
DROP POLICY IF EXISTS "Company owners can manage members" ON company_members;
DROP POLICY IF EXISTS "Users can insert their own membership" ON company_members;
DROP POLICY IF EXISTS "Users can update their own membership" ON company_members;

-- Enable RLS if not already enabled
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FIXED POLICIES (No Recursion)
-- ============================================================================

-- Policy 1: Users can view their own company memberships
-- Uses direct user_id check - NO recursion
CREATE POLICY "Users can view their own company memberships" ON company_members
    FOR SELECT
    USING (user_id = auth.uid());

-- Policy 2: Users can view other members of companies they belong to
-- Uses companies table to check ownership - NO recursion (removed to prevent recursion)
-- This policy will be recreated using the security definer function below

-- Policy 3: Company owners and admins can insert new members
-- This policy will be recreated using the security definer function below

-- Policy 4: Company owners and admins can update members
-- This policy will be recreated using the security definer function below

-- Policy 5: Company owners and admins can delete members
-- This policy will be recreated using the security definer function below

-- ============================================================================
-- CREATE SECURITY DEFINER FUNCTION FOR SAFE MEMBERSHIP CHECKS
-- ============================================================================

-- Create a security definer function to safely check company membership
-- This function bypasses RLS and can be used in policies to avoid recursion
CREATE OR REPLACE FUNCTION check_company_membership(
    p_company_id UUID,
    p_user_id UUID DEFAULT auth.uid(),
    p_required_role TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role TEXT;
    v_status TEXT;
BEGIN
    -- Check if user owns the company directly
    IF EXISTS (
        SELECT 1 FROM companies c
        WHERE c.id = p_company_id
        AND c.owner_id = p_user_id
    ) THEN
        RETURN TRUE;
    END IF;

    -- Check company_members table (bypasses RLS due to SECURITY DEFINER)
    SELECT role, status INTO v_role, v_status
    FROM company_members
    WHERE company_id = p_company_id
    AND user_id = p_user_id
    LIMIT 1;

    -- If no membership found, return false
    IF v_role IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Check status
    IF v_status != 'active' THEN
        RETURN FALSE;
    END IF;

    -- If role requirement specified, check it
    IF p_required_role IS NOT NULL THEN
        RETURN v_role = p_required_role OR v_role IN ('owner', 'admin');
    END IF;

    RETURN TRUE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_company_membership(UUID, UUID, TEXT) TO authenticated;

-- ============================================================================
-- POLICIES USING SECURITY DEFINER FUNCTION (No Recursion)
-- ============================================================================

-- Policy 2: Users can view other members of companies they belong to
-- Uses security definer function - NO recursion
CREATE POLICY "Users can view company members" ON company_members
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR
        check_company_membership(company_id, auth.uid())
    );

-- Policy 3: Company owners and admins can insert new members
-- Uses security definer function - NO recursion
CREATE POLICY "Company owners and admins can insert members" ON company_members
    FOR INSERT
    WITH CHECK (
        check_company_membership(company_id, auth.uid(), 'admin')
    );

CREATE POLICY "Company owners and admins can update members" ON company_members
    FOR UPDATE
    USING (
        check_company_membership(company_id, auth.uid(), 'admin')
    )
    WITH CHECK (
        check_company_membership(company_id, auth.uid(), 'admin')
    );

CREATE POLICY "Company owners and admins can delete members" ON company_members
    FOR DELETE
    USING (
        check_company_membership(company_id, auth.uid(), 'admin')
    );

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_company_members_company_id ON company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user_id ON company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_status ON company_members(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_company_members_role ON company_members(role);
CREATE INDEX IF NOT EXISTS idx_company_members_company_user ON company_members(company_id, user_id);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify policies are created
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'company_members';
    
    RAISE NOTICE 'Created % policies on company_members table', policy_count;
END;
$$;

