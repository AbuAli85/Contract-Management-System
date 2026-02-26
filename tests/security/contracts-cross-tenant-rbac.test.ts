/**
 * Cross-tenant RLS & RBAC test for contracts.
 *
 * Goal: prove that a user from Company A cannot SELECT or UPDATE contracts
 * belonging to Company B (and vice versa), using the real Supabase RLS setup.
 *
 * This test:
 *   - Uses two real users (Company A and Company B) plus a service-role client.
 *   - Seeds one contract row for Company A and one for Company B.
 *   - Verifies cross-tenant read/update attempts fail due to RLS.
 *
 * Run with:
 *   npx jest tests/security/contracts-cross-tenant-rbac.test.ts
 *
 * Required environment variables:
 *   SUPABASE_TEST_URL              — Supabase project URL
 *   SUPABASE_TEST_ANON_KEY         — Supabase anon key
 *   SUPABASE_SERVICE_ROLE_KEY      — Supabase service role key (used only for seeding)
 *   TEST_USER_A_EMAIL              — Email of a user in Company A
 *   TEST_USER_A_PASSWORD           — Password of that user
 *   TEST_USER_B_EMAIL              — Email of a user in Company B
 *   TEST_USER_B_PASSWORD           — Password of that user
 *   TEST_COMPANY_A_ID              — UUID of Company A
 *   TEST_COMPANY_B_ID              — UUID of Company B
 *
 * Assumptions:
 *   - Users A and B already have active roles in their respective companies
 *     (e.g. admin/manager) so they are allowed to manage their own contracts.
 *   - The contracts table uses company_id for tenancy (as per recent migrations).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} must be set`);
  }
  return value;
}

function makeAnonClient(): SupabaseClient {
  const url = requireEnv('SUPABASE_TEST_URL');
  const key = requireEnv('SUPABASE_TEST_ANON_KEY');
  return createClient(url, key);
}

function makeServiceClient(): SupabaseClient {
  const url = requireEnv('SUPABASE_TEST_URL');
  const key = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      'SUPABASE_TEST_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY must be set for seeding'
    );
  }
  return createClient(url, key);
}

async function signIn(
  client: SupabaseClient,
  email: string,
  password: string
): Promise<void> {
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Sign-in failed for ${email}: ${error.message}`);
}

const COMPANY_A = requireEnv('TEST_COMPANY_A_ID');
const COMPANY_B = requireEnv('TEST_COMPANY_B_ID');

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('contracts RLS + role-based write rules (cross-tenant)', () => {
  let admin: SupabaseClient;
  let clientA: SupabaseClient;
  let clientB: SupabaseClient;

  let contractAId: string;
  let contractBId: string;
  let workflowInstanceAId: string;
  let workflowInstanceBId: string;

  beforeAll(async () => {
    jest.setTimeout(60_000);

    admin = makeServiceClient();
    clientA = makeAnonClient();
    clientB = makeAnonClient();

    await signIn(
      clientA,
      requireEnv('TEST_USER_A_EMAIL'),
      requireEnv('TEST_USER_A_PASSWORD')
    );
    await signIn(
      clientB,
      requireEnv('TEST_USER_B_EMAIL'),
      requireEnv('TEST_USER_B_PASSWORD')
    );

    // Seed one contract for Company A and one for Company B using the service client.
    // We only populate fields needed to satisfy constraints.

    const nowSuffix = Date.now().toString();

    // NOTE: promoter_id is required in the base schema; to keep this test minimal
    // and focused on tenancy, we reuse any existing promoter in each company if present.

    const promoterA = await admin
      .from('promoters')
      .select('id')
      .eq('company_id', COMPANY_A)
      .limit(1)
      .maybeSingle();

    const promoterB = await admin
      .from('promoters')
      .select('id')
      .eq('company_id', COMPANY_B)
      .limit(1)
      .maybeSingle();

    if (!promoterA.data || !promoterB.data) {
      throw new Error(
        'Test requires at least one promoter row for each company (A and B)'
      );
    }

    const { data: insertedA, error: insertAError } = await admin
      .from('contracts')
      .insert({
        company_id: COMPANY_A,
        promoter_id: promoterA.data.id,
        contract_number: `TEST-A-${nowSuffix}`,
        title: 'Company A Test Contract',
        contract_type: 'employment',
        status: 'draft',
      })
      .select('id')
      .single();

    if (insertAError) {
      throw new Error(`Failed to seed Company A contract: ${insertAError.message}`);
    }

    const { data: insertedB, error: insertBError } = await admin
      .from('contracts')
      .insert({
        company_id: COMPANY_B,
        promoter_id: promoterB.data.id,
        contract_number: `TEST-B-${nowSuffix}`,
        title: 'Company B Test Contract',
        contract_type: 'employment',
        status: 'draft',
      })
      .select('id')
      .single();

    if (insertBError) {
      throw new Error(`Failed to seed Company B contract: ${insertBError.message}`);
    }

    contractAId = insertedA.id;
    contractBId = insertedB.id;

    // Seed workflow_instances for both contracts with initial state 'draft'
    const { data: instanceA, error: instanceAError } = await admin
      .from('workflow_instances')
      .insert({
        company_id: COMPANY_A,
        entity_type: 'contract',
        entity_id: contractAId,
        current_state: 'draft',
      })
      .select('id')
      .single();

    if (instanceAError) {
      throw new Error(
        `Failed to seed workflow_instance for Company A contract: ${instanceAError.message}`
      );
    }

    workflowInstanceAId = instanceA.id;

    const { data: instanceB, error: instanceBError } = await admin
      .from('workflow_instances')
      .insert({
        company_id: COMPANY_B,
        entity_type: 'contract',
        entity_id: contractBId,
        current_state: 'draft',
      })
      .select('id')
      .single();

    if (instanceBError) {
      throw new Error(
        `Failed to seed workflow_instance for Company B contract: ${instanceBError.message}`
      );
    }

    workflowInstanceBId = instanceB.id;
  });

  afterAll(async () => {
    await clientA.auth.signOut();
    await clientB.auth.signOut();

    // Best-effort cleanup (ignore RLS by using service client)
    if (admin && contractAId) {
      await admin.from('contracts').delete().eq('id', contractAId);
    }
    if (admin && contractBId) {
      await admin.from('contracts').delete().eq('id', contractBId);
    }

    if (admin && workflowInstanceAId) {
      await admin.from('workflow_instances').delete().eq('id', workflowInstanceAId);
    }
    if (admin && workflowInstanceBId) {
      await admin.from('workflow_instances').delete().eq('id', workflowInstanceBId);
    }
  });

  // -------------------------------------------------------------------------
  // Cross-tenant SELECT
  // -------------------------------------------------------------------------

  it('User A cannot SELECT a Company B contract', async () => {
    const { data, error } = await clientA
      .from('contracts')
      .select('id, company_id')
      .eq('id', contractBId);

    // RLS should not error, but must hide the row
    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it('User B cannot SELECT a Company A contract', async () => {
    const { data, error } = await clientB
      .from('contracts')
      .select('id, company_id')
      .eq('id', contractAId);

    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // Cross-tenant UPDATE
  // -------------------------------------------------------------------------

  it('User A cannot UPDATE a Company B contract', async () => {
    const { data, error } = await clientA
      .from('contracts')
      .update({ title: 'Illicit change by A' })
      .eq('id', contractBId)
      .select('id');

    // RLS should not error but should update 0 rows
    expect(error).toBeNull();
    expect(data).toHaveLength(0);

    // Verify the title was not changed by reading as Company B user
    const { data: check } = await clientB
      .from('contracts')
      .select('id, title')
      .eq('id', contractBId)
      .limit(1);

    expect(check?.[0]?.title).toBe('Company B Test Contract');
  });

  it('User B cannot UPDATE a Company A contract', async () => {
    const { data, error } = await clientB
      .from('contracts')
      .update({ title: 'Illicit change by B' })
      .eq('id', contractAId)
      .select('id');

    expect(error).toBeNull();
    expect(data).toHaveLength(0);

    const { data: check } = await clientA
      .from('contracts')
      .select('id, title')
      .eq('id', contractAId)
      .limit(1);

    expect(check?.[0]?.title).toBe('Company A Test Contract');
  });

  // -------------------------------------------------------------------------
  // Workflow transitions
  // -------------------------------------------------------------------------

  describe('workflow_transition for contracts', () => {
    it('allows a valid transition draft -> submitted for Company A', async () => {
      // Call workflow_transition as Company A user
      const { error } = await clientA.rpc('workflow_transition', {
        p_company_id: COMPANY_A,
        p_entity_type: 'contract',
        p_entity_id: contractAId,
        p_action: 'submit',
        p_actor: null,
        p_metadata: { test: 'valid_transition' },
      });

      expect(error).toBeNull();

      // Verify instance state updated
      const { data: instance, error: fetchError } = await clientA
        .from('workflow_instances')
        .select('current_state')
        .eq('id', workflowInstanceAId)
        .single();

      expect(fetchError).toBeNull();
      expect(instance?.current_state).toBe('submitted');

      // Verify an event was recorded
      const { data: events, error: eventsError } = await clientA
        .from('workflow_events')
        .select('previous_state, new_state, action')
        .eq('workflow_instance_id', workflowInstanceAId)
        .order('created_at', { ascending: false })
        .limit(1);

      expect(eventsError).toBeNull();
      expect(events).toHaveLength(1);
      expect(events?.[0]?.previous_state).toBe('draft');
      expect(events?.[0]?.new_state).toBe('submitted');
      expect(events?.[0]?.action).toBe('submit');
    });

    it('blocks an invalid transition from a terminal state for Company A', async () => {
      // Force the instance into a terminal state as admin
      const { error: forceError } = await admin
        .from('workflow_instances')
        .update({ current_state: 'archived' })
        .eq('id', workflowInstanceAId);

      expect(forceError).toBeNull();

      // Attempt another transition; should fail with an error
      const { error } = await clientA.rpc('workflow_transition', {
        p_company_id: COMPANY_A,
        p_entity_type: 'contract',
        p_entity_id: contractAId,
        p_action: 'approve',
        p_actor: null,
        p_metadata: { test: 'invalid_after_archived' },
      });

      expect(error).not.toBeNull();
      expect(error?.message).toContain('invalid or terminal state for contracts');
    });

    it('prevents cross-tenant workflow transitions (Company A user on Company B contract)', async () => {
      // Company A user tries to transition Company B's contract
      const { error } = await clientA.rpc('workflow_transition', {
        p_company_id: COMPANY_B,
        p_entity_type: 'contract',
        p_entity_id: contractBId,
        p_action: 'submit',
        p_actor: null,
        p_metadata: { test: 'cross_tenant' },
      });

      // RLS on workflow_instances should hide the row, causing the function to
      // raise "no workflow_instance found"
      expect(error).not.toBeNull();
      expect(error?.message).toContain('no workflow_instance found');
    });
  });
});

