-- ============================================================================
-- Work Items: lock down INSERT to service role only
-- ============================================================================
-- Some environments may already have a more permissive INSERT policy from
-- earlier migrations. This patch ensures that only the service role can insert
-- into work_items, while tenant members can still SELECT/UPDATE.
-- ============================================================================

DO $$
BEGIN
  -- Drop legacy tenant-insert policy if present
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'work_items'
      AND policyname = 'work_items_insert_tenant'
  ) THEN
    DROP POLICY "work_items_insert_tenant" ON public.work_items;
  END IF;

  -- Create or replace service-role-only INSERT policy
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'work_items'
      AND policyname = 'work_items_insert_service'
  ) THEN
    DROP POLICY "work_items_insert_service" ON public.work_items;
  END IF;

  CREATE POLICY "work_items_insert_service"
    ON public.work_items
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
END $$;

