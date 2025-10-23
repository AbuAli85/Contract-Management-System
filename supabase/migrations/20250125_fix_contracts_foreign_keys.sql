-- Migration: Fix foreign key constraint violations in contracts table
-- Date: 2025-01-25
-- Description: Fix contracts with invalid foreign key references

-- First, let's see what contracts have invalid foreign keys
-- This will help us understand the scope of the problem

-- Check for contracts with invalid client_id references
SELECT 
    id, 
    contract_number, 
    client_id, 
    employer_id,
    first_party_id,
    second_party_id
FROM contracts 
WHERE client_id IS NOT NULL 
  AND client_id NOT IN (SELECT id FROM parties WHERE id IS NOT NULL);

-- Check for contracts with invalid employer_id references  
SELECT 
    id, 
    contract_number, 
    client_id, 
    employer_id,
    first_party_id,
    second_party_id
FROM contracts 
WHERE employer_id IS NOT NULL 
  AND employer_id NOT IN (SELECT id FROM parties WHERE id IS NOT NULL);

-- Fix contracts with invalid client_id references
UPDATE contracts 
SET client_id = NULL 
WHERE client_id IS NOT NULL 
  AND client_id NOT IN (SELECT id FROM parties WHERE id IS NOT NULL);

-- Fix contracts with invalid employer_id references
UPDATE contracts 
SET employer_id = NULL 
WHERE employer_id IS NOT NULL 
  AND employer_id NOT IN (SELECT id FROM parties WHERE id IS NOT NULL);

-- Fix contracts with invalid first_party_id references
UPDATE contracts 
SET first_party_id = NULL 
WHERE first_party_id IS NOT NULL 
  AND first_party_id NOT IN (SELECT id FROM parties WHERE id IS NOT NULL);

-- Fix contracts with invalid second_party_id references
UPDATE contracts 
SET second_party_id = NULL 
WHERE second_party_id IS NOT NULL 
  AND second_party_id NOT IN (SELECT id FROM parties WHERE id IS NOT NULL);

-- Also check for invalid promoter_id references
UPDATE contracts 
SET promoter_id = NULL 
WHERE promoter_id IS NOT NULL 
  AND promoter_id NOT IN (SELECT id FROM promoters WHERE id IS NOT NULL);

-- Add a comment to document this fix
COMMENT ON TABLE contracts IS 'Stores job assignments and contract details for promoters. Foreign key constraints have been cleaned up.';
