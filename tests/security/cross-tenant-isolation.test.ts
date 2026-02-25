/**
 * Cross-Tenant Isolation Tests — Week 1-2 Security Hardening
 *
 * These tests verify that a user from Company A cannot read, write, or delete
 * data belonging to Company B. They run against a real Supabase test instance
 * using two separate authenticated sessions.
 *
 * Run with:
 *   npx jest tests/security/cross-tenant-isolation.test.ts
 *
 * Required environment variables:
 *   SUPABASE_TEST_URL          — Supabase project URL
 *   SUPABASE_TEST_ANON_KEY     — Supabase anon key
 *   TEST_USER_A_EMAIL          — Email of a user in Company A
 *   TEST_USER_A_PASSWORD       — Password of that user
 *   TEST_USER_B_EMAIL          — Email of a user in Company B (different tenant)
 *   TEST_USER_B_PASSWORD       — Password of that user
 *   TEST_COMPANY_A_ID          — UUID of Company A
 *   TEST_COMPANY_B_ID          — UUID of Company B
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeClient(): SupabaseClient {
  const url = process.env.SUPABASE_TEST_URL;
  const key = process.env.SUPABASE_TEST_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      'SUPABASE_TEST_URL and SUPABASE_TEST_ANON_KEY must be set'
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

const COMPANY_A = process.env.TEST_COMPANY_A_ID ?? 'company-a-uuid';
const COMPANY_B = process.env.TEST_COMPANY_B_ID ?? 'company-b-uuid';

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Cross-Tenant Data Isolation', () => {
  let clientA: SupabaseClient;
  let clientB: SupabaseClient;

  beforeAll(async () => {
    clientA = makeClient();
    clientB = makeClient();

    await signIn(
      clientA,
      process.env.TEST_USER_A_EMAIL ?? '',
      process.env.TEST_USER_A_PASSWORD ?? ''
    );
    await signIn(
      clientB,
      process.env.TEST_USER_B_EMAIL ?? '',
      process.env.TEST_USER_B_PASSWORD ?? ''
    );
  });

  afterAll(async () => {
    await clientA.auth.signOut();
    await clientB.auth.signOut();
  });

  // -------------------------------------------------------------------------
  // contracts
  // -------------------------------------------------------------------------

  describe('contracts table', () => {
    it('User A cannot read contracts belonging to Company B', async () => {
      const { data, error } = await clientA
        .from('contracts')
        .select('id, company_id')
        .eq('company_id', COMPANY_B);

      // RLS should return empty array, not an error
      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it('User B cannot read contracts belonging to Company A', async () => {
      const { data, error } = await clientB
        .from('contracts')
        .select('id, company_id')
        .eq('company_id', COMPANY_A);

      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it('User A cannot insert a contract into Company B', async () => {
      const { error } = await clientA.from('contracts').insert({
        company_id: COMPANY_B,
        title: 'Malicious cross-tenant contract',
        status: 'draft',
      });

      // RLS should block this with a policy violation
      expect(error).not.toBeNull();
    });

    it('User A cannot update a contract belonging to Company B', async () => {
      const { error } = await clientA
        .from('contracts')
        .update({ title: 'Tampered' })
        .eq('company_id', COMPANY_B);

      // RLS should return 0 rows updated (not an error, but no effect)
      expect(error).toBeNull();
      // Verify nothing actually changed by reading as User B
      const { data } = await clientB
        .from('contracts')
        .select('title')
        .eq('company_id', COMPANY_B)
        .eq('title', 'Tampered');
      expect(data).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // promoters
  // -------------------------------------------------------------------------

  describe('promoters table', () => {
    it('User A cannot read promoters belonging to Company B', async () => {
      const { data, error } = await clientA
        .from('promoters')
        .select('id, company_id')
        .eq('company_id', COMPANY_B);

      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it('User B cannot read promoters belonging to Company A', async () => {
      const { data, error } = await clientB
        .from('promoters')
        .select('id, company_id')
        .eq('company_id', COMPANY_A);

      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it('User A cannot insert a promoter into Company B', async () => {
      const { error } = await clientA.from('promoters').insert({
        company_id: COMPANY_B,
        name_en: 'Malicious Promoter',
        status: 'active',
      });

      expect(error).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // documents
  // -------------------------------------------------------------------------

  describe('promoter_documents table', () => {
    it('User A cannot read documents belonging to Company B', async () => {
      const { data, error } = await clientA
        .from('promoter_documents')
        .select('id, company_id')
        .eq('company_id', COMPANY_B);

      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it('User A cannot insert a document into Company B', async () => {
      const { error } = await clientA.from('promoter_documents').insert({
        company_id: COMPANY_B,
        document_type: 'passport',
        status: 'pending',
      });

      expect(error).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // contract_versions
  // -------------------------------------------------------------------------

  describe('contract_versions table', () => {
    it('User A cannot read contract versions belonging to Company B', async () => {
      const { data, error } = await clientA
        .from('contract_versions')
        .select('id, company_id')
        .eq('company_id', COMPANY_B);

      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // contract_approvals
  // -------------------------------------------------------------------------

  describe('contract_approvals table', () => {
    it('User A cannot read approvals belonging to Company B', async () => {
      const { data, error } = await clientA
        .from('contract_approvals')
        .select('id, company_id')
        .eq('company_id', COMPANY_B);

      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // user_roles — no cross-tenant role escalation
  // -------------------------------------------------------------------------

  describe('user_roles table', () => {
    it('User A cannot grant themselves a role in Company B', async () => {
      const { data: { user } } = await clientA.auth.getUser();
      const { error } = await clientA.from('user_roles').insert({
        user_id: user?.id,
        company_id: COMPANY_B,
        role: 'admin',
        is_active: true,
      });

      expect(error).not.toBeNull();
    });

    it('User A cannot read role assignments for Company B', async () => {
      const { data, error } = await clientA
        .from('user_roles')
        .select('user_id, role')
        .eq('company_id', COMPANY_B);

      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Unauthenticated access — anon role must be blocked
  // -------------------------------------------------------------------------

  describe('Anonymous access', () => {
    let anonClient: SupabaseClient;

    beforeAll(() => {
      anonClient = makeClient();
      // Do NOT sign in — this is the anon role
    });

    it('Anonymous user cannot read contracts', async () => {
      const { data, error } = await anonClient
        .from('contracts')
        .select('id');

      // Should return empty or error — never actual data
      const hasData = Array.isArray(data) && data.length > 0;
      expect(hasData).toBe(false);
    });

    it('Anonymous user cannot read promoters', async () => {
      const { data } = await anonClient.from('promoters').select('id');
      const hasData = Array.isArray(data) && data.length > 0;
      expect(hasData).toBe(false);
    });

    it('Anonymous user cannot read user_roles', async () => {
      const { data } = await anonClient.from('user_roles').select('user_id, role');
      const hasData = Array.isArray(data) && data.length > 0;
      expect(hasData).toBe(false);
    });

    it('Anonymous user cannot read profiles', async () => {
      const { data } = await anonClient.from('profiles').select('id, email');
      const hasData = Array.isArray(data) && data.length > 0;
      expect(hasData).toBe(false);
    });
  });
});
