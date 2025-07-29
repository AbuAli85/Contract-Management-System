-- Migration: Create communications table for party communications timeline
-- Date: 2025-07-29
-- Description: Create communications table to store party communication history

-- Create communications table
CREATE TABLE IF NOT EXISTS communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('email', 'phone', 'meeting', 'note', 'other')),
    subject TEXT NOT NULL,
    description TEXT,
    communication_time TIMESTAMPTZ NOT NULL,
    participants TEXT[] DEFAULT '{}',
    outcome TEXT,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'received', 'pending', 'failed')),
    attachments JSONB DEFAULT '[]',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_communications_party_id ON communications(party_id);
CREATE INDEX IF NOT EXISTS idx_communications_type ON communications(type);
CREATE INDEX IF NOT EXISTS idx_communications_status ON communications(status);
CREATE INDEX IF NOT EXISTS idx_communications_communication_time ON communications(communication_time);
CREATE INDEX IF NOT EXISTS idx_communications_created_by ON communications(created_by);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_communications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_communications_updated_at ON communications;
CREATE TRIGGER trigger_update_communications_updated_at
    BEFORE UPDATE ON communications
    FOR EACH ROW
    EXECUTE FUNCTION update_communications_updated_at();

-- Enable RLS on communications table
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for communications
DROP POLICY IF EXISTS "Users can view communications for accessible parties" ON communications;
DROP POLICY IF EXISTS "Users can insert communications for accessible parties" ON communications;
DROP POLICY IF EXISTS "Users can update communications for accessible parties" ON communications;
DROP POLICY IF EXISTS "Users can delete communications for accessible parties" ON communications;

-- Allow users to view communications for parties they can access
CREATE POLICY "Users can view communications for accessible parties" ON communications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM parties
            WHERE parties.id = communications.party_id
            AND auth.role() = 'authenticated'
        )
    );

-- Allow users to insert communications for parties they can access
CREATE POLICY "Users can insert communications for accessible parties" ON communications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM parties
            WHERE parties.id = communications.party_id
            AND auth.role() = 'authenticated'
        )
    );

-- Allow users to update communications for parties they can access
CREATE POLICY "Users can update communications for accessible parties" ON communications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM parties
            WHERE parties.id = communications.party_id
            AND auth.role() = 'authenticated'
        )
    );

-- Allow users to delete communications for parties they can access
CREATE POLICY "Users can delete communications for accessible parties" ON communications
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM parties
            WHERE parties.id = communications.party_id
            AND auth.role() = 'authenticated'
        )
    );

-- Create function to get party communications with pagination
CREATE OR REPLACE FUNCTION get_party_communications(
    p_party_id UUID,
    p_offset INTEGER DEFAULT 0,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    party_id UUID,
    type TEXT,
    subject TEXT,
    description TEXT,
    communication_time TIMESTAMPTZ,
    participants TEXT[],
    outcome TEXT,
    status TEXT,
    attachments JSONB,
    created_by UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.party_id,
        c.type,
        c.subject,
        c.description,
        c.communication_time,
        c.participants,
        c.outcome,
        c.status,
        c.attachments,
        c.created_by,
        c.created_at,
        c.updated_at
    FROM communications c
    WHERE c.party_id = p_party_id
    ORDER BY c.communication_time DESC, c.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get party communication statistics
CREATE OR REPLACE FUNCTION get_party_communication_stats(p_party_id UUID)
RETURNS TABLE (
    total_communications BIGINT,
    email_count BIGINT,
    phone_count BIGINT,
    meeting_count BIGINT,
    note_count BIGINT,
    other_count BIGINT,
    sent_count BIGINT,
    received_count BIGINT,
    pending_count BIGINT,
    failed_count BIGINT,
    last_communication TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_communications,
        COUNT(*) FILTER (WHERE type = 'email') as email_count,
        COUNT(*) FILTER (WHERE type = 'phone') as phone_count,
        COUNT(*) FILTER (WHERE type = 'meeting') as meeting_count,
        COUNT(*) FILTER (WHERE type = 'note') as note_count,
        COUNT(*) FILTER (WHERE type = 'other') as other_count,
        COUNT(*) FILTER (WHERE status = 'sent') as sent_count,
        COUNT(*) FILTER (WHERE status = 'received') as received_count,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
        MAX(communication_time) as last_communication
    FROM communications
    WHERE party_id = p_party_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE communications IS 'Party communication history with timeline support';
COMMENT ON COLUMN communications.party_id IS 'References parties(id) - required foreign key';
COMMENT ON COLUMN communications.type IS 'Type of communication: email, phone, meeting, note, other';
COMMENT ON COLUMN communications.status IS 'Status of communication: sent, received, pending, failed';
COMMENT ON COLUMN communications.attachments IS 'JSONB array of attachment objects with file_url and file_name';
COMMENT ON FUNCTION get_party_communications(UUID, INTEGER, INTEGER) IS 'Get paginated communications for a party';
COMMENT ON FUNCTION get_party_communication_stats(UUID) IS 'Get communication statistics for a party';