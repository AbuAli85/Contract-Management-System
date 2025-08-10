-- Add nationality field to promoters table
ALTER TABLE promoters ADD COLUMN IF NOT EXISTS nationality TEXT;

-- Add index for nationality field for better query performance
CREATE INDEX IF NOT EXISTS idx_promoters_nationality ON promoters(nationality);

-- Add comment to document the field
COMMENT ON COLUMN promoters.nationality IS 'Nationality of the promoter (e.g., Saudi, American, British, etc.)'; 