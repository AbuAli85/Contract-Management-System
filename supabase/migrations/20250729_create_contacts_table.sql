-- Migration: Create contacts table with foreign key to parties
-- Date: 2025-07-29
-- Description: Create contacts table with proper foreign key relationship to parties

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    mobile TEXT,
    position TEXT,
    department TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contacts_party_id ON contacts(party_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_is_primary ON contacts(is_primary);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_contacts_updated_at ON contacts;
CREATE TRIGGER trigger_update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_contacts_updated_at();

-- Enable RLS on contacts table
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contacts
DROP POLICY IF EXISTS "Users can view contacts for accessible parties" ON contacts;
DROP POLICY IF EXISTS "Users can insert contacts for accessible parties" ON contacts;
DROP POLICY IF EXISTS "Users can update contacts for accessible parties" ON contacts;
DROP POLICY IF EXISTS "Users can delete contacts for accessible parties" ON contacts;

-- Allow users to view contacts for parties they can access
CREATE POLICY "Users can view contacts for accessible parties" ON contacts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM parties
            WHERE parties.id = contacts.party_id
            AND auth.role() = 'authenticated'
        )
    );

-- Allow users to insert contacts for parties they can access
CREATE POLICY "Users can insert contacts for accessible parties" ON contacts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM parties
            WHERE parties.id = contacts.party_id
            AND auth.role() = 'authenticated'
        )
    );

-- Allow users to update contacts for parties they can access
CREATE POLICY "Users can update contacts for accessible parties" ON contacts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM parties
            WHERE parties.id = contacts.party_id
            AND auth.role() = 'authenticated'
        )
    );

-- Allow users to delete contacts for parties they can access
CREATE POLICY "Users can delete contacts for accessible parties" ON contacts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM parties
            WHERE parties.id = contacts.party_id
            AND auth.role() = 'authenticated'
        )
    );

-- Create function to get contacts for a party
CREATE OR REPLACE FUNCTION get_party_contacts(p_party_id UUID)
RETURNS TABLE (
    id UUID,
    party_id UUID,
    name_en TEXT,
    name_ar TEXT,
    email TEXT,
    phone TEXT,
    mobile TEXT,
    position TEXT,
    department TEXT,
    is_primary BOOLEAN,
    notes TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.party_id,
        c.name_en,
        c.name_ar,
        c.email,
        c.phone,
        c.mobile,
        c.position,
        c.department,
        c.is_primary,
        c.notes,
        c.created_at,
        c.updated_at
    FROM contacts c
    WHERE c.party_id = p_party_id
    ORDER BY c.is_primary DESC, c.name_en ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE contacts IS 'Contact information for parties with foreign key relationship';
COMMENT ON COLUMN contacts.party_id IS 'References parties(id) - required foreign key';
COMMENT ON COLUMN contacts.is_primary IS 'Indicates if this is the primary contact for the party';
COMMENT ON FUNCTION get_party_contacts(UUID) IS 'Secure function to get contacts for a specific party';