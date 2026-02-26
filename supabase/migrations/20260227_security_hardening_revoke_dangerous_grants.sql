-- ============================================================================
-- Security Hardening: Revoke Dangerous Blanket Grants
-- ============================================================================
-- Purpose:
--   - Remove blanket GRANT ALL ON ALL ... for anon/authenticated.
--   - Prefer no blanket privileges for anon.
--   - Provide minimal, read-only blanket privileges for authenticated where
--     appropriate, relying on RLS and per-table GRANTs for writes.
--
-- Notes:
--   - This migration is idempotent: REVOKE/GRANT can be run multiple times safely.
--   - Existing table-specific GRANTs (from earlier migrations) are preserved.
--   - service_role blanket grants from RBAC migrations are left unchanged on
--     purpose, as they are used by backend/service-key flows.
-- ============================================================================

-- ============================================================================
-- 1. Revoke dangerous blanket grants from anon and authenticated
-- ============================================================================

-- Revoke blanket privileges on all tables in public schema
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;

-- Revoke blanket privileges on all sequences in public schema
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;

-- Revoke any blanket function privileges from anon (none are currently granted,
-- but this ensures future blanket function GRANTs to anon are cleaned up).
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- ============================================================================
-- 2. Least-privilege replacement for authenticated
-- ============================================================================
-- We avoid any blanket rights for anon.
-- For authenticated:
--   - Read-only blanket access (SELECT) is acceptable in combination with RLS.
--   - Writes must be granted explicitly per table via prior migrations.
--   - Sequences need USAGE/SELECT so clients can read generated IDs when needed.
-- ============================================================================

-- Minimal, read-only blanket privileges for authenticated
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- (No blanket function EXECUTE is granted here; functions that should be
-- executable by authenticated users must be granted explicitly.)

