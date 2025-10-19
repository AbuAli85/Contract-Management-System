-- Add logo_url field to parties table
-- This migration adds the logo_url field to store party logos

-- Add logo_url column to parties table
ALTER TABLE parties ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN parties.logo_url IS 'URL to the party logo image';

-- Create index for better performance when querying by logo_url
CREATE INDEX IF NOT EXISTS idx_parties_logo_url ON parties(logo_url) WHERE logo_url IS NOT NULL;
