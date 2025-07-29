-- Migration: Add RLS policies to promoter_cvs table
-- Date: 2025-07-29
-- Description: Tighten RLS policies on promoter_cvs table so users can only read/write their own CV

-- Enable RLS on promoter_cvs table
ALTER TABLE promoter_cvs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own CV" ON promoter_cvs;
DROP POLICY IF EXISTS "Users can update own CV" ON promoter_cvs;
DROP POLICY IF EXISTS "Users can insert own CV" ON promoter_cvs;
DROP POLICY IF EXISTS "Users can delete own CV" ON promoter_cvs;
DROP POLICY IF EXISTS "Admins can view all CVs" ON promoter_cvs;
DROP POLICY IF EXISTS "Admins can update all CVs" ON promoter_cvs;
DROP POLICY IF EXISTS "Admins can delete all CVs" ON promoter_cvs;

-- Create policies for users to manage their own CV
CREATE POLICY "Users can view own CV" ON promoter_cvs
    FOR SELECT USING (auth.uid() = promoter_id);

CREATE POLICY "Users can update own CV" ON promoter_cvs
    FOR UPDATE USING (auth.uid() = promoter_id);

CREATE POLICY "Users can insert own CV" ON promoter_cvs
    FOR INSERT WITH CHECK (auth.uid() = promoter_id);

CREATE POLICY "Users can delete own CV" ON promoter_cvs
    FOR DELETE USING (auth.uid() = promoter_id);

-- Optional: Admin policies for system management
-- Uncomment if you want admins to have access to all CVs
/*
CREATE POLICY "Admins can view all CVs" ON promoter_cvs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can update all CVs" ON promoter_cvs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete all CVs" ON promoter_cvs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );
*/

-- Create helper functions for secure CV operations
CREATE OR REPLACE FUNCTION get_own_cv()
RETURNS TABLE (
    id UUID,
    promoter_id UUID,
    cv_data JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pc.id,
        pc.promoter_id,
        pc.cv_data,
        pc.created_at,
        pc.updated_at
    FROM promoter_cvs pc
    WHERE pc.promoter_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_own_cv(cv_data JSONB)
RETURNS UUID AS $$
DECLARE
    cv_id UUID;
BEGIN
    -- Try to update existing CV
    UPDATE promoter_cvs 
    SET 
        cv_data = update_own_cv.cv_data,
        updated_at = NOW()
    WHERE promoter_id = auth.uid()
    RETURNING id INTO cv_id;
    
    -- If no rows were updated, insert new CV
    IF cv_id IS NULL THEN
        INSERT INTO promoter_cvs (promoter_id, cv_data)
        VALUES (auth.uid(), update_own_cv.cv_data)
        RETURNING id INTO cv_id;
    END IF;
    
    RETURN cv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION delete_own_cv()
RETURNS BOOLEAN AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM promoter_cvs 
    WHERE promoter_id = auth.uid();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_promoter_cvs_promoter_id ON promoter_cvs(promoter_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_promoter_cvs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_promoter_cvs_updated_at ON promoter_cvs;
CREATE TRIGGER trigger_update_promoter_cvs_updated_at
    BEFORE UPDATE ON promoter_cvs
    FOR EACH ROW
    EXECUTE FUNCTION update_promoter_cvs_updated_at();

-- Add comments for documentation
COMMENT ON TABLE promoter_cvs IS 'CV data for promoters with RLS enabled';
COMMENT ON COLUMN promoter_cvs.promoter_id IS 'References auth.users(id) - only the owner can access their CV';
COMMENT ON COLUMN promoter_cvs.cv_data IS 'JSONB containing CV information (skills, experience, education, etc.)';
COMMENT ON FUNCTION get_own_cv() IS 'Secure function to get current user''s CV data';
COMMENT ON FUNCTION update_own_cv(JSONB) IS 'Secure function to update current user''s CV data';
COMMENT ON FUNCTION delete_own_cv() IS 'Secure function to delete current user''s CV data';