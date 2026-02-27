-- ============================================================================
-- Work Items: Enforce single row per entity
-- ============================================================================
-- Aligns Option 1 mirroring with a unique key on:
--   (company_id, entity_type, entity_id)
-- ============================================================================

-- Ensure unique index exists for (company_id, entity_type, entity_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_work_items_company_entity_unique
  ON public.work_items (company_id, entity_type, entity_id);

