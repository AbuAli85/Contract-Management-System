-- Add created_by column to promoters table for user scoping
-- This enables non-admin users to only see promoters they created

-- Step 1: Add the column (allowing NULL initially for existing data)
ALTER TABLE promoters 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Step 2: Create an index for performance
CREATE INDEX IF NOT EXISTS idx_promoters_created_by ON promoters(created_by);

-- Step 3: Set a default for existing rows (optional - set to first admin user)
-- UPDATE promoters 
-- SET created_by = (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)
-- WHERE created_by IS NULL;

-- Step 4: Add RLS policy for user scoping
-- Users can only see promoters they created (unless they're admin)
CREATE POLICY "Users can view their own promoters"
  ON promoters
  FOR SELECT
  USING (
    created_by = auth.uid() 
    OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Step 5: Add policy for creating promoters
CREATE POLICY "Users can create promoters"
  ON promoters
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Step 6: Add policy for updating their own promoters
CREATE POLICY "Users can update their own promoters"
  ON promoters
  FOR UPDATE
  USING (
    created_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Step 7: Add policy for deleting their own promoters
CREATE POLICY "Users can delete their own promoters"
  ON promoters
  FOR DELETE
  USING (
    created_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Verification queries
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'promoters' 
  AND column_name = 'created_by';

SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'promoters';

