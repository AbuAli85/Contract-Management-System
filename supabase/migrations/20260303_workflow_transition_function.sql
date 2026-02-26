-- ============================================================================
-- Workflow Transition Function for Contracts
-- ============================================================================
-- Function:
--   workflow_transition(
--     p_company_id  UUID,
--     p_entity_type TEXT,
--     p_entity_id   UUID,
--     p_action      TEXT,
--     p_actor       UUID,
--     p_metadata    JSONB DEFAULT '{}'::jsonb
--   )
--
-- Behaviour (contracts only):
--   - Enforces a strict state machine:
--       draft -> submitted -> approved -> generated -> sent -> signed -> archived
--   - Writes a row to workflow_events for every valid transition.
--   - Updates workflow_instances.current_state atomically.
--   - Raises an exception on invalid transitions or missing instances.
--
-- Notes:
--   - Currently supports only entity_type = 'contract'.
--   - Can be extended in future for other entity types if needed.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.workflow_transition(
  p_company_id  UUID,
  p_entity_type TEXT,
  p_entity_id   UUID,
  p_action      TEXT,
  p_actor       UUID,
  p_metadata    JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_instance       public.workflow_instances%ROWTYPE;
  v_previous_state TEXT;
  v_new_state      TEXT;
BEGIN
  -- Currently only contracts are supported
  IF p_entity_type <> 'contract' THEN
    RAISE EXCEPTION 'workflow_transition: unsupported entity_type: %', p_entity_type
      USING HINT = 'Only entity_type=''contract'' is supported at the moment.';
  END IF;

  -- Lock the workflow_instance row for this entity and company
  SELECT *
  INTO v_instance
  FROM public.workflow_instances
  WHERE company_id = p_company_id
    AND entity_type = p_entity_type
    AND entity_id = p_entity_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'workflow_transition: no workflow_instance found for company %, entity_type %, entity_id %',
      p_company_id, p_entity_type, p_entity_id;
  END IF;

  v_previous_state := v_instance.current_state;

  -- Enforce strict contract state transitions
  IF v_previous_state = 'draft' THEN
    v_new_state := 'submitted';
  ELSIF v_previous_state = 'submitted' THEN
    v_new_state := 'approved';
  ELSIF v_previous_state = 'approved' THEN
    v_new_state := 'generated';
  ELSIF v_previous_state = 'generated' THEN
    v_new_state := 'sent';
  ELSIF v_previous_state = 'sent' THEN
    v_new_state := 'signed';
  ELSIF v_previous_state = 'signed' THEN
    v_new_state := 'archived';
  ELSE
    RAISE EXCEPTION
      'workflow_transition: invalid or terminal state for contracts: %',
      v_previous_state
      USING HINT = 'Allowed chain is draft -> submitted -> approved -> generated -> sent -> signed -> archived.';
  END IF;

  -- Write workflow_event for this transition
  INSERT INTO public.workflow_events (
    company_id,
    workflow_instance_id,
    action,
    performed_by,
    previous_state,
    new_state,
    metadata
  )
  VALUES (
    v_instance.company_id,
    v_instance.id,
    p_action,
    p_actor,
    v_previous_state,
    v_new_state,
    COALESCE(p_metadata, '{}'::jsonb)
  );

  -- Update current_state in workflow_instances
  UPDATE public.workflow_instances
  SET current_state = v_new_state
  WHERE id = v_instance.id;

END;
$$;

