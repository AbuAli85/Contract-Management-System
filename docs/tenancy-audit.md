# Tenancy Audit Report (Read-Only)

**Date:** 2025-02-25  
**Scope:** Codebase + Supabase migrations. All tables that represent business data (contracts, promoters, attendance, documents, tasks, targets, approvals, etc.).  
**Constraints:** No code or migration changes; report only.

---

## Summary

- **company_id:** Tenant isolation column; tables with `Y` are scoped by company; `N` may rely on FKs or legacy global access.
- **RLS enabled:** Row Level Security is on when `Y`.
- **Policies present:** At least one RLS policy exists when `Y`.
- **Notes:** Risks or recommended fixes.

---

## Public schema – core tenant & contracts

| Table | Has company_id? | RLS enabled? | Policies present? | Notes |
|-------|-----------------|--------------|------------------|--------|
| companies | N/A (tenant root) | Y | Y | Root entity; no column. |
| contracts | Y | Y | Y | Tenant isolation applied (week1). |
| contract_versions | Y | Y | Y | Tenant isolation applied. |
| contract_approvals | Y | Y | Y | Tenant isolation applied. |
| contract_activity_log | N | Y | Y | Scoped via contract; consider company_id for simpler RLS. |
| contract_activity_logs | N | Y | Y | Same as above. |
| contract_export_logs | N | Y | Y | Scoped via contract. |
| contract_comments | N | Y | Y | Scoped via contract; no company_id. |
| comment_mentions | N | Y | Y | Scoped via comment. |
| contract_presence | N | Y | Y | Scoped via contract. |
| contract_obligations | N | Y | Y | Scoped via contract; no company_id. |
| contract_clauses | N | Y | Y | Scoped via contract. |
| contract_promoter_audit | N | Y | Y | Promoter/contract scoped; no company_id. |

---

## Public schema – promoters & party-related

| Table | Has company_id? | RLS enabled? | Policies present? | Notes |
|-------|-----------------|--------------|------------------|--------|
| promoters | Y | Y | Y | Tenant isolation applied. |
| promoter_documents | Y | Y | Y | Tenant isolation applied. |
| promoter_education | N | Y | Y | Scoped via promoter_id only. |
| promoter_experience | N | Y | Y | Scoped via promoter_id only. |
| promoter_skills | N | Y | Y | Scoped via promoter_id only. |
| promoter_tags | N | Y | Y | Scoped via promoter; no company_id. |
| promoter_suggestions | N | Y | Y | No company_id; consider adding. |
| promoter_notifications | N | Y | Y | Scoped via promoter_id. |
| promoter_cvs | N | Y | Y | Scoped via user/promoter. |
| parties | N | Y | Y | **Risk:** No company_id; tenant isolation via parties is weak. Add company_id and scope RLS. |
| contacts | N | Y | Y | Scoped via party; no company_id. |
| communications | N | Y | Y | Scoped via party. |
| designations | N | Y | Y | Reference data; no company_id (could be global or per-company). |
| tags | N | Y | Y | No company_id; consider per-tenant tags. |

---

## Public schema – approvals, clauses, signatures

| Table | Has company_id? | RLS enabled? | Policies present? | Notes |
|-------|-----------------|--------------|------------------|--------|
| clause_categories | N | Y | Y | No company_id; consider adding for multi-tenant. |
| clauses | N | Y | Y | No company_id. |
| clause_versions | N | Y | Y | No company_id. |
| signature_requests | N | Y | Y | Scoped via contract. |
| signatures | N | Y | Y | Scoped via contract (two signature tables in migrations; ensure one canonical). |
| signed_documents | N | Y | Y | Scoped via contract. |
| approval_workflow_templates | N | Y | Y | No company_id; consider adding. |
| approval_workflow_steps | N | Y | Y | No company_id. |
| approval_actions | N | Y | Y | Scoped via contract_approval. |
| approval_history | N | Y | Y | Scoped via contract. |

---

## Public schema – tasks, targets, compliance, KPI

| Table | Has company_id? | RLS enabled? | Policies present? | Notes |
|-------|-----------------|--------------|------------------|--------|
| tasks | Y | Y | Y | Tenant isolation (week5). |
| task_comments | Y | Y | Y | Week5 task_comments (refs tasks). |
| task_attachments | Y | Y | Y | Tenant isolation. |
| target_definitions | Y | Y | Y | Tenant isolation. |
| target_assignments | Y | Y | Y | Tenant isolation. |
| target_progress_snapshots | Y | Y | Y | Tenant isolation. |
| compliance_rules | Y | Y | Y | Tenant isolation. |
| compliance_alerts | Y | Y | Y | Tenant isolation. |
| kpi_snapshots | Y | Y | Y | Tenant isolation. |

---

## Public schema – workflow engine (week3)

| Table | Has company_id? | RLS enabled? | Policies present? | Notes |
|-------|-----------------|--------------|------------------|--------|
| workflow_definitions | Y | Y | Y | Tenant isolation. |
| workflow_states | N | Y | Y | Scoped via definition_id → company. |
| workflow_transitions | N | Y | Y | Scoped via definition_id → company. |
| workflow_instances | Y | Y | Y | Tenant isolation. |
| workflow_events | Y | Y | Y | Tenant isolation. |

---

## Public schema – workflows (recruitment/offboarding, 20250203)

| Table | Has company_id? | RLS enabled? | Policies present? | Notes |
|-------|-----------------|--------------|------------------|--------|
| workflows | Y | Y | Y | Has company_id. |
| workflow_steps | N | Y | Y | Scoped via workflow_id. |
| workflow_executions | N | Y | Y | Scoped via workflow_id. |
| workflow_step_executions | N | Y | Y | Scoped via execution. |
| workflow_templates | N | Y | Y | Global/system templates; no company_id. |

---

## Public schema – subscriptions & security

| Table | Has company_id? | RLS enabled? | Policies present? | Notes |
|-------|-----------------|--------------|------------------|--------|
| subscription_plans | N | N | N | **Risk:** Global catalog; no RLS. Add RLS + read-only policy if plans are public. |
| company_subscriptions | Y | Y | Y | Tenant isolation. |
| audit_logs | Y | Y | Y | Week7; company-scoped. |
| api_keys | Y | Y | Y | Company-scoped. |
| user_sessions | Y | Y | Y | Company-scoped. |
| company_permissions | Y | Y | Y | Company-scoped. |
| company_members | Y | Y | Y | Referenced in RLS; has company_id. Table creation not in scanned migrations. |

---

## Public schema – user & RBAC

| Table | Has company_id? | RLS enabled? | Policies present? | Notes |
|-------|-----------------|--------------|------------------|--------|
| profiles | N | Y | Y | User profile; active_company in app. |
| user_roles | Y | Y | Y | Core tenant membership. |
| roles | N | Y | Y | Role definitions; no company_id. |
| permissions | N | Y | Y | Permission definitions. |
| role_permissions | N | Y | Y | Role–permission mapping. |
| user_role_assignments | N | Y | Y | May overlap with user_roles; confirm canonical model. |
| users | N | Y | Y | Auth/user table. |
| rbac_roles | N | Y | Y | Service-role only. |
| rbac_permissions | N | Y | Y | Service-role only. |
| rbac_role_permissions | N | Y | Y | Service-role only. |
| rbac_user_role_assignments | N | Y | Y | Service-role only. |
| rbac_audit_logs | N | Y | Y | Service-role only. |
| password_history | N | Y | Y | Per-user. |
| session_reminders | N | Y | Y | Per-user. |

---

## Public schema – recruitment & onboarding

| Table | Has company_id? | RLS enabled? | Policies present? | Notes |
|-------|-----------------|--------------|------------------|--------|
| job_postings | Y | Y | Y | Tenant isolation. |
| candidate_applications | Y | Y | Y | Tenant isolation. |
| interview_schedules | N | Y | Y | Scoped via application → job_posting. |
| offer_letters | N | Y | Y | Scoped via application. |
| onboarding_checklists | Y | Y | Y | Has company_id. |
| onboarding_tasks | N | Y | Y | Scoped via onboarding_checklist. |

---

## Public schema – offboarding

| Table | Has company_id? | RLS enabled? | Policies present? | Notes |
|-------|-----------------|--------------|------------------|--------|
| exit_interviews | Y | Y | Y | Has company_id. |
| document_return_tracking | Y | Y | Y | Has company_id. |
| final_settlements | Y | Y | Y | Has company_id. |
| experience_certificates | Y | Y | Y | Has company_id. |
| offboarding_checklists | Y | Y | Y | Has company_id. |
| offboarding_tasks | Y | Y | Y | Has company_id. |

---

## Public schema – employer/employee & attendance

| Table | Has company_id? | RLS enabled? | Policies present? | Notes |
|-------|-----------------|--------------|------------------|--------|
| employer_employees | Y | Y | Y | company_id added in fix_feature_alignment. |
| employee_permissions | N | Y | Y | Scoped via employer_employee. |
| employee_attendance | N | Y | Y | Scoped via employer_employee. |
| employee_tasks | N | Y | Y | Scoped via employer_employee. |
| employee_targets | N | Y | Y | Scoped via employer_employee. |
| task_comments (employer) | N | Y | Y | Refs employee_tasks (different from week5 tasks). |
| target_progress | N | Y | Y | Refs employee_targets. |
| company_attendance_settings | Y | Y | Y | One per company. |

---

## Public schema – documents & compliance (document management)

| Table | Has company_id? | RLS enabled? | Policies present? | Notes |
|-------|-----------------|--------------|------------------|--------|
| employee_documents | N | Y | Y | Scoped via employer_employee. |
| document_reminders | N | Y | Y | Scoped via document. |
| compliance_requirements | Y | Y | Y | Has company_id. |
| employee_compliance | N | Y | Y | Scoped via employer_employee/requirement. |
| documents | Y (if exists) | — | — | Week1 adds company_id only if table exists; table not created in migrations. |

---

## Public schema – holding groups & assignments

| Table | Has company_id? | RLS enabled? | Policies present? | Notes |
|-------|-----------------|--------------|------------------|--------|
| holding_groups | N | Y | Y | No company_id; consider adding for tenant scope. |
| holding_group_members | Y | Y | Y | Has company_id (and party_id). |
| trademarks | N | Y | Y | parent_company_id only; not tenant-scoping column. |
| client_assignments | N | Y | Y | Scoped via employer_employee/party. |
| assignment_performance | N | Y | Y | Scoped via assignment. |
| assignment_transfers | N | Y | Y | Scoped via assignment. |

---

## Public schema – payroll & letters

| Table | Has company_id? | RLS enabled? | Policies present? | Notes |
|-------|-----------------|--------------|------------------|--------|
| salary_structures | N | Y | Y | Scoped via employer_employee. |
| payroll_runs | Y | Y | Y | Tenant isolation. |
| payroll_entries | N | Y | Y | Scoped via payroll_run. |
| salary_history | N | Y | Y | Scoped via employer_employee. |
| hr_letters | N | Y | Y | Scoped via employer_employee. |
| letter_templates | Y | Y | Y | Has company_id. |

---

## Public schema – work permits

| Table | Has company_id? | RLS enabled? | Policies present? | Notes |
|-------|-----------------|--------------|------------------|--------|
| work_permit_applications | N | Y | Y | Scoped via employer/employee; consider company_id. |
| work_permit_renewals | N | Y | Y | Scoped via application. |
| work_permit_compliance | N | Y | Y | Scoped via application. |

---

## Public schema – alerts, dashboard, metrics, system

| Table | Has company_id? | RLS enabled? | Policies present? | Notes |
|-------|-----------------|--------------|------------------|--------|
| alert_configurations | N | Y | Y | User-scoped; no company_id. |
| scheduled_alerts | N | Y | Y | Scoped via contract. |
| dashboard_layouts | N | Y | Y | User-scoped. |
| widget_configurations | N | Y | Y | Scoped via layout. |
| default_layouts_by_role | N | Y | Y | Global role defaults. |
| shared_layout_access | N | Y | Y | Scoped via layout. |
| metrics_history | N | Y | Y | **Risk:** No company_id; global metrics. Add company_id for tenant reporting. |
| exchange_rates | N | Y | Y | Global reference data. |
| email_queue | N | Y | Y | System; no company_id. |
| system_activity_log | N | Y | Y | System; no company_id. |
| tracking_events | N | Y | Y | No company_id in CREATE; consider for tenant analytics. |
| webhook_logs | N | Y | Y | No company_id; consider adding. |
| products | N | Y | Y | No company_id; consider per-tenant. |
| locations | N | Y | Y | No company_id; consider per-tenant. |

---

## Public schema – services & bookings (00_init / 20250117)

| Table | Has company_id? | RLS enabled? | Policies present? | Notes |
|-------|-----------------|--------------|------------------|--------|
| services | Y | Y | Y | 00_init has company_id. |
| bookings | N | Y | Y | Scoped via service/provider_company_id. |
| booking_events | N | Y | Y | Scoped via booking. |
| notifications | N | Y | Y | User-scoped. |
| provider_services | Y | Y | Y | 20250117; has company_id. |
| service_reviews | N | Y | Y | Scoped via booking/service. |
| provider_availability | N | Y | Y | Scoped via provider. |
| provider_time_blocks | N | Y | Y | Scoped via provider. |
| client_favorites | N | Y | Y | Client-scoped. |
| enhanced_notifications | N | Y | Y | User-scoped. |

---

## HR schema (hr.*)

| Table | Has company_id? | RLS enabled? | Policies present? | Notes |
|-------|-----------------|--------------|------------------|--------|
| hr.departments | N | Y | Y | No company_id; shared or per-tenant unclear. |
| hr.employees | N | Y | Y | No company_id; consider adding. |
| hr.passports | N | Y | Y | Scoped via employee. |
| hr.visas | N | Y | Y | Scoped via employee. |
| hr.employee_documents | N | Y | Y | Scoped via employee. |
| hr.attendance_logs | N | Y | Y | Scoped via employee. |
| hr.leave_requests | N | Y | Y | Scoped via employee. |
| hr.doc_templates | N | Y | Y | No company_id. |
| hr.generated_docs | N | Y | Y | Scoped via employee. |
| hr.user_profiles | N | Y | Y | User-scoped. |
| hr.notifications | N | Y | Y | User-scoped. |

---

## High-level risks and recommendations

1. **parties** – No `company_id`; RLS not tenant-scoped by company. **Add `company_id` and company-scoped RLS.**
2. **subscription_plans** – No RLS. **Add RLS and a read-only policy** if plans are public; otherwise restrict by role.
3. **metrics_history** – No `company_id`; metrics are global. **Add `company_id` and scope RLS** for tenant reporting.
4. **Enterprise CLM (clauses, approval templates, etc.)** – None have `company_id`. **Add `company_id`** to clause_categories, clauses, approval_workflow_templates, and related tables for clear multi-tenant isolation.
5. **designations, products, locations, tags** – No `company_id`. Decide if they are global or per-tenant; if per-tenant, **add `company_id` and RLS**.
6. **work_permit_*, client_assignments, employer_employee children** – Many are scoped only via FKs. Consider **adding `company_id`** to key tables for simpler, consistent RLS and reporting.
7. **documents** – Referenced in week1 for optional `company_id`; table may not exist. If you introduce a generic `documents` table, **create it with `company_id` and RLS** from the start.
8. **company_members** – Has `company_id` and RLS in fix migration; **ensure table is created in a migration** if it is the canonical company-membership table.

---

*End of tenancy audit.*
