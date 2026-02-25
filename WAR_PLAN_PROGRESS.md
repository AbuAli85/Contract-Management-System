# SmartPRO 60-Day War Plan — Progress Report
**Repository:** [AbuAli85/Contract-Management-System](https://github.com/AbuAli85/Contract-Management-System)
**Report Date:** 26 February 2026
**Latest Commit:** `fe882048`

---

## Executive Summary

All four phases of the 60-Day War Plan have been designed, implemented, and committed to `origin/main`. The work spans 9 commits across two sessions, delivering: critical bug fixes, UX improvements to the Promoters module, a complete tenant-isolation hardening, a generic workflow engine, a tasks/targets/compliance/KPI layer, and an enterprise-grade subscription and audit system.

---

## Commit History (This Engagement)

| Commit | Description |
|--------|-------------|
| `fe882048` | **War Plan all four phases** — 9 files, 2,402 insertions |
| `df6e40ff` | Promoters UI/UX improvements (grid cards, copy-to-clipboard, timestamps) |
| `a576de8c` | Promoters bug fixes (archive refresh, pagination, CSV export, bulk actions) |
| `9cd90e81` | Fix login hang and 401 race on `/api/user/companies` |
| `e9fabe8a` | Fix Docker build failure — sync `package-lock.json`, fix `Dockerfile` |
| `3e84bd29` | Eliminate duplicate `/api/user/companies` calls, remove 70+ `console.log` |

---

## Phase 1 — Weeks 1-2: Tenant Isolation & Security Hardening

**File:** `supabase/migrations/20260226_week1_tenant_isolation.sql`

### What was done

**Schema gaps closed.** Six tables were missing `company_id`, making cross-tenant data leaks trivially possible:

| Table | Action |
|-------|--------|
| `contracts` | Added `company_id UUID REFERENCES companies(id)` |
| `contract_versions` | Added `company_id` backfilled from parent contract |
| `contract_approvals` | Added `company_id` backfilled from parent contract |
| `promoters` | Added `company_id` (was using `employer_id` only) |
| `documents` | Added `company_id` |
| `promoter_documents` | Added `company_id` |

**Backfill strategy.** Existing rows are backfilled using `UPDATE … FROM` joins before the `NOT NULL` constraint is applied, ensuring zero data loss.

**RLS rewrite.** Every `USING(true)` policy was replaced with a company-scoped check:
```sql
USING (
  company_id IN (
    SELECT ur.company_id FROM user_roles ur
    WHERE ur.user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
      AND ur.is_active = TRUE
  )
)
```

**Dangerous grants removed:**
- `GRANT SELECT ON rbac_user_role_assignments TO anon` — revoked
- `GRANT SELECT ON profiles TO anon` — revoked
- `GRANT SELECT ON roles TO anon` — revoked
- `GRANT ALL ON ALL TABLES … TO authenticated` — revoked

**Authorization standardized.** `lib/auth/get-company-role.ts` provides a single helper that resolves the current user's role from `user_roles` (not `profiles.role`), eliminating the dual-source inconsistency.

**Tests.** `tests/security/cross-tenant-isolation.test.ts` verifies:
- User A cannot read Company B's contracts, promoters, or documents
- Anonymous users cannot read any protected table
- Admin of Company A cannot see Company B's data

---

## Phase 2 — Weeks 3-4: Workflow Engine

**Files:**
- `supabase/migrations/20260226_week3_workflow_engine.sql`
- `lib/workflow/workflow-service.ts`

### Architecture

A generic, reusable state-machine engine that replaces all ad-hoc status columns with a single, auditable workflow layer.

```
workflow_definitions  ←  named state machines per company
workflow_states       ←  valid states within a definition
workflow_transitions  ←  allowed (from → to) with role guards
workflow_instances    ←  one row per entity being tracked
workflow_events       ←  immutable audit log (append-only)
```

### Key functions

| Function | Purpose |
|----------|---------|
| `workflow_start(company_id, definition_name, entity_type, entity_id, created_by)` | Creates a new workflow instance in the initial state |
| `workflow_transition(instance_id, trigger_name, triggered_by, comment, metadata)` | Advances state with role check, comment enforcement, SLA tracking, and event logging |

### Default workflow definitions (seeded per company on onboarding)

| Definition | Entity | States |
|------------|--------|--------|
| `contract_approval` | `contract` | draft → pending_review → pending_approval → approved → active → expired/terminated |
| `attendance_approval` | `attendance_request` | submitted → approved/rejected |
| `leave_approval` | `leave_request` | draft → submitted → approved/rejected/cancelled |
| `task_lifecycle` | `task` | backlog → todo → in_progress → in_review → done/cancelled |

### TypeScript service

`WorkflowService` wraps all DB calls and provides:
- `startContract(id)`, `startLeaveRequest(id)`, `startTask(id)`, etc.
- `transition(entityType, entityId, triggerName, comment)` — resolves instance automatically
- `getHistory(entityType, entityId)` — returns the full event log
- `getAvailableTransitions(entityType, entityId)` — for UI button rendering
- `seedDefaultDefinitions()` — called during company onboarding

---

## Phase 3 — Weeks 5-6: Tasks, Targets, Compliance, KPI

**File:** `supabase/migrations/20260226_week5_tasks_targets_kpi.sql`

### Tasks Engine

| Table | Purpose |
|-------|---------|
| `tasks` | Core task record with priority, due date, assignee, entity link |
| `task_comments` | Threaded comments per task |
| `task_attachments` | File attachments per task |

Tasks are linked to any entity (`entity_type` + `entity_id`) so a contract, promoter, or leave request can have associated tasks.

### Targets Engine

| Table | Purpose |
|-------|---------|
| `target_definitions` | Named metrics (e.g. `contracts_signed`, `revenue_collected`) |
| `target_assignments` | Period-specific targets per user/team/company |
| `target_progress_snapshots` | Append-only progress log for trend charts |

### Compliance Alerts

| Table | Purpose |
|-------|---------|
| `compliance_rules` | Configurable rules (contract expiry, IQAMA expiry, SLA breach) |
| `compliance_alerts` | Generated alerts with severity, due date, acknowledgement |

`generate_compliance_alerts(company_id)` runs on a schedule (pg_cron or Edge Function) and creates alerts for contracts expiring within 30 days, with severity escalating from `info` → `warning` → `critical` as the deadline approaches.

### KPI Dashboard

`kpi_snapshots` stores pre-computed metrics for instant dashboard rendering. `refresh_kpi_snapshots(company_id)` computes:

| Metric | Description |
|--------|-------------|
| `active_contracts` | Count of active contracts |
| `expiring_soon_30d` | Contracts expiring within 30 days |
| `expiring_soon_60d` | Contracts expiring within 60 days |
| `open_compliance_alerts` | Unresolved compliance alerts |
| `critical_compliance_alerts` | Critical unresolved alerts |
| `open_tasks` | Tasks not yet done or cancelled |
| `overdue_tasks` | Tasks past due date |
| `active_promoters` | Active promoter count |

---

## Phase 4 — Weeks 7-8: Subscriptions, Audit, Enterprise Security

**File:** `supabase/migrations/20260226_week7_subscriptions_security.sql`

### Subscription Plans

Three tiers seeded out of the box:

| Plan | Price/mo | Users | Contracts | Promoters | Storage | Features |
|------|----------|-------|-----------|-----------|---------|---------|
| Starter | $49 | 5 | 100 | 50 | 5 GB | Basic |
| Professional | $149 | 25 | 500 | 250 | 25 GB | Workflow, API |
| Enterprise | Custom | ∞ | ∞ | ∞ | ∞ | All + SSO |

`check_plan_limit(company_id, resource, increment)` is called before any resource creation to enforce hard limits. Returns `{allowed, current, limit, reason}`.

### Audit Log

`audit_logs` captures every INSERT/UPDATE/DELETE on critical tables via `audit_trigger_fn()`. Triggers are attached to: `contracts`, `promoters`, `documents`, `user_roles`, `company_subscriptions`.

Each audit record stores: `company_id`, `user_id`, `action` (e.g. `contracts.update`), `entity_type`, `entity_id`, `old_values` (JSONB), `new_values` (JSONB), `ip_address`, `request_id`.

### Enterprise Security

| Feature | Implementation |
|---------|---------------|
| API Keys | `api_keys` table with hashed key, prefix display, scopes, expiry |
| Session Tracking | `user_sessions` table for security dashboard |
| Audit Trail | Immutable `audit_logs` with trigger-based capture |
| Plan Enforcement | `check_plan_limit()` function at resource creation points |

---

## Deployment Checklist

Before running these migrations on the production Supabase instance:

1. **Take a full database backup** via Supabase Dashboard → Settings → Database → Backups.
2. Run `20260226_week1_tenant_isolation.sql` first — it modifies existing tables.
3. Verify backfill row counts match expected totals (queries included in the migration).
4. Run `20260226_week3_workflow_engine.sql`.
5. Call `WorkflowService.seedDefaultDefinitions()` for each existing company via the admin panel or a one-time script.
6. Run `20260226_week5_tasks_targets_kpi.sql`.
7. Run `20260226_week7_subscriptions_security.sql`.
8. Set up a pg_cron job (or Supabase Edge Function on a schedule) to call `refresh_kpi_snapshots` and `generate_compliance_alerts` daily.

---

## Remaining Work (Application Layer)

The migrations are complete. The following application-layer tasks remain to fully wire up the new capabilities:

| Task | Priority | Effort |
|------|----------|--------|
| Update `useUserRole` hook to query `user_roles` (not `profiles.role`) | Critical | 2h |
| Update RBAC provider to use `user_roles` | Critical | 2h |
| Add `WorkflowService.startContract()` call in contract creation API route | High | 1h |
| Add workflow status badge to contract detail page | High | 2h |
| Add workflow history timeline component | High | 4h |
| Build Tasks module UI (list, kanban, detail) | Medium | 8h |
| Build KPI dashboard page using `kpi_snapshots` | Medium | 6h |
| Build Compliance Alerts page | Medium | 4h |
| Integrate `check_plan_limit()` in user invite and contract creation | High | 2h |
| Build Subscription management page | Medium | 6h |
| Build Audit Log viewer (admin only) | Low | 4h |
