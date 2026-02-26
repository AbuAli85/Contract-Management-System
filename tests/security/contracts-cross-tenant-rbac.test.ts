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
});

