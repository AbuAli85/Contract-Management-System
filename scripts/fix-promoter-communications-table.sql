-- Fix promoter_communications table - Add missing columns and create if not exists
-- Run this in Supabase SQL Editor

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS promoter_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoter_id UUID REFERENCES promoters(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'email',
    subject TEXT,
    description TEXT,
    communication_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    participants JSONB DEFAULT '[]',
    outcome TEXT,
    status TEXT DEFAULT 'completed',
    attachments JSONB DEFAULT '[]',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add type column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'promoter_communications' 
        AND column_name = 'type'
    ) THEN
        -- Check if communication_type exists (might be named differently)
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'promoter_communications' 
            AND column_name = 'communication_type'
        ) THEN
            -- Rename it to type
            ALTER TABLE promoter_communications 
            RENAME COLUMN communication_type TO type;
            RAISE NOTICE 'Renamed communication_type to type';
        ELSE
            -- Add new type column
            ALTER TABLE promoter_communications 
            ADD COLUMN type TEXT NOT NULL DEFAULT 'email';
            RAISE NOTICE 'Added type column';
        END IF;
    ELSE
        RAISE NOTICE 'type column already exists';
    END IF;
END $$;

-- Add communication_time if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'promoter_communications' 
        AND column_name = 'communication_time'
    ) THEN
        -- Check if sent_at exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'promoter_communications' 
            AND column_name = 'sent_at'
        ) THEN
            ALTER TABLE promoter_communications 
            RENAME COLUMN sent_at TO communication_time;
            RAISE NOTICE 'Renamed sent_at to communication_time';
        ELSE
            ALTER TABLE promoter_communications 
            ADD COLUMN communication_time TIMESTAMPTZ NOT NULL DEFAULT NOW();
            RAISE NOTICE 'Added communication_time column';
        END IF;
    ELSE
        RAISE NOTICE 'communication_time column already exists';
    END IF;
END $$;

-- Add other missing columns if needed
DO $$ 
BEGIN
    -- Add created_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'promoter_communications' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE promoter_communications 
        ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added created_at column';
    END IF;

    -- Add updated_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'promoter_communications' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE promoter_communications 
        ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    END IF;

    -- Add subject if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'promoter_communications' 
        AND column_name = 'subject'
    ) THEN
        ALTER TABLE promoter_communications 
        ADD COLUMN subject TEXT;
        RAISE NOTICE 'Added subject column';
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_promoter_communications_promoter_id 
ON promoter_communications(promoter_id);

CREATE INDEX IF NOT EXISTS idx_promoter_communications_type 
ON promoter_communications(type);

CREATE INDEX IF NOT EXISTS idx_promoter_communications_time 
ON promoter_communications(communication_time);

-- Create auto-update trigger for updated_at
CREATE OR REPLACE FUNCTION update_promoter_communications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_promoter_communications_updated_at ON promoter_communications;

CREATE TRIGGER set_promoter_communications_updated_at
    BEFORE UPDATE ON promoter_communications
    FOR EACH ROW
    EXECUTE FUNCTION update_promoter_communications_updated_at();

-- Enable RLS
ALTER TABLE promoter_communications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$ 
BEGIN
    -- Drop existing policies if any
    DROP POLICY IF EXISTS "Users can view promoter communications" ON promoter_communications;
    DROP POLICY IF EXISTS "Users can manage promoter communications" ON promoter_communications;

    -- Create view policy
    CREATE POLICY "Users can view promoter communications" ON promoter_communications
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() AND role IN ('admin', 'manager', 'user')
            )
        );

    -- Create manage policy
    CREATE POLICY "Users can manage promoter communications" ON promoter_communications
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() AND role IN ('admin', 'manager')
            )
        );
END $$;

-- Verify the table structure
SELECT 
    '✅ promoter_communications table fixed!' as status,
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'promoter_communications'
AND column_name IN ('type', 'communication_time', 'subject', 'created_at', 'updated_at')
ORDER BY column_name;

