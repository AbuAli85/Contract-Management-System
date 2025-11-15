-- Diagnostic Script: Check promoter_documents table and RLS policies
-- Run this in Supabase SQL Editor to diagnose the 400 error issue

-- ============================================================================
-- 1. CHECK IF TABLE EXISTS
-- ============================================================================
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'promoter_documents'
    ) 
    THEN '✅ Table exists'
    ELSE '❌ Table does NOT exist - Run migration: supabase/migrations/20250203000000_fix_promoter_documents_rls.sql'
  END as table_status;

-- ============================================================================
-- 2. CHECK TABLE STRUCTURE
-- ============================================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'promoter_documents'
ORDER BY ordinal_position;

-- ============================================================================
-- 3. CHECK RLS STATUS
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ RLS is enabled'
    ELSE '⚠️ RLS is NOT enabled'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'promoter_documents';

-- ============================================================================
-- 4. CHECK RLS POLICIES
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'promoter_documents'
ORDER BY policyname;

-- ============================================================================
-- 5. CHECK PERMISSIONS
-- ============================================================================
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public' 
  AND table_name = 'promoter_documents'
ORDER BY grantee, privilege_type;

-- ============================================================================
-- 6. TEST QUERY (if table exists)
-- ============================================================================
-- This will show if you can query the table
-- Replace 'YOUR_PROMOTER_ID' with an actual promoter ID from your database
SELECT 
  COUNT(*) as total_documents,
  COUNT(DISTINCT promoter_id) as promoters_with_documents
FROM public.promoter_documents
LIMIT 1;

-- ============================================================================
-- 7. CHECK FOR SAMPLE DATA
-- ============================================================================
SELECT 
  id,
  promoter_id,
  document_type,
  file_name,
  created_at
FROM public.promoter_documents
ORDER BY created_at DESC
LIMIT 5;

